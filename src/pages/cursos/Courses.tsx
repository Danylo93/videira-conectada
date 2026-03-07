
import { useAuth } from "@/contexts/AuthContext";
import CourseAdminNew from "./CourseAdminNew";
import CoursesDiscipulador from "./CoursesDiscipulador";
import CoursesLeader from "./CoursesLeader";

export default function Courses() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "pastor" || user.role === "obreiro" || user.isCursoCoordenador === true) {
    return <CourseAdminNew />; // Administração + coordenação do Trilho do Vencedor
  }
  if (user.role === "discipulador") return <CoursesDiscipulador />;
  return <CoursesLeader />;                                     // padrão: líder
}


