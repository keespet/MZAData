'use client'

import { useState, useCallback } from 'react'
import { parseCSVFile, parsePolissenCSV, type ParseProgress } from '@/lib/csv/client-parser'

export type ImportPhase =
  | 'idle'
  | 'parsing'
  | 'starting'
  | 'uploading'
  | 'finishing'
  | 'done'
  | 'error'

export interface BatchImportStatus {
  phase: ImportPhase
  progress: number
  message: string
  recordsProcessed: number
  totalRecords: number
  batchesSent: number
  totalBatches: number
}

export interface BatchImportResult {
  success: boolean
  totaal: number
  duur_seconden: number
  error?: string
}

type VariantType = 'particulier' | 'zakelijk' | 'polissen'

const BATCH_SIZE = 500

async function sendBatch(
  url: string,
  body: unknown
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }))
    return { success: false, error: data.error || 'Request failed' }
  }

  return { success: true }
}

export function useBatchImport() {
  const [status, setStatus] = useState<BatchImportStatus>({
    phase: 'idle',
    progress: 0,
    message: '',
    recordsProcessed: 0,
    totalRecords: 0,
    batchesSent: 0,
    totalBatches: 0,
  })

  const [result, setResult] = useState<BatchImportResult | null>(null)

  const importFile = useCallback(async (
    file: File,
    variant: VariantType
  ): Promise<BatchImportResult> => {
    const startTime = Date.now()

    try {
      setResult(null)

      // Phase 1: Parse CSV
      setStatus({
        phase: 'parsing',
        progress: 0,
        message: 'CSV bestand parsen...',
        recordsProcessed: 0,
        totalRecords: 0,
        batchesSent: 0,
        totalBatches: 0,
      })

      const onParseProgress = (p: ParseProgress) => {
        setStatus(prev => ({
          ...prev,
          phase: 'parsing',
          progress: p.progress * 0.3, // Parsing is 30% of total
          message: `Parsen: ${p.recordsProcessed.toLocaleString('nl-NL')} records...`,
          recordsProcessed: p.recordsProcessed,
          totalRecords: p.totalRecords,
        }))
      }

      let records: Record<string, unknown>[] = []
      let polissenData: {
        polissen: Record<string, unknown>[]
        dekkingen: Record<string, unknown>[]
        pakketten: Record<string, unknown>[]
      } | null = null

      if (variant === 'polissen') {
        console.log('[batch-import] Starting polissen parse...')
        const parsed = await parsePolissenCSV(file, onParseProgress)
        console.log('[batch-import] Polissen parse complete:', {
          polissen: parsed.polissen.length,
          dekkingen: parsed.dekkingen.length,
          pakketten: parsed.pakketten.length,
          errors: parsed.errors,
        })
        if (parsed.errors.length > 0) {
          console.warn('Parse warnings:', parsed.errors)
        }
        polissenData = parsed
      } else {
        const parsed = await parseCSVFile(file, variant, onParseProgress)
        if (parsed.errors.length > 0) {
          console.warn('Parse warnings:', parsed.errors)
        }
        records = parsed.records
      }

      const totalRecords = variant === 'polissen'
        ? (polissenData?.polissen.length || 0)
        : records.length

      if (totalRecords === 0) {
        throw new Error('Geen geldige records gevonden in het bestand')
      }

      // Phase 2: Start import (delete existing, create sync log)
      setStatus(prev => ({
        ...prev,
        phase: 'starting',
        progress: 32,
        message: 'Import starten...',
        totalRecords,
      }))

      const baseUrl = `/api/import/${variant === 'particulier' ? 'relaties-particulier' : variant === 'zakelijk' ? 'relaties-zakelijk' : 'polissen'}`

      const startResponse = await fetch(`${baseUrl}/start`, { method: 'POST' })
      if (!startResponse.ok) {
        const data = await startResponse.json().catch(() => ({}))
        throw new Error(data.error || 'Kon import niet starten')
      }

      const { syncId } = await startResponse.json()

      // Phase 3: Send batches
      if (variant === 'polissen' && polissenData) {
        // For polissen, we need to batch all three types
        const allPolissen = polissenData.polissen
        const allDekkingen = polissenData.dekkingen
        const allPakketten = polissenData.pakketten

        const totalBatches = Math.ceil(allPolissen.length / BATCH_SIZE)

        for (let i = 0; i < allPolissen.length; i += BATCH_SIZE) {
          const batchNum = Math.floor(i / BATCH_SIZE) + 1
          const polissenBatch = allPolissen.slice(i, i + BATCH_SIZE)
          const polisIds = new Set(polissenBatch.map(p => p.id))

          // Get dekkingen for this batch of polissen
          const dekkingenBatch = allDekkingen.filter(d => polisIds.has(d.polis_id))

          // Get unique pakket IDs from this batch
          const pakketIds = new Set(
            polissenBatch
              .map(p => p.pakket_id)
              .filter(Boolean) as string[]
          )
          const pakkettenBatch = allPakketten.filter(p => pakketIds.has(p.id as string))

          setStatus(prev => ({
            ...prev,
            phase: 'uploading',
            progress: 35 + (batchNum / totalBatches) * 55,
            message: `Uploaden batch ${batchNum}/${totalBatches}...`,
            recordsProcessed: Math.min(i + BATCH_SIZE, allPolissen.length),
            batchesSent: batchNum,
            totalBatches,
          }))

          const result = await sendBatch(`${baseUrl}/batch`, {
            polissen: polissenBatch,
            dekkingen: dekkingenBatch,
            pakketten: pakkettenBatch,
            syncId,
          })

          if (!result.success) {
            throw new Error(result.error || `Batch ${batchNum} mislukt`)
          }
        }

        // Phase 4: Finish
        setStatus(prev => ({
          ...prev,
          phase: 'finishing',
          progress: 95,
          message: 'Import afronden...',
        }))

        const duurSeconden = (Date.now() - startTime) / 1000

        const finishResult = await sendBatch(`${baseUrl}/finish`, {
          syncId,
          totals: {
            polissen: allPolissen.length,
            dekkingen: allDekkingen.length,
            pakketten: allPakketten.length,
          },
          fileName: file.name,
          duurSeconden,
        })

        if (!finishResult.success) {
          throw new Error(finishResult.error || 'Kon import niet afronden')
        }

        const finalResult: BatchImportResult = {
          success: true,
          totaal: allPolissen.length,
          duur_seconden: duurSeconden,
        }

        setStatus({
          phase: 'done',
          progress: 100,
          message: 'Import voltooid!',
          recordsProcessed: allPolissen.length,
          totalRecords: allPolissen.length,
          batchesSent: totalBatches,
          totalBatches,
        })

        setResult(finalResult)
        return finalResult
      } else {
        // For relaties (particulier/zakelijk)
        const totalBatches = Math.ceil(records.length / BATCH_SIZE)

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batchNum = Math.floor(i / BATCH_SIZE) + 1
          const batch = records.slice(i, i + BATCH_SIZE)

          setStatus(prev => ({
            ...prev,
            phase: 'uploading',
            progress: 35 + (batchNum / totalBatches) * 55,
            message: `Uploaden batch ${batchNum}/${totalBatches}...`,
            recordsProcessed: Math.min(i + BATCH_SIZE, records.length),
            batchesSent: batchNum,
            totalBatches,
          }))

          const result = await sendBatch(`${baseUrl}/batch`, {
            records: batch,
            syncId,
          })

          if (!result.success) {
            throw new Error(result.error || `Batch ${batchNum} mislukt`)
          }
        }

        // Phase 4: Finish
        setStatus(prev => ({
          ...prev,
          phase: 'finishing',
          progress: 95,
          message: 'Import afronden...',
        }))

        const duurSeconden = (Date.now() - startTime) / 1000

        const finishResult = await sendBatch(`${baseUrl}/finish`, {
          syncId,
          totalRecords: records.length,
          fileName: file.name,
          duurSeconden,
        })

        if (!finishResult.success) {
          throw new Error(finishResult.error || 'Kon import niet afronden')
        }

        const finalResult: BatchImportResult = {
          success: true,
          totaal: records.length,
          duur_seconden: duurSeconden,
        }

        setStatus({
          phase: 'done',
          progress: 100,
          message: 'Import voltooid!',
          recordsProcessed: records.length,
          totalRecords: records.length,
          batchesSent: totalBatches,
          totalBatches,
        })

        setResult(finalResult)
        return finalResult
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'

      setStatus(prev => ({
        ...prev,
        phase: 'error',
        progress: 0,
        message: errorMessage,
      }))

      const errorResult: BatchImportResult = {
        success: false,
        totaal: 0,
        duur_seconden: (Date.now() - startTime) / 1000,
        error: errorMessage,
      }

      setResult(errorResult)
      return errorResult
    }
  }, [])

  const reset = useCallback(() => {
    setStatus({
      phase: 'idle',
      progress: 0,
      message: '',
      recordsProcessed: 0,
      totalRecords: 0,
      batchesSent: 0,
      totalBatches: 0,
    })
    setResult(null)
  }, [])

  return {
    status,
    result,
    importFile,
    reset,
    isImporting: !['idle', 'done', 'error'].includes(status.phase),
  }
}
