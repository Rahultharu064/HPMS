import React, { useEffect, useMemo, useState } from 'react'
import { hkTaskService } from '../../../services/hkTaskService'
import { toast } from 'react-hot-toast'

const Staff = ({ darkMode }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [staffName, setStaffName] = useState('')
  const [assigningId, setAssigningId] = useState(null)

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

  useEffect(() => { load() }, [])

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

  const unassigned = useMemo(() => tasks.filter(t => !t.assignedTo), [tasks])

  const allStaffNames = useMemo(() => {
    const set = new Set(staffGroups.map(g => g.name))
    if (staffName && !set.has(staffName)) set.add(staffName)
    return Array.from(set)
  }, [staffGroups, staffName])

  const assign = async (taskId, name) => {
    try {
      setAssigningId(taskId)
      await hkTaskService.update(taskId, { assignedTo: name || null })
      toast.success(name ? 'Assigned' : 'Unassigned')
      await load()
    } catch (e) { console.error(e); toast.error('Failed to update assignment') }
    finally { setAssigningId(null) }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Staff Assignment</h2>
        <div className="flex items-center gap-2">
          <input value={staffName} onChange={e=>setStaffName(e.target.value)} placeholder="Add/Select staff name" className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} />
        </div>
      </div>

      {loading ? (
        <div className={`${darkMode ? 'text-white' : 'text-gray-700'}`}>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border rounded-2xl p-6`}>
            <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Unassigned Tasks ({unassigned.length})</h3>
            <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
              {unassigned.length === 0 ? (
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No unassigned tasks</div>
              ) : unassigned.map(t => (
                <div key={t.id} className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3 flex items-center justify-between`}>
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs opacity-70">Room {t.room?.roomNumber ?? t.roomId} • {t.priority} • {t.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className={`${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white'} px-2 py-1 rounded border`} onChange={e=>assign(t.id, e.target.value)} disabled={assigningId===t.id} defaultValue="">
                      <option value="" disabled>Assign to...</option>
                      {allStaffNames.map(n => <option key={n} value={n}>{n}</option>)}
                      {staffName && !allStaffNames.includes(staffName) && <option value={staffName}>{staffName}</option>}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {staffGroups.length === 0 ? (
              <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No staff yet. Type a staff name and assign a task to create a group.</div>
            ) : staffGroups.map(group => (
              <div key={group.name} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border rounded-2xl p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {group.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{group.name}</h4>
                      <div className="text-xs opacity-70">{group.list.length} task(s)</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                  {group.list.map(t => (
                    <div key={t.id} className={`${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3 flex items-center justify-between`}>
                      <div>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs opacity-70">Room {t.room?.roomNumber ?? t.roomId} • {t.priority} • {t.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>assign(t.id, '')} disabled={assigningId===t.id} className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} px-3 py-1 rounded`}>Unassign</button>
                        <select className={`${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white'} px-2 py-1 rounded border`} onChange={e=>assign(t.id, e.target.value)} disabled={assigningId===t.id} defaultValue={group.name}>
                          <option value={group.name}>{group.name}</option>
                          {allStaffNames.filter(n=>n!==group.name).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Staff
