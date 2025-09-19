'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface MigrationResult {
  table: string
  success: boolean
  error?: string
  recordsUpdated: number
}

interface TenantStatus {
  exists: boolean
  tenant?: {
    id: string
    slug: string
    name: string
    active: boolean
    created_at: string
    role: string
  }
  recordCounts?: Record<string, { count?: number; error?: string }>
  message?: string
}

export default function MigrateContent() {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean
    tenant?: any
    migrationResults?: MigrationResult[]
    message?: string
    error?: string
  } | null>(null)
  const [tenantStatus, setTenantStatus] = useState<TenantStatus | null>(null)

  const handleCheckStatus = async () => {
    if (!tenantSlug.trim()) {
      toast.error('Digite o slug do tenant')
      return
    }

    setChecking(true)
    try {
      const response = await fetch(`/api/migrate?slug=${encodeURIComponent(tenantSlug)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar status')
      }

      setTenantStatus(data)
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      toast.error('Erro ao verificar status do tenant')
    } finally {
      setChecking(false)
    }
  }

  const handleMigrate = async () => {
    if (!tenantSlug.trim() || !tenantName.trim() || !ownerEmail.trim()) {
      toast.error('Preencha todos os campos')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantSlug,
          tenantName,
          ownerEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na migração')
      }

      setMigrationResult(data)
      toast.success('Migração concluída com sucesso!')
    } catch (error) {
      console.error('Erro na migração:', error)
      toast.error('Erro na migração: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Migração de Dados
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Migre dados existentes para o sistema multi-tenant
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta ferramenta migra dados existentes para o sistema multi-tenant.
          Use apenas uma vez durante a transição. Certifique-se de ter backup dos dados.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Migration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Configurar Migração
            </CardTitle>
            <CardDescription>
              Configure os dados do tenant para migração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantSlug">Slug do Tenant</Label>
              <Input
                id="tenantSlug"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                placeholder="minha-igreja"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                URL da igreja: https://{tenantSlug || 'minha-igreja'}.meudominio.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantName">Nome da Igreja</Label>
              <Input
                id="tenantName"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Igreja Videira Central"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email do Owner</Label>
              <Input
                id="ownerEmail"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="pastor@igreja.com"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Email do usuário que será o owner do tenant
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCheckStatus}
                disabled={checking || loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Verificar Status
              </Button>
              
              <Button
                onClick={handleMigrate}
                disabled={loading || checking}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                Executar Migração
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Check */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Tenant</CardTitle>
            <CardDescription>
              Verificação do status atual do tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenantStatus ? (
              <div className="space-y-4">
                {tenantStatus.exists ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-600">
                        Tenant Existe
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Nome:</span>
                        <span className="text-sm font-medium">{tenantStatus.tenant?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Slug:</span>
                        <span className="text-sm font-medium">{tenantStatus.tenant?.slug}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
                        <Badge className={tenantStatus.tenant?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {tenantStatus.tenant?.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Criado em:</span>
                        <span className="text-sm font-medium">
                          {tenantStatus.tenant?.created_at ? 
                            new Date(tenantStatus.tenant.created_at).toLocaleDateString('pt-BR') : 
                            'N/A'
                          }
                        </span>
                      </div>
                    </div>

                    {tenantStatus.recordCounts && (
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Registros por Tabela:</h4>
                        <div className="space-y-1">
                          {Object.entries(tenantStatus.recordCounts).map(([table, data]) => (
                            <div key={table} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-300">{table}:</span>
                              <span className="font-medium">
                                {data.error ? (
                                  <span className="text-red-600">{data.error}</span>
                                ) : (
                                  data.count || 0
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-600">
                      Tenant não encontrado
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                Clique em "Verificar Status" para verificar o tenant
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Migration Results */}
      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {migrationResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Resultado da Migração
            </CardTitle>
          </CardHeader>
          <CardContent>
            {migrationResult.success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {migrationResult.message}
                  </AlertDescription>
                </Alert>

                {migrationResult.tenant && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Tenant Criado:</h4>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">ID:</span>
                      <span className="text-sm font-medium">{migrationResult.tenant.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Nome:</span>
                      <span className="text-sm font-medium">{migrationResult.tenant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Slug:</span>
                      <span className="text-sm font-medium">{migrationResult.tenant.slug}</span>
                    </div>
                  </div>
                )}

                {migrationResult.migrationResults && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Resultados da Migração:</h4>
                    <div className="space-y-1">
                      {migrationResult.migrationResults.map((result, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{result.table}:</span>
                          <span className="font-medium">
                            {result.success ? (
                              <span className="text-green-600">
                                {result.recordsUpdated} registros
                              </span>
                            ) : (
                              <span className="text-red-600">
                                Erro: {result.error}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {migrationResult.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
