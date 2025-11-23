import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RequestData } from './requests-service'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a human-friendly request title when notes are absent.
export function formatRequestTitle(r: RequestData): string {
  const desc = (r.description || '').trim()
  if (desc) return desc
  const notes = (r.notes || '').trim()
  if (notes) return notes
  if (r.category === 'FABRICATION' && r.fabrication?.name) {
    return `${r.fabrication.fab_type} • ${r.fabrication.name}`
  }
  if (r.category === 'BOM' && r.bom_items?.length) {
    const shown = r.bom_items.slice(0, 2).map(i => i.item_name).join(', ')
    const extra = r.bom_items.length > 2 ? ` (+${r.bom_items.length - 2} more)` : ''
    return `BOM: ${shown}${extra}`
  }
  if (r.category === 'ADDITIONAL' && r.additional_items?.length) {
    const shown = r.additional_items.slice(0, 2).map(i => i.item_name).join(', ')
    const extra = r.additional_items.length > 2 ? ` (+${r.additional_items.length - 2} more)` : ''
    return `Additional: ${shown}${extra}`
  }
  return `${r.category} #${r.id}`
}
