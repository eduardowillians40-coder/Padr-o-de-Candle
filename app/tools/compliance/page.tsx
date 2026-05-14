'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Brain,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';
import { motion } from 'motion/react';
import { useUserPreferences } from '@/app/context/UserPreferencesContext';
import { Trade } from '@/lib/types';

interface ChecklistResponse {
  id: string;
  trade_id: string;
  item_id: string;
  is_checked: boolean;
  created_at: string;
}

interface ComplianceResult {
  itemName: string;
  totalTrades: number;
  followedCount: number;
  complianceRate: number;
  winRateWhenFollowed: number;
  winRateWhenNotFollowed: number;
  profitContribution?: number;
}

interface Strategy {
  id: string;
  name: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  step_id: {
    name: string;
    strategy_id: string;
  };
}

export default function ComplianceDashboard() {
  const { preferences } = useUserPreferences();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [results, setResults] = useState<ComplianceResult[]>([]);
  const [summary, setSummary] = useState({
    avgCompliance: 0,
    mostIgnored: '',
    mostReliable: '',
    opportunityCost: 0
  });

  useEffect(() => {
    const fetchStrategies = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (data && data.length > 0) {
        setStrategies(data);
        setSelectedStrategy(data[0].id);
      }
      setLoading(false);
    };

    fetchStrategies();
  }, [supabase]);

  useEffect(() => {
    if (!selectedStrategy) return;

    const analyzeCompliance = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Buscar itens do checklist
      const { data: items } = await supabase
        .from('checklist_items')
        .select(`
          id, 
          text, 
          step_id!inner (
            name,
            strategy_id
          )
        `)
      const items = (itemsData || []) as unknown as ChecklistItem[];

      if (items.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // 2. Buscar trades desta estratégia
      const strategyName = strategies.find(s => s.id === selectedStrategy)?.name;
      const { data: tradesData } = await supabase
        .from('trades')
        .select('id, status, net_profit')
        .eq('user_id', user.id)
        .eq('strategy', strategyName);

      const trades = (tradesData || []) as Partial<Trade>[];

      if (trades.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const tradeIds = trades.map(t => t.id);

      // 3. Buscar respostas
      const { data: responsesData } = await supabase
        .from('trade_checklist_responses')
        .select('*')
        .in('trade_id', tradeIds);
      
      const responses = (responsesData || []) as ChecklistResponse[];

      const complianceResults: ComplianceResult[] = items.map((item) => {
        const itemResponses = responses.filter(r => r.item_id === item.id);
        const followed = itemResponses.filter(r => r.is_checked);
        
        const tradesFollowed = trades.filter(t => itemResponses.find(r => r.trade_id === t.id)?.is_checked);
        const tradesNotFollowed = trades.filter(t => {
          const resp = itemResponses.find(r => r.trade_id === t.id);
          return resp && !resp.is_checked;
        });
        
        const winRateFollowed = tradesFollowed.length > 0 
          ? (tradesFollowed.filter(t => t.status === 'WIN').length / tradesFollowed.length) * 100 
          : 0;
          
        const winRateNotFollowed = tradesNotFollowed.length > 0 
          ? (tradesNotFollowed.filter(t => t.status === 'WIN').length / tradesNotFollowed.length) * 100 
          : 0;

        return {
          itemName: item.text,
          totalTrades: itemResponses.length,
          followedCount: followed.length,
          complianceRate: itemResponses.length > 0 ? (followed.length / itemResponses.length) * 100 : 0,
          winRateWhenFollowed: winRateFollowed,
          winRateWhenNotFollowed: winRateNotFollowed
        };
      });

      setResults(complianceResults);

      // Calcular sumário
      if (complianceResults.length > 0) {
        const avg = complianceResults.reduce((acc, curr) => acc + curr.complianceRate, 0) / complianceResults.length;
        const sortedByCompliance = [...complianceResults].sort((a, b) => a.complianceRate - b.complianceRate);
        const sortedByWinRate = [...complianceResults].sort((a, b) => b.winRateWhenFollowed - a.winRateWhenFollowed);

        setSummary({
          avgCompliance: avg,
          mostIgnored: sortedByCompliance[0]?.itemName || 'N/A',
          mostReliable: sortedByWinRate[0]?.itemName || 'N/A',
          opportunityCost: 0 
        });
      }

      setLoading(false);
    };

    analyzeCompliance();
  }, [selectedStrategy, strategies, supabase]);

  if (loading && strategies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            Auditoria de Conformidade (DOE)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Analise a correlação entre sua disciplina operacional e seus resultados financeiros.
          </p>
        </div>

        <select 
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value)}
          className="bg-[#0D1425] border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {strategies.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-12 text-center">
          <Brain className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Dados insuficientes</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Você precisa registrar trades usando esta estratégia e preencher o checklist de conformidade para ver a análise.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Índice de Disciplina</p>
              <h3 className={`text-3xl font-bold ${summary.avgCompliance >= 80 ? 'text-emerald-500' : summary.avgCompliance >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {summary.avgCompliance.toFixed(1)}%
              </h3>
              <p className="text-xs text-slate-500 mt-2">Média de todas as regras</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Ponto Cego (Mais Ignorada)</p>
              <h3 className="text-lg font-bold text-red-400 line-clamp-1">{summary.mostIgnored}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                Requer atenção imediata
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Vantagem (Mais Eficaz)</p>
              <h3 className="text-lg font-bold text-emerald-400 line-clamp-1">{summary.mostReliable}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Regra de alta convicção
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Status da Auditoria</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-bold text-white">CONFORMIDADE ATIVA</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Analisando {results[0]?.totalTrades} trades</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart: Compliance per Rule */}
            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-8">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                Aderência às Regras da Estratégia
              </h2>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="itemName" 
                      type="category" 
                      stroke="#64748b" 
                      fontSize={10} 
                      width={100}
                      tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1425', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="complianceRate" radius={[0, 4, 4, 0]} barSize={20}>
                      {results.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.complianceRate >= 80 ? '#10b981' : entry.complianceRate >= 50 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Profitability Impact */}
            <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-8">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Impacto no Win Rate (Seguiu vs. Não Seguiu)
              </h2>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="itemName" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                    />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}%`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1425', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    <Bar name="Seguiu a Regra" dataKey="winRateWhenFollowed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar name="Ignorou a Regra" dataKey="winRateWhenNotFollowed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Analysis & Advice */}
          <div className="bg-[#0D1425] border border-slate-800 rounded-3xl p-8">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <Brain className="w-5 h-5 text-purple-500" />
              Insights do Consultor (Framework DOE)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Diagnóstico Operacional</h4>
                <div className="space-y-3">
                  {results.filter(r => r.complianceRate < 50).map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-400">Disciplina Crítica: {r.itemName}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Você ignora esta regra em {(100 - r.complianceRate).toFixed(0)}% das vezes.
                          {r.winRateWhenFollowed > r.winRateWhenNotFollowed && ` Seguir esta regra aumentaria seu Win Rate em ${(r.winRateWhenFollowed - r.winRateWhenNotFollowed).toFixed(1)}%.`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {results.filter(r => r.complianceRate >= 80).map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-emerald-400">Ponto de Força: {r.itemName}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Excelente consistência. Esta regra é o pilar da sua estratégia atual.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-bold text-blue-400 uppercase">Sugestão do Consultor</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "Observando os dados da estratégia <strong>{strategies.find(s => s.id === selectedStrategy)?.name}</strong>, 
                  vejo que seu maior gargalo de lucro está em <strong>{summary.mostIgnored}</strong>. 
                  Minha sugestão é focar exclusivamente em validar esta regra nos próximos 10 trades, 
                  mesmo que isso signifique operar menos. A conformidade é o único caminho para a escalabilidade."
                </p>
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Próximo Passo Recomendado:</p>
                  <p className="text-xs text-slate-400">
                    Ative o modo 'Foco em Disciplina' e use o checklist em tempo real antes de cada clique no gráfico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
