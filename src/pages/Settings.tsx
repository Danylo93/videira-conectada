import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, BellRing, Save } from "lucide-react";

type NotificationSettings = {
  emailReports: boolean;
  cellReminders: boolean;
  importantNotices: boolean;
};

type SecurityFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailReports: true,
    cellReminders: true,
    importantNotices: true,
  });

  const [securityForm, setSecurityForm] = useState<SecurityFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
    });
  }, [user]);

  if (!user) {
    return null;
  }

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
      title: "Atualização em breve",
      description: "Em breve você poderá atualizar seus dados diretamente por aqui.",
    });
  };

  const handleNotificationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
      title: "Preferências salvas",
      description: "Suas preferências de notificação foram registradas.",
    });
  };

  const handleSecuritySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast({
        title: "As senhas não conferem",
        description: "Verifique a nova senha digitada e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Solicitação enviada",
      description: "Nossa equipe será notificada para validar a alteração de senha.",
    });
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <CardHeader>
            <CardTitle>Informações da conta</CardTitle>
            <CardDescription>
              Gerencie seus dados pessoais utilizados para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                placeholder="Nome do usuário"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="usuario@videira.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="(11) 99999-9999"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" /> Salvar alterações
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleNotificationSubmit} className="space-y-0">
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Escolha como deseja ser avisado sobre movimentações importantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium">Relatórios de célula</p>
                <p className="text-sm text-muted-foreground">
                  Receba um e-mail sempre que um relatório for encaminhado.
                </p>
              </div>
              <Switch
                checked={notificationSettings.emailReports}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    emailReports: checked,
                  }))
                }
                aria-label="Ativar notificações de relatórios"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium">Lembretes da célula</p>
                <p className="text-sm text-muted-foreground">
                  Receba lembretes automáticos para preencher a ata semanal.
                </p>
              </div>
              <Switch
                checked={notificationSettings.cellReminders}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    cellReminders: checked,
                  }))
                }
                aria-label="Ativar lembretes de célula"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="font-medium">Comunicados importantes</p>
                <p className="text-sm text-muted-foreground">
                  Seja avisado sobre mudanças relevantes da igreja e da liderança.
                </p>
              </div>
              <Switch
                checked={notificationSettings.importantNotices}
                onCheckedChange={(checked) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    importantNotices: checked,
                  }))
                }
                aria-label="Ativar comunicados importantes"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" variant="outline">
              <BellRing className="mr-2 h-4 w-4" /> Salvar preferências
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleSecuritySubmit} className="space-y-6">
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>
              Atualize sua senha e mantenha sua conta segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={securityForm.currentPassword}
                  onChange={(event) =>
                    setSecurityForm((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                  placeholder="********"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(event) =>
                    setSecurityForm((prev) => ({
                      ...prev,
                      newPassword: event.target.value,
                    }))
                  }
                  placeholder="********"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(event) =>
                    setSecurityForm((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="********"
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p>
                Ao solicitar a troca de senha, nossa equipe de suporte confirma a alteração
                para manter a segurança dos acessos ministeriais.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="submit">
              <ShieldCheck className="mr-2 h-4 w-4" /> Enviar solicitação
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}
            >
              Limpar campos
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default Settings;
