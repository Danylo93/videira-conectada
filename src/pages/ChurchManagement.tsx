import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SimpleProfile {
  id: string;
  name: string;
}

export function ChurchManagement() {
  const { user } = useAuth();
  const [discipuladores, setDiscipuladores] = useState<SimpleProfile[]>([]);

  const [newDiscipulador, setNewDiscipulador] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    network: 'Jovens',
  });

  const [newLider, setNewLider] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    discipuladorId: '',
  });

  useEffect(() => {
    if (user?.role === 'pastor') {
      loadDiscipuladores();
    }
  }, [user]);

  const loadDiscipuladores = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'discipulador')
      .order('name');

    if (error) {
      console.error('Erro ao carregar discipuladores:', error);
      return;
    }

    setDiscipuladores(data || []);
  };

  if (!user || user.role !== 'pastor') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito aos pastores.</p>
      </div>
    );
  }

  const createAuthUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      console.error('Erro ao criar usuário de autenticação:', error);
      return null;
    }
    return data.user.id;
  };

  const handleAddDiscipulador = async () => {
    const userId = await createAuthUser(newDiscipulador.email, 'Videira@123');
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: userId,
          name: newDiscipulador.name,
          email: newDiscipulador.email,
          phone: newDiscipulador.phone,
          address: newDiscipulador.address,
          network: newDiscipulador.network,
          role: 'discipulador',
          pastor_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar discipulador:', error);
      return;
    }

    setDiscipuladores([...discipuladores, { id: data.id, name: data.name }]);
    setNewDiscipulador({ name: '', email: '', phone: '', address: '', network: 'Jovens' });
  };

  const handleAddLider = async () => {
    if (!newLider.discipuladorId) return;

    const userId = await createAuthUser(newLider.email, 'Videira@123');
    if (!userId) return;

    const { error } = await supabase.from('profiles').insert([
      {
        user_id: userId,
        name: newLider.name,
        email: newLider.email,
        phone: newLider.phone,
        address: newLider.address,
        role: 'lider',
        discipulador_id: newLider.discipuladorId,
        pastor_id: user.id,
      },
    ]);

    if (error) {
      console.error('Erro ao adicionar líder:', error);
      return;
    }

    setNewLider({ name: '', email: '', phone: '', address: '', discipuladorId: '' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold">Gerenciar Igreja</h1>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Discipulador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="disc-name">Nome</Label>
            <Input id="disc-name" value={newDiscipulador.name} onChange={e => setNewDiscipulador({ ...newDiscipulador, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="disc-email">Email</Label>
            <Input id="disc-email" type="email" value={newDiscipulador.email} onChange={e => setNewDiscipulador({ ...newDiscipulador, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="disc-phone">Telefone</Label>
            <Input id="disc-phone" value={newDiscipulador.phone} onChange={e => setNewDiscipulador({ ...newDiscipulador, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="disc-address">Endereço</Label>
            <Input id="disc-address" value={newDiscipulador.address} onChange={e => setNewDiscipulador({ ...newDiscipulador, address: e.target.value })} />
          </div>
          <div>
            <Label>Rede</Label>
            <Select value={newDiscipulador.network} onValueChange={value => setNewDiscipulador({ ...newDiscipulador, network: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jovens">Jovens</SelectItem>
                <SelectItem value="Adultos">Adultos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddDiscipulador} className="w-full">Adicionar Discipulador</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Líder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lider-name">Nome</Label>
            <Input id="lider-name" value={newLider.name} onChange={e => setNewLider({ ...newLider, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lider-email">Email</Label>
            <Input id="lider-email" type="email" value={newLider.email} onChange={e => setNewLider({ ...newLider, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lider-phone">Telefone</Label>
            <Input id="lider-phone" value={newLider.phone} onChange={e => setNewLider({ ...newLider, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="lider-address">Endereço</Label>
            <Input id="lider-address" value={newLider.address} onChange={e => setNewLider({ ...newLider, address: e.target.value })} />
          </div>
          <div>
            <Label>Discipulador</Label>
            <Select value={newLider.discipuladorId} onValueChange={value => setNewLider({ ...newLider, discipuladorId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {discipuladores.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddLider} className="w-full">Adicionar Líder</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChurchManagement;
