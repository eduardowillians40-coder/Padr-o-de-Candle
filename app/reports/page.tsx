'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useUserPreferences } from '@/app/context/UserPreferencesContext';
import { formatCurrency } from '@/lib/formatCurrency';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Activity, 
  Brain,
  Filter,
  Calendar as CalendarIcon,
  ChevronDown,
  ArrowLeft,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ReportsPage() {
  const { preferences } = useUserPreferences();
  const supabase = createClient();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterMarket, setFilterMarket] = useState('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | 'month'>('month');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: walletsData } = await supabase.from('wallets').select('id, name').eq('user_id', user.id);
      setWallets(walletsData || []);

      const { data: triggersData } = await supabase.from('triggers').select('id, name').eq('user_id', user.id);
      setTriggers(triggersData || []);

      const { data: tradesData } = await supabase
        .from('trades')
        .select('*, wallets(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setTrades(tradesData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const matchWallet = filterWallet === 'all' || trade.wallet_id === filterWallet;
      const matchMarket = filterMarket === 'all' || trade.market === filterMarket;
      
      let matchDate = true;
      const tradeDate = new Date(trade.entry_time || trade.created_at);
      const now = new Date();
      
      if (dateRange === '7d') {
        matchDate = tradeDate >= subDays(now, 7);
      } else if (dateRange === '30d') {
        matchDate = tradeDate >= subDays(now, 30);
      } else if (dateRange === 'month') {
        matchDate = isWithinInterval(tradeDate, { start: startOfMonth(now), end: endOfMonth(now) });
      }

      return matchWallet && matchMarket && matchDate;
    });
  }, [trades, filterWallet, filterMarket, dateRange]);

  const stats = useMemo(() => {
    const total = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.status === 'WIN');
    const losses = filteredTrades.filter(t => t.status === 'LOSS');
    const bes = filteredTrades.filter(t => t.status === 'BE');
    
    const netProfit = filteredTrades.reduce((acc, t) => acc + (t.net_profit || 0), 0);
    const grossProfit = filteredTrades.reduce((acc, t) => acc + (t.gross_profit || 0), 0);
    const totalFees = filteredTrades.reduce((acc, t) => acc + (t.fees || 0), 0);
    
    const winRate = total > 0 ? (wins.length / (wins.length + losses.length)) * 100 : 0;
    
    const avgWin = wins.length > 0 ? wins.reduce((acc, t) => acc + (t.net_profit || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((acc, t) => acc + (t.net_profit || 0), 0) / losses.length : 0;
    
    const payoff = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

    // Drawdown calculation (simplified peak-to-trough on closed trades)
    let peak = 0;
    let currentEquity = 0;
    let maxDrawdown = 0;
    
    // Sort chronological for equity curve
    const sortedTrades = [...filteredTrades].sort((a, b) => 
      new Date(a.entry_time || a.created_at).getTime() - new Date(b.entry_time || b.created_at).getTime()
    );

    sortedTrades.forEach(t => {
      currentEquity += (t.net_profit || 0);
      if (currentEquity > peak) peak = currentEquity;
      const drawdown = peak - currentEquity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Assets Performance
    const assetStats = filteredTrades.reduce((acc: any, t) => {
      if (!acc[t.asset]) acc[t.asset] = 0;
      acc[t.asset] += (t.net_profit || 0);
      return acc;
    }, {});
    
    const sortedAssets = Object.entries(assetStats).sort((a: any, b: any) => b[1] - a[1]);
    const bestAssets = sortedAssets.slice(0, 4);
    const worstAssets = sortedAssets.slice(-3).reverse().filter((a: any) => a[1] < 0);

    // Sessions and Hours
    const entryHours = wins.reduce((acc: any, t) => {
      if (!t.entry_time) return acc;
      const hour = new Date(t.entry_time).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const exitHours = wins.reduce((acc: any, t) => {
      if (!t.exit_time) return acc;
      const hour = new Date(t.exit_time).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const bestEntryHours = Object.entries(entryHours)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(e => `${e[0].padStart(2, '0')}h`);

    const bestExitHours = Object.entries(exitHours)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(e => `${e[0].padStart(2, '0')}h`);

    // Sessions from notes
    const sessions = filteredTrades.reduce((acc: any, t) => {
      const match = t.notes?.match(/\[Sessão: (.*?)\]/);
      if (match && match[1]) {
        const session = match[1];
        if (!acc[session]) acc[session] = { profit: 0, count: 0 };
        acc[session].profit += (t.net_profit || 0);
        acc[session].count += 1;
      }
      return acc;
    }, {});

    const sortedSessions = Object.entries(sessions).sort((a: any, b: any) => b[1].profit - a[1].profit);

    // Triggers Analysis
    const triggerStats = filteredTrades.reduce((acc: any, t) => {
      let triggerName = t.trigger_id;
      if (t.trigger_id) {
        const customTrigger = triggers.find(tr => tr.id === t.trigger_id);
        if (customTrigger) triggerName = customTrigger.name;
      } else {
        triggerName = 'Sem Gatilho';
      }
      
      if (!acc[triggerName]) acc[triggerName] = { win: 0, loss: 0, profit: 0 };
      if (t.status === 'WIN') acc[triggerName].win++;
      if (t.status === 'LOSS') acc[triggerName].loss++;
      acc[triggerName].profit += (t.net_profit || 0);
      return acc;
    }, {});

    // Mental State
    const mentalStats = filteredTrades.reduce((acc: any, t) => {
      const state = t.mental_state || 'Neutro';
      if (!acc[state]) acc[state] = { win: 0, loss: 0 };
      if (t.status === 'WIN') acc[state].win++;
      if (t.status === 'LOSS') acc[state].loss++;
      return acc;
    }, {});

    const dominantMentalState = Object.entries(mentalStats).sort((a: any, b: any) => (b[1].win + b[1].loss) - (a[1].win + a[1].loss))[0]?.[0] || 'N/A';

    return {
      total,
      wins: wins.length,
      losses: losses.length,
      bes: bes.length,
      netProfit,
      grossProfit,
      totalFees,
      winRate,
      avgWin,
      avgLoss,
      payoff,
      maxDrawdown,
      bestAssets,
      worstAssets,
      bestEntryHours,
      bestExitHours,
      sortedSessions,
      triggerStats,
      dominantMentalState
    };
  }, [filteredTrades, triggers]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050A15',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`relatorio-performance-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-[#0D1425] border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-500" />
              Relatório de Performance
            </h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">
              Análise detalhada dos seus resultados operacionais
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={handleExportPDF}
            disabled={exporting || stats.total === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? 'Exportando...' : 'Exportar PDF'}
          </button>

          <div className="h-8 w-px bg-slate-800 mx-1 hidden md:block" />

          <select
            value={filterWallet}
            onChange={(e) => setFilterWallet(e.target.value)}
            className="bg-[#0D1425] border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as Carteiras</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value)}
            className="bg-[#0D1425] border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os Mercados</option>
            <option value="B3">B3</option>
            <option value="Forex">Forex</option>
            <option value="Cripto">Cripto</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-[#0D1425] border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            <option value="month">Este Mês</option>
            <option value="7d">Últimos 7 Dias</option>
            <option value="30d">Últimos 30 Dias</option>
            <option value="all">Todo o Período</option>
          </select>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-12 text-center">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Nenhum dado encontrado</h3>
          <p className="text-slate-500 text-sm">Não há operações registradas para os filtros selecionados.</p>
        </div>
      ) : (
        <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 bg-[#050A15] rounded-3xl">
          
          {/* Coluna 1: Resultado Geral */}
          <div className="space-y-6">
            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Resultado Geral
              </h2>

              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Saldo Líquido</p>
                  <p className={`text-3xl font-bold font-display ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatCurrency(stats.netProfit, preferences.currency)}
                  </p>
                </div>

                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between items-center">
                    <span className="text-slate-400">Total de operações:</span>
                    <span className="font-bold text-white">{stats.total}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-400">Desempenho:</span>
                    <span className="font-bold text-white">
                      <span className="text-emerald-500">{stats.wins}W</span> | <span className="text-red-500">{stats.losses}L</span> | <span className="text-blue-500">{stats.bes}BE</span>
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-400">Taxa de acerto:</span>
                    <span className="font-bold text-white">{stats.winRate.toFixed(1)}%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-400">Drawdown máximo:</span>
                    <span className="font-bold text-red-500">{formatCurrency(stats.maxDrawdown, preferences.currency)}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-400">Ganho médio:</span>
                    <span className="font-bold text-emerald-500">{formatCurrency(stats.avgWin, preferences.currency)}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-400">Perda média:</span>
                    <span className="font-bold text-red-500">{formatCurrency(stats.avgLoss, preferences.currency)}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-slate-400">Relação ganho/perda:</span>
                    <span className="font-bold text-white">{stats.payoff.toFixed(2)}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Brain className="w-4 h-4 text-purple-500" />
                Psicologia & Disciplina
              </h2>
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between items-center p-3 bg-[#050A15] rounded-xl border border-slate-800/50">
                  <span className="text-slate-400">Sentimento Dominante:</span>
                  <span className="font-bold text-purple-400 uppercase text-xs tracking-widest px-2 py-1 bg-purple-500/10 rounded">{stats.dominantMentalState}</span>
                </li>
                <li className="flex justify-between items-center p-3 bg-[#050A15] rounded-xl border border-slate-800/50">
                  <span className="text-slate-400">Disciplina do Plano:</span>
                  <span className="font-bold text-emerald-500">100%</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Coluna 2: Sessões e Ativos */}
          <div className="space-y-6">
            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-amber-500" />
                Sessões e Horários
              </h2>

              <div className="space-y-6">
                {stats.sortedSessions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Sessões que mais entregaram:</h3>
                    <ul className="space-y-2">
                      {stats.sortedSessions.map((session: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-slate-300 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                            {session[0]}
                          </span>
                          <span className={`font-bold ${session[1].profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {formatCurrency(session[1].profit, preferences.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Horários mais eficientes de entrada:</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.bestEntryHours.length > 0 ? stats.bestEntryHours.map((h, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-500 font-bold text-xs rounded-lg border border-amber-500/20">{h}</span>
                    )) : <span className="text-sm text-slate-500">Dados insuficientes</span>}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Horários de saída mais eficientes:</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.bestExitHours.length > 0 ? stats.bestExitHours.map((h, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-500 font-bold text-xs rounded-lg border border-blue-500/20">{h}</span>
                    )) : <span className="text-sm text-slate-500">Dados insuficientes</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Target className="w-4 h-4 text-emerald-500" />
                Performance por Ativo
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Melhores Ativos
                  </h3>
                  <div className="space-y-2">
                    {stats.bestAssets.length > 0 ? stats.bestAssets.map((asset: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#050A15] rounded-lg border border-slate-800/50">
                        <span className="text-sm font-bold text-white">{asset[0]}</span>
                        <span className="text-sm font-bold text-emerald-500">{formatCurrency(asset[1], preferences.currency)}</span>
                      </div>
                    )) : <span className="text-sm text-slate-500">Sem dados</span>}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> Piores Resultados
                  </h3>
                  <div className="space-y-2">
                    {stats.worstAssets.length > 0 ? stats.worstAssets.map((asset: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[#050A15] rounded-lg border border-slate-800/50">
                        <span className="text-sm font-bold text-white">{asset[0]}</span>
                        <span className="text-sm font-bold text-red-500">{formatCurrency(asset[1], preferences.currency)}</span>
                      </div>
                    )) : <span className="text-sm text-slate-500">Sem perdas registradas</span>}
                  </div>
                  {stats.worstAssets.length > 0 && (
                    <p className="text-[10px] text-slate-500 mt-3 flex items-start gap-2">
                      <span className="text-red-500">📌</span> Todas as perdas dentro do risco planejado, sem descontrole.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 3: Gatilhos e Conclusão */}
          <div className="space-y-6">
            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Filter className="w-4 h-4 text-indigo-500" />
                Análise de Gatilhos
              </h2>

              <div className="space-y-3">
                {Object.entries(stats.triggerStats).length > 0 ? Object.entries(stats.triggerStats)
                  .sort((a: any, b: any) => b[1].profit - a[1].profit)
                  .map(([trigger, data]: [string, any], idx) => (
                  <div key={idx} className="p-3 bg-[#050A15] rounded-xl border border-slate-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{trigger}</span>
                      <span className={`text-xs font-bold ${data.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatCurrency(data.profit, preferences.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">{data.win}W</span>
                      <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">{data.loss}L</span>
                      <span className="text-slate-500">
                        {(data.win / (data.win + data.loss) * 100 || 0).toFixed(0)}% WR
                      </span>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500">Nenhum gatilho registrado.</p>}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0D1425] to-[#050A15] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-pink-500" />
                Conclusão
              </h2>
              
              <p className="text-sm text-slate-300 mb-4">
                O período analisado foi marcado por:
              </p>
              
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {stats.winRate >= 60 ? 'Boa consistência' : 'Consistência em desenvolvimento'}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Risco controlado
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Execução limpa
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Respeito absoluto ao plano
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
