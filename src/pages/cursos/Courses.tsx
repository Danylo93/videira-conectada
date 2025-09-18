
import { useAuth } from "@/contexts/AuthContext";
import CoursesAdmin from "./CoursesAdmin";
import CoursesDiscipulador from "./CoursesDiscipulador";
import CoursesLeader from "./CoursesLeader";

export default function Courses() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "pastor" || user.role === "obreiro") return <CoursesAdmin />;           // Administração
  if (user.role === "discipulador") return <CoursesDiscipulador />;
  return <CoursesLeader />;                                     // padrão: líder
}
