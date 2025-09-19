'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database,
  Calendar,
  Loader2,
  Info,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ExportOptions {
  tenant: {
    id: string
    slug: string
    name: string
  }
  availableFormats: string[]
  tableCounts: Record<string, number>
  message: string
}

const tableLabels: Record<string, string> = {
  profiles: 'Perfis de Usuários',
  members: 'Membros',
  cell_reports: 'Relatórios de Células',
  events: 'Eventos',
  courses: 'Cursos',
  course_registrations: 'Inscrições em Cursos',
  event_registrations: 'Inscrições em Eventos',
  tenant_invoices: 'Faturas',
}

const formatLabels: Record<string, string> = {
  json: 'JSON',
  csv: 'CSV',
  xlsx: 'Excel (XLSX)',
}

const formatIcons: Record<string, any> = {
  json: FileText,
  csv: FileText,
  xlsx: FileSpreadsheet,
}

export default function ExportContent() {
  const [exportOptions, setExportOptions] = useState<ExportOptions | null>(null)
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [selectedFormat, setSelectedFormat] = useState<string>('json')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    fetchExportOptions()
  }, [])

  const fetchExportOptions = async () => {
    setLoadingOptions(true)
    try {
      const response = await fetch('/api/export')
      const data = await response.json()
      
      if (response.ok) {
        setExportOptions(data)
        // Select all tables by default
        setSelectedTables(Object.keys(data.tableCounts).filter(table => data.tableCounts[table] > 0))
      } else {
        toast.error('Erro ao carregar opções de exportação')
      }
    } catch (error) {
      console.error('Error fetching export options:', error)
      toast.error('Erro ao carregar opções de exportação')
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleTableToggle = (table: string) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table]
    )
  }

  const handleSelectAll = () => {
    if (!exportOptions) return
    
    const allTables = Object.keys(exportOptions.tableCounts).filter(table => exportOptions.tableCounts[table] > 0)
    setSelectedTables(allTables)
  }

  const handleSelectNone = () => {
    setSelectedTables([])
  }

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast.error('Selecione pelo menos uma tabela para exportar')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: selectedFormat,
          tables: selectedTables,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro na exportação')
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export-${new Date().toISOString().split('T')[0]}.${selectedFormat}`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Exportação concluída com sucesso!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erro na exportação: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!exportOptions) {
    return (
      <div className="text-center py-12">
        <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Erro ao carregar opções
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Não foi possível carregar as opções de exportação
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Exportar Dados
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Exporte os dados da sua igreja em diferentes formatos
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta ferramenta permite exportar todos os dados da sua igreja para backup ou análise.
          Os dados são exportados com isolamento por tenant, garantindo privacidade.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Configurar Exportação
            </CardTitle>
            <CardDescription>
              Selecione as tabelas e formato para exportação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Formato de Exportação</Label>
              <div className="grid grid-cols-3 gap-2">
                {exportOptions.availableFormats.map((format) => {
                  const Icon = formatIcons[format]
                  return (
                    <Button
                      key={format}
                      variant={selectedFormat === format ? 'default' : 'outline'}
                      onClick={() => setSelectedFormat(format)}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{formatLabels[format]}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label>Filtro por Data (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom" className="text-sm">Data Inicial</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo" className="text-sm">Data Final</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Table Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tabelas para Exportar</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Selecionar Todas
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectNone}>
                    Desmarcar Todas
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(exportOptions.tableCounts).map(([table, count]) => (
                  <div key={table} className="flex items-center space-x-2">
                    <Checkbox
                      id={table}
                      checked={selectedTables.includes(table)}
                      onCheckedChange={() => handleTableToggle(table)}
                    />
                    <Label htmlFor={table} className="flex-1 flex items-center justify-between">
                      <span>{tableLabels[table] || table}</span>
                      <Badge variant="outline">{count} registros</Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleExport}
              disabled={loading || selectedTables.length === 0}
              className="w-full flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loading ? 'Exportando...' : 'Exportar Dados'}
            </Button>
          </CardContent>
        </Card>

        {/* Export Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Exportação</CardTitle>
            <CardDescription>
              Informações sobre os dados que serão exportados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Igreja:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {exportOptions.tenant.name} ({exportOptions.tenant.slug})
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Formato:</h4>
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = formatIcons[selectedFormat]
                  return <Icon className="w-4 h-4" />
                })()}
                <span className="text-sm">{formatLabels[selectedFormat]}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Tabelas Selecionadas:</h4>
              <div className="space-y-1">
                {selectedTables.map((table) => (
                  <div key={table} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {tableLabels[table] || table}
                    </span>
                    <Badge variant="outline">
                      {exportOptions.tableCounts[table]} registros
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {dateFrom && dateTo && (
              <div className="space-y-2">
                <h4 className="font-medium">Filtro de Data:</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  {new Date(dateFrom).toLocaleDateString('pt-BR')} até {new Date(dateTo).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Total: {selectedTables.reduce((sum, table) => sum + exportOptions.tableCounts[table], 0)} registros
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas de Exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                JSON
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Formato ideal para backup e integração com outros sistemas.
                Preserva todos os tipos de dados e relacionamentos.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                CSV
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Formato compatível com Excel e Google Sheets.
                Ideal para análise de dados e relatórios.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Formato nativo do Excel com múltiplas planilhas.
                Ideal para apresentações e relatórios executivos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
