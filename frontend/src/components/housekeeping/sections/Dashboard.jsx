import React from 'react'

const Dashboard = ({ darkMode, setActiveTab }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h2>
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
