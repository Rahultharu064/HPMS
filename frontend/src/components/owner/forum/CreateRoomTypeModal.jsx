import React, { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { roomTypeService } from '../../../services/roomTypeService'

const CreateRoomTypeModal = ({ onClose, onSuccess, darkMode = false }) => {
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error('Room type name is required')
            return
        }
        if (!code.trim()) {
            toast.error('Room type code is required')
            return
        }

        try {
            setLoading(true)
            const res = await roomTypeService.createRoomType({ name, code })
            toast.success('Room type created successfully')
            if (onSuccess) onSuccess(res) // Pass the created object back
            onClose()
        } catch (error) {
            toast.error(error.message || 'Failed to create room type')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full max-w-md rounded-2xl shadow-xl overflow-hidden`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold">Create Room Type</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Room Type Name</label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Deluxe Suite"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Room Type Code (3 letters)</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 3))}
                            placeholder="e.g., DEL"
                            maxLength={3}
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Unique 3-letter code for room numbering</p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-6 py-2.5 rounded-xl font-medium border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                                } transition-colors`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateRoomTypeModal
