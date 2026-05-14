import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface ComplianceResult {
  itemName: string;
  totalTrades: number;
  followedCount: number;
  complianceRate: number;
  winRateWhenFollowed: number;
  winRateWhenNotFollowed: number;
}

/**
 * DOE Framework - Execution Layer
 * Analyzes trade compliance with strategy checklist items.
 */
async function analyzeStrategyCompliance(userId: string, strategyId: string) {
  console.log(`🔍 Analisando conformidade da estratégia para o usuário: ${userId}`);

  // 1. Buscar itens do checklist da estratégia
  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, text, step_id(name)')
    .eq('step_id.strategy_id', strategyId);

  if (!items) return null;

  // 2. Buscar trades que utilizaram essa estratégia
  // Nota: Precisamos buscar trades filtrando pelo nome da estratégia (ou id se adicionarmos na tabela trades)
  // Por enquanto o app usa 'strategy' como texto na tabela trades.
  const { data: strategyData } = await supabase.from('strategies').select('name').eq('id', strategyId).single();
  const strategyName = strategyData?.name;

  const { data: trades } = await supabase
    .from('trades')
    .select('id, status')
    .eq('user_id', userId)
    .eq('strategy', strategyName);

  if (!trades || trades.length === 0) {
    console.log('⚠️ Nenhum trade encontrado para esta estratégia.');
    return null;
  }

  const tradeIds = trades.map(t => t.id);

  // 3. Buscar respostas do checklist
  const { data: responses } = await supabase
    .from('trade_checklist_responses')
    .select('*')
    .in('trade_id', tradeIds);

  const results: ComplianceResult[] = items.map((item: any) => {
    const itemResponses = responses?.filter(r => r.item_id === item.id) || [];
    const followed = itemResponses.filter(r => r.is_checked);
    
    // Calcular correlação com WIN
    const tradesFollowed = trades.filter(t => itemResponses.find(r => r.trade_id === t.id)?.is_checked);
    const tradesNotFollowed = trades.filter(t => !itemResponses.find(r => r.trade_id === t.id)?.is_checked);
    
    const winRateFollowed = tradesFollowed.length > 0 
      ? (tradesFollowed.filter(t => t.status === 'WIN').length / tradesFollowed.length) * 100 
      : 0;
      
    const winRateNotFollowed = tradesNotFollowed.length > 0 
      ? (tradesNotFollowed.filter(t => t.status === 'WIN').length / tradesNotFollowed.length) * 100 
      : 0;

    return {
      itemName: item.text,
      totalTrades: trades.length,
      followedCount: followed.length,
      complianceRate: (followed.length / trades.length) * 100,
      winRateWhenFollowed: winRateFollowed,
      winRateWhenNotFollowed: winRateNotFollowed
    };
  });

  return results;
}

export { analyzeStrategyCompliance };
