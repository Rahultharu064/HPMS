import React, { useState, useEffect } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { hkTaskService } from '../../../services/hkTaskService'
import { roomService } from '../../../services/roomService'

const ReportIssueModal = ({ isOpen, onClose, darkMode }) => {
    const [loading, setLoading] = useState(false)
    const [rooms, setRooms] = useState([])
    const [formData, setFormData] = useState({
        roomId: '',
        title: '',
        description: '',
        priority: 'MEDIUM'
    })

    useEffect(() => {
        if (isOpen) {
            loadRooms()
        }
    }, [isOpen])

    const loadRooms = async () => {
        try {
            const res = await roomService.getStatusMap({})
            setRooms(res.data || [])
        } catch (e) {
            console.error(e)
            toast.error('Failed to load rooms')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.roomId || !formData.title) {
            toast.error('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            await hkTaskService.create({
                roomId: Number(formData.roomId),
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                type: 'maintenance',
                status: 'NEW'
            })
            toast.success('Issue reported successfully')
            onClose()
            setFormData({
                roomId: '',
                title: '',
                description: '',
                priority: 'MEDIUM'
            })
        } catch (e) {
            console.error(e)
            toast.error('Failed to report issue')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100`}>
                <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Report Issue</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Room <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.roomId}
                            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${darkMode
                                    ? 'bg-gray-900 border-gray-700 focus:border-blue-500 text-white'
                                    : 'bg-white border-gray-200 focus:border-blue-500 text-gray-900'
                                }`}
                            required
                        >
                            <option value="">Select a room</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>
                                    #{room.roomNumber} - Floor {room.floor}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Issue Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Leaking faucet, Broken light"
                            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${darkMode
                                    ? 'bg-gray-900 border-gray-700 focus:border-blue-500 text-white placeholder-gray-500'
                                    : 'bg-white border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400'
                                }`}
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Priority
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${formData.priority === p
                                            ? p === 'URGENT' || p === 'HIGH'
                                                ? 'bg-red-500 text-white border-red-500'
                                                : 'bg-blue-500 text-white border-blue-500'
                                            : darkMode
                                                ? 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Provide more details about the issue..."
                            rows="3"
                            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all resize-none ${darkMode
                                    ? 'bg-gray-900 border-gray-700 focus:border-blue-500 text-white placeholder-gray-500'
                                    : 'bg-white border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400'
                                }`}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${darkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReportIssueModal
