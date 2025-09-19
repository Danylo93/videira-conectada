import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Users, 
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
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
const events = [
  {
    id: '1',
    name: 'Culto de Celebração',
    description: 'Culto especial de celebração e adoração',
    date: '2024-02-15',
    time: '19:00',
    location: 'Igreja Central',
    type: 'Culto',
    maxCapacity: 200,
    registrations: 150,
    active: true,
    createdBy: 'João Silva',
  },
  {
    id: '2',
    name: 'Conferência de Líderes',
    description: 'Encontro para líderes de células',
    date: '2024-02-20',
    time: '09:00',
    location: 'Salão de Eventos',
    type: 'Conferência',
    maxCapacity: 50,
    registrations: 35,
    active: true,
    createdBy: 'Maria Santos',
  },
  {
    id: '3',
    name: 'Retiro Espiritual',
    description: 'Retiro de fim de semana para membros',
    date: '2024-03-01',
    time: '08:00',
    location: 'Sítio da Igreja',
    type: 'Retiro',
    maxCapacity: 100,
    registrations: 80,
    active: false,
    createdBy: 'Pedro Costa',
  },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Culto': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'Conferência': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'Retiro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'Workshop': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const isUpcoming = (date: string) => {
  return new Date(date) > new Date()
}

const isToday = (date: string) => {
  const today = new Date()
  const eventDate = new Date(date)
  return today.toDateString() === eventDate.toDateString()
}

export default function EventsContent() {
  const upcomingEvents = events.filter(event => isUpcoming(event.date))
  const todayEvents = events.filter(event => isToday(event.date))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie os eventos da sua igreja
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Evento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total de Eventos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Eventos Hoje
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todayEvents.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Próximos Eventos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {upcomingEvents.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total de Inscrições
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.reduce((sum, event) => sum + event.registrations, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-600 dark:text-green-400">
              Eventos de Hoje
            </CardTitle>
            <CardDescription>
              Eventos programados para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {event.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {event.time} • {event.location}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Hoje
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>
            Eventos programados para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {event.name}
                      </h3>
                      <Badge className={getTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                      {!event.active && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.registrations}/{event.maxCapacity} inscritos
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.registrations}/{event.maxCapacity}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((event.registrations / event.maxCapacity) * 100)}% ocupado
                    </div>
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
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="w-4 h-4 mr-2" />
                        Inscrições
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {events.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Comece criando seu primeiro evento
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Evento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
