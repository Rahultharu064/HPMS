import React, { useState, useEffect, useRef } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { roomService } from '../../../services/roomService'
import { toast } from 'react-hot-toast'

const UpdateRoom = ({ room, onClose, onSuccess, darkMode }) => {
  const [form, setForm] = useState({
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
  })
  
  const [amenities, setAmenities] = useState([])
  const [images, setImages] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [existingImages, setExistingImages] = useState([])
  const [existingVideos, setExistingVideos] = useState([])

  const imgInputRef = useRef(null)
  const vidInputRef = useRef(null)

  useEffect(() => {
    if (room) {
      setForm({
        name: room.name || '',
        roomType: room.roomType || '',
        roomNumber: room.roomNumber || '',
        floor: room.floor || '',
        price: room.price || '',
        size: room.size || '',
        maxAdults: room.maxAdults || '',
        maxChildren: room.maxChildren || '',
        numBeds: room.numBeds || '',
        allowChildren: room.allowChildren || false,
        description: room.description || '',
        status: room.status || 'available',
        amenity: '',
      })
      
      setAmenities(room.amenity?.map(a => a.name) || [])
      setExistingImages(room.image || [])
      setExistingVideos(room.video || [])
    }
  }, [room])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const addAmenity = () => {
    const v = form.amenity.trim()
    if (!v) return
    if (amenities.includes(v)) { 
      toast.error('Amenity already added')
      return 
    }
    setAmenities(prev => [...prev, v])
    setForm(prev => ({ ...prev, amenity: '' }))
  }

  const removeAmenity = (a) => setAmenities(prev => prev.filter(x => x !== a))

  const onImages = (e) => {
    const files = Array.from(e.target.files || [])
    const valid = []
    for (const f of files) {
      if (!f.type.startsWith('image/')) { 
        toast.error(`${f.name} is not an image`)
        continue 
      }
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
      if (!f.type.startsWith('video/')) { 
        toast.error(`${f.name} is not a video`)
        continue 
      }
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
    const req = ['name','roomType','roomNumber','floor','price','size','maxAdults','numBeds','description']
    for (const k of req) if (!String(form[k] ?? '').trim()) return false
    return true
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validateRequired()) { 
      toast.error('Please fill all required fields')
      return 
    }

    setLoading(true)
    try {
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
      
      await roomService.updateRoom(room.id, payload)
      toast.success('Room updated successfully')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(error.message || 'Failed to update room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Update Room: {room?.name}
            </h2>
            <button 
              onClick={onClose}
              className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Room Name *</label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  placeholder="Deluxe Ocean Suite" 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Room Type *</label>
                <select 
                  name="roomType" 
                  value={form.roomType} 
                  onChange={handleChange} 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="">Select room type</option>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="presidential">Presidential Suite</option>
                  <option value="family">Family Room</option>
                </select>
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Room Number *</label>
                <input 
                  name="roomNumber" 
                  value={form.roomNumber} 
                  onChange={handleChange} 
                  placeholder="305" 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Floor *</label>
                <input 
                  name="floor" 
                  type="number" 
                  value={form.floor} 
                  onChange={handleChange} 
                  placeholder="3" 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price per Night (₹) *</label>
                <input 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  value={form.price} 
                  onChange={handleChange} 
                  placeholder="8500" 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Room Size (sq ft) *</label>
                <input 
                  name="size" 
                  type="number" 
                  value={form.size} 
                  onChange={handleChange} 
                  placeholder="450" 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Max Adults *</label>
                <input 
                  name="maxAdults" 
                  type="number" 
                  value={form.maxAdults} 
                  onChange={handleChange} 
                  placeholder="2" 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Number of Beds *</label>
                <input 
                  name="numBeds" 
                  type="number" 
                  value={form.numBeds} 
                  onChange={handleChange} 
                  placeholder="2" 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    id="allowChildren" 
                    name="allowChildren" 
                    type="checkbox" 
                    checked={form.allowChildren} 
                    onChange={handleChange} 
                    className="rounded"
                  />
                  <label htmlFor="allowChildren" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Allow Children
                  </label>
                </div>
              </div>
              {form.allowChildren && (
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Max Children</label>
                  <input 
                    name="maxChildren" 
                    type="number" 
                    value={form.maxChildren} 
                    onChange={handleChange} 
                    placeholder="0" 
                    className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                  />
                </div>
              )}
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status *</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange} 
                  className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description *</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                placeholder="Describe the room features..." 
                rows={4} 
                className={`mt-1 w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
              />
            </div>

            <div>
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amenities</label>
              <div className="flex gap-2 mt-1">
                <input 
                  name="amenity" 
                  value={form.amenity} 
                  onChange={handleChange} 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }} 
                  placeholder="Type an amenity and press Add" 
                  className={`w-full border rounded-lg px-3 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                />
                <button 
                  type="button" 
                  onClick={addAmenity} 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {amenities.map(a => (
                  <span key={a} className={`text-xs border rounded-lg px-2 py-1 flex items-center gap-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                    {a}
                    <button 
                      type="button" 
                      onClick={() => removeAmenity(a)} 
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>New Images (max 10)</label>
                <input 
                  ref={imgInputRef} 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={onImages} 
                  className="mt-1 w-full" 
                />
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Selected: {images.length} new images
                </div>
                {existingImages.length > 0 && (
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Current: {existingImages.length} images
                  </div>
                )}
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>New Videos (max 3)</label>
                <input 
                  ref={vidInputRef} 
                  type="file" 
                  multiple 
                  accept="video/*" 
                  onChange={onVideos} 
                  className="mt-1 w-full" 
                />
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Selected: {videos.length} new videos
                </div>
                {existingVideos.length > 0 && (
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Current: {existingVideos.length} videos
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className={`px-6 py-2 rounded-lg border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition-colors`}
              >
                Cancel
              </button>
              <button 
                disabled={loading} 
                type="submit" 
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UpdateRoom
