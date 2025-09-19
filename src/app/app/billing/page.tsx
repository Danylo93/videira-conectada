import { getTenantBilling, getTenantInvoices } from '@/lib/tenant-dev'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Calendar, Receipt, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import BillingActions from './billing-actions'

async function BillingContent() {
  // Mock tenant data
  const tenant = {
    id: 'mock-tenant-id',
    slug: 'local-test',
    name: 'Igreja Local Test',
  }

  const billing = await getTenantBilling(tenant.id)
  const invoices = await getTenantInvoices(tenant.id)

  if (!billing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Configuração de Billing
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Não foi possível carregar as informações de billing.
          </p>
        </div>
      </div>
    )
  }

  const isActive = billing.status === 'active' && 
    billing.current_period_end && 
    new Date(billing.current_period_end) > new Date()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'past_due': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'canceled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'unpaid': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'past_due': return 'Vencido'
      case 'canceled': return 'Cancelado'
      case 'unpaid': return 'Não Pago'
      default: return 'Inativo'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Billing
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie sua assinatura e pagamentos
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isActive ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            Status da Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </span>
            <Badge className={getStatusColor(billing.status)}>
              {getStatusText(billing.status)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Plano:
            </span>
            <span className="text-sm text-gray-900 dark:text-white capitalize">
              {billing.plan}
            </span>
          </div>

          {billing.current_period_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Próximo vencimento:
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {format(new Date(billing.current_period_end), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          )}

          {billing.payment_method_type && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Método de pagamento:
              </span>
              <span className="text-sm text-gray-900 dark:text-white capitalize">
                {billing.payment_method_type === 'card' ? 'Cartão' : 'Pix'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <BillingActions 
        tenantId={tenant.id}
        currentPlan={billing.plan}
        isActive={isActive}
        hasStripeCustomer={!!billing.stripe_customer_id}
      />

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Histórico de Faturas
          </CardTitle>
          <CardDescription>
            Visualize todas as suas faturas e pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                Nenhuma fatura encontrada
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.stripe_invoice_id ? `Fatura ${invoice.stripe_invoice_id.slice(-8)}` : 'Pagamento Pix'}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {invoice.status === 'paid' ? 'Pago' : invoice.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        R$ {(invoice.amount / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                    
                    {invoice.hosted_invoice_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                          Ver Fatura
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function BillingPage() {
  return <BillingContent />
}
