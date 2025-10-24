import React, { useEffect, useState } from 'react'
import { hkSettingsService } from '../../../services/hkSettingsService'
import { toast } from 'react-hot-toast'

const Settings = ({ darkMode }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    shifts: {
      MORNING: { start: '06:00', end: '12:00' },
      AFTERNOON: { start: '12:00', end: '18:00' },
      EVENING: { start: '18:00', end: '24:00' }
    },
    notifications: { enabled: true },
    priorities: { default: 'MEDIUM' }
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await hkSettingsService.get()
        if (mounted) setSettings(res.data || settings)
      } catch (e) { console.error(e); toast.error('Failed to load settings') }
      finally { setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  const onChangeShift = (key, field, value) => {
    setSettings(s => ({ ...s, shifts: { ...s.shifts, [key]: { ...s.shifts[key], [field]: value } } }))
  }
  const onChangeNotif = (value) => setSettings(s => ({ ...s, notifications: { ...s.notifications, enabled: value } }))
  const onChangePriority = (value) => setSettings(s => ({ ...s, priorities: { ...s.priorities, default: value } }))

  const save = async () => {
    try {
      setSaving(true)
      await hkSettingsService.update(settings)
      toast.success('Settings saved')
    } catch (e) { console.error(e); toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-6 shadow-xl space-y-6`}>
        {loading ? (
          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Loading...</div>
        ) : (
          <>
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Shifts</h3>
              {['MORNING','AFTERNOON','EVENING'].map(k => (
                <div key={k} className="flex items-center gap-3 mb-2">
                  <div className={`w-32 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{k}</div>
                  <input value={settings.shifts[k].start} onChange={e=>onChangeShift(k,'start',e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} placeholder="Start (HH:MM)" />
                  <input value={settings.shifts[k].end} onChange={e=>onChangeShift(k,'end',e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`} placeholder="End (HH:MM)" />
                </div>
              ))}
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={!!settings.notifications.enabled} onChange={e=>onChangeNotif(e.target.checked)} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Enable notifications</span>
              </label>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Default Priority</h3>
              <select value={settings.priorities.default} onChange={e=>onChangePriority(e.target.value)} className={`${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'} px-3 py-2 rounded-lg border`}>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-70">{saving ? 'Saving...' : 'Save Settings'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Settings
