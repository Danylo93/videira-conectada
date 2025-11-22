import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileMode } from "@/contexts/ProfileModeContext";
import type { UserRole } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Church,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const roleLabels: Record<UserRole, string> = {
  pastor: "Pastor",
  obreiro: "Obreiro",
  discipulador: "Discipulador",
  lider: "Líder",
};

const roleDescriptions: Record<UserRole, string> = {
  pastor: "Responsável por toda a rede ministerial e gestão estratégica da igreja.",
  obreiro: "Auxilia o pastor na administração e acompanha o andamento dos ministérios.",
  discipulador: "Cuida dos líderes de célula e garante que a visão da Videira seja replicada.",
  lider: "Lidera a célula local, discipula membros e acompanha o crescimento da rede.",
};

type InfoItemProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground sm:text-base">{value}</p>
      </div>
    </div>
  );
}

export function Profile() {
  const { user } = useAuth();
  const { mode } = useProfileMode();
  const navigate = useNavigate();
  const isKidsMode = mode === 'kids';
  const [discipuladorName, setDiscipuladorName] = useState<string | null>(null);
  const [pastorName, setPastorName] = useState<string | null>(null);
  
  const displayName = isKidsMode && user?.role === 'pastor' ? 'Tainá' : user?.name;
  const displayRole = isKidsMode && user?.role === 'pastor' ? 'Pastora' : (user?.role ? roleLabels[user.role] : '');

  const initials = useMemo(() => {
    if (!displayName) return "US";
    return displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }, [displayName]);

  const formattedCreatedAt = useMemo(() => {
    if (!user?.createdAt) return "-";
    return user.createdAt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [user?.createdAt]);

  // Buscar nomes do discipulador e pastor
  useEffect(() => {
    const loadNames = async () => {
      if (!user) return;

      const idsToFetch: string[] = [];
      if (user.discipuladorId) idsToFetch.push(user.discipuladorId);
      if (user.pastorId) idsToFetch.push(user.pastorId);

      if (idsToFetch.length === 0) {
        setDiscipuladorName(null);
        setPastorName(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', idsToFetch);

      if (error) {
        console.error('Error loading profile names:', error);
        return;
      }

      if (data) {
        const discipulador = data.find((p) => p.id === user.discipuladorId);
        const pastor = data.find((p) => p.id === user.pastorId);
        
        setDiscipuladorName(discipulador?.name || null);
        setPastorName(pastor?.name || null);
      }
    };

    loadNames();
  }, [user?.discipuladorId, user?.pastorId]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-2xl font-semibold">{displayName}</CardTitle>
                <Badge className="shadow-sm">{displayRole}</Badge>
              </div>
              <CardDescription className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {isKidsMode && user?.role === 'pastor' 
                  ? "Responsável pelo ministério infantil e gestão das crianças da Videira."
                  : (roleDescriptions[user.role] ?? "Perfil ministerial cadastrado.")
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => navigate("/configuracoes")}>
              Ajustar preferências
            </Button>
          </div>
        </CardHeader>
        <Separator className="mt-2" />
        <CardContent className="mt-6 grid gap-6 sm:grid-cols-2">
          <InfoItem icon={Mail} label="E-mail" value={user.email} />
          <InfoItem icon={Phone} label="Telefone" value={user.phone ?? "Não informado"} />
          <InfoItem
            icon={ShieldCheck}
            label="Função"
            value={roleLabels[user.role] ?? "-"}
          />
          <InfoItem icon={Calendar} label="Membro desde" value={formattedCreatedAt} />
        </CardContent>
      </Card>

      {user?.role !== 'pastor' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vínculos ministeriais</CardTitle>
              <CardDescription>
                Relações hierárquicas e célula associada ao seu perfil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem
                icon={UserCheck}
                label="Discipulador responsável"
                value={discipuladorName ?? "Não vinculado"}
              />
              <InfoItem
                icon={Church}
                label="Pastor responsável"
                value={pastorName ?? "Não vinculado"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credenciais de acesso</CardTitle>
              <CardDescription>
                Informações utilizadas para autenticação e auditoria do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={Mail} label="Login de acesso" value={user.email} />
              <InfoItem icon={Calendar} label="Cadastro criado em" value={formattedCreatedAt} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Profile;
