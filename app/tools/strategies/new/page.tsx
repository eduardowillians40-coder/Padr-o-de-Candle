'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save } from 'lucide-react';

export default function NewStrategyPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([{ name: '', checklist: [''] }]);

  const addStep = () => setSteps([...steps, { name: '', checklist: [''] }]);
  
  const updateStepName = (index: number, name: string) => {
    const newSteps = [...steps];
    newSteps[index].name = name;
    setSteps(newSteps);
  };

  const addItem = (stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].checklist.push('');
    setSteps(newSteps);
  };

  const updateItem = (stepIndex: number, itemIndex: number, text: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].checklist[itemIndex] = text;
    setSteps(newSteps);
  };

  const saveStrategy = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Salvar Estratégia
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .insert({ user_id: user.id, name, description })
      .select()
      .single();

    if (strategyError) { console.error(strategyError); return; }

    // 2. Salvar Passos e Itens
    for (let i = 0; i < steps.length; i++) {
      const { data: step, error: stepError } = await supabase
        .from('strategy_steps')
        .insert({ strategy_id: strategy.id, name: steps[i].name, order_index: i })
        .select()
        .single();
      
      if (stepError) continue;

      for (let j = 0; j < steps[i].checklist.length; j++) {
        await supabase
          .from('checklist_items')
          .insert({ step_id: step.id, text: steps[i].checklist[j], order_index: j });
      }
    }

    router.push('/tools/strategies');
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Criar Nova Estratégia</h1>
      
      <input 
        className="w-full bg-[#0D1425] border border-slate-800 p-3 rounded-lg text-white"
        placeholder="Nome da Estratégia"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      
      <textarea 
        className="w-full bg-[#0D1425] border border-slate-800 p-3 rounded-lg text-white"
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {steps.map((step, stepIndex) => (
        <div key={stepIndex} className="bg-[#0D1425] p-6 rounded-xl border border-slate-800 space-y-4">
          <input 
            className="w-full bg-transparent border-b border-slate-700 p-2 text-white font-bold"
            placeholder={`Nome do Passo ${stepIndex + 1}`}
            value={step.name}
            onChange={(e) => updateStepName(stepIndex, e.target.value)}
          />
          {step.checklist.map((item, itemIndex) => (
            <input 
              key={itemIndex}
              className="w-full bg-[#050A15] border border-slate-800 p-2 rounded text-sm text-white"
              placeholder={`Item do checklist ${itemIndex + 1}`}
              value={item}
              onChange={(e) => updateItem(stepIndex, itemIndex, e.target.value)}
            />
          ))}
          <button onClick={() => addItem(stepIndex)} className="text-blue-500 text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Adicionar Item
          </button>
        </div>
      ))}

      <button onClick={addStep} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">Adicionar Passo</button>
      
      <button onClick={saveStrategy} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
        <Save className="w-4 h-4" /> Salvar Estratégia
      </button>
    </div>
  );
}
