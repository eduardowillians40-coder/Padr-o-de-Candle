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
  Clock
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
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterAsset, setFilterAsset] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTrigger, setFilterTrigger] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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
  const filteredTrades = trades.filter(trade => {
    const matchesWallet = filterWallet === 'all' || trade.wallet_id === filterWallet;
    const matchesAsset = filterAsset === '' || trade.asset.toLowerCase().includes(filterAsset.toLowerCase());
    const matchesType = filterType === 'all' || (filterType === 'LONG' ? trade.type === 'BUY' : trade.type === 'SELL');
    
    // Improved trigger matching
    const tradeTriggerName = triggers.find(t => t.id === trade.trigger_id)?.name;
    const matchesTrigger = filterTrigger === 'all' || 
                          trade.trigger_id === filterTrigger || 
                          tradeTriggerName === filterTrigger;
    
    // Lógica de período
    const tradeDate = new Date(trade.created_at);
    const matchesPeriod = (!filterStartDate || tradeDate >= new Date(filterStartDate)) &&
                          (!filterEndDate || tradeDate <= new Date(filterEndDate));

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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Histórico de Operações</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">Acompanhe e analise cada detalhe das suas entradas.</p>
          </div>
          
          <div className="flex bg-[#0D1425] p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List className="w-4 h-4" /> LISTA
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <CalendarIcon className="w-4 h-4" /> CALENDÁRIO
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 bg-[#0D1425] p-4 rounded-xl border border-slate-800 w-full">
          <select value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)} className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none flex-1">
            <option value="all">Todas as carteiras</option>
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input type="text" placeholder="Filtrar por ativo..." value={filterAsset} onChange={(e) => setFilterAsset(e.target.value)} className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none flex-1" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none flex-1">
            <option value="all">Todos (Long/Short)</option>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
          <select value={filterTrigger} onChange={(e) => setFilterTrigger(e.target.value)} className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none flex-1">
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
          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none flex-1" />
          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="bg-[#050A15] text-white text-sm font-bold p-3 rounded-lg border border-slate-800 focus:outline-none flex-1" />
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
                <div key={trade.id} className="bg-[#0D1425] border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-600 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${trade.type === 'BUY' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {trade.type === 'BUY' ? (
                        <ArrowUpRight className={`w-5 h-5 ${trade.type === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`} />
                      ) : (
                        <ArrowDownRight className={`w-5 h-5 ${trade.type === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{trade.asset}</span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${trade.type === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                          {trade.type === 'BUY' ? 'Long' : 'Short'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                          {trade.mental_state || 'Neutro'}
                        </span>
                        {trade.trigger_id && (
                          <span className="text-[10px] font-bold text-amber-500 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Zap className="w-2 h-2" />
                            {(() => {
                              const customTrigger = triggers.find(t => t.id === trade.trigger_id);
                              return customTrigger ? customTrigger.name : trade.trigger_id;
                            })()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-1">
                        <span>{trade.market || trade.wallets?.name || 'B3'}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {trade.entry_time ? new Date(trade.entry_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : new Date(trade.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {trade.exit_time ? ` - ${new Date(trade.exit_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
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
                    <div className="flex gap-2">
                      <Link href={`/operations/new?id=${trade.id}`} className="p-2 text-slate-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(trade.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                const dayTrades = filteredTrades.filter(t => isSameDay(new Date(t.created_at), day));
                const totalProfit = dayTrades.reduce((acc, t) => acc + t.net_profit, 0);
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
