import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar 
} from 'lucide-react';
import { Member, Leader } from '@/types/church';
import FancyLoader from '@/components/FancyLoader';

export function CellManagement() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'member' as 'member' | 'frequentador',
  });

  // Load leaders for pastor
  const loadLeaders = useCallback(async () => {
    if (!user || user.role !== 'pastor') return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, celula')
      .eq('role', 'lider')
      .eq('pastor_uuid', user.id)
      .order('name');

    if (error) {
      console.error('Error loading leaders:', error);
      return;
    }

    const formatted: Leader[] = (data || []).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email || '',
      discipuladorId: '',
      createdAt: new Date(),
    }));
    setLeaders(formatted);
  }, [user]);

  // Load members on component mount
  const loadMembers = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const liderId = user.role === 'pastor' ? selectedLeaderId : user.id;
    
    if (user.role === 'pastor' && !selectedLeaderId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('lider_id', liderId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading members:', error);
      setLoading(false);
      return;
    }

    const formattedMembers: Member[] = (data || []).map(member => ({
      id: member.id,
      name: member.name,
      phone: member.phone,
      email: member.email,
      type: member.type as 'member' | 'frequentador',
      liderId: member.lider_id,
      joinDate: new Date(member.join_date),
      lastPresence: member.last_presence ? new Date(member.last_presence) : undefined,
      active: member.active,
    }));

    setMembers(formattedMembers);
    setLoading(false);
  }, [user, selectedLeaderId]);

  useEffect(() => {
    if (user && user.role === 'pastor') {
      void loadLeaders();
    }
  }, [user, loadLeaders]);

  useEffect(() => {
    if (user && (user.role === 'lider' || (user.role === 'pastor' && selectedLeaderId))) {
      void loadMembers();
    } else {
      setLoading(false);
    }
  }, [user, selectedLeaderId, loadMembers]);

  if (!user || (user.role !== 'lider' && user.role !== 'pastor')) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para líderes de célula e pastores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Cuidando da sua vinha com carinho"
        tips={[
          'Chamando os discípulos para a roda de oração…',
          'Conferindo cada ovelha pelo nome como o Bom Pastor…',
          'Preparando pãozinho e suco de uva para a célula…',
        ]}
      />
    );
  }

  const handleAddMember = async () => {
    if (!user) return;

    const liderId = user.role === 'pastor' ? selectedLeaderId : user.id;
    
    if (user.role === 'pastor' && !selectedLeaderId) {
      return;
    }
    
    const { data, error } = await supabase
      .from('members')
      .insert([
        {
          name: newMember.name,
          phone: newMember.phone || null,
          email: newMember.email || null,
          type: newMember.type,
          lider_id: liderId,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding member:', error);
      return;
    }

    // Add to local state
    const newMemberData: Member = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      type: data.type as 'member' | 'frequentador',
      liderId: data.lider_id,
      joinDate: new Date(data.join_date),
      active: data.active,
    };

    setMembers([newMemberData, ...members]);
    setNewMember({ name: '', phone: '', email: '', type: 'member' });
    setIsAddDialogOpen(false);
  };

  const totalMembers = members.filter(m => m.type === 'member').length;
  const totalVisitors = members.filter(m => m.type === 'frequentador').length;

  const selectedLeader = user.role === 'pastor' ? leaders.find(l => l.id === selectedLeaderId) : null;
  const cellName = user.role === 'pastor' 
    ? (selectedLeader ? `Célula de ${selectedLeader.name}` : 'Selecione um líder')
    : user.celula;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {user.role === 'pastor' ? 'Gerenciar Células' : 'Minha Célula'}
          </h1>
          {user.role === 'pastor' ? (
            <div className="mt-2">
              <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  {leaders.map((leader) => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm md:text-base text-muted-foreground">{cellName}</p>
          )}
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary" disabled={user.role === 'pastor' && !selectedLeaderId}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Pessoa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Pessoa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={newMember.type} onValueChange={(value: 'member' | 'frequentador') => setNewMember({ ...newMember, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="frequentador">Frequentador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} className="w-full gradient-primary">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalMembers}</div>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequentadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{totalVisitors}</div>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{members.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Lista de Pessoas
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Nome</TableHead>
                <TableHead className="min-w-[120px]">Tipo</TableHead>
                <TableHead className="min-w-[160px]">Contato</TableHead>
                <TableHead className="min-w-[150px]">Data de Entrada</TableHead>
                <TableHead className="min-w-[150px]">Última Presença</TableHead>
                <TableHead className="min-w-[110px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <Badge variant={member.type === 'member' ? 'default' : 'secondary'}>
                      {member.type === 'member' ? 'Membro' : 'Frequentador'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {member.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3" />
                      {member.joinDate.toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.lastPresence && (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {member.lastPresence.toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
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