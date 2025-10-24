import React, { useEffect, useMemo, useState, useRef } from 'react'

import { toast } from 'react-hot-toast'
import { getSocket } from '../../../utils/socket'
import { hkTaskService } from '../../../services/hkTaskService'
import { Plus, Users, RefreshCw, Camera, Edit, Trash2 } from 'lucide-react'
import { roomService } from '../../../services/roomService'
import { hkHousekeeperService } from '../../../services/hkHousekeeperService'
import { buildMediaUrl } from '../../../utils/api'

const Staff = ({ darkMode }) => {
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
  
  // Housekeeper management
  const [housekeepers, setHousekeepers] = useState([])
  const [showHKModal, setShowHKModal] = useState(false)
  const [hkForm, setHkForm] = useState({ id: null, name: '', role: '', contact: '' })
  const [savingHK, setSavingHK] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState({})
  const photoInputRefs = useRef({})

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

  const loadHousekeepers = async () => {
    try {
      const res = await hkHousekeeperService.list()
      setHousekeepers(res?.data || [])
    } catch (e) { console.error(e); toast.error('Failed to load housekeepers') }
  }

  const handlePhotoClick = (id) => {
    photoInputRefs.current[id]?.click()
  }

  const handlePhotoUpload = async (id, file) => {
    if (!file) return
    try {
      setUploadingPhoto(prev => ({ ...prev, [id]: true }))
      await hkHousekeeperService.uploadPhoto(id, file)
      toast.success('Photo uploaded successfully')
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error(e.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleDeletePhoto = async (id) => {
    if (!confirm('Delete this photo?')) return
    try {
      await hkHousekeeperService.deletePhoto(id)
      toast.success('Photo deleted')
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete photo')
    }
  }

  const openHKModal = (hk = null) => {
    if (hk) {
      setHkForm({ id: hk.id, name: hk.name || '', role: hk.role || '', contact: hk.contact || '' })
    } else {
      setHkForm({ id: null, name: '', role: '', contact: '' })
    }
    setShowHKModal(true)
  }

  const saveHousekeeper = async (e) => {
    e?.preventDefault?.()
    if (!hkForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    try {
      setSavingHK(true)
      if (hkForm.id) {
        await hkHousekeeperService.update(hkForm.id, { name: hkForm.name, role: hkForm.role, contact: hkForm.contact })
        toast.success('Housekeeper updated')
      } else {
        await hkHousekeeperService.create({ name: hkForm.name, role: hkForm.role, contact: hkForm.contact })
        toast.success('Housekeeper created')
      }
      setShowHKModal(false)
      await loadHousekeepers()
    } catch (e) {
      console.error(e)
      toast.error('Failed to save housekeeper')
    } finally {
      setSavingHK(false)
    }
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

  useEffect(() => { 
    load()
    loadHousekeepers()
  }, [])

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
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Staff Assignment</h2>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Assign and manage housekeeping tasks</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Refresh" className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'} px-3 py-2 rounded-xl flex items-center gap-2`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => openCreate('')} className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}>
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Housekeepers Section */}
      <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white'} border rounded-2xl p-6 shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Housekeepers</h3>
          <button onClick={() => openHKModal()} className={`px-3 py-2 rounded-xl flex items-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            <Plus className="w-4 h-4" />
            <span>Add Housekeeper</span>
          </button>
        </div>
        
        {housekeepers.length === 0 ? (
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No housekeepers added yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {housekeepers.map(hk => (
              <div key={hk.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                <div className="flex flex-col items-center">
                  <div className="relative mb-3">
                    {hk.profilePictureUrl ? (
                      <img src={buildMediaUrl(hk.profilePictureUrl)} alt={hk.name} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                        {hk.name.slice(0,2).toUpperCase()}
                      </div>
                    )}
                    <button 
                      onClick={() => handlePhotoClick(hk.id)}
                      disabled={uploadingPhoto[hk.id]}
                      className={`absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white shadow-lg disabled:opacity-50`}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input 
                      ref={el => photoInputRefs.current[hk.id] = el}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && handlePhotoUpload(hk.id, e.target.files[0])}
                    />
                  </div>
                  <h4 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} text-center mb-1`}>{hk.name}</h4>
                  {hk.role && <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mb-1`}>{hk.role}</p>}
                  {hk.contact && <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mb-3`}>{hk.contact}</p>}
                  
                  <div className="flex items-center gap-2 w-full justify-center">
                    <button onClick={() => openHKModal(hk)} className={`flex-1 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                      <Edit className="w-3.5 h-3.5" />
                      <span className="text-xs">Edit</span>
                    </button>
                    {hk.profilePictureUrl && (
                      <button onClick={() => handleDeletePhoto(hk.id)} className={`px-2 py-1.5 rounded-lg ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {showHKModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-lg rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-xl font-semibold mb-4">{hkForm.id ? 'Edit Housekeeper' : 'Add Housekeeper'}</h3>
            <form onSubmit={saveHousekeeper} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
                <input required value={hkForm.name} onChange={e=>setHkForm(f=>({ ...f, name: e.target.value }))} className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm mb-1">Role</label>
                <input value={hkForm.role} onChange={e=>setHkForm(f=>({ ...f, role: e.target.value }))} className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`} placeholder="e.g. Senior Housekeeper" />
              </div>
              <div>
                <label className="block text-sm mb-1">Contact</label>
                <input value={hkForm.contact} onChange={e=>setHkForm(f=>({ ...f, contact: e.target.value }))} className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`} placeholder="Phone or email" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setShowHKModal(false)} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}>Cancel</button>
                <button type="submit" disabled={savingHK} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${savingHK ? 'opacity-70 cursor-wait' : ''}`}>{savingHK ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Staff
