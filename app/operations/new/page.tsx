'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  CandlestickChart,
  Image as ImageIcon,
  Coins
} from 'lucide-react';
import Image from 'next/image';
import { useUserPreferences } from '@/app/context/UserPreferencesContext';

const STANDARD_TRIGGERS = [
  'Rompimento de Topo/Fundo',
  'Pullback na Média',
  'Cruzamento de Médias',
  'Suporte/Resistência',
  'Volume Climático'
];

function NewOperationForm() {
  const { preferences } = useUserPreferences();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tradeId = searchParams.get('id');
  const isEditMode = !!tradeId;
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [userStrategies, setUserStrategies] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    wallet_id: '',
    asset: '',
    market: 'B3',
    type: 'BUY',
    entry_price: '',
    exit_price: '',
    entry_time: (() => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    })(),
    exit_time: (() => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    })(),
    quantity: '',
    status: 'WIN',
    session: 'None',
    strategy: '',
    trigger_id: '',
    mental_state: 'NEUTRO',
    notes: '',
    fees: '0',
    print_before: '',
    print_after: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id);
      setWallets(walletData || []);

      const { data: triggerData } = await supabase.from('triggers').select('*').eq('user_id', user.id);
      setTriggers(triggerData || []);

      const { data: strategyData } = await supabase.from('strategies').select('*').eq('user_id', user.id);
      setUserStrategies(strategyData || []);

      if (isEditMode && tradeId) {
        const { data: tradeData } = await supabase.from('trades').select('*').eq('id', tradeId).single();
        if (tradeData) {
          // Parse session from notes if exists
          let session = 'None';
          let notes = tradeData.notes || '';
          const sessionMatch = notes.match(/^\[Sessão: (.*?)\]\n/);
          if (sessionMatch) {
            session = sessionMatch[1];
            notes = notes.replace(/^\[Sessão: (.*?)\]\n/, '');
          }

          setFormData({
            wallet_id: tradeData.wallet_id || '',
            asset: tradeData.asset || '',
            market: tradeData.market || 'B3',
            type: tradeData.type || 'BUY',
            entry_price: tradeData.entry_price?.toString() || '',
            exit_price: tradeData.exit_price?.toString() || '',
            entry_time: tradeData.entry_time ? new Date(tradeData.entry_time).toISOString().slice(0, 16) : '',
            exit_time: tradeData.exit_time ? new Date(tradeData.exit_time).toISOString().slice(0, 16) : '',
            quantity: tradeData.quantity?.toString() || '',
            status: tradeData.status || 'WIN',
            session: session,
            strategy: tradeData.strategy || '',
            trigger_id: tradeData.trigger_id || '',
            mental_state: tradeData.mental_state || 'NEUTRO',
            notes: notes,
            fees: tradeData.fees?.toString() || '0',
            print_before: tradeData.print_before || '',
            print_after: tradeData.print_after || ''
          });
        }
      } else if (walletData && walletData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          wallet_id: walletData[0].id,
          strategy: searchParams.get('strategy') || ''
        }));
      }
    };
    fetchData();
  }, [supabase, isEditMode, tradeId, searchParams]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Resolve trigger_id if it's a standard trigger name
    let finalTriggerId = formData.trigger_id;
    if (finalTriggerId && STANDARD_TRIGGERS.includes(finalTriggerId)) {
      const existing = triggers.find(t => t.name === finalTriggerId);
      if (existing) {
        finalTriggerId = existing.id;
      } else {
        // Create the standard trigger in the DB for this user
        const { data: newT, error: tError } = await supabase
          .from('triggers')
          .insert({ user_id: user.id, name: finalTriggerId })
          .select()
          .single();
        
        if (!tError && newT) {
          finalTriggerId = newT.id;
        } else {
          finalTriggerId = ''; // Fallback to null/empty if creation fails
        }
      }
    }

    const entry = parseFloat(formData.entry_price);
    const exit = parseFloat(formData.exit_price);
    const qty = parseFloat(formData.quantity);
    const fees = parseFloat(formData.fees);
    
    const gross_profit = (exit - entry) * qty * (formData.type === 'BUY' ? 1 : -1);
    const net_profit = gross_profit - fees;

    const tradeData = {
      user_id: user.id,
      wallet_id: formData.wallet_id,
      asset: formData.asset.toUpperCase(),
      market: formData.market,
      type: formData.type,
      entry_price: entry,
      exit_price: exit,
      entry_time: formData.entry_time ? new Date(formData.entry_time).toISOString() : null,
      exit_time: formData.exit_time ? new Date(formData.exit_time).toISOString() : null,
      quantity: qty,
      status: formData.status,
      strategy: formData.strategy,
      trigger_id: finalTriggerId || null,
      mental_state: formData.mental_state,
      notes: formData.session !== 'None' ? `[Sessão: ${formData.session}]\n${formData.notes}` : formData.notes,
      fees: fees,
      gross_profit,
      net_profit,
      print_before: formData.print_before,
      print_after: formData.print_after
    };

    let error;
    if (isEditMode && tradeId) {
      const { error: updateError } = await supabase
        .from('trades')
        .update(tradeData)
        .eq('id', tradeId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('trades')
        .insert(tradeData);
      error = insertError;
    }

    if (error) {
      console.error('Error saving trade:', error.message || error);
      alert(`Erro ao salvar operação: ${error.message || 'Erro desconhecido'}`);
    } else {
      router.push('/operations');
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'print_before' | 'print_after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const sentiments = [
    { value: 'NEUTRO', label: 'Neutro', emoji: '😐' },
    { value: 'ANSIOSO', label: 'Ansioso', emoji: '😥' },
    { value: 'CALMO', label: 'Calmo', emoji: '😌' },
    { value: 'CONFIANTE', label: 'Confiante', emoji: '😎' },
    { value: 'CANSADO', label: 'Cansado', emoji: '😴' },
    { value: 'EUFORICO', label: 'Eufórico', emoji: '🤩' },
    { value: 'IRRITADO', label: 'Irritado', emoji: '😠' },
    { value: 'INSEGURO', label: 'Inseguro', emoji: '😟' },
    { value: 'STRESSED', label: 'Stressed', emoji: '😫' },
  ];

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
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">{isEditMode ? 'Editar Operação' : 'Nova Operação'}</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">{isEditMode ? 'Atualize os detalhes da sua operação.' : 'Registre os detalhes da sua entrada no mercado.'}</p>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mercado</label>
                <select 
                  required
                  value={formData.market}
                  onChange={(e) => setFormData({...formData, market: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="B3">B3</option>
                  <option value="FOREX">FOREX</option>
                  <option value="CRYPTO">CRYPTO</option>
                </select>
              </div>
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
            </div>
            
            <div className="grid grid-cols-1 gap-4">
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horário de Entrada</label>
                <input 
                  type="datetime-local" 
                  value={formData.entry_time}
                  onChange={(e) => setFormData({...formData, entry_time: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horário de Saída</label>
                <input 
                  type="datetime-local" 
                  value={formData.exit_time}
                  onChange={(e) => setFormData({...formData, exit_time: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preço de Entrada</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{preferences.currency === 'BRL' ? 'R$' : '$'}</span>
                  <input 
                    required
                    type="number" 
                    step="any"
                    value={formData.entry_price}
                    onChange={(e) => setFormData({...formData, entry_price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preço de Saída</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{preferences.currency === 'BRL' ? 'R$' : '$'}</span>
                  <input 
                    required
                    type="number" 
                    step="any"
                    value={formData.exit_price}
                    onChange={(e) => setFormData({...formData, exit_price: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Taxas</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{preferences.currency === 'BRL' ? 'R$' : '$'}</span>
                  <input 
                    type="number" 
                    step="any"
                    value={formData.fees}
                    onChange={(e) => setFormData({...formData, fees: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Análise & Gatilhos
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sessão</label>
                <select 
                  value={formData.session}
                  onChange={(e) => setFormData({...formData, session: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="None">None</option>
                  <option value="Asia">Asia</option>
                  <option value="London">London</option>
                  <option value="New York">New York</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estratégia</label>
                <select 
                  value={formData.strategy}
                  onChange={(e) => setFormData({...formData, strategy: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="">Selecione uma estratégia...</option>
                  <optgroup label="Estratégias Padrão">
                    <option value="LIQUIDEZ">Liquidez</option>
                    <option value="ORDER BLOCK">Order Block</option>
                    <option value="SMC">ChoCH & SMC</option>
                    <option value="WYCKOFF">Wyckoff</option>
                    <option value="ELLIOTT">Elliott</option>
                  </optgroup>
                  {userStrategies.length > 0 && (
                    <optgroup label="Minhas Estratégias">
                      {userStrategies.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gatilho (Trigger)</label>
                <select 
                  value={formData.trigger_id}
                  onChange={(e) => setFormData({...formData, trigger_id: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="">Selecione um gatilho...</option>
                  <optgroup label="Gatilhos Padrão">
                    {STANDARD_TRIGGERS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </optgroup>
                  {triggers.length > 0 && (
                    <optgroup label="Meus Gatilhos">
                      {triggers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Você também pode gerenciar gatilhos em &apos;Configurações&apos;</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sentimento Dominante</label>
              <div className="grid grid-cols-3 gap-2">
                {sentiments.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setFormData({...formData, mental_state: s.value})}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${
                      formData.mental_state === s.value 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-[#050A15] border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-xl mb-1">{s.emoji}</span>
                    <span className="text-[10px] font-bold">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notas da Operação</label>
              <textarea 
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="O que você viu no gráfico? Qual era seu estado mental?"
                className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prints da Tela (Opcional)</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-slate-600 hover:bg-slate-800/20 transition-all cursor-pointer relative overflow-hidden min-h-[120px]">
                  {formData.print_before ? (
                    <Image 
                      src={formData.print_before} 
                      alt="Print Antes" 
                      fill 
                      className="absolute inset-0 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-center">Antes da Entrada</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'print_before')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-slate-600 hover:bg-slate-800/20 transition-all cursor-pointer relative overflow-hidden min-h-[120px]">
                  {formData.print_after ? (
                    <Image 
                      src={formData.print_after} 
                      alt="Print Depois" 
                      fill 
                      className="absolute inset-0 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-center">Após o Alvo/Stop</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'print_after')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-200 text-[#050A15] py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'SALVANDO...' : (isEditMode ? 'ATUALIZAR OPERAÇÃO' : 'FINALIZAR LANÇAMENTO')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewOperationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>}>
      <NewOperationForm />
    </Suspense>
  );
}
