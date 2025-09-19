import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Plus, 
  Users, 
  Clock, 
  DollarSign,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserPlus
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
const courses = [
  {
    id: '1',
    name: 'Fundamentos da Fé',
    description: 'Curso básico sobre os fundamentos da fé cristã',
    duration: '12 semanas',
    price: 0,
    active: true,
    registrations: 25,
    maxCapacity: 30,
    instructor: 'Pastor João',
    startDate: '2024-02-01',
    endDate: '2024-04-25',
  },
  {
    id: '2',
    name: 'Liderança Cristã',
    description: 'Desenvolvimento de habilidades de liderança baseadas em princípios bíblicos',
    duration: '8 semanas',
    price: 50,
    active: true,
    registrations: 18,
    maxCapacity: 25,
    instructor: 'Pastora Maria',
    startDate: '2024-02-15',
    endDate: '2024-04-10',
  },
  {
    id: '3',
    name: 'Evangelismo Pessoal',
    description: 'Técnicas e estratégias para evangelismo pessoal',
    duration: '6 semanas',
    price: 30,
    active: false,
    registrations: 12,
    maxCapacity: 20,
    instructor: 'Pastor Pedro',
    startDate: '2024-01-10',
    endDate: '2024-02-20',
  },
]

const getStatusColor = (active: boolean, startDate: string, endDate: string) => {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (!active) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  if (now < start) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  if (now > end) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
}

const getStatusText = (active: boolean, startDate: string, endDate: string) => {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (!active) return 'Inativo'
  if (now < start) return 'Em Breve'
  if (now > end) return 'Finalizado'
  return 'Em Andamento'
}

export default function CoursesContent() {
  const activeCourses = courses.filter(course => course.active)
  const totalRegistrations = courses.reduce((sum, course) => sum + course.registrations, 0)
  const totalRevenue = courses.reduce((sum, course) => sum + (course.registrations * course.price), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Cursos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie os cursos da sua igreja
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total de Cursos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {courses.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Cursos Ativos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeCourses.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
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
                  {totalRegistrations}
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
                  Receita Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription>Instrutor: {course.instructor}</CardDescription>
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
                      <UserPlus className="w-4 h-4 mr-2" />
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
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {course.description}
              </p>
              
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(course.active, course.startDate, course.endDate)}>
                  {getStatusText(course.active, course.startDate, course.endDate)}
                </Badge>
                {course.price > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    R$ {course.price}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4" />
                  {course.registrations}/{course.maxCapacity} inscritos
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Início: {new Date(course.startDate).toLocaleDateString('pt-BR')}</span>
                  <span>Fim: {new Date(course.endDate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(course.registrations / course.maxCapacity) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((course.registrations / course.maxCapacity) * 100)}% das vagas preenchidas
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {courses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Comece criando seu primeiro curso
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Curso
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
