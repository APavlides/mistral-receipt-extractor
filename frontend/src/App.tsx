import { useEffect, useState } from 'react'
import ReceiptView, { type Receipt } from './ReceiptView'

function App() {
  const [backend, setBackend] = useState('checking...')
  const [file, setFile] = useState<File | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setBackend(data.status))
      .catch(() => setBackend('unreachable'))
  }, [])

  async function extract() {
    if (!file) return
    setLoading(true)
    setError(null)
    setReceipt(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/extract', { method: 'POST', body })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(typeof data?.detail === 'string' ? data.detail : `HTTP ${res.status}`)
      }
      setReceipt(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Receipt extractor</h1>
      <p className="status">Backend: {backend}</p>
      <div className="upload">
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button onClick={extract} disabled={!file || loading}>
          {loading ? 'Extracting…' : 'Extract'}
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!receipt && !error && !loading && <p>Upload a receipt image to extract its details.</p>}
      {receipt && <ReceiptView receipt={receipt} onChange={setReceipt} />}
    </main>
  )
}

export default App
