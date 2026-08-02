import { useAuth } from '@/contexts/AuthContext';
import { useProfileMode } from '@/contexts/ProfileModeContext';
import { getProfileModeConfig } from '@/config/profileModes';
import { ACTIVE_ROLE_LABEL, ACTIVE_ROLE_DESCRIPTION, type ActiveRole } from '@/types/auth';
import { Church, Users, UserCheck, Home, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROLE_ICON: Record<ActiveRole, typeof Users> = {
  pastor: Church,
  obreiro: Church,
  discipulador: Users,
  lider: Home,
};

/**
 * Escolha do papel para quem acumula funções (ex.: obreiro que também
 * discipula e lidera a própria célula). Aparece logo após o login e o app
 * inteiro passa a se comportar como o papel escolhido.
 */
export function RoleSelect() {
  const { availableRoles, setActiveRole, user, logout } = useAuth();
  const { mode } = useProfileMode();
  const config = getProfileModeConfig(mode);
  const primeiroNome = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="auth-bg absolute inset-0 -z-20" />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="auth-orb auth-orb--1 -top-24 -left-24 h-72 w-72 bg-primary/40 sm:h-96 sm:w-96" />
        <div className="auth-orb auth-orb--2 top-1/3 -right-28 h-72 w-72 bg-accent/40 sm:h-96 sm:w-96" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-10">
        <div className="auth-rise w-full">
          <div className="mb-8 text-center">
            <div className="auth-logo-float mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-primary/10">
              <img
                src={config.logo}
                alt={config.brandName}
                className={`h-12 w-12 ${config.logoRounded ? 'rounded-full object-cover' : 'object-contain'}`}
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Olá{primeiroNome ? `, ${primeiroNome}` : ''}!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Você tem mais de uma função. Como quer entrar hoje?
            </p>
          </div>

          <div className="space-y-3">
            {availableRoles.map((papel) => {
              const Icone = ROLE_ICON[papel];
              return (
                <button
                  key={papel}
                  type="button"
                  onClick={() => setActiveRole(papel)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-soft transition-all hover:border-primary/60 hover:shadow-lg active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icone className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{ACTIVE_ROLE_LABEL[papel]}</p>
                    <p className="text-xs text-muted-foreground">
                      {ACTIVE_ROLE_DESCRIPTION[papel]}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dá para trocar de função depois, no menu do seu perfil.
          </p>

          <div className="mt-4 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => void logout()} className="text-muted-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
