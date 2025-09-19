'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth-mock'

interface SimpleAuthGuardProps {
  children: React.ReactNode
}

export default function SimpleAuthGuard({ children }: SimpleAuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication after component mounts
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsLoading(false)
      
      if (!authenticated) {
        router.replace('/auth/login')
      }
    }

    // Use a timeout to ensure the component is fully mounted
    const timer = setTimeout(checkAuth, 200)
    
    return () => clearTimeout(timer)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
