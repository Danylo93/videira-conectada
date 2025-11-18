import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FancyLoader from '@/components/FancyLoader';
import { Checkbox } from '@/components/ui/checkbox';

type Sector = 'dizimos' | 'ofertas' | 'cantina';
type Status = 'pending' | 'approved' | 'rejected';

interface FinancialReport {
  id: string;
  week_start: string;
  sector: Sector;
  amount: number;
  date: string;
  total: number;
  status: Status;
  account_status: boolean;
  observations?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const sectorLabels: Record<Sector, string> = {
  dizimos: 'Dízimos',
  ofertas: 'Ofertas',
  cantina: 'Cantina',
};

const statusLabels: Record<Status, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export function Financial() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<FinancialReport | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector>('dizimos');
  
  // Form states
  const [formData, setFormData] = useState({
    week_start: '',
    sector: 'dizimos' as Sector,
    amount: '',
    date: '',
    total: '',
    account_status: false,
    observations: '',
  });

  // Helper para obter o início da semana (segunda-feira)
  const getWeekStart = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('financial_reports')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os relatórios financeiros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => r.sector === selectedSector);
  }, [reports, selectedSector]);

  const handleCreateReport = async () => {
    if (!user) return;

    if (!formData.week_start || !formData.date || !formData.amount || !formData.total) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('financial_reports')
        .insert([{
          week_start: formData.week_start,
          sector: formData.sector,
          amount: parseFloat(formData.amount),
          date: formData.date,
          total: parseFloat(formData.total),
          account_status: false, // Sempre inicia como false
          observations: formData.observations || null,
          created_by: user.id,
        }]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Relatório financeiro criado com sucesso!',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadReports();
    } catch (error: any) {
      console.error('Erro ao criar relatório:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o relatório.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateReport = async () => {
    if (!user || !editingReport) return;

    if (!formData.week_start || !formData.date || !formData.amount || !formData.total) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('financial_reports')
        .update({
          week_start: formData.week_start,
          sector: formData.sector,
          amount: parseFloat(formData.amount),
          date: formData.date,
          total: parseFloat(formData.total),
          observations: formData.observations || null,
        })
        .eq('id', editingReport.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Relatório financeiro atualizado com sucesso!',
      });

      setIsEditDialogOpen(false);
      setEditingReport(null);
      resetForm();
      loadReports();
    } catch (error: any) {
      console.error('Erro ao atualizar relatório:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o relatório.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAccountStatus = async (reportId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('financial_reports')
        .update({ account_status: !currentStatus })
        .eq('id', reportId);

      if (error) throw error;

      loadReports();
    } catch (error: any) {
      console.error('Erro ao atualizar prestação de contas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a prestação de contas.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteReportId) return;

    try {
      const { error } = await (supabase as any)
        .from('financial_reports')
        .delete()
        .eq('id', deleteReportId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Relatório financeiro excluído com sucesso!',
      });

      setDeleteReportId(null);
      loadReports();
    } catch (error: any) {
      console.error('Erro ao excluir relatório:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir o relatório.',
        variant: 'destructive',
      });
    }
  };

  const openEditReport = (report: FinancialReport) => {
    setEditingReport(report);
    setFormData({
      week_start: report.week_start,
      sector: report.sector,
      amount: report.amount.toString(),
      date: report.date,
      total: report.total.toString(),
      account_status: report.account_status,
      observations: report.observations || '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    const today = new Date();
    setFormData({
      week_start: getWeekStart(today),
      sector: 'dizimos',
      amount: '',
      date: today.toISOString().split('T')[0],
      total: '',
      account_status: false, // Mantém no estado mas não será usado na criação
      observations: '',
    });
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      date,
      week_start: getWeekStart(new Date(date)),
    }));
  };

  const totalBySector = useMemo(() => {
    const totals: Record<Sector, number> = {
      dizimos: 0,
      ofertas: 0,
      cantina: 0,
    };
    reports.forEach(r => {
      totals[r.sector] += r.total;
    });
    return totals;
  }, [reports]);

  if (loading) {
    return <FancyLoader message="Carregando relatórios financeiros..." />;
  }

  if (!user || (user.role !== 'pastor' && user.role !== 'obreiro')) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerenciamento de relatórios financeiros semanais</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dízimos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalBySector.dizimos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ofertas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalBySector.ofertas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantina</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalBySector.cantina.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs por setor */}
      <Tabs value={selectedSector} onValueChange={(v) => setSelectedSector(v as Sector)}>
        <TabsList>
          <TabsTrigger value="dizimos">Dízimos</TabsTrigger>
          <TabsTrigger value="ofertas">Ofertas</TabsTrigger>
          <TabsTrigger value="cantina">Cantina</TabsTrigger>
        </TabsList>

        {(['dizimos', 'ofertas', 'cantina'] as Sector[]).map((sector) => (
          <TabsContent key={sector} value={sector}>
            <Card>
              <CardHeader>
                <CardTitle>{sectorLabels[sector]}</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum relatório encontrado para {sectorLabels[sector]}.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Início da Semana</TableHead>
                        <TableHead>Valor Arrecadado</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prestação OK?</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            {new Date(report.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {new Date(report.week_start).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            R$ {report.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              R$ {report.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                report.status === 'approved'
                                  ? 'default'
                                  : report.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {statusLabels[report.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={report.account_status}
                                onCheckedChange={() => handleToggleAccountStatus(report.id, report.account_status)}
                                id={`account-status-${report.id}`}
                              />
                              <Label
                                htmlFor={`account-status-${report.id}`}
                                className="cursor-pointer text-sm"
                              >
                                {report.account_status ? 'OK' : 'Pendente'}
                              </Label>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditReport(report)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setDeleteReportId(report.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este relatório financeiro? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteReportId(null)}>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteReport}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog de Criar */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Relatório Financeiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sector">Setor</Label>
              <Select
                value={formData.sector}
                onValueChange={(v) => setFormData(prev => ({ ...prev, sector: v as Sector }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dizimos">Dízimos</SelectItem>
                  <SelectItem value="ofertas">Ofertas</SelectItem>
                  <SelectItem value="cantina">Cantina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Valor Arrecadado (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="total">Total (R$) *</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={formData.total}
                onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                rows={3}
                placeholder="Observações sobre o relatório..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateReport}>
                Criar Relatório
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Relatório Financeiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-sector">Setor</Label>
              <Select
                value={formData.sector}
                onValueChange={(v) => setFormData(prev => ({ ...prev, sector: v as Sector }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dizimos">Dízimos</SelectItem>
                  <SelectItem value="ofertas">Ofertas</SelectItem>
                  <SelectItem value="cantina">Cantina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-date">Data *</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-amount">Valor Arrecadado (R$) *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-total">Total (R$) *</Label>
              <Input
                id="edit-total"
                type="number"
                step="0.01"
                value={formData.total}
                onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-observations">Observações</Label>
              <Textarea
                id="edit-observations"
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                rows={3}
                placeholder="Observações sobre o relatório..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateReport}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

