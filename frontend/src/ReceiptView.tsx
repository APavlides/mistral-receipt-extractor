import { downloadCsv } from './csv'

export type LineItem = {
  description: string
  quantity: number | null
  amount: number | null
}

export type Receipt = {
  vendor: string | null
  date: string | null
  total: number | null
  line_items: LineItem[]
}

// Empty number input means null
const toNumber = (value: string) => (value === '' ? null : Number(value))

type Props = {
  receipt: Receipt
  onChange: (receipt: Receipt) => void
}

function ReceiptView({ receipt, onChange }: Props) {
  // Empty input means null, so the shape matches what the backend sends
  const update = (field: 'vendor' | 'date', value: string) =>
    onChange({ ...receipt, [field]: value || null })

  // Copy the array so React sees a new value
  const updateItem = (i: number, patch: Partial<LineItem>) =>
    onChange({
      ...receipt,
      line_items: receipt.line_items.map((item, j) => (j === i ? { ...item, ...patch } : item)),
    })

  return (
    <section>
      <div className="fields">
        <label>
          Vendor: <input value={receipt.vendor ?? ''} onChange={(e) => update('vendor', e.target.value)} />
        </label>
        <label>
          Date:{' '}
          <input type="date" value={receipt.date ?? ''} onChange={(e) => update('date', e.target.value)} />
        </label>
        <label>
          Total:{' '}
          <input
            type="number"
            step="0.01"
            value={receipt.total ?? ''}
            onChange={(e) => onChange({ ...receipt, total: toNumber(e.target.value) })}
          />
        </label>
      </div>
      {receipt.line_items.length === 0 ? (
        <p>No line items found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="num">Qty</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {receipt.line_items.map((item, i) => (
              <tr key={i}>
                <td>
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    value={item.quantity ?? ''}
                    onChange={(e) => updateItem(i, { quantity: toNumber(e.target.value) })}
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount ?? ''}
                    onChange={(e) => updateItem(i, { amount: toNumber(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div>
        <button onClick={() => downloadCsv(receipt)}>Export CSV</button>
      </div>
    </section>
  )
}

export default ReceiptView
