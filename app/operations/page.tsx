'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  List, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Activity,
  Zap,
  Edit2,
  Trash2,
  Clock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUserPreferences } from '@/app/context/UserPreferencesContext';
import { formatCurrency } from '@/lib/formatCurrency';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const STANDARD_TRIGGERS = [
  'Rompimento de Topo/Fundo',
  'Pullback na Média',
  'Cruzamento de Médias',
  'Suporte/Resistência',
  'Volume Climático'
];

export default function OperationsPage() {
  const { preferences } = useUserPreferences();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const walletId = searchParams.get('wallet');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [trades, setTrades] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletRiskSettings, setWalletRiskSettings] = useState<Record<string, any>>({});
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterAsset, setFilterAsset] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTrigger, setFilterTrigger] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const clearFilters = () => {
    setFilterWallet('all');
    setFilterAsset('');
    setFilterType('all');
    setFilterTrigger('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const [refresh, setRefresh] = useState(0);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta operação?')) return;
    
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (!error) {
      setRefresh(prev => prev + 1);
    } else {
      console.error('Erro ao deletar operação:', error);
      alert('Erro ao deletar operação: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar carteiras
      const { data: walletsData } = await supabase
        .from('wallets')
        .select('id, name')
        .eq('user_id', user.id);
      setWallets(walletsData || []);

      // Load risk settings from localStorage for all wallets
      if (typeof window !== 'undefined' && walletsData) {
        const settings: Record<string, any> = {};
        walletsData.forEach(w => {
          const saved = localStorage.getItem(`risk_settings_${w.id}`);
          if (saved) {
            try {
              settings[w.id] = JSON.parse(saved);
            } catch (e) {}
          }
        });
        setWalletRiskSettings(settings);
      }

      // Buscar gatilhos
      const { data: triggersData } = await supabase
        .from('triggers')
        .select('id, name')
        .eq('user_id', user.id);
      setTriggers(triggersData || []);

      // Buscar operações
      let query = supabase
        .from('trades')
        .select('*, wallets(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (walletId) {
        query = query.eq('wallet_id', walletId);
      }

      const { data } = await query;
      setTrades(data || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase, refresh, walletId]);

  // Lógica de filtragem robusta
  const filteredTrades = trades.map(trade => {
    // Parse extra data from notes
    const notes = trade.notes || '';
    const slMatch = notes.match(/\[SL: (.*?)\]/);
    const tpMatch = notes.match(/\[TP: (.*?)\]/);
    const sleepMatch = notes.match(/\[Sono: (.*?)h\]/);
    const contractSizeMatch = notes.match(/\[Contract Size: (.*?)\]/);
    const multiplierMatch = notes.match(/\[Multiplicador: (.*?)\]/);

    const sl = slMatch ? parseFloat(slMatch[1]) : 0;
    const tp = tpMatch ? parseFloat(tpMatch[1]) : 0;
    const sleep = sleepMatch ? sleepMatch[1] : null;
    const contractSize = contractSizeMatch ? parseFloat(contractSizeMatch[1]) : 1;
    const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1]) : 1;

    let rr = 0;
    if (trade.entry_price && trade.quantity) {
      const risk = sl ? Math.abs(trade.entry_price - sl) * contractSize * trade.quantity * multiplier : 0;
      const reward = tp ? Math.abs(tp - trade.entry_price) * contractSize * trade.quantity * multiplier : 0;
      rr = risk > 0 ? reward / risk : 0;
    }

    return { ...trade, sl, tp, sleep, rr };
  }).filter(trade => {
    const matchesWallet = filterWallet === 'all' || trade.wallet_id === filterWallet;
    const matchesAsset = filterAsset === '' || (trade.asset && trade.asset.toLowerCase().includes(filterAsset.toLowerCase()));
    const matchesType = filterType === 'all' || (filterType === 'LONG' ? trade.type === 'BUY' : trade.type === 'SELL');
    
    // Improved trigger matching
    const tradeTriggerName = triggers.find(t => t.id === trade.trigger_id)?.name;
    const matchesTrigger = filterTrigger === 'all' || 
                          trade.trigger_id === filterTrigger || 
                          tradeTriggerName === filterTrigger;
    
    // Lógica de período
    const tradeDate = new Date(trade.created_at);
    let matchesPeriod = true;
    
    if (filterStartDate) {
      const [year, month, day] = filterStartDate.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      matchesPeriod = matchesPeriod && tradeDate >= start;
    }
    
    if (filterEndDate) {
      const [year, month, day] = filterEndDate.split('-').map(Number);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      matchesPeriod = matchesPeriod && tradeDate <= end;
    }

    return matchesWallet && matchesAsset && matchesType && matchesTrigger && matchesPeriod;
  });

  const stats = {
    total: filteredTrades.length,
    win: filteredTrades.filter(t => t.status === 'WIN').length,
    loss: filteredTrades.filter(t => t.status === 'LOSS').length,
    be: filteredTrades.filter(t => t.status === 'BE').length,
    netProfit: filteredTrades.reduce((acc, t) => acc + (t.net_profit || 0), 0),
    fees: filteredTrades.reduce((acc, t) => acc + (t.fees || 0), 0)
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header and Filters Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight">Histórico de Operações</h1>
            <p className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-widest mt-1">Acompanhe e analise cada detalhe das suas entradas.</p>
          </div>
          
          <div className="flex bg-[#0D1425] p-1 rounded-xl border border-slate-800 w-full md:w-auto">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List className="w-4 h-4" /> LISTA
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <CalendarIcon className="w-4 h-4" /> CALENDÁRIO
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 bg-[#0D1425] p-4 rounded-xl border border-slate-800 w-full">
          <select 
            value={filterWallet} 
            onChange={(e) => setFilterWallet(e.target.value)} 
            className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none min-w-[180px] flex-1"
          >
            <option value="all">Todas as carteiras</option>
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filtrar por ativo..." 
              value={filterAsset} 
              onChange={(e) => setFilterAsset(e.target.value)} 
              className="w-full bg-[#050A15] text-white text-sm font-bold pl-10 pr-3 py-3 rounded-lg border border-slate-800 focus:outline-none" 
            />
          </div>

          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none min-w-[150px] flex-1"
          >
            <option value="all">Todos (Long/Short)</option>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>

          <select 
            value={filterTrigger} 
            onChange={(e) => setFilterTrigger(e.target.value)} 
            className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none min-w-[180px] flex-1"
          >
            <option value="all">Todos os Gatilhos</option>
            <optgroup label="Gatilhos Padrão">
              {STANDARD_TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
            </optgroup>
            {triggers.length > 0 && (
              <optgroup label="Meus Gatilhos">
                {triggers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>
            )}
          </select>

          <div className="relative flex-1 min-w-[150px]">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input 
              type="date" 
              value={filterStartDate} 
              onChange={(e) => setFilterStartDate(e.target.value)} 
              className="w-full bg-[#050A15] text-white text-sm font-bold pl-10 pr-3 py-3 rounded-lg border border-slate-800 focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
            />
          </div>

          <div className="relative flex-1 min-w-[150px]">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input 
              type="date" 
              value={filterEndDate} 
              onChange={(e) => setFilterEndDate(e.target.value)} 
              className="w-full bg-[#050A15] text-white text-sm font-bold pl-10 pr-3 py-3 rounded-lg border border-slate-800 focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
            />
          </div>

          <button 
            onClick={clearFilters}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-lg border border-slate-700 transition-all flex items-center gap-2 text-sm font-bold group"
            title="Limpar Filtros"
          >
            <X className="w-4 h-4 group-hover:text-red-500 transition-colors" />
            <span className="hidden xl:inline">LIMPAR</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OPERAÇÕES</h3>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.total}</p>
          <div className="flex gap-2 mt-4">
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">{stats.win}W</span>
            <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">{stats.loss}L</span>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">{stats.be}BE</span>
          </div>
        </div>

        <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LUCRO LÍQUIDO</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className={`text-3xl font-display font-bold ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(stats.netProfit, preferences.currency)}
          </p>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Acumulado do período</p>
        </div>

        <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">WIN RATE</h3>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.total > 0 ? Math.round((stats.win / stats.total) * 100) : 0}%</p>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-emerald-500" style={{ width: `${stats.total > 0 ? (stats.win / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TAXAS PAGAS</h3>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-display font-bold text-amber-500">{formatCurrency(stats.fees, preferences.currency)}</p>
        </div>
      </div>

      {/* History Section */}
      <div className="flex justify-between items-center pt-8">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Histórico de Operações</h2>
        <Link 
          href="/operations/new"
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> NOVA OPERAÇÃO
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0D1425] border border-slate-800 rounded-2xl overflow-hidden"
          >
            <div className="space-y-4">
              {filteredTrades.map((trade) => (
                <div key={trade.id} className="bg-[#0D1425] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-600 transition-colors">
                  <div className="flex items-start md:items-center gap-4 w-full md:w-auto">
                    <div className={`p-3 rounded-lg shrink-0 ${trade.status === 'WIN' ? 'bg-emerald-500/10' : trade.status === 'LOSS' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                      {trade.status === 'WIN' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      ) : trade.status === 'LOSS' ? (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      ) : (
                        <Target className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{trade.asset}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${trade.type === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                          {trade.type === 'BUY' ? 'Long' : 'Short'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          trade.status === 'WIN' ? 'bg-emerald-500/10 text-emerald-500' :
                          trade.status === 'LOSS' ? 'bg-red-500/10 text-red-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {trade.status === 'BE' ? 'Break Even' : trade.status}
                        </span>
                        {trade.rr > 0 && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${(() => {
                            const settings = walletRiskSettings[trade.wallet_id];
                            const targetRR = settings?.target_rr ? parseFloat(settings.target_rr) : 0;
                            if (targetRR === 0) return 'bg-blue-500/10 text-blue-400';
                            return Math.abs(trade.rr - targetRR) < 0.01 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500';
                          })()}`}>
                            R:R 1:{trade.rr.toFixed(2)}
                          </span>
                        )}
                        {trade.sleep && (
                          <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                            <Clock className="w-2 h-2" />
                            {trade.sleep}h Sono
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                          {trade.mental_state || 'Neutro'}
                        </span>
                        {trade.strategy === 'REGRA DOS 3 TIMES' ? (
                          <Link href="/strategies/regra-dos-3-times" className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0 transition-colors">
                            {trade.strategy}
                          </Link>
                        ) : trade.strategy && (
                          <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                            {trade.strategy}
                          </span>
                        )}
                        {trade.trigger_id && (
                          <span className="text-[10px] font-bold text-amber-500 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                            <Zap className="w-2 h-2" />
                            {(() => {
                              const customTrigger = triggers.find(t => t.id === trade.trigger_id);
                              return customTrigger ? customTrigger.name : trade.trigger_id;
                            })()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-medium mt-1">
                        <span>{trade.market || trade.wallets?.name || 'B3'}</span>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {trade.entry_time ? new Date(trade.entry_time).toLocaleDateString('pt-BR') : new Date(trade.created_at).toLocaleDateString('pt-BR')}
                            {' • '}
                            {trade.entry_time ? new Date(trade.entry_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : new Date(trade.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {trade.exit_time ? ` - ${new Date(trade.exit_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 border-t border-slate-800 md:border-t-0 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className={`text-sm font-bold ${trade.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatCurrency(trade.net_profit || 0, preferences.currency)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase">
                        Taxas: {formatCurrency(trade.fees || 0, preferences.currency)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium uppercase">
                        Líquido: {formatCurrency(trade.net_profit || 0, preferences.currency)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/operations/new?id=${trade.id}`} className="p-2 bg-slate-800/50 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"><Edit2 className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(trade.id)} className="p-2 bg-slate-800/50 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredTrades.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs font-medium uppercase tracking-widest">
                  Nenhuma operação encontrada com esses filtros.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0D1425] border border-slate-800 rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0D1425]">
              <h3 className="font-bold text-white uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
              <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-slate-500 hover:text-white transition-all"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-slate-500 hover:text-white transition-all"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-800 bg-[#050A15]/50">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
                <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-800 last:border-r-0">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayTrades = filteredTrades.filter(t => t.created_at && isSameDay(new Date(t.created_at), day));
                const totalProfit = dayTrades.reduce((acc, t) => acc + (t.net_profit || 0), 0);
                const isPositive = totalProfit > 0;
                const isNegative = totalProfit < 0;

                return (
                  <div key={idx} className="min-h-[120px] p-2 border-r border-b border-slate-800 last:border-r-0 relative group hover:bg-slate-800/20 transition-all">
                    <span className="text-[10px] font-bold text-slate-500">{format(day, 'd')}</span>
                    {dayTrades.length > 0 && (
                      <div className={cn(
                        "mt-2 p-2 rounded-lg border flex flex-col justify-between h-[80px]",
                        isPositive ? "bg-emerald-500/5 border-emerald-500/10" : isNegative ? "bg-red-500/5 border-red-500/10" : "bg-slate-500/5 border-slate-500/10"
                      )}>
                        <span className="text-[8px] font-bold text-slate-400 uppercase self-end bg-slate-800 px-1.5 py-0.5 rounded">{dayTrades.length} OP</span>
                        <p className={cn("text-[10px] font-bold mt-auto", isPositive ? "text-emerald-500" : isNegative ? "text-red-500" : "text-slate-500")}>
                          {formatCurrency(totalProfit, preferences.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
