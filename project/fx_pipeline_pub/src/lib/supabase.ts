import { createClient } from '@supabase/supabase-js';
// import type { Database } from './database.types';

// Ensure we're using the complete URL without any trailing slashes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL.trim();
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY.trim();
// const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_KEY.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// export const supabaseAdmin = createClient(
//   supabaseUrl,
//   serviceRoleKey // Must be a server-side secret
// );