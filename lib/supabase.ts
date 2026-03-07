import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export const createClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('placeholder-project')) {
    console.warn('Supabase URL is missing or using placeholder. Authentication will not work.');
  }

  // Use standard supabase-js client which defaults to localStorage for session persistence.
  // This is much more reliable inside cross-origin iframes than cookie-based auth.
  supabaseInstance = createSupabaseClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
  );

  return supabaseInstance;
};
