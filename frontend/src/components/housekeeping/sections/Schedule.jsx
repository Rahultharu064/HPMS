import React, { useEffect, useState } from 'react'
import { roomService } from '../../../services/roomService'

const Schedule = ({ darkMode }) => {
  const [rooms, setRooms] = useState([])

  const load = async () => {
    const res = await roomService.getStatusMap({ status: 'needs-cleaning' })
    setRooms(res.data || [])
  }

  useEffect(() => { load() }, [])

  const markComplete = async (id) => {
    await roomService.updateStatus(id, 'clean')
    await load()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cleaning Schedule</h2>
      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl overflow-hidden shadow-xl`}>
        {rooms.length === 0 && (
          <div className={`p-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No rooms need cleaning.</div>
        )}
        {rooms.map((room, i) => (
          <div key={room.id} className={`p-6 ${i>0 ? (darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200') : ''} ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room {room.roomNumber || room.id}</h3>
              </div>
              <button onClick={() => markComplete(room.id)} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                Mark Complete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Schedule
