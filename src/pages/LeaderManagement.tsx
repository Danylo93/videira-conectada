import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Phone, Mail } from 'lucide-react';
import { Leader } from '@/types/church';

export function LeaderManagement() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLeader, setNewLeader] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    if (user && user.role === 'discipulador') {
      loadLeaders();
    }
  }, [user]);

  const loadLeaders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, created_at, pastor_id')
      .eq('discipulador_id', user.id)
      .eq('role', 'lider')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading leaders:', error);
      return;
    }

    const formatted: Leader[] = (data || []).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone || undefined,
      discipuladorId: user.id,
      pastorId: l.pastor_id || undefined,
      createdAt: new Date(l.created_at),
    }));
    setLeaders(formatted);
  };

  if (!user || user.role !== 'discipulador') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para discipuladores.</p>
      </div>
    );
  }

  const handleAddLeader = async () => {
    if (!user) return;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newLeader.email,
      password: newLeader.password,
      email_confirm: true,
      user_metadata: { name: newLeader.name, phone: newLeader.phone },
    });

    if (authError || !authData.user) {
      console.error('Error creating leader user:', authError);
      return;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: authData.user.id,
          name: newLeader.name,
          email: newLeader.email,
          phone: newLeader.phone || null,
          discipulador_id: user.id,
          pastor_id: user.pastorId || null,
          role: 'lider',
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return;
    }

    if (!profileError) {
      const leaderData: Leader = {
        id: authData.user.id,
        name: newLeader.name,
        email: newLeader.email,
        phone: newLeader.phone || undefined,
        discipuladorId: user.id,
        pastorId: user.pastorId || undefined,
        createdAt: new Date(),
      };

      setLeaders([leaderData, ...leaders]);
      setIsAddDialogOpen(false);
      setNewLeader({ name: '', email: '', phone: '', password: '' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Meus Líderes</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Líder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Líder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={newLeader.name} onChange={(e) => setNewLeader({ ...newLeader, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={newLeader.email} onChange={(e) => setNewLeader({ ...newLeader, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={newLeader.phone} onChange={(e) => setNewLeader({ ...newLeader, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha Inicial</Label>
                <Input id="password" type="password" value={newLeader.password} onChange={(e) => setNewLeader({ ...newLeader, password: e.target.value })} />
              </div>
              <Button onClick={handleAddLeader} className="w-full gradient-primary">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Lista de Líderes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaders.map((leader) => (
                <TableRow key={leader.id}>
                  <TableCell className="font-medium">{leader.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3" />
                      {leader.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {leader.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3" />
                        {leader.phone}
                      </div>
                    )}
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
