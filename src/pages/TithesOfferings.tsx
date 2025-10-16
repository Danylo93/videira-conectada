import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  DialogTrigger,
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
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Filter,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTithesOfferings, useTithesOfferingsStats, useAllMembers } from '@/hooks/useTithesOfferings';
import { TitheOffering, TitheOfferingFilters } from '@/types/church';
import FancyLoader from '@/components/FancyLoader';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const COLORS = {
  tithe: '#3B82F6',        // Azul
  offering: '#10B981',     // Verde
  specialOffering: '#8B5CF6', // Roxo
  personTypes: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'], // Azul, Verde, Amarelo, Vermelho, Roxo
  paymentMethods: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'] // Azul, Verde, Amarelo, Roxo
};

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function TithesOfferings() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados para filtros
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [personTypeFilter, setPersonTypeFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para modal
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTitheOffering, setEditingTitheOffering] = useState<TitheOffering | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    personId: '',
    personName: '',
    personType: 'member' as 'member' | 'frequentador' | 'lider' | 'discipulador' | 'pastor',
    type: 'tithe' as 'tithe' | 'offering' | 'special_offering',
    amount: '',
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    description: '',
    paymentMethod: 'cash' as 'cash' | 'pix' | 'card' | 'bank_transfer',
    receivedAt: new Date().toISOString().split('T')[0],
  });

  // Criar filtros
  const filters: TitheOfferingFilters = useMemo(() => {
    const f: TitheOfferingFilters = {
      month: selectedMonth,
      year: selectedYear,
    };

    if (personTypeFilter && personTypeFilter !== 'all') f.personType = personTypeFilter as any;
    if (typeFilter && typeFilter !== 'all') f.type = typeFilter as any;
    if (searchTerm) f.search = searchTerm;

    return f;
  }, [selectedMonth, selectedYear, personTypeFilter, typeFilter, searchTerm]);

  // Hooks
  const { tithesOfferings, loading, error, createTitheOffering, updateTitheOffering, deleteTitheOffering, refetch } = useTithesOfferings(filters);
  const { stats, loading: statsLoading } = useTithesOfferingsStats(selectedMonth, selectedYear);
  const { members, loading: membersLoading } = useAllMembers();

  // Filtrar membros por tipo
  const filteredMembers = useMemo(() => {
    return members.filter(member => member.type === formData.personType);
  }, [members, formData.personType]);

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      personId: '',
      personName: '',
      personType: 'member',
      type: 'tithe',
      amount: '',
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      description: '',
      paymentMethod: 'cash',
      receivedAt: new Date().toISOString().split('T')[0],
    });
  };

  // Abrir modal de edição
  const openEditDialog = (titheOffering: TitheOffering) => {
    setEditingTitheOffering(titheOffering);
    setFormData({
      personId: titheOffering.personId,
      personName: titheOffering.personName,
      personType: titheOffering.personType,
      type: titheOffering.type,
      amount: titheOffering.amount.toString(),
      month: titheOffering.month,
      year: titheOffering.year,
      description: titheOffering.description || '',
      paymentMethod: titheOffering.paymentMethod,
      receivedAt: titheOffering.receivedAt.toISOString().split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  // Salvar dízimo/oferta
  const handleSave = async () => {
    if (!formData.personId || !formData.personName || !formData.amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      personId: formData.personId,
      personName: formData.personName,
      personType: formData.personType,
      type: formData.type,
      amount: parseFloat(formData.amount),
      month: formData.month,
      year: formData.year,
      description: formData.description,
      paymentMethod: formData.paymentMethod,
      receivedBy: user?.id || '',
      receivedByName: user?.name || '',
      receivedAt: new Date(formData.receivedAt),
    };

    let result;
    if (editingTitheOffering) {
      result = await updateTitheOffering(editingTitheOffering.id, data);
    } else {
      result = await createTitheOffering(data);
    }

    if (result.success) {
      toast({
        title: "Sucesso",
        description: editingTitheOffering ? "Dízimo/Oferta atualizado com sucesso!" : "Dízimo/Oferta registrado com sucesso!",
      });
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      resetForm();
      setEditingTitheOffering(null);
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao salvar dízimo/oferta.",
        variant: "destructive",
      });
    }
  };

  // Excluir dízimo/oferta
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    const result = await deleteTitheOffering(id);
    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao excluir registro.",
        variant: "destructive",
      });
    }
  };

  // Exportar para Excel
  const handleExport = () => {
    // Implementar exportação para Excel
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de exportação será implementada em breve.",
    });
  };

  // Verificações de acesso
  if (!user || !['pastor', 'obreiro'].includes(user.role)) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para pastores e obreiros.</p>
      </div>
    );
  }

  if (loading || statsLoading) {
    return (
      <FancyLoader
        message="Organizando os tesouros da Videira"
        tips={[
          'Separando dízimos e ofertas...',
          'Calculando totais mensais...',
          'Preparando relatórios financeiros...',
        ]}
      />
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Erro ao carregar dados: {error}</p>
        <Button onClick={refetch} className="mt-4">Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dízimos e Ofertas
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Sistema completo de gestão financeira e análise de contribuições
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Dízimo/Oferta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Tipo de Pessoa */}
              <div>
                <Label htmlFor="personType">Tipo de Pessoa</Label>
                <Select value={formData.personType} onValueChange={(value: any) => setFormData({ ...formData, personType: value, personId: '', personName: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="frequentador">Frequentador</SelectItem>
                    <SelectItem value="lider">Líder</SelectItem>
                    <SelectItem value="discipulador">Discipulador</SelectItem>
                    <SelectItem value="pastor">Pastor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pessoa */}
              <div>
                <Label htmlFor="person">Pessoa</Label>
                <Select value={formData.personId} onValueChange={(value) => {
                  const person = filteredMembers.find(m => m.id === value);
                  setFormData({ ...formData, personId: value, personName: person?.name || '' });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a pessoa" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMembers.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Contribuição */}
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tithe">Dízimo</SelectItem>
                    <SelectItem value="offering">Oferta</SelectItem>
                    <SelectItem value="special_offering">Oferta Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor */}
              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              {/* Mês e Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">Mês</Label>
                  <Select value={formData.month.toString()} onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Ano</Label>
                  <Select value={formData.year.toString()} onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = currentDate.getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                <Select value={formData.paymentMethod} onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Recebimento */}
              <div>
                <Label htmlFor="receivedAt">Data de Recebimento</Label>
                <Input
                  id="receivedAt"
                  type="date"
                  value={formData.receivedAt}
                  onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })}
                />
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Observações sobre a contribuição..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="gradient-primary">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo Executivo */}
      {stats && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  R$ {stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-muted-foreground">Arrecadação Total</div>
                <div className="text-xs text-green-600 mt-1">
                  {stats.monthlyBreakdown.length} meses de dados
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.byPersonType.reduce((sum, item) => sum + item.count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total de Contribuições</div>
                <div className="text-xs text-blue-600 mt-1">
                  {stats.byPersonType.length} categorias de pessoas
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.byPaymentMethod.length}
                </div>
                <div className="text-sm text-muted-foreground">Métodos de Pagamento</div>
                <div className="text-xs text-purple-600 mt-1">
                  Diversidade de formas de contribuição
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="personTypeFilter">Tipo de Pessoa</Label>
              <Select value={personTypeFilter} onValueChange={setPersonTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="frequentador">Frequentador</SelectItem>
                  <SelectItem value="lider">Líder</SelectItem>
                  <SelectItem value="discipulador">Discipulador</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="typeFilter">Tipo de Contribuição</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="tithe">Dízimo</SelectItem>
                  <SelectItem value="offering">Oferta</SelectItem>
                  <SelectItem value="special_offering">Oferta Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="monthFilter">Período</Label>
              <div className="flex gap-2">
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Jan</SelectItem>
                    <SelectItem value="2">Fev</SelectItem>
                    <SelectItem value="3">Mar</SelectItem>
                    <SelectItem value="4">Abr</SelectItem>
                    <SelectItem value="5">Mai</SelectItem>
                    <SelectItem value="6">Jun</SelectItem>
                    <SelectItem value="7">Jul</SelectItem>
                    <SelectItem value="8">Ago</SelectItem>
                    <SelectItem value="9">Set</SelectItem>
                    <SelectItem value="10">Out</SelectItem>
                    <SelectItem value="11">Nov</SelectItem>
                    <SelectItem value="12">Dez</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = currentDate.getFullYear() - 2 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Total de Dízimos</CardTitle>
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                R$ {stats.totalTithes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.totalTithes / stats.totalAmount) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Total de Ofertas</CardTitle>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                R$ {stats.totalOfferings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.totalOfferings / stats.totalAmount) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">Ofertas Especiais</CardTitle>
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                R$ {stats.totalSpecialOfferings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.totalSpecialOfferings / stats.totalAmount) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow border-2 border-gradient-to-r from-blue-500 to-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Total Geral
              </CardTitle>
              <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                <Users className="h-4 w-4 text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                R$ {stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Arrecadação total do período
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Por Mês</TabsTrigger>
          <TabsTrigger value="personType">Por Tipo de Pessoa</TabsTrigger>
          <TabsTrigger value="paymentMethod">Por Método de Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Evolução Mensal de Contribuições
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Acompanhamento das contribuições ao longo dos meses
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats?.monthlyBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => monthNames[value - 1]}
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    stroke="#666"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                      name === 'tithes' ? 'Dízimos' : name === 'offerings' ? 'Ofertas' : 'Ofertas Especiais'
                    ]}
                    labelFormatter={(value) => `Mês: ${monthNames[value - 1]}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tithes" 
                    stroke={COLORS.tithe} 
                    strokeWidth={3}
                    name="Dízimos" 
                    dot={{ fill: COLORS.tithe, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.tithe, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="offerings" 
                    stroke={COLORS.offering} 
                    strokeWidth={3}
                    name="Ofertas" 
                    dot={{ fill: COLORS.offering, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.offering, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="specialOfferings" 
                    stroke={COLORS.specialOffering} 
                    strokeWidth={3}
                    name="Ofertas Especiais" 
                    dot={{ fill: COLORS.specialOffering, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.specialOffering, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personType">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Contribuições por Tipo de Pessoa
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribuição das contribuições por categoria de membro
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={stats?.byPersonType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="totalAmount"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {stats?.byPersonType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.personTypes[index % COLORS.personTypes.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                        'Valor Total'
                      ]}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        const typeMap = {
                          'member': 'Membros',
                          'frequentador': 'Frequentadores',
                          'lider': 'Líderes',
                          'discipulador': 'Discipuladores',
                          'pastor': 'Pastores'
                        };
                        return typeMap[data?.personType as keyof typeof typeMap] || data?.personType;
                      }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Detalhamento por Categoria</h4>
                  {stats?.byPersonType.map((item, index) => {
                    const typeMap = {
                      'member': 'Membros',
                      'frequentador': 'Frequentadores', 
                      'lider': 'Líderes',
                      'discipulador': 'Discipuladores',
                      'pastor': 'Pastores'
                    };
                    const percentage = stats.totalAmount > 0 ? ((item.totalAmount / stats.totalAmount) * 100).toFixed(1) : '0.0';
                    
                    return (
                      <div key={item.personType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS.personTypes[index % COLORS.personTypes.length] }}
                          />
                          <span className="font-medium">
                            {typeMap[item.personType as keyof typeof typeMap] || item.personType}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {percentage}% • {item.count} contribuições
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paymentMethod">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Contribuições por Método de Pagamento
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Análise das preferências de pagamento dos contribuintes
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stats?.byPaymentMethod} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="paymentMethod" 
                      tickFormatter={(value) => {
                        const methodMap = {
                          'cash': 'Dinheiro',
                          'pix': 'PIX',
                          'card': 'Cartão',
                          'bank_transfer': 'Transferência'
                        };
                        return methodMap[value as keyof typeof methodMap] || value;
                      }}
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      stroke="#666"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                        'Valor Total'
                      ]}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        const methodMap = {
                          'cash': 'Dinheiro',
                          'pix': 'PIX',
                          'card': 'Cartão',
                          'bank_transfer': 'Transferência'
                        };
                        return methodMap[data?.paymentMethod as keyof typeof methodMap] || data?.paymentMethod;
                      }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="totalAmount" 
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    >
                      {stats?.byPaymentMethod.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.paymentMethods[index % COLORS.paymentMethods.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats?.byPaymentMethod.map((item, index) => {
                    const methodMap = {
                      'cash': 'Dinheiro',
                      'pix': 'PIX',
                      'card': 'Cartão',
                      'bank_transfer': 'Transferência'
                    };
                    const percentage = stats.totalAmount > 0 ? ((item.totalAmount / stats.totalAmount) * 100).toFixed(1) : '0.0';
                    const iconMap = {
                      'cash': '💵',
                      'pix': '📱',
                      'card': '💳',
                      'bank_transfer': '🏦'
                    };
                    
                    return (
                      <div key={item.paymentMethod} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{iconMap[item.paymentMethod as keyof typeof iconMap]}</span>
                          <span className="font-medium text-sm">
                            {methodMap[item.paymentMethod as keyof typeof methodMap] || item.paymentMethod}
                          </span>
                        </div>
                        <div className="text-2xl font-bold">
                          R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {percentage}% • {item.count} transações
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tabela de Registros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registros ({tithesOfferings.length})</CardTitle>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pessoa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contribuição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tithesOfferings.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.personName}</div>
                      <Badge variant="secondary" className="text-xs">
                        {item.personType === 'member' && 'Membro'}
                        {item.personType === 'frequentador' && 'Frequentador'}
                        {item.personType === 'lider' && 'Líder'}
                        {item.personType === 'discipulador' && 'Discipulador'}
                        {item.personType === 'pastor' && 'Pastor'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'tithe' ? 'default' : item.type === 'offering' ? 'secondary' : 'outline'}>
                      {item.type === 'tithe' && 'Dízimo'}
                      {item.type === 'offering' && 'Oferta'}
                      {item.type === 'special_offering' && 'Oferta Especial'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.month}/{item.year}</TableCell>
                  <TableCell className="font-medium">
                    R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {item.paymentMethod === 'cash' && 'Dinheiro'}
                    {item.paymentMethod === 'pix' && 'PIX'}
                    {item.paymentMethod === 'card' && 'Cartão'}
                    {item.paymentMethod === 'bank_transfer' && 'Transferência'}
                  </TableCell>
                  <TableCell>{item.receivedAt.toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Dízimo/Oferta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mesmo formulário do modal de criação */}
            {/* ... (código do formulário igual ao modal de criação) ... */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
