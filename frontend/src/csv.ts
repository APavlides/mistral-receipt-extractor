import type { Receipt } from './ReceiptView'

const HEADER = ['vendor', 'date', 'total', 'description', 'quantity', 'amount']

// Quote a cell if it contains a comma, quote or newline; double any quotes
function cell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// One row per line item, with vendor/date/total repeated on each
export function toCsv(receipt: Receipt): string {
  const head = [receipt.vendor, receipt.date, receipt.total]
  const items = receipt.line_items.length
    ? receipt.line_items.map((item) => [item.description, item.quantity, item.amount])
    : [[null, null, null]]
  const rows = items.map((item) => [...head, ...item])
  return [HEADER, ...rows].map((row) => row.map(cell).join(',')).join('\n')
}

export function downloadCsv(receipt: Receipt) {
  const url = URL.createObjectURL(new Blob([toCsv(receipt)], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'receipt.csv'
  link.click()
  URL.revokeObjectURL(url)
}
