'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Trash2, Save } from 'lucide-react';

export default function EditStrategyPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id } = useParams();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<any[]>([]);

  useEffect(() => {
    const fetchStrategy = async () => {
      const { data: strategy } = await supabase.from('strategies').select('*').eq('id', id).single();
      if (strategy) {
        setName(strategy.name);
        setDescription(strategy.description);
        
        const { data: stepsData } = await supabase.from('strategy_steps').select('*, checklist_items(*)').eq('strategy_id', id).order('order_index');
        setSteps(stepsData?.map((s: any) => ({
          ...s,
          checklist: s.checklist_items.map((i: any) => i.text)
        })) || []);
      }
    };
    fetchStrategy();
  }, [supabase, id]);

  const saveStrategy = async () => {
    await supabase.from('strategies').update({ name, description }).eq('id', id);
    // Para simplificar, vamos deletar os passos antigos e recriar
    await supabase.from('strategy_steps').delete().eq('strategy_id', id);
    
    for (let i = 0; i < steps.length; i++) {
      const { data: step } = await supabase.from('strategy_steps').insert({ strategy_id: id, name: steps[i].name, order_index: i }).select().single();
      if (step) {
        for (let j = 0; j < steps[i].checklist.length; j++) {
          await supabase.from('checklist_items').insert({ step_id: step.id, text: steps[i].checklist[j], order_index: j });
        }
      }
    }
    router.push('/tools/strategies');
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Editar Estratégia</h1>
      <input className="w-full bg-[#0D1425] border border-slate-800 p-3 rounded-lg text-white" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea className="w-full bg-[#0D1425] border border-slate-800 p-3 rounded-lg text-white" value={description} onChange={(e) => setDescription(e.target.value)} />
      
      {steps.map((step, stepIndex) => (
        <div key={stepIndex} className="bg-[#0D1425] p-6 rounded-xl border border-slate-800 space-y-4">
          <input className="w-full bg-transparent border-b border-slate-700 p-2 text-white font-bold" value={step.name} onChange={(e) => {
            const newSteps = [...steps];
            newSteps[stepIndex].name = e.target.value;
            setSteps(newSteps);
          }} />
          {step.checklist.map((item: string, itemIndex: number) => (
            <input key={itemIndex} className="w-full bg-[#050A15] border border-slate-800 p-2 rounded text-sm text-white" value={item} onChange={(e) => {
              const newSteps = [...steps];
              newSteps[stepIndex].checklist[itemIndex] = e.target.value;
              setSteps(newSteps);
            }} />
          ))}
          <button onClick={() => {
            const newSteps = [...steps];
            newSteps[stepIndex].checklist.push('');
            setSteps(newSteps);
          }} className="text-blue-500 text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Adicionar Item
          </button>
        </div>
      ))}
      <button onClick={() => setSteps([...steps, { name: '', checklist: [''] }])} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">Adicionar Passo</button>
      <button onClick={saveStrategy} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
        <Save className="w-4 h-4" /> Salvar Alterações
      </button>
    </div>
  );
}
