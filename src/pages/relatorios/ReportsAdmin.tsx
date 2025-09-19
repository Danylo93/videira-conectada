// Enhanced Reports System - Admin Page
// Comprehensive reporting interface for pastors and obreiros

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReportsDashboard, useCultos, useLostMembers, useReports } from '@/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Users, TrendingUp, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReportForm from '@/components/reports/ReportForm';
import PastoralReportForm from '@/components/reports/PastoralReportForm';
import CultoForm from '@/components/reports/CultoForm';
import LostMemberForm from '@/components/reports/LostMemberForm';
import Charts from '@/components/reports/Charts';
import { CreateCultoData, UpdateCultoData, CreateLostMemberData, UpdateLostMemberData, CreateReportData, UpdateReportData } from '@/types/reports';

const ReportsAdmin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Form states
  const [showCultoForm, setShowCultoForm] = useState(false);
  const [showLostMemberForm, setShowLostMemberForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingCulto, setEditingCulto] = useState<any>(null);
  const [editingLostMember, setEditingLostMember] = useState<any>(null);
  const [editingReport, setEditingReport] = useState<any>(null);

  // Dashboard data
  const { dashboardData, loading: dashboardLoading, error: dashboardError } = useReportsDashboard();

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

  const { reports, loading: reportsLoading, createReport, updateReport, deleteReport } = useReports(reportFilters);
  const { cultos, createCulto, updateCulto, deleteCulto } = useCultos(cultoFilters);
  const { lostMembers, addLostMember, updateLostMember, removeLostMember } = useLostMembers(lostMemberFilters);

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

  // Culto handlers
  const handleCreateCulto = async (data: CreateCultoData) => {
    try {
      await createCulto(data);
      setShowCultoForm(false);
    } catch (error) {
      console.error('Error creating culto:', error);
    }
  };

  const handleUpdateCulto = async (data: UpdateCultoData) => {
    try {
      await updateCulto(editingCulto.id, data);
      setEditingCulto(null);
    } catch (error) {
      console.error('Error updating culto:', error);
    }
  };

  const handleDeleteCulto = async (id: string) => {
    try {
      await deleteCulto(id);
    } catch (error) {
      console.error('Error deleting culto:', error);
    }
  };

  // Lost member handlers
  const handleCreateLostMember = async (data: CreateLostMemberData) => {
    try {
      await addLostMember(data);
      setShowLostMemberForm(false);
    } catch (error) {
      console.error('Error creating lost member:', error);
    }
  };

  const handleUpdateLostMember = async (data: UpdateLostMemberData) => {
    try {
      await updateLostMember(editingLostMember.id, data);
      setEditingLostMember(null);
    } catch (error) {
      console.error('Error updating lost member:', error);
    }
  };

  const handleDeleteLostMember = async (id: string) => {
    try {
      await removeLostMember(id);
    } catch (error) {
      console.error('Error deleting lost member:', error);
    }
  };

  // Report handlers
  const handleCreateReport = async (data: CreateReportData) => {
    try {
      await createReport(data);
      setShowReportForm(false);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const handleUpdateReport = async (data: UpdateReportData) => {
    try {
      await updateReport(editingReport.id, data);
      setEditingReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport(id);
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600">{dashboardError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Pastorais</h1>
          <p className="text-gray-600">Visão geral dos relatórios das redes e acompanhamento pastoral</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowReportForm(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório Pastoral
          </Button>
          <Button variant="outline" onClick={() => setShowCultoForm(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Culto
          </Button>
          <Button variant="outline" onClick={() => setShowLostMemberForm(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Adicionar Perdido
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
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="cultos">Cultos</TabsTrigger>
          <TabsTrigger value="perdidos">Lista de Perdidos</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Cultos</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.culto_stats.total_cultos}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>+12% vs mês anterior</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Presenças</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.culto_stats.total_attendance}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>+8% vs mês anterior</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Membros Perdidos</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.lost_members_stats.total_lost}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center text-sm text-red-600">
                        <span>-3% vs mês anterior</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Relatórios Pendentes</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.reports_stats.submitted_reports}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center text-sm text-yellow-600">
                        <span>Requerem aprovação</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <Charts
                attendanceTrend={dashboardData.culto_stats.attendance_trend}
                cultosByType={dashboardData.culto_stats.cultos_by_type}
                lostMembersByStatus={dashboardData.lost_members_stats.by_status}
                lostMembersByPriority={dashboardData.lost_members_stats.by_priority}
              />

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Últimos Cultos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.recent_cultos.map((culto) => (
                        <div key={culto.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{culto.name}</p>
                            <p className="text-xs text-gray-500">{format(new Date(culto.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                          </div>
                          <Badge className={getStatusColor(culto.status)}>
                            {culto.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Membros Perdidos Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.recent_lost_members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.reason || 'Sem motivo especificado'}</p>
                          </div>
                          <Badge className={getPriorityColor(member.priority)}>
                            {member.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Relatórios Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.pending_approvals.map((report) => (
                        <div key={report.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{report.report_type}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(report.period_start), 'dd/MM/yyyy', { locale: ptBR })} - 
                              {format(new Date(report.period_end), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setEditingCulto(culto)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Presenças
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteCulto(culto.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setEditingLostMember(member)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Contatar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteLostMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setEditingReport(report)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Visualizar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <Dialog open={showCultoForm} onOpenChange={setShowCultoForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCulto ? 'Editar Culto' : 'Novo Culto'}
            </DialogTitle>
          </DialogHeader>
          <CultoForm
            onSubmit={editingCulto ? handleUpdateCulto : handleCreateCulto}
            onCancel={() => {
              setShowCultoForm(false);
              setEditingCulto(null);
            }}
            initialData={editingCulto}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showLostMemberForm} onOpenChange={setShowLostMemberForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLostMember ? 'Editar Membro Perdido' : 'Novo Membro Perdido'}
            </DialogTitle>
          </DialogHeader>
          <LostMemberForm
            onSubmit={editingLostMember ? handleUpdateLostMember : handleCreateLostMember}
            onCancel={() => {
              setShowLostMemberForm(false);
              setEditingLostMember(null);
            }}
            initialData={editingLostMember}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? 'Editar Relatório Pastoral' : 'Gerar Relatório Pastoral'}
            </DialogTitle>
          </DialogHeader>
          <PastoralReportForm
            onSubmit={(data) => {
              console.log('Pastoral report submitted:', data);
              setShowReportForm(false);
              // TODO: Implement API call to save pastoral report
              // This should aggregate discipulador reports and create a pastoral report
            }}
            onCancel={() => {
              setShowReportForm(false);
              setEditingReport(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsAdmin;
