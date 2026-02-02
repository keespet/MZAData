import Papa from 'papaparse'
import { RELATIE_ZAKELIJK_KOLOM_MAPPING } from '@/lib/types/csv'
import { parseDutchDate, parseDutchDecimal, parseInteger } from '@/lib/utils'
import type { Relatie } from '@/lib/types/database'

interface RawRow {
  [key: string]: string
}

const NUMBER_FIELDS = [
  'aantal_polissen',
  'naverrekening_jaar_huidig',
  'naverrekening_jaar_laatste',
  'aantal_medewerkers',
  'aantal_oproepkrachten',
  'aantal_personenautos',
  'aantal_bestelautos',
  'aantal_vrachtautos',
  'aantal_werkmaterieel',
]

const DECIMAL_FIELDS = ['omzet', 'jaarloon', 'brutowinst']

const DATE_FIELDS = ['volgende_bezoekdatum']

export function parseRelatiesZakelijkCsv(
  csvContent: string
): { relaties: Partial<Relatie>[]; errors: string[] } {
  const errors: string[] = []

  // Parse CSV with tab delimiter
  const result = Papa.parse<RawRow>(csvContent, {
    header: true,
    delimiter: '\t',
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (result.errors.length > 0) {
    result.errors.forEach((err) => {
      errors.push(`CSV parse error at row ${err.row}: ${err.message}`)
    })
  }

  // Map columns and deduplicate
  const relatiesMap = new Map<string, Partial<Relatie>>()

  for (const row of result.data) {
    const mappedRow: Record<string, string | number | null> = {
      relatie_type: 'zakelijk',
    }

    // Map columns
    for (const [csvCol, dbCol] of Object.entries(RELATIE_ZAKELIJK_KOLOM_MAPPING)) {
      const value = row[csvCol]?.trim() || null

      if (value === null || value === '') {
        mappedRow[dbCol] = null
        continue
      }

      // Parse special fields
      if (DATE_FIELDS.includes(dbCol)) {
        mappedRow[dbCol] = parseDutchDate(value)
      } else if (NUMBER_FIELDS.includes(dbCol)) {
        mappedRow[dbCol] = parseInteger(value)
      } else if (DECIMAL_FIELDS.includes(dbCol)) {
        mappedRow[dbCol] = parseDutchDecimal(value)
      } else {
        mappedRow[dbCol] = value
      }
    }

    // Skip rows without ID
    const id = mappedRow.id as string
    if (!id) {
      continue
    }

    // Deduplicate - keep first occurrence
    if (!relatiesMap.has(id)) {
      relatiesMap.set(id, mappedRow as Partial<Relatie>)
    }
  }

  return {
    relaties: Array.from(relatiesMap.values()),
    errors,
  }
}
