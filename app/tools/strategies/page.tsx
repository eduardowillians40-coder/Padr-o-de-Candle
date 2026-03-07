'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function StrategiesPage() {
  const supabase = createClient();
  const [strategies, setStrategies] = useState<any[]>([]);

  useEffect(() => {
    const fetchStrategies = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('strategies').select('*').eq('user_id', user.id);
      setStrategies(data || []);
    };
    fetchStrategies();
  }, [supabase]);

  const deleteStrategy = async (id: string) => {
    await supabase.from('strategies').delete().eq('id', id);
    setStrategies(strategies.filter(s => s.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Minhas Estratégias</h1>
        <Link href="/tools/strategies/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Estratégia
        </Link>
      </div>
      
      <div className="grid gap-4">
        {strategies.map(s => (
          <div key={s.id} className="bg-[#0D1425] p-4 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-white font-bold">{s.name}</h2>
              <p className="text-slate-500 text-sm">{s.description}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/tools/strategies/edit/${s.id}`} className="p-2 text-slate-500 hover:text-blue-500"><Edit2 className="w-4 h-4" /></Link>
              <button onClick={() => deleteStrategy(s.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
