'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RelatieSearch } from '@/components/relaties/RelatieSearch'
import { RelatieCard } from '@/components/relaties/RelatieCard'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'
import type { RelatieOverview } from '@/lib/types/database'

export default function RelatiesPage() {
  const [relaties, setRelaties] = useState<RelatieOverview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const supabase = createClient()

  const handleSearch = useCallback(
    async (query: string, type: string | null) => {
      if (!query && !type) {
        setRelaties([])
        setHasSearched(false)
        return
      }

      setIsLoading(true)
      setHasSearched(true)

      try {
        let searchQuery = supabase.from('relaties_overview').select('*')

        if (type) {
          searchQuery = searchQuery.eq('relatie_type', type)
        }

        if (query) {
          // Use ilike for flexible search
          searchQuery = searchQuery.or(
            `id.ilike.%${query}%,achternaam.ilike.%${query}%,roepnaam.ilike.%${query}%,postcode.ilike.%${query}%,woonplaats.ilike.%${query}%,email.ilike.%${query}%,kvk_nummer.ilike.%${query}%`
          )
        }

        const { data, error } = await searchQuery
          .order('achternaam')
          .limit(100)

        if (error) {
          console.error('Search error:', error)
          setRelaties([])
        } else {
          setRelaties(data as RelatieOverview[])
        }
      } catch (error) {
        console.error('Search error:', error)
        setRelaties([])
      } finally {
        setIsLoading(false)
      }
    },
    [supabase]
  )

  return (
    <div className="space-y-6">
      <RelatieSearch onSearch={handleSearch} isLoading={isLoading} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-3 w-2/3 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : relaties.length > 0 ? (
        <>
          <p className="text-sm text-gray-500">
            {relaties.length} {relaties.length === 1 ? 'resultaat' : 'resultaten'} gevonden
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relaties.map((relatie) => (
              <RelatieCard key={relatie.id} relatie={relatie} />
            ))}
          </div>
        </>
      ) : hasSearched ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Geen relaties gevonden
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Probeer andere zoektermen zoals een naam, postcode, email of KvK-nummer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Zoek relaties
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Gebruik de zoekbalk hierboven om relaties te vinden op naam,
              relatienummer, postcode, email of KvK-nummer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
