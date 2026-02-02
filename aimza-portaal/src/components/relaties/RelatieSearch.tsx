'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Loader2 } from 'lucide-react'
import { debounce } from '@/lib/utils'

interface RelatieSearchProps {
  onSearch: (query: string, type: string | null) => void
  isLoading?: boolean
}

export function RelatieSearch({ onSearch, isLoading }: RelatieSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [type, setType] = useState<string>(searchParams.get('type') || 'alle')

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((q: string, t: string) => {
      onSearch(q, t === 'alle' ? null : t)

      // Update URL params
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (t !== 'alle') params.set('type', t)

      const newUrl = params.toString() ? `?${params.toString()}` : ''
      router.replace(`/relaties${newUrl}`, { scroll: false })
    }, 500),
    [onSearch, router]
  )

  useEffect(() => {
    debouncedSearch(query, type)
  }, [query, type, debouncedSearch])

  return (
    <div className="space-y-4">
      <Tabs value={type} onValueChange={setType}>
        <TabsList>
          <TabsTrigger value="alle">Alle</TabsTrigger>
          <TabsTrigger value="particulier">Particulier</TabsTrigger>
          <TabsTrigger value="zakelijk">Zakelijk</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Zoek op naam, relatienummer, postcode, email, KvK..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>
    </div>
  )
}
