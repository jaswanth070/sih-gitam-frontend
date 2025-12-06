import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { FabricationDetails, RequestData } from './requests-service'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a human-friendly request title when notes are absent.
export function formatRequestTitle(r: RequestData): string {
  const desc = (r.description || '').trim()
  if (desc) return desc
  const notes = (r.notes || '').trim()
  if (notes) return notes
  if (r.category === 'FABRICATION') {
    const fab = summarizeFabrication(r.fabrication)
    if (fab) {
      if (fab.secondary) return `${fab.base} • ${fab.secondary}`
      return fab.baseLabel
    }
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

export function summarizeFabrication(fabrication?: FabricationDetails | null) {
  if (!fabrication) return null

  const customOrName = (fabrication.custom_type || fabrication.name || '').trim()
  const baseLabel = fabrication.fab_type === 'OTHER'
    ? customOrName || 'Other'
    : fabrication.fab_type
  const secondary = fabrication.fab_type === 'OTHER' ? '' : customOrName
  const filename = (fabrication.original_filename || '').trim()
    || (fabrication.file ? fabrication.file.split('/').pop() || '' : '')
  const fileUrl = fabrication.file_url ?? fabrication.file ?? null

  return {
    base: baseLabel,
    baseLabel,
    secondary,
    customLabel: customOrName,
    filename,
    fileSize: fabrication.file_size ?? null,
    mimeType: fabrication.file_mime_type ?? null,
    uploadedAt: fabrication.uploaded_at ?? null,
    fileUrl,
    storagePath: fabrication.storage_path ?? null,
  }
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return ''
  if (bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const formatted = unitIndex === 0 ? size.toString() : size.toFixed(1)
  return `${formatted.replace(/\.0$/,'')} ${units[unitIndex]}`
}
