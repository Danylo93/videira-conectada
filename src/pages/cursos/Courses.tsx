
import { useAuth } from "@/contexts/AuthContext";
import CourseAdmin from "./CourseAdmin";
import CoursesDiscipulador from "./CoursesDiscipulador";
import CoursesLeader from "./CoursesLeader";

export default function Courses() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "pastor") return <CourseAdmin />;           // Administração
  if (user.role === "discipulador") return <CoursesDiscipulador />;
  return <CoursesLeader />;                                     // padrão: líder
}
