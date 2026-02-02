'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, History, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { SyncWijziging } from '@/lib/types/database'

const PAGE_SIZE = 50

const tabelLabels: Record<string, string> = {
  relaties_particulier: 'Particulier',
  relaties_zakelijk: 'Zakelijk',
  polissen: 'Polissen',
}

const typeLabels: Record<string, { label: string; color: string }> = {
  nieuw: { label: 'Nieuw', color: 'bg-green-100 text-green-800' },
  gewijzigd: { label: 'Gewijzigd', color: 'bg-blue-100 text-blue-800' },
  verwijderd: { label: 'Verwijderd', color: 'bg-red-100 text-red-800' },
}

export default function MutatiesPage() {
  const [wijzigingen, setWijzigingen] = useState<SyncWijziging[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tabelFilter, setTabelFilter] = useState<string>('alle')
  const [typeFilter, setTypeFilter] = useState<string>('alle')

  const supabase = createClient()

  useEffect(() => {
    async function loadWijzigingen() {
      setIsLoading(true)

      try {
        let query = supabase
          .from('sync_wijzigingen')
          .select('*', { count: 'exact' })

        if (tabelFilter !== 'alle') {
          query = query.eq('tabel_naam', tabelFilter)
        }

        if (typeFilter !== 'alle') {
          query = query.eq('wijziging_type', typeFilter)
        }

        if (dateFrom) {
          query = query.gte('sync_datum', `${dateFrom}T00:00:00`)
        }

        if (dateTo) {
          query = query.lte('sync_datum', `${dateTo}T23:59:59`)
        }

        const from = (currentPage - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        const { data, error, count } = await query
          .order('sync_datum', { ascending: false })
          .range(from, to)

        if (error) {
          console.error('Error loading wijzigingen:', error)
          setWijzigingen([])
          setTotalCount(0)
        } else {
          setWijzigingen(data as SyncWijziging[])
          setTotalCount(count || 0)
        }
      } catch (error) {
        console.error('Error:', error)
        setWijzigingen([])
        setTotalCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    loadWijzigingen()
  }, [supabase, currentPage, tabelFilter, typeFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleExport = () => {
    // Create CSV content
    const headers = ['Datum', 'Tabel', 'Record ID', 'Type', 'Veld', 'Oude waarde', 'Nieuwe waarde']
    const rows = wijzigingen.map((w) => [
      formatDateTime(w.sync_datum),
      tabelLabels[w.tabel_naam] || w.tabel_naam,
      w.record_id,
      w.wijziging_type,
      w.veld_naam || '',
      w.oude_waarde || '',
      w.nieuwe_waarde || '',
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mutaties_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Van datum
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tot datum
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tabel
              </label>
              <Select
                value={tabelFilter}
                onValueChange={(v) => {
                  setTabelFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle tabellen</SelectItem>
                  <SelectItem value="relaties_particulier">Particulier</SelectItem>
                  <SelectItem value="relaties_zakelijk">Zakelijk</SelectItem>
                  <SelectItem value="polissen">Polissen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Type
              </label>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle types</SelectItem>
                  <SelectItem value="nieuw">Nieuw</SelectItem>
                  <SelectItem value="gewijzigd">Gewijzigd</SelectItem>
                  <SelectItem value="verwijderd">Verwijderd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Wijzigingen ({totalCount.toLocaleString('nl-NL')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : wijzigingen.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Geen wijzigingen gevonden
              </h3>
              <p className="text-sm text-gray-500">
                Pas de filters aan om wijzigingen te bekijken.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tabel</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Veld</TableHead>
                    <TableHead>Oude waarde</TableHead>
                    <TableHead>Nieuwe waarde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wijzigingen.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(w.sync_datum)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tabelLabels[w.tabel_naam] || w.tabel_naam}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{w.record_id}</TableCell>
                      <TableCell>
                        <Badge className={typeLabels[w.wijziging_type]?.color}>
                          {typeLabels[w.wijziging_type]?.label || w.wijziging_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {w.veld_naam || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                        {w.oude_waarde || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 max-w-[200px] truncate">
                        {w.nieuwe_waarde || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Pagina {currentPage} van {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Vorige
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Volgende
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
