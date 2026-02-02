// Kolom mapping voor Particuliere relaties CSV
export const RELATIE_PARTICULIER_KOLOM_MAPPING: Record<string, string> = {
  'Relatie->Hoofdrelatie J/N': 'hoofdrelatie_jn',
  'Relatie->Relatienummer hoofdrelatie': 'hoofdrelatie_nr',
  'Relatie->Relatienummer': 'id',
  'RelatieOms->Titulatuur': 'titulatuur',
  'RelatieOms->Aanhef': 'aanhef',
  'Relatie->Voorletters': 'voorletters',
  'Relatie->Voorvoegsels': 'voorvoegsels',
  'Relatie->Achternaam': 'achternaam',
  'Relatie->Roepnaam': 'roepnaam',
  'Relatie->Geboortedatum': 'geboortedatum',
  'RelatieOms->Geslacht': 'geslacht',
  'Relatie->Nationaliteit': 'nationaliteit',
  'Relatie->Adresseringregel adres': 'adres',
  'Relatie->Huisnummer': 'huisnummer',
  'Relatie->Huisnummer toevoeging': 'huisnummer_toevoeging',
  'Relatie->Postcode': 'postcode',
  'Relatie->Woonplaats': 'woonplaats',
  'RelatieOms->Land': 'land',
  'Relatie->E-mail adres': 'email',
  'Relatie->E-mail adres (tweede)': 'email_tweede',
  'Relatie->E-mail adres partner': 'email_partner',
  'Relatie->Telefoonnummer privé': 'telefoon_prive',
  'Relatie->Telefoonnummer mobiel': 'telefoon_mobiel',
  'RelatieOms->Producent relatie': 'producent',
  'RelatieOms->Belang': 'belang',
  'RelatieOms->Herkomst relatie, code': 'herkomst',
  'RelatieOms->Partner titulatuur': 'partner_titulatuur',
  'Relatie->Partner voorletters': 'partner_voorletters',
  'Relatie->Partner voorvoegsels': 'partner_voorvoegsels',
  'Relatie->Partner roepnaam': 'partner_roepnaam',
  'Relatie->Partner achternaam': 'partner_achternaam',
  'RelatieOms->Burgerlijke staat': 'burgerlijke_staat',
  'RelatieOms->Arbeidsverhouding': 'arbeidsverhouding',
  'RelatieOms->Mailing': 'mailing',
  'RelatieOms->Incassowijze relatie': 'incassowijze',
  'Relatie->IBAN Banknummer algemeen': 'iban_bank',
  'Relatie->IBAN Postbanknummer algeme': 'iban_postbank',
  'Relatie->Aantal kinderen relatie': 'aantal_kinderen',
  'Relatie->Polisblad per e-mail (pdf)': 'polisblad_per_email',
  'Relatie->Factuur per e-mail (pdf)': 'factuur_per_email',
  'Relatie->Aantal polissen van een re': 'aantal_polissen',
  'PolisTotaalJaar->Incassoprovisie to': 'incassoprovisie_totaal',
  'Relatie->Vrije Tekst 1': 'vrije_tekst_1',
  'Relatie->Vrije Tekst 2': 'vrije_tekst_2',
  'Relatie->Extra informatie 1': 'extra_informatie',
}

// Kolom mapping voor Zakelijke relaties CSV
export const RELATIE_ZAKELIJK_KOLOM_MAPPING: Record<string, string> = {
  // Basis
  'RelatieOms->Hoofdrelatie J/N': 'hoofdrelatie_jn',
  'Relatie->Relatienummer hoofdrelatie': 'hoofdrelatie_nr',
  'Relatie->Relatienummer': 'id',
  'RelatieOms->Aanhef': 'aanhef',
  'Relatie->Voorletters': 'voorletters',
  'Relatie->Voorvoegsels': 'voorvoegsels',
  'Relatie->Achternaam': 'achternaam', // = bedrijfsnaam
  'Relatie->Naam (tweede deel)': 'naam_tweede_deel',

  // Adres
  'Relatie->Straat': 'adres',
  'Relatie->Huisnummer': 'huisnummer',
  'Relatie->Huisnummer toevoeging': 'huisnummer_toevoeging',
  'Relatie->Postcode': 'postcode',
  'Relatie->Woonplaats': 'woonplaats',

  // Contact
  'Relatie->E-mail adres': 'email',
  'Relatie->Telefoonnummer zakelijk': 'telefoon_zakelijk',
  'Relatie->Telefoonnummer privé': 'telefoon_prive',
  'Relatie->Telefoonnummer mobiel': 'telefoon_mobiel',

  // Relatiebeheer
  'RelatieOms->Producent relatie': 'producent',
  'RelatieOms->Belang': 'belang',
  'RelatieOms->Herkomst relatie, code': 'herkomst',
  'Relatie->Aantal polissen van een re': 'aantal_polissen',

  // Marketing
  'RelatieOms->CVBi-Marketing': 'cvbi_marketing',
  'Relatie->Tenaamstelling CVBi': 'tenaamstelling_cvbi',

  // T.a.v. contactpersoon
  'RelatieOms->Titulatuur t.a.v.': 'tav_titulatuur',
  'RelatieOms->Aanhef t.a.v.': 'tav_aanhef',
  'Relatie->Voorletters t.a.v.': 'tav_voorletters',
  'Relatie->Voorvoegsels t.a.v.': 'tav_voorvoegsels',
  'Relatie->Achternaam t.a.v.': 'tav_achternaam',
  'Relatie->Roepnaam t.a.v.': 'tav_roepnaam',

  // Bedrijfsgegevens
  'Relatie->Kamer Van Koophandel numme': 'kvk_nummer',
  'RelatieOms->Rechtsvorm': 'rechtsvorm',
  'RelatieOms->SBI Hoofdactiviteit': 'sbi_hoofdactiviteit',
  'RelatieOms->SBI Nevenactiviteit 1': 'sbi_nevenactiviteit',
  'RelatieOms->Bedrijfstak': 'bedrijfstak',
  'RelatieOms->Zelfstandige zonder per': 'zzp',
  'RelatieOms->C.A.O.': 'cao',
  'RelatieOms->Sectorcode UWV': 'sectorcode_uwv',

  // Administratief
  'RelatieOms->Mailing': 'mailing',
  'Relatie->Laatste bezoekmaand': 'laatste_bezoekmaand',
  'Relatie->Bezoekdatum (volgende)': 'volgende_bezoekdatum',
  'RelatieOms->Incassowijze relatie': 'incassowijze',
  'Relatie->IBAN Banknummer algemeen': 'iban_bank',
  'Relatie->IBAN Postbanknummer algeme': 'iban_postbank',

  // Naverrekening
  'RelatieOms->Naverrekening Ja/Nee': 'naverrekening_jn',
  'Relatie->Naverrekeningsjaar huidig': 'naverrekening_jaar_huidig',
  'Relatie->Naverrekeningsjaar laatste': 'naverrekening_jaar_laatste',
  'RelatieOms->Machtiging boekhouder': 'machtiging_boekhouder',

  // Financieel
  'Relatie->Omzet (bedrag)': 'omzet',
  'Relatie->Jaarloon (excl. directie)': 'jaarloon',
  'Relatie->Brutowinst (bedrag)': 'brutowinst',

  // Personeel
  'Relatie->Aantal medewerkers (naverr': 'aantal_medewerkers',
  'Relatie->Aantal oproepkrachten (nav': 'aantal_oproepkrachten',

  // Wagenpark
  "Relatie->Aantal personenauto's": 'aantal_personenautos',
  "Relatie->Aantal bestelauto's": 'aantal_bestelautos',
  "Relatie->Aantal vrachtauto's": 'aantal_vrachtautos',
  'Relatie->Aantal werkmaterieel': 'aantal_werkmaterieel',

  // Compliance
  'RelatieOms->UBO-onderzoek verricht': 'ubo_onderzoek',

  // Vrije velden
  'Relatie->Vrije Tekst 1': 'vrije_tekst_1',
  'Relatie->Vrije Tekst 2': 'vrije_tekst_2',
  'Relatie->Extra informatie 1': 'extra_informatie',
}

// Kolom mapping voor Polissen CSV
export const POLIS_KOLOM_MAPPING: Record<string, string> = {
  'Polis->Relatienummer': 'relatie_id',
  'Polis->Polisnummer': 'polisnummer',
  'Polis->Volgnummer': 'volgnummer',
  'PakketOms->Pakketsoort': 'pakketsoort',
  'Pakket->Pakketkortingspercentage': 'pakket_korting',
  'Pakket->Polisnummer pakket': 'pakket_id',
  'PakketOms->Incassowijze pakket': 'pakket_incassowijze',
  'Pakket->IBAN Bankrekeningnummer pak': 'pakket_iban',
  'Polis->Maatschappij': 'maatschappij_code',
  'PolisOms->Maatschappij': 'maatschappij',
  'Polis->Soort polis': 'soort_polis',
  'PolisOms->Hoofdbranche': 'hoofdbranche',
  'PolisOms->Branche': 'branche',
  'DekkingOms->Dekking': 'dekking_naam',
  'Polis->Ingangsdatum': 'ingangsdatum',
  'Polis->Wijzigingsdatum': 'wijzigingsdatum',
  'Polis->Wijzigingsreden': 'wijzigingsreden_code',
  'PolisOms->Wijzigingsreden': 'wijzigingsreden',
  'Polis->Premievervaldatum': 'premievervaldatum',
  'Polis->Termijn': 'termijn',
  'DekkingJaar->Netto premie (=excl.ko': 'dekking_premie_netto',
  'DekkingJaar->Incassoprovisie totaal': 'dekking_provisie',
  'DekkingJaar->Incassobedrag': 'dekking_incassobedrag',
  'PolisOms->Incassowijze': 'incassowijze',
  'Polis->IBAN Bankreknr. (polis)': 'iban_polis',
  'Polis->Risicoadres straat': 'risico_adres',
  'Polis->Risicoadres huisnummer': 'risico_huisnummer',
  'Polis->Risicoadres huisnr. toevoegi': 'risico_huisnummer_toev',
  'Polis->Risicoadres postcode': 'risico_postcode',
  'Polis->Risicoadres plaats': 'risico_plaats',
  'Polis->Verzekerd bedrag': 'verzekerd_bedrag',
  'Dekking->Verzekerd bedrag': 'dekking_verzekerd_bedrag',
  'PolisOms->Polisvoorwaarde 1 (code)': 'voorwaarde_1',
  'PolisOms->Polisvoorwaarde 2 (code)': 'voorwaarde_2',
  'PolisOms->Polisvoorwaarde 3 (code)': 'voorwaarde_3',
  'PolisOms->Polisvoorwaarde 5 (code)': 'voorwaarde_5',
  'PolisOms->Polisvoorwaarde 6 (code)': 'voorwaarde_6',
  'PolisOms->Polisvoorwaarde 7 (code)': 'voorwaarde_7',
  'PolisOms->Polisvoorwaarde 8 (code)': 'voorwaarde_8',
  'Polis->Clausule 1': 'clausule_1_code',
  'PolisOms->Clausule 1': 'clausule_1_oms',
  'Polis->Clausule 2': 'clausule_2_code',
  'PolisOms->Clausule 2': 'clausule_2_oms',
  'Polis->Clausule 3': 'clausule_3_code',
  'PolisOms->Clausule 3': 'clausule_3_oms',
  'Polis->Clausule 4': 'clausule_4_code',
  'PolisOms->Clausule 4': 'clausule_4_oms',
  'Polis->Clausule 5': 'clausule_5_code',
  'PolisOms->Clausule 5': 'clausule_5_oms',
  'Polis->Clausule 6': 'clausule_6_code',
  'PolisOms->Clausule 6': 'clausule_6_oms',
  'Polis->Clausule 7': 'clausule_7_code',
  'PolisOms->Clausule 7': 'clausule_7_oms',
  'Polis->Clausule 8': 'clausule_8_code',
  'PolisOms->Clausule 8': 'clausule_8_oms',
  'Polis->Clausule 9': 'clausule_9_code',
  'PolisOms->Clausule 9': 'clausule_9_oms',
  'Polis->Clausule 10': 'clausule_10_code',
  'PolisOms->Clausule 10': 'clausule_10_oms',
  'Polis->Kenteken': 'kenteken',
  'Polis->Auto merk': 'merk',
  'Polis->Auto model': 'model',
  'Polis->Cataloguswaarde': 'cataloguswaarde',
  'Polis->Dagwaarde': 'dagwaarde',
  'PolisOms->Gezinssamenstelling': 'gezinssamenstelling',
  'PolisOms->Dekkingsgebied (code)': 'dekkingsgebied',
  'Polis->Eigen risico bedrag': 'eigen_risico',
}

// Parsed row types
export interface ParsedRelatieParticulier {
  id: string
  relatie_type: 'particulier'
  [key: string]: string | number | null | 'particulier'
}

export interface ParsedRelatieZakelijk {
  id: string
  relatie_type: 'zakelijk'
  [key: string]: string | number | null | 'zakelijk'
}

export interface ParsedPolisRow {
  relatie_id: string
  polisnummer: string
  volgnummer: string
  pakket_id?: string
  pakketsoort?: string
  pakket_korting?: number
  pakket_incassowijze?: string
  pakket_iban?: string
  maatschappij_code?: string
  maatschappij?: string
  soort_polis?: string
  hoofdbranche?: string
  branche?: string
  dekking_naam?: string
  ingangsdatum?: string
  wijzigingsdatum?: string
  wijzigingsreden_code?: string
  wijzigingsreden?: string
  premievervaldatum?: string
  termijn?: number
  dekking_premie_netto?: number
  dekking_provisie?: number
  dekking_incassobedrag?: number
  incassowijze?: string
  iban_polis?: string
  risico_adres?: string
  risico_huisnummer?: string
  risico_huisnummer_toev?: string
  risico_postcode?: string
  risico_plaats?: string
  verzekerd_bedrag?: number
  dekking_verzekerd_bedrag?: number
  voorwaarde_1?: string
  voorwaarde_2?: string
  voorwaarde_3?: string
  voorwaarde_5?: string
  voorwaarde_6?: string
  voorwaarde_7?: string
  voorwaarde_8?: string
  clausule_1_code?: string
  clausule_1_oms?: string
  clausule_2_code?: string
  clausule_2_oms?: string
  clausule_3_code?: string
  clausule_3_oms?: string
  clausule_4_code?: string
  clausule_4_oms?: string
  clausule_5_code?: string
  clausule_5_oms?: string
  clausule_6_code?: string
  clausule_6_oms?: string
  clausule_7_code?: string
  clausule_7_oms?: string
  clausule_8_code?: string
  clausule_8_oms?: string
  clausule_9_code?: string
  clausule_9_oms?: string
  clausule_10_code?: string
  clausule_10_oms?: string
  kenteken?: string
  merk?: string
  model?: string
  cataloguswaarde?: number
  dagwaarde?: number
  gezinssamenstelling?: string
  dekkingsgebied?: string
  eigen_risico?: number
}

export interface ImportResult {
  totaal: number
  nieuw: number
  gewijzigd: number
  verwijderd: number
  ongewijzigd: number
  duur_seconden: number
}
