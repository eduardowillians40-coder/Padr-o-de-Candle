import { Trade, Wallet } from '../lib/types';

export interface DashboardStats {
  totalTrades: number;
  winRate: number;
  profitNet: number;
  profitGross: number;
  fees: number;
  initialBalance: number;
  profitPercentage: number;
  rr: number;
  drawdown: number;
  walletsCount: number;
  goalsMet: number;
  beCount: number;
  chartData: { name: string; value: number }[];
}

/**
 * DOE Framework - Execution Layer
 * Deterministic engine for trading metrics calculation.
 */
export function calculateTradingMetrics(trades: Trade[], wallets: Wallet[], preferences: { currency: string }): DashboardStats {
  const initialBalance = wallets.reduce((acc: number, w: any) => acc + (w.initial_balance || 0), 0);
  const profitNet = trades.reduce((acc: number, t: any) => acc + (t.net_profit || 0), 0);
  const fees = trades.reduce((acc: number, t: any) => acc + (t.fees || 0), 0);
  
  const winningTrades = trades.filter((t: any) => t.status === 'WIN');
  const losingTrades = trades.filter((t: any) => t.status === 'LOSS');
  const wins = winningTrades.length;
  const losses = losingTrades.length;
  const be = trades.filter((t: any) => t.status === 'BE').length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  // Calculate Goals Met
  const goalsMet = wallets.filter((w: any) => {
    const walletTrades = trades.filter((t: any) => t.wallet_id === w.id);
    const walletProfit = walletTrades.reduce((acc: number, t: any) => acc + (t.net_profit || 0), 0);
    const walletBalance = (w.initial_balance || 0) + walletProfit;
    return w.meta_value && walletBalance >= w.meta_value;
  }).length;

  // Calculate RR (Risk/Reward)
  const avgWin = wins > 0 ? winningTrades.reduce((acc: number, t: any) => acc + (t.gross_profit || 0), 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(losingTrades.reduce((acc: number, t: any) => acc + (t.gross_profit || 0), 0)) / losses : 0;
  const rr = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? avgWin : 0);

  // Calculate Drawdown and Equity Curve
  let currentEquity = initialBalance;
  let peakEquity = initialBalance;
  let maxDrawdown = 0;
  
  // Sort trades by date
  const sortedTrades = [...trades].sort((a: any, b: any) => {
    const dateA = new Date(a.entry_time || a.created_at);
    const dateB = new Date(b.entry_time || b.created_at);
    return dateA.getTime() - dateB.getTime();
  });

  const chartData: { name: string; value: number }[] = [];
  chartData.push({
    name: 'Início',
    value: initialBalance
  });

  let runningEquity = initialBalance;
  sortedTrades.forEach((t: any) => {
    runningEquity += (t.net_profit || 0);
    
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    
    const currentDrawdown = peakEquity > 0 ? ((peakEquity - runningEquity) / peakEquity) * 100 : 0;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
    
    const date = new Date(t.entry_time || t.created_at);
    const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const lastPoint = chartData[chartData.length - 1];
    if (lastPoint.name === dateStr) {
      lastPoint.value = runningEquity;
    } else {
      chartData.push({
        name: dateStr,
        value: runningEquity
      });
    }
  });

  return {
    totalTrades: trades.length,
    winRate,
    profitNet,
    profitGross: profitNet + fees,
    fees,
    initialBalance,
    profitPercentage: initialBalance > 0 ? (profitNet / initialBalance) * 100 : 0,
    rr,
    drawdown: maxDrawdown,
    walletsCount: wallets.length,
    goalsMet,
    beCount: be,
    chartData
  };
}
