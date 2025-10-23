import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getSocket } from '../../../utils/socket'
import { toast } from 'react-hot-toast'
import { hkCleaningService } from '../../../services/hkCleaningService'

const Schedule = ({ darkMode }) => {
  const [items, setItems] = useState([])
  const [staffName, setStaffName] = useState('')
  const [creatingId, setCreatingId] = useState(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(false)
  const [shift, setShift] = useState('ALL') // ALL | MORNING | AFTERNOON | EVENING
  const [roomStatus, setRoomStatus] = useState('ALL') // ALL | clean | needs-cleaning | occupied | maintenance | available
  const [taskStatus, setTaskStatus] = useState('ALL') // ALL | NEW | ASSIGNED | IN_PROGRESS | DONE | QA_CHECK | CLOSED | CANCELLED | NONE

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { date }
      if (shift && shift !== 'ALL') params.shift = shift
      const res = await hkCleaningService.getSchedule(params)
      setItems(res.data || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load schedule')
    } finally { setLoading(false) }
  }, [date, shift])

  useEffect(() => { load() }, [load])

  // Live updates when room status changes
  useEffect(() => {
    const socket = getSocket()
    const handler = () => load()
    socket.on('hk:room:status', handler)
    return () => { socket.off('hk:room:status', handler) }
  }, [load])

  const markComplete = async (roomId, taskId) => {
    try {
      await hkCleaningService.finishCleaning({ roomId, taskId: taskId || undefined, outcome: 'CLEAN' })
      toast.success('Marked clean')
      await load()
    } catch (e) { console.error(e); toast.error('Failed to mark clean') }
  }

  const filteredItems = useMemo(() => {
    const inShift = (ts) => {
      if (shift === 'ALL') return true
      if (!ts) return false
      const d = new Date(ts)
      const m = d.getHours() * 60 + d.getMinutes()
      const WIN = {
        MORNING: [6*60, 12*60],
        AFTERNOON: [12*60, 18*60],
        EVENING: [18*60, 24*60-1],
      }
      const [s, e] = WIN[shift] || [0, 24*60-1]
      return m >= s && m <= e
    }
    return items.filter(it => {
      if (roomStatus !== 'ALL' && String(it.status) !== roomStatus) return false
      const tStat = it.taskStatus || 'NONE'
      if (taskStatus !== 'ALL' && tStat !== taskStatus) return false
      if (!inShift(it.checkoutTime)) return false
      return true
    })
  }, [items, roomStatus, taskStatus, shift])

  const createCleaningTask = async (room) => {
    try {
      setCreatingId(room.roomId || room.id)
      // Backward compat: use hkTaskService if present
      const { hkTaskService } = await import('../../../services/hkTaskService')
      await hkTaskService.create({
        title: `Clean Room #${room.roomNumber || room.roomId || room.id}`,
        roomId: Number(room.roomId || room.id),
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
        <div className={`p-4 flex items-center gap-3 flex-wrap ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} />
          <select value={shift} onChange={e=>setShift(e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="ALL">All Shifts</option>
            <option value="MORNING">Morning (06:00-12:00)</option>
            <option value="AFTERNOON">Afternoon (12:00-18:00)</option>
            <option value="EVENING">Evening (18:00-24:00)</option>
          </select>
          <select value={roomStatus} onChange={e=>setRoomStatus(e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="ALL">All Room Statuses</option>
            <option value="clean">clean</option>
            <option value="needs-cleaning">needs-cleaning</option>
            <option value="occupied">occupied</option>
            <option value="maintenance">maintenance</option>
            <option value="available">available</option>
          </select>
          <select value={taskStatus} onChange={e=>setTaskStatus(e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
            <option value="ALL">All Task Statuses</option>
            <option value="NONE">None</option>
            <option value="NEW">NEW</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="QA_CHECK">QA_CHECK</option>
            <option value="DONE">DONE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <input value={staffName} onChange={e=>setStaffName(e.target.value)} placeholder="Assign staff (optional)" className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} />
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>New cleaning tasks will assign to this staff if provided</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Housekeeper</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Checkout Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-6">Loading...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="4" className={`px-6 py-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No rooms require cleaning for selected date.</td></tr>
              ) : filteredItems.map((it) => (
                <tr key={it.roomId} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 font-semibold">#{it.roomNumber}</td>
                  <td className="px-6 py-4">{it.housekeeper || '-'}</td>
                  <td className="px-6 py-4">{it.checkoutTime ? new Date(it.checkoutTime).toLocaleTimeString() : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => createCleaningTask(it)} disabled={creatingId===(it.roomId)} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-xl ${creatingId===it.roomId ? 'opacity-70 cursor-wait' : ''}`}>{creatingId===it.roomId ? 'Creating...' : 'Create Task'}</button>
                      <button onClick={() => markComplete(it.roomId, it.taskId)} className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Mark Clean</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Schedule
