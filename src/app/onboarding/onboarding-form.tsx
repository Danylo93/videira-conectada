'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Church } from 'lucide-react'
import { toast } from 'sonner'
import { validateTenantSlug } from '@/lib/tenant-dev'

export default function OnboardingForm() {
  const [churchName, setChurchName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSlugChange = (value: string) => {
    // Convert to lowercase and replace spaces/special chars with hyphens
    const formatted = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    setSlug(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!churchName.trim()) {
      setError('Nome da igreja é obrigatório')
      setLoading(false)
      return
    }

    if (!slug.trim()) {
      setError('Slug é obrigatório')
      setLoading(false)
      return
    }

    if (!validateTenantSlug(slug)) {
      setError('Slug deve conter apenas letras, números e hífens (3-50 caracteres)')
      setLoading(false)
      return
    }

    try {
      // Get user profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuário não encontrado')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        setError('Perfil não encontrado')
        return
      }

      // Check if slug is available
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingTenant) {
        setError('Este slug já está em uso. Escolha outro.')
        return
      }

      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          slug,
          name: churchName,
          owner_profile_id: profile.id,
          active: true,
        })
        .select()
        .single()

      if (tenantError) {
        setError(tenantError.message)
        return
      }

      // Add user to tenant
      const { error: membershipError } = await supabase
        .from('profile_tenants')
        .insert({
          profile_id: profile.id,
          tenant_id: tenant.id,
          role: 'owner',
        })

      if (membershipError) {
        setError(membershipError.message)
        return
      }

      // Create billing record
      const { error: billingError } = await supabase
        .from('tenant_billing')
        .insert({
          tenant_id: tenant.id,
          plan: 'free',
          status: 'inactive',
        })

      if (billingError) {
        console.error('Error creating billing record:', billingError)
        // Don't fail the onboarding for this
      }

      toast.success('Igreja configurada com sucesso!')
      router.push('/app/billing')
      router.refresh()
    } catch (error) {
      console.error('Onboarding error:', error)
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Church className="w-5 h-5" />
          Configurar Igreja
        </CardTitle>
        <CardDescription>
          Preencha as informações da sua igreja para começar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="churchName">Nome da Igreja</Label>
            <Input
              id="churchName"
              type="text"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              placeholder="Ex: Igreja Videira Central"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">URL da Igreja</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">https://</span>
              <Input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="igreja-videira-central"
                required
                disabled={loading}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">.meudominio.com</span>
            </div>
            <p className="text-xs text-gray-500">
              Apenas letras, números e hífens. Será usado para acessar sua igreja.
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              'Configurar Igreja'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
