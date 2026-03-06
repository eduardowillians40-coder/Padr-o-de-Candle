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
import Modal from '@/components/Modal';

export default function WalletsPage() {
  const supabase = createClient();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: '',
    initial_balance: '',
    meta_value: ''
  });

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchWallets = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setWallets(data || []);
      setLoading(false);
    };

    fetchWallets();
  }, [supabase, refresh]);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        name: newWallet.name,
        initial_balance: parseFloat(newWallet.initial_balance),
        meta_value: parseFloat(newWallet.meta_value) || 0
      });

    if (!error) {
      setIsModalOpen(false);
      setNewWallet({ name: '', initial_balance: '', meta_value: '' });
      setRefresh(prev => prev + 1);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta carteira?')) return;
    const { error } = await supabase.from('wallets').delete().eq('id', id);
    if (!error) setRefresh(prev => prev + 1);
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
                <button className="p-2 text-slate-500 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button 
                  onClick={() => handleDeleteWallet(wallet.id)}
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {wallet.meta_value > 0 ? Math.round((wallet.initial_balance / wallet.meta_value) * 100) : 0}% para a meta
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${wallet.meta_value > 0 ? (wallet.initial_balance / wallet.meta_value) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="bg-[#050A15] rounded-xl p-4 border border-slate-800/50">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Saldo Inicial</p>
                <h4 className="text-2xl font-display font-bold text-emerald-500">R$ {wallet.initial_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-[10px] font-bold">
                <span className="text-slate-500 uppercase">Meta</span>
                <span className="text-white">R$ {wallet.meta_value.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nova Carteira"
      >
        <form onSubmit={handleCreateWallet} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome da Carteira</label>
            <input 
              required
              type="text" 
              value={newWallet.name}
              onChange={(e) => setNewWallet({...newWallet, name: e.target.value})}
              placeholder="Ex: B3, Forex, Crypto"
              className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Inicial (R$)</label>
            <input 
              required
              type="number" 
              step="any"
              value={newWallet.initial_balance}
              onChange={(e) => setNewWallet({...newWallet, initial_balance: e.target.value})}
              placeholder="0.00"
              className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meta de Saldo (R$)</label>
            <input 
              type="number" 
              step="any"
              value={newWallet.meta_value}
              onChange={(e) => setNewWallet({...newWallet, meta_value: e.target.value})}
              placeholder="0.00"
              className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
          >
            <Save className="w-4 h-4" />
            CRIAR CARTEIRA
          </button>
        </form>
      </Modal>
    </div>
  );
}
