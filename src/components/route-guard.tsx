'use client'

import { useEffect, useState } from 'react'
import { isAuthenticated } from '@/lib/auth-mock'

interface RouteGuardProps {
  children: React.ReactNode
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication after component mounts
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsLoading(false)
      
      if (!authenticated) {
        // Use window.location.href to avoid Next.js routing issues
        window.location.href = '/auth/login'
        return
      }
    }

    // Add a small delay to ensure localStorage is available
    const timer = setTimeout(checkAuth, 200)
    
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
