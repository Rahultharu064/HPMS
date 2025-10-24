import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { getSocket } from '../../../utils/socket'
import { toast } from 'react-hot-toast'
import { hkCleaningService } from '../../../services/hkCleaningService'
import { hkTaskService } from '../../../services/hkTaskService'
import { Plus, Edit, Trash2, CheckCircle, Clock, AlertTriangle, XCircle, MessageSquare, Paperclip } from 'lucide-react'
import { roomService } from '../../../services/roomService'
import { housekeeperService } from '../../../services/housekeeperService'
import { API_BASE_URL } from '../../../utils/api'

const Schedule = ({ darkMode }) => {
  const [items, setItems] = useState([])
  const [tasks, setTasks] = useState([])
  const [staffName, setStaffName] = useState('')
  const [creatingId, setCreatingId] = useState(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(false)
  const [shift, setShift] = useState('ALL') // ALL | MORNING | AFTERNOON | EVENING
  const [roomStatus, setRoomStatus] = useState('ALL') // ALL | clean | needs-cleaning | occupied | maintenance | available
  const [taskStatus, setTaskStatus] = useState('ALL') // ALL | NEW | ASSIGNED | IN_PROGRESS | DONE | QA_CHECK | CLOSED | CANCELLED | NONE
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ roomId: '', title: '', type: 'cleaning', priority: 'MEDIUM', assignedTo: '' })
  const [rooms, setRooms] = useState([])
  const [housekeepers, setHousekeepers] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState({
    roomId: '',
    title: '',
    description: '',
    type: 'cleaning',
    priority: 'MEDIUM',
    assignedTo: '',
    dueAt: '',
    notes: ''
  })

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, housekeepersRes, tasksRes] = await Promise.all([
          roomService.getStatusMap({}),
          housekeeperService.list(),
          hkTaskService.list({ limit: 200 })
        ])
        setRooms(roomsRes.data || [])
        setHousekeepers(housekeepersRes.data || [])
        setTasks(tasksRes.data || [])
      } catch (e) { console.error(e) }
    }
    fetchData()
  }, [])

  // Live updates when room status changes
  useEffect(() => {
    const socket = getSocket()
    const handler = () => load()
    const taskHandler = (data) => {
      if (data.task) {
        setTasks(prev => {
          const existing = prev.find(t => t.id === data.task.id)
          if (existing) {
            return prev.map(t => t.id === data.task.id ? data.task : t)
          } else {
            return [...prev, data.task]
          }
        })
      }
    }
    const taskDeletedHandler = (data) => {
      setTasks(prev => prev.filter(t => t.id !== data.id))
    }
    socket.on('hk:room:status', handler)
    socket.on('hk:task:created', taskHandler)
    socket.on('hk:task:updated', taskHandler)
    socket.on('hk:task:deleted', taskDeletedHandler)
    return () => {
      socket.off('hk:room:status', handler)
      socket.off('hk:task:created', taskHandler)
      socket.off('hk:task:updated', taskHandler)
      socket.off('hk:task:deleted', taskDeletedHandler)
    }
  }, [load])

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAssignedHousekeeper = (roomId) => {
    return housekeepers.find(hk => hk.assignedRooms?.includes(roomId))
  }

  const assignHousekeeper = async (roomId, housekeeperId) => {
    try {
      // This would call an API to assign housekeeper to room
      // For now, we'll simulate the assignment
      toast.success(`Housekeeper assigned to room #${roomId}`)
      // Refresh data
      const [roomsRes, housekeepersRes] = await Promise.all([
        roomService.getStatusMap({}),
        housekeeperService.list()
      ])
      setRooms(roomsRes.data || [])
      setHousekeepers(housekeepersRes.data || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to assign housekeeper')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'NEW': return <Clock className="w-4 h-4 text-blue-500" />
      case 'ASSIGNED': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'DONE': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'QA_CHECK': return <AlertTriangle className="w-4 h-4 text-purple-500" />
      case 'CLOSED': return <CheckCircle className="w-4 h-4 text-gray-500" />
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'ASSIGNED': return 'bg-orange-100 text-orange-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'DONE': return 'bg-green-100 text-green-800'
      case 'QA_CHECK': return 'bg-purple-100 text-purple-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'MEDIUM': return 'bg-blue-100 text-blue-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const openTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task)
      setTaskForm({
        roomId: task.roomId || '',
        title: task.title || '',
        description: task.description || '',
        type: task.type || 'cleaning',
        priority: task.priority || 'MEDIUM',
        assignedTo: task.assignedTo || '',
        dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
        notes: task.notes || ''
      })
    } else {
      setEditingTask(null)
      setTaskForm({
        roomId: '',
        title: '',
        description: '',
        type: 'cleaning',
        priority: 'MEDIUM',
        assignedTo: '',
        dueAt: '',
        notes: ''
      })
    }
    setShowTaskModal(true)
  }

  const closeTaskModal = () => {
    setShowTaskModal(false)
    setEditingTask(null)
    setTaskForm({
      roomId: '',
      title: '',
      description: '',
      type: 'cleaning',
      priority: 'MEDIUM',
      assignedTo: '',
      dueAt: '',
      notes: ''
    })
  }

  const saveTask = async () => {
    try {
      if (!taskForm.roomId || !taskForm.title) {
        toast.error('Room and Title are required')
        return
      }

      const taskData = {
        ...taskForm,
        roomId: Number(taskForm.roomId),
        dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null
      }

      if (editingTask) {
        await hkTaskService.update(editingTask.id, taskData)
        toast.success('Task updated successfully')
      } else {
        await hkTaskService.create(taskData)
        toast.success('Task created successfully')
      }

      closeTaskModal()
      // Refresh tasks
      const tasksRes = await hkTaskService.list({ limit: 200 })
      setTasks(tasksRes.data || [])
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to save task')
    }
  }

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await hkTaskService.update(taskId, { status: newStatus })
      toast.success(`Task status updated to ${newStatus}`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to update task status')
    }
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await hkTaskService.remove(taskId)
      toast.success('Task deleted successfully')
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete task')
    }
  }

  const bulkUpdateStatus = async (newStatus) => {
    if (selectedTasks.length === 0) {
      toast.error('No tasks selected')
      return
    }
    try {
      await Promise.all(selectedTasks.map(taskId => hkTaskService.update(taskId, { status: newStatus })))
      toast.success(`${selectedTasks.length} tasks updated to ${newStatus}`)
      setSelectedTasks([])
    } catch (e) {
      console.error(e)
      toast.error('Failed to update tasks')
    }
  }

  const bulkDelete = async () => {
    if (selectedTasks.length === 0) {
      toast.error('No tasks selected')
      return
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) return
    try {
      await Promise.all(selectedTasks.map(taskId => hkTaskService.remove(taskId)))
      toast.success(`${selectedTasks.length} tasks deleted`)
      setSelectedTasks([])
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete tasks')
    }
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
      setCreateForm({ roomId: '', title: '', type: 'cleaning', priority: 'MEDIUM', assignedTo: '' })
      await load()
    } catch (e) { console.error(e); toast.error(e?.message || 'Failed to create task') }
    finally { setCreating(false) }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white'} border rounded-2xl p-4 flex items-center justify-between shadow-sm`}>
        <div>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cleaning Schedule</h2>
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Plan and track daily room cleaning</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openTaskModal()} className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'}`}>
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          {selectedTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {selectedTasks.length} selected
              </span>
              <select
                onChange={(e) => bulkUpdateStatus(e.target.value)}
                className={`${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'} px-3 py-2 rounded-lg border text-sm`}
                defaultValue=""
              >
                <option value="" disabled>Bulk Update Status</option>
                <option value="NEW">NEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
                <option value="QA_CHECK">QA_CHECK</option>
                <option value="CLOSED">CLOSED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <button
                onClick={bulkDelete}
                className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === tasks.length && tasks.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(tasks.map(t => t.id))
                      } else {
                        setSelectedTasks([])
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-6">Loading...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan="8" className={`px-6 py-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No tasks found.</td></tr>
              ) : tasks.map((task) => (
                <tr key={task.id} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTasks(prev => [...prev, task.id])
                        } else {
                          setSelectedTasks(prev => prev.filter(id => id !== task.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate max-w-xs`}>
                          {task.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      #{task.room?.roomNumber || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} border-0`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="DONE">DONE</option>
                        <option value="QA_CHECK">QA_CHECK</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {task.assignedTo || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTaskModal(task)}
                        className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                        title="Edit Task"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                      {task.notes && (
                        <button
                          className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                          title={task.notes}
                        >
                          <MessageSquare size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} w-full max-w-2xl rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto`}>
            <h3 className="text-xl font-semibold mb-4">{editingTask ? 'Edit Task' : 'Create Task'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); saveTask(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Room <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={taskForm.roomId}
                    onChange={e=>setTaskForm(f=>({ ...f, roomId: e.target.value }))}
                    className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  >
                    <option value="">Select a room</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>#{r.roomNumber} ({r.status})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Assigned To</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={e=>setTaskForm(f=>({ ...f, assignedTo: e.target.value }))}
                    className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  >
                    <option value="">Unassigned</option>
                    {housekeepers.map(hk => (
                      <option key={hk.id} value={hk.name}>{hk.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Task Title <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={taskForm.title}
                    onChange={e=>setTaskForm(f=>({ ...f, title: e.target.value }))}
                    className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                    placeholder="e.g. Deep clean bathroom, restock linens"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Task Type</label>
                  <select
                    value={taskForm.type}
                    onChange={e=>setTaskForm(f=>({ ...f, type: e.target.value }))}
                    className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  >
                    <option value="cleaning">cleaning</option>
                    <option value="maintenance">maintenance</option>
                    <option value="inspection">inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e=>setTaskForm(f=>({ ...f, priority: e.target.value }))}
                    className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={taskForm.dueAt}
                    onChange={e=>setTaskForm(f=>({ ...f, dueAt: e.target.value }))}
                    className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={e=>setTaskForm(f=>({ ...f, description: e.target.value }))}
                    className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                    rows="3"
                    placeholder="Task description..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Notes</label>
                  <textarea
                    value={taskForm.notes}
                    onChange={e=>setTaskForm(f=>({ ...f, notes: e.target.value }))}
                    className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} w-full px-3 py-2 rounded-lg border`}
                    rows="2"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={closeTaskModal} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-4 py-2 rounded-lg`}>Cancel</button>
                <button type="submit" className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedule
