import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const backupSchema = z.object({
  type: z.enum(['full', 'incremental']),
  includeData: z.boolean().default(true),
  includeSchema: z.boolean().default(true),
})

/**
 * Create a system backup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, includeData, includeSchema } = backupSchema.parse(body)

    const supabase = await createAdminClient()

    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, slug, name, created_at')

    if (tenantsError) {
      return NextResponse.json({ 
        error: 'Error fetching tenants: ' + tenantsError.message 
      }, { status: 500 })
    }

    const backupData: any = {
      metadata: {
        type,
        timestamp: new Date().toISOString(),
        version: '1.0',
        includeData,
        includeSchema,
      },
      tenants: [],
    }

    // Backup each tenant's data
    for (const tenant of tenants || []) {
      const tenantData: any = {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          created_at: tenant.created_at,
        },
        data: {},
      }

      if (includeData) {
        // Tables to backup
        const tables = [
          'profiles',
          'members',
          'cell_reports',
          'events',
          'courses',
          'course_registrations',
          'event_registrations',
          'tenant_billing',
          'tenant_invoices',
          'profile_tenants',
          'notifications',
        ]

        for (const table of tables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .eq('tenant_id', tenant.id)

            if (error) {
              console.error(`Error backing up ${table} for tenant ${tenant.slug}:`, error)
              tenantData.data[table] = []
            } else {
              tenantData.data[table] = data || []
            }
          } catch (error) {
            console.error(`Error processing ${table} for tenant ${tenant.slug}:`, error)
            tenantData.data[table] = []
          }
        }
      }

      backupData.tenants.push(tenantData)
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `videira-backup-${type}-${timestamp}.json`

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Backup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * GET endpoint to get backup status and history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // Get system statistics
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, slug, name, active, created_at')

    if (tenantsError) {
      return NextResponse.json({ 
        error: 'Error fetching tenants: ' + tenantsError.message 
      }, { status: 500 })
    }

    // Get total record counts
    const tables = [
      'profiles',
      'members',
      'cell_reports',
      'events',
      'courses',
      'course_registrations',
      'event_registrations',
      'tenant_billing',
      'tenant_invoices',
      'profile_tenants',
      'notifications',
    ]

    const tableCounts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          tableCounts[table] = 0
        } else {
          tableCounts[table] = count || 0
        }
      } catch (error) {
        tableCounts[table] = 0
      }
    }

    // Calculate total size estimate (rough)
    const totalRecords = Object.values(tableCounts).reduce((sum, count) => sum + count, 0)
    const estimatedSize = totalRecords * 0.5 // Rough estimate: 0.5KB per record

    return NextResponse.json({
      systemStats: {
        totalTenants: tenants?.length || 0,
        activeTenants: tenants?.filter(t => t.active).length || 0,
        totalRecords,
        estimatedSizeKB: Math.round(estimatedSize),
        lastBackup: null, // Would be stored in a backup_logs table
      },
      tableCounts,
      availableBackupTypes: ['full', 'incremental'],
      message: 'Backup status retrieved successfully'
    })

  } catch (error) {
    console.error('Error getting backup status:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
