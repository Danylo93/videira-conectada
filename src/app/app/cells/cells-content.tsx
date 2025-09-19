import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Church, 
  Plus, 
  Users, 
  MapPin, 
  Calendar,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Mock data - em produção viria do Supabase
const cells = [
  {
    id: '1',
    name: 'Célula Central',
    leader: 'João Silva',
    location: 'Centro da Cidade',
    day: 'Domingo',
    time: '19:00',
    members: 12,
    visitors: 3,
    phase: 'Multiplicação',
    active: true,
    lastReport: '2024-01-20',
  },
  {
    id: '2',
    name: 'Célula Norte',
    leader: 'Maria Santos',
    location: 'Bairro Norte',
    day: 'Quarta-feira',
    time: '20:00',
    members: 8,
    visitors: 2,
    phase: 'Consolidação',
    active: true,
    lastReport: '2024-01-19',
  },
  {
    id: '3',
    name: 'Célula Sul',
    leader: 'Pedro Costa',
    location: 'Bairro Sul',
    day: 'Sábado',
    time: '18:30',
    members: 6,
    visitors: 1,
    phase: 'Evangelismo',
    active: false,
    lastReport: '2024-01-15',
  },
]

const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'Evangelismo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'Consolidação': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'Multiplicação': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

export default function CellsContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Células
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie as células da sua igreja
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Célula
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total de Células
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cells.length}
                </p>
              </div>
              <Church className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Células Ativas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cells.filter(c => c.active).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total de Membros
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cells.reduce((sum, cell) => sum + cell.members, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Visitantes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cells.reduce((sum, cell) => sum + cell.visitors, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cells Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cells.map((cell) => (
          <Card key={cell.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{cell.name}</CardTitle>
                  <CardDescription>Líder: {cell.leader}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Ver Relatórios</DropdownMenuItem>
                    <DropdownMenuItem>Adicionar Membro</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      {cell.active ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getPhaseColor(cell.phase)}>
                  {cell.phase}
                </Badge>
                {!cell.active && (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    Inativa
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  {cell.location}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  {cell.day} às {cell.time}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {cell.members}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Membros
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {cell.visitors}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Visitantes
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Último relatório: {new Date(cell.lastReport).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {cells.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Church className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma célula encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Comece criando sua primeira célula
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Célula
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
