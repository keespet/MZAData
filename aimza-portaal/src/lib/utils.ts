import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (Dutch format)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-'
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format a date string to Dutch format (dd-mm-yyyy)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Format a datetime string to Dutch format
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

/**
 * Parse Dutch date format (3-nov-64) to ISO date string
 * Years 00-30 become 2000+, 31-99 become 1900+
 */
export function parseDutchDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === '') return null

  const months: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mrt': '03', 'apr': '04',
    'mei': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'okt': '10', 'nov': '11', 'dec': '12',
  }

  // Try format: 3-nov-64
  const match = dateStr.match(/^(\d{1,2})-([a-z]{3})-(\d{2})$/i)
  if (match) {
    const day = match[1].padStart(2, '0')
    const month = months[match[2].toLowerCase()]
    let year = parseInt(match[3], 10)

    // Convert 2-digit year: 00-30 = 2000+, 31-99 = 1900+
    if (year <= 30) {
      year += 2000
    } else {
      year += 1900
    }

    if (month) {
      return `${year}-${month}-${day}`
    }
  }

  // Try format: 17 maart 2025
  const longMatch = dateStr.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i)
  if (longMatch) {
    const day = longMatch[1].padStart(2, '0')
    const monthName = longMatch[2].toLowerCase()
    const year = longMatch[3]

    const longMonths: Record<string, string> = {
      'januari': '01', 'februari': '02', 'maart': '03', 'april': '04',
      'mei': '05', 'juni': '06', 'juli': '07', 'augustus': '08',
      'september': '09', 'oktober': '10', 'november': '11', 'december': '12',
    }

    const month = longMonths[monthName]
    if (month) {
      return `${year}-${month}-${day}`
    }
  }

  // Try ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  return null
}

/**
 * Parse Dutch decimal number (842,23) to number
 */
export function parseDutchDecimal(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null

  // Replace comma with dot and remove thousand separators
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)

  return isNaN(num) ? null : num
}

/**
 * Parse decimal number (412.80) to number
 */
export function parseDecimal(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null

  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

/**
 * Parse integer
 */
export function parseInteger(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null

  const num = parseInt(value, 10)
  return isNaN(num) ? null : num
}

/**
 * Build full name from parts
 */
export function buildFullName(
  voorletters: string | null | undefined,
  voorvoegsels: string | null | undefined,
  achternaam: string | null | undefined
): string {
  const parts = [voorletters, voorvoegsels, achternaam].filter(Boolean)
  return parts.join(' ') || '-'
}

/**
 * Build full address
 */
export function buildFullAddress(
  adres: string | null | undefined,
  huisnummer: string | null | undefined,
  huisnummer_toevoeging: string | null | undefined,
  postcode: string | null | undefined,
  woonplaats: string | null | undefined
): string {
  const street = [adres, huisnummer, huisnummer_toevoeging].filter(Boolean).join(' ')
  const city = [postcode, woonplaats].filter(Boolean).join(' ')
  return [street, city].filter(Boolean).join(', ') || '-'
}

/**
 * Get branche color class
 */
export function getBrancheColor(hoofdbranche: string | null | undefined): string {
  if (!hoofdbranche) return 'bg-gray-100 text-gray-800'

  const branche = hoofdbranche.toLowerCase()

  if (branche.includes('motor') || branche.includes('auto')) {
    return 'bg-blue-100 text-blue-800'
  }
  if (branche.includes('brand') || branche.includes('opstal') || branche.includes('woning')) {
    return 'bg-orange-100 text-orange-800'
  }
  if (branche.includes('aansprakelijk') || branche.includes('avp') || branche.includes('avb')) {
    return 'bg-purple-100 text-purple-800'
  }
  if (branche.includes('leven') || branche.includes('uitvaart') || branche.includes('overlijden')) {
    return 'bg-green-100 text-green-800'
  }
  if (branche.includes('reis') || branche.includes('annulering')) {
    return 'bg-cyan-100 text-cyan-800'
  }
  if (branche.includes('recht') || branche.includes('juridisch')) {
    return 'bg-pink-100 text-pink-800'
  }

  return 'bg-gray-100 text-gray-800'
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
