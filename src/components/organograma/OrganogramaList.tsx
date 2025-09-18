import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, UserCheck, Calendar, Target, TrendingUp, AlertCircle } from 'lucide-react';
import type { PersonNode } from '@/pages/ChurchManagementNew';

interface OrganogramaListProps {
  data: PersonNode[];
  onNodeClick?: (node: PersonNode) => void;
}

export function OrganogramaList({ data, onNodeClick }: OrganogramaListProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'pastor': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'obreiro': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'discipulador': return 'bg-green-100 text-green-800 border-green-200';
      case 'lider': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'pastor': return 'Pastor';
      case 'obreiro': return 'Obreiro';
      case 'discipulador': return 'Discipulador';
      case 'lider': return 'Líder';
      default: return role;
    }
  };

  const getPresenceStatus = (presence: number) => {
    if (presence >= 80) return { status: 'excellent', color: 'text-green-600', icon: TrendingUp };
    if (presence >= 60) return { status: 'good', color: 'text-blue-600', icon: UserCheck };
    if (presence >= 40) return { status: 'average', color: 'text-yellow-600', icon: AlertCircle };
    return { status: 'low', color: 'text-red-600', icon: AlertCircle };
  };

  const renderNode = (node: PersonNode, level: number = 0) => {
    const presenceStatus = getPresenceStatus(node.averagePresence || 0);
    const StatusIcon = presenceStatus.icon;
    const marginLeft = level * 24;

    return (
      <div key={node.name} className="space-y-2" style={{ marginLeft: `${marginLeft}px` }}>
        <Card 
          className={`hover:shadow-md transition-shadow cursor-pointer ${getRoleColor(node.role)}`}
          onClick={() => onNodeClick?.(node)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={getRoleColor(node.role)}>
                  {getRoleLabel(node.role)}
                </Badge>
                <div>
                  <h3 className="font-semibold">{node.name}</h3>
                  {node.celula && (
                    <p className="text-sm text-muted-foreground">
                      <Target className="w-3 h-3 inline mr-1" />
                      {node.celula}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Estatísticas */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-muted-foreground">Membros:</span>
                    </div>
                    <span className="font-semibold text-purple-600">{node.members || 0}</span>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-muted-foreground">Frequentadores:</span>
                    </div>
                    <span className="font-semibold text-orange-600">{node.frequentadores || 0}</span>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-muted-foreground">Total:</div>
                    <span className="font-bold text-primary">{node.total || 0}</span>
                  </div>
                </div>

                {/* Presença */}
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${presenceStatus.color}`} />
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${presenceStatus.color}`}>
                      {node.averagePresence || 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Presença</div>
                  </div>
                  <div className="w-16">
                    <Progress value={node.averagePresence || 0} className="h-2" />
                  </div>
                </div>

                {/* Último Relatório */}
                {node.lastReport && (
                  <div className="text-xs text-muted-foreground text-right">
                    <div>Último relatório:</div>
                    <div className="font-medium">
                      {new Date(node.lastReport).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filhos */}
        {node.children && node.children.length > 0 && (
          <div className="space-y-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {data.map(node => renderNode(node))}
    </div>
  );
}
