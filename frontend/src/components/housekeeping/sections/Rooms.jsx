import React, { useState, useEffect } from 'react'
import { Plus, Loader2, PlayCircle, StopCircle, Clock3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { roomService } from '../../../services/roomService'
import { allowedStatuses } from '../../../constants/roomStatus'
import { toast } from 'react-hot-toast'
import { getSocket } from '../../../utils/socket'
import { hkCleaningService } from '../../../services/hkCleaningService'

const Rooms = ({ darkMode }) => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterFloor, setFilterFloor] = useState('all')
  const [pendingStatus, setPendingStatus] = useState({})
  const [inProgress, setInProgress] = useState({}) // roomId -> activeLogId
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = {}
        if (filterStatus !== 'all') params.status = filterStatus
        if (filterFloor !== 'all') params.floor = String(filterFloor)
        const res = await roomService.getStatusMap(params)
        if (mounted) {
          const list = res.data || []
          setRooms(list)
          // capture in-progress map
          const map = {}
          for (const r of list) {
            if (r.cleaningInProgress && r.activeLogId) map[r.id] = r.activeLogId
          }
          setInProgress(map)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [filterStatus, filterFloor])

  // Live updates: listen for room status changes
  useEffect(() => {
    const socket = getSocket()
    const handler = (payload) => {
      const room = payload?.room
      if (!room) return
      // refresh list with current filters
      const params = {}
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterFloor !== 'all') params.floor = String(filterFloor)
      roomService.getStatusMap(params)
        .then(res => {
          const list = res.data || []
          setRooms(list)
          const map = {}
          for (const r of list) {
            if (r.cleaningInProgress && r.activeLogId) map[r.id] = r.activeLogId
          }
          setInProgress(map)
        })
        .catch((e) => console.error(e))
      if (room.status === 'needs-cleaning') {
        toast.success(`Room #${room.roomNumber} marked Needs Cleaning`)
      }
    }
    socket.on('hk:room:status', handler)
    // also refresh on cleaning events
    const refresh = () => {
      const params = {}
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterFloor !== 'all') params.floor = String(filterFloor)
      roomService.getStatusMap(params)
        .then(res => {
          const list = res.data || []
          setRooms(list)
          const map = {}
          for (const r of list) {
            if (r.cleaningInProgress && r.activeLogId) map[r.id] = r.activeLogId
          }
          setInProgress(map)
        })
        .catch((e) => console.error(e))
    }
    socket.on('hk:cleaning:start', refresh)
    socket.on('hk:cleaning:finish', refresh)
    return () => {
      socket.off('hk:room:status', handler)
      socket.off('hk:cleaning:start', refresh)
      socket.off('hk:cleaning:finish', refresh)
    }
  }, [filterStatus, filterFloor])

  const getStatusColor = (status) => {
    switch(status) {
      case 'clean': return 'from-emerald-400 to-green-500'
      case 'needs-cleaning': return 'from-red-400 to-rose-500'
      case 'occupied': return 'from-blue-400 to-indigo-500'
      case 'maintenance': return 'from-orange-400 to-amber-500'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const startCleaning = async (roomId) => {
    try {
      const res = await hkCleaningService.startCleaning({ roomId })
      const logId = res?.log?.id
      setInProgress(prev => ({ ...prev, [roomId]: logId }))
      toast.success('Cleaning started')
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to start cleaning')
    }
  }

  const finishCleaning = async (roomId) => {
    try {
      const logId = inProgress[roomId]
      await hkCleaningService.finishCleaning({ roomId, logId, outcome: 'CLEAN' })
      setInProgress(prev => { const n = { ...prev }; delete n[roomId]; return n })
      toast.success('Cleaning finished')
      // refresh list to get updated status and lastCleanedAt
      const params = {}
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterFloor !== 'all') params.floor = String(filterFloor)
      const res = await roomService.getStatusMap(params)
      const list = res.data || []
      setRooms(list)
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to finish cleaning')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room Status</h2>
        <div className="flex gap-3 items-center">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'} px-4 py-2 border rounded-xl font-medium`}>
            <option value="all">All Rooms</option>
            <option value="clean">Clean</option>
            <option value="needs-cleaning">Needs Cleaning</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-200'} px-4 py-2 border rounded-xl font-medium`}>
            <option value="all">All Floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
          </select>
          <button onClick={() => { setFilterStatus('all'); setFilterFloor('all') }} className={`px-4 py-2 rounded-xl border ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Clear</button>
          <button onClick={() => navigate('/owner-admin/create-room')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus size={16}/>Create Room</button>
        </div>
      </div>

      {loading ? (
        <div className={`p-6 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Loading...</div>
      ) : (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border overflow-x-auto`}>
          <table className="min-w-full">
            <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Floor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="4" className={`px-6 py-8 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No rooms found</td>
                </tr>
              ) : rooms.map(room => (
                <tr key={room.id} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{room.roomNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{room.floor ?? '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStatusColor(room.status)} mr-3`}>
                      {room.status.replace('-', ' ')}
                    </span>
                    {inProgress[room.id] ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                        <Clock3 className="w-3 h-3" /> In Progress
                      </span>
                    ) : room.lastCleanedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <Clock3 className="w-3 h-3" /> Last cleaned {new Date(room.lastCleanedAt).toLocaleString()}
                      </span>
                    ) : null}
                    <select
                      value={pendingStatus[room.id] ?? room.status}
                      onChange={(e) => setPendingStatus(ps => ({ ...ps, [room.id]: e.target.value }))}
                      className={`${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-300'} px-3 py-2 rounded-xl border`}
                    >
                      {allowedStatuses.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {inProgress[room.id] ? (
                        <button
                          onClick={() => finishCleaning(room.id)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"
                          title="Finish Cleaning"
                        >
                          <StopCircle className="w-4 h-4" /> Finish
                        </button>
                      ) : (
                        <button
                          onClick={() => startCleaning(room.id)}
                          className="px-3 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1"
                          title="Start Cleaning"
                        >
                          <PlayCircle className="w-4 h-4" /> Start
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          const newStatus = pendingStatus[room.id] ?? room.status
                          try {
                            await roomService.updateStatus(room.id, newStatus)
                            const params = {}
                            if (filterStatus !== 'all') params.status = filterStatus
                            if (filterFloor !== 'all') params.floor = String(filterFloor)
                            const res = await roomService.getStatusMap(params)
                            setRooms(res.data || [])
                            toast.success('Room status updated')
                          } catch (e) { console.error(e); toast.error('Failed to update room status') }
                        }}
                        className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                        title="Update Status"
                      >Update</button>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete this room?')) return
                          try {
                            await roomService.deleteRoom(room.id)
                            const params = {}
                            if (filterStatus !== 'all') params.status = filterStatus
                            if (filterFloor !== 'all') params.floor = String(filterFloor)
                            const res = await roomService.getStatusMap(params)
                            setRooms(res.data || [])
                            toast.success('Room deleted')
                          } catch (e) { console.error(e); toast.error('Failed to delete room') }
                        }}
                        className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-2 rounded-xl`}
                        title="Delete Room"
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Rooms