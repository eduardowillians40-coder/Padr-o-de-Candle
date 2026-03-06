'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: '04/11', value: 1000 },
  { name: '05/11', value: 1940 },
  { name: '06/11', value: 1800 },
  { name: '07/11', value: 2500 },
  { name: '08/11', value: 2300 },
  { name: '09/11', value: 3100 },
  { name: '10/11', value: 2900 },
];

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    profitNet: 0,
    profitGross: 0,
    fees: 0,
    initialBalance: 0,
    rr: 0,
    drawdown: 0,
    walletsCount: 0,
    beCount: 0
  });

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Wallets
      const { data: wallets } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);

      // Fetch Trades
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id);

      if (wallets && trades) {
        const initialBalance = wallets.reduce((acc, w) => acc + w.initial_balance, 0);
        const profitNet = trades.reduce((acc, t) => acc + (t.net_profit || 0), 0);
        const fees = trades.reduce((acc, t) => acc + (t.fees || 0), 0);
        const wins = trades.filter(t => t.status === 'WIN').length;
        const losses = trades.filter(t => t.status === 'LOSS').length;
        const be = trades.filter(t => t.status === 'BE').length;
        const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

        setStats({
          totalTrades: trades.length,
          winRate,
          profitNet,
          profitGross: profitNet + fees,
          fees,
          initialBalance,
          rr: 0, 
          drawdown: 0,
          walletsCount: wallets.length,
          beCount: be
        });
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [supabase, refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Wallets Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">CARTEIRAS</h3>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{stats.walletsCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">ABERTAS</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">METAS</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">QUEBRADAS</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button className="py-2 text-xs font-bold text-slate-400 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all">LISTAR TODAS</button>
            <button className="py-2 text-xs font-bold text-slate-400 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all">CRIAR NOVA</button>
          </div>
        </motion.div>

        {/* Total Balance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4">
            <Zap className="w-6 h-6 text-emerald-500/20" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Saldo Total</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Saldo do Período</span>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">SALDO LÍQUIDO (APÓS TAXAS)</p>
          <h2 className="text-4xl font-display font-bold text-emerald-500">R$ {stats.profitNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500 uppercase">Saldo Bruto:</span>
              <span className="text-white">R$ {stats.profitGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500 uppercase">Taxas Pagas:</span>
              <span className="text-red-500">-R$ {stats.fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500 uppercase">Inicial:</span>
              <span className="text-white">R$ {stats.initialBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] font-bold">
              <span className="text-emerald-500 uppercase">Resultado:</span>
              <span className="text-emerald-500">+R$ {stats.profitNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (29.15%)</span>
            </div>
          </div>
        </motion.div>

        {/* Total Operations */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">TOTAL DE OPERAÇÕES</h3>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">TOTAL</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-500">{stats.totalTrades > 0 ? Math.round(stats.totalTrades * (stats.winRate / 100)) : 0}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">WIN</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{stats.totalTrades > 0 ? Math.round(stats.totalTrades * (1 - stats.winRate / 100)) : 0}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">LOSS</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{stats.beCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">BE</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button className="py-2 text-xs font-bold text-slate-400 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all">VER TODAS</button>
            <button className="py-2 text-xs font-bold text-slate-400 border border-slate-800 rounded-lg hover:bg-slate-800 transition-all">REGISTRAR NOVA</button>
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              TAXA DE ACERTO <span className="text-slate-600 text-lg">?</span>
            </h4>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-display font-bold text-blue-500">{stats.winRate.toFixed(1)}%</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">VS PERÍODO ANTERIOR</p>
          <div className="h-1 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${stats.winRate}%` }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              RELAÇÃO LUCRO/PERDA <span className="text-slate-600 text-lg">?</span>
            </h4>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-display font-bold text-amber-500">{stats.rr.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">VS PERÍODO ANTERIOR</p>
          <div className="h-1 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: '100%' }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0D1425] border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              DRAWDOWN MÁXIMO <span className="text-slate-600 text-lg">?</span>
            </h4>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-display font-bold text-red-500">{stats.drawdown.toFixed(2)}%</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">VS PERÍODO ANTERIOR</p>
          <div className="h-1 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: '20%' }} />
          </div>
        </motion.div>
      </div>

      {/* Main Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="font-display font-bold text-white uppercase tracking-widest">EVOLUÇÃO DO SALDO</h3>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0D1425', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0D1425' }}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
