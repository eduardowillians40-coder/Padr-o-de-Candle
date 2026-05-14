import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { calculateTradingMetrics } from './metrics_engine';
import { Trade, Wallet } from '../lib/types';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Idealmente Service Role para scripts de agente

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateReport(userId: string, walletId?: string) {
  console.log(`🚀 Iniciando geração de relatório para usuário: ${userId}`);

  // 1. Buscar Carteiras
  let walletQuery = supabase.from('wallets').select('*').eq('user_id', userId);
  if (walletId) walletQuery = walletQuery.eq('id', walletId);
  const { data: wallets, error: wError } = await walletQuery;

  if (wError || !wallets) {
    console.error('❌ Erro ao buscar carteiras:', wError);
    return;
  }

  // 2. Buscar Trades
  let tradeQuery = supabase.from('trades').select('*').eq('user_id', userId).order('created_at', { ascending: true });
  if (walletId) tradeQuery = tradeQuery.eq('wallet_id', walletId);
  const { data: trades, error: tError } = await tradeQuery;

  if (tError || !trades) {
    console.error('❌ Erro ao buscar trades:', tError);
    return;
  }

  // 3. Processar Métricas usando o Engine DOE
  const stats = calculateTradingMetrics(trades as Trade[], wallets as Wallet[], { currency: 'BRL' });

  // 4. Formatar Relatório Markdown
  const reportContent = `
# Relatório de Performance de Trading - DOE Framework
**Data de Geração:** ${new Date().toLocaleString('pt-BR')}
**Escopo:** ${walletId ? `Carteira ${wallets[0]?.name}` : 'Todas as Carteiras'}

## 📊 Resumo de Performance
| Métrica | Valor |
| :--- | :--- |
| **Total de Trades** | ${stats.totalTrades} |
| **Taxa de Acerto (Win Rate)** | ${stats.winRate.toFixed(2)}% |
| **Lucro Líquido** | R$ ${stats.profitNet.toFixed(2)} |
| **Lucro Bruto** | R$ ${stats.profitGross.toFixed(2)} |
| **Taxas Totais** | R$ ${stats.fees.toFixed(2)} |
| **Relação Risco/Retorno (RR)** | ${stats.rr.toFixed(2)} |
| **Drawdown Máximo** | ${stats.drawdown.toFixed(2)}% |
| **Metas Batidas** | ${stats.goalsMet} |

## 📈 Últimos 10 Trades
| Data | Ativo | Tipo | Resultado (R$) | Status |
| :--- | :--- | :--- | :--- | :--- |
${trades.slice(-10).reverse().map((t: any) => {
  const date = new Date(t.created_at).toLocaleDateString('pt-BR');
  return `| ${date} | ${t.asset} | ${t.type} | ${t.net_profit?.toFixed(2)} | ${t.status} |`;
}).join('\n')}

---
*Gerado automaticamente pelo Agente Antigravity via Execution Layer.*
`;

  // 5. Salvar em .tmp/
  const fileName = `relatorio_${userId}_${Date.now()}.md`;
  const filePath = path.join(process.cwd(), '.tmp', fileName);
  
  if (!fs.existsSync(path.join(process.cwd(), '.tmp'))) {
    fs.mkdirSync(path.join(process.cwd(), '.tmp'));
  }

  fs.writeFileSync(filePath, reportContent);
  console.log(`✅ Relatório gerado com sucesso em: ${filePath}`);
  return filePath;
}

// Exemplo de execução (pode ser disparado pelo Orquestrador)
// const args = process.argv.slice(2);
// if (args[0]) generateReport(args[0], args[1]);

export { generateReport };
