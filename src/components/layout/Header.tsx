import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileMode } from '@/contexts/ProfileModeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, User, Settings, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const roleNames = {
  pastor: 'Pastor',
  obreiro: 'Obreiro',
  discipulador: 'Discipulador',
  lider: 'Líder',
};

export function Header() {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useProfileMode();
  const navigate = useNavigate();

  if (!user) return null;

  const isKidsMode = mode === 'kids';
  const systemName = isKidsMode ? 'Videira Kids' : 'Sistema Videira São Miguel';
  const displayName = isKidsMode && user.role === 'pastor' ? 'Tainá' : user.name;
  const displayRole = isKidsMode && user.role === 'pastor' ? 'Pastora' : roleNames[user.role];
  
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <SidebarTrigger />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold text-foreground">
              {systemName}
            </h1>
            {isKidsMode && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                <Sparkles className="w-3 h-3 mr-1" />
                Kids
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {displayRole} - {displayName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            {user.role === 'pastor' && (
              <>
                <DropdownMenuLabel>Modo de Perfil</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    toggleMode();
                  }}
                >
                  {isKidsMode ? (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Modo Normal
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Modo Kids
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                navigate('/perfil');
              }}
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                navigate('/configuracoes');
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout();
              }}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}