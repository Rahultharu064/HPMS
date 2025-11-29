import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2, RefreshCw, Tag, TrendingUp, Percent, DollarSign, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { couponService } from '../../../services/couponService'

const Coupons = ({ darkMode }) => {
    const [coupons, setCoupons] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [selectedCoupon, setSelectedCoupon] = useState(null)
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percent',
        discountValue: '',
        usageLimit: '',
        validFrom: '',
        validTo: '',
        active: true
    })
    const [saving, setSaving] = useState(false)

    // Fetch coupons and analytics
    const fetchCoupons = async () => {
        try {
            setLoading(true)
            setError(null)
            const [couponsData, analyticsData] = await Promise.all([
                couponService.getAllCoupons(),
                couponService.getAnalytics()
            ])
            setCoupons(couponsData.coupons || [])
            setAnalytics(analyticsData)
        } catch (err) {
            setError(err.message || 'Failed to fetch coupons')
            console.error('Error fetching coupons:', err)
        } finally {
            setLoading(false)
        }
    }

    // Create coupon
    const handleCreateCoupon = async () => {
        if (!formData.code.trim()) {
            toast.error('Coupon code is required')
            return
        }
        if (!formData.discountValue || formData.discountValue <= 0) {
            toast.error('Discount value must be greater than 0')
            return
        }
        if (formData.discountType === 'percent' && formData.discountValue > 100) {
            toast.error('Percentage discount cannot exceed 100%')
            return
        }
        if (!formData.validFrom || !formData.validTo) {
            toast.error('Valid from and to dates are required')
            return
        }

        try {
            setSaving(true)
            const payload = {
                ...formData,
                code: formData.code.toUpperCase(),
                discountValue: parseFloat(formData.discountValue),
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
            }
            await couponService.createCoupon(payload)
            toast.success('Coupon created successfully!')
            setShowCreateModal(false)
            resetForm()
            fetchCoupons()
        } catch (err) {
            console.error('Error creating coupon:', err)
            toast.error(err.response?.data?.error || 'Failed to create coupon')
        } finally {
            setSaving(false)
        }
    }

    // Update coupon
    const handleUpdateCoupon = async () => {
        if (!formData.code.trim()) {
            toast.error('Coupon code is required')
            return
        }
        if (!formData.discountValue || formData.discountValue <= 0) {
            toast.error('Discount value must be greater than 0')
            return
        }
        if (formData.discountType === 'percent' && formData.discountValue > 100) {
            toast.error('Percentage discount cannot exceed 100%')
            return
        }

        try {
            setSaving(true)
            const payload = {
                ...formData,
                code: formData.code.toUpperCase(),
                discountValue: parseFloat(formData.discountValue),
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
            }
            await couponService.updateCoupon(selectedCoupon.id, payload)
            toast.success('Coupon updated successfully!')
            setShowUpdateModal(false)
            setSelectedCoupon(null)
            resetForm()
            fetchCoupons()
        } catch (err) {
            console.error('Error updating coupon:', err)
            toast.error(err.response?.data?.error || 'Failed to update coupon')
        } finally {
            setSaving(false)
        }
    }

    // Delete coupon
    const handleDeleteCoupon = async (couponId) => {
        if (!window.confirm('Are you sure you want to deactivate this coupon?')) return

        try {
            await couponService.deleteCoupon(couponId)
            toast.success('Coupon deactivated successfully!')
            fetchCoupons()
        } catch (err) {
            console.error('Error deleting coupon:', err)
            toast.error(err.response?.data?.error || 'Failed to delete coupon')
        }
    }

    // Toggle coupon active status
    const handleToggleActive = async (coupon) => {
        try {
            await couponService.updateCoupon(coupon.id, { active: !coupon.active })
            toast.success(`Coupon ${!coupon.active ? 'activated' : 'deactivated'} successfully!`)
            fetchCoupons()
        } catch (err) {
            console.error('Error toggling coupon:', err)
            toast.error('Failed to update coupon status')
        }
    }

    // Open edit modal
    const handleEditCoupon = (coupon) => {
        setSelectedCoupon(coupon)
        setFormData({
            code: coupon.code || '',
            description: coupon.description || '',
            discountType: coupon.discountType || 'percent',
            discountValue: coupon.discountValue || '',
            usageLimit: coupon.usageLimit || '',
            validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
            validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().split('T')[0] : '',
            active: coupon.active !== undefined ? coupon.active : true
        })
        setShowUpdateModal(true)
    }

    // Reset form
    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            discountType: 'percent',
            discountValue: '',
            usageLimit: '',
            validFrom: '',
            validTo: '',
            active: true
        })
    }

    // Close modals
    const closeModals = () => {
        setShowCreateModal(false)
        setShowUpdateModal(false)
        setSelectedCoupon(null)
        resetForm()
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    // Check if coupon is expired
    const isExpired = (validTo) => {
        return new Date(validTo) < new Date()
    }

    // Fetch coupons on mount
    useEffect(() => {
        fetchCoupons()
    }, [])

    return (
        <div className="space-y-6">
            {/* Analytics Cards */}
            {analytics?.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'} rounded-3xl p-6 shadow-lg`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Coupons</p>
                                <p className="text-white text-3xl font-bold mt-2">{analytics.summary.totalCoupons}</p>
                            </div>
                            <Tag className="text-blue-200" size={32} />
                        </div>
                    </div>

                    <div className={`${darkMode ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-green-500 to-green-600'} rounded-3xl p-6 shadow-lg`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Active Coupons</p>
                                <p className="text-white text-3xl font-bold mt-2">{analytics.summary.activeCoupons}</p>
                            </div>
                            <ToggleRight className="text-green-200" size={32} />
                        </div>
                    </div>

                    <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-500 to-purple-600'} rounded-3xl p-6 shadow-lg`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Used</p>
                                <p className="text-white text-3xl font-bold mt-2">{analytics.summary.totalUsed}</p>
                            </div>
                            <TrendingUp className="text-purple-200" size={32} />
                        </div>
                    </div>

                    <div className={`${darkMode ? 'bg-gradient-to-br from-amber-900 to-amber-800' : 'bg-gradient-to-br from-amber-500 to-amber-600'} rounded-3xl p-6 shadow-lg`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm font-medium">Total Discount</p>
                                <p className="text-white text-3xl font-bold mt-2">₹{analytics.summary.totalDiscountGiven.toLocaleString()}</p>
                            </div>
                            <DollarSign className="text-amber-200" size={32} />
                        </div>
                    </div>
                </div>
            )}

            {/* Coupons Table */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Coupon Codes</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchCoupons()}
                            disabled={loading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${darkMode
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                } transition-colors disabled:opacity-50`}
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Add Coupon</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <span className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading coupons...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className={`text-red-500 mb-4`}>{error}</p>
                        <button
                            onClick={fetchCoupons}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Code</th>
                                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold hidden md:table-cell`}>Description</th>
                                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Discount</th>
                                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold hidden lg:table-cell`}>Valid Period</th>
                                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold hidden sm:table-cell`}>Usage</th>
                                    <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Status</th>
                                    <th className={`text-right py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12">
                                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No coupons found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.map((coupon) => {
                                        const couponAnalytics = analytics?.analytics?.find(a => a.id === coupon.id)
                                        const expired = isExpired(coupon.validTo)

                                        return (
                                            <tr
                                                key={coupon.id}
                                                className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Tag size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                                                        <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{coupon.code}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 hidden md:table-cell">
                                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-xs truncate`}>
                                                        {coupon.description || 'No description'}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1">
                                                        {coupon.discountType === 'percent' ? (
                                                            <>
                                                                <Percent size={14} className="text-green-500" />
                                                                <span className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                                    {coupon.discountValue}%
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DollarSign size={14} className="text-green-500" />
                                                                <span className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                                    ₹{coupon.discountValue}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 hidden lg:table-cell">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Calendar size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                                                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                            {formatDate(coupon.validFrom)} - {formatDate(coupon.validTo)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 hidden sm:table-cell">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {coupon.usedCount} / {coupon.usageLimit || '∞'}
                                                            </span>
                                                        </div>
                                                        {coupon.usageLimit && (
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                                                    style={{ width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${expired
                                                            ? 'bg-red-100 text-red-700'
                                                            : coupon.active
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {expired ? 'Expired' : coupon.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleToggleActive(coupon)}
                                                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                                                            title={coupon.active ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {coupon.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditCoupon(coupon)}
                                                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
                                                            title="Edit Coupon"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCoupon(coupon.id)}
                                                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-600 hover:text-red-600'} transition-colors`}
                                                            title="Delete Coupon"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Coupon Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-2xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'} max-h-[90vh] overflow-y-auto`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create Coupon</h3>
                            <button onClick={closeModals} className={`text-gray-400 hover:text-gray-600 text-2xl`}>×</button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g., SAVE20"
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Discount Type *</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    >
                                        <option value="percent">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Discount Value *</label>
                                <input
                                    type="number"
                                    value={formData.discountValue}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                                    placeholder={formData.discountType === 'percent' ? 'e.g., 20' : 'e.g., 500'}
                                    min="0"
                                    max={formData.discountType === 'percent' ? '100' : undefined}
                                    className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of the coupon"
                                    rows="3"
                                    className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Valid From *</label>
                                    <input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Valid To *</label>
                                    <input
                                        type="date"
                                        value={formData.validTo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Usage Limit (optional)</label>
                                <input
                                    type="number"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="active" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Active (coupon can be used immediately)
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={closeModals} className={`flex-1 px-4 py-2 border rounded-lg ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCoupon}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? 'Creating...' : 'Create Coupon'}
                                {saving && <Loader2 className="animate-spin" size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Coupon Modal */}
            {showUpdateModal && selectedCoupon && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-2xl shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'} max-h-[90vh] overflow-y-auto`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Update Coupon</h3>
                            <button onClick={closeModals} className={`text-gray-400 hover:text-gray-600 text-2xl`}>×</button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g., SAVE20"
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Discount Type *</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    >
                                        <option value="percent">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Discount Value *</label>
                                <input
                                    type="number"
                                    value={formData.discountValue}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                                    placeholder={formData.discountType === 'percent' ? 'e.g., 20' : 'e.g., 500'}
                                    min="0"
                                    max={formData.discountType === 'percent' ? '100' : undefined}
                                    className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of the coupon"
                                    rows="3"
                                    className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Valid From *</label>
                                    <input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Valid To *</label>
                                    <input
                                        type="date"
                                        value={formData.validTo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Usage Limit (optional)</label>
                                <input
                                    type="number"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active-update"
                                    checked={formData.active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="active-update" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Active (coupon can be used)
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={closeModals} className={`flex-1 px-4 py-2 border rounded-lg ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateCoupon}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? 'Updating...' : 'Update Coupon'}
                                {saving && <Loader2 className="animate-spin" size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Coupons
