import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RelatieTypeBadge } from '@/components/relaties/RelatieTypeBadge'
import { RelatieDetailParticulier } from '@/components/relaties/RelatieDetailParticulier'
import { RelatieDetailZakelijk } from '@/components/relaties/RelatieDetailZakelijk'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, FileText } from 'lucide-react'
import { buildFullName, formatCurrency, formatDate, getBrancheColor } from '@/lib/utils'
import type { Relatie, Polis } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getRelatieWithPolissen(id: string) {
  const supabase = await createClient()

  const { data: relatie, error } = await supabase
    .from('relaties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !relatie) {
    return { relatie: null, polissen: [] }
  }

  const { data: polissen } = await supabase
    .from('polissen')
    .select('*')
    .eq('relatie_id', id)
    .order('hoofdbranche')

  return {
    relatie: relatie as Relatie,
    polissen: (polissen || []) as Polis[],
  }
}

export default async function RelatieDetailPage({ params }: PageProps) {
  const { id } = await params
  const { relatie, polissen } = await getRelatieWithPolissen(id)

  if (!relatie) {
    notFound()
  }

  const isZakelijk = relatie.relatie_type === 'zakelijk'
  const naam = isZakelijk
    ? [relatie.achternaam, relatie.naam_tweede_deel].filter(Boolean).join(' ')
    : buildFullName(relatie.voorletters, relatie.voorvoegsels, relatie.achternaam)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/relaties" className="text-gray-500 hover:text-gray-700">
          Relaties
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{naam}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/relaties">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RelatieTypeBadge type={relatie.relatie_type} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{naam}</h1>
            <p className="text-sm text-gray-500">Relatienummer: {relatie.id}</p>
          </div>
        </div>
      </div>

      {/* Detail tabs based on type */}
      {isZakelijk ? (
        <RelatieDetailZakelijk relatie={relatie} />
      ) : (
        <RelatieDetailParticulier relatie={relatie} />
      )}

      {/* Polissen section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Polissen ({polissen.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {polissen.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Geen polissen gevonden voor deze relatie
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {polissen.map((polis) => (
                <Link key={polis.id} href={`/polissen/${polis.id}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-gray-300 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={getBrancheColor(polis.hoofdbranche)}>
                          {polis.hoofdbranche || 'Onbekend'}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(polis.premie_netto)}
                        </span>
                      </div>

                      <p className="font-medium text-gray-900 mb-1">
                        {polis.maatschappij || 'Onbekende maatschappij'}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">{polis.branche}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Polis: {polis.polisnummer}</span>
                        <span>Sinds {formatDate(polis.ingangsdatum)}</span>
                      </div>

                      {polis.details?.kenteken && (
                        <p className="text-xs text-blue-600 mt-2">
                          Kenteken: {polis.details.kenteken}
                        </p>
                      )}

                      {polis.risico_adres && (
                        <p className="text-xs text-orange-600 mt-2">
                          Risico: {polis.risico_adres} {polis.risico_huisnummer},{' '}
                          {polis.risico_postcode} {polis.risico_plaats}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
