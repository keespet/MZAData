import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, User, Building2 } from 'lucide-react'
import { formatCurrency, formatDate, getBrancheColor, buildFullName } from '@/lib/utils'
import { RelatieTypeBadge } from '@/components/relaties/RelatieTypeBadge'
import type { Polis, PolisDekking, Relatie } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getPolisWithRelatie(id: string) {
  const supabase = await createClient()

  const { data: polis, error } = await supabase
    .from('polissen')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !polis) {
    return { polis: null, relatie: null, dekkingen: [] }
  }

  const { data: relatie } = await supabase
    .from('relaties')
    .select('*')
    .eq('id', polis.relatie_id)
    .single()

  const { data: dekkingen } = await supabase
    .from('polis_dekkingen')
    .select('*')
    .eq('polis_id', id)
    .order('dekking_naam')

  return {
    polis: polis as Polis,
    relatie: relatie as Relatie | null,
    dekkingen: (dekkingen || []) as PolisDekking[],
  }
}

function DataRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  )
}

export default async function PolisDetailPage({ params }: PageProps) {
  const { id } = await params
  const { polis, relatie, dekkingen } = await getPolisWithRelatie(id)

  if (!polis) {
    notFound()
  }

  const relatieNaam = relatie
    ? relatie.relatie_type === 'zakelijk'
      ? [relatie.achternaam, relatie.naam_tweede_deel].filter(Boolean).join(' ')
      : buildFullName(relatie.voorletters, relatie.voorvoegsels, relatie.achternaam)
    : 'Onbekend'

  const totaalDekkingenPremie = dekkingen.reduce(
    (sum, d) => sum + (d.premie_netto || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/polissen" className="text-gray-500 hover:text-gray-700">
          Polissen
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{polis.polisnummer}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/polissen">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={getBrancheColor(polis.hoofdbranche)}>
                {polis.hoofdbranche || 'Onbekend'}
              </Badge>
              {polis.branche && polis.branche !== polis.hoofdbranche && (
                <Badge variant="outline">{polis.branche}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {polis.maatschappij || 'Onbekende maatschappij'}
            </h1>
            <p className="text-sm text-gray-500">Polisnummer: {polis.polisnummer}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(polis.premie_netto)}
          </p>
          <p className="text-sm text-gray-500">per jaar</p>
        </div>
      </div>

      {/* Relatie link */}
      {relatie && (
        <Card>
          <CardContent className="p-4">
            <Link
              href={`/relaties/${relatie.id}`}
              className="flex items-center gap-3 text-blue-600 hover:text-blue-800"
            >
              {relatie.relatie_type === 'zakelijk' ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span>Bekijk relatie: {relatieNaam}</span>
              <RelatieTypeBadge type={relatie.relatie_type} size="sm" showIcon={false} />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Details grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basisgegevens */}
        <Card>
          <CardHeader>
            <CardTitle>Basisgegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Maatschappij code" value={polis.maatschappij_code} />
            <DataRow label="Soort polis" value={polis.soort_polis} />
            <DataRow label="Incassowijze" value={polis.incassowijze} />
            <DataRow label="IBAN" value={polis.iban_polis} />
            <DataRow label="Termijn" value={polis.termijn} />
          </CardContent>
        </Card>

        {/* Datums */}
        <Card>
          <CardHeader>
            <CardTitle>Datums</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Ingangsdatum" value={formatDate(polis.ingangsdatum)} />
            <DataRow label="Wijzigingsdatum" value={formatDate(polis.wijzigingsdatum)} />
            <DataRow label="Wijzigingsreden" value={polis.wijzigingsreden} />
            <DataRow label="Premievervaldatum" value={polis.premievervaldatum} />
          </CardContent>
        </Card>

        {/* Financieel */}
        <Card>
          <CardHeader>
            <CardTitle>Financieel</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Premie netto" value={formatCurrency(polis.premie_netto)} />
            <DataRow label="Provisie totaal" value={formatCurrency(polis.provisie_totaal)} />
            <DataRow label="Premie incasso" value={formatCurrency(polis.premie_incasso)} />
            <DataRow label="Verzekerd bedrag" value={formatCurrency(polis.verzekerd_bedrag)} />
            <DataRow label="Eigen risico" value={formatCurrency(polis.eigen_risico)} />
          </CardContent>
        </Card>

        {/* Risico-adres (indien aanwezig) */}
        {polis.risico_adres && (
          <Card>
            <CardHeader>
              <CardTitle>Risico-adres</CardTitle>
            </CardHeader>
            <CardContent>
              <DataRow label="Adres" value={polis.risico_adres} />
              <DataRow
                label="Huisnummer"
                value={[polis.risico_huisnummer, polis.risico_huisnummer_toev]
                  .filter(Boolean)
                  .join(' ')}
              />
              <DataRow label="Postcode" value={polis.risico_postcode} />
              <DataRow label="Plaats" value={polis.risico_plaats} />
            </CardContent>
          </Card>
        )}

        {/* Voertuig (indien motorrijtuigen) */}
        {polis.details?.kenteken && (
          <Card>
            <CardHeader>
              <CardTitle>Voertuig</CardTitle>
            </CardHeader>
            <CardContent>
              <DataRow label="Kenteken" value={polis.details.kenteken as string} />
              <DataRow label="Merk" value={polis.details.merk as string} />
              <DataRow label="Model" value={polis.details.model as string} />
              <DataRow
                label="Cataloguswaarde"
                value={formatCurrency(polis.details.cataloguswaarde as number)}
              />
              <DataRow
                label="Dagwaarde"
                value={formatCurrency(polis.details.dagwaarde as number)}
              />
            </CardContent>
          </Card>
        )}

        {/* Extra details */}
        {(polis.details?.gezinssamenstelling || polis.details?.dekkingsgebied) && (
          <Card>
            <CardHeader>
              <CardTitle>Overige gegevens</CardTitle>
            </CardHeader>
            <CardContent>
              {polis.details.gezinssamenstelling && (
                <DataRow
                  label="Gezinssamenstelling"
                  value={polis.details.gezinssamenstelling as string}
                />
              )}
              {polis.details.dekkingsgebied && (
                <DataRow label="Dekkingsgebied" value={polis.details.dekkingsgebied as string} />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Voorwaarden */}
      {polis.voorwaarden && polis.voorwaarden.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Voorwaarden</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {polis.voorwaarden.map((voorwaarde, i) => (
                <li key={i} className="text-sm text-gray-700">
                  {voorwaarde}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Clausules */}
      {polis.clausules && polis.clausules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clausules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead>Omschrijving</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polis.clausules.map((clausule, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-sm">{clausule.code}</TableCell>
                    <TableCell>{clausule.omschrijving}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dekkingen */}
      <Card>
        <CardHeader>
          <CardTitle>Dekkingen ({dekkingen.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {dekkingen.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Geen dekkingen gevonden
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dekking</TableHead>
                  <TableHead className="text-right">Premie</TableHead>
                  <TableHead className="text-right">Provisie</TableHead>
                  <TableHead className="text-right">Verzekerd bedrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dekkingen.map((dekking) => (
                  <TableRow key={dekking.id}>
                    <TableCell className="font-medium">{dekking.dekking_naam}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(dekking.premie_netto)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(dekking.provisie)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(dekking.verzekerd_bedrag)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totaal regel */}
                <TableRow className="font-bold bg-gray-50">
                  <TableCell>Totaal</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totaalDekkingenPremie)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      dekkingen.reduce((sum, d) => sum + (d.provisie || 0), 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      dekkingen.reduce((sum, d) => sum + (d.verzekerd_bedrag || 0), 0)
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
