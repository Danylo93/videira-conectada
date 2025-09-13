import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Grape, Loader2 } from 'lucide-react';

export function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      await login(email, password);
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login buttons
  const handleDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    try {
      await login(demoEmail, '123456');
    } catch (_) {
      try {
        const { error } = await supabase.auth.signUp({
          email: demoEmail,
          password: '123456',
          options: {
            data: {
              name: getDemoName(demoEmail),
            },
          },
        });
        if (error) throw error;
        await login(demoEmail, '123456');
      } catch {
        toast({
          title: "Erro no login",
          description: "Erro ao fazer login com conta demo",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    await ensureDemoHierarchy();
    navigate('/');
    setIsLoading(false);
  };

  const getDemoName = (email: string) => {
    const names = {
      'pastor@videirasaomiguel.com': 'Pastor João Silva',
      'obreiro@videirasaomiguel.com': 'Obreiro Maria Santos',
      'discipulador@videirasaomiguel.com': 'Discipulador Carlos Lima',
      'lider@videirasaomiguel.com': 'Líder Ana Costa',
    };
    return names[email as keyof typeof names] || 'Usuário Demo';
  };

  // Ensure demo users have the correct roles and relationships
  const ensureDemoHierarchy = async () => {
    // Fetch demo profiles
    const { data: pastor } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'pastor@videirasaomiguel.com')
      .single();

    const { data: discipulador } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'discipulador@videirasaomiguel.com')
      .single();

    const { data: obreiro } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'obreiro@videirasaomiguel.com')
      .single();

    const { data: lider } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'lider@videirasaomiguel.com')
      .single();

    // Update roles and links
    if (pastor) {
      await supabase.from('profiles').update({ role: 'pastor' }).eq('id', pastor.id);
    }

    if (discipulador && pastor) {
      await supabase
        .from('profiles')
        .update({ role: 'discipulador', pastor_id: pastor.id })
        .eq('id', discipulador.id);
    }

    if (obreiro && pastor) {
      await supabase
        .from('profiles')
        .update({ role: 'obreiro', pastor_id: pastor.id })
        .eq('id', obreiro.id);
    }

    if (lider && discipulador && pastor) {
      await supabase
        .from('profiles')
        .update({ role: 'lider', discipulador_id: discipulador.id, pastor_id: pastor.id })
        .eq('id', lider.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center shadow-grape-glow">
              <Grape className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Videira São Miguel
            </h1>
            <p className="text-muted-foreground">
              Sistema de Gestão Eclesiástica
            </p>
          </div>
        </div>

        {/* Demo Login Buttons */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-sm text-muted-foreground">
              Contas de Demonstração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDemoLogin('pastor@videirasaomiguel.com')}
              disabled={isLoading}
            >
              Entrar como Pastor
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDemoLogin('obreiro@videirasaomiguel.com')}
              disabled={isLoading}
            >
              Entrar como Obreiro
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDemoLogin('discipulador@videirasaomiguel.com')}
              disabled={isLoading}
            >
              Entrar como Discipulador
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleDemoLogin('lider@videirasaomiguel.com')}
              disabled={isLoading}
            >
              Entrar como Líder
            </Button>
          </CardContent>
        </Card>

        {/* Auth Forms */}
        <Card className="backdrop-blur-sm bg-background/80 border-primary/20 shadow-grape-glow">
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Cadastrar'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}