import { useState, useEffect } from 'react';
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
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileText, 
  Plus, 
  Send, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CellReport {
  id: string;
  month: string;
  year: number;
  multiplicationDate?: Date;
  observations?: string;
  status: 'draft' | 'submitted' | 'approved';
  submittedAt: Date;
}

export function CellReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<CellReport[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [multiplicationDate, setMultiplicationDate] = useState('');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'lider') {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('cell_reports')
      .select('*')
      .eq('lider_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Error loading reports:', error);
      return;
    }

    const formattedReports: CellReport[] = (data || []).map(report => ({
      id: report.id,
      month: report.month,
      year: report.year,
      multiplicationDate: report.multiplication_date ? new Date(report.multiplication_date) : undefined,
      observations: report.observations,
      status: report.status as 'draft' | 'submitted' | 'approved',
      submittedAt: new Date(report.submitted_at),
    }));

    setReports(formattedReports);
    setLoading(false);
  };

  if (!user || user.role !== 'lider') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para líderes de célula.</p>
      </div>
    );
  }

  const handleCreateReport = async () => {
    if (!user || !selectedMonth) return;
    
    const { data, error } = await supabase
      .from('cell_reports')
      .insert([
        {
          lider_id: user.id,
          month: selectedMonth,
          year: parseInt(selectedMonth.split('-')[0]),
          multiplication_date: multiplicationDate || null,
          observations: observations || null,
          status: 'draft',
        }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o relatório.",
        variant: "destructive",
      });
      return;
    }

    loadReports();
    setIsCreateDialogOpen(false);
    setSelectedMonth('');
    setMultiplicationDate('');
    setObservations('');
    
    toast({
      title: "Sucesso",
      description: "Relatório criado com sucesso!",
    });
  };

  const months = [
    { value: '2024-01', label: 'Janeiro 2024' },
    { value: '2024-02', label: 'Fevereiro 2024' },
    { value: '2024-03', label: 'Março 2024' },
    { value: '2024-04', label: 'Abril 2024' },
    { value: '2024-05', label: 'Maio 2024' },
    { value: '2024-06', label: 'Junho 2024' },
    { value: '2024-07', label: 'Julho 2024' },
    { value: '2024-08', label: 'Agosto 2024' },
    { value: '2024-09', label: 'Setembro 2024' },
    { value: '2024-10', label: 'Outubro 2024' },
    { value: '2024-11', label: 'Novembro 2024' },
    { value: '2024-12', label: 'Dezembro 2024' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios de Célula</h1>
          <p className="text-muted-foreground">{user.celula}</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Relatório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="month">Mês/Ano</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="multiplication">Data de Multiplicação (opcional)</Label>
                <Input
                  id="multiplication"
                  type="date"
                  value={multiplicationDate}
                  onChange={(e) => setMultiplicationDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observações sobre o mês..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateReport} className="w-full gradient-primary">
                Criar Relatório
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Histórico de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum relatório criado ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Multiplicação</TableHead>
                  <TableHead>Data de Envio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {new Date(report.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'approved' ? 'default' : 'secondary'}>
                        {report.status === 'draft' ? 'Rascunho' : report.status === 'submitted' ? 'Enviado' : 'Aprovado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.multiplicationDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {report.multiplicationDate.toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {report.submittedAt.toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}