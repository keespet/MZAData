'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Relatie } from '@/lib/types/database'

interface RelatieDetailZakelijkProps {
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

export function RelatieDetailZakelijk({ relatie }: RelatieDetailZakelijkProps) {
  const hasContactpersoon = relatie.tav_achternaam || relatie.tav_voorletters

  return (
    <Tabs defaultValue="bedrijf" className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1">
        <TabsTrigger value="bedrijf">Bedrijf</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
        <TabsTrigger value="tav" disabled={!hasContactpersoon}>
          T.a.v.
        </TabsTrigger>
        <TabsTrigger value="financieel">Financieel</TabsTrigger>
        <TabsTrigger value="personeel">Personeel</TabsTrigger>
        <TabsTrigger value="naverrekening">Naverrekening</TabsTrigger>
        <TabsTrigger value="admin">Admin</TabsTrigger>
      </TabsList>

      <TabsContent value="bedrijf">
        <Card>
          <CardHeader>
            <CardTitle>Bedrijfsgegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow
              label="Bedrijfsnaam"
              value={[relatie.achternaam, relatie.naam_tweede_deel].filter(Boolean).join(' ')}
            />
            <DataRow label="KvK nummer" value={relatie.kvk_nummer} />
            <DataRow label="Rechtsvorm" value={relatie.rechtsvorm} />
            <div className="my-4 border-t" />
            <DataRow label="SBI Hoofdactiviteit" value={relatie.sbi_hoofdactiviteit} />
            <DataRow label="SBI Nevenactiviteit" value={relatie.sbi_nevenactiviteit} />
            <DataRow label="Bedrijfstak" value={relatie.bedrijfstak} />
            <div className="my-4 border-t" />
            <DataRow label="ZZP" value={relatie.zzp} />
            <DataRow label="CAO" value={relatie.cao} />
            <DataRow label="Sectorcode UWV" value={relatie.sectorcode_uwv} />
            <div className="my-4 border-t" />
            <DataRow label="UBO-onderzoek verricht" value={relatie.ubo_onderzoek} />
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
            <div className="my-4 border-t" />
            <DataRow label="Email" value={relatie.email} />
            <DataRow label="Telefoon zakelijk" value={relatie.telefoon_zakelijk} />
            <DataRow label="Telefoon privé" value={relatie.telefoon_prive} />
            <DataRow label="Telefoon mobiel" value={relatie.telefoon_mobiel} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tav">
        <Card>
          <CardHeader>
            <CardTitle>Contactpersoon (T.a.v.)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Titulatuur" value={relatie.tav_titulatuur} />
            <DataRow label="Aanhef" value={relatie.tav_aanhef} />
            <DataRow label="Voorletters" value={relatie.tav_voorletters} />
            <DataRow label="Voorvoegsels" value={relatie.tav_voorvoegsels} />
            <DataRow label="Achternaam" value={relatie.tav_achternaam} />
            <DataRow label="Roepnaam" value={relatie.tav_roepnaam} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="financieel">
        <Card>
          <CardHeader>
            <CardTitle>Financieel</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Omzet" value={formatCurrency(relatie.omzet)} />
            <DataRow label="Jaarloon (excl. directie)" value={formatCurrency(relatie.jaarloon)} />
            <DataRow label="Brutowinst" value={formatCurrency(relatie.brutowinst)} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="personeel">
        <Card>
          <CardHeader>
            <CardTitle>Personeel & Wagenpark</CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Personeel</h4>
            <DataRow label="Aantal medewerkers" value={relatie.aantal_medewerkers} />
            <DataRow label="Aantal oproepkrachten" value={relatie.aantal_oproepkrachten} />
            <div className="my-4 border-t" />
            <h4 className="text-sm font-medium text-gray-700 mb-2">Wagenpark</h4>
            <DataRow label="Personenauto's" value={relatie.aantal_personenautos} />
            <DataRow label="Bestelauto's" value={relatie.aantal_bestelautos} />
            <DataRow label="Vrachtauto's" value={relatie.aantal_vrachtautos} />
            <DataRow label="Werkmaterieel" value={relatie.aantal_werkmaterieel} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="naverrekening">
        <Card>
          <CardHeader>
            <CardTitle>Naverrekening</CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Naverrekening" value={relatie.naverrekening_jn} />
            <DataRow label="Huidig jaar" value={relatie.naverrekening_jaar_huidig} />
            <DataRow label="Laatste jaar" value={relatie.naverrekening_jaar_laatste} />
            <DataRow label="Machtiging boekhouder" value={relatie.machtiging_boekhouder} />
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
            <DataRow label="Laatste bezoekmaand" value={relatie.laatste_bezoekmaand} />
            <DataRow
              label="Volgende bezoekdatum"
              value={formatDate(relatie.volgende_bezoekdatum)}
            />
            <div className="my-4 border-t" />
            <DataRow label="CVBi Marketing" value={relatie.cvbi_marketing} />
            <DataRow label="Tenaamstelling CVBi" value={relatie.tenaamstelling_cvbi} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
