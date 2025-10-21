import React, { useEffect, useMemo, useState } from 'react'
import { bookingService } from '../../../services/bookingService'
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
  Filler,
  TimeScale
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
  Filler,
  TimeScale
)

const Reports = () => {
  const [summary, setSummary] = useState({ arrivals: 0, departures: 0, revenue: 0, occupancy: 0 })
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const today = new Date()
        const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10)
        const end = new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().slice(0,10)
        const [statsRes, bookingsRes] = await Promise.all([
          bookingService.getStats({ startDate: start, endDate: end }),
          bookingService.getAllBookings({ page: 1, limit: 1000 })
        ])
        setStats(statsRes?.stats || null)
        setBookings(bookingsRes?.data || [])

        // Simple summary demo derived from current month range
        const arrivals = (bookingsRes?.data || []).filter(b => (b.checkIn||'').startsWith(start.slice(0,7))).length
        const departures = (bookingsRes?.data || []).filter(b => (b.checkOut||'').startsWith(start.slice(0,7))).length
        const revenue = statsRes?.stats?.totalRevenue || 0
        setSummary({ arrivals, departures, revenue, occupancy: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const lastMonthsRevenue = useMemo(() => {
    // Group revenue by month (YYYY-MM) from bookings
    const map = new Map()
    for (const b of bookings) {
      const ym = (b.checkIn || '').slice(0,7)
      if (!ym) continue
      map.set(ym, (map.get(ym) || 0) + (b.totalAmount || 0))
    }
    const labels = Array.from(map.keys()).sort().slice(-6)
    const data = labels.map(l => map.get(l) || 0)
    return { labels, data }
  }, [bookings])

  const last7DaysActivity = useMemo(() => {
    // Count arrivals (by checkIn day) and departures (by checkOut day) for last 7 days
    const days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(d.toISOString().slice(0,10))
    }
    const arr = days.map(day => bookings.filter(b => (b.checkIn||'').slice(0,10) === day).length)
    const dep = days.map(day => bookings.filter(b => (b.checkOut||'').slice(0,10) === day).length)
    return { labels: days, arrivals: arr, departures: dep }
  }, [bookings])

  const statusBreakdown = useMemo(() => {
    const s = stats || {}
    const labels = ['Confirmed', 'Pending', 'Cancelled']
    const data = [s.confirmedBookings || 0, s.pendingBookings || 0, s.cancelledBookings || 0]
    return { labels, data }
  }, [stats])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6"><p className="text-sm text-gray-600">Arrivals</p><p className="text-3xl font-bold text-gray-900">{summary.arrivals}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-6"><p className="text-sm text-gray-600">Departures</p><p className="text-3xl font-bold text-gray-900">{summary.departures}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-6"><p className="text-sm text-gray-600">Revenue</p><p className="text-3xl font-bold text-gray-900">₹{summary.revenue.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-6"><p className="text-sm text-gray-600">Occupancy</p><p className="text-3xl font-bold text-gray-900">{summary.occupancy}%</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue (last 6 months)</h3>
        <Line height={80}
          data={{
            labels: lastMonthsRevenue.labels,
            datasets: [
              {
                label: 'Revenue',
                data: lastMonthsRevenue.data,
                borderColor: 'rgba(59,130,246,1)',
                backgroundColor: 'rgba(59,130,246,0.15)',
                fill: true,
                tension: 0.3
              }
            ]
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Arrivals vs Departures (7 days)</h3>
          <Bar height={120}
            data={{
              labels: last7DaysActivity.labels,
              datasets: [
                { label: 'Arrivals', data: last7DaysActivity.arrivals, backgroundColor: 'rgba(34,197,94,0.6)' },
                { label: 'Departures', data: last7DaysActivity.departures, backgroundColor: 'rgba(239,68,68,0.6)' }
              ]
            }}
            options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Status Distribution</h3>
          <Doughnut
            data={{
              labels: statusBreakdown.labels,
              datasets: [
                {
                  label: 'Count',
                  data: statusBreakdown.data,
                  backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
                }
              ]
            }}
            options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
          />
        </div>
      </div>
      {loading && <div className="text-gray-500 text-sm">Loading charts...</div>}
    </div>
  )
}

export default Reports


