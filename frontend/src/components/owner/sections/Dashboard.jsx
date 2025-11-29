import React, { useState, useEffect } from 'react'
import { guestService } from '../../../services/guestService'
import { bookingService } from '../../../services/bookingService'
import { analyticsService } from '../../../services/analyticsService'
import { DollarSign, Users, BarChart3, Activity, Loader2 } from 'lucide-react'

const Dashboard = ({ darkMode }) => {
  const [bookingSources, setBookingSources] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    newUsersThisMonth: 0
  });
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    occupancyRate: 0,
    avgRate: 0,
    productivity: 0,
    revenueByDay: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserStats(),
        fetchBookingSources(),
        fetchDashboardAnalytics()
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const fetchDashboardAnalytics = async () => {
    try {
      const response = await analyticsService.getDashboardAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
    }
  };

  const fetchBookingSources = async () => {
    try {
      const response = await bookingService.getSourceAnalytics();
      if (response.success) {
        setBookingSources(response.data);
        setTotalBookings(response.totalBookings);
      }
    } catch (error) {
      console.error('Error fetching booking sources:', error);
    }
  };

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

  // Helper to get color for source
  const getSourceColor = (source, index) => {
    const colors = ['blue', 'purple', 'amber', 'emerald', 'rose', 'cyan'];
    const map = {
      'public': 'blue',
      'walk-in': 'purple',
      'ota': 'amber',
      'corporate': 'emerald'
    };
    return map[source.toLowerCase()] || colors[index % colors.length];
  };

  // Helper to get hex color
  const getHexColor = (colorName) => {
    const map = {
      'blue': '#3b82f6',
      'purple': '#8b5cf6',
      'amber': '#f59e0b',
      'emerald': '#10b981',
      'rose': '#f43f5e',
      'cyan': '#06b6d4'
    };
    return map[colorName] || '#9ca3af';
  };

  // Calculate chart segments
  const renderChartSegments = () => {
    if (totalBookings === 0) return <circle cx="96" cy="96" r="80" fill="none" stroke={darkMode ? "#374151" : "#e5e7eb"} strokeWidth="32" />;

    let currentOffset = 0;
    const circumference = 502; // 2 * PI * 80

    return bookingSources.map((source, index) => {
      const colorName = getSourceColor(source.source, index);
      const strokeColor = getHexColor(colorName);
      const segmentLength = (source.count / totalBookings) * circumference;
      const dashArray = `${segmentLength} ${circumference}`;
      const dashOffset = -currentOffset;

      currentOffset += segmentLength;

      return (
        <circle
          key={source.source}
          cx="96"
          cy="96"
          r="80"
          fill="none"
          stroke={strokeColor}
          strokeWidth="32"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
        />
      );
    });
  };

  const kpiData = [
    {
      label: 'Total Revenue',
      value: `NPR ${analytics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'blue'
    },
    {
      label: 'Occupancy Rate',
      value: `${analytics.occupancyRate}%`,
      icon: Users,
      color: 'purple'
    },
    {
      label: 'Average Rate',
      value: `NPR ${analytics.avgRate.toLocaleString()}`,
      icon: BarChart3,
      color: 'amber'
    },
    {
      label: 'Productivity',
      value: `${analytics.productivity}%`,
      icon: Activity,
      color: 'emerald'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {kpiData.map((kpi, idx) => (
          <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-${kpi.color}-100`}>
                <kpi.icon className={`text-${kpi.color}-600`} size={24} />
              </div>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{kpi.label}</p>
            <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Revenue Analytics (Last 7 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.revenueByDay.length > 0 ? (
              analytics.revenueByDay.map((day, idx) => {
                const maxRevenue = Math.max(...analytics.revenueByDay.map(d => d.revenue));
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded z-10 whitespace-nowrap">
                      NPR {day.revenue.toLocaleString()}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t-2xl transition-all hover:from-blue-400 hover:to-purple-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    ></div>
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {day.day}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Booking Sources</h3>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                {renderChartSegments()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalBookings}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Bookings</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {bookingSources.map((source, idx) => {
              const color = getSourceColor(source.source, idx);
              return (
                <div key={idx} className="text-center">
                  <div className={`w-3 h-3 bg-${color}-500 rounded-full mx-auto mb-1`}></div>
                  <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>
                    {source.source}: {source.percentage}%
                  </p>
                </div>
              );
            })}
            {bookingSources.length === 0 && (
              <div className="col-span-3 text-center text-sm text-gray-500">No data available</div>
            )}
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>User Statistics</h3>
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
