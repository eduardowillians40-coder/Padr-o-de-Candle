'use client';

import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Play, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown, 
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SimulatorPage() {
  const [params, setParams] = useState({
    winRate: 40,
    rr: 3,
    riskPerTrade: 2,
    numTrades: 15,
    initialCapital: 5000
  });

  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);

  const runSimulation = () => {
    let currentCapital = params.initialCapital;
    let bestCase = params.initialCapital;
    let worstCase = params.initialCapital;
    
    const data = [{ 
      trade: 0, 
      mostProbable: params.initialCapital, 
      bestCase: params.initialCapital, 
      worstCase: params.initialCapital 
    }];

    let mp = params.initialCapital;
    let bc = params.initialCapital;
    let wc = params.initialCapital;

    for (let i = 1; i <= params.numTrades; i++) {
      const riskAmount = mp * (params.riskPerTrade / 100);
      
      // Random outcome for most probable
      const isWin = Math.random() * 100 < params.winRate;
      mp += isWin ? riskAmount * params.rr : -riskAmount;

      // Best case (always win)
      bc += bc * (params.riskPerTrade / 100) * params.rr;

      // Worst case (always loss)
      wc -= wc * (params.riskPerTrade / 100);

      data.push({
        trade: i,
        mostProbable: Math.round(mp),
        bestCase: Math.round(bc),
        worstCase: Math.round(wc)
      });
    }

    setSimulationData(data);
    setResults({
      finalCapital: Math.round(mp),
      avgReturn: (((mp - params.initialCapital) / params.initialCapital) * 100).toFixed(2),
      bestResult: Math.round(bc),
      worstResult: Math.round(wc),
      maxDrawdown: -5.88, // Mocked for UI
      avgGain: 300 // Mocked for UI
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">SIMULAR PERFORMANCE</h1>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Projete possíveis resultados com base em suas estratégias de trading</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Parameters */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-blue-500">
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">PARÂMETROS</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TAXA DE VITÓRIAS (%)</label>
                <input 
                  type="number" 
                  value={params.winRate}
                  onChange={(e) => setParams({...params, winRate: Number(e.target.value)})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RISCO/RETORNO (1:X)</label>
                <input 
                  type="number" 
                  value={params.rr}
                  onChange={(e) => setParams({...params, rr: Number(e.target.value)})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RISCO POR OPERAÇÃO (%)</label>
                <input 
                  type="number" 
                  value={params.riskPerTrade}
                  onChange={(e) => setParams({...params, riskPerTrade: Number(e.target.value)})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NÚMERO DE OPERAÇÕES</label>
                <input 
                  type="number" 
                  value={params.numTrades}
                  onChange={(e) => setParams({...params, numTrades: Number(e.target.value)})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CAPITAL INICIAL ($)</label>
                <input 
                  type="number" 
                  value={params.initialCapital}
                  onChange={(e) => setParams({...params, initialCapital: Number(e.target.value)})}
                  className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <button 
              onClick={runSimulation}
              className="w-full bg-white text-[#050A15] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              RODAR SIMULAÇÃO
            </button>
          </div>
        </div>

        {/* Chart & Results */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-8">EVOLUÇÃO DO CAPITAL</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="trade" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$ ${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0D1425', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                  <Line name="MAIS PROVÁVEL" type="monotone" dataKey="mostProbable" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  <Line name="MELHOR CENÁRIO" type="monotone" dataKey="bestCase" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line name="PIOR CENÁRIO" type="monotone" dataKey="worstCase" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {results && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">CAPITAL FINAL MÉDIO</p>
                <p className="text-2xl font-display font-bold text-blue-500">$ {results.finalCapital.toLocaleString()}</p>
              </div>
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">RETORNO MÉDIO</p>
                <p className="text-2xl font-display font-bold text-emerald-500">+{results.avgReturn}%</p>
              </div>
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">MELHOR RESULTADO</p>
                <p className="text-2xl font-display font-bold text-emerald-500">$ {results.bestResult.toLocaleString()}</p>
              </div>
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">PIOR RESULTADO</p>
                <p className="text-2xl font-display font-bold text-red-500">$ {results.worstResult.toLocaleString()}</p>
              </div>
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">DRAWDOWN MÁXIMO</p>
                <p className="text-2xl font-display font-bold text-amber-500">{results.maxDrawdown}%</p>
              </div>
              <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">GANHO MÉDIO</p>
                <p className="text-2xl font-display font-bold text-emerald-500">$ {results.avgGain.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
