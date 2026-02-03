'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'
import { DropZone } from '@/components/upload/DropZone'
import { CsvPreview } from '@/components/upload/CsvPreview'
import { ImportProgress, ImportStatus, ImportResult } from '@/components/upload/ImportProgress'
import { useBatchImport, type BatchImportStatus } from '@/hooks/useBatchImport'
import toast from 'react-hot-toast'

type VariantType = 'particulier' | 'zakelijk' | 'polissen'

interface FileState {
  file: File | null
  preview: { headers: string[]; rows: string[][] } | null
}

// Convert batch import status to ImportProgress status
function toImportStatus(batchStatus: BatchImportStatus): ImportStatus {
  const phaseMap: Record<string, ImportStatus['phase']> = {
    idle: 'idle',
    parsing: 'reading',
    starting: 'processing',
    uploading: 'saving',
    finishing: 'saving',
    done: 'done',
    error: 'error',
  }

  return {
    phase: phaseMap[batchStatus.phase] || 'idle',
    progress: batchStatus.progress,
    message: batchStatus.message,
  }
}

export default function UploadPage() {
  const [files, setFiles] = useState<Record<VariantType, FileState>>({
    particulier: { file: null, preview: null },
    zakelijk: { file: null, preview: null },
    polissen: { file: null, preview: null },
  })

  const [activeVariant, setActiveVariant] = useState<VariantType | null>(null)

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    variant: VariantType | null
  }>({ isOpen: false, variant: null })

  const { status: batchStatus, result: batchResult, importFile, isImporting } = useBatchImport()

  const handleFileSelect = useCallback((variant: VariantType, file: File) => {
    // Detect delimiter based on variant
    const delimiter = variant === 'polissen' ? ',' : ';'

    // Parse CSV for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = Papa.parse(content, {
        header: false,
        preview: 11, // Headers + 10 rows
        delimiter,
        quoteChar: '"',
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

    setActiveVariant(variant)

    try {
      const result = await importFile(file, variant)

      if (result.success) {
        toast.success(
          `Import ${variant} succesvol: ${result.totaal.toLocaleString('nl-NL')} records in ${result.duur_seconden.toFixed(1)}s`
        )
      } else {
        toast.error(`Import ${variant} mislukt: ${result.error}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
      toast.error(`Import ${variant} mislukt: ${errorMessage}`)
    }
  }, [files, importFile])

  // Convert batch status to ImportResult for display
  const getImportResult = (): ImportResult | null => {
    if (!batchResult) return null
    return {
      totaal: batchResult.totaal,
      nieuw: batchResult.totaal, // All are "new" in batch import
      gewijzigd: 0,
      verwijderd: 0,
      ongewijzigd: 0,
      duur_seconden: batchResult.duur_seconden,
      error: batchResult.error,
    }
  }

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
              van hetzelfde type wordt volledig vervangen. Grote bestanden worden
              automatisch in batches verwerkt.
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

      {/* Import Progress */}
      {activeVariant && batchStatus.phase !== 'idle' && (
        <ImportProgress
          variant={activeVariant}
          status={toImportStatus(batchStatus)}
          result={getImportResult()}
        />
      )}

      {/* Batch Progress Details */}
      {isImporting && batchStatus.totalBatches > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Records verwerkt:</span>
                <span className="font-mono">
                  {batchStatus.recordsProcessed.toLocaleString('nl-NL')} / {batchStatus.totalRecords.toLocaleString('nl-NL')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Batches verstuurd:</span>
                <span className="font-mono">
                  {batchStatus.batchesSent} / {batchStatus.totalBatches}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
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
