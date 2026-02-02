'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export interface ImportStatus {
  phase: 'idle' | 'reading' | 'processing' | 'comparing' | 'saving' | 'done' | 'error'
  progress: number
  message: string
}

export interface ImportResult {
  totaal: number
  nieuw: number
  gewijzigd: number
  verwijderd: number
  ongewijzigd: number
  duur_seconden: number
  error?: string
}

interface ImportProgressProps {
  status: ImportStatus
  result: ImportResult | null
  variant: 'particulier' | 'zakelijk' | 'polissen'
}

const phaseMessages: Record<ImportStatus['phase'], string> = {
  idle: 'Wachten op start...',
  reading: 'CSV lezen...',
  processing: 'Data verwerken...',
  comparing: 'Vergelijken met bestaande data...',
  saving: 'Opslaan in database...',
  done: 'Import voltooid!',
  error: 'Fout opgetreden',
}

const variantLabels: Record<string, string> = {
  particulier: 'Particuliere relaties',
  zakelijk: 'Zakelijke relaties',
  polissen: 'Polissen',
}

export function ImportProgress({ status, result, variant }: ImportProgressProps) {
  const showProgress = status.phase !== 'idle' && status.phase !== 'done' && status.phase !== 'error'
  const isDone = status.phase === 'done'
  const isError = status.phase === 'error'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {showProgress && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
          {isDone && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {isError && <XCircle className="h-5 w-5 text-red-600" />}
          Import {variantLabels[variant]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showProgress && (
          <>
            <Progress value={status.progress} className="h-2" />
            <p className="text-sm text-gray-600">{status.message || phaseMessages[status.phase]}</p>
          </>
        )}

        {isError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {result?.error || 'Er is een onbekende fout opgetreden'}
          </div>
        )}

        {isDone && result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {result.totaal.toLocaleString('nl-NL')}
                </p>
                <p className="text-xs text-gray-500">Totaal</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  +{result.nieuw.toLocaleString('nl-NL')}
                </p>
                <p className="text-xs text-gray-500">Nieuw</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {result.gewijzigd.toLocaleString('nl-NL')}
                </p>
                <p className="text-xs text-gray-500">Gewijzigd</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-600">
                  -{result.verwijderd.toLocaleString('nl-NL')}
                </p>
                <p className="text-xs text-gray-500">Verwijderd</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-400">
                  {result.ongewijzigd.toLocaleString('nl-NL')}
                </p>
                <p className="text-xs text-gray-500">Ongewijzigd</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center">
              Duur: {result.duur_seconden.toFixed(2)} seconden
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
