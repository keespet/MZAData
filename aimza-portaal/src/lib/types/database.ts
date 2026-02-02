export type UserRole = 'admin' | 'uploader' | 'user'

export interface Profile {
  id: string
  email: string
  naam: string | null
  role: UserRole
  actief: boolean
  created_at: string
  updated_at: string
}

export interface Relatie {
  id: string
  relatie_type: 'particulier' | 'zakelijk'
  hoofdrelatie_jn: string | null
  hoofdrelatie_nr: string | null

  // Persoonlijke/Bedrijfsgegevens
  titulatuur: string | null
  aanhef: string | null
  voorletters: string | null
  voorvoegsels: string | null
  achternaam: string | null
  naam_tweede_deel: string | null
  roepnaam: string | null
  geboortedatum: string | null
  geslacht: string | null
  nationaliteit: string | null

  // Adres
  adres: string | null
  huisnummer: string | null
  huisnummer_toevoeging: string | null
  postcode: string | null
  woonplaats: string | null
  land: string | null

  // Contact
  email: string | null
  email_tweede: string | null
  email_partner: string | null
  telefoon_prive: string | null
  telefoon_mobiel: string | null
  telefoon_zakelijk: string | null

  // Relatiebeheer
  producent: string | null
  belang: string | null
  herkomst: string | null

  // Partner gegevens (particulier)
  partner_titulatuur: string | null
  partner_voorletters: string | null
  partner_voorvoegsels: string | null
  partner_roepnaam: string | null
  partner_achternaam: string | null

  // T.a.v. contactpersoon (zakelijk)
  tav_titulatuur: string | null
  tav_aanhef: string | null
  tav_voorletters: string | null
  tav_voorvoegsels: string | null
  tav_achternaam: string | null
  tav_roepnaam: string | null

  // Administratief
  burgerlijke_staat: string | null
  arbeidsverhouding: string | null
  mailing: string | null
  incassowijze: string | null
  iban_bank: string | null
  iban_postbank: string | null
  aantal_kinderen: number | null
  polisblad_per_email: string | null
  factuur_per_email: string | null
  aantal_polissen: number | null
  incassoprovisie_totaal: number | null

  // Marketing (zakelijk)
  cvbi_marketing: string | null
  tenaamstelling_cvbi: string | null

  // Bedrijfsgegevens (zakelijk)
  kvk_nummer: string | null
  rechtsvorm: string | null
  sbi_hoofdactiviteit: string | null
  sbi_nevenactiviteit: string | null
  bedrijfstak: string | null
  zzp: string | null
  cao: string | null
  sectorcode_uwv: string | null

  // Bezoek (zakelijk)
  laatste_bezoekmaand: string | null
  volgende_bezoekdatum: string | null

  // Naverrekening (zakelijk)
  naverrekening_jn: string | null
  naverrekening_jaar_huidig: number | null
  naverrekening_jaar_laatste: number | null
  machtiging_boekhouder: string | null

  // Financieel zakelijk
  omzet: number | null
  jaarloon: number | null
  brutowinst: number | null

  // Personeel (zakelijk)
  aantal_medewerkers: number | null
  aantal_oproepkrachten: number | null

  // Wagenpark (zakelijk)
  aantal_personenautos: number | null
  aantal_bestelautos: number | null
  aantal_vrachtautos: number | null
  aantal_werkmaterieel: number | null

  // Compliance (zakelijk)
  ubo_onderzoek: string | null

  // Vrije velden
  vrije_tekst_1: string | null
  vrije_tekst_2: string | null
  extra_informatie: string | null

  // Metadata
  created_at: string
  updated_at: string
}

export interface RelatieOverview extends Relatie {
  aantal_polissen_actief: number
  totaal_premie: number
}

export interface Pakket {
  id: string
  relatie_id: string | null
  pakketsoort: string | null
  kortingspercentage: number | null
  incassowijze: string | null
  iban: string | null
  created_at: string
  updated_at: string
}

export interface Polis {
  id: string
  polisnummer: string
  volgnummer: string | null
  relatie_id: string | null
  pakket_id: string | null

  // Maatschappij & Classificatie
  maatschappij_code: string | null
  maatschappij: string | null
  soort_polis: string | null
  hoofdbranche: string | null
  branche: string | null

  // Datums
  ingangsdatum: string | null
  wijzigingsdatum: string | null
  wijzigingsreden_code: string | null
  wijzigingsreden: string | null
  premievervaldatum: string | null
  termijn: number | null

  // Financieel
  premie_netto: number | null
  provisie_totaal: number | null
  premie_incasso: number | null

  // Incasso
  incassowijze: string | null
  iban_polis: string | null

  // Risico adres
  risico_adres: string | null
  risico_huisnummer: string | null
  risico_huisnummer_toev: string | null
  risico_postcode: string | null
  risico_plaats: string | null

  // Verzekerd
  verzekerd_bedrag: number | null
  eigen_risico: number | null

  // JSON velden
  voorwaarden: string[]
  clausules: { code: string; omschrijving: string }[]
  details: {
    kenteken?: string
    merk?: string
    model?: string
    cataloguswaarde?: number
    dagwaarde?: number
    gezinssamenstelling?: string
    dekkingsgebied?: string
    [key: string]: unknown
  }

  // Metadata
  created_at: string
  updated_at: string
}

export interface PolisOverview extends Polis {
  relatie_achternaam: string | null
  relatie_voorletters: string | null
  relatie_voorvoegsels: string | null
  relatie_woonplaats: string | null
  relatie_type: 'particulier' | 'zakelijk' | null
  aantal_dekkingen: number
}

export interface PolisDekking {
  id: number
  polis_id: string
  dekking_code: string | null
  dekking_naam: string | null
  premie_netto: number | null
  provisie: number | null
  incassobedrag: number | null
  verzekerd_bedrag: number | null
  created_at: string
}

export interface SyncLog {
  id: number
  sync_datum: string
  tabel_naam: string
  bestand_naam: string | null
  records_totaal: number
  records_nieuw: number
  records_gewijzigd: number
  records_verwijderd: number
  records_ongewijzigd: number
  sync_duur_seconden: number | null
  status: string
  error_message: string | null
  uitgevoerd_door: string | null
}

export interface SyncWijziging {
  id: number
  sync_id: number
  sync_datum: string
  tabel_naam: string
  record_id: string
  wijziging_type: 'nieuw' | 'gewijzigd' | 'verwijderd'
  veld_naam: string | null
  oude_waarde: string | null
  nieuwe_waarde: string | null
  record_snapshot: Record<string, unknown> | null
}

export interface DashboardStats {
  totaal_relaties: number
  totaal_particulier: number
  totaal_zakelijk: number
  totaal_polissen: number
  totaal_pakketten: number
  imports_vandaag: number
  nieuwe_records_week: number
  gewijzigde_records_week: number
}

export interface MutatiesPerDag {
  datum: string
  tabel_naam: string
  nieuw: number
  gewijzigd: number
  verwijderd: number
}

export interface PolissenPerBranche {
  hoofdbranche: string
  aantal: number
  totaal_premie: number
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      relaties: {
        Row: Relatie
        Insert: Omit<Relatie, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Relatie, 'id'>>
      }
      pakketten: {
        Row: Pakket
        Insert: Omit<Pakket, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Pakket, 'id'>>
      }
      polissen: {
        Row: Polis
        Insert: Omit<Polis, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Polis, 'id'>>
      }
      polis_dekkingen: {
        Row: PolisDekking
        Insert: Omit<PolisDekking, 'id' | 'created_at'>
        Update: Partial<Omit<PolisDekking, 'id'>>
      }
      sync_log: {
        Row: SyncLog
        Insert: Omit<SyncLog, 'id' | 'sync_datum'>
        Update: Partial<Omit<SyncLog, 'id'>>
      }
      sync_wijzigingen: {
        Row: SyncWijziging
        Insert: Omit<SyncWijziging, 'id' | 'sync_datum'>
        Update: Partial<Omit<SyncWijziging, 'id'>>
      }
    }
    Views: {
      relaties_overview: {
        Row: RelatieOverview
      }
      polissen_overview: {
        Row: PolisOverview
      }
      dashboard_stats: {
        Row: DashboardStats
      }
      mutaties_per_dag: {
        Row: MutatiesPerDag
      }
      polissen_per_branche: {
        Row: PolissenPerBranche
      }
    }
    Functions: {
      search_relaties: {
        Args: { search_term: string; filter_type?: string }
        Returns: RelatieOverview[]
      }
      search_polissen: {
        Args: { search_term: string }
        Returns: PolisOverview[]
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      can_upload: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
  }
}
