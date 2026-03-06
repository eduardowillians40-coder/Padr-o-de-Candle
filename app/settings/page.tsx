'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  CreditCard,
  Plus,
  Trash2,
  Camera,
  Save,
  LogOut,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [newTrigger, setNewTrigger] = useState('');

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // Fetch Triggers
      const { data: triggerData } = await supabase
        .from('triggers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      setTriggers(triggerData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase, refresh]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        username: profile.username,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      alert('Perfil atualizado com sucesso!');
      setRefresh(prev => prev + 1);
    }
    setSaving(false);
  };

  const handleAddTrigger = async () => {
    if (!newTrigger.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('triggers')
      .insert({
        user_id: user.id,
        name: newTrigger.trim()
      });

    if (!error) {
      setNewTrigger('');
      setRefresh(prev => prev + 1);
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    const { error } = await supabase.from('triggers').delete().eq('id', id);
    if (!error) setRefresh(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">CONFIGURAÇÕES DO SISTEMA</h1>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Gerencie seu perfil, gatilhos operacionais e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: 'profile', label: 'MEU PERFIL', icon: User },
            { id: 'triggers', label: 'GATILHOS (TRIGGERS)', icon: Zap },
            { id: 'notifications', label: 'NOTIFICAÇÕES', icon: Bell },
            { id: 'security', label: 'SEGURANÇA', icon: Shield },
            { id: 'billing', label: 'ASSINATURA', icon: CreditCard },
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${item.id === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          
          <div className="pt-8">
            <button 
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              SAIR DA CONTA
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9 space-y-8">
          {/* Profile Section */}
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">INFORMAÇÕES PESSOAIS</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900 flex items-center justify-center relative">
                  {profile?.avatar_url ? (
                    <Image 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      fill 
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-700" />
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-lg text-white shadow-lg border border-blue-500 hover:bg-blue-500 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    disabled
                    value={profile?.email || ''}
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                    <input 
                      type="text" 
                      value={profile?.username || ''}
                      onChange={(e) => setProfile({...profile, username: e.target.value})}
                      className="w-full bg-[#050A15] border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Telefone</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    className="w-full bg-[#050A15] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>
          </div>

          {/* Triggers Section */}
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">GATILHOS OPERACIONAIS</h3>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="Novo gatilho..."
                  className="bg-[#050A15] border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={handleAddTrigger}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  <Plus className="w-3 h-3" /> ADICIONAR
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Defina os gatilhos que você utiliza para entrar em uma operação. Eles estarão disponíveis no formulário de registro de trade.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {triggers.map((trigger) => (
                <div key={trigger.id} className="flex items-center justify-between p-4 bg-[#050A15] border border-slate-800 rounded-xl group hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{trigger.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteTrigger(trigger.id)}
                    className="p-2 text-slate-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* App Preferences */}
          <div className="bg-[#0D1425] border border-slate-800 rounded-2xl p-8 space-y-8">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-slate-500" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">PREFERÊNCIAS DO APP</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#050A15] border border-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">MOEDA PADRÃO</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Defina a moeda principal para cálculos</p>
                </div>
                <select className="bg-slate-800 border-none rounded-lg px-4 py-2 text-xs font-bold text-white focus:ring-0">
                  <option>BRL (R$)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#050A15] border border-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">TEMA DO SISTEMA</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Escolha a aparência da interface</p>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg">
                  <button className="px-4 py-1.5 rounded-md text-[10px] font-bold bg-blue-600 text-white">DARK</button>
                  <button className="px-4 py-1.5 rounded-md text-[10px] font-bold text-slate-500">LIGHT</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
