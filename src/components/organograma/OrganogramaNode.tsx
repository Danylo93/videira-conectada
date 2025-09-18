import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Calendar, Target } from 'lucide-react';

interface OrganogramaNodeProps {
  name: string;
  role: 'pastor' | 'obreiro' | 'discipulador' | 'lider';
  celula?: string;
  members?: number;
  frequentadores?: number;
  total?: number;
  averagePresence?: number;
  lastReport?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function OrganogramaNode({
  name,
  role,
  celula,
  members = 0,
  frequentadores = 0,
  total = 0,
  averagePresence = 0,
  lastReport,
  isSelected = false,
  onClick
}: OrganogramaNodeProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'pastor': return 'border-purple-500 bg-purple-50';
      case 'obreiro': return 'border-blue-500 bg-blue-50';
      case 'discipulador': return 'border-green-500 bg-green-50';
      case 'lider': return 'border-orange-500 bg-orange-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'pastor': return '👑';
      case 'obreiro': return '⚡';
      case 'discipulador': return '🌱';
      case 'lider': return '👥';
      default: return '👤';
    }
  };

  const getPresenceStatus = (presence: number) => {
    if (presence >= 80) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (presence >= 60) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (presence >= 40) return { status: 'average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'low', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const presenceStatus = getPresenceStatus(averagePresence);

  return (
    <Card 
      className={`w-64 cursor-pointer transition-all hover:shadow-lg ${getRoleColor(role)} ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getRoleIcon(role)}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm truncate">{name}</h3>
              <Badge variant="outline" className="text-xs">
                {role === 'pastor' ? 'Pastor' : 
                 role === 'obreiro' ? 'Obreiro' : 
                 role === 'discipulador' ? 'Discipulador' : 'Líder'}
              </Badge>
            </div>
          </div>

          {/* Célula */}
          {celula && (
            <div className="text-xs text-muted-foreground">
              <Target className="w-3 h-3 inline mr-1" />
              {celula}
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-purple-600" />
              <span className="text-muted-foreground">Membros:</span>
              <span className="font-medium">{members}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-orange-600" />
              <span className="text-muted-foreground">Frequentadores:</span>
              <span className="font-medium">{frequentadores}</span>
            </div>
          </div>

          {/* Total */}
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{total}</div>
            <div className="text-xs text-muted-foreground">Total de Pessoas</div>
          </div>

          {/* Presença */}
          <div className={`p-2 rounded-lg ${presenceStatus.bg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span className="text-xs text-muted-foreground">Presença:</span>
              </div>
              <span className={`text-sm font-semibold ${presenceStatus.color}`}>
                {averagePresence}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full ${
                  presenceStatus.status === 'excellent' ? 'bg-green-500' :
                  presenceStatus.status === 'good' ? 'bg-blue-500' :
                  presenceStatus.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(averagePresence, 100)}%` }}
              />
            </div>
          </div>

          {/* Último Relatório */}
          {lastReport && (
            <div className="text-xs text-muted-foreground text-center">
              Último relatório: {new Date(lastReport).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
