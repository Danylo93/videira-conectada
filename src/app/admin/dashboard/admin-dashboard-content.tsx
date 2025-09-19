import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Users, 
  Database, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Server,
  FileText,
  Settings
} from 'lucide-react'

// Mock data - em produção viria do Supabase
const systemStats = {
  totalTenants: 12,
  activeTenants: 10,
  totalUsers: 156,
  totalRevenue: 2450.00,
  systemHealth: 'healthy',
  lastBackup: '2024-01-20T10:30:00Z',
  uptime: '99.9%',
}

const recentActivity = [
  {
    id: '1',
    type: 'tenant_created',
    message: 'Nova igreja "Igreja Central" foi criada',
    timestamp: '2024-01-20T14:30:00Z',
    severity: 'info',
  },
  {
    id: '2',
    type: 'payment_received',
    message: 'Pagamento de R$ 49,00 recebido de "Igreja do Norte"',
    timestamp: '2024-01-20T13:15:00Z',
    severity: 'success',
  },
  {
    id: '3',
    type: 'billing_expired',
    message: 'Assinatura expirada para "Igreja do Sul"',
    timestamp: '2024-01-20T12:00:00Z',
    severity: 'warning',
  },
  {
    id: '4',
    type: 'system_error',
    message: 'Erro no webhook do Stripe - 3 tentativas falharam',
    timestamp: '2024-01-20T11:45:00Z',
    severity: 'error',
  },
]

const tenantStats = [
  {
    name: 'Igreja Central',
    slug: 'central',
    members: 45,
    plan: 'Pro',
    status: 'active',
    lastActivity: '2024-01-20T15:30:00Z',
  },
  {
    name: 'Igreja do Norte',
    slug: 'norte',
    members: 32,
    plan: 'Standard',
    status: 'active',
    lastActivity: '2024-01-20T14:15:00Z',
  },
  {
    name: 'Igreja do Sul',
    slug: 'sul',
    members: 28,
    plan: 'Starter',
    status: 'expired',
    lastActivity: '2024-01-18T10:20:00Z',
  },
]

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  }
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'success': return CheckCircle
    case 'warning': return AlertTriangle
    case 'error': return AlertTriangle
    default: return Activity
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export default function AdminDashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Visão geral do sistema e supervisão de tenants
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total de Tenants
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemStats.totalTenants}
                </p>
                <p className="text-xs text-gray-500">
                  {systemStats.activeTenants} ativos
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total de Usuários
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemStats.totalUsers}
                </p>
                <p className="text-xs text-gray-500">
                  Em todas as igrejas
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Receita Mensal
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {systemStats.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Janeiro 2024
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Status do Sistema
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {systemStats.uptime}
                </p>
                <p className="text-xs text-gray-500">
                  Uptime
                </p>
              </div>
              <Server className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Últimas atividades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getSeverityIcon(activity.severity)
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.severity === 'success' ? 'bg-green-100 dark:bg-green-900' :
                      activity.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                      activity.severity === 'error' ? 'bg-red-100 dark:bg-red-900' :
                      'bg-blue-100 dark:bg-blue-900'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        activity.severity === 'success' ? 'text-green-600 dark:text-green-400' :
                        activity.severity === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                        activity.severity === 'error' ? 'text-red-600 dark:text-red-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Saúde do Sistema
            </CardTitle>
            <CardDescription>
              Status dos componentes do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm">Banco de Dados</span>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Online
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm">Stripe API</span>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Online
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">Webhooks</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                Instável
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm">Último Backup</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(systemStats.lastBackup).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral dos Tenants</CardTitle>
          <CardDescription>
            Status e estatísticas de todas as igrejas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenantStats.map((tenant) => (
              <div key={tenant.slug} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tenant.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {tenant.slug}.meudominio.com
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {tenant.members}
                    </p>
                    <p className="text-xs text-gray-500">Membros</p>
                  </div>
                  
                  <Badge className={getStatusColor(tenant.status)}>
                    {tenant.status === 'active' ? 'Ativo' : 
                     tenant.status === 'expired' ? 'Expirado' : 'Inativo'}
                  </Badge>
                  
                  <Badge variant="outline">
                    {tenant.plan}
                  </Badge>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Última atividade
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(tenant.lastActivity).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Ferramentas administrativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Backup Manual
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Logs do Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
