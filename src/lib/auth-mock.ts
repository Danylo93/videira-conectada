// Mock authentication system that persists in development mode
// This simulates a real authentication system without Supabase

export interface MockUser {
  id: string
  email: string
  name: string
}

export interface MockSession {
  user: MockUser
  isAuthenticated: boolean
}

// Mock user data
const MOCK_USER: MockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  name: 'Usuário Teste'
}

// Session storage key
const SESSION_KEY = 'mock-auth-session'

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const session = localStorage.getItem(SESSION_KEY)
    if (!session) return false
    
    const parsed = JSON.parse(session)
    return parsed.isAuthenticated === true
  } catch {
    return false
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): MockUser | null {
  if (typeof window === 'undefined') return null
  
  const session = localStorage.getItem(SESSION_KEY)
  if (!session) return null
  
  try {
    const parsed = JSON.parse(session)
    return parsed.user || null
  } catch {
    return null
  }
}

/**
 * Login user
 */
export function loginUser(email: string, password: string): Promise<{ success: boolean; user?: MockUser; error?: string }> {
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // In development mode, accept any credentials
      if (process.env.NODE_ENV === 'development') {
        const session: MockSession = {
          user: MOCK_USER,
          isAuthenticated: true
        }
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        resolve({ success: true, user: MOCK_USER })
      } else {
        resolve({ success: false, error: 'Invalid credentials' })
      }
    }, 1000)
  })
}

/**
 * Logout user
 */
export function logoutUser(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Get session data
 */
export function getSession(): MockSession | null {
  if (typeof window === 'undefined') return null
  
  const session = localStorage.getItem(SESSION_KEY)
  if (!session) return null
  
  try {
    return JSON.parse(session)
  } catch {
    return null
  }
}
