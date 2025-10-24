import React , { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { housekeeperService } from '../../../services/housekeeperService'
import { Plus, Users, RefreshCw, Camera, Edit, Trash2 } from 'lucide-react'
import { roomService } from '../../../services/roomService'
import { API_BASE_URL } from '../../../utils/api'

const Staff = ({ darkMode }) => {
  const [housekeepers, setHousekeepers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    shift: 'MORNING',
    contact: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [housekeepersRes, roomsRes] = await Promise.all([
        housekeeperService.list(),
        roomService.getStatusMap({})
      ])
      setHousekeepers(housekeepersRes?.data || [])
      setRooms(roomsRes?.data || [])
    } catch (e) { console.error(e); toast.error('Failed to load housekeepers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setCreateForm({ name: '', shift: 'MORNING', contact: '' })
    setShowCreate(true)
  }

  const openEdit = (housekeeper) => {
    setCreateForm({
      name: housekeeper.name,
      shift: housekeeper.shift || 'MORNING',
      contact: housekeeper.contact || ''
    })
    setEditingId(housekeeper.id)
    setShowCreate(true)
  }

  const submitCreate = async (e) => {
    e?.preventDefault?.()
    try {
      if (!createForm.name) {
        toast.error('Name is required')
        return
      }
      setCreating(true)
      
      if (editingId) {
        await housekeeperService.update(editingId, createForm)
        toast.success('Housekeeper updated')
      } else {
        await housekeeperService.create(createForm)
        toast.success('Housekeeper created')
      }
      
      setShowCreate(false)
      setEditingId(null)
      setCreateForm({ name: '', shift: 'MORNING', contact: '' })
      await load()
    } catch (e) { console.error(e); toast.error(e?.message || 'Failed to save housekeeper') }
    finally { setCreating(false) }
  }

  const handlePhotoUpload = async (housekeeperId, file) => {
    if (!file) return
    setUploadingPhoto(housekeeperId)
    try {
      await housekeeperService.uploadPhoto(housekeeperId, file)
      toast.success('Photo uploaded')
      await load()
    } catch (e) { console.error(e); toast.error('Failed to upload photo') }
    finally { setUploadingPhoto(null) }
  }

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAssignedRooms = (housekeeperId) => {
    return rooms.filter(room => room.assignedHousekeeperId === housekeeperId)
  }

  const getRoomStatusCounts = (housekeeperId) => {
    const assignedRooms = getAssignedRooms(housekeeperId)
    const counts = { clean: 0, 'needs-cleaning': 0, occupied: 0, maintenance: 0 }
    assignedRooms.forEach(room => {
      if (counts.hasOwnProperty(room.status)) {
        counts[room.status]++
      }
    })
    return counts
  }

  const assignRoomToHousekeeper = async (housekeeperId, roomId) => {
    try {
      // Attempt to call a sensible room-service method; fall back to update if available.
      if (roomService.assignToHousekeeper) {
        await roomService.assignToHousekeeper(roomId, housekeeperId)
      } else if (roomService.update) {
        await roomService.update(roomId, { assignedHousekeeperId: housekeeperId })
      } else {
        console.warn('No room assignment method available on roomService')
      }
      toast.success('Room assigned')
      await load()
    } catch (e) { console.error(e); toast.error('Failed to assign room') }
  }

  const deleteHousekeeper = async (housekeeperId) => {
    if (!window.confirm('Are you sure you want to delete this housekeeper? This action cannot be undone.')) return
    try {
      await housekeeperService.remove(housekeeperId)
      toast.success('Housekeeper deleted successfully')
      await load()
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete housekeeper')
    }
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
          <button onClick={openCreate} className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}>
            <Plus className="w-4 h-4" />
            <span>Add Housekeeper</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading housekeepers...</div>
      ) : housekeepers.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="text-6xl mb-4">👥</div>
          <div className="text-xl font-semibold mb-2">No housekeepers found</div>
          <div className="text-sm">Add your first housekeeper to get started</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {housekeepers.map(housekeeper => (
            <div key={housekeeper.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {housekeeper.profilePictureUrl ? (
                      <img
                        src={`${API_BASE_URL}/${housekeeper.profilePictureUrl}`}
                        alt={housekeeper.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(housekeeper.name)}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(housekeeper.id, e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingPhoto === housekeeper.id}
                    />
                    {uploadingPhoto === housekeeper.id && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{housekeeper.name}</h4>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{housekeeper.shift || 'MORNING'}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(housekeeper)}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteHousekeeper(housekeeper.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-red-700 hover:bg-red-600 text-red-200' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {housekeeper.contact && (
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  📞 {housekeeper.contact}
                </div>
              )}

              <div className="space-y-2">
                {(() => {
                  const assignedRooms = getAssignedRooms(housekeeper.id)
                  const statusCounts = getRoomStatusCounts(housekeeper.id)
                  return (
                    <>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="font-medium">Assigned Rooms:</span> {assignedRooms.length}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="font-medium">Status Counts:</span> 
                        <div className="mt-1 flex flex-wrap gap-2">
                          {statusCounts.clean > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Clean: {statusCounts.clean}
                            </span>
                          )}
                          {statusCounts['needs-cleaning'] > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Needs Cleaning: {statusCounts['needs-cleaning']}
                            </span>
                          )}
                          {statusCounts.occupied > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Occupied: {statusCounts.occupied}
                            </span>
                          )}
                          {statusCounts.maintenance > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Maintenance: {statusCounts.maintenance}
                            </span>
                          )}
                          {assignedRooms.length === 0 && (
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              No rooms assigned
                            </span>
                          )}
                        </div>
                      </div>
                      {assignedRooms.length > 0 && (
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <span className="font-medium">Rooms:</span> 
                          <div className="mt-1 flex flex-wrap gap-1">
                            {assignedRooms.slice(0, 5).map(room => (
                              <span key={room.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                #{room.roomNumber}
                              </span>
                            ))}
                            {assignedRooms.length > 5 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                +{assignedRooms.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              <div className="mt-4 flex gap-2">
                <label className={`flex-1 cursor-pointer ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(housekeeper.id, e.target.files[0])}
                    disabled={uploadingPhoto === housekeeper.id}
                  />
                  <Camera className="w-4 h-4" />
                  {uploadingPhoto === housekeeper.id ? 'Uploading...' : 'Upload Photo'}
                </label>
                <button className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2`} onClick={() => openEdit(housekeeper)}>
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-lg rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Housekeeper' : 'Add Housekeeper'}
            </h3>
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
                <input 
                  required 
                  value={createForm.name} 
                  onChange={e=>setCreateForm(f=>({ ...f, name: e.target.value }))} 
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`} 
                  placeholder="Enter housekeeper name" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Shift</label>
                <select
                  value={createForm.shift}
                  onChange={e=>setCreateForm(f=>({ ...f, shift: e.target.value }))}
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
                >
                  <option value="MORNING">Morning (06:00-12:00)</option>
                  <option value="AFTERNOON">Afternoon (12:00-18:00)</option>
                  <option value="EVENING">Evening (18:00-24:00)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Contact</label>
                <input 
                  value={createForm.contact} 
                  onChange={e=>setCreateForm(f=>({ ...f, contact: e.target.value }))} 
                  className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`} 
                  placeholder="Phone number or email" 
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={()=>{
                    setShowCreate(false)
                    setEditingId(null)
                    setCreateForm({ name: '', shift: 'MORNING', contact: '' })
                  }}
                  className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating} 
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} ${creating ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {creating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Staff
