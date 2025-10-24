import React, { useEffect, useState, useMemo } from 'react'
import { hkTaskService } from '../../../services/hkTaskService'
import { hkCleaningService } from '../../../services/hkCleaningService'
import { housekeeperService } from '../../../services/housekeeperService'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
)

const Reports = ({ darkMode }) => {
  const [tasks, setTasks] = useState([])
  const [cleaningLogs, setCleaningLogs] = useState([])
  const [housekeepers, setHousekeepers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [tasksRes, logsRes, hkRes] = await Promise.all([
          hkTaskService.list({}),
          hkCleaningService.list({}),
          housekeeperService.list({})
        ])
        setTasks(tasksRes?.data || [])
        setCleaningLogs(logsRes?.data || [])
        setHousekeepers(hkRes?.data || [])
      } catch (error) {
        console.error('Failed to load report data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const taskCompletionStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'CLOSED').length
    const inProgress = tasks.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length
    const overdue = tasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'CLOSED').length

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [tasks])

  const staffPerformance = useMemo(() => {
    const performance = housekeepers.map(hk => {
      const hkTasks = tasks.filter(t => t.housekeeperId === hk.id)
      const completedTasks = hkTasks.filter(t => t.status === 'CLOSED').length
      const totalTasks = hkTasks.length
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        name: hk.name,
        totalTasks,
        completedTasks,
        completionRate,
        avgCleaningTime: 0 // Will calculate from cleaning logs
      }
    })

    return performance.sort((a, b) => b.completionRate - a.completionRate)
  }, [housekeepers, tasks])

  const roomCleaningStats = useMemo(() => {
    const roomStats = {}
    cleaningLogs.forEach(log => {
      if (!roomStats[log.roomId]) {
        roomStats[log.roomId] = { totalCleanings: 0, avgDuration: 0, durations: [] }
      }
      roomStats[log.roomId].totalCleanings++
      if (log.durationMin) {
        roomStats[log.roomId].durations.push(log.durationMin)
      }
    })

    Object.keys(roomStats).forEach(roomId => {
      const durations = roomStats[roomId].durations
      roomStats[roomId].avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0
    })

    return roomStats
  }, [cleaningLogs])

  const taskStatusBreakdown = useMemo(() => {
    const statusCounts = {
      NEW: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      QA_CHECK: 0,
      CLOSED: 0,
      CANCELLED: 0
    }

    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1
    })

    return {
      labels: Object.keys(statusCounts),
      data: Object.values(statusCounts)
    }
  }, [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Housekeeping Reports</h2>

      {/* Task Completion Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Tasks</p>
          <p className="text-3xl font-bold">{taskCompletionStats.total}</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
          <p className="text-3xl font-bold text-green-600">{taskCompletionStats.completed}</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</p>
          <p className="text-3xl font-bold text-blue-600">{taskCompletionStats.inProgress}</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completion Rate</p>
          <p className="text-3xl font-bold text-purple-600">{taskCompletionStats.completionRate}%</p>
        </div>
      </div>

      {/* Task Status Distribution */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Task Status Distribution</h3>
        <Doughnut
          data={{
            labels: taskStatusBreakdown.labels,
            datasets: [{
              data: taskStatusBreakdown.data,
              backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#06B6D4', '#6B7280']
            }]
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: darkMode ? 'white' : 'black' } } }
          }}
        />
      </div>

      {/* Staff Performance */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Staff Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                <th className={`text-left p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Staff Member</th>
                <th className={`text-left p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Tasks</th>
                <th className={`text-left p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Completed</th>
                <th className={`text-left p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {staffPerformance.map((staff, index) => (
                <tr key={index} className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                  <td className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{staff.name}</td>
                  <td className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{staff.totalTasks}</td>
                  <td className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{staff.completedTasks}</td>
                  <td className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <span className={`px-2 py-1 rounded ${staff.completionRate >= 80 ? 'bg-green-100 text-green-800' : staff.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {staff.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room Cleaning Statistics */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Room Cleaning Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Object.keys(roomCleaningStats).length}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rooms Cleaned</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {Object.values(roomCleaningStats).reduce((sum, room) => sum + room.totalCleanings, 0)}
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Cleanings</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {Object.values(roomCleaningStats).length > 0
                ? Math.round(Object.values(roomCleaningStats).reduce((sum, room) => sum + room.avgDuration, 0) / Object.values(roomCleaningStats).length)
                : 0} min
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Cleaning Time</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
