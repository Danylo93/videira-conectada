import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import FancyLoader from '@/components/FancyLoader';
import { AuthTransition } from '@/types/auth';
import { useProfileMode } from '@/contexts/ProfileModeContext';
import { getProfileModeConfig } from '@/config/profileModes';

import logoRadicaisBranco from '@/assets/logo-rl-branco.png';

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
  const [isLoading, setIsLoading] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, authTransition } = useAuth();
  const { mode } = useProfileMode();
  const config = getProfileModeConfig(mode);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setBootReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const showLoader = useDelayedLoading(!isLoading && bootReady, 1000);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await login(email, password);
      // Aguardar um pouco para garantir que o estado foi atualizado
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: 'Erro no login',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  if (showLoader) {
    const loader = AUTH_LOADER_COPY[authTransition] ?? AUTH_LOADER_COPY.initial;
    return <FancyLoader message={loader.message} tips={loader.tips} />;
  }

  // Verifica se estamos no modo radicais (padrão) para usar layout imersivo
  const isRadicais = mode === 'radicais';

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ===== FUNDO ANIMADO IMERSIVO ===== */}
      <div className="auth-bg absolute inset-0 -z-20" />

      {/* Orbes flutuantes com cores do tema */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="auth-orb auth-orb--1 -top-24 -left-24 h-72 w-72 bg-primary/40 sm:h-96 sm:w-96" />
        <div className="auth-orb auth-orb--2 top-1/3 -right-28 h-72 w-72 bg-accent/40 sm:h-96 sm:w-96" />
        <div className="auth-orb auth-orb--3 -bottom-28 left-1/4 h-72 w-72 bg-primary-glow/40 sm:h-96 sm:w-96" />
        <div className="auth-sparkles absolute inset-0" />
      </div>

      {/* Overlay escuro para contraste (mais forte no modo radicais) */}
      {isRadicais && (
        <div className="absolute inset-0 -z-[5] bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      )}

      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-8">

        {/* ===== BLOCO DA MARCA (responsivo) ===== */}
        <div className="auth-rise mb-8 flex flex-col items-center text-center" style={{ animationDelay: '0.1s' }}>
          {/* Logo principal com glow */}
          <div className="auth-logo-glow relative mb-5 flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white/10 shadow-2xl ring-2 ring-white/20 backdrop-blur-sm">
              <img
                src={isRadicais ? logoRadicaisBranco : config.logo}
                alt={config.brandName}
                className={`h-16 w-16 sm:h-20 sm:w-20 ${isRadicais ? 'invert-0 brightness-200 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]' : ''} ${config.logoRounded ? 'rounded-full object-cover' : 'object-contain'}`}
              />
            </div>
          </div>

          {/* Nome da marca */}
          <h1 className={`mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl ${isRadicais ? 'bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-lg' : config.titleGradientClass}`}>
            {config.brandName}
          </h1>

          {/* Subtítulo */}
          <p className={`text-sm font-medium tracking-widest uppercase ${isRadicais ? 'text-white/60' : 'text-muted-foreground'}`}>
            Sistema de Gestão de Células
          </p>
        </div>

        {/* ===== CARD DE LOGIN (glassmorphism) ===== */}
        <div className="auth-rise w-full max-w-sm" style={{ animationDelay: '0.3s' }}>
          <div className={`rounded-2xl border p-6 shadow-2xl backdrop-blur-xl sm:p-8 ${isRadicais
              ? 'border-white/15 bg-black/40 shadow-orange-900/20'
              : 'border-primary/20 bg-background/80 supports-[backdrop-filter]:bg-background/60'
            }`}>
            {/* Título do formulário */}
            <div className="mb-6 text-center">
              <h2 className={`text-xl font-bold sm:text-2xl ${isRadicais ? 'text-white' : ''}`}>
                Entrar no sistema
              </h2>
              <p className={`mt-1 text-sm ${isRadicais ? 'text-white/50' : 'text-muted-foreground'}`}>
                Use seu e‑mail e senha cadastrados
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={isRadicais ? 'text-white/80' : ''}>
                  E‑mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@igreja.com"
                  autoComplete="email"
                  disabled={isLoading}
                  required
                  className={isRadicais ? 'border-white/15 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className={isRadicais ? 'text-white/80' : ''}>
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                    className={`pr-10 ${isRadicais ? 'border-white/15 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isRadicais ? 'text-white/40 hover:text-white/70' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full font-semibold transition-all ${isRadicais
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:from-orange-400 hover:to-amber-400 hover:shadow-orange-500/40'
                    : 'gradient-primary'
                  }`}
                disabled={isLoading}
              >
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

            {/* Rodapé do card */}
            <div className={`mt-5 text-center text-xs ${isRadicais ? 'text-white/35' : 'text-muted-foreground'}`}>
              Problemas para acessar? Procure um administrador.
            </div>
          </div>
        </div>

        {/* ===== RODAPÉ COM SLOGAN ===== */}
        {isRadicais && (
          <div className="auth-rise mt-8 text-center" style={{ animationDelay: '0.5s' }}>
            <p className="text-xs font-medium tracking-[0.25em] uppercase text-white/25">
              Liiiivres Uhaaa !!!
            </p>
          </div>
        )}

        {/* Rodapé genérico (modo não-radicais) */}
        {!isRadicais && (
          <div className="auth-rise mt-6 flex items-center justify-center gap-2" style={{ animationDelay: '0.5s' }}>
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white shadow ring-1 ring-primary/10">
              <img
                src={config.logo}
                alt={config.brandName}
                className={`h-7 w-7 ${config.logoRounded ? 'rounded-full object-cover' : 'object-contain'}`}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{config.brandName}</p>
              <p className="text-xs text-muted-foreground">Sistema de Gestão de Células</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
