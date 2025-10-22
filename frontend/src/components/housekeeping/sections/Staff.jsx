import React from 'react'

const Staff = ({ darkMode }) => {
  const staff = [
    { name: 'Sarah Johnson', avatar: 'SJ', rooms: [101, 105], status: 'available' },
    { name: 'Mike Chen', avatar: 'MC', rooms: [103], status: 'busy' },
    { name: 'Emily Davis', avatar: 'ED', rooms: [106], status: 'available' },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Staff Assignment</h2>
      <div className="grid gap-6">
        {staff.map(member => (
          <div key={member.name} className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'} border rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">{member.avatar}</div>
                <div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{member.rooms.length} room{member.rooms.length !== 1 ? 's' : ''} assigned</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${member.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {member.status === 'available' ? '✓ Available' : '⏱ Busy'}
              </span>
            </div>
            <div className="flex gap-2">
              {member.rooms.map(id => (
                <span key={id} className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} px-4 py-2 rounded-xl text-sm font-medium`}>Room {id}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Staff
