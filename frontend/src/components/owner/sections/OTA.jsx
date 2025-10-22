import React, { useCallback, useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || `HTTP ${res.status}`)
  return res.json()
}

const providers = [
  { value: 'mock', label: 'Mock' },
  { value: 'booking_com', label: 'Booking.com' },
  { value: 'agoda', label: 'Agoda' }
]

export default function OTA() {
  const [provider, setProvider] = useState('mock')
  const [since, setSince] = useState(new Date(Date.now() - 7*24*3600*1000).toISOString())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 20

  const canCall = Boolean(API_BASE)

  const loadLogs = useCallback(async (p) => {
    setLoading(true)
    setMessage('')
    try {
      const data = await api(`/api/ota/logs?page=${p}&pageSize=${pageSize}`)
      setLogs(data.items || [])
      setPage(p)
    } catch (e) { setMessage(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (canCall) loadLogs(1) }, [canCall, loadLogs])

  async function doSync() {
    setLoading(true)
    setMessage('')
    try {
      const res = await api('/api/ota/sync', { method: 'POST', body: { provider, entities: { rooms: true, rates: true, images: true, videos: true } } })
      setMessage(`Sync: ${res?.result?.status || 'ok'}`)
      loadLogs(1)
    } catch (e) { setMessage(e.message) }
    finally { setLoading(false) }
  }

  async function doImport() {
    setLoading(true)
    setMessage('')
    try {
      const encSince = encodeURIComponent(since)
      const res = await api(`/api/ota/bookings?provider=${provider}&since=${encSince}`)
      setMessage(`Imported: ${res?.imported || 0}`)
      loadLogs(1)
    } catch (e) { setMessage(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">OTA Integration</h2>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-sm mb-1">Provider</label>
          <select value={provider} onChange={e => setProvider(e.target.value)} className="border rounded px-3 py-2">
            {providers.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Import since (ISO)</label>
          <input value={since} onChange={e => setSince(e.target.value)} className="border rounded px-3 py-2 w-[340px]" />
        </div>
        <button disabled={loading} onClick={doSync} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Sync Now</button>
        <button disabled={loading} onClick={doImport} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">Import Bookings</button>
        <button disabled={loading} onClick={() => loadLogs(1)} className="px-4 py-2 rounded bg-gray-200">Refresh Logs</button>
      </div>
      {message && <div className="mb-4 text-sm text-blue-700 bg-blue-50 p-2 rounded">{message}</div>}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Provider</th>
              <th className="text-left p-2">Direction</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Message</th>
              <th className="text-left p-2">Job</th>
              <th className="text-left p-2">Duration</th>
            </tr>
          </thead>
          <tbody>
            {(logs || []).map((l) => (
              <tr key={`${l.id}`} className="border-t">
                <td className="p-2 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-2">{l.provider}</td>
                <td className="p-2">{l.direction}</td>
                <td className="p-2 capitalize">{l.status}</td>
                <td className="p-2 max-w-[280px] truncate" title={l.message || ''}>{l.message}</td>
                <td className="p-2">{l.jobId || '-'}</td>
                <td className="p-2">{typeof l.durationMs === 'number' ? `${l.durationMs}ms` : '-'}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr><td className="p-3 text-center text-gray-500" colSpan={7}>No logs yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-2">
        <button disabled={loading || page<=1} onClick={() => loadLogs(page-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <span className="text-sm text-gray-600">Page {page}</span>
        <button disabled={loading || (logs?.length||0) < pageSize} onClick={() => loadLogs(page+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}
