import React, { useEffect, useState } from 'react'
import { roomService } from '../../../services/roomService'
import { hkTaskService } from '../../../services/hkTaskService'
import { getSocket } from '../../../utils/socket'
import { toast } from 'react-hot-toast'

const Schedule = ({ darkMode }) => {
  const [rooms, setRooms] = useState([])
  const [staffName, setStaffName] = useState('')
  const [creatingId, setCreatingId] = useState(null)

  const load = async () => {
    const res = await roomService.getStatusMap({ status: 'needs-cleaning' })
    setRooms(res.data || [])
  }

  useEffect(() => { load() }, [])

  // Live updates when room status changes
  useEffect(() => {
    const socket = getSocket()
    const handler = () => load()
    socket.on('hk:room:status', handler)
    return () => { socket.off('hk:room:status', handler) }
  }, [])

  const markComplete = async (id) => {
    await roomService.updateStatus(id, 'clean')
    await load()
  }

  const createCleaningTask = async (room) => {
    try {
      setCreatingId(room.id)
      await hkTaskService.create({
        title: `Clean Room #${room.roomNumber || room.id}`,
        roomId: Number(room.id),
        type: 'cleaning',
        priority: 'MEDIUM',
        assignedTo: staffName || undefined
      })
      toast.success('Cleaning task created')
    } catch (e) {
      console.error(e)
      toast.error('Failed to create task')
    } finally {
      setCreatingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cleaning Schedule</h2>
      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl overflow-hidden shadow-xl`}>
        <div className={`p-4 flex items-center gap-3 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
          <input value={staffName} onChange={e=>setStaffName(e.target.value)} placeholder="Assign staff (optional)" className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} />
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>New cleaning tasks will assign to this staff if provided</span>
        </div>
        {rooms.length === 0 && (
          <div className={`p-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No rooms need cleaning.</div>
        )}
        {rooms.map((room, i) => (
          <div key={room.id} className={`p-6 ${i>0 ? (darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200') : ''} ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room {room.roomNumber || room.id}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => createCleaningTask(room)} disabled={creatingId===room.id} className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} ${creatingId===room.id ? 'opacity-70 cursor-wait' : ''}`}>{creatingId===room.id ? 'Creating...' : 'Create Task'}</button>
                <button onClick={() => markComplete(room.id)} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Schedule
