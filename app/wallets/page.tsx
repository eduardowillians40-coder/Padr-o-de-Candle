'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Lock,
  ArrowUpRight,
  Target,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { useUserPreferences } from '@/app/context/UserPreferencesContext';
import { formatCurrency } from '@/lib/formatCurrency';
import Modal from '@/components/Modal';

export default function WalletsPage() {
  const { preferences } = useUserPreferences();
  const supabase = createClient();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: '',
    initial_balance: '',
    meta_value: '',
    risk_settings: {
      risk_per_trade_percent: '',
      max_trades_per_day: '',
      max_consecutive_losses: '',
      max_losses_per_week: ''
    }
  });

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchWallets = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: walletsData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      const { data: tradesData } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      const walletsWithStats = (walletsData || []).map((wallet: any) => {
        const walletTrades = (tradesData || []).filter((t: any) => t.wallet_id === wallet.id);
        const totalTrades = walletTrades.length;
        const wins = walletTrades.filter((t: any) => t.status === 'WIN').length;
        const losses = walletTrades.filter((t: any) => t.status === 'LOSS').length;
        const be = walletTrades.filter((t: any) => t.status === 'BE').length;
        
        const netProfit = walletTrades.reduce((acc: number, t: any) => acc + (Number(t.net_profit) || 0), 0);
        const fees = walletTrades.reduce((acc: number, t: any) => acc + (Number(t.fees) || 0), 0);
        const grossProfit = walletTrades.reduce((acc: number, t: any) => acc + (Number(t.gross_profit) || 0), 0);
        
        const initialBalance = Number(wallet.initial_balance) || 0;
        const netBalance = initialBalance + netProfit;
        const grossBalance = initialBalance + grossProfit;
        
        const returnPct = initialBalance > 0 ? (netProfit / initialBalance) * 100 : 0;
        
        const metaValue = Number(wallet.meta_value) || 0;
        const progressPct = metaValue > 0 ? (netBalance / metaValue) * 100 : 0;

        return {
          ...wallet,
          stats: {
            totalTrades,
            wins,
            losses,
            be,
            netProfit,
            grossProfit,
            fees,
            netBalance,
            grossBalance,
            returnPct,
            progressPct
          }
        };
      });
      
      setWallets(walletsWithStats);
      setLoading(false);
    };

    fetchWallets();
  }, [supabase, refresh]);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        name: newWallet.name,
        initial_balance: parseFloat(newWallet.initial_balance),
        meta_value: parseFloat(newWallet.meta_value) || 0
      })
      .select();

    if (!error && data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`risk_settings_${data[0].id}`, JSON.stringify(newWallet.risk_settings));
      }
      setIsModalOpen(false);
      setNewWallet({ 
        name: '', 
        initial_balance: '', 
        meta_value: '',
        risk_settings: {
          risk_per_trade_percent: '',
          max_trades_per_day: '',
          max_consecutive_losses: '',
          max_losses_per_week: ''
        }
      });
      setRefresh(prev => prev + 1);
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);

  const handleDeleteWallet = async (id: string) => {
    console.log('Attempting direct deletion for ID:', id);
    const { data, error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir carteira:', error);
      alert(`Erro ao excluir carteira: ${error.message}`);
    } else {
      console.log('Successfully deleted wallet:', id, 'Data:', data);
      setRefresh(prev => prev + 1);
    }
  };

  const handleEditWallet = (wallet: any) => {
    let risk_settings = {
      risk_per_trade_percent: '',
      max_trades_per_day: '',
      max_consecutive_losses: '',
      max_losses_per_week: ''
    };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`risk_settings_${wallet.id}`);
      if (saved) {
        try {
          risk_settings = { ...risk_settings, ...JSON.parse(saved) };
        } catch (e) {}
      }
    }
    setEditingWallet({ ...wallet, risk_settings });
    setIsEditModalOpen(true);
  };

  const handleUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet) return;

    const { error } = await supabase
      .from('wallets')
      .update({
        name: editingWallet.name,
        initial_balance: parseFloat(editingWallet.initial_balance),
        meta_value: parseFloat(editingWallet.meta_value) || 0
      })
      .eq('id', editingWallet.id);

    if (!error) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`risk_settings_${editingWallet.id}`, JSON.stringify(editingWallet.risk_settings));
      }
      setIsEditModalOpen(false);
      setEditingWallet(null);
      setRefresh(prev => prev + 1);
    } else {
      alert('Erro ao atualizar carteira: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Gerencie suas carteiras de trading</h1>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4 flex-1 max-w-2xl">
            {/* Filters hidden for brevity */}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all mt-6"
          >
            <Plus className="w-4 h-4" />
            Nova Carteira
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {wallets.map((wallet) => (
          <motion.div 
            key={wallet.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{wallet.name}</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">{new Date(wallet.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditWallet(wallet)} className="p-2 text-slate-500 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button 
                  onClick={() => { console.log('Delete clicked for wallet:', wallet.id); handleDeleteWallet(wallet.id); }}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {wallet.stats.progressPct.toFixed(1)}% para a meta
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(wallet.stats.progressPct, 100)}%` }} />
                </div>
              </div>

              <div className="bg-[#050A15] rounded-xl p-4 border border-slate-800/50 space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Saldo Líquido (após taxas)</p>
                  <h4 className="text-2xl font-display font-bold text-emerald-500">
                    {formatCurrency(wallet.stats.netBalance, preferences.currency)}
                  </h4>
                </div>
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-400">Saldo Bruto: {formatCurrency(wallet.stats.grossBalance, preferences.currency)}</span>
                  <span className="text-slate-400">Taxas: <span className="text-red-500">{formatCurrency(wallet.stats.fees, preferences.currency)}</span></span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Saldo Inicial</p>
                  <p className="font-bold text-white">{formatCurrency(wallet.initial_balance, preferences.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Retorno</p>
                  <p className={`font-bold ${wallet.stats.returnPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {wallet.stats.returnPct > 0 ? '+' : ''}{wallet.stats.returnPct.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Estatísticas de Operações</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total</p>
                    <p className="font-bold text-white">{wallet.stats.totalTrades}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Win</p>
                    <p className="font-bold text-emerald-500">{wallet.stats.wins}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Loss</p>
                    <p className="font-bold text-red-500">{wallet.stats.losses}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">BE</p>
                    <p className="font-bold text-blue-500">{wallet.stats.be}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 text-[10px] font-bold">
                <span className="text-slate-500 uppercase">Meta</span>
                <span className="text-blue-500">{formatCurrency(wallet.meta_value, preferences.currency)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen || isEditModalOpen} 
        onClose={() => { setIsModalOpen(false); setIsEditModalOpen(false); setEditingWallet(null); }}
        title={isEditModalOpen ? "Editar Carteira" : "Nova Carteira"}
      >
        <form onSubmit={isEditModalOpen ? handleUpdateWallet : handleCreateWallet} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome da Carteira</label>
            <input 
              required
              type="text" 
              value={isEditModalOpen ? editingWallet?.name : newWallet.name}
              onChange={(e) => isEditModalOpen 
                ? setEditingWallet({...editingWallet, name: e.target.value})
                : setNewWallet({...newWallet, name: e.target.value})
              }
              placeholder="Ex: B3, Forex, Crypto"
              className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Inicial ({preferences.currency})</label>
            <input 
              required
              type="number" 
              step="any"
              value={isEditModalOpen ? editingWallet?.initial_balance : newWallet.initial_balance}
              onChange={(e) => isEditModalOpen 
                ? setEditingWallet({...editingWallet, initial_balance: e.target.value})
                : setNewWallet({...newWallet, initial_balance: e.target.value})
              }
              placeholder="0.00"
              className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meta de Saldo ({preferences.currency})</label>
            <input 
              type="number" 
              step="any"
              value={isEditModalOpen ? editingWallet?.meta_value : newWallet.meta_value}
              onChange={(e) => isEditModalOpen 
                ? setEditingWallet({...editingWallet, meta_value: e.target.value})
                : setNewWallet({...newWallet, meta_value: e.target.value})
              }
              placeholder="0.00"
              className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Gestão de Risco (Opcional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">% Capital por Op.</label>
                <input 
                  type="number" 
                  step="any"
                  value={isEditModalOpen ? editingWallet?.risk_settings?.risk_per_trade_percent : newWallet.risk_settings.risk_per_trade_percent}
                  onChange={(e) => isEditModalOpen 
                    ? setEditingWallet({...editingWallet, risk_settings: {...editingWallet.risk_settings, risk_per_trade_percent: e.target.value}})
                    : setNewWallet({...newWallet, risk_settings: {...newWallet.risk_settings, risk_per_trade_percent: e.target.value}})
                  }
                  placeholder="Ex: 1.5"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trades por Dia</label>
                <input 
                  type="number" 
                  value={isEditModalOpen ? editingWallet?.risk_settings?.max_trades_per_day : newWallet.risk_settings.max_trades_per_day}
                  onChange={(e) => isEditModalOpen 
                    ? setEditingWallet({...editingWallet, risk_settings: {...editingWallet.risk_settings, max_trades_per_day: e.target.value}})
                    : setNewWallet({...newWallet, risk_settings: {...newWallet.risk_settings, max_trades_per_day: e.target.value}})
                  }
                  placeholder="Ex: 3"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loss Seguidos p/ Parar</label>
                <input 
                  type="number" 
                  value={isEditModalOpen ? editingWallet?.risk_settings?.max_consecutive_losses : newWallet.risk_settings.max_consecutive_losses}
                  onChange={(e) => isEditModalOpen 
                    ? setEditingWallet({...editingWallet, risk_settings: {...editingWallet.risk_settings, max_consecutive_losses: e.target.value}})
                    : setNewWallet({...newWallet, risk_settings: {...newWallet.risk_settings, max_consecutive_losses: e.target.value}})
                  }
                  placeholder="Ex: 2"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loss Semana p/ Parar</label>
                <input 
                  type="number" 
                  value={isEditModalOpen ? editingWallet?.risk_settings?.max_losses_per_week : newWallet.risk_settings.max_losses_per_week}
                  onChange={(e) => isEditModalOpen 
                    ? setEditingWallet({...editingWallet, risk_settings: {...editingWallet.risk_settings, max_losses_per_week: e.target.value}})
                    : setNewWallet({...newWallet, risk_settings: {...newWallet.risk_settings, max_losses_per_week: e.target.value}})
                  }
                  placeholder="Ex: 5"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
          >
            <Save className="w-4 h-4" />
            {isEditModalOpen ? "ATUALIZAR CARTEIRA" : "CRIAR CARTEIRA"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
