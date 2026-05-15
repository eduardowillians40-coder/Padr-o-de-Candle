import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { stats, userId } = await req.json();
    const supabase = createClient();

    // 1. Fetch User AI Config
    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_provider, gemini_api_key, claude_api_key, openai_api_key')
      .eq('id', userId)
      .single();

    const provider = profile?.ai_provider || 'gemini';
    let apiKey = '';

    if (provider === 'gemini') {
      apiKey = profile?.gemini_api_key || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    } else if (provider === 'claude') {
      apiKey = profile?.claude_api_key || process.env.CLAUDE_API_KEY || '';
    } else if (provider === 'openai') {
      apiKey = profile?.openai_api_key || process.env.OPENAI_API_KEY || '';
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Chave de API não configurada.' }, { status: 400 });
    }

    // 2. Prepare Prompt
    const prompt = `
      Você é um mentor especialista em trading e análise de performance de alta performance (Prop Firm Style).
      Analise as estatísticas abaixo e forneça um diagnóstico detalhado, prático e direto ao ponto.
      Foque em: Disciplina, Gerenciamento de Risco, Melhores Horários e Padrões de Sucesso/Falha.

      ESTATÍSTICAS DO PERÍODO:
      - Saldo Líquido: ${stats.netProfit || 0}
      - Win Rate: ${(stats.winRate || 0).toFixed(2)}%
      - Total de Operações: ${stats.total || 0} (Vencidas: ${stats.wins || 0}, Perdidas: ${stats.losses || 0})
      - Fator de Lucro (Payoff): ${(stats.payoff || stats.profitFactor || 0).toFixed(2)}
      - Aderência ao Plano: ${(stats.disciplinePercentage || 0).toFixed(2)}%
      - Melhores Ativos: ${JSON.stringify(stats.bestAssets || [])}
      - Horários Mais Eficientes: ${JSON.stringify(stats.bestEntryHours || [])}
      - Gatilhos Mais Lucrativos: ${JSON.stringify((stats.triggerStats || []).slice(0, 3))}

      FORMATO DA RESPOSTA:
      Use Markdown. Seja encorajador mas crítico. Use tópicos.
      Inclua uma seção final "PRÓXIMOS PASSOS" com 3 ações práticas.
    `;

    // 3. Call AI Provider
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      try {
        // Try the latest flash model first
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return NextResponse.json({ text });
      } catch (geminiError: any) {
        // Fallback to stable gemini-pro if flash is not available
        if (geminiError.message?.includes('404') || geminiError.message?.includes('not found')) {
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await fallbackModel.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          return NextResponse.json({ text });
        }
        throw geminiError;
      }
    }

    // Placeholder for other providers (implementing logic if keys exist)
    if (provider === 'claude' || provider === 'openai') {
      return NextResponse.json({ error: `O provedor ${provider} ainda está em fase de integração. Por favor, use o Gemini.` }, { status: 400 });
    }

    return NextResponse.json({ error: 'Provedor inválido.' }, { status: 400 });

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno na análise de IA.' }, { status: 500 });
  }
}
