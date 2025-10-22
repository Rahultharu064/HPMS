import React, { useEffect, useMemo, useState } from 'react'
import { Bed, Users, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Eye, Edit, Plus, RefreshCw } from 'lucide-react'
import { roomService } from '../../../services/roomService'
import { mapApiToFront, mapFrontToApi } from '../../../constants/roomStatus'
import { toast } from 'react-hot-toast'

const RoomStatus = () => {
  const [rooms, setRooms] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [updatingKey, setUpdatingKey] = useState(null) // `${roomId}-${code}`

  // mapping now centralized in constants

  useEffect(() => {
    let mounted = true

    const loadRooms = async () => {
      try {
        const res = await roomService.getRooms(1, 500)
        const data = res?.data || []

        const mapped = data.map(r => ({
          id: r.id,
          number: r.roomNumber,
          floor: r.floor,
          type: r.roomType,
          status: mapApiToFront(r.status),
          guest: null,
          lastCleaned: '-'
        }))

        if (!mounted) return
        setRooms(mapped)
      } catch {
        if (!mounted) return
        setRooms([])
      }
    }

    loadRooms()
    return () => { mounted = false }
  }, [])

  const statusInfo = (s) => ({
    VC: { label: 'Vacant Clean', color: 'bg-green-100 text-green-800 border-green-200' },
    VD: { label: 'Vacant Dirty', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    OC: { label: 'Occupied Clean', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    OD: { label: 'Occupied Dirty', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    OOO:{ label: 'Out of Order', color: 'bg-red-100 text-red-800 border-red-200' }
  }[s] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200' })

  const filtered = useMemo(() => rooms.filter(r => {
    const matchesSearch = r.number.includes(searchQuery) || r.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    const matchesFloor = floorFilter === 'all' || r.floor.toString() === floorFilter
    return matchesSearch && matchesStatus && matchesFloor
  }), [rooms, searchQuery, statusFilter, floorFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Room Status</h2>
        <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50">{viewMode === 'grid' ? 'List View' : 'Grid View'}</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Room number or type" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="VC">Vacant Clean</option>
            <option value="VD">Vacant Dirty</option>
            <option value="OC">Occupied Clean</option>
            <option value="OD">Occupied Dirty</option>
            <option value="OOO">Out of Order</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Floor</label>
          <select value={floorFilter} onChange={e=>setFloorFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={()=>{setSearchQuery('');setStatusFilter('all');setFloorFilter('all')}} className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Filter size={18}/>Clear</button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(room => (
            <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Room {room.number}</h3>
                  <p className="text-sm text-gray-600">Floor {room.floor} • {room.type}</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${statusInfo(room.status).color}`}>{statusInfo(room.status).label}</div>
              </div>
              {room.guest && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Guest: {room.guest}</p>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">Last cleaned: {room.lastCleaned}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Cleaned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(room => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Room {room.number}</div>
                      <div className="text-sm text-gray-500">Floor {room.floor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{room.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo(room.status).color}`}>{statusInfo(room.status).label}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{room.guest || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.lastCleaned}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-wrap gap-2">
                        {['VC','VD','OC','OD','OOO'].map(code => (
                          <button
                            key={code}
                            onClick={async () => {
                              const key = `${room.id}-${code}`
                              try {
                                setUpdatingKey(key)
                                await roomService.updateStatus(room.id, mapFrontToApi(code))
                                const res = await roomService.getRooms(1, 500)
                                const data = res?.data || []
                                setRooms(data.map(r => ({
                                  id: r.id,
                                  number: r.roomNumber,
                                  floor: r.floor,
                                  type: r.roomType,
                                  status: mapApiToFront(r.status),
                                  guest: null,
                                  lastCleaned: '-'
                                })))
                                toast.success('Room status updated')
                              } catch (e) {
                                console.error(e)
                                toast.error('Failed to update room status')
                              } finally { setUpdatingKey(null) }
                            }}
                            disabled={updatingKey === `${room.id}-${code}`}
                            className={`px-2 py-1 rounded border text-xs flex items-center gap-1 ${
                              updatingKey === `${room.id}-${code}`
                                ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-wait'
                                : room.status===code
                                  ? 'bg-gray-800 text-white border-gray-800'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                            title={`Set ${statusInfo(code).label}`}
                          >
                            {updatingKey === `${room.id}-${code}` ? <RefreshCw size={12} className="animate-spin"/> : null}
                            {code}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomStatus


