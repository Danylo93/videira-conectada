import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  Settings,
  CreditCard,
  Church
} from 'lucide-react'
import Link from 'next/link'

interface Tenant {
  id: string
  slug: string
  name: string
  owner_profile_id: string
  active: boolean
  created_at: string
  updated_at: string
}

interface DashboardContentProps {
  tenant: Tenant
}

export default function DashboardContent({ tenant }: DashboardContentProps) {
  const stats = [
    {
      title: 'Membros Ativos',
      value: '0',
      description: 'Total de membros cadastrados',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      title: 'Células',
      value: '0',
      description: 'Células ativas',
      icon: Church,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      title: 'Eventos',
      value: '0',
      description: 'Próximos eventos',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    {
      title: 'Cursos',
      value: '0',
      description: 'Cursos disponíveis',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
  ]

  const quickActions = [
    {
      title: 'Gerenciar Membros',
      description: 'Adicionar e gerenciar membros da igreja',
      icon: Users,
      href: '/app/members',
      color: 'text-blue-600',
    },
    {
      title: 'Relatórios de Células',
      description: 'Visualizar e gerenciar relatórios',
      icon: TrendingUp,
      href: '/app/reports',
      color: 'text-green-600',
    },
    {
      title: 'Eventos',
      description: 'Criar e gerenciar eventos',
      icon: Calendar,
      href: '/app/events',
      color: 'text-purple-600',
    },
    {
      title: 'Cursos',
      description: 'Gerenciar cursos e matrículas',
      icon: BookOpen,
      href: '/app/courses',
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Bem-vindo ao {tenant.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/settings">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={action.href}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800">
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas atividades na sua igreja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">
              Nenhuma atividade recente
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Comece adicionando membros e criando células
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Começando</CardTitle>
          <CardDescription>
            Primeiros passos para configurar sua igreja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  1. Adicionar Membros
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Comece adicionando os membros da sua igreja
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/app/members">Começar</Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <Church className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  2. Criar Células
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Organize seus membros em células
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/cells">Criar</Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  3. Agendar Eventos
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Crie eventos para sua igreja
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/app/events">Agendar</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
