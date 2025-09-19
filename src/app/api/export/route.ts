import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTenantFromRequest } from '@/lib/tenant'
import { z } from 'zod'

const exportSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx']),
  tables: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

/**
 * Export tenant data in various formats
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantFromRequest()
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const { format, tables, dateFrom, dateTo } = exportSchema.parse(body)

    // Default tables to export if none specified
    const defaultTables = [
      'profiles',
      'members',
      'cell_reports',
      'events',
      'courses',
      'course_registrations',
      'event_registrations',
      'tenant_invoices'
    ]

    const tablesToExport = tables || defaultTables
    const exportData: Record<string, any[]> = {}

    // Fetch data from each table
    for (const table of tablesToExport) {
      try {
        let query = supabase
          .from(table)
          .select('*')
          .eq('tenant_id', tenant.id)

        // Add date filters if provided
        if (dateFrom && dateTo) {
          const dateFields = ['created_at', 'updated_at', 'event_date', 'join_date', 'submitted_at']
          const dateField = dateFields.find(field => {
            // Check if the field exists in the table schema
            return true // Simplified for now
          })
          
          if (dateField) {
            query = query
              .gte(dateField, dateFrom)
              .lte(dateField, dateTo)
          }
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error fetching ${table}:`, error)
          exportData[table] = []
        } else {
          exportData[table] = data || []
        }
      } catch (error) {
        console.error(`Error processing ${table}:`, error)
        exportData[table] = []
      }
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `videira-conectada-${tenant.slug}-${timestamp}`

    if (format === 'json') {
      const jsonData = {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          exportDate: new Date().toISOString(),
        },
        data: exportData,
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData)
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    }

    if (format === 'xlsx') {
      // For XLSX, we'll return JSON and let the client handle conversion
      // In a real implementation, you'd use a library like 'xlsx' here
      const xlsxData = {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          exportDate: new Date().toISOString(),
        },
        data: exportData,
        format: 'xlsx',
      }

      return new NextResponse(JSON.stringify(xlsxData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })

  } catch (error) {
    console.error('Export error:', error)
    
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
 * Convert data to CSV format
 */
function convertToCSV(data: Record<string, any[]>): string {
  const csvLines: string[] = []
  
  Object.entries(data).forEach(([tableName, records]) => {
    if (records.length === 0) return
    
    csvLines.push(`\n=== ${tableName.toUpperCase()} ===\n`)
    
    // Get headers from first record
    const headers = Object.keys(records[0])
    csvLines.push(headers.join(','))
    
    // Add data rows
    records.forEach(record => {
      const values = headers.map(header => {
        const value = record[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      })
      csvLines.push(values.join(','))
    })
  })
  
  return csvLines.join('\n')
}

/**
 * GET endpoint to list available export options
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await getTenantFromRequest()
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get record counts for each table
    const tables = [
      'profiles',
      'members',
      'cell_reports',
      'events',
      'courses',
      'course_registrations',
      'event_registrations',
      'tenant_invoices'
    ]

    const tableCounts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        if (error) {
          tableCounts[table] = 0
        } else {
          tableCounts[table] = count || 0
        }
      } catch (error) {
        tableCounts[table] = 0
      }
    }

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      availableFormats: ['json', 'csv', 'xlsx'],
      tableCounts,
      message: 'Export options retrieved successfully'
    })

  } catch (error) {
    console.error('Error getting export options:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
