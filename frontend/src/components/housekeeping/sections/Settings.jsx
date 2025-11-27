import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, RefreshCw, Bell, Clock, User, Shield } from 'lucide-react'
import { toast } from 'react-hot-toast'

const Settings = ({ darkMode }) => {
  const [settings, setSettings] = useState({
    shiftTimings: {
      morning: { start: '06:00', end: '12:00' },
      afternoon: { start: '12:00', end: '18:00' },
      evening: { start: '18:00', end: '24:00' }
    },
    notifications: {
      roomStatusChange: true,
      taskAssigned: true,
      taskCompleted: true,
      maintenanceRequest: true,
      emailNotifications: false,
      smsNotifications: false
    },
    housekeeping: {
      autoAssignRooms: false,
      requirePhotoConfirmation: true,
      maxRoomsPerHousekeeper: 10,
      cleaningTimeEstimate: 30
    },
    profile: {
      name: 'Housekeeping Staff',
      email: 'contact@namunacollege.edu.np',
      role: 'Housekeeper',
      notifications: true
    }
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // In a real app, this would load from the backend
      // For now, we'll use the default settings
      setLoading(false)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load settings')
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Settings saved successfully')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current = newSettings
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          Loading settings...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${saving
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg'
            }`}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Timings */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-500" />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Shift Timings</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(settings.shiftTimings).map(([shift, timing]) => (
              <div key={shift} className="space-y-2">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} capitalize`}>
                  {shift} Shift
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={timing.start}
                    onChange={(e) => updateSetting(`shiftTimings.${shift}.start`, e.target.value)}
                    className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} px-3 py-2 rounded-lg border flex-1`}
                  />
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center`}>to</span>
                  <input
                    type="time"
                    value={timing.end}
                    onChange={(e) => updateSetting(`shiftTimings.${shift}.end`, e.target.value)}
                    className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} px-3 py-2 rounded-lg border flex-1`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-green-500" />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <button
                  onClick={() => updateSetting(`notifications.${key}`, !value)}
                  className={`w-12 h-6 rounded-full transition-colors ${value
                      ? 'bg-blue-500'
                      : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Housekeeping Settings */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="w-6 h-6 text-purple-500" />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Housekeeping</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Auto-assign rooms
              </label>
              <button
                onClick={() => updateSetting('housekeeping.autoAssignRooms', !settings.housekeeping.autoAssignRooms)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.housekeeping.autoAssignRooms
                    ? 'bg-blue-500'
                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.housekeeping.autoAssignRooms ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Require photo confirmation
              </label>
              <button
                onClick={() => updateSetting('housekeeping.requirePhotoConfirmation', !settings.housekeeping.requirePhotoConfirmation)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.housekeeping.requirePhotoConfirmation
                    ? 'bg-blue-500'
                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.housekeeping.requirePhotoConfirmation ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
              </button>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Max rooms per housekeeper
              </label>
              <input
                type="number"
                value={settings.housekeeping.maxRoomsPerHousekeeper}
                onChange={(e) => updateSetting('housekeeping.maxRoomsPerHousekeeper', parseInt(e.target.value))}
                className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
                min="1"
                max="50"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Cleaning time estimate (minutes)
              </label>
              <input
                type="number"
                value={settings.housekeeping.cleaningTimeEstimate}
                onChange={(e) => updateSetting('housekeeping.cleaningTimeEstimate', parseInt(e.target.value))}
                className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
                min="5"
                max="120"
              />
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-orange-500" />
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profile</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Name
              </label>
              <input
                type="text"
                value={settings.profile.name}
                onChange={(e) => updateSetting('profile.name', e.target.value)}
                className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => updateSetting('profile.email', e.target.value)}
                className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Role
              </label>
              <select
                value={settings.profile.role}
                onChange={(e) => updateSetting('profile.role', e.target.value)}
                className={`${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} w-full px-3 py-2 rounded-lg border`}
              >
                <option value="Housekeeper">Housekeeper</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Enable notifications
              </label>
              <button
                onClick={() => updateSetting('profile.notifications', !settings.profile.notifications)}
                className={`w-12 h-6 rounded-full transition-colors ${settings.profile.notifications
                    ? 'bg-blue-500'
                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.profile.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings