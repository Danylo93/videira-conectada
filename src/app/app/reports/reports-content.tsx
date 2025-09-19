import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  Users, 
  Church,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react'

// Mock data - em produção viria do Supabase
const reports = [
  {
    id: '1',
    cellName: 'Célula Central',
    leader: 'João Silva',
    weekStart: '2024-01-15',
    membersPresent: 8,
    visitorsPresent: 2,
    phase: 'Multiplicação',
    status: 'submitted',
    submittedAt: '2024-01-16T10:30:00Z',
  },
  {
    id: '2',
    cellName: 'Célula Norte',
    leader: 'Maria Santos',
    weekStart: '2024-01-15',
    membersPresent: 6,
    visitorsPresent: 1,
    phase: 'Consolidação',
    status: 'submitted',
    submittedAt: '2024-01-16T11:15:00Z',
  },
  {
    id: '3',
    cellName: 'Célula Sul',
    leader: 'Pedro Costa',
    weekStart: '2024-01-15',
    membersPresent: 0,
    visitorsPresent: 0,
    phase: 'Evangelismo',
    status: 'pending',
    submittedAt: null,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'submitted': return 'Enviado'
    case 'pending': return 'Pendente'
    case 'overdue': return 'Atrasado'
    default: return 'Desconhecido'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'submitted': return CheckCircle
    case 'pending': return Clock
    case 'overdue': return AlertCircle
    default: return Clock
  }
}

const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'Evangelismo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'Consolidação': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'Multiplicação': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export default function ReportsContent() {
  const submittedReports = reports.filter(report => report.status === 'submitted')
  const pendingReports = reports.filter(report => report.status === 'pending')
  const totalMembers = reports.reduce((sum, report) => sum + report.membersPresent, 0)
  const totalVisitors = reports.reduce((sum, report) => sum + report.visitorsPresent, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Acompanhe os relatórios de células
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Relatórios Enviados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {submittedReports.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Relatórios Pendentes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingReports.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Membros Presentes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalMembers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Visitantes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalVisitors}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Presença por Célula
            </CardTitle>
            <CardDescription>
              Membros e visitantes por célula na última semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Church className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {report.cellName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {report.leader}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {report.membersPresent + report.visitorsPresent}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {report.membersPresent}M + {report.visitorsPresent}V
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Fases das Células
            </CardTitle>
            <CardDescription>
              Distribuição das células por fase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Evangelismo', 'Consolidação', 'Multiplicação'].map((phase) => {
                const count = reports.filter(r => r.phase === phase).length
                const percentage = reports.length > 0 ? (count / reports.length) * 100 : 0
                
                return (
                  <div key={phase} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getPhaseColor(phase)}>
                        {phase}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {count} células
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios da Semana</CardTitle>
          <CardDescription>
            Relatórios de células para a semana de 15/01/2024
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => {
              const StatusIcon = getStatusIcon(report.status)
              
              return (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      report.status === 'submitted' ? 'bg-green-100 dark:bg-green-900' :
                      report.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900' :
                      'bg-red-100 dark:bg-red-900'
                    }`}>
                      <StatusIcon className={`w-5 h-5 ${
                        report.status === 'submitted' ? 'text-green-600 dark:text-green-400' :
                        report.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {report.cellName}
                        </h3>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusText(report.status)}
                        </Badge>
                        <Badge className={getPhaseColor(report.phase)}>
                          {report.phase}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Líder: {report.leader}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {report.membersPresent} membros presentes
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {report.visitorsPresent} visitantes
                        </div>
                        {report.submittedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Enviado em {new Date(report.submittedAt).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                    {report.status === 'pending' && (
                      <Button size="sm">
                        Lembrar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {reports.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum relatório encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Os relatórios de células aparecerão aqui quando forem enviados
            </p>
            <Button className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Criar Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
