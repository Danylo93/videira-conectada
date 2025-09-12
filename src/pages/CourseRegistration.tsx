import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  GraduationCap, 
  Plus, 
  Clock, 
  Users, 
  CheckCircle,
  Calendar,
  User
} from 'lucide-react';
import { Course, CourseRegistration as CourseRegistrationType } from '@/types/church';

// Mock data
const courses: Course[] = [
  {
    id: '1',
    name: 'Maturidade no Espírito',
    description: 'Curso de crescimento espiritual e maturidade cristã, focado no desenvolvimento do caráter cristão e relacionamento com Deus.',
    duration: '8 semanas',
    price: 50,
  },
  {
    id: '2', 
    name: 'CTL',
    description: 'Curso de Treinamento de Liderança para capacitar novos líderes de célula e desenvolver habilidades de liderança.',
    duration: '12 semanas',
    price: 80,
  },
];

const mockRegistrations: CourseRegistrationType[] = [
  {
    id: '1',
    courseId: '1',
    memberId: '1',
    liderId: '4',
    registrationDate: new Date('2024-12-01'),
    status: 'approved',
    paymentStatus: 'paid',
  },
  {
    id: '2',
    courseId: '2', 
    memberId: '2',
    liderId: '4',
    registrationDate: new Date('2024-12-05'),
    status: 'pending',
    paymentStatus: 'pending',
  },
];

export function CourseRegistration() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<CourseRegistrationType[]>(mockRegistrations);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newRegistration, setNewRegistration] = useState({
    participantName: '',
    participantPhone: '',
    participantEmail: '',
    observations: '',
  });

  if (!user) return null;

  const handleRegister = () => {
    if (!selectedCourse) return;

    const registration: CourseRegistrationType = {
      id: Date.now().toString(),
      courseId: selectedCourse.id,
      memberId: Date.now().toString(), // In real app, this would be selected from members
      liderId: user.id,
      registrationDate: new Date(),
      status: 'pending',
      paymentStatus: 'pending',
    };

    setRegistrations([...registrations, registration]);
    setNewRegistration({
      participantName: '',
      participantPhone: '',
      participantEmail: '',
      observations: '',
    });
    setIsRegisterDialogOpen(false);
    setSelectedCourse(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-success">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'completed':
        return <Badge variant="outline">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-success">Pago</Badge>;
      case 'pending':
        return <Badge variant="destructive">Pendente</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">Inscrições em cursos de crescimento</p>
        </div>
      </div>

      {/* Available Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:grape-glow transition-smooth">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {course.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{course.description}</p>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{course.duration}</span>
                </div>
                {course.price && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">R$ {course.price}</span>
                  </div>
                )}
              </div>

              <Dialog open={isRegisterDialogOpen && selectedCourse?.id === course.id} onOpenChange={(open) => {
                setIsRegisterDialogOpen(open);
                if (!open) setSelectedCourse(null);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full gradient-primary"
                    onClick={() => setSelectedCourse(course)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Inscrever Pessoa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Inscrição - {course.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="participantName">Nome do Participante</Label>
                      <Input
                        id="participantName"
                        value={newRegistration.participantName}
                        onChange={(e) => setNewRegistration({ ...newRegistration, participantName: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="participantPhone">Telefone</Label>
                      <Input
                        id="participantPhone"
                        value={newRegistration.participantPhone}
                        onChange={(e) => setNewRegistration({ ...newRegistration, participantPhone: e.target.value })}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="participantEmail">Email</Label>
                      <Input
                        id="participantEmail"
                        type="email"
                        value={newRegistration.participantEmail}
                        onChange={(e) => setNewRegistration({ ...newRegistration, participantEmail: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="observations">Observações (opcional)</Label>
                      <Textarea
                        id="observations"
                        value={newRegistration.observations}
                        onChange={(e) => setNewRegistration({ ...newRegistration, observations: e.target.value })}
                        placeholder="Informações adicionais..."
                      />
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium mb-2">Resumo:</h4>
                      <p className="text-sm text-muted-foreground">
                        Curso: {course.name}<br />
                        Duração: {course.duration}<br />
                        {course.price && `Valor: R$ ${course.price}`}
                      </p>
                    </div>

                    <Button onClick={handleRegister} className="w-full gradient-primary">
                      Confirmar Inscrição
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {user.role === 'lider' ? 'Inscrições da Minha Célula' : 'Todas as Inscrições'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead>Data de Inscrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Líder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => {
                const course = courses.find(c => c.id === registration.courseId);
                return (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        {course?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Participante #{registration.memberId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {registration.registrationDate.toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell>{getPaymentBadge(registration.paymentStatus)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.role === 'lider' ? 'Você' : 'Líder da Célula'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}