import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // In development mode, use mock values if env vars are not set
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co'
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'mock-anon-key'
  
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  // In development mode, use mock values if env vars are not set
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co'
  const supabaseServiceKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'mock-service-key'
  
  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for admin client
        },
      },
    }
  )
}
