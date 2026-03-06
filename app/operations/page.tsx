'use client';

import { useState, useEffect, useCallback } from 'react';
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
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function OperationsPage() {
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('trades')
        .select('*, wallets(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setTrades(data || []);
      setLoading(false);
    };

    fetchTrades();
  }, [supabase, refresh]);

  const stats = {
    total: trades.length,
    win: trades.filter(t => t.status === 'WIN').length,
    loss: trades.filter(t => t.status === 'LOSS').length,
    be: trades.filter(t => t.status === 'BE').length,
    netProfit: trades.reduce((acc, t) => acc + (t.net_profit || 0), 0),
    fees: trades.reduce((acc, t) => acc + (t.fees || 0), 0)
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
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
            R$ {stats.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <p className="text-3xl font-display font-bold text-amber-500">R$ {stats.fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="flex justify-end">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#050A15]/50 border-b border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ativo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resultado</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Carteira</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{new Date(trade.created_at).toLocaleDateString('pt-BR')}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{new Date(trade.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white bg-slate-800 px-2 py-1 rounded">{trade.asset}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase ${trade.type === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {trade.type === 'BUY' ? 'Compra' : 'Venda'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-xs font-bold ${trade.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          R$ {trade.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${
                          trade.status === 'WIN' ? 'bg-emerald-500/10 text-emerald-500' : 
                          trade.status === 'LOSS' ? 'bg-red-500/10 text-red-500' : 
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trade.wallets?.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {trades.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-xs font-medium uppercase tracking-widest">
                        Nenhuma operação registrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                const dayTrades = trades.filter(t => isSameDay(new Date(t.created_at), day));
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
                          {totalProfit !== 0 ? (totalProfit > 0 ? '+' : '') : ''}R$ {totalProfit.toLocaleString('pt-BR')}
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
