import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Grape, Loader2, Eye, EyeOff } from 'lucide-react';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useLoadingState } from '@/hooks/useLoadingState';
import FancyLoader from '@/components/FancyLoader';
import { AuthTransition } from '@/types/auth';

type AuthLoaderCopy = {
  message: string;
  tips: string[];
};

const AUTH_LOADER_COPY: Record<AuthTransition, AuthLoaderCopy> = {
  initial: {
    message: 'Aquecendo o coração da Videira',
    tips: [
      'Conferindo se o seu login está no rol dos santos digitais…',
      'Chamando Gabriel pra guardar a senha…',
      'Espremendo uvas fresquinhas pra sessão começar!',
    ],
  },
  login: {
    message: 'Conferindo os pergaminhos do seu acesso',
    tips: [
      'Girando as chaves de Pedro pra abrir a porta certa…',
      'Procurando o selo real com o seu nome carimbado…',
      'Mandando um aleluia pro servidor antes de liberar a entrada…',
    ],
  },
  logout: {
    message: 'Recolhendo as cadeiras da célula com carinho',
    tips: [
      'Guardando o cajado do líder até a próxima batalha…',
      'Encerrando o culto digital com bênção apostólica…',
      'Lustrando o cálice pra quando você voltar sedento…',
    ],
  },
};

export function Auth() {
  const [bootReady, setBootReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, authTransition } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { loading: isLoading, withLoading } = useLoadingState();

  useEffect(() => {
    const t = setTimeout(() => setBootReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const showLoader = useDelayedLoading(!isLoading && bootReady, 3500);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    await withLoading(async () => {
      try {
        await login(email, password);
        navigate('/');
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'Erro ao fazer login. Verifique suas credenciais.',
        });
      }
    });
  };

  if (showLoader) {
   const loader = AUTH_LOADER_COPY[authTransition] ?? AUTH_LOADER_COPY.initial;
    return <FancyLoader message={loader.message} tips={loader.tips} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4">
        {/* Left side (brand) */}
        <div className="hidden flex-1 md:block">
          <div className="max-w-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                <Grape className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Sistema de Gestão de Células</h1>
                <p className="text-sm text-muted-foreground">Videira São Miguel</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Acesse o painel e gerencie células, líderes e relatórios com praticidade. Segurança e simplicidade em um só lugar.
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="mx-auto w-full max-w-md flex-1">
          <Card className="border-primary/20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 text-center md:text-left">
                <h2 className="text-2xl font-semibold">Entrar</h2>
                <p className="text-sm text-muted-foreground">Use seu e‑mail e senha cadastrados</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E‑mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@igreja.com"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando…
                    </>
                  ) : (
                    'Acessar'
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center text-xs text-muted-foreground">
                Problemas para acessar? Procure um administrador.
              </div>
            </CardContent>
          </Card>

          {/* Mobile brand footer */}
          <div className="mt-6 flex items-center justify-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow">
              <Grape className="h-5 w-5 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Sistema de Gestão de Células</p>
              <p className="text-xs text-muted-foreground">Videira São Miguel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
