'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import type { Relatie } from '@/lib/types/database'

interface RelatieDetailParticulierProps {
  relatie: Relatie
}

function DataRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  )
}

export function RelatieDetailParticulier({ relatie }: RelatieDetailParticulierProps) {
  const hasPartner = relatie.partner_achternaam || relatie.partner_voorletters

  return (
    <Tabs defaultValue="persoonlijk" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="persoonlijk">Persoonlijk</TabsTrigger>
        <TabsTrigger value="contact">Adres & Contact</TabsTrigger>
        <TabsTrigger value="partner" disabled={!hasPartner}>
          Partner
        </TabsTrigger>
        <TabsTrigger value="admin">Administratief</TabsTrigger>
      </TabsList>

      <TabsContent value="persoonlijk">
        <Card>
          <CardHeader>
            <CardTitle>Persoonsgegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Titulatuur" value={relatie.titulatuur} />
            <DataRow label="Voorletters" value={relatie.voorletters} />
            <DataRow label="Voorvoegsels" value={relatie.voorvoegsels} />
            <DataRow label="Achternaam" value={relatie.achternaam} />
            <DataRow label="Roepnaam" value={relatie.roepnaam} />
            <DataRow label="Geboortedatum" value={formatDate(relatie.geboortedatum)} />
            <DataRow label="Geslacht" value={relatie.geslacht} />
            <DataRow label="Nationaliteit" value={relatie.nationaliteit} />
            <DataRow label="Burgerlijke staat" value={relatie.burgerlijke_staat} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact">
        <Card>
          <CardHeader>
            <CardTitle>Adres & Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Adres" value={relatie.adres} />
            <DataRow
              label="Huisnummer"
              value={[relatie.huisnummer, relatie.huisnummer_toevoeging].filter(Boolean).join(' ')}
            />
            <DataRow label="Postcode" value={relatie.postcode} />
            <DataRow label="Woonplaats" value={relatie.woonplaats} />
            <DataRow label="Land" value={relatie.land} />
            <div className="my-4 border-t" />
            <DataRow label="Email" value={relatie.email} />
            <DataRow label="Email (tweede)" value={relatie.email_tweede} />
            <DataRow label="Telefoon privé" value={relatie.telefoon_prive} />
            <DataRow label="Telefoon mobiel" value={relatie.telefoon_mobiel} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="partner">
        <Card>
          <CardHeader>
            <CardTitle>Partner</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Titulatuur" value={relatie.partner_titulatuur} />
            <DataRow label="Voorletters" value={relatie.partner_voorletters} />
            <DataRow label="Voorvoegsels" value={relatie.partner_voorvoegsels} />
            <DataRow label="Achternaam" value={relatie.partner_achternaam} />
            <DataRow label="Roepnaam" value={relatie.partner_roepnaam} />
            <DataRow label="Email partner" value={relatie.email_partner} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="admin">
        <Card>
          <CardHeader>
            <CardTitle>Administratief</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Relatienummer" value={relatie.id} />
            <DataRow label="Producent" value={relatie.producent} />
            <DataRow label="Belang" value={relatie.belang} />
            <DataRow label="Herkomst" value={relatie.herkomst} />
            <div className="my-4 border-t" />
            <DataRow label="Incassowijze" value={relatie.incassowijze} />
            <DataRow label="IBAN Bank" value={relatie.iban_bank} />
            <DataRow label="IBAN Postbank" value={relatie.iban_postbank} />
            <div className="my-4 border-t" />
            <DataRow label="Mailing" value={relatie.mailing} />
            <DataRow label="Polisblad per email" value={relatie.polisblad_per_email} />
            <DataRow label="Factuur per email" value={relatie.factuur_per_email} />
            <div className="my-4 border-t" />
            <DataRow label="Aantal kinderen" value={relatie.aantal_kinderen} />
            <DataRow label="Arbeidsverhouding" value={relatie.arbeidsverhouding} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
