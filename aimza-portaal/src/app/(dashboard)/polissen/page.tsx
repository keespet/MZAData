'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { Search, Loader2, FileText } from 'lucide-react'
import { formatCurrency, getBrancheColor, debounce, buildFullName } from '@/lib/utils'
import { RelatieTypeBadge } from '@/components/relaties/RelatieTypeBadge'
import type { PolisOverview } from '@/lib/types/database'

export default function PolissenPage() {
  const [polissen, setPolissen] = useState<PolisOverview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [brancheFilter, setBrancheFilter] = useState<string>('alle')
  const [typeFilter, setTypeFilter] = useState<string>('alle')
  const [branches, setBranches] = useState<string[]>([])

  const supabase = createClient()

  // Load unique branches for filter dropdown
  useEffect(() => {
    async function loadBranches() {
      const { data } = await supabase
        .from('polissen')
        .select('hoofdbranche')
        .not('hoofdbranche', 'is', null)
        .not('hoofdbranche', 'eq', '')

      if (data) {
        const unique = [...new Set(data.map((p) => p.hoofdbranche))]
          .filter(Boolean)
          .sort() as string[]
        setBranches(unique)
      }
    }
    loadBranches()
  }, [supabase])

  const handleSearch = useCallback(
    async (query: string, branche: string, type: string) => {
      if (!query && branche === 'alle' && type === 'alle') {
        setPolissen([])
        setHasSearched(false)
        return
      }

      setIsLoading(true)
      setHasSearched(true)

      try {
        let searchQuery = supabase.from('polissen_overview').select('*')

        if (branche !== 'alle') {
          searchQuery = searchQuery.eq('hoofdbranche', branche)
        }

        if (type !== 'alle') {
          searchQuery = searchQuery.eq('relatie_type', type)
        }

        if (query) {
          searchQuery = searchQuery.or(
            `polisnummer.ilike.%${query}%,maatschappij.ilike.%${query}%,branche.ilike.%${query}%,relatie_achternaam.ilike.%${query}%,risico_postcode.ilike.%${query}%,risico_plaats.ilike.%${query}%`
          )
        }

        const { data, error } = await searchQuery
          .order('polisnummer')
          .limit(100)

        if (error) {
          console.error('Search error:', error)
          setPolissen([])
        } else {
          setPolissen(data as PolisOverview[])
        }
      } catch (error) {
        console.error('Search error:', error)
        setPolissen([])
      } finally {
        setIsLoading(false)
      }
    },
    [supabase]
  )

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((q: string, b: string, t: string) => {
      handleSearch(q, b, t)
    }, 500),
    [handleSearch]
  )

  useEffect(() => {
    debouncedSearch(searchQuery, brancheFilter, typeFilter)
  }, [searchQuery, brancheFilter, typeFilter, debouncedSearch])

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Zoek op polisnummer, kenteken, adres, maatschappij..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>

        <Select value={brancheFilter} onValueChange={setBrancheFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Branche" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Relatie type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle types</SelectItem>
            <SelectItem value="particulier">Particulier</SelectItem>
            <SelectItem value="zakelijk">Zakelijk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Polisnummer</TableHead>
                  <TableHead>Maatschappij</TableHead>
                  <TableHead>Branche</TableHead>
                  <TableHead>Relatie</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Premie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : polissen.length > 0 ? (
        <>
          <p className="text-sm text-gray-500">
            {polissen.length} {polissen.length === 1 ? 'resultaat' : 'resultaten'} gevonden
          </p>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Polisnummer</TableHead>
                    <TableHead>Maatschappij</TableHead>
                    <TableHead>Branche</TableHead>
                    <TableHead>Relatie</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Premie</TableHead>
                    <TableHead>Extra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {polissen.map((polis) => (
                    <TableRow
                      key={polis.id}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell>
                        <Link
                          href={`/polissen/${polis.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {polis.polisnummer}
                        </Link>
                      </TableCell>
                      <TableCell>{polis.maatschappij || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getBrancheColor(polis.hoofdbranche)}>
                          {polis.hoofdbranche || 'Onbekend'}
                        </Badge>
                        {polis.branche && polis.branche !== polis.hoofdbranche && (
                          <span className="ml-2 text-xs text-gray-500">
                            {polis.branche}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/relaties/${polis.relatie_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {buildFullName(
                            polis.relatie_voorletters,
                            polis.relatie_voorvoegsels,
                            polis.relatie_achternaam
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {polis.relatie_type && (
                          <RelatieTypeBadge
                            type={polis.relatie_type}
                            size="sm"
                            showIcon={false}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(polis.premie_netto)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {polis.details?.kenteken && (
                          <span className="text-blue-600">{polis.details.kenteken}</span>
                        )}
                        {polis.risico_postcode && (
                          <span className="text-orange-600">
                            {polis.risico_postcode} {polis.risico_plaats}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : hasSearched ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Geen polissen gevonden
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Probeer andere zoektermen of filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Zoek polissen
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Gebruik de zoekbalk of filters hierboven om polissen te vinden.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
