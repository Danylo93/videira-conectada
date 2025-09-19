import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const migrateSchema = z.object({
  tenantSlug: z.string().min(3).max(50),
  tenantName: z.string().min(1),
  ownerEmail: z.string().email(),
})

/**
 * API endpoint para migrar dados existentes para o sistema multi-tenant
 * Este endpoint deve ser usado apenas uma vez durante a transição
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantSlug, tenantName, ownerEmail } = migrateSchema.parse(body)

    const supabase = await createAdminClient()

    // 1. Verificar se o tenant já existe
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (existingTenant) {
      return NextResponse.json({ 
        error: 'Tenant já existe com este slug' 
      }, { status: 400 })
    }

    // 2. Buscar o perfil do owner
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('email', ownerEmail)
      .single()

    if (!ownerProfile) {
      return NextResponse.json({ 
        error: 'Perfil do owner não encontrado' 
      }, { status: 404 })
    }

    // 3. Criar o tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        slug: tenantSlug,
        name: tenantName,
        owner_profile_id: ownerProfile.id,
        active: true,
      })
      .select()
      .single()

    if (tenantError) {
      return NextResponse.json({ 
        error: 'Erro ao criar tenant: ' + tenantError.message 
      }, { status: 500 })
    }

    // 4. Adicionar owner ao tenant
    const { error: membershipError } = await supabase
      .from('profile_tenants')
      .insert({
        profile_id: ownerProfile.id,
        tenant_id: tenant.id,
        role: 'owner',
      })

    if (membershipError) {
      return NextResponse.json({ 
        error: 'Erro ao adicionar owner ao tenant: ' + membershipError.message 
      }, { status: 500 })
    }

    // 5. Criar billing record
    const { error: billingError } = await supabase
      .from('tenant_billing')
      .insert({
        tenant_id: tenant.id,
        plan: 'free',
        status: 'inactive',
      })

    if (billingError) {
      console.error('Erro ao criar billing record:', billingError)
      // Não falha a migração por isso
    }

    // 6. Migrar dados existentes (associar com tenant_id)
    const tablesToMigrate = [
      'profiles',
      'members', 
      'cell_reports',
      'events',
      'courses',
      'course_registrations',
      'event_registrations'
    ]

    const migrationResults = []

    for (const table of tablesToMigrate) {
      try {
        // Atualizar registros existentes para associar com o tenant
        const { data, error } = await supabase
          .from(table)
          .update({ tenant_id: tenant.id })
          .neq('id', '00000000-0000-0000-0000-000000000000') // Update all records
          .select('id')

        if (error) {
          console.error(`Erro ao migrar tabela ${table}:`, error)
          migrationResults.push({
            table,
            success: false,
            error: error.message,
            recordsUpdated: 0
          })
        } else {
          migrationResults.push({
            table,
            success: true,
            recordsUpdated: data?.length || 0
          })
        }
      } catch (error) {
        console.error(`Erro inesperado ao migrar tabela ${table}:`, error)
        migrationResults.push({
          table,
          success: false,
          error: 'Erro inesperado',
          recordsUpdated: 0
        })
      }
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      migrationResults,
      message: 'Migração concluída com sucesso'
    })

  } catch (error) {
    console.error('Erro na migração:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

/**
 * GET endpoint para verificar status da migração
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const tenantSlug = searchParams.get('slug')

    if (!tenantSlug) {
      return NextResponse.json({ 
        error: 'Slug do tenant é obrigatório' 
      }, { status: 400 })
    }

    // Verificar se tenant existe
    const { data: tenant } = await supabase
      .from('tenants')
      .select(`
        id,
        slug,
        name,
        active,
        created_at,
        profile_tenants!inner(role)
      `)
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return NextResponse.json({ 
        exists: false,
        message: 'Tenant não encontrado'
      })
    }

    // Contar registros por tabela
    const tablesToCheck = [
      'profiles',
      'members', 
      'cell_reports',
      'events',
      'courses',
      'course_registrations',
      'event_registrations'
    ]

    const recordCounts = {}

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        if (error) {
          recordCounts[table] = { error: error.message }
        } else {
          recordCounts[table] = { count: count || 0 }
        }
      } catch (error) {
        recordCounts[table] = { error: 'Erro inesperado' }
      }
    }

    return NextResponse.json({
      exists: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        active: tenant.active,
        created_at: tenant.created_at,
        role: tenant.profile_tenants[0]?.role
      },
      recordCounts,
      message: 'Status da migração verificado'
    })

  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
