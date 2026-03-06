'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Clock, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Target,
  Brain,
  ChevronDown,
  CandlestickChart
} from 'lucide-react';
import { motion } from 'motion/react';

export default function NewOperationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    wallet_id: '',
    asset: '',
    type: 'BUY',
    entry_price: '',
    exit_price: '',
    quantity: '',
    status: 'WIN',
    strategy: '',
    trigger_id: '',
    mental_state: 'FOCUSED',
    notes: '',
    fees: '0'
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id);
      setWallets(walletData || []);
      if (walletData && walletData.length > 0) {
        setFormData(prev => ({ ...prev, wallet_id: walletData[0].id }));
      }

      const { data: triggerData } = await supabase.from('triggers').select('*').eq('user_id', user.id);
      setTriggers(triggerData || []);
    };
    fetchData();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const entry = parseFloat(formData.entry_price);
    const exit = parseFloat(formData.exit_price);
    const qty = parseFloat(formData.quantity);
    const fees = parseFloat(formData.fees);
    
    const gross_profit = (exit - entry) * qty * (formData.type === 'BUY' ? 1 : -1);
    const net_profit = gross_profit - fees;

    const { error } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        wallet_id: formData.wallet_id,
        asset: formData.asset.toUpperCase(),
        type: formData.type,
        entry_price: entry,
        exit_price: exit,
        quantity: qty,
        status: formData.status,
        strategy: formData.strategy,
        trigger_id: formData.trigger_id || null,
        mental_state: formData.mental_state,
        notes: formData.notes,
        fees: fees,
        gross_profit,
        net_profit
      });

    if (error) {
      console.error('Error saving trade:', error);
      alert('Erro ao salvar operação');
    } else {
      router.push('/operations');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 text-slate-500 hover:text-white transition-all rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Nova Operação</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Registre os detalhes da sua entrada no mercado.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'SALVANDO...' : 'SALVAR OPERAÇÃO'}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4" />
              Dados do Ativo
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Carteira</label>
                <select 
                  required
                  value={formData.wallet_id}
                  onChange={(e) => setFormData({...formData, wallet_id: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="">Selecionar...</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ativo</label>
                <input 
                  required
                  type="text" 
                  value={formData.asset}
                  onChange={(e) => setFormData({...formData, asset: e.target.value})}
                  placeholder="Ex: WINJ24, EURUSD"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'BUY'})}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${formData.type === 'BUY' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-500' : 'bg-[#050A15] border-slate-800 text-slate-500'}`}
                  >
                    COMPRA
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'SELL'})}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${formData.type === 'SELL' ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-[#050A15] border-slate-800 text-slate-500'}`}
                  >
                    VENDA
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantidade</label>
                <input 
                  required
                  type="number" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="0"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Execução
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preço de Entrada</label>
                <input 
                  required
                  type="number" 
                  step="any"
                  value={formData.entry_price}
                  onChange={(e) => setFormData({...formData, entry_price: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preço de Saída</label>
                <input 
                  required
                  type="number" 
                  step="any"
                  value={formData.exit_price}
                  onChange={(e) => setFormData({...formData, exit_price: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BE">BREAK EVEN</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Taxas (R$)</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.fees}
                  onChange={(e) => setFormData({...formData, fees: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Psicologia e Estratégia
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estratégia Utilizada</label>
              <input 
                type="text" 
                value={formData.strategy}
                onChange={(e) => setFormData({...formData, strategy: e.target.value})}
                placeholder="Ex: SMC, Order Block, Liquidez"
                className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gatilho (Trigger)</label>
              <select 
                value={formData.trigger_id}
                onChange={(e) => setFormData({...formData, trigger_id: e.target.value})}
                className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
              >
                <option value="">Nenhum</option>
                {triggers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado Mental</label>
              <select 
                value={formData.mental_state}
                onChange={(e) => setFormData({...formData, mental_state: e.target.value})}
                className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
              >
                <option value="FOCUSED">FOCADO</option>
                <option value="ANXIOUS">ANSIOSO</option>
                <option value="TIRED">CANSADO</option>
                <option value="EUPHORIC">EUFÓRICO</option>
                <option value="DISCIPLINED">DISCIPLINADO</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notas e Observações</label>
              <textarea 
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Descreva o que aconteceu durante a operação..."
                className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
