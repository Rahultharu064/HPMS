import React, { useEffect, useMemo, useState } from 'react'

import { toast } from 'react-hot-toast'
import { getSocket } from '../../../utils/socket'
import { hkTaskService } from '../../../services/hkTaskService'
import { Plus, Users, RefreshCw, User, Settings } from 'lucide-react'
import { roomService } from '../../../services/roomService'
import HousekeeperManagement from './HousekeeperManagement'

const Staff = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks' or 'housekeepers'
  const [tasks, setTasks] = useState([])
  const [, setLoading] = useState(true)
  const [staffName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    roomId: '',
    title: '',
    type: 'cleaning',
    priority: 'MEDIUM',
    assignedTo: ''
  })
  const [rooms, setRooms] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const res = await hkTaskService.list({ limit: 200 })
      const data = res?.data || []
      // show active tasks only
      const active = data.filter(t => !['DONE','CLOSED','CANCELLED'].includes(String(t.status)))
      setTasks(active)
    } catch (e) { console.error(e); toast.error('Failed to load tasks') }
    finally { setLoading(false) }
  }

  const getStatusBadgeColor = (status) => {
    switch(String(status)) {
      case 'clean': return 'bg-green-100 text-green-700 border-green-300'
      case 'needs-cleaning': return 'bg-rose-100 text-rose-700 border-rose-300'
      case 'occupied': return 'bg-indigo-100 text-indigo-700 border-indigo-300'
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'available': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await roomService.getStatusMap({})
        setRooms(res.data || [])
      } catch (e) { console.error(e) }
    }
    fetchRooms()
  }, [])

  // Live updates: refresh when tasks change elsewhere
  useEffect(() => {
    const socket = getSocket()
    const handler = () => load()
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
  }, [])

  const staffGroups = useMemo(() => {
    const map = new Map()
    for (const t of tasks) {
      const key = (t.assignedTo || '').trim()
      if (!key) continue
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    }
    return Array.from(map.entries()).map(([name, list]) => ({ name, list }))
  }, [tasks])

  const openCreate = (assignedTo = '') => {
    setCreateForm(f => ({ ...f, assignedTo: assignedTo || staffName || '' }))
    setShowCreate(true)
  }

  const submitCreate = async (e) => {
    e?.preventDefault?.()
    try {
      if (!createForm.roomId || !createForm.title) {
        toast.error('Room and Title are required')
        return
      }
      setCreating(true)
      await hkTaskService.create({
        roomId: Number(createForm.roomId),
        title: String(createForm.title),
        type: String(createForm.type || 'cleaning'),
        priority: String(createForm.priority || 'MEDIUM'),
        assignedTo: createForm.assignedTo ? String(createForm.assignedTo) : undefined
      })
      toast.success('Task created')
      setShowCreate(false)
      setCreateForm({ roomId: '', title: '', type: 'cleaning', priority: 'MEDIUM', assignedTo: createForm.assignedTo || '' })
      await load()
    } catch (e) { console.error(e); toast.error(e?.message || 'Failed to create task') }
    finally { setCreating(false) }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white'} border rounded-2xl p-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Staff Management</h2>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Manage housekeeping staff and task assignments</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Refresh" className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'} px-3 py-2 rounded-xl flex items-center gap-2`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeTab === 'tasks' && (
            <button onClick={() => openCreate('')} className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}>
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-1`}>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'tasks'
                ? darkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white'
                : darkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Task Assignment</span>
          </button>
          <button
            onClick={() => setActiveTab('housekeepers')}
            className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'housekeepers'
                ? darkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white'
                : darkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Housekeeper Profiles</span>
          </button>
        </div>
      </div>

      {activeTab === 'housekeepers' ? (
        <HousekeeperManagement darkMode={darkMode} />
      ) : (
        <>

      {staffGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {staffGroups.map(group => {
            const rooms = new Map()
            group.list.forEach(t => {
              const rId = t.room?.id ?? t.roomId
              const rNum = t.room?.roomNumber ?? t.roomId
              const rStatus = t.room?.status ?? '-'
              if (!rooms.has(rId)) rooms.set(rId, { roomNumber: rNum, status: rStatus })
            })
            const list = Array.from(rooms.values())
            return (
              <div key={`card-${group.name}`} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {group.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{group.name}</h4>
                      <div className="text-xs opacity-70">{list.length} room(s) • {group.list.length} task(s)</div>
                    </div>
                  </div>
                  <div>
                    <button onClick={() => openCreate(group.name)} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1 rounded-xl flex items-center gap-2`}>
                      <Plus className="w-4 h-4" />
                      <span>Create Task</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.length === 0 ? (
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No rooms</span>
                  ) : list.map(r => (
                    <span key={`${group.name}-${r.roomNumber}`} className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusBadgeColor(r.status)}`}>
                      #{r.roomNumber} • {String(r.status).replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-lg rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-xl font-semibold mb-4">Create Task</h3>
            <form onSubmit={submitCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Room <span className="text-red-500">*</span></label>
                  <select required value={createForm.roomId} onChange={e=>setCreateForm(f=>({ ...f, roomId: e.target.value }))} className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}>
                    <option value="">Select a room</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>#{r.roomNumber} ({r.status})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Assigned To</label>
                  <input value={createForm.assignedTo} onChange={e=>setCreateForm(f=>({ ...f, assignedTo: e.target.value }))} className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`} placeholder="Optional" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Task Title <span className="text-red-500">*</span></label>
                  <input required value={createForm.title} onChange={e=>setCreateForm(f=>({ ...f, title: e.target.value }))} className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`} placeholder="e.g. Deep clean bathroom, restock linens" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Task Type</label>
                  <select value={createForm.type} onChange={e=>setCreateForm(f=>({ ...f, type: e.target.value }))} className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}>
                    <option value="cleaning">cleaning</option>
                    <option value="maintenance">maintenance</option>
                    <option value="inspection">inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Priority</label>
                  <select value={createForm.priority} onChange={e=>setCreateForm(f=>({ ...f, priority: e.target.value }))} className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setShowCreate(false)} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}>Cancel</button>
                <button type="submit" disabled={creating} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${creating ? 'opacity-70 cursor-wait' : ''}`}>{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}

export default Staff
