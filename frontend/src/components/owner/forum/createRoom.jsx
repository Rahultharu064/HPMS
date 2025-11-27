import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createRoom, resetCreatedRoom } from '../../../redux/roomSlice'
import { toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { roomTypeService } from '../../../services/roomTypeService'
import CreateRoomTypeModal from './CreateRoomTypeModal'

const initialForm = {
  name: '',
  roomType: '',
  roomNumber: '',
  floor: '',
  price: '',
  size: '',
  maxAdults: '',
  maxChildren: '',
  numBeds: '',
  allowChildren: false,
  description: '',
  status: 'available',
  amenity: '',
}

export default function CreateRoom() {
  const dispatch = useDispatch()
  const { creating, createError, createdRoom } = useSelector(s => s.room)

  const [form, setForm] = useState(initialForm)
  const [amenities, setAmenities] = useState([])
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true)
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false)
  const [roomSequence, setRoomSequence] = useState('')

  const imgInputRef = useRef(null)
  const vidInputRef = useRef(null)

  // Compute prefix based on selected room type
  const roomPrefix = useMemo(() => {
    if (!form.roomType || !roomTypes.length) return ''
    const type = roomTypes.find(t => t.id === Number(form.roomType))
    return type?.code || ''
  }, [form.roomType, roomTypes])

  // Update room number when prefix or sequence changes
  useEffect(() => {
    if (roomPrefix && roomSequence) {
      setForm(prev => ({ ...prev, roomNumber: `${roomPrefix}${roomSequence}` }))
    } else if (roomSequence) {
      setForm(prev => ({ ...prev, roomNumber: roomSequence }))
    }
  }, [roomPrefix, roomSequence])

  useEffect(() => {
    if (createdRoom) {
      toast.success('Room created successfully')
      setForm(initialForm)
      setRoomSequence('')
      setAmenities([])
      setImages([])
      setVideos([])
      const t = setTimeout(() => dispatch(resetCreatedRoom()), 2500)
      return () => clearTimeout(t)
    }
  }, [createdRoom, dispatch])

  useEffect(() => {
    if (createError) toast.error(String(createError))
  }, [createError])

  const fetchRoomTypes = async () => {
    try {
      setLoadingRoomTypes(true)
      const response = await roomTypeService.getRoomTypes(1, 100) // Get all room types
      setRoomTypes(response.data || [])
    } catch (error) {
      toast.error('Failed to load room types')
      console.error('Error fetching room types:', error)
    } finally {
      setLoadingRoomTypes(false)
    }
  }

  // Fetch room types on component mount
  useEffect(() => {
    fetchRoomTypes()
  }, [])

  const handleRoomTypeCreated = async (newRoomType) => {
    await fetchRoomTypes()
    setForm(prev => ({ ...prev, roomType: newRoomType.id }))
    setShowRoomTypeModal(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const addAmenity = () => {
    const v = form.amenity.trim()
    if (!v) return
    if (amenities.includes(v)) { toast.error('Amenity already added'); return }
    setAmenities(prev => [...prev, v])
    setForm(prev => ({ ...prev, amenity: '' }))
  }
  const removeAmenity = (a) => setAmenities(prev => prev.filter(x => x !== a))

  const onImages = (e) => {
    const files = Array.from(e.target.files || [])
    const valid = []
    for (const f of files) {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} is not an image`); continue }
      valid.push(f)
    }
    setImages(prev => {
      const merged = [...prev, ...valid]
      const deduped = []
      const seen = new Set()
      for (const f of merged) {
        const key = `${f.name}-${f.size}`
        if (!seen.has(key)) { seen.add(key); deduped.push(f) }
      }
      if (deduped.length > 10) toast.error('Image limit exceeded (max 10)')
      return deduped.slice(0, 10)
    })
    if (imgInputRef.current) imgInputRef.current.value = ''
  }

  const onVideos = (e) => {
    const files = Array.from(e.target.files || [])
    const valid = []
    for (const f of files) {
      if (!f.type.startsWith('video/')) { toast.error(`${f.name} is not a video`); continue }
      valid.push(f)
    }
    setVideos(prev => {
      const merged = [...prev, ...valid]
      const deduped = []
      const seen = new Set()
      for (const f of merged) {
        const key = `${f.name}-${f.size}`
        if (!seen.has(key)) { seen.add(key); deduped.push(f) }
      }
      if (deduped.length > 3) toast.error('Video limit exceeded (max 3)')
      return deduped.slice(0, 3)
    })
    if (vidInputRef.current) vidInputRef.current.value = ''
  }

  const validateRequired = () => {
    const req = ['name', 'roomType', 'roomNumber', 'floor', 'price', 'size', 'maxAdults', 'numBeds', 'description']
    for (const k of req) if (!String(form[k] ?? '').trim()) return false
    return true
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!validateRequired()) { toast.error('Please fill all required fields'); return }
    if (images.length === 0) { toast.error('Please add at least one image'); return }

    const payload = {
      name: form.name,
      roomType: form.roomType,
      roomNumber: form.roomNumber,
      floor: Number(form.floor),
      price: Number(form.price),
      size: Number(form.size),
      maxAdults: Number(form.maxAdults),
      maxChildren: form.allowChildren && form.maxChildren !== '' ? Number(form.maxChildren) : 0,
      numBeds: Number(form.numBeds),
      allowChildren: Boolean(form.allowChildren),
      description: form.description,
      status: form.status,
      amenities,
      images,
      videos,
    }
    dispatch(createRoom(payload))
  }

  const canSubmit = useMemo(() => !creating, [creating])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Create New Room</h1>

      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Room Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Deluxe Ocean Suite" className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Room Type *</label>
            <div className="flex gap-2">
              <select name="roomType" value={form.roomType} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" disabled={loadingRoomTypes}>
                <option value="">
                  {loadingRoomTypes ? 'Loading room types...' : 'Select room type'}
                </option>
                {roomTypes.map((roomType) => (
                  <option key={roomType.id} value={roomType.id}>
                    {roomType.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowRoomTypeModal(true)}
                className="mt-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Create New Room Type"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm">Room Number *</label>
            <div className="flex mt-1">
              {roomPrefix && (
                <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-bold">
                  {roomPrefix}
                </span>
              )}
              <input
                name="roomSequence"
                value={roomSequence}
                onChange={(e) => setRoomSequence(e.target.value)}
                placeholder="305"
                className={`w-full border rounded-r px-3 py-2 ${!roomPrefix ? 'rounded-l' : ''}`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Final Room Number: {form.roomNumber}</p>
          </div>
          <div>
            <label className="text-sm">Floor *</label>
            <input name="floor" type="number" value={form.floor} onChange={handleChange} placeholder="3" className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Price per Night (NPR) *</label>
            <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="299" className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Room Size (sq ft) *</label>
            <input name="size" type="number" value={form.size} onChange={handleChange} placeholder="450" className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Max Adults *</label>
            <input name="maxAdults" type="number" value={form.maxAdults} onChange={handleChange} placeholder="2" className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Number of Beds *</label>
            <input name="numBeds" type="number" value={form.numBeds} onChange={handleChange} placeholder="2" className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mt-2">
              <input id="allowChildren" name="allowChildren" type="checkbox" checked={form.allowChildren} onChange={handleChange} />
              <label htmlFor="allowChildren" className="text-sm">Allow Children</label>
            </div>
          </div>
          {form.allowChildren && (
            <div>
              <label className="text-sm">Max Children</label>
              <input name="maxChildren" type="number" value={form.maxChildren} onChange={handleChange} placeholder="0" className="mt-1 w-full border rounded px-3 py-2" />
            </div>
          )}
          <div>
            <label className="text-sm">Status *</label>
            <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the room features..." rows={4} className="mt-1 w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="text-sm">Amenities</label>
          <div className="flex gap-2 mt-1">
            <input name="amenity" value={form.amenity} onChange={handleChange} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }} placeholder="Type an amenity and press Add" className="w-full border rounded px-3 py-2" />
            <button type="button" onClick={addAmenity} className="border rounded px-3 py-2">Add</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {amenities.map(a => (
              <span key={a} className="text-xs border rounded px-2 py-1 flex items-center gap-2">
                {a}
                <button type="button" onClick={() => removeAmenity(a)} className="text-red-600">x</button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm">Images (max 10)</label>
            <input ref={imgInputRef} type="file" multiple accept="image/*" onChange={onImages} className="mt-1 w-full" />
            <div className="text-xs text-gray-600 mt-1">Selected: {images.length}</div>
          </div>
          <div>
            <label className="text-sm">Videos (max 3)</label>
            <input ref={vidInputRef} type="file" multiple accept="video/*" onChange={onVideos} className="mt-1 w-full" />
            <div className="text-xs text-gray-600 mt-1">Selected: {videos.length}</div>
          </div>
        </div>

        <div className="flex justify-end">
          <button disabled={!canSubmit} type="submit" className="border rounded px-4 py-2 disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>

      {showRoomTypeModal && (
        <CreateRoomTypeModal
          onClose={() => setShowRoomTypeModal(false)}
          onSuccess={handleRoomTypeCreated}
        />
      )}
    </div>
  )
}

