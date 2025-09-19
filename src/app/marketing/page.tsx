import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Star } from 'lucide-react'
import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: 'R$ 29',
    period: '/mês',
    description: 'Perfeito para igrejas pequenas',
    features: [
      'Até 50 membros',
      'Gestão de células',
      'Relatórios básicos',
      'Suporte por email',
    ],
    popular: false,
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  {
    name: 'Standard',
    price: 'R$ 49',
    period: '/mês',
    description: 'Ideal para igrejas em crescimento',
    features: [
      'Até 200 membros',
      'Gestão completa de células',
      'Relatórios avançados',
      'Eventos e cursos',
      'Suporte prioritário',
    ],
    popular: true,
    stripePriceId: process.env.STRIPE_PRICE_STANDARD,
  },
  {
    name: 'Pro',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para igrejas grandes e redes',
    features: [
      'Membros ilimitados',
      'Todas as funcionalidades',
      'Relatórios personalizados',
      'Integração com sistemas',
      'Suporte dedicado',
    ],
    popular: false,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Escolha o plano ideal para sua igreja
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Gerencie células, relatórios e eventos com facilidade. 
            Comece grátis e evolua conforme sua igreja cresce.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-lg">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  asChild 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  <Link href="/auth/signup">
                    Começar Agora
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Pagamento com Pix
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Prefere pagar com Pix? Oferecemos pagamento único com 30 dias de acesso.
              Ideal para testar o sistema ou pagamentos pontuais.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">R$ 29</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Starter</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">R$ 49</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Standard</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">R$ 99</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Pro</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
