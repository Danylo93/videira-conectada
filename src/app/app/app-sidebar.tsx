'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Church, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  CreditCard, 
  Settings,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Membros', href: '/app/members', icon: Users },
  { name: 'Células', href: '/app/cells', icon: Church },
  { name: 'Relatórios', href: '/app/reports', icon: TrendingUp },
  { name: 'Eventos', href: '/app/events', icon: Calendar },
  { name: 'Cursos', href: '/app/courses', icon: BookOpen },
  { name: 'Billing', href: '/app/billing', icon: CreditCard },
  { name: 'Configurações', href: '/app/settings', icon: Settings },
]

export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 shadow-lg">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Videira Conectada
          </h1>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-blue-900',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-300 dark:hover:bg-red-900"
                onClick={() => {
                  // Handle logout
                  window.location.href = '/auth/logout'
                }}
              >
                <LogOut className="h-6 w-6 shrink-0 mr-3" />
                Sair
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
