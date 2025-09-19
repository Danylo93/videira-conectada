// Enhanced Reports System - Discipulador Page
// Reporting interface for discipuladores to monitor their network

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
import { Calendar, Users, AlertTriangle, FileText, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NetworkReportForm from '@/components/reports/NetworkReportForm';

const ReportsDiscipulador: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateReport, setShowCreateReport] = useState(false);

  // Cultos data
  const cultoFilters = useMemo(() => ({
    search: searchTerm || undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter as 'active' | 'cancelled' | 'completed' : undefined,
  }), [searchTerm, statusFilter]);

  const { cultos, loading: cultosLoading } = useCultos(cultoFilters);

  // Lost members data
  const lostMemberFilters = useMemo(() => ({
    search: searchTerm || undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter as 'lost' | 'contacted' | 'returned' | 'transferred' : undefined,
  }), [searchTerm, statusFilter]);

  const { lostMembers, loading: lostMembersLoading } = useLostMembers(lostMemberFilters);

  // Reports data
  const reportFilters = useMemo(() => ({
    search: searchTerm || undefined,
    report_type: typeFilter && typeFilter !== 'all' ? typeFilter as 'cell' | 'culto' | 'monthly' | 'quarterly' | 'annual' | 'custom' : undefined,
    status: statusFilter && statusFilter !== 'all' ? statusFilter as 'draft' | 'submitted' | 'approved' | 'rejected' : undefined,
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
  
  // Calculate real network statistics
  const networkStats = useMemo(() => {
    const totalCultos = cultos.length;
    const totalAttendance = cultos.reduce((sum, c) => sum + (c.total_attendance || 0), 0);
    const totalConversions = cultos.reduce((sum, c) => sum + (c.total_conversions || 0), 0);
    const totalLostMembers = lostMembers.length;
    const averageAttendance = totalCultos > 0 ? totalAttendance / totalCultos : 0;
    const conversionRate = totalAttendance > 0 ? (totalConversions / totalAttendance) * 100 : 0;
    
    return {
      totalLeaders: 0, // TODO: Get from network data
      totalMembers: 0, // TODO: Get from network data
      totalLostMembers,
      totalCultos,
      totalAttendance,
      totalConversions,
      averageAttendance: Math.round(averageAttendance),
      conversionRate: Math.round(conversionRate * 10) / 10
    };
  }, [cultos, lostMembers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios da Rede</h1>
          <p className="text-gray-600">Acompanhamento da sua rede de líderes e membros</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => {
            console.log('Button clicked!');
            setShowCreateReport(true);
          }}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório da Rede
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
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Network KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Líderes na Rede</p>
                    <p className="text-2xl font-bold text-gray-900">{networkStats.totalLeaders}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Dados da rede</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Membros</p>
                    <p className="text-2xl font-bold text-gray-900">{networkStats.totalMembers}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Membros da rede</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Membros Perdidos</p>
                    <p className="text-2xl font-bold text-gray-900">{networkStats.totalLostMembers}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Membros perdidos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                    <p className="text-2xl font-bold text-gray-900">{networkStats.conversionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Taxa calculada</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Network Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance da Rede</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Presença Média em Cultos</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={75} className="w-24" />
                      <span className="text-sm font-medium text-gray-900">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Relatórios Entregues</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={90} className="w-24" />
                      <span className="text-sm font-medium text-gray-900">90%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Membros Ativos</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={85} className="w-24" />
                      <span className="text-sm font-medium text-gray-900">85%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-gray-500 py-4">
                    <p className="text-sm">Nenhuma atividade recente</p>
                    <p className="text-xs">As atividades aparecerão aqui conforme os líderes enviarem relatórios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                      Presenças
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
                      Acompanhar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Histórico
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
              <h2 className="text-xl font-semibold">Gerar Relatório da Rede</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCreateReport(false)}
              >
                ✕
              </Button>
            </div>
            <NetworkReportForm
              onSubmit={(data) => {
                console.log('Network report submitted:', data);
                setShowCreateReport(false);
                // TODO: Implement API call to save network report
                // This should aggregate leader reports and create a network report
              }}
              onCancel={() => setShowCreateReport(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDiscipulador;
