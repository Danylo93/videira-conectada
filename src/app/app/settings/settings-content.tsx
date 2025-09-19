import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Church, Users, CreditCard, AlertTriangle } from 'lucide-react'

export default function SettingsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gerencie as configurações da sua igreja
        </p>
      </div>

      <div className="grid gap-6">
        {/* Church Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="w-5 h-5" />
              Informações da Igreja
            </CardTitle>
            <CardDescription>
              Dados básicos da sua igreja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="churchName">Nome da Igreja</Label>
                <Input id="churchName" defaultValue="Igreja Videira Central" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="churchSlug">URL da Igreja</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">https://</span>
                  <Input id="churchSlug" defaultValue="videira-central" />
                  <span className="text-sm text-gray-500">.meudominio.com</span>
                </div>
              </div>
            </div>
            <Button>Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* Billing Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Status do Billing
            </CardTitle>
            <CardDescription>
              Informações sobre sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Plano Atual:
              </span>
              <Badge variant="outline">Standard</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Ativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Próximo vencimento:
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                15/02/2024
              </span>
            </div>
            <Separator />
            <Button variant="outline" asChild>
              <a href="/app/billing">Gerenciar Billing</a>
            </Button>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros da Equipe
            </CardTitle>
            <CardDescription>
              Gerencie quem tem acesso à sua igreja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    João Silva
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    joao@exemplo.com
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>Owner</Badge>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </div>
            </div>
            <Button variant="outline">Adicionar Membro</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis que afetam sua igreja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg dark:border-red-800">
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                Cancelar Assinatura
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Cancele sua assinatura. Você perderá acesso ao final do período atual.
              </p>
              <Button variant="destructive" size="sm">
                Cancelar Assinatura
              </Button>
            </div>
            
            <div className="p-4 border border-red-200 rounded-lg dark:border-red-800">
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                Deletar Igreja
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Deleta permanentemente todos os dados da sua igreja. Esta ação não pode ser desfeita.
              </p>
              <Button variant="destructive" size="sm">
                Deletar Igreja
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
