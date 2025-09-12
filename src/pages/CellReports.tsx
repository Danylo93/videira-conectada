import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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
  Calendar, 
  Users, 
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { CellReport } from '@/types/church';

// Mock data
const mockReports: CellReport[] = [
  {
    id: '1',
    liderId: '4',
    month: '2024-12',
    year: 2024,
    members: [],
    frequentadores: [],
    observations: 'Mês muito bom, com crescimento espiritual visível.',
    submittedAt: new Date('2024-12-05'),
    status: 'submitted',
  },
  {
    id: '2',
    liderId: '4',
    month: '2024-11',
    year: 2024,
    members: [],
    frequentadores: [],
    multiplicationDate: new Date('2024-11-15'),
    observations: 'Célula se multiplicou! Nova célula iniciada.',
    submittedAt: new Date('2024-11-30'),
    status: 'approved',
  },
];

export function CellReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<CellReport[]>(mockReports);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    memberCount: 0,
    visitorCount: 0,
    multiplicationDate: '',
    observations: '',
  });

  if (!user) return null;

  const canViewAllReports = user.role === 'pastor' || user.role === 'obreiro' || user.role === 'discipulador';
  const canCreateReports = user.role === 'lider';

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  const handleCreateReport = () => {
    const report: CellReport = {
      id: Date.now().toString(),
      liderId: user.id,
      month: currentMonth,
      year: new Date().getFullYear(),
      members: [], // In real app, this would be populated from the members list
      frequentadores: [],
      multiplicationDate: newReport.multiplicationDate ? new Date(newReport.multiplicationDate) : undefined,
      observations: newReport.observations,
      submittedAt: new Date(),
      status: 'draft',
    };

    setReports([report, ...reports]);
    setNewReport({
      memberCount: 0,
      visitorCount: 0,
      multiplicationDate: '',
      observations: '',
    });
    setIsCreateDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-success">Aprovado</Badge>;
      case 'submitted':
        return <Badge variant="default">Enviado</Badge>;
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const filteredReports = canViewAllReports 
    ? reports 
    : reports.filter(r => r.liderId === user.id);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios de Célula</h1>
          <p className="text-muted-foreground">
            {canViewAllReports ? 'Todos os relatórios' : 'Meus relatórios mensais'}
          </p>
        </div>
        
        {canCreateReports && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Relatório - {formatMonth(currentMonth)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="memberCount">Qtd. Membros</Label>
                    <Input
                      id="memberCount"
                      type="number"
                      value={newReport.memberCount}
                      onChange={(e) => setNewReport({ ...newReport, memberCount: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="visitorCount">Qtd. Frequentadores</Label>
                    <Input
                      id="visitorCount"
                      type="number"
                      value={newReport.visitorCount}
                      onChange={(e) => setNewReport({ ...newReport, visitorCount: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="multiplicationDate">Data de Multiplicação (opcional)</Label>
                  <Input
                    id="multiplicationDate"
                    type="date"
                    value={newReport.multiplicationDate}
                    onChange={(e) => setNewReport({ ...newReport, multiplicationDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={newReport.observations}
                    onChange={(e) => setNewReport({ ...newReport, observations: e.target.value })}
                    placeholder="Descreva como foi o mês da célula, testemunhos, desafios, crescimento..."
                    rows={4}
                  />
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo:</h4>
                  <p className="text-sm text-muted-foreground">
                    Período: {formatMonth(currentMonth)}<br />
                    Total de pessoas: {newReport.memberCount + newReport.visitorCount}<br />
                    {newReport.multiplicationDate && `Multiplicação: ${new Date(newReport.multiplicationDate).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>

                <Button onClick={handleCreateReport} className="w-full gradient-primary">
                  Criar Relatório
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{filteredReports.length}</div>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredReports.filter(r => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {filteredReports.filter(r => r.status === 'submitted').length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multiplicações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {filteredReports.filter(r => r.multiplicationDate).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Lista de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                {canViewAllReports && <TableHead>Líder</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Multiplicação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {formatMonth(report.month)}
                    </div>
                  </TableCell>
                  {canViewAllReports && (
                    <TableCell>
                      <span className="text-sm">
                        {report.liderId === user?.id ? 'Você' : `Líder #${report.liderId}`}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {report.submittedAt.toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.multiplicationDate ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm">
                          {report.multiplicationDate.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}