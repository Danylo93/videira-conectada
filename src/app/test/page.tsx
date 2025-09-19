'use client'

import { useEffect, useState } from 'react'
import { isAuthenticated, getCurrentUser } from '@/lib/auth-mock'

export default function TestPage() {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated()
      const currentUser = getCurrentUser()
      
      setAuth(isAuth)
      setUser(currentUser)
    }

    checkAuth()
  }, [])

  const handleLogin = () => {
    // Simulate login
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      isAuthenticated: true
    }
    
    localStorage.setItem('mock-auth-session', JSON.stringify(mockUser))
    
    // Force reload
    window.location.reload()
  }

  const handleLogout = () => {
    localStorage.removeItem('mock-auth-session')
    window.location.reload()
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste de Autenticação</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Status da Autenticação</h2>
          <p><strong>Autenticado:</strong> {auth === null ? 'Verificando...' : auth ? 'Sim' : 'Não'}</p>
          <p><strong>Usuário:</strong> {user ? user.name : 'Nenhum'}</p>
          <p><strong>Email:</strong> {user ? user.email : 'Nenhum'}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Ações</h2>
          <div className="space-x-4">
            <button
              onClick={handleLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Fazer Login
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Fazer Logout
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Navegação</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/app/dashboard'}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Ir para Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
