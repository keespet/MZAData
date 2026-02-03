import Papa from 'papaparse'
import {
  RELATIE_PARTICULIER_KOLOM_MAPPING,
  RELATIE_ZAKELIJK_KOLOM_MAPPING,
  POLIS_KOLOM_MAPPING,
} from '@/lib/types/csv'

// Date parsing for client-side
const DUTCH_MONTHS: Record<string, string> = {
  'jan': '01', 'feb': '02', 'mrt': '03', 'apr': '04',
  'mei': '05', 'jun': '06', 'jul': '07', 'aug': '08',
  'sep': '09', 'okt': '10', 'nov': '11', 'dec': '12',
}

function parseDutchDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === '') return null

  const parts = dateStr.toLowerCase().trim().split('-')
  if (parts.length !== 3) return null

  const [day, monthStr, yearStr] = parts
  const month = DUTCH_MONTHS[monthStr]
  if (!month) return null

  let year = parseInt(yearStr, 10)
  if (yearStr.length === 2) {
    year = year <= 30 ? 2000 + year : 1900 + year
  }

  const paddedDay = day.padStart(2, '0')
  return `${year}-${month}-${paddedDay}`
}

function parseDutchDecimal(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseInteger(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null
  const num = parseInt(value.replace(/\D/g, ''), 10)
  return isNaN(num) ? null : num
}

// Field type definitions
const PARTICULIER_DATE_FIELDS = ['geboortedatum']
const PARTICULIER_NUMBER_FIELDS = ['aantal_kinderen', 'aantal_polissen']
const PARTICULIER_DECIMAL_FIELDS = ['incassoprovisie_totaal']

const ZAKELIJK_NUMBER_FIELDS = ['aantal_polissen', 'aantal_medewerkers', 'aantal_oproepkrachten', 'aantal_personenautos', 'aantal_bestelautos', 'aantal_vrachtautos', 'aantal_werkmaterieel']
const ZAKELIJK_DECIMAL_FIELDS = ['omzet', 'jaarloon', 'brutowinst']

const POLIS_DATE_FIELDS = ['ingangsdatum', 'wijzigingsdatum', 'premievervaldatum']
const POLIS_NUMBER_FIELDS = ['termijn']
const POLIS_DECIMAL_FIELDS = ['pakket_korting', 'dekking_premie_netto', 'dekking_provisie', 'dekking_incassobedrag', 'verzekerd_bedrag', 'dekking_verzekerd_bedrag', 'cataloguswaarde', 'dagwaarde', 'eigen_risico']

export interface ParseProgress {
  phase: 'reading' | 'parsing' | 'done'
  progress: number
  recordsProcessed: number
  totalRecords: number
}

export interface ParseResult<T> {
  records: T[]
  errors: string[]
}

type VariantType = 'particulier' | 'zakelijk' | 'polissen'

function getMapping(variant: VariantType) {
  switch (variant) {
    case 'particulier':
      return RELATIE_PARTICULIER_KOLOM_MAPPING
    case 'zakelijk':
      return RELATIE_ZAKELIJK_KOLOM_MAPPING
    case 'polissen':
      return POLIS_KOLOM_MAPPING
  }
}

function getDelimiter(variant: VariantType) {
  return variant === 'polissen' ? ',' : ';'
}

function transformValue(
  variant: VariantType,
  dbCol: string,
  value: string | null
): string | number | null {
  if (value === null || value === '') return null

  if (variant === 'particulier') {
    if (PARTICULIER_DATE_FIELDS.includes(dbCol)) return parseDutchDate(value)
    if (PARTICULIER_NUMBER_FIELDS.includes(dbCol)) return parseInteger(value)
    if (PARTICULIER_DECIMAL_FIELDS.includes(dbCol)) return parseDutchDecimal(value)
  } else if (variant === 'zakelijk') {
    if (ZAKELIJK_NUMBER_FIELDS.includes(dbCol)) return parseInteger(value)
    if (ZAKELIJK_DECIMAL_FIELDS.includes(dbCol)) return parseDutchDecimal(value)
  } else if (variant === 'polissen') {
    if (POLIS_DATE_FIELDS.includes(dbCol)) return parseDutchDate(value)
    if (POLIS_NUMBER_FIELDS.includes(dbCol)) return parseInteger(value)
    if (POLIS_DECIMAL_FIELDS.includes(dbCol)) return parseDutchDecimal(value)
  }

  return value
}

export function parseCSVFile(
  file: File,
  variant: VariantType,
  onProgress?: (progress: ParseProgress) => void
): Promise<ParseResult<Record<string, unknown>>> {
  return new Promise((resolve) => {
    const records: Record<string, unknown>[] = []
    const errors: string[] = []
    const mapping = getMapping(variant)
    const delimiter = getDelimiter(variant)
    const seenIds = new Set<string>()

    let rowCount = 0
    let totalRows = 0

    // Estimate total rows from file size (rough estimate: ~200 bytes per row)
    totalRows = Math.ceil(file.size / 200)

    onProgress?.({
      phase: 'reading',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: totalRows,
    })

    Papa.parse(file, {
      header: true,
      delimiter,
      quoteChar: '"',
      skipEmptyLines: true,
      encoding: 'ISO-8859-1',
      transformHeader: (header) => header.trim(),
      step: (results, parser) => {
        rowCount++
        const row = results.data as Record<string, string>
        const mappedRow: Record<string, unknown> = {}

        // Map columns
        for (const [csvCol, dbCol] of Object.entries(mapping)) {
          let value = row[csvCol]?.trim() || null

          // Remove trailing semicolons (common in some exports)
          if (value && value.endsWith(';')) {
            value = value.slice(0, -1).trim()
          }

          mappedRow[dbCol] = transformValue(variant, dbCol, value)
        }

        // Get ID field
        const idField = variant === 'polissen' ? 'polisnummer' : 'id'
        const id = mappedRow[idField] as string

        // Skip rows without ID and deduplicate
        if (id && !seenIds.has(id)) {
          seenIds.add(id)
          records.push(mappedRow)
        }

        // Update progress every 500 rows
        if (rowCount % 500 === 0) {
          onProgress?.({
            phase: 'parsing',
            progress: Math.min((rowCount / totalRows) * 100, 99),
            recordsProcessed: records.length,
            totalRecords: totalRows,
          })
        }
      },
      complete: () => {
        onProgress?.({
          phase: 'done',
          progress: 100,
          recordsProcessed: records.length,
          totalRecords: records.length,
        })

        resolve({ records, errors })
      },
      error: (error) => {
        errors.push(`CSV parse error: ${error.message}`)
        resolve({ records, errors })
      },
    })
  })
}

// Special parser for polissen that groups into polissen, dekkingen, pakketten
export interface PolissenParseResult {
  polissen: Record<string, unknown>[]
  dekkingen: Record<string, unknown>[]
  pakketten: Record<string, unknown>[]
  errors: string[]
}

// Helper to detect delimiter by checking first line
async function detectDelimiter(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const firstLine = content.split('\n')[0] || ''
      // Count occurrences of each delimiter (outside of quotes)
      const semicolons = (firstLine.match(/;/g) || []).length
      const commas = (firstLine.match(/,/g) || []).length
      console.log('[delimiter-detect] First line preview:', firstLine.slice(0, 200))
      console.log('[delimiter-detect] Semicolons:', semicolons, 'Commas:', commas)
      // Use the more common one
      const delimiter = semicolons > commas ? ';' : ','
      resolve(delimiter)
    }
    // Only read first 4KB to detect delimiter
    reader.readAsText(file.slice(0, 4096), 'ISO-8859-1')
  })
}

export async function parsePolissenCSV(
  file: File,
  onProgress?: (progress: ParseProgress) => void
): Promise<PolissenParseResult> {
  console.log('[polissen-parser] Starting parse, file size:', file.size)

  // Auto-detect delimiter first
  let delimiter: string
  try {
    delimiter = await detectDelimiter(file)
    console.log('[polissen-parser] Detected delimiter:', delimiter === ';' ? 'semicolon' : 'comma')
  } catch (e) {
    console.error('[polissen-parser] Delimiter detection failed:', e)
    delimiter = ','
  }

  return new Promise((resolve) => {
    const polissenMap = new Map<string, Record<string, unknown>>()
    const pakkettenMap = new Map<string, Record<string, unknown>>()
    const dekkingen: Record<string, unknown>[] = []
    const errors: string[] = []
    const mapping = POLIS_KOLOM_MAPPING

    let rowCount = 0
    let totalRows = Math.ceil(file.size / 200)

    onProgress?.({
      phase: 'reading',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: totalRows,
    })

    // Build a reverse lookup that finds original column names even with _1, _2 suffixes
    let headerLookup: Map<string, string> | null = null

    Papa.parse(file, {
      header: true,
      delimiter,
      quoteChar: '"',
      skipEmptyLines: true,
      encoding: 'ISO-8859-1',
      transformHeader: (header) => header.trim(),
      step: (results) => {
        rowCount++
        const row = results.data as Record<string, string>

        // On first row, build header lookup that maps our expected names to actual column names
        if (!headerLookup) {
          headerLookup = new Map()
          const actualHeaders = Object.keys(row)

          for (const expectedCol of Object.keys(mapping)) {
            // Find exact match or match with _N suffix
            const match = actualHeaders.find(h =>
              h === expectedCol || h.startsWith(expectedCol + '_')
            )
            if (match) {
              headerLookup.set(expectedCol, match)
            }
          }

          console.log('[polissen-parser] Header lookup built:', Object.fromEntries(headerLookup))
        }

        const mappedRow: Record<string, unknown> = {}

        // Map columns using the header lookup
        for (const [csvCol, dbCol] of Object.entries(mapping)) {
          const actualCol = headerLookup.get(csvCol) || csvCol
          let value = row[actualCol]?.trim() || null
          if (value && value.endsWith(';')) {
            value = value.slice(0, -1).trim()
          }
          mappedRow[dbCol] = transformValue('polissen', dbCol, value)
        }

        const relatieId = mappedRow.relatie_id as string
        const polisnummer = mappedRow.polisnummer as string
        const volgnummer = mappedRow.volgnummer as string

        // Debug first few rows
        if (rowCount <= 3) {
          console.log(`[polissen-parser] Row ${rowCount} mapped:`, { relatieId, polisnummer, volgnummer })
        }

        if (!relatieId || !polisnummer) return

        // Create unique polis ID
        const polisId = `${relatieId}-${polisnummer}`

        // Extract polis data (first occurrence)
        if (!polissenMap.has(polisId)) {
          polissenMap.set(polisId, {
            id: polisId,
            relatie_id: relatieId,
            polisnummer,
            maatschappij_code: mappedRow.maatschappij_code,
            maatschappij: mappedRow.maatschappij,
            soort_polis: mappedRow.soort_polis,
            hoofdbranche: mappedRow.hoofdbranche,
            branche: mappedRow.branche,
            ingangsdatum: mappedRow.ingangsdatum,
            wijzigingsdatum: mappedRow.wijzigingsdatum,
            wijzigingsreden_code: mappedRow.wijzigingsreden_code,
            wijzigingsreden: mappedRow.wijzigingsreden,
            premievervaldatum: mappedRow.premievervaldatum,
            termijn: mappedRow.termijn,
            incassowijze: mappedRow.incassowijze,
            iban_polis: mappedRow.iban_polis,
            risico_adres: mappedRow.risico_adres,
            risico_huisnummer: mappedRow.risico_huisnummer,
            risico_huisnummer_toev: mappedRow.risico_huisnummer_toev,
            risico_postcode: mappedRow.risico_postcode,
            risico_plaats: mappedRow.risico_plaats,
            verzekerd_bedrag: mappedRow.verzekerd_bedrag,
            kenteken: mappedRow.kenteken,
            merk: mappedRow.merk,
            model: mappedRow.model,
            cataloguswaarde: mappedRow.cataloguswaarde,
            dagwaarde: mappedRow.dagwaarde,
            gezinssamenstelling: mappedRow.gezinssamenstelling,
            dekkingsgebied: mappedRow.dekkingsgebied,
            eigen_risico: mappedRow.eigen_risico,
          })
        }

        // Extract pakket data
        const pakketId = mappedRow.pakket_id as string
        if (pakketId && !pakkettenMap.has(pakketId)) {
          pakkettenMap.set(pakketId, {
            id: pakketId,
            pakketsoort: mappedRow.pakketsoort,
            korting_percentage: mappedRow.pakket_korting,
            incassowijze: mappedRow.pakket_incassowijze,
            iban: mappedRow.pakket_iban,
          })
        }

        // Extract dekking data
        if (mappedRow.dekking_naam || mappedRow.dekking_premie_netto) {
          dekkingen.push({
            polis_id: polisId,
            volgnummer: volgnummer || '1',
            dekking_naam: mappedRow.dekking_naam,
            premie_netto: mappedRow.dekking_premie_netto,
            provisie: mappedRow.dekking_provisie,
            incassobedrag: mappedRow.dekking_incassobedrag,
            verzekerd_bedrag: mappedRow.dekking_verzekerd_bedrag,
            voorwaarde_1: mappedRow.voorwaarde_1,
            voorwaarde_2: mappedRow.voorwaarde_2,
            voorwaarde_3: mappedRow.voorwaarde_3,
            voorwaarde_5: mappedRow.voorwaarde_5,
            voorwaarde_6: mappedRow.voorwaarde_6,
            voorwaarde_7: mappedRow.voorwaarde_7,
            voorwaarde_8: mappedRow.voorwaarde_8,
          })
        }

        // Update progress
        if (rowCount % 500 === 0) {
          onProgress?.({
            phase: 'parsing',
            progress: Math.min((rowCount / totalRows) * 100, 99),
            recordsProcessed: rowCount,
            totalRecords: totalRows,
          })
        }
      },
      complete: () => {
        const polissen = Array.from(polissenMap.values())
        const pakketten = Array.from(pakkettenMap.values())

        console.log('[polissen-parser] Parse complete:', {
          rowsProcessed: rowCount,
          polissen: polissen.length,
          dekkingen: dekkingen.length,
          pakketten: pakketten.length,
        })

        onProgress?.({
          phase: 'done',
          progress: 100,
          recordsProcessed: polissen.length,
          totalRecords: polissen.length,
        })

        resolve({ polissen, dekkingen, pakketten, errors })
      },
      error: (error) => {
        console.error('[polissen-parser] Parse error:', error)
        errors.push(`CSV parse error: ${error.message}`)
        resolve({ polissen: [], dekkingen: [], pakketten: [], errors })
      },
    })
  })
}
