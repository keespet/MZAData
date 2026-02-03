import Papa from 'papaparse'
import { RELATIE_PARTICULIER_KOLOM_MAPPING } from '@/lib/types/csv'
import { parseDutchDate, parseDutchDecimal, parseInteger } from '@/lib/utils'
import type { Relatie } from '@/lib/types/database'

interface RawRow {
  [key: string]: string
}

const NUMBER_FIELDS = ['aantal_kinderen', 'aantal_polissen']
const DECIMAL_FIELDS = ['incassoprovisie_totaal']
const DATE_FIELDS = ['geboortedatum']

export function parseRelatiesParticulierCsv(
  csvContent: string
): { relaties: Partial<Relatie>[]; errors: string[] } {
  const errors: string[] = []

  // Parse CSV with semicolon delimiter (COBOL export format)
  const result = Papa.parse<RawRow>(csvContent, {
    header: true,
    delimiter: ';',
    quoteChar: '"',
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
      relatie_type: 'particulier',
    }

    // Map columns
    for (const [csvCol, dbCol] of Object.entries(RELATIE_PARTICULIER_KOLOM_MAPPING)) {
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

    // Deduplicate - keep first occurrence (or could merge data)
    if (!relatiesMap.has(id)) {
      relatiesMap.set(id, mappedRow as Partial<Relatie>)
    }
  }

  return {
    relaties: Array.from(relatiesMap.values()),
    errors,
  }
}

export function compareRelaties(
  existing: Relatie[],
  incoming: Partial<Relatie>[]
): {
  nieuw: Partial<Relatie>[]
  gewijzigd: { relatie: Partial<Relatie>; changes: { field: string; old: unknown; new: unknown }[] }[]
  verwijderd: Relatie[]
  ongewijzigd: Partial<Relatie>[]
} {
  const existingMap = new Map(existing.map((r) => [r.id, r]))
  const incomingMap = new Map(incoming.map((r) => [r.id!, r]))

  const nieuw: Partial<Relatie>[] = []
  const gewijzigd: { relatie: Partial<Relatie>; changes: { field: string; old: unknown; new: unknown }[] }[] = []
  const ongewijzigd: Partial<Relatie>[] = []

  // Check incoming against existing
  for (const [id, incomingRelatie] of incomingMap) {
    const existingRelatie = existingMap.get(id)

    if (!existingRelatie) {
      nieuw.push(incomingRelatie)
    } else {
      // Compare fields
      const changes: { field: string; old: unknown; new: unknown }[] = []

      for (const [key, newValue] of Object.entries(incomingRelatie)) {
        if (key === 'created_at' || key === 'updated_at') continue

        const oldValue = existingRelatie[key as keyof Relatie]

        // Compare values (handle null vs empty string)
        const normalizedOld = oldValue === '' ? null : oldValue
        const normalizedNew = newValue === '' ? null : newValue

        if (normalizedOld !== normalizedNew) {
          changes.push({ field: key, old: normalizedOld, new: normalizedNew })
        }
      }

      if (changes.length > 0) {
        gewijzigd.push({ relatie: incomingRelatie, changes })
      } else {
        ongewijzigd.push(incomingRelatie)
      }
    }
  }

  // Find deleted (existing but not in incoming)
  const verwijderd = existing.filter((r) => !incomingMap.has(r.id))

  return { nieuw, gewijzigd, verwijderd, ongewijzigd }
}
