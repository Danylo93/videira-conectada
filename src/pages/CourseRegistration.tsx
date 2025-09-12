import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Users, 
  BookOpen,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: 'Maturidade no Espírito' | 'CTL';
  description: string;
  duration: string;
  price?: number;
}

interface Member {
  id: string;
  name: string;
  type: 'member' | 'frequentador';
}

interface CourseRegistration {
  id: string;
  courseId: string;
  memberId: string;
  registrationDate: Date;
  status: 'pending' | 'approved' | 'completed';
  course?: Course;
  member?: Member;
}

export function CourseRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'lider') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    await Promise.all([loadCourses(), loadMembers(), loadRegistrations()]);
    setLoading(false);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('*').eq('active', true);
    setCourses(data || []);
  };

  const loadMembers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('members')
      .select('id, name, type')
      .eq('lider_id', user.id)
      .eq('active', true);
    setMembers(data || []);
  };

  const loadRegistrations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('course_registrations')
      .select(`*, courses(*), members(id, name, type)`)
      .eq('lider_id', user.id)
      .order('registration_date', { ascending: false });

    const formattedRegistrations: CourseRegistration[] = (data || []).map(reg => ({
      id: reg.id,
      courseId: reg.course_id,
      memberId: reg.member_id,
      registrationDate: new Date(reg.registration_date),
      status: reg.status as 'pending' | 'approved' | 'completed',
      course: reg.courses as Course,
      member: reg.members as Member,
    }));

    setRegistrations(formattedRegistrations);
  };

  if (!user || user.role !== 'lider') {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito para líderes de célula.</p>
      </div>
    );
  }

  const handleRegisterMember = async () => {
    if (!selectedCourse || !selectedMember || !user) return;

    const { error } = await supabase
      .from('course_registrations')
      .insert([{
        course_id: selectedCourse,
        member_id: selectedMember,
        lider_id: user.id,
        status: 'pending',
      }]);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o membro.",
        variant: "destructive",
      });
      return;
    }

    await loadRegistrations();
    setIsDialogOpen(false);
    setSelectedCourse('');
    setSelectedMember('');
    
    toast({
      title: "Sucesso",
      description: "Membro registrado no curso com sucesso!",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inscrição em Cursos</h1>
          <p className="text-muted-foreground">Gerencie as inscrições dos membros da sua célula</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nova Inscrição
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inscrever Membro em Curso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o membro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleRegisterMember} className="w-full gradient-primary">
                Inscrever
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:grape-glow transition-smooth">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {course.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">{course.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{course.duration}</span>
                {course.price && (
                  <Badge variant="outline">R$ {course.price.toFixed(2)}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Inscrições da Célula
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma inscrição realizada ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Inscrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.member?.name}
                    </TableCell>
                    <TableCell>{registration.course?.name}</TableCell>
                    <TableCell>
                      <Badge variant={registration.status === 'approved' ? 'default' : 'secondary'}>
                        {registration.status === 'pending' ? 'Pendente' : registration.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {registration.registrationDate.toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}