import React, { useState, useEffect } from 'react'
import { guestService } from '../../../services/guestService'

const Dashboard = ({ darkMode, kpis }) => {
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    newUsersThisMonth: 0
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await guestService.getGuests({ page: 1, limit: 1000 });
      if (response.success) {
        const users = response.data;
        const totalUsers = users.length;
        const verifiedUsers = users.filter(user => user.isVerified).length;

        // Calculate new users this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newUsersThisMonth = users.filter(user =>
          new Date(user.createdAt) >= startOfMonth
        ).length;

        setUserStats({
          totalUsers,
          verifiedUsers,
          newUsersThisMonth
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis && kpis.map((kpi, idx) => (
          <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-${kpi.color}-100`}>
                <kpi.icon className={`text-${kpi.color}-600`} size={24} />
              </div>
              <span className={`text-${kpi.color}-600 text-sm font-semibold`}>{kpi.change}</span>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{kpi.label}</p>
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Revenue Analytics</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 78, 85, 72, 90, 88, 95].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t-2xl transition-all hover:from-blue-400 hover:to-purple-500"
                  style={{ height: `${height}%` }}
                ></div>
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Booking Sources</h3>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="80" fill="none" stroke="#3b82f6" strokeWidth="32" strokeDasharray="251 502" />
                <circle cx="96" cy="96" r="80" fill="none" stroke="#8b5cf6" strokeWidth="32" strokeDasharray="125 502" strokeDashoffset="-251" />
                <circle cx="96" cy="96" r="80" fill="none" stroke="#f59e0b" strokeWidth="32" strokeDasharray="125 502" strokeDashoffset="-376" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>105</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Bookings</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1"></div>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Direct: 50%</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-1"></div>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>OTA: 25%</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto mb-1"></div>
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Corporate: 25%</p>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>User Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Total Users</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userStats.totalUsers}</p>
              </div>
              <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}>
                <svg className={`w-6 h-6 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Verified Users</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userStats.verifiedUsers}</p>
              </div>
              <div className={`p-2 rounded-full ${darkMode ? 'bg-green-800' : 'bg-green-100'}`}>
                <svg className={`w-6 h-6 ${darkMode ? 'text-green-300' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>New This Month</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userStats.newUsersThisMonth}</p>
              </div>
              <div className={`p-2 rounded-full ${darkMode ? 'bg-purple-800' : 'bg-purple-100'}`}>
                <svg className={`w-6 h-6 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
