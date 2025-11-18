import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileMode } from '@/contexts/ProfileModeContext';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { Leader, Discipulador } from '@/types/church';
import FancyLoader from '@/components/FancyLoader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function LeaderManagement() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const { toast } = useToast();
  const isKidsMode = mode === 'kids';
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [newLeader, setNewLeader] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    discipuladorId: '',
  });

  const loadDiscipuladores = useCallback(async () => {
    if (!user || user.role !== 'pastor') return;
    
    let query = supabase
      .from('profiles')
      .select('id, name, email, phone, created_at, is_kids')
      .eq('pastor_uuid', user.id)
      .eq('role', 'discipulador');
    
    // No modo Kids, mostrar apenas os do modo Kids. No modo normal, mostrar apenas os do modo normal
    if (isKidsMode) {
      query = query.eq('is_kids', true);
    } else {
      query = query.or('is_kids.is.null,is_kids.eq.false');
    }
    
    const { data } = await query.order('created_at', { ascending: false });

    const formatted: Discipulador[] = (data || []).map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone || undefined,
      pastorId: user.id,
      createdAt: new Date(d.created_at),
    }));
    setDiscipuladores(formatted);
  }, [user]);

  const loadLeaders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('id, name, email, phone, created_at, pastor_uuid, discipulador_uuid, is_kids')
      .eq('role', 'lider');

    // No modo Kids, mostrar apenas os do modo Kids. No modo normal, mostrar apenas os do modo normal
    if (isKidsMode) {
      query = query.eq('is_kids', true);
    } else {
      query = query.or('is_kids.is.null,is_kids.eq.false');
    }

    if (user.role === 'discipulador') {
      query = query.eq('discipulador_uuid', user.id);
    } else if (user.role === 'pastor') {
      query = query.eq('pastor_uuid', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading leaders:', error);
      setLoading(false);
      return;
    }

    const formatted: Leader[] = (data || []).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone || undefined,
      discipuladorId: l.discipulador_uuid || user.id,
      pastorId: l.pastor_uuid || undefined,
      createdAt: new Date(l.created_at),
    }));
    setLeaders(formatted);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user && (user.role === 'discipulador' || user.role === 'pastor')) {
      if (user.role === 'pastor') {
        void loadDiscipuladores();
      }
      void loadLeaders();
    } else {
      setLoading(false);
    }
  }, [user, mode, loadLeaders, loadDiscipuladores]);

  if (!user || (user.role !== 'discipulador' && user.role !== 'pastor')) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para discipuladores e pastores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Organizando os valentes da sua rede"
        tips={[
          'Contando líderes como Josué conferindo o exército…',
          'Acendendo tochas pra iluminar os novos cadastros…',
          'Preparando pão quentinho pra reunião de liderança…',
        ]}
      />
    );
  }

  const handleAddLeader = async () => {
    if (!user) return;

    // Validação: se for pastor, precisa selecionar um discipulador
    if (user.role === 'pastor' && !newLeader.discipuladorId) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um discipulador.',
        variant: 'destructive',
      });
      return;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newLeader.email,
      password: newLeader.password,
      email_confirm: true,
      user_metadata: { name: newLeader.name, phone: newLeader.phone },
    });

    if (authError || !authData.user) {
      console.error('Error creating leader user:', authError);
      toast({
        title: 'Erro',
        description: 'Falha ao criar usuário do líder.',
        variant: 'destructive',
      });
      return;
    }

    const discipuladorId = user.role === 'pastor' ? newLeader.discipuladorId : user.id;
    const profilePayload = {
      user_id: authData.user.id,
      name: newLeader.name,
      email: newLeader.email,
      phone: newLeader.phone || null,
      discipulador_uuid: discipuladorId,
      pastor_uuid: user.role === 'pastor' ? user.id : (user.pastorId || null),
      role: 'lider' as const,
      is_kids: isKidsMode,
    };

    let profileId: string | null = null;

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profilePayload)
      .select('id')
      .single();

    if (insertError && insertError.code === '23505') {
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profilePayload)
        .eq('user_id', authData.user.id)
        .select('id')
        .single();

      if (updateError || !updateData) {
        console.error('Error updating profile:', updateError);
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar o perfil do líder.',
          variant: 'destructive',
        });
        return;
      }

      profileId = updateData.id;
    } else if (insertError || !insertData) {
      console.error('Error inserting profile:', insertError);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil do líder.',
        variant: 'destructive',
      });
      return;
    } else {
      profileId = insertData.id;
    }

    const leaderData: Leader = {
      id: profileId,
      name: newLeader.name,
      email: newLeader.email,
      phone: newLeader.phone || undefined,
      discipuladorId: discipuladorId,
      pastorId: user.role === 'pastor' ? user.id : (user.pastorId || undefined),
      createdAt: new Date(),
    };

    setLeaders([leaderData, ...leaders]);
    await loadLeaders();
    setIsAddDialogOpen(false);
    setNewLeader({ name: '', email: '', phone: '', password: '', discipuladorId: '' });
    toast({ title: 'Sucesso', description: 'Líder cadastrado com sucesso!' });
  };

  const handleEditLeader = (leader: Leader) => {
    setEditingLeader(leader);
    setIsEditDialogOpen(true);
  };

  const handleUpdateLeader = async () => {
    if (!user || !editingLeader || user.role !== 'pastor') return;

    // Buscar o user_id e email atual do perfil
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email')
      .eq('id', editingLeader.id)
      .single();

    if (profileError || !profileData) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encontrar o perfil do líder.',
        variant: 'destructive',
      });
      return;
    }

    // Atualizar o perfil
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        name: editingLeader.name,
        email: editingLeader.email,
        phone: editingLeader.phone || null,
        discipulador_uuid: editingLeader.discipuladorId,
        is_kids: isKidsMode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingLeader.id);

    if (updateError) {
      console.error('Error updating leader:', updateError);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o líder.',
        variant: 'destructive',
      });
      return;
    }

    // Atualizar email no auth se necessário
    if (editingLeader.email !== profileData.email) {
      await supabaseAdmin.auth.admin.updateUserById(profileData.user_id, {
        email: editingLeader.email,
      });
    }

    await loadLeaders();
    setIsEditDialogOpen(false);
    setEditingLeader(null);
    toast({ title: 'Sucesso', description: 'Líder atualizado com sucesso!' });
  };

  const handleDeleteLeader = async (leaderId: string) => {
    if (!user || user.role !== 'pastor') return;

    // Buscar o user_id do perfil
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('id', leaderId)
      .single();

    if (profileError || !profileData) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encontrar o perfil do líder.',
        variant: 'destructive',
      });
      return;
    }

    // Deletar o usuário do auth (isso vai deletar o perfil automaticamente devido ao CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profileData.user_id);

    if (deleteError) {
      console.error('Error deleting leader:', deleteError);
      toast({
        title: 'Erro',
        description: 'Falha ao deletar o líder.',
        variant: 'destructive',
      });
      return;
    }

    await loadLeaders();
    toast({ title: 'Sucesso', description: 'Líder deletado com sucesso!' });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {isKidsMode ? 'Líderes Kids' : 'Líderes'}
        </h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              {isKidsMode ? 'Novo Líder Kids' : 'Novo Líder'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isKidsMode ? 'Adicionar Líder Kids' : 'Adicionar Líder'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {user.role === 'pastor' && (
                <div className="space-y-2">
                  <Label htmlFor="discipulador">
                    {isKidsMode ? 'Discipuladora' : 'Discipulador'}
                  </Label>
                  <Select value={newLeader.discipuladorId} onValueChange={(value) => setNewLeader({ ...newLeader, discipuladorId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={isKidsMode ? 'Selecione uma discipuladora' : 'Selecione um discipulador'} />
                    </SelectTrigger>
                    <SelectContent>
                      {discipuladores.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
            {isKidsMode ? 'Lista de Líderes Kids' : 'Lista de Líderes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Nome</TableHead>
                <TableHead className="min-w-[220px]">Email</TableHead>
                <TableHead className="min-w-[160px]">Telefone</TableHead>
                {user.role === 'pastor' && (
                  <TableHead className="min-w-[120px]">Ações</TableHead>
                )}
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
                  {user.role === 'pastor' && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLeader(leader)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar o líder {leader.name}? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteLeader(leader.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isKidsMode ? 'Editar Líder Kids' : 'Editar Líder'}
            </DialogTitle>
          </DialogHeader>
          {editingLeader && (
            <div className="space-y-4">
              {user.role === 'pastor' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-discipulador">
                    {isKidsMode ? 'Discipuladora' : 'Discipulador'}
                  </Label>
                  <Select
                    value={editingLeader.discipuladorId}
                    onValueChange={(value) =>
                      setEditingLeader({ ...editingLeader, discipuladorId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isKidsMode ? 'Selecione uma discipuladora' : 'Selecione um discipulador'} />
                    </SelectTrigger>
                    <SelectContent>
                      {discipuladores.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingLeader.name}
                  onChange={(e) =>
                    setEditingLeader({ ...editingLeader, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingLeader.email}
                  onChange={(e) =>
                    setEditingLeader({ ...editingLeader, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editingLeader.phone || ''}
                  onChange={(e) =>
                    setEditingLeader({ ...editingLeader, phone: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleUpdateLeader} className="w-full gradient-primary">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
