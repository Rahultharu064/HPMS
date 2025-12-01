import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ArrowUp, ArrowDown, TrendingUp, Calendar as CalIcon, Plus, CheckCircle, XCircle } from 'lucide-react'
import { roomService } from '../../../services/roomService'
import { bookingService } from '../../../services/bookingService'
import { getSocket } from '../../../utils/socket'

const Dashboard = ({ darkMode = false }) => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ arrivals: 0, departures: 0, inHouse: 0, occupancy: 0, revenue: 0 })
  const [arrivals, setArrivals] = useState([])
  const [departures, setDepartures] = useState([])

  useEffect(() => {
    let mounted = true

    const loadRoomStatus = async () => {
      try {
        const res = await roomService.getRooms(1, 1000)
        const rooms = res?.data || []

        const totalRooms = rooms.length
        const normalize = (s = '') => String(s).toLowerCase()
        const occupiedStatuses = new Set(['occupied', 'oc', 'od'])

        let occupied = 0
        rooms.forEach(r => {
          const s = normalize(r.status)
          if (occupiedStatuses.has(s)) occupied++
        })

        const occupancyPct = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0

        if (!mounted) return
        setStats(prev => ({
          ...prev,
          occupancy: occupancyPct,
          inHouse: occupied,
          revenue: prev.revenue
        }))

        // Today arrivals/departures
        const today = new Date().toISOString().slice(0, 10)
        const [ciPending, ciConfirmed, coConfirmed, coCompleted] = await Promise.all([
          bookingService.getAllBookings({ checkIn: today, status: 'pending', limit: 100 }),
          bookingService.getAllBookings({ checkIn: today, status: 'confirmed', limit: 100 }),
          bookingService.getAllBookings({ checkOut: today, status: 'confirmed', limit: 100 }),
          bookingService.getAllBookings({ checkOut: today, status: 'completed', limit: 100 })
        ])

        const mergeUnique = (lists) => {
          const map = new Map()
          for (const l of lists) {
            for (const b of (l?.data || [])) map.set(b.id, b)
          }
          return Array.from(map.values())
        }

        const arrivalsRaw = mergeUnique([ciPending, ciConfirmed])
        const departuresRaw = mergeUnique([coConfirmed, coCompleted])

        const toCard = (b) => ({
          id: b.id,
          guest: [b.guest?.firstName, b.guest?.lastName].filter(Boolean).join(' ') || '—',
          room: b.room?.roomNumber || b.roomId,
          time: `${(b.checkIn || '').slice(11, 16)}-${(b.checkOut || '').slice(11, 16)}`.replace(/^-/, '') || '—',
          status: b.status
        })

        if (!mounted) return
        setArrivals(arrivalsRaw.map(toCard))
        setDepartures(departuresRaw.map(toCard))
        setStats(prev => ({
          ...prev,
          arrivals: arrivalsRaw.length,
          departures: departuresRaw.length
        }))
      } catch {
        // Keep dashboard resilient if API fails
        if (!mounted) return
        setStats(prev => ({ ...prev, occupancy: 0, inHouse: 0 }))
      }
    }

    loadRoomStatus()

    // Setup Socket.IO listeners for real-time updates
    const socket = getSocket()

    const handleBookingCreated = () => {
      console.log('New booking created - refreshing dashboard')
      loadRoomStatus()
    }

    const handleBookingUpdated = () => {
      console.log('Booking updated - refreshing dashboard')
      loadRoomStatus()
    }

    const handleBookingCancelled = () => {
      console.log('Booking cancelled - refreshing dashboard')
      loadRoomStatus()
    }

    const handleBookingDeleted = () => {
      console.log('Booking deleted - refreshing dashboard')
      loadRoomStatus()
    }

    socket.on('fo:booking:created', handleBookingCreated)
    socket.on('fo:booking:updated', handleBookingUpdated)
    socket.on('fo:booking:cancelled', handleBookingCancelled)
    socket.on('fo:booking:deleted', handleBookingDeleted)

    return () => {
      mounted = false
      socket.off('fo:booking:created', handleBookingCreated)
      socket.off('fo:booking:updated', handleBookingUpdated)
      socket.off('fo:booking:cancelled', handleBookingCancelled)
      socket.off('fo:booking:deleted', handleBookingDeleted)
    }
  }, [])

  const badge = (status) => {
    const map = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Front Office Dashboard</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/front-office/new-reservation')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            New Reservation
          </button>
          <button className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50">Check-in</button>
          <button className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50">Check-out</button>
        </div>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Occupancy</p>
              <p className="text-3xl font-bold">{stats.occupancy}%</p>
            </div>
            <TrendingUp size={32} className="text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Revenue (Today)</p>
              <p className="text-3xl font-bold">NPR{stats.revenue.toLocaleString()}</p>
            </div>
            <ArrowUp size={32} className="text-emerald-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Arrivals</p>
              <p className="text-3xl font-bold">{stats.arrivals}</p>
            </div>
            <ArrowUp size={32} className="text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Departures</p>
              <p className="text-3xl font-bold">{stats.departures}</p>
            </div>
            <ArrowDown size={32} className="text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">In-House</p>
              <p className="text-3xl font-bold">{stats.inHouse}</p>
            </div>
            <Users size={32} className="text-pink-200" />
          </div>
        </div>
      </div>

      {/* Arrivals/Departures & Mini Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ArrowUp className="text-green-600 mr-2" /> Arrivals</h3>
          <div className="space-y-2">
            {arrivals.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{a.guest}</p>
                  <p className="text-sm text-gray-600">Room {a.room} • {a.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge(a.status)}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ArrowDown className="text-red-600 mr-2" /> Departures</h3>
          <div className="space-y-2">
            {departures.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{d.guest}</p>
                  <p className="text-sm text-gray-600">Room {d.room} • {d.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge(d.status)}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><CalIcon className="text-blue-600 mr-2" /> Mini Calendar</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {[...Array(28)].map((_, i) => (
              <div key={i} className={`py-2 rounded-md border ${i === new Date().getDate() - 1 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}>{i + 1}</div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Arrivals</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span>Departures</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard


