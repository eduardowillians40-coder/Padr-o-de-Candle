import { createBrowserClient } from '@supabase/ssr';

let supabaseInstance: any = null;

export const createClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('placeholder-project')) {
    console.warn('Supabase URL is missing or using placeholder. Authentication will not work.');
  }

  // If credentials are missing, we use placeholders to prevent the app from crashing on boot.
  // The UI should handle the "unconfigured" state gracefully.
  supabaseInstance = createBrowserClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
  );

  return supabaseInstance;
};
