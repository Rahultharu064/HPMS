import React, { useEffect, useState, useCallback } from 'react'
import { hkTaskService } from '../../../services/hkTaskService'
import { roomService } from '../../../services/roomService'
import { toast } from 'react-hot-toast'
import { getSocket } from '../../../utils/socket'

const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT']
const STATUSES = ['NEW','ASSIGNED','IN_PROGRESS','DONE','QA_CHECK','CLOSED','CANCELLED']

const Tasks = ({ darkMode }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState({ status: 'ALL', q: '', priority: 'ALL', type: 'ALL', from: '', to: '', roomId: '', sortBy: 'createdAt', sortDir: 'desc' })

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', roomId: '', type: 'cleaning', priority: 'MEDIUM', assignedTo: '', description: '', dueAt: '' })
  const [saving, setSaving] = useState(false)
  const [rooms, setRooms] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [uploadingId, setUploadingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [edit, setEdit] = useState({ id: null, title: '', description: '', assignedTo: '', priority: 'MEDIUM', type: 'cleaning', dueAt: '' })

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page: String(p), limit: String(limit) }
      if (filters.status && filters.status !== 'ALL') params.status = filters.status
      // optional: q filter on assignedTo or title
      if (filters.q) params.assignedTo = filters.q
      if (filters.priority && filters.priority !== 'ALL') params.priority = filters.priority
      if (filters.type && filters.type !== 'ALL') params.type = filters.type
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to
      if (filters.roomId) params.roomId = filters.roomId
      if (filters.sortBy) params.sortBy = filters.sortBy
      if (filters.sortDir) params.sortDir = filters.sortDir
      const res = await hkTaskService.list(params)
      const data = res?.data || []
      setTasks(data)
      setTotalPages(res?.totalPages || 1)
      setTotal(res?.total || data.length)
    } catch (e) {
      console.error(e); toast.error('Failed to load tasks')
    } finally { setLoading(false) }
  }, [page, limit, filters])

  useEffect(() => { load(1); setPage(1) }, [filters, load])
  useEffect(() => { load(page) }, [page, load])

  useEffect(() => {
    let mounted = true
    const loadRooms = async () => {
      try {
        const res = await roomService.getStatusMap({})
        if (!mounted) return
        const data = res?.data || []
        setRooms(data.map(r => ({ id: r.id, label: `#${r.roomNumber} (Floor ${r.floor})` })))
      } catch { /* ignore */ }
    }
    loadRooms()
    return () => { mounted = false }
  }, [])

  // Live updates via WebSocket
  useEffect(() => {
    const socket = getSocket()
    const handler = () => load(page)
    socket.on('hk:task:created', handler)
    socket.on('hk:task:updated', handler)
    socket.on('hk:task:deleted', handler)
    socket.on('hk:task:attachments', handler)
    return () => {
      socket.off('hk:task:created', handler)
      socket.off('hk:task:updated', handler)
      socket.off('hk:task:deleted', handler)
      socket.off('hk:task:attachments', handler)
    }
  }, [load, page])

  const createTask = async () => {
    const nextErrors = {}
    if (!form.title) nextErrors.title = 'Title is required'
    if (!form.roomId) nextErrors.roomId = 'Room is required'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    try {
      await hkTaskService.create({
        title: form.title,
        roomId: Number(form.roomId),
        type: form.type,
        priority: form.priority,
        assignedTo: form.assignedTo || undefined,
        description: form.description || undefined,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined
      })
      toast.success('Task created')
      setCreating(false)
      setForm({ title: '', roomId: '', type: 'cleaning', priority: 'MEDIUM', assignedTo: '', description: '', dueAt: '' })
      setErrors({})
      await load(1)
      setPage(1)
    } catch (e) { console.error(e); toast.error('Failed to create task') }
    finally { setSaving(false) }
  }

  const updateStatus = async (task, status) => {
    try {
      await hkTaskService.update(task.id, { status })
      toast.success('Task updated')
      await load(page)
    } catch (e) { console.error(e); toast.error('Failed to update task') }
  }

  const removeTask = async (task) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await hkTaskService.remove(task.id)
      toast.success('Task deleted')
      await load(page)
    } catch (e) { console.error(e); toast.error('Failed to delete task') }
  }

  const openDetail = async (taskId) => {
    try {
      const res = await hkTaskService.get(taskId)
      setDetail(res?.task || res?.data || null)
      setDetailOpen(true)
    } catch (e) { console.error(e); toast.error('Failed to load task') }
  }

  const uploadAttachments = async (taskId, files) => {
    if (!files || files.length === 0) return
    try {
      setUploadingId(taskId)
      await hkTaskService.addAttachments(taskId, Array.from(files))
      toast.success('Attachments uploaded')
      await load(page)
    } catch (e) { console.error(e); toast.error('Failed to upload attachments') }
    finally { setUploadingId(null) }
  }

  const openEdit = (t) => {
    setEdit({ id: t.id, title: t.title, description: t.description || '', assignedTo: t.assignedTo || '', priority: t.priority, type: t.type, dueAt: t.dueAt ? new Date(t.dueAt).toISOString().slice(0,16) : '' })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!edit.id) return
    setEditSaving(true)
    try {
      await hkTaskService.update(edit.id, {
        title: edit.title,
        description: edit.description || null,
        assignedTo: edit.assignedTo || null,
        priority: edit.priority,
        type: edit.type,
        dueAt: edit.dueAt ? new Date(edit.dueAt).toISOString() : null
      })
      toast.success('Task updated')
      setEditOpen(false)
      await load(page)
    } catch (e) { console.error(e); toast.error('Failed to update task') }
    finally { setEditSaving(false) }
  }

  const saveChecklist = async () => {
    if (!detail?.id) return
    let parsed = null
    try {
      parsed = typeof detail.checklist === 'string' ? JSON.parse(detail.checklist) : detail.checklist
    } catch {
      toast.error('Checklist must be valid JSON')
      return
    }
    try {
      await hkTaskService.update(detail.id, { checklist: parsed })
      toast.success('Checklist saved')
      await openDetail(detail.id)
    } catch (e) { console.error(e); toast.error('Failed to save checklist') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Housekeeping Tasks</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <input value={filters.q} onChange={e=>setFilters(f=>({ ...f, q: e.target.value }))} placeholder="Search assigned to" className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} />
          <select value={filters.status} onChange={e=>setFilters(f=>({ ...f, status: e.target.value }))} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <select value={filters.priority} onChange={e=>setFilters(f=>({ ...f, priority: e.target.value }))} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="ALL">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.type} onChange={e=>setFilters(f=>({ ...f, type: e.target.value }))} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="ALL">All Types</option>
            <option value="cleaning">cleaning</option>
            <option value="inspection">inspection</option>
            <option value="other">other</option>
          </select>
          <select value={filters.roomId} onChange={e=>setFilters(f=>({ ...f, roomId: e.target.value }))} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="">All Rooms</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={e=>setFilters(f=>({ ...f, from: e.target.value }))} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} />
          <input type="date" value={filters.to} onChange={e=>setFilters(f=>({ ...f, to: e.target.value }))} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} />
          <select value={filters.sortBy} onChange={e=>setFilters(f=>({ ...f, sortBy: e.target.value }))} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="createdAt">Sort: Created</option>
            <option value="dueAt">Sort: Due</option>
            <option value="priority">Sort: Priority</option>
            <option value="status">Sort: Status</option>
          </select>
          <select value={filters.sortDir} onChange={e=>setFilters(f=>({ ...f, sortDir: e.target.value }))} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <button onClick={()=>setCreating(true)} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Create Task</button>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border overflow-x-auto`}>
        <table className="min-w-full">
          <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Title</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Room</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Priority</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Assigned To</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Due</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Created</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6">Loading...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6">No tasks</td></tr>
            ) : tasks.map(t => {
              const isOverdue = t.dueAt && !['DONE','CLOSED','CANCELLED'].includes(String(t.status)) && new Date(t.dueAt) < new Date()
              return (
              <tr key={t.id} className={isOverdue ? (darkMode ? 'bg-red-900/30' : 'bg-red-50') : ''}>
                <td className="px-4 py-2"><button className={`${darkMode ? 'text-blue-300 hover:underline' : 'text-blue-700 hover:underline'}`} onClick={()=>openDetail(t.id)}>{t.title}</button></td>
                <td className="px-4 py-2">{t.room?.roomNumber ?? t.roomId}</td>
                <td className="px-4 py-2">{t.priority}</td>
                <td className="px-4 py-2">
                  <select value={t.status} onChange={(e)=>updateStatus(t, e.target.value)} className={`${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white'} px-2 py-1 rounded border`}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2">{t.assignedTo || '-'}</td>
                <td className={`px-4 py-2 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>{t.dueAt ? new Date(t.dueAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-2">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <label className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1 rounded cursor-pointer inline-flex items-center gap-2 ${uploadingId===t.id ? 'opacity-60 cursor-wait' : ''}`}>
                      {uploadingId===t.id ? <span className="animate-pulse">Uploading...</span> : 'Attach'}
                      <input type="file" multiple className="hidden" disabled={uploadingId===t.id} onChange={(e)=>{ const files=e.target.files; uploadAttachments(t.id, files); e.target.value=''; }} />
                    </label>
                    <button onClick={()=>openEdit(t)} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1 rounded`}>Edit</button>
                    <button onClick={()=>removeTask(t)} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1 rounded`}>Delete</button>
                  </div>
                </td>
              </tr>)
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm">Page {page} / {totalPages} • {total} tasks</div>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className={`px-3 py-2 rounded ${page===1 ? 'opacity-50 cursor-not-allowed' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Prev</button>
            <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className={`px-3 py-2 rounded ${page===totalPages ? 'opacity-50 cursor-not-allowed' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Next</button>
          </div>
        </div>
      )}

      {detailOpen && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'} w-full max-w-lg rounded-xl p-6`}> 
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Task Detail</h3>
              <button onClick={()=>setDetailOpen(false)} className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>Close</button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-semibold">Title:</span> {detail.title}</div>
              <div><span className="font-semibold">Room:</span> {detail.room?.roomNumber ?? detail.roomId}</div>
              <div><span className="font-semibold">Type:</span> {detail.type}</div>
              <div><span className="font-semibold">Priority:</span> {detail.priority}</div>
              <div><span className="font-semibold">Status:</span> {detail.status}</div>
              {detail.assignedTo && <div><span className="font-semibold">Assigned To:</span> {detail.assignedTo}</div>}
              {detail.description && <div><span className="font-semibold">Description:</span> {detail.description}</div>}
              <div>
                <span className="font-semibold">Checklist:</span>
                <textarea
                  className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-300'} w-full p-2 rounded border mt-1`}
                  rows={5}
                  value={typeof detail.checklist === 'string' ? detail.checklist : JSON.stringify(detail.checklist ?? {}, null, 2)}
                  onChange={(e)=>setDetail(d=>({ ...d, checklist: e.target.value }))}
                />
                <div className="flex justify-end mt-2">
                  <button onClick={saveChecklist} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Save Checklist</button>
                </div>
              </div>
              {Array.isArray(detail.attachments) && detail.attachments.length > 0 && (
                <div>
                  <span className="font-semibold">Attachments:</span>
                  <ul className="list-disc pl-5 mt-1">
                    {detail.attachments.map(a => (
                      <li key={a.id}><a className="text-blue-600 hover:underline" href={a.fileUrl} target="_blank" rel="noreferrer">{a.fileType}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">Created: {new Date(detail.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'} w-full max-w-md rounded-xl p-6`}>
            <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
            <div className="space-y-3">
              <input value={edit.title} onChange={e=>setEdit(v=>({ ...v, title: e.target.value }))} placeholder="Title" className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`} />
              <textarea value={edit.description} onChange={e=>setEdit(v=>({ ...v, description: e.target.value }))} placeholder="Description" className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`} rows={3} />
              <input value={edit.assignedTo} onChange={e=>setEdit(v=>({ ...v, assignedTo: e.target.value }))} placeholder="Assign to" className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`} />
              <select value={edit.priority} onChange={e=>setEdit(v=>({ ...v, priority: e.target.value }))} className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={edit.type} onChange={e=>setEdit(v=>({ ...v, type: e.target.value }))} className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`}>
                <option value="cleaning">cleaning</option>
                <option value="inspection">inspection</option>
                <option value="other">other</option>
              </select>
              <input type="datetime-local" value={edit.dueAt} onChange={e=>setEdit(v=>({ ...v, dueAt: e.target.value }))} className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setEditOpen(false)} className={`${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded`}>Cancel</button>
              <button disabled={editSaving} onClick={saveEdit} className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 ${editSaving ? 'opacity-70 cursor-wait' : ''}`}>{editSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'} w-full max-w-md rounded-xl p-6`}>
            <h3 className="text-lg font-semibold mb-4">Create Task</h3>
            <div className="space-y-3">
              <div>
                <input value={form.title} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} placeholder="Title" className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`} />
                {errors.title && <div className="text-red-500 text-xs mt-1">{errors.title}</div>}
              </div>
              <select value={form.roomId} onChange={e=>setForm(f=>({ ...f, roomId: e.target.value }))} className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`}>
                <option value="">Select Room</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <select value={form.type} onChange={e=>setForm(f=>({ ...f, type: e.target.value }))} className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`}>
                <option value="cleaning">cleaning</option>
                <option value="inspection">inspection</option>
                <option value="other">other</option>
              </select>
              <select value={form.priority} onChange={e=>setForm(f=>({ ...f, priority: e.target.value }))} className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={form.assignedTo} onChange={e=>setForm(f=>({ ...f, assignedTo: e.target.value }))} placeholder="Assign to (optional)" className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`} />
              <input type="datetime-local" value={form.dueAt} onChange={e=>setForm(f=>({ ...f, dueAt: e.target.value }))} className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded border`} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setCreating(false)} className={`${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded`}>Cancel</button>
              <button disabled={saving} onClick={createTask} className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 ${saving ? 'opacity-70 cursor-wait' : ''}`}>{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
