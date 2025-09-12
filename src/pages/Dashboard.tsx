import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  GraduationCap,
  Church,
  Grape,
  Plus
} from 'lucide-react';

const roleGreetings = {
  pastor: 'Pastor',
  obreiro: 'Obreiro',
  discipulador: 'Discipulador',
  lider: 'Líder',
};

export function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const greeting = roleGreetings[user.role];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="gradient-primary rounded-xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center grape-bounce">
              <Grape className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Bem-vindo, {greeting} {user.name.split(' ')[0]}!
              </h1>
              <p className="text-white/80">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <Church className="w-24 h-24" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user.role === 'lider' ? 'Membros da Célula' : 'Total de Células'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {user.role === 'lider' ? '12' : '8'}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Relatórios Pendentes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {user.role === 'lider' ? '1' : '3'}
            </div>
            <p className="text-xs text-muted-foreground">
              Para este mês
            </p>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Eventos
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">2</div>
            <p className="text-xs text-muted-foreground">
              Neste mês
            </p>
          </CardContent>
        </Card>

        <Card className="hover:grape-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Crescimento
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">+15%</div>
            <p className="text-xs text-muted-foreground">
              Últimos 3 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.role === 'lider' && (
              <>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Relatório de Célula
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Adicionar Membro
                </Button>
              </>
            )}
            
            {(user.role === 'pastor' || user.role === 'obreiro' || user.role === 'discipulador') && (
              <>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Criar Evento
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Relatórios
                </Button>
              </>
            )}
            
            <Button className="w-full justify-start" variant="outline">
              <GraduationCap className="w-4 h-4 mr-2" />
              Inscrições em Cursos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-medium">Encontro de Jovens</h4>
                <p className="text-sm text-muted-foreground">15 de Janeiro, 2025</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-8 bg-accent rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-medium">Conferência Anual</h4>
                <p className="text-sm text-muted-foreground">22 de Janeiro, 2025</p>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Ver Todos os Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}