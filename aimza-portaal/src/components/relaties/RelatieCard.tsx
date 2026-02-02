'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RelatieTypeBadge } from './RelatieTypeBadge'
import { Mail, Phone, FileText, Building } from 'lucide-react'
import { buildFullName, buildFullAddress } from '@/lib/utils'
import type { RelatieOverview } from '@/lib/types/database'

interface RelatieCardProps {
  relatie: RelatieOverview
}

export function RelatieCard({ relatie }: RelatieCardProps) {
  const isZakelijk = relatie.relatie_type === 'zakelijk'

  const naam = isZakelijk
    ? [relatie.achternaam, relatie.naam_tweede_deel].filter(Boolean).join(' ')
    : buildFullName(relatie.voorletters, relatie.voorvoegsels, relatie.achternaam)

  const adres = buildFullAddress(
    relatie.adres,
    relatie.huisnummer,
    relatie.huisnummer_toevoeging,
    relatie.postcode,
    relatie.woonplaats
  )

  const contactpersoon = isZakelijk
    ? buildFullName(
        relatie.tav_voorletters,
        relatie.tav_voorvoegsels,
        relatie.tav_achternaam
      )
    : null

  return (
    <Link href={`/relaties/${relatie.id}`}>
      <Card className="h-full transition-all hover:shadow-md hover:border-gray-300 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <RelatieTypeBadge type={relatie.relatie_type} size="sm" />
            <Badge variant="secondary" className="text-xs">
              <FileText className="mr-1 h-3 w-3" />
              {relatie.aantal_polissen_actief || 0} polissen
            </Badge>
          </div>

          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1" title={naam}>
            {naam}
          </h3>

          <p className="text-sm text-gray-600 mb-3 line-clamp-1" title={adres}>
            {adres}
          </p>

          <div className="space-y-1.5">
            {relatie.email && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{relatie.email}</span>
              </div>
            )}

            {(relatie.telefoon_mobiel || relatie.telefoon_prive || relatie.telefoon_zakelijk) && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {relatie.telefoon_mobiel || relatie.telefoon_prive || relatie.telefoon_zakelijk}
                </span>
              </div>
            )}

            {isZakelijk && relatie.kvk_nummer && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building className="h-3.5 w-3.5 shrink-0" />
                <span>KvK: {relatie.kvk_nummer}</span>
              </div>
            )}

            {isZakelijk && contactpersoon && contactpersoon !== '-' && (
              <p className="text-xs text-gray-400 mt-2">
                T.a.v. {contactpersoon}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
