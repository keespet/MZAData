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

  // Debug: log parsed data info
  console.log('CSV parse result:', {
    rowCount: result.data.length,
    headers: result.data[0] ? Object.keys(result.data[0]) : [],
    sampleRow: result.data[0] ? JSON.stringify(result.data[0]).slice(0, 500) : 'N/A',
  })

  // Check which expected columns are missing
  if (result.data[0]) {
    const csvHeaders = Object.keys(result.data[0])
    const expectedHeaders = Object.keys(RELATIE_ZAKELIJK_KOLOM_MAPPING)
    const missingHeaders = expectedHeaders.filter(h => !csvHeaders.includes(h))
    const extraHeaders = csvHeaders.filter(h => !expectedHeaders.includes(h))
    console.log('Column matching:', {
      expectedCount: expectedHeaders.length,
      foundCount: csvHeaders.length,
      missingFromCsv: missingHeaders,
      extraInCsv: extraHeaders,
    })

    // Specific check for Relatienummer
    console.log('ID column check:', {
      hasRelatienummerHeader: csvHeaders.includes('Relatie->Relatienummer'),
      firstRowRelatienummer: result.data[0]['Relatie->Relatienummer'],
      first3Rows: result.data.slice(0, 3).map(r => ({
        relatienummer: r['Relatie->Relatienummer'],
        achternaam: r['Relatie->Achternaam'],
      })),
    })
  }

  // Map columns and deduplicate
  const relatiesMap = new Map<string, Partial<Relatie>>()
  let skippedNoId = 0

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
      skippedNoId++
      continue
    }

    // Deduplicate - keep first occurrence
    if (!relatiesMap.has(id)) {
      relatiesMap.set(id, mappedRow as Partial<Relatie>)
    }
  }

  console.log('Parse result:', {
    totalRows: result.data.length,
    skippedNoId,
    uniqueRelaties: relatiesMap.size,
  })

  return {
    relaties: Array.from(relatiesMap.values()),
    errors,
  }
}
