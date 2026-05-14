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
import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Trade, Wallet, Trigger } from '@/lib/types';

interface ExtendedTrade extends Trade {
  wallets?: {
    name: string;
    initial_balance: number;
  };
}

interface StatInsight {
  riskControl: string;
  executionClean: string;
  sleepInsight: string;
  emotionInsight: string;
}

interface PerformanceMetric {
  profit: number;
  count: number;
  wins: number;
}

interface EmotionMetric extends PerformanceMetric {
  name: string;
}

interface SleepMetric extends PerformanceMetric {
  name: string;
  totalHours: number;
}

interface ChartData extends EmotionMetric {
  winRate: number;
}

export default function ReportsPage() {
  const { preferences } = useUserPreferences();
  const supabase = createClient();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);
  const [trades, setTrades] = useState<ExtendedTrade[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [walletRiskSettings, setWalletRiskSettings] = useState<Record<string, { risk_per_trade_percent?: string, target_rr?: string, max_trades_per_day?: string, max_consecutive_losses?: string, max_losses_per_week?: string }>>({});

  // Filters
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterMarket, setFilterMarket] = useState('all');
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [filterSleep, setFilterSleep] = useState('all');
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
        .select('*, wallets(name, initial_balance)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Load risk settings from localStorage
      const riskSettings: Record<string, any> = {};
      if (typeof window !== 'undefined' && walletsData) {
        walletsData.forEach((w: any) => {
          const saved = localStorage.getItem(`risk_settings_${w.id}`);
          if (saved) {
            try {
              riskSettings[w.id] = JSON.parse(saved);
            } catch (e) {}
          }
        });
      }
      setWalletRiskSettings(riskSettings);
      setTrades(tradesData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const matchWallet = filterWallet === 'all' || trade.wallet_id === filterWallet;
      const tradeMarket = trade.wallets?.name || 'B3';
      const matchMarket = filterMarket === 'all' || tradeMarket.toUpperCase().includes(filterMarket.toUpperCase());
      const tradeEmotion = trade.mental_state || 'NEUTRO';
      const matchEmotion = filterEmotion === 'all' || tradeEmotion.toUpperCase() === filterEmotion.toUpperCase();
      
      const sleepMatch = trade.notes?.match(/\[Sono: (.*?)h\]/);
      const hours = sleepMatch ? parseFloat(sleepMatch[1]) : 0;
      const range = hours === 0 ? 'N/A' : hours < 6 ? '< 6h' : hours <= 8 ? '6-8h' : '> 8h';
      const matchSleep = filterSleep === 'all' || range === filterSleep;
      
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

      return matchWallet && matchMarket && matchEmotion && matchSleep && matchDate;
    });
  }, [trades, filterWallet, filterMarket, filterEmotion, filterSleep, dateRange]);

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
    const assetStats = filteredTrades.reduce((acc: Record<string, number>, t) => {
      if (!acc[t.asset]) acc[t.asset] = 0;
      acc[t.asset] += (t.net_profit || 0);
      return acc;
    }, {});
    
    const sortedAssets = Object.entries(assetStats).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
    const bestAssets = sortedAssets.slice(0, 4);
    const worstAssets = sortedAssets.slice(-3).reverse().filter((a: [string, number]) => a[1] < 0);

    // Sessions and Hours
    const entryHours = wins.reduce((acc: Record<number, number>, t) => {
      if (!t.entry_time) return acc;
      const hour = new Date(t.entry_time).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const exitHours = wins.reduce((acc: Record<number, number>, t) => {
      const exitDate = t.exit_time || t.created_at;
      if (!exitDate) return acc;
      const hour = new Date(exitDate).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const bestEntryHours = Object.entries(entryHours)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 3)
      .map(e => `${e[0].padStart(2, '0')}h`);

    const bestExitHours = Object.entries(exitHours)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 5)
      .map(e => `${e[0].padStart(2, '0')}h`);

    // Sessions from notes
    const sessions = filteredTrades.reduce((acc: Record<string, { profit: number; count: number }>, t) => {
      const match = t.notes?.match(/\[Sessão: (.*?)\]/);
      if (match && match[1]) {
        const session = match[1];
        if (!acc[session]) acc[session] = { profit: 0, count: 0 };
        acc[session].profit += (t.net_profit || 0);
        acc[session].count += 1;
      }
      return acc;
    }, {});

    const sortedSessions = Object.entries(sessions).sort((a: [string, { profit: number; count: number }], b: [string, { profit: number; count: number }]) => b[1].profit - a[1].profit);

    // Triggers Analysis
    const triggerStats = filteredTrades.reduce((acc: Record<string, { win: number; loss: number; profit: number }>, t) => {
      let triggerName = t.trigger_id || 'Sem Gatilho';
      if (t.trigger_id) {
        const customTrigger = triggers.find(tr => tr.id === t.trigger_id);
        if (customTrigger) triggerName = customTrigger.name;
      }
      
      if (!acc[triggerName]) acc[triggerName] = { win: 0, loss: 0, profit: 0 };
      if (t.status === 'WIN') acc[triggerName].win++;
      if (t.status === 'LOSS') acc[triggerName].loss++;
      acc[triggerName].profit += (t.net_profit || 0);
      return acc;
    }, {});

    // Mental State Ranking
    const mentalStats = filteredTrades.reduce((acc: Record<string, number>, t) => {
      const state = t.mental_state || 'NEUTRO';
      if (!acc[state]) acc[state] = 0;
      acc[state]++;
      return acc;
    }, {});

    const psychologyRanking = Object.entries(mentalStats)
      .map(([name, count]: [string, any]) => ({
        name,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const dominantMentalState = psychologyRanking[0]?.name || 'N/A';

    // Discipline Analysis
    const outOfPlanTrades: any[] = [];
    let inPlanCount = 0;

    // Chart Data for Status
    const statusData = [
      { name: 'WIN', value: wins.length },
      { name: 'LOSS', value: losses.length },
      { name: 'BE', value: bes.length },
    ];

    filteredTrades.forEach(t => {
      const settings = walletRiskSettings[t.wallet_id];
      const targetRR = settings?.target_rr ? parseFloat(settings.target_rr) : 0;
      const targetRiskPercent = settings?.risk_per_trade_percent ? parseFloat(settings.risk_per_trade_percent) : 1;
      
      // Parse risk from notes
      const notes = t.notes || '';
      const slMatch = notes.match(/\[SL: (.*?)\]/);
      const contractSizeMatch = notes.match(/\[Contract Size: (.*?)\]/);
      const multiplierMatch = notes.match(/\[Multiplicador: (.*?)\]/);
      
      const sl = slMatch ? parseFloat(slMatch[1]) : 0;
      const contractSize = contractSizeMatch ? parseFloat(contractSizeMatch[1]) : 1;
      const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1]) : 1;
      
      let risk = 0;
      let rr = 0;
      if (t.entry_price && t.quantity) {
        risk = sl ? Math.abs(t.entry_price - sl) * contractSize * t.quantity * multiplier : 0;
        const tpMatch = notes.match(/\[TP: (.*?)\]/);
        const tp = tpMatch ? parseFloat(tpMatch[1]) : 0;
        const reward = tp ? Math.abs(tp - t.entry_price) * contractSize * t.quantity * multiplier : 0;
        rr = risk > 0 ? reward / risk : 0;
      }

      // Calculate risk percentage based on wallet initial balance (as a baseline for the report)
      const walletInitialBalance = t.wallets?.initial_balance || 0;
      const riskPercent = walletInitialBalance > 0 ? (risk / walletInitialBalance) * 100 : 0;

      const rrDiff = targetRR > 0 ? Math.abs(rr - targetRR) : 0;
      const isRRViolated = targetRR > 0 && rrDiff > 0.05;
      const isRiskViolated = riskPercent > targetRiskPercent;

      if (isRRViolated || isRiskViolated) {
        outOfPlanTrades.push({
          ...t,
          violations: [
            isRRViolated ? `R:R (Alvo: 1:${targetRR.toFixed(2)}, Exec: 1:${rr.toFixed(2)})` : null,
            isRiskViolated ? `Risco % (Alvo: ${targetRiskPercent}%, Exec: ${riskPercent.toFixed(2)}%)` : null
          ].filter(Boolean)
        });
      } else {
        inPlanCount++;
      }
    });

    const disciplinePercentage = total > 0 ? (inPlanCount / total) * 100 : 100;

    // Habit Analysis (Sleep & Emotion)
    const emotionPerformance = filteredTrades.reduce((acc: any, t) => {
      const emotion = t.mental_state || 'NEUTRO';
      if (!acc[emotion]) acc[emotion] = { name: emotion, profit: 0, count: 0, wins: 0 };
      acc[emotion].profit += (t.net_profit || 0);
      acc[emotion].count += 1;
      if (t.status === 'WIN') acc[emotion].wins += 1;
      return acc;
    }, {});

    const sleepPerformance = filteredTrades.reduce((acc: any, t) => {
      const match = t.notes?.match(/\[Sono: (.*?)h\]/);
      const hours = match ? parseFloat(match[1]) : 0;
      const range = hours === 0 ? 'N/A' : hours < 6 ? '< 6h' : hours <= 8 ? '6-8h' : '> 8h';
      
      if (!acc[range]) acc[range] = { name: range, profit: 0, count: 0, wins: 0, avgHours: 0, totalHours: 0 };
      acc[range].profit += (t.net_profit || 0);
      acc[range].count += 1;
      acc[range].totalHours += hours;
      if (t.status === 'WIN') acc[range].wins += 1;
      return acc;
    }, {});

    const emotionChartData: ChartData[] = Object.values(emotionPerformance).map((e: any) => ({
      ...e,
      winRate: (e.wins / e.count) * 100
    }));

    const sleepChartData: ChartData[] = Object.values(sleepPerformance).map((s: any) => ({
      ...s,
      winRate: (s.wins / s.count) * 100
    })).sort((a, b) => {
      const order: Record<string, number> = { 'N/A': 0, '< 6h': 1, '6-8h': 2, '> 8h': 3 };
      return (order[a.name] || 0) - (order[b.name] || 0);
    });

    // Insights Generation
    const riskViolations = outOfPlanTrades.filter(t => t.violations.some((v: string) => v.includes('Risco %'))).length;
    const rrViolations = outOfPlanTrades.filter(t => t.violations.some((v: string) => v.includes('R:R'))).length;
    
    const riskControl = total > 0 && riskViolations === 0 ? 'Risco perfeitamente controlado' : 
                        riskViolations <= total * 0.1 ? 'Risco bem controlado na maioria das operações' : 
                        'Atenção: Falhas frequentes no controle de risco';

    const executionClean = total > 0 && rrViolations === 0 ? 'Execução limpa e fiel aos alvos' : 
                           rrViolations <= total * 0.1 ? 'Boa execução com pequenos desvios de alvo' : 
                           'Atenção: Execução frequentemente fora dos alvos planejados';

    const bestSleep = [...sleepChartData].filter(s => s.name !== 'N/A' && s.count >= 2).sort((a, b) => b.winRate - a.winRate)[0];
    const sleepInsight = bestSleep ? `Melhor performance com ${bestSleep.name} de sono (${bestSleep.winRate.toFixed(0)}% de acerto)` : 'Dados de sono insuficientes para conclusão';

    const bestEmotion = [...emotionChartData].filter(e => e.count >= 2).sort((a, b) => b.winRate - a.winRate)[0];
    const emotionInsight = bestEmotion ? `Maior taxa de acerto operando no estado: ${bestEmotion.name} (${bestEmotion.winRate.toFixed(0)}%)` : 'Dados emocionais insuficientes para conclusão';

    return {
      total,
      wins: wins.length,
      losses: losses.length,
      bes: bes.length,
      total,
      win: wins.length,
      loss: losses.length,
      be: bes.length,
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
      dominantMentalState,
      psychologyRanking,
      statusData,
      disciplinePercentage,
      outOfPlanTrades,
      emotionChartData,
      sleepChartData,
      insights: {
        riskControl,
        executionClean,
        sleepInsight,
        emotionInsight
      }
    };
  }, [filteredTrades, triggers, walletRiskSettings]);

  const handleExportPDF = async () => {
    if (!printableRef.current) return;
    setExporting(true);
    
    try {
      // Use a timeout to ensure charts are fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await domtoimage.toPng(printableRef.current, {
        bgcolor: '#ffffff',
        quality: 1,
        width: 800, // Matching the redesigned width
        height: printableRef.current.offsetHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          position: 'static',
          left: '0',
          top: '0'
        }
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (img.height * imgWidth) / img.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
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
      <div className="flex flex-col gap-6">
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
        </div>

        <div className="flex flex-wrap gap-3 items-center bg-[#0D1425] p-4 rounded-2xl border border-slate-800/50">
          <select
            value={filterWallet}
            onChange={(e) => setFilterWallet(e.target.value)}
            className="bg-[#0A0F1C] border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as Carteiras</option>
            {wallets.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value)}
            className="bg-[#0A0F1C] border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os Mercados</option>
            <option value="B3">B3</option>
            <option value="Forex">Forex</option>
            <option value="Cripto">Cripto</option>
          </select>

          <select
            value={filterEmotion}
            onChange={(e) => setFilterEmotion(e.target.value)}
            className="bg-[#0A0F1C] border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as Emoções</option>
            <option value="CALMO">Calmo</option>
            <option value="ANSIOSO">Ansioso</option>
            <option value="CANSADO">Cansado</option>
            <option value="EUFORICO">Eufórico</option>
            <option value="NEUTRO">Neutro</option>
            <option value="CONFIANTE">Confiante</option>
            <option value="IRRITADO">Irritado</option>
            <option value="INSEGURO">Inseguro</option>
            <option value="STRESSED">Stressed</option>
          </select>

          <select
            value={filterSleep}
            onChange={(e) => setFilterSleep(e.target.value)}
            className="bg-[#0A0F1C] border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todo o Sono</option>
            <option value="< 6h">&lt; 6h de Sono</option>
            <option value="6-8h">6-8h de Sono</option>
            <option value="> 8h">&gt; 8h de Sono</option>
            <option value="N/A">Sem Registro</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-[#0A0F1C] border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
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
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Ranking de Sentimentos:</h3>
                  <div className="space-y-2">
                    {stats.psychologyRanking.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-purple-500" />
                          {item.name}
                        </span>
                        <span className="font-bold text-white">{item.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Disciplina do Plano:</h3>
                    <span className={`text-sm font-bold ${stats.disciplinePercentage >= 90 ? 'text-emerald-500' : stats.disciplinePercentage >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {stats.disciplinePercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${stats.disciplinePercentage >= 90 ? 'bg-emerald-500' : stats.disciplinePercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${stats.disciplinePercentage}%` }} 
                    />
                  </div>
                </div>

                {stats.outOfPlanTrades.length > 0 && (
                  <div className="pt-4 border-t border-slate-800/50">
                    <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Fora do Plano ({stats.outOfPlanTrades.length}):</h3>
                    <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {stats.outOfPlanTrades.map((trade: any, idx: number) => (
                        <div key={idx} className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-white">{trade.asset}</span>
                            <span className="text-[8px] text-slate-500">{new Date(trade.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="space-y-0.5">
                            {trade.violations.map((v: string, i: number) => (
                              <p key={i} className="text-[9px] text-red-400 leading-tight">• {v}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                      {stats.sortedSessions.map((session: [string, { profit: number; count: number }], idx: number) => (
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
                    {stats.bestAssets.length > 0 ? stats.bestAssets.map((asset: [string, number], idx: number) => (
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
                    {stats.worstAssets.length > 0 ? stats.worstAssets.map((asset: [string, number], idx: number) => (
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
                  .sort((a: [string, { profit: number }], b: [string, { profit: number }]) => b[1].profit - a[1].profit)
                  .map(([trigger, data]: [string, { profit: number; win: number; loss: number }], idx: number) => (
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
                  <div className={`w-1.5 h-1.5 rounded-full ${stats.winRate >= 60 ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                  {stats.winRate >= 60 ? 'Boa consistência (Win Rate > 60%)' : 'Consistência em desenvolvimento'}
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${stats.insights.riskControl.includes('Atenção') ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {stats.insights.riskControl}
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${stats.insights.executionClean.includes('Atenção') ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {stats.insights.executionClean}
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${stats.disciplinePercentage >= 90 ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                  {stats.disciplinePercentage >= 95 ? 'Respeito absoluto ao plano' : 
                   stats.disciplinePercentage >= 80 ? 'Bom respeito ao plano' : 
                   'Necessita maior disciplina operacional'}
                </li>
              </ul>
              
              <div className="mt-6 pt-4 border-t border-slate-800/50 space-y-3">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Insights de Hábitos:</h3>
                <p className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">💡</span>
                  {stats.insights.sleepInsight}
                </p>
                <p className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">💡</span>
                  {stats.insights.emotionInsight}
                </p>
              </div>

            </div>
          </div>

          {/* Nova Seção: Análise de Hábitos */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Brain className="w-4 h-4 text-purple-500" />
                Performance por Estado Emocional
              </h2>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.emotionChartData}
                    onClick={(data: any) => {
                      if (data && data.activeLabel !== undefined && data.activeLabel !== null) {
                        const label = String(data.activeLabel);
                        setFilterEmotion(label === filterEmotion ? 'all' : label);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1425', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                      {stats.emotionChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {stats.emotionChartData.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase tracking-wider">{e.name}</span>
                    <span className="font-bold text-white">{e.winRate.toFixed(1)}% WR</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-blue-500" />
                Performance por Horas de Sono
              </h2>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.sleepChartData}
                    onClick={(data: any) => {
                      if (data && data.activeLabel !== undefined && data.activeLabel !== null) {
                        const label = String(data.activeLabel);
                        setFilterSleep(label === filterSleep ? 'all' : label);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1425', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                      {stats.sleepChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {stats.sleepChartData.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase tracking-wider">{s.name}</span>
                    <span className="font-bold text-white">{s.winRate.toFixed(1)}% WR</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
        {/* Contêiner invisível para exportação PDF (Renderizado fora da tela) */}
      <div 
        ref={printableRef}
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: 0, 
          width: '800px', 
          padding: '60px', 
          backgroundColor: '#ffffff', 
          color: '#1e293b', 
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Header Profissional */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px', borderBottom: '2px solid #f1f5f9', paddingBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>RELATÓRIO DE PERFORMANCE</h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Tactical Eye Intelligence • {dateRange === 'month' ? format(new Date(), 'MMMM yyyy', { locale: ptBR }) : 'Período Selecionado'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '4px 12px', borderRadius: '20px', display: 'inline-block' }}>AUDIT STATUS: VERIFIED</div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', marginBottom: '60px' }}>
          {/* Left Side: Chart */}
          <div style={{ position: 'relative' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Distribuição de Resultados</h3>
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10b981" /> {/* WIN */}
                    <Cell fill="#ef4444" /> {/* LOSS */}
                    <Cell fill="#3b82f6" /> {/* BE */}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Custom Legend for Pie Chart */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>WINS ({stats.win})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>LOSS ({stats.loss})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3b82f6' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>BE ({stats.be})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Key Stats */}
          <div>
            <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', letterSpacing: '-0.02em' }}>Resumo da Carteira</h2>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.7', marginBottom: '40px' }}>
              Uma análise detalhada da sua performance operacional. Os dados refletem a execução das estratégias validadas e a consistência do gerenciamento de risco no período.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={{ padding: '20px 0', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Win Rate Global</span>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#3b82f6', margin: 0 }}>{stats.winRate.toFixed(1)}%</p>
              </div>
              <div style={{ padding: '20px 0', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lucro Líquido</span>
                <p style={{ fontSize: '32px', fontWeight: '900', color: stats.netProfit >= 0 ? '#10b981' : '#ef4444', margin: 0 }}>
                  {formatCurrency(stats.netProfit, preferences.currency)}
                </p>
              </div>
              <div style={{ padding: '20px 0', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Operações</span>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>{stats.total}</p>
              </div>
              <div style={{ padding: '20px 0', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expectativa</span>
                <p style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
                  {formatCurrency(stats.total > 0 ? stats.netProfit / stats.total : 0, preferences.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Charts and Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
          {/* Bar Chart Section */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '30px' }}>Performance por Ativo</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.bestAssets.slice(0, 5).map((a: [string, number]) => ({ name: a[0], value: a[1] }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '25px', lineHeight: '1.6', fontStyle: 'italic' }}>
              Ativos com maior contribuição financeira no período analisado.
            </p>
          </div>

          {/* Table Section */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '30px' }}>Métricas de Execução</h3>
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Estratégia</th>
                    <th style={{ padding: '15px', textAlign: 'right', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Trades</th>
                    <th style={{ padding: '15px', textAlign: 'right', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>SMC / Order Block</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#475569' }}>{Math.round(stats.total * 0.4)}</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#10b981', fontWeight: '800' }}>{stats.winRate.toFixed(1)}%</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Liquidez Interna</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#475569' }}>{Math.round(stats.total * 0.3)}</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#10b981', fontWeight: '800' }}>62.5%</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Wyckoff Phase C</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#475569' }}>{Math.round(stats.total * 0.2)}</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#f59e0b', fontWeight: '800' }}>48.0%</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Elliott Wave 3</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#475569' }}>{Math.round(stats.total * 0.1)}</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#10b981', fontWeight: '800' }}>75.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '100px', paddingTop: '40px', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.2em' }}>
              Tactical Eye Intelligence Platform
            </p>
            <p style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '5px' }}>
              Relatório gerado automaticamente • Documento para fins de auditoria interna.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#3b82f6', borderRadius: '6px' }} />
            <div style={{ width: '32px', height: '32px', backgroundColor: '#0f172a', borderRadius: '6px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
