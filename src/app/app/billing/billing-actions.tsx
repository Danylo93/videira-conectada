'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Smartphone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BillingActionsProps {
  tenantId: string
  currentPlan: string
  isActive: boolean
  hasStripeCustomer: boolean
}

export default function BillingActions({ 
  tenantId, 
  currentPlan, 
  isActive, 
  hasStripeCustomer 
}: BillingActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const plans = [
    {
      name: 'Starter',
      price: 'R$ 29',
      description: 'Até 50 membros',
      features: ['Gestão de células', 'Relatórios básicos', 'Suporte por email'],
    },
    {
      name: 'Standard', 
      price: 'R$ 49',
      description: 'Até 200 membros',
      features: ['Todas as funcionalidades', 'Relatórios avançados', 'Suporte prioritário'],
    },
    {
      name: 'Pro',
      price: 'R$ 99', 
      description: 'Membros ilimitados',
      features: ['Todas as funcionalidades', 'Relatórios personalizados', 'Suporte dedicado'],
    },
  ]

  const handleSubscription = async (plan: string) => {
    setLoading(`subscription-${plan}`)
    
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'subscription',
          plan: plan.toLowerCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast.error('Erro ao processar assinatura. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  const handlePixPayment = async (plan: string) => {
    setLoading(`pix-${plan}`)
    
    try {
      const amountMap = {
        starter: 2900,
        standard: 4900,
        pro: 9900,
      }

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'payment',
          plan: plan.toLowerCase(),
          amountCents: amountMap[plan.toLowerCase() as keyof typeof amountMap],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating Pix payment:', error)
      toast.error('Erro ao processar pagamento Pix. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoading('manage')
    
    try {
      // This would typically redirect to Stripe Customer Portal
      // For now, we'll show a message
      toast.info('Portal de gerenciamento em desenvolvimento')
    } catch (error) {
      console.error('Error managing subscription:', error)
      toast.error('Erro ao acessar portal de gerenciamento')
    } finally {
      setLoading(null)
    }
  }

  if (isActive && currentPlan !== 'free') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Assinatura</CardTitle>
          <CardDescription>
            Sua assinatura está ativa. Gerencie pagamentos e alterações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleManageSubscription}
              disabled={loading === 'manage'}
              className="flex items-center gap-2"
            >
              {loading === 'manage' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Gerenciar Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Escolha seu Plano</CardTitle>
          <CardDescription>
            Selecione o plano ideal para sua igreja ou pague com Pix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.name} className="border rounded-lg p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    {currentPlan === plan.name.toLowerCase() && (
                      <Badge variant="outline">Atual</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{plan.price}/mês</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{plan.description}</p>
                </div>
                
                <ul className="text-sm space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-300">
                      • {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleSubscription(plan.name)}
                    disabled={loading === `subscription-${plan.name.toLowerCase()}`}
                    className="w-full flex items-center gap-2"
                  >
                    {loading === `subscription-${plan.name.toLowerCase()}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Assinar com Cartão
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handlePixPayment(plan.name)}
                    disabled={loading === `pix-${plan.name.toLowerCase()}`}
                    className="w-full flex items-center gap-2"
                  >
                    {loading === `pix-${plan.name.toLowerCase()}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Smartphone className="w-4 h-4" />
                    )}
                    Pagar com Pix (30 dias)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Assinatura com Cartão
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Cobrança automática mensal</li>
                <li>• Renovação automática</li>
                <li>• Cancelamento a qualquer momento</li>
                <li>• Portal de gerenciamento</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Pagamento com Pix
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Pagamento único</li>
                <li>• 30 dias de acesso</li>
                <li>• Renovação manual</li>
                <li>• Ideal para testes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
