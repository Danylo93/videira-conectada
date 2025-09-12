import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Member } from '@/types/church';

// Mock data
const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Maria Silva',
    phone: '(11) 99999-1111',
    email: 'maria@email.com',
    type: 'member',
    liderId: '4',
    joinDate: new Date('2024-01-15'),
    lastPresence: new Date('2024-12-08'),
    active: true,
  },
  {
    id: '2',
    name: 'João Santos',
    phone: '(11) 99999-2222',
    email: 'joao@email.com',
    type: 'member',
    liderId: '4',
    joinDate: new Date('2024-03-20'),
    lastPresence: new Date('2024-12-08'),
    active: true,
  },
  {
    id: '3',
    name: 'Ana Costa',
    phone: '(11) 99999-3333',
    type: 'frequentador',
    liderId: '4',
    joinDate: new Date('2024-11-01'),
    lastPresence: new Date('2024-12-01'),
    active: true,
  },
];

export function CellManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'member' as 'member' | 'frequentador',
  });

  if (!user || user.role !== 'lider') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para líderes de célula.</p>
      </div>
    );
  }

  const handleAddMember = () => {
    const member: Member = {
      id: Date.now().toString(),
      name: newMember.name,
      phone: newMember.phone,
      email: newMember.email,
      type: newMember.type,
      liderId: user.id,
      joinDate: new Date(),
      active: true,
    };

    setMembers([...members, member]);
    setNewMember({ name: '', phone: '', email: '', type: 'member' });
    setIsAddDialogOpen(false);
  };

  const totalMembers = members.filter(m => m.type === 'member').length;
  const totalVisitors = members.filter(m => m.type === 'frequentador').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minha Célula</h1>
          <p className="text-muted-foreground">{user.celula}</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Pessoa
            </Button>
          </DialogTrigger>
          <DialogContent>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Data de Entrada</TableHead>
                <TableHead>Última Presença</TableHead>
                <TableHead>Ações</TableHead>
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
                    <div className="flex gap-2">
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