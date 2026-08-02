import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { ACTIVE_ROLE_LABEL, ACTIVE_ROLE_DESCRIPTION, type ActiveRole } from '@/types/auth';
import { Church, Users, Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_ICON: Record<ActiveRole, typeof Users> = {
  pastor: Church,
  obreiro: Church,
  discipulador: Users,
  lider: Home,
};

/**
 * Pop-up de escolha de função, exibido logo após o login para quem acumula
 * papéis (ex.: obreiro que também discipula e lidera a própria célula). Abre
 * por cima do app e não fecha sem escolha — são poucos toques e evita entrar
 * num papel indefinido.
 */
export function RoleSelect() {
  const { availableRoles, setActiveRole, user } = useAuth();
  const primeiroNome = user?.name?.split(' ')[0] ?? '';

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-border/70 bg-card p-5 shadow-2xl sm:p-6',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          )}
          // Sem fechar por fora/ESC: a escolha define como o app vai se comportar.
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="text-xl font-bold tracking-tight">
            Olá{primeiroNome ? `, ${primeiroNome}` : ''}!
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
            Você tem mais de uma função. Como quer entrar hoje?
          </DialogPrimitive.Description>

          <div className="mt-5 space-y-2.5">
            {availableRoles.map((papel) => {
              const Icone = ROLE_ICON[papel];
              return (
                <button
                  key={papel}
                  type="button"
                  onClick={() => setActiveRole(papel)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-3 text-left transition-all hover:border-primary/60 hover:bg-background active:scale-[0.99]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{ACTIVE_ROLE_LABEL[papel]}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ACTIVE_ROLE_DESCRIPTION[papel]}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Dá para trocar de função depois, no menu do seu perfil.
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
