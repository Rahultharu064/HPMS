import React from 'react'

const Settings = ({ darkMode }) => (
  <div className="space-y-6 animate-fadeIn">
    <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
    <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-6 shadow-xl`}>
      <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Settings panel coming soon...</p>
    </div>
  </div>
)

export default Settings
