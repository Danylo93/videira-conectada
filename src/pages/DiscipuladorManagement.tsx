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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { Discipulador } from '@/types/church';
import FancyLoader from '@/components/FancyLoader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function DiscipuladorManagement() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const { toast } = useToast();
  const isKidsMode = mode === 'kids';
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDiscipulador, setEditingDiscipulador] = useState<Discipulador | null>(null);
  const [newDiscipulador, setNewDiscipulador] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const loadDiscipuladores = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
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
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading discipuladores:', error);
      setLoading(false);
      return;
    }

    const formatted: Discipulador[] = (data || []).map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone || undefined,
      pastorId: user.id,
      createdAt: new Date(d.created_at),
    }));
    setDiscipuladores(formatted);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'pastor') {
      void loadDiscipuladores();
    } else {
      setLoading(false);
    }
  }, [user, mode, loadDiscipuladores]);

  if (!user || user.role !== 'pastor') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para pastores.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <FancyLoader
        message="Reunindo discipuladores frutíferos"
        tips={[
          'Afinando os instrumentos da orquestra pastoral…',
          'Separando os melhores cachos da Videira…',
          'Chamando Barnabé pra animar a tropa…',
        ]}
      />
    );
  }

  const handleAddDiscipulador = async () => {
    if (!user) return;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newDiscipulador.email,
      password: newDiscipulador.password,
      email_confirm: true,
      user_metadata: { name: newDiscipulador.name, phone: newDiscipulador.phone },
    });

    if (authError || !authData.user) {
      console.error('Error creating discipulador user:', authError);
      toast({
        title: 'Erro',
        description: 'Falha ao criar usuário do discipulador.',
        variant: 'destructive',
      });
      return;
    }

    const profilePayload = {
      user_id: authData.user.id,
      name: newDiscipulador.name,
      email: newDiscipulador.email,
      phone: newDiscipulador.phone || null,
      discipulador_uuid: null,
      pastor_uuid: user.id,
      role: 'discipulador' as const,
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
          description: 'Não foi possível salvar o perfil do discipulador.',
          variant: 'destructive',
        });
        return;
      }

      profileId = updateData.id;
    } else if (insertError || !insertData) {
      console.error('Error inserting profile:', insertError);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil do discipulador.',
        variant: 'destructive',
      });
      return;
    } else {
      profileId = insertData.id;
    }

    const discipuladorData: Discipulador = {
      id: profileId,
      name: newDiscipulador.name,
      email: newDiscipulador.email,
      phone: newDiscipulador.phone || undefined,
      pastorId: user.id,
      createdAt: new Date(),
    };

    setDiscipuladores([discipuladorData, ...discipuladores]);
    await loadDiscipuladores();
    setIsAddDialogOpen(false);
    setNewDiscipulador({ name: '', email: '', phone: '', password: '' });
    toast({ title: 'Sucesso', description: 'Discipulador cadastrado com sucesso!' });
  };

  const handleEditDiscipulador = (discipulador: Discipulador) => {
    setEditingDiscipulador(discipulador);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDiscipulador = async () => {
    if (!user || !editingDiscipulador || user.role !== 'pastor') return;

    // Buscar o user_id e email atual do perfil
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email')
      .eq('id', editingDiscipulador.id)
      .single();

    if (profileError || !profileData) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encontrar o perfil do discipulador.',
        variant: 'destructive',
      });
      return;
    }

    // Atualizar o perfil
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        name: editingDiscipulador.name,
        email: editingDiscipulador.email,
        phone: editingDiscipulador.phone || null,
        is_kids: isKidsMode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingDiscipulador.id);

    if (updateError) {
      console.error('Error updating discipulador:', updateError);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o discipulador.',
        variant: 'destructive',
      });
      return;
    }

    // Atualizar email no auth se necessário
    if (editingDiscipulador.email !== profileData.email) {
      await supabaseAdmin.auth.admin.updateUserById(profileData.user_id, {
        email: editingDiscipulador.email,
      });
    }

    await loadDiscipuladores();
    setIsEditDialogOpen(false);
    setEditingDiscipulador(null);
    toast({ title: 'Sucesso', description: 'Discipulador atualizado com sucesso!' });
  };

  const handleDeleteDiscipulador = async (discipuladorId: string) => {
    if (!user || user.role !== 'pastor') return;

    // Buscar o user_id do perfil
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('id', discipuladorId)
      .single();

    if (profileError || !profileData) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encontrar o perfil do discipulador.',
        variant: 'destructive',
      });
      return;
    }

    // Deletar o usuário do auth (isso vai deletar o perfil automaticamente devido ao CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profileData.user_id);

    if (deleteError) {
      console.error('Error deleting discipulador:', deleteError);
      toast({
        title: 'Erro',
        description: 'Falha ao deletar o discipulador.',
        variant: 'destructive',
      });
      return;
    }

    await loadDiscipuladores();
    toast({ title: 'Sucesso', description: 'Discipulador deletado com sucesso!' });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {isKidsMode ? 'Discipuladoras Kids' : 'Discipuladores'}
        </h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              {isKidsMode ? 'Nova Discipuladora' : 'Novo Discipulador'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isKidsMode ? 'Adicionar Discipuladora Kids' : 'Adicionar Discipulador'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newDiscipulador.name}
                  onChange={(e) => setNewDiscipulador({ ...newDiscipulador, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newDiscipulador.email}
                  onChange={(e) => setNewDiscipulador({ ...newDiscipulador, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newDiscipulador.phone}
                  onChange={(e) => setNewDiscipulador({ ...newDiscipulador, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha Inicial</Label>
                <Input
                  id="password"
                  type="password"
                  value={newDiscipulador.password}
                  onChange={(e) => setNewDiscipulador({ ...newDiscipulador, password: e.target.value })}
                />
              </div>
              <Button onClick={handleAddDiscipulador} className="w-full gradient-primary">
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
            {isKidsMode ? 'Lista de Discipuladoras Kids' : 'Lista de Discipuladores'}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Nome</TableHead>
                <TableHead className="min-w-[220px]">Email</TableHead>
                <TableHead className="min-w-[160px]">Telefone</TableHead>
                <TableHead className="min-w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discipuladores.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3" />
                      {d.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {d.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3" />
                        {d.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDiscipulador(d)}
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
                              Tem certeza que deseja deletar o discipulador {d.name}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteDiscipulador(d.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Deletar
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isKidsMode ? 'Editar Discipuladora Kids' : 'Editar Discipulador'}
            </DialogTitle>
          </DialogHeader>
          {editingDiscipulador && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingDiscipulador.name}
                  onChange={(e) =>
                    setEditingDiscipulador({ ...editingDiscipulador, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingDiscipulador.email}
                  onChange={(e) =>
                    setEditingDiscipulador({ ...editingDiscipulador, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editingDiscipulador.phone || ''}
                  onChange={(e) =>
                    setEditingDiscipulador({ ...editingDiscipulador, phone: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleUpdateDiscipulador} className="w-full gradient-primary">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

