import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Tunisian Dinar (TND) currency.
 * Uses English locale for clarity: "TND 99.000"
 * TND is a 3-decimal currency (1 TND = 1000 millimes).
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)
}
