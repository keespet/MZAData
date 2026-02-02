import Papa from 'papaparse'
import { POLIS_KOLOM_MAPPING } from '@/lib/types/csv'
import { parseDutchDate, parseDecimal, parseInteger } from '@/lib/utils'
import type { Polis, PolisDekking, Pakket } from '@/lib/types/database'

interface RawRow {
  [key: string]: string
}

interface ParsedPolisRow {
  [key: string]: string | number | null | undefined
}

interface GroupedPolis {
  rows: ParsedPolisRow[]
}

export function parsePolissenCsv(csvContent: string): {
  polissen: Partial<Polis>[]
  dekkingen: Partial<PolisDekking>[]
  pakketten: Partial<Pakket>[]
  errors: string[]
} {
  const errors: string[] = []

  // Parse CSV with comma delimiter
  const result = Papa.parse<RawRow>(csvContent, {
    header: true,
    delimiter: ',',
    quoteChar: '"',
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (result.errors.length > 0) {
    result.errors.forEach((err) => {
      errors.push(`CSV parse error at row ${err.row}: ${err.message}`)
    })
  }

  // Map columns
  const mappedRows: ParsedPolisRow[] = []

  for (const row of result.data) {
    const mappedRow: ParsedPolisRow = {}

    for (const [csvCol, dbCol] of Object.entries(POLIS_KOLOM_MAPPING)) {
      let value = row[csvCol]?.trim() || null

      // Remove trailing semicolons
      if (value && value.endsWith(';')) {
        value = value.slice(0, -1)
      }

      if (value === null || value === '') {
        mappedRow[dbCol] = null
        continue
      }

      // Parse dates (format: 17 maart 2025)
      if (['ingangsdatum', 'wijzigingsdatum'].includes(dbCol)) {
        mappedRow[dbCol] = parseDutchDate(value)
      }
      // Parse decimals (format: 412.80)
      else if (
        [
          'dekking_premie_netto',
          'dekking_provisie',
          'dekking_incassobedrag',
          'verzekerd_bedrag',
          'dekking_verzekerd_bedrag',
          'eigen_risico',
          'pakket_korting',
          'cataloguswaarde',
          'dagwaarde',
        ].includes(dbCol)
      ) {
        mappedRow[dbCol] = parseDecimal(value)
      }
      // Parse integers
      else if (dbCol === 'termijn') {
        mappedRow[dbCol] = parseInteger(value)
      } else {
        mappedRow[dbCol] = value
      }
    }

    // Skip rows without polisnummer
    if (!mappedRow.polisnummer) {
      continue
    }

    mappedRows.push(mappedRow)
  }

  // Group rows by polis (polisnummer_volgnummer)
  const polisGroups = new Map<string, GroupedPolis>()

  for (const row of mappedRows) {
    const polisId = `${row.polisnummer}_${row.volgnummer || ''}`

    if (!polisGroups.has(polisId)) {
      polisGroups.set(polisId, { rows: [] })
    }
    polisGroups.get(polisId)!.rows.push(row)
  }

  // Process groups into polissen, dekkingen, and pakketten
  const polissen: Partial<Polis>[] = []
  const dekkingen: Partial<PolisDekking>[] = []
  const pakkettenMap = new Map<string, Partial<Pakket>>()

  for (const [polisId, group] of polisGroups) {
    const firstRow = group.rows[0]

    // Build voorwaarden array
    const voorwaarden: string[] = []
    const voorwaardeFields = [
      'voorwaarde_1',
      'voorwaarde_2',
      'voorwaarde_3',
      'voorwaarde_5',
      'voorwaarde_6',
      'voorwaarde_7',
      'voorwaarde_8',
    ]
    for (const field of voorwaardeFields) {
      const value = firstRow[field]
      if (value && typeof value === 'string') {
        voorwaarden.push(value)
      }
    }

    // Build clausules array
    const clausules: { code: string; omschrijving: string }[] = []
    for (let i = 1; i <= 10; i++) {
      const code = firstRow[`clausule_${i}_code`]
      const oms = firstRow[`clausule_${i}_oms`]
      if (code && typeof code === 'string') {
        clausules.push({
          code,
          omschrijving: typeof oms === 'string' ? oms : '',
        })
      }
    }

    // Build details JSON for motorrijtuigen
    const details: Record<string, unknown> = {}
    if (firstRow.kenteken) details.kenteken = firstRow.kenteken
    if (firstRow.merk) details.merk = firstRow.merk
    if (firstRow.model) details.model = firstRow.model
    if (firstRow.cataloguswaarde) details.cataloguswaarde = firstRow.cataloguswaarde
    if (firstRow.dagwaarde) details.dagwaarde = firstRow.dagwaarde
    if (firstRow.gezinssamenstelling) details.gezinssamenstelling = firstRow.gezinssamenstelling
    if (firstRow.dekkingsgebied) details.dekkingsgebied = firstRow.dekkingsgebied

    // Aggregate premies from all dekkingen
    let totaalPremieNetto = 0
    let totaalProvisie = 0
    let totaalIncasso = 0

    for (const row of group.rows) {
      const premieNetto = row.dekking_premie_netto
      const provisie = row.dekking_provisie
      const incasso = row.dekking_incassobedrag

      if (typeof premieNetto === 'number') totaalPremieNetto += premieNetto
      if (typeof provisie === 'number') totaalProvisie += provisie
      if (typeof incasso === 'number') totaalIncasso += incasso

      // Create dekking record
      if (row.dekking_naam) {
        dekkingen.push({
          polis_id: polisId,
          dekking_naam: row.dekking_naam as string,
          premie_netto: typeof premieNetto === 'number' ? premieNetto : null,
          provisie: typeof provisie === 'number' ? provisie : null,
          incassobedrag: typeof incasso === 'number' ? incasso : null,
          verzekerd_bedrag:
            typeof row.dekking_verzekerd_bedrag === 'number'
              ? row.dekking_verzekerd_bedrag
              : null,
        })
      }
    }

    // Extract pakket if present
    const pakketId = firstRow.pakket_id as string | null
    if (pakketId && !pakkettenMap.has(pakketId)) {
      pakkettenMap.set(pakketId, {
        id: pakketId,
        relatie_id: firstRow.relatie_id as string,
        pakketsoort: firstRow.pakketsoort as string | null,
        kortingspercentage:
          typeof firstRow.pakket_korting === 'number'
            ? firstRow.pakket_korting
            : null,
        incassowijze: firstRow.pakket_incassowijze as string | null,
        iban: firstRow.pakket_iban as string | null,
      })
    }

    // Create polis record
    polissen.push({
      id: polisId,
      polisnummer: firstRow.polisnummer as string,
      volgnummer: (firstRow.volgnummer as string) || null,
      relatie_id: firstRow.relatie_id as string,
      pakket_id: pakketId,
      maatschappij_code: firstRow.maatschappij_code as string | null,
      maatschappij: firstRow.maatschappij as string | null,
      soort_polis: firstRow.soort_polis as string | null,
      hoofdbranche: firstRow.hoofdbranche as string | null,
      branche: firstRow.branche as string | null,
      ingangsdatum: firstRow.ingangsdatum as string | null,
      wijzigingsdatum: firstRow.wijzigingsdatum as string | null,
      wijzigingsreden_code: firstRow.wijzigingsreden_code as string | null,
      wijzigingsreden: firstRow.wijzigingsreden as string | null,
      premievervaldatum: firstRow.premievervaldatum as string | null,
      termijn:
        typeof firstRow.termijn === 'number' ? firstRow.termijn : null,
      premie_netto: totaalPremieNetto || null,
      provisie_totaal: totaalProvisie || null,
      premie_incasso: totaalIncasso || null,
      incassowijze: firstRow.incassowijze as string | null,
      iban_polis: firstRow.iban_polis as string | null,
      risico_adres: firstRow.risico_adres as string | null,
      risico_huisnummer: firstRow.risico_huisnummer as string | null,
      risico_huisnummer_toev: firstRow.risico_huisnummer_toev as string | null,
      risico_postcode: firstRow.risico_postcode as string | null,
      risico_plaats: firstRow.risico_plaats as string | null,
      verzekerd_bedrag:
        typeof firstRow.verzekerd_bedrag === 'number'
          ? firstRow.verzekerd_bedrag
          : null,
      eigen_risico:
        typeof firstRow.eigen_risico === 'number'
          ? firstRow.eigen_risico
          : null,
      voorwaarden: voorwaarden as unknown as string[],
      clausules: clausules as unknown as { code: string; omschrijving: string }[],
      details: details as Polis['details'],
    })
  }

  return {
    polissen,
    dekkingen,
    pakketten: Array.from(pakkettenMap.values()),
    errors,
  }
}
