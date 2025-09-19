import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // In development mode, use mock values if env vars are not set
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co'
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'mock-anon-key'
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
