import React, { useEffect, useMemo, useState } from 'react'
import { hkTaskService } from '../../../services/hkTaskService'
import { toast } from 'react-hot-toast'
import { getSocket } from '../../../utils/socket'

const Dashboard = ({ darkMode, setActiveTab }) => {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await hkTaskService.list({ limit: 500, sortBy: 'createdAt', sortDir: 'desc' })
        if (!mounted) return
        setTasks(res?.data || [])
      } catch (e) { console.error(e); toast.error('Failed to load KPIs') }
      finally { setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Live updates via WebSocket
  useEffect(() => {
    const socket = getSocket()
    const handler = () => {
      // re-fetch KPIs on any hk task event
      hkTaskService.list({ limit: 500, sortBy: 'createdAt', sortDir: 'desc' })
        .then(res => setTasks(res?.data || []))
        .catch(e => { console.error(e) })
    }
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
  const kpis = useMemo(() => {
    const now = new Date()
    const byStatus = {}
    const byPriority = {}
    let overdue = 0
    for (const t of tasks) {
      const s = String(t.status || 'UNKNOWN')
      const p = String(t.priority || 'MEDIUM')
      byStatus[s] = (byStatus[s] || 0) + 1
      byPriority[p] = (byPriority[p] || 0) + 1
      if (t.dueAt && !['DONE','CLOSED','CANCELLED'].includes(s) && new Date(t.dueAt) < now) overdue++
    }
    return { byStatus, byPriority, overdue, total: tasks.length }
  }, [tasks])

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Total Tasks</div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loading ? '...' : kpis.total}</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>In Progress</div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loading ? '...' : (kpis.byStatus['IN_PROGRESS'] || 0)}</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Due/Overdue</div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{loading ? '...' : kpis.overdue}</div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5`}>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>High/Urgent</div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loading ? '...' : ((kpis.byPriority['HIGH'] || 0) + (kpis.byPriority['URGENT'] || 0))}</div>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-6 shadow-xl`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setActiveTab('rooms')} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">
            View All Rooms
          </button>
          <button className={`${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-6 py-3 rounded-xl font-medium transition-all`}>
            Mark Multiple Clean
          </button>
          <button className={`${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-6 py-3 rounded-xl font-medium transition-all`}>
            Report Issue
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
