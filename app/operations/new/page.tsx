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

const MARKET_ASSETS: Record<string, string[]> = {
  FOREX: [
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'EURBRL', 'USDCAD', 'USDBRL', 'USDCHF', 'NZDUSD', 'EURJPY', 'EURGBP', 'CADJPY', 'XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL', 'US30', 'NAS100'
  ],
  CRYPTO: [
    'BTCUSD', 'ETHUSD', 'USDTUSD', 'BNBUSD', 'XRPUSD', 'USDCUSD', 'SOLUSD', 'TRXUSD', 'DOGEUSD', 'ADAUSD'
  ],
  B3: [
    'WIN', 'WDO', 'IBOV', 'PETR4', 'VALE3', 'ITUB4', 'BBDC4'
  ]
};

const ASSET_CONFIG: Record<string, { size: number }> = {
  // FOREX (100000)
  EURUSD: { size: 100000 }, GBPUSD: { size: 100000 }, USDJPY: { size: 100000 },
  AUDUSD: { size: 100000 }, USDCAD: { size: 100000 }, USDCHF: { size: 100000 },
  NZDUSD: { size: 100000 }, EURGBP: { size: 100000 }, EURJPY: { size: 100000 },
  GBPJPY: { size: 100000 }, AUDJPY: { size: 100000 }, CADJPY: { size: 100000 },
  CHFJPY: { size: 100000 }, NZDJPY: { size: 100000 }, EURBRL: { size: 100000 },
  USDBRL: { size: 100000 },
  // METALS
  XAUUSD: { size: 100 }, XAGUSD: { size: 5000 }, XPTUSD: { size: 50 }, XPDUSD: { size: 100 },
  // CRYPTO
  BTCUSD: { size: 1 }, ETHUSD: { size: 1 }, BNBUSD: { size: 1 }, SOLUSD: { size: 1 },
  XRPUSD: { size: 1 }, DOGEUSD: { size: 1 }, ADAUSD: { size: 1 }, USDTUSD: { size: 1 },
  USDCUSD: { size: 1 }, TRXUSD: { size: 1 },
  // INDICES
  US30: { size: 1 }, NAS100: { size: 1 }, SPX500: { size: 1 }, GER40: { size: 1 },
  // OIL
  USOIL: { size: 1000 }, UKOIL: { size: 1000 },
  // B3
  WIN: { size: 0.2 }, WDO: { size: 10 },
};

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
  const [riskSettings, setRiskSettings] = useState<any>(null);
  const [walletStats, setWalletStats] = useState<any>({ tradesToday: 0, consecutiveLosses: 0, weeklyLosses: 0, currentBalance: 0 });
  
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
    sleep_hours: '',
    multiplier: '1',
    contract_size: '1',
    stop_loss: '',
    take_profit: '',
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
          let notes = tradeData.notes || '';
          
          // Helper to extract and remove tags from notes
          const extractTag = (regex: RegExp) => {
            const match = notes.match(regex);
            if (match) {
              notes = notes.replace(regex, '');
              return match[1];
            }
            return null;
          };

          const session = extractTag(/\[Sessão: (.*?)\]\n?/) || 'None';
          const multiplier = extractTag(/\[Multiplicador: (.*?)\]\n?/) || '1';
          const sleepHours = extractTag(/\[Sono: (.*?)h\]\n?/) || '';
          const contractSize = extractTag(/\[Contract Size: (.*?)\]\n?/) || '1';
          const stopLoss = extractTag(/\[SL: (.*?)\]\n?/) || '';
          const takeProfit = extractTag(/\[TP: (.*?)\]\n?/) || '';
          
          // Clean up any remaining management tags if needed
          notes = notes.replace(/\[Gestão de Risco:.*?\]\n?/, '');

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
            notes: notes.trim(),
            fees: tradeData.fees?.toString() || '0',
            sleep_hours: sleepHours,
            multiplier: multiplier,
            contract_size: contractSize,
            stop_loss: stopLoss,
            take_profit: takeProfit,
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

  useEffect(() => {
    if (formData.wallet_id) {
      const fetchStats = async () => {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(`risk_settings_${formData.wallet_id}`);
          if (saved) {
            try {
              setRiskSettings(JSON.parse(saved));
            } catch (e) {
              setRiskSettings(null);
            }
          } else {
            setRiskSettings(null);
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfWeekIso = startOfWeek.toISOString();

        const { data: trades } = await supabase
          .from('trades')
          .select('status, created_at, net_profit')
          .eq('wallet_id', formData.wallet_id)
          .order('created_at', { ascending: false });

        if (trades) {
          const todayTrades = trades.filter((t: any) => t.created_at >= startOfDay);
          const tradesTodayCount = todayTrades.length;
          
          let consecutiveLosses = 0;
          for (const t of trades) {
            if (t.status === 'LOSS') consecutiveLosses++;
            else if (t.status === 'WIN' || t.status === 'BE') break;
          }

          const weeklyLosses = trades.filter((t: any) => t.created_at >= startOfWeekIso && t.status === 'LOSS').length;

          const selectedWallet = wallets.find(w => w.id === formData.wallet_id);
          const initialBalance = Number(selectedWallet?.initial_balance) || 0;
          const netProfit = trades.reduce((acc: number, t: any) => acc + (Number(t.net_profit) || 0), 0);
          const currentBalance = initialBalance + netProfit;

          setWalletStats({
            tradesToday: tradesTodayCount,
            consecutiveLosses,
            weeklyLosses,
            currentBalance
          });
        }
      };
      fetchStats();
    } else {
      Promise.resolve().then(() => {
        setRiskSettings(null);
        setWalletStats({ tradesToday: 0, consecutiveLosses: 0, weeklyLosses: 0, currentBalance: 0 });
      });
    }
  }, [formData.wallet_id, supabase, wallets]);

  const parseNumber = (val: string) => {
    if (!val) return 0;
    const parsed = parseFloat(val.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  const estimatedProfit = (() => {
    const entry = parseNumber(formData.entry_price);
    const exit = parseNumber(formData.exit_price);
    const qty = parseNumber(formData.quantity);
    const fees = parseNumber(formData.fees);
    const multiplier = parseNumber(formData.multiplier) || 1;
    const contractSize = parseNumber(formData.contract_size) || 1;
    
    if (!entry || !exit || !qty) return 0;
    
    const gross = (exit - entry) * contractSize * qty * multiplier * (formData.type === 'BUY' ? 1 : -1);
    return gross - fees;
  })();

  const derivedStatus = (() => {
    if (estimatedProfit > 0) return 'WIN';
    if (estimatedProfit < 0) return 'LOSS';
    if (parseNumber(formData.entry_price) > 0 && parseNumber(formData.exit_price) > 0) return 'BE';
    return formData.status || 'WIN';
  })();

  const riskReward = (() => {
    const entry = parseNumber(formData.entry_price);
    const sl = parseNumber(formData.stop_loss);
    const tp = parseNumber(formData.take_profit);
    const qty = parseNumber(formData.quantity);
    const contractSize = parseNumber(formData.contract_size) || 1;
    const multiplier = parseNumber(formData.multiplier) || 1;

    if (!entry || !qty) return { risk: 0, reward: 0, ratio: 0 };

    const risk = sl ? Math.abs(entry - sl) * contractSize * qty * multiplier : 0;
    const reward = tp ? Math.abs(tp - entry) * contractSize * qty * multiplier : 0;
    const ratio = risk > 0 ? reward / risk : 0;

    return { risk, reward, ratio };
  })();

  const riskAlert = (() => {
    if (riskReward.risk <= 0) return null;
    const selectedWallet = wallets.find(w => w.id === formData.wallet_id);
    const balance = selectedWallet?.balance || 0;
    if (balance <= 0) return null;

    const riskPercent = (riskReward.risk / balance) * 100;
    const limit = riskSettings?.risk_per_trade_percent ? parseFloat(riskSettings.risk_per_trade_percent) : 1;

    if (riskPercent > limit) {
      return {
        percent: riskPercent,
        limit: limit,
        message: `ALERTA: O risco planejado (${riskPercent.toFixed(2)}%) excede o limite de ${limit}%!`
      };
    }
    return null;
  })();

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

    const parseNumber = (val: string) => {
      if (!val) return 0;
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    };

    const entry = parseNumber(formData.entry_price);
    const exit = parseNumber(formData.exit_price);
    const qty = parseNumber(formData.quantity);
    const fees = parseNumber(formData.fees);
    const multiplier = parseNumber(formData.multiplier) || 1;
    const contractSize = parseNumber(formData.contract_size) || 1;
    
    // Universal Formula: (exit - entry) * contract_size * lot * direction * multiplier
    const gross_profit = (exit - entry) * contractSize * qty * multiplier * (formData.type === 'BUY' ? 1 : -1);
    const net_profit = gross_profit - fees;

    const tradeData: any = {
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
      status: derivedStatus,
      strategy: formData.strategy,
      trigger_id: finalTriggerId || null,
      mental_state: formData.mental_state,
      notes: (() => {
        let n = '';
        if (formData.session !== 'None') n += `[Sessão: ${formData.session}]\n`;
        n += `[Multiplicador: ${multiplier}]\n`;
        n += `[Contract Size: ${contractSize}]\n`;
        if (formData.sleep_hours) n += `[Sono: ${formData.sleep_hours}h]\n`;
        if (formData.stop_loss) n += `[SL: ${formData.stop_loss}]\n`;
        if (formData.take_profit) n += `[TP: ${formData.take_profit}]\n`;
        n += formData.notes;
        
        if (riskSettings && (riskSettings.risk_per_trade_percent || riskSettings.max_trades_per_day || riskSettings.max_consecutive_losses || riskSettings.max_losses_per_week)) {
          n += `\n\n[Gestão de Risco: ${riskSettings.risk_per_trade_percent ? riskSettings.risk_per_trade_percent + '%/op' : ''} ${riskSettings.max_trades_per_day ? '| Max ' + riskSettings.max_trades_per_day + '/dia' : ''} ${riskSettings.max_consecutive_losses ? '| Loss ' + riskSettings.max_consecutive_losses + ' seg' : ''} ${riskSettings.max_losses_per_week ? '| Loss ' + riskSettings.max_losses_per_week + '/sem' : ''}]`;
        }
        return n;
      })(),
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

  const handleAssetChange = (asset: string) => {
    const upperAsset = asset.toUpperCase();
    const config = ASSET_CONFIG[upperAsset];
    if (config) {
      setFormData(prev => ({
        ...prev,
        asset: upperAsset,
        contract_size: config.size.toString(),
        multiplier: '1' // Reset multiplier when using standard config
      }));
    } else {
      setFormData(prev => ({ ...prev, asset: upperAsset }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="p-2 text-slate-500 hover:text-white transition-all rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight">{isEditMode ? 'Editar Operação' : 'Nova Operação'}</h1>
            <p className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-widest mt-1">{isEditMode ? 'Atualize os detalhes da sua operação.' : 'Registre os detalhes da sua entrada no mercado.'}</p>
          </div>
        </div>
        <button 
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'SALVANDO...' : 'SALVAR OPERAÇÃO'}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="space-y-6 lg:col-span-5">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4" />
                Dados do Ativo
              </h3>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${estimatedProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                Resultado: {preferences.currency === 'BRL' ? 'R$' : '$'} {estimatedProfit.toFixed(2)}
              </div>
            </div>
            
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
                  {wallets.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ativo</label>
                <input 
                  required
                  type="text" 
                  list="asset-suggestions"
                  value={formData.asset}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  placeholder="Ex: WINJ24, EURUSD"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <datalist id="asset-suggestions">
                  {(MARKET_ASSETS[formData.market] || []).map(asset => (
                    <option key={asset} value={asset} />
                  ))}
                </datalist>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantidade (Lotes)</label>
                <input 
                  required
                  type="number" 
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="0"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Multiplicador</label>
                <input 
                  required
                  type="number" 
                  step="any"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({...formData, multiplier: e.target.value})}
                  placeholder="1"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contract Size</label>
                <input 
                  required
                  type="number" 
                  step="any"
                  value={formData.contract_size}
                  onChange={(e) => setFormData({...formData, contract_size: e.target.value})}
                  placeholder="1"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">
              O Contract Size é preenchido automaticamente para ativos conhecidos. Use o multiplicador para ajustes finos.
            </p>
            <div className="pt-2 border-t border-slate-800/50">
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest leading-relaxed">
                Cálculo do Pip: Lucro = (Diferença de Preço / Pip Size) * Lote * Multiplicador. 
              </p>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">
                (Pip Size padrão: Forex = 0.0001 | JPY = 0.01 | B3 = 1.00)
              </p>
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
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horário de Saída</label>
                <input 
                  type="datetime-local" 
                  value={formData.exit_time}
                  onChange={(e) => setFormData({...formData, exit_time: e.target.value})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stop Loss (SL)</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.stop_loss}
                  onChange={(e) => setFormData({...formData, stop_loss: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Take Profit (TP)</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.take_profit}
                  onChange={(e) => setFormData({...formData, take_profit: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {riskAlert && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{riskAlert.message}</p>
              </div>
            )}

            {riskReward.risk > 0 && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risco Planejado</span>
                  <span className="text-xs font-bold text-red-400">-{preferences.currency === 'BRL' ? 'R$' : '$'} {riskReward.risk.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alvo Planejado</span>
                  <span className="text-xs font-bold text-emerald-400">+{preferences.currency === 'BRL' ? 'R$' : '$'} {riskReward.reward.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-500/10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Relação R:R</span>
                  <span className="text-xs font-bold text-blue-400">1 : {riskReward.ratio.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status (Automático)</label>
                <div className={`w-full border rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  derivedStatus === 'WIN' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-500' :
                  derivedStatus === 'LOSS' ? 'bg-red-600/20 border-red-500 text-red-500' :
                  'bg-blue-600/20 border-blue-500 text-blue-500'
                }`}>
                  {derivedStatus === 'WIN' && <TrendingUp className="w-4 h-4" />}
                  {derivedStatus === 'LOSS' && <TrendingDown className="w-4 h-4" />}
                  {derivedStatus === 'BE' && <Target className="w-4 h-4" />}
                  {derivedStatus === 'BE' ? 'BREAK EVEN' : derivedStatus}
                </div>
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

        <div className="space-y-6 lg:col-span-4">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Análise & Gatilhos
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
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
                    <option value="REGRA DOS 3 TIMES">Regra dos 3 Times</option>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horas de Sono</label>
                <input 
                  type="text" 
                  value={formData.sleep_hours}
                  onChange={(e) => setFormData({...formData, sleep_hours: e.target.value})}
                  placeholder="Ex: 8h ou 7.5"
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-1.5 col-span-3">
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
                      {triggers.map((t: any) => (
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
                {sentiments.map((s: any) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="space-y-6 lg:col-span-3">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6 sticky top-8">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Gestão de Risco
            </h3>
            
            {!formData.wallet_id ? (
              <div className="text-center py-8 text-slate-500 text-xs font-medium uppercase tracking-widest">
                Selecione uma carteira para ver a gestão de risco.
              </div>
            ) : !riskSettings || (!riskSettings.risk_per_trade_percent && !riskSettings.max_trades_per_day && !riskSettings.max_consecutive_losses && !riskSettings.max_losses_per_week) ? (
              <div className="text-center py-8 text-slate-500 text-xs font-medium uppercase tracking-widest">
                Nenhuma regra de gestão de risco definida para esta carteira.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#050A15] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Real</span>
                    <span className="text-sm font-bold text-white">{preferences.currency === 'BRL' ? 'R$' : '$'} {walletStats.currentBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risco por Op.</span>
                    <span className={`text-sm font-bold ${(() => {
                      const riskPercent = walletStats.currentBalance > 0 ? (riskReward.risk / walletStats.currentBalance) * 100 : 0;
                      return riskPercent > 1 ? 'text-red-500' : 'text-emerald-500';
                    })()}`}>
                      {walletStats.currentBalance > 0 ? ((riskReward.risk / walletStats.currentBalance) * 100).toFixed(2) : '0.00'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risco de Retorno</span>
                    <span className={`text-sm font-bold ${(() => {
                      const targetRR = riskSettings?.target_rr ? parseFloat(riskSettings.target_rr) : 0;
                      if (targetRR === 0) return 'text-white';
                      // Use a small epsilon for float comparison
                      return Math.abs(riskReward.ratio - targetRR) < 0.01 ? 'text-emerald-500' : 'text-yellow-500';
                    })()}`}>
                      1 : {riskReward.ratio.toFixed(2)}
                    </span>
                  </div>
                </div>

                {riskSettings.risk_per_trade_percent && (
                  <div className="bg-[#050A15] border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Meta de Risco</span>
                    <span className="text-sm font-bold text-white">{riskSettings.risk_per_trade_percent}%</span>
                  </div>
                )}
                
                {riskSettings.max_trades_per_day && (
                  <div className="bg-[#050A15] border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trades Hoje</span>
                      <span className={`text-sm font-bold ${walletStats.tradesToday >= Number(riskSettings.max_trades_per_day) ? 'text-red-500' : 'text-emerald-500'}`}>
                        {walletStats.tradesToday} / {riskSettings.max_trades_per_day}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${walletStats.tradesToday >= Number(riskSettings.max_trades_per_day) ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((walletStats.tradesToday / Number(riskSettings.max_trades_per_day)) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}

                {riskSettings.max_consecutive_losses && (
                  <div className="bg-[#050A15] border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loss Seguidos</span>
                      <span className={`text-sm font-bold ${walletStats.consecutiveLosses >= Number(riskSettings.max_consecutive_losses) ? 'text-red-500' : 'text-emerald-500'}`}>
                        {walletStats.consecutiveLosses} / {riskSettings.max_consecutive_losses}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${walletStats.consecutiveLosses >= Number(riskSettings.max_consecutive_losses) ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((walletStats.consecutiveLosses / Number(riskSettings.max_consecutive_losses)) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}

                {riskSettings.max_losses_per_week && (
                  <div className="bg-[#050A15] border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loss na Semana</span>
                      <span className={`text-sm font-bold ${walletStats.weeklyLosses >= Number(riskSettings.max_losses_per_week) ? 'text-red-500' : 'text-emerald-500'}`}>
                        {walletStats.weeklyLosses} / {riskSettings.max_losses_per_week}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${walletStats.weeklyLosses >= Number(riskSettings.max_losses_per_week) ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((walletStats.weeklyLosses / Number(riskSettings.max_losses_per_week)) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
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
