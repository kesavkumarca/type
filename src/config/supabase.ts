import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// 🔒 Using a singleton pattern and turning off browser navigator locks to prevent freezing
let supabaseInstance: any = null;

export const createBrowserClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // 🛑 This turns off the exact Web Lock causing your browser to freeze!
        lock: async (name, acquireTimeout, fn) => fn(), 
      }
    });
  }
  return supabaseInstance;
};

export const supabase = createBrowserClient();

// Admin email for admin panel access
export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'lakshmitechinstitute97@gmail.com';