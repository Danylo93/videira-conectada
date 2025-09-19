// Enhanced Reports System - Leader Page
// Reporting interface for leaders to manage their cell and submit reports

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCultos, useLostMembers, useReports } from '@/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, AlertTriangle, FileText, Clock, CheckCircle, XCircle, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReportForm from '@/components/reports/ReportForm';

const ReportsLeader: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateReport, setShowCreateReport] = useState(false);

  // Cultos data
  const cultoFilters = useMemo(() => ({
    search: searchTerm || undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
  }), [searchTerm, statusFilter]);

  const { cultos, loading: cultosLoading } = useCultos(cultoFilters);

  // Lost members data
  const lostMemberFilters = useMemo(() => ({
    search: searchTerm || undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
  }), [searchTerm, statusFilter]);

  const { lostMembers, loading: lostMembersLoading } = useLostMembers(lostMemberFilters);

  // Reports data
  const reportFilters = useMemo(() => ({
    search: searchTerm || undefined,
    report_type: typeFilter && typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
  }), [searchTerm, typeFilter, statusFilter]);

  const { reports, loading: reportsLoading } = useReports(reportFilters);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'returned': return 'bg-green-100 text-green-800';
      case 'transferred': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Real data from hooks
  
  // Calculate real statistics from actual data
  const cellStats = useMemo(() => {
    const totalMeetings = reports.filter(r => r.report_type === 'cell').length;
    const totalAttendance = reports.reduce((sum, r) => sum + (r.data?.total_attendance || 0), 0);
    const totalVisitors = reports.reduce((sum, r) => sum + (r.data?.total_visitors || 0), 0);
    const totalConversions = reports.reduce((sum, r) => sum + (r.data?.total_conversions || 0), 0);
    const averageAttendance = totalMeetings > 0 ? totalAttendance / totalMeetings : 0;
    const attendanceRate = totalMeetings > 0 ? (totalAttendance / (totalMeetings * 8)) * 100 : 0;
    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
    
    return {
      totalMembers: 8, // TODO: Get from cell members data
      totalVisitors,
      totalConversions,
      totalMeetings,
      averageAttendance: Math.round(averageAttendance * 10) / 10,
      attendanceRate: Math.round(attendanceRate),
      conversionRate: Math.round(conversionRate),
      lastMeetingDate: reports.length > 0 ? reports[0].period_end : null,
      nextMeetingDate: null // TODO: Calculate next meeting date
    };
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios da Célula</h1>
          <p className="text-gray-600">Gerencie sua célula e acompanhe o progresso dos membros</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCreateReport(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Ver Cultos
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="lost">Perdido</SelectItem>
            <SelectItem value="contacted">Contatado</SelectItem>
            <SelectItem value="returned">Retornou</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="submitted">Enviado</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="cell">Célula</SelectItem>
            <SelectItem value="culto">Culto</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="quarterly">Trimestral</SelectItem>
            <SelectItem value="annual">Anual</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cultos">Cultos</TabsTrigger>
          <TabsTrigger value="perdidos">Membros Perdidos</TabsTrigger>
          <TabsTrigger value="relatorios">Meus Relatórios</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Cell KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Membros da Célula</p>
                    <p className="text-2xl font-bold text-gray-900">{cellStats.totalMembers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Dados da célula</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Visitantes</p>
                    <p className="text-2xl font-bold text-gray-900">{cellStats.totalVisitors}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Visitantes registrados</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversões</p>
                    <p className="text-2xl font-bold text-gray-900">{cellStats.totalConversions}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Conversões registradas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Presença</p>
                    <p className="text-2xl font-bold text-gray-900">{cellStats.attendanceRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Taxa calculada</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cell Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance da Célula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Presença Média</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={cellStats.attendanceRate} className="w-24" />
                      <span className="text-sm font-medium text-gray-900">{cellStats.attendanceRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Taxa de Conversão</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={cellStats.conversionRate} className="w-24" />
                      <span className="text-sm font-medium text-gray-900">{cellStats.conversionRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Reuniões Realizadas</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={80} className="w-24" />
                      <span className="text-sm font-medium text-gray-900">4/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximas Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Reunião da Célula</p>
                      <p className="text-xs text-gray-500">
                        {cellStats.nextMeetingDate ? format(new Date(cellStats.nextMeetingDate), 'dd/MM/yyyy', { locale: ptBR }) + ' às 19:30' : 'Data não definida'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Culto de Jovens</p>
                      <p className="text-xs text-gray-500">Sexta-feira às 19:00</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Entrega de Relatório</p>
                      <p className="text-xs text-gray-500">Até 31/01/2024</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center space-y-2">
                  <FileText className="h-6 w-6" />
                  <span>Relatório de Célula</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Users className="h-6 w-6" />
                  <span>Registrar Presença</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Reportar Membro Perdido</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cultos Tab */}
        <TabsContent value="cultos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cultos.map((culto) => (
              <Card key={culto.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{culto.name}</CardTitle>
                    <Badge className={getStatusColor(culto.status)}>
                      {culto.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{culto.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Data:</span>
                      <span className="font-medium">{format(new Date(culto.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Horário:</span>
                      <span className="font-medium">{culto.start_time}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium capitalize">{culto.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Presenças:</span>
                      <span className="font-medium">{culto.total_attendance}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Visitantes:</span>
                      <span className="font-medium">{culto.total_visitors}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Conversões:</span>
                      <span className="font-medium text-green-600">{culto.total_conversions}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Ver Detalhes
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Registrar Presença
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lost Members Tab */}
        <TabsContent value="perdidos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lostMembers.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <div className="flex space-x-2">
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                      <Badge className={getPriorityColor(member.priority)}>
                        {member.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Telefone:</span>
                      <span className="font-medium">{member.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{member.email || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Última presença:</span>
                      <span className="font-medium">
                        {member.last_attendance_date ? format(new Date(member.last_attendance_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Motivo:</span>
                      <span className="font-medium capitalize">{member.reason || 'Não especificado'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tentativas:</span>
                      <span className="font-medium">{member.contact_attempts}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Contatar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Atualizar Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{report.report_type}</CardTitle>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Período:</span>
                      <span className="font-medium">
                        {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: ptBR })} - 
                        {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Criado em:</span>
                      <span className="font-medium">
                        {format(new Date(report.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    {report.submitted_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Enviado em:</span>
                        <span className="font-medium">
                          {format(new Date(report.submitted_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    {report.approved_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Aprovado em:</span>
                        <span className="font-medium">
                          {format(new Date(report.approved_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Visualizar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Report Modal */}
      {showCreateReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Novo Relatório da Célula</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateReport(false)}
              >
                ✕
              </Button>
            </div>
            <ReportForm
              onSubmit={(data) => {
                console.log('Report submitted:', data);
                setShowCreateReport(false);
                // Optionally refresh data here
              }}
              onCancel={() => setShowCreateReport(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsLeader;
