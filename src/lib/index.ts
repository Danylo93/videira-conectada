// Main entry point that exports the appropriate functions based on environment
// This allows switching between development (mock) and production (real) implementations

// Always export these (they don't depend on database structure)
export { createClient } from './supabase/client'
export { createClient as createServerClient } from './supabase/server'
export { createAdminClient } from './supabase/server'
export { stripe } from './stripe'
export { cn } from './utils'

// For development, always export mock functions
// For production, change the imports below to point to the real implementations
export * from './tenant-dev'
export * from './auth-dev'
export * from './notifications-dev'

// To switch to production, change the above exports to:
// export * from './tenant'
// export * from './auth'
// export * from './notifications'