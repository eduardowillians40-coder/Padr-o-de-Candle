import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' });

  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: user.id,
      name: 'Test Wallet Settings',
      initial_balance: 100,
      meta_value: 0,
      settings: { risk_per_trade: 1 }
    })
    .select();
  
  if (error) {
    return NextResponse.json({ error });
  }

  // cleanup
  await supabase.from('wallets').delete().eq('id', data[0].id);

  return NextResponse.json({ success: true, data });
}
