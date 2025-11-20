import { type ClassValue, clsx } from 'clsx'

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format price in EUR (Germany)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Calculate discount percentage
export function calculateDiscount(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

// Generate slug for German text (umlauts → ae/oe/ue, ß → ss)
export function slugify(text: string): string {
  const map: Record<string, string> = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss'
  }

  return text
    .toLowerCase()
    .replace(/[äöüß]/g, char => map[char])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate German phone number
export function isValidPhone(phone: string): boolean {
  // Accept formats:
  // +49 1523 1234567
  // 01523 1234567
  // +4915231234567
  const regex = /^(\+49|0)[1-9][0-9\s\-]{6,}$/
  return regex.test(phone)
}

// Format German phone
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('49')) {
    return `+49 ${cleaned.slice(2)}`
  }

  if (cleaned.startsWith('0')) {
    return `+49 ${cleaned.slice(1)}`
  }

  return phone
}

// Debounce helper
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate unique order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `ORD-${timestamp}-${random}`.toUpperCase()
}

// German pluralization
// Example: pluralizeDe(3, "Stück", "Stücke")
export function pluralizeDe(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}
