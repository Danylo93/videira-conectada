import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Phone, Mail } from 'lucide-react';
import { Discipulador } from '@/types/church';
import FancyLoader from '@/components/FancyLoader';

export function DiscipuladorManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discipuladores, setDiscipuladores] = useState<Discipulador[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, created_at')
      .eq('pastor_uuid', user.id)
      .eq('role', 'discipulador')
      .order('created_at', { ascending: false });

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
  }, [user, loadDiscipuladores]);

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

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Discipuladores</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Discipulador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Discipulador</DialogTitle>
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
            Lista de Discipuladores
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Nome</TableHead>
                <TableHead className="min-w-[220px]">Email</TableHead>
                <TableHead className="min-w-[160px]">Telefone</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

