'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'
import { DropZone } from '@/components/upload/DropZone'
import { CsvPreview } from '@/components/upload/CsvPreview'
import { ImportProgress, ImportStatus, ImportResult } from '@/components/upload/ImportProgress'
import toast from 'react-hot-toast'

type VariantType = 'particulier' | 'zakelijk' | 'polissen'

interface FileState {
  file: File | null
  preview: { headers: string[]; rows: string[][] } | null
}

interface ImportState {
  status: ImportStatus
  result: ImportResult | null
}

const initialImportState: ImportState = {
  status: { phase: 'idle', progress: 0, message: '' },
  result: null,
}

export default function UploadPage() {
  const [files, setFiles] = useState<Record<VariantType, FileState>>({
    particulier: { file: null, preview: null },
    zakelijk: { file: null, preview: null },
    polissen: { file: null, preview: null },
  })

  const [imports, setImports] = useState<Record<VariantType, ImportState>>({
    particulier: initialImportState,
    zakelijk: initialImportState,
    polissen: initialImportState,
  })

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    variant: VariantType | null
  }>({ isOpen: false, variant: null })

  const handleFileSelect = useCallback((variant: VariantType, file: File) => {
    // Parse CSV for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = Papa.parse(content, {
        header: false,
        preview: 11, // Headers + 10 rows
        delimiter: variant === 'polissen' ? ',' : '\t',
      })

      const headers = result.data[0] as string[]
      const rows = result.data.slice(1) as string[][]

      setFiles((prev) => ({
        ...prev,
        [variant]: {
          file,
          preview: { headers, rows },
        },
      }))
    }
    reader.readAsText(file, 'ISO-8859-1')
  }, [])

  const handlePreview = useCallback((variant: VariantType) => {
    setPreviewModal({ isOpen: true, variant })
  }, [])

  const handleImport = useCallback(async (variant: VariantType) => {
    const file = files[variant].file
    if (!file) return

    const apiEndpoints: Record<VariantType, string> = {
      particulier: '/api/import/relaties-particulier',
      zakelijk: '/api/import/relaties-zakelijk',
      polissen: '/api/import/polissen',
    }

    try {
      // Update status to reading
      setImports((prev) => ({
        ...prev,
        [variant]: {
          status: { phase: 'reading', progress: 10, message: 'Bestand lezen...' },
          result: null,
        },
      }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', file.name)

      // Update status to processing
      setImports((prev) => ({
        ...prev,
        [variant]: {
          status: { phase: 'processing', progress: 30, message: 'Data verwerken...' },
          result: null,
        },
      }))

      const response = await fetch(apiEndpoints[variant], {
        method: 'POST',
        body: formData,
      })

      // Update status to saving
      setImports((prev) => ({
        ...prev,
        [variant]: {
          status: { phase: 'saving', progress: 70, message: 'Opslaan in database...' },
          result: null,
        },
      }))

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import mislukt')
      }

      // Success
      setImports((prev) => ({
        ...prev,
        [variant]: {
          status: { phase: 'done', progress: 100, message: 'Import voltooid!' },
          result: {
            totaal: data.totaal,
            nieuw: data.nieuw,
            gewijzigd: data.gewijzigd,
            verwijderd: data.verwijderd,
            ongewijzigd: data.ongewijzigd,
            duur_seconden: data.duur_seconden,
          },
        },
      }))

      toast.success(`Import ${variant} succesvol: ${data.totaal} records`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'

      setImports((prev) => ({
        ...prev,
        [variant]: {
          status: { phase: 'error', progress: 0, message: errorMessage },
          result: { totaal: 0, nieuw: 0, gewijzigd: 0, verwijderd: 0, ongewijzigd: 0, duur_seconden: 0, error: errorMessage },
        },
      }))

      toast.error(`Import ${variant} mislukt: ${errorMessage}`)
    }
  }, [files])

  const isImporting = Object.values(imports).some(
    (i) => !['idle', 'done', 'error'].includes(i.status.phase)
  )

  const activeImports = Object.entries(imports).filter(
    ([_, i]) => i.status.phase !== 'idle'
  ) as [VariantType, ImportState][]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV Import</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Importeer CSV-exports uit het legacy COBOL-systeem. Bestaande data
              van hetzelfde type wordt volledig vervangen.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-3">
            <DropZone
              variant="particulier"
              selectedFile={files.particulier.file}
              onFileSelect={(file) => handleFileSelect('particulier', file)}
              onPreview={() => handlePreview('particulier')}
              onImport={() => handleImport('particulier')}
              canPreview={!!files.particulier.preview}
              canImport={!!files.particulier.file}
              isLoading={isImporting}
            />

            <DropZone
              variant="zakelijk"
              selectedFile={files.zakelijk.file}
              onFileSelect={(file) => handleFileSelect('zakelijk', file)}
              onPreview={() => handlePreview('zakelijk')}
              onImport={() => handleImport('zakelijk')}
              canPreview={!!files.zakelijk.preview}
              canImport={!!files.zakelijk.file}
              isLoading={isImporting}
            />

            <DropZone
              variant="polissen"
              selectedFile={files.polissen.file}
              onFileSelect={(file) => handleFileSelect('polissen', file)}
              onPreview={() => handlePreview('polissen')}
              onImport={() => handleImport('polissen')}
              canPreview={!!files.polissen.preview}
              canImport={!!files.polissen.file}
              isLoading={isImporting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Import Progress Cards */}
      {activeImports.length > 0 && (
        <div className="space-y-4">
          {activeImports.map(([variant, state]) => (
            <ImportProgress
              key={variant}
              variant={variant}
              status={state.status}
              result={state.result}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.variant && files[previewModal.variant].preview && (
        <CsvPreview
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, variant: null })}
          title={
            previewModal.variant === 'particulier'
              ? 'Relaties Particulier'
              : previewModal.variant === 'zakelijk'
              ? 'Relaties Zakelijk'
              : 'Polissen'
          }
          headers={files[previewModal.variant].preview!.headers}
          rows={files[previewModal.variant].preview!.rows}
        />
      )}
    </div>
  )
}
