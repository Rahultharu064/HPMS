import React, { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Banknote, Calendar, CreditCard, User, Search, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { paymentService } from '../../../services/paymentService'

const Payments = ({ darkMode }) => {
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    })
    const [filters, setFilters] = useState({
        status: '',
        method: '',
        startDate: '',
        endDate: ''
    })

    // Fetch payments
    const fetchPayments = async (page = 1) => {
        try {
            setLoading(true)
            setError(null)
            const params = {
                page,
                limit: pagination.limit,
                ...filters
            }
            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key]
            })

            const data = await paymentService.getAllPayments(params)
            setPayments(data.payments || [])
            setPagination(data.pagination)
        } catch (err) {
            setError(err.message || 'Failed to fetch payments')
            console.error('Error fetching payments:', err)
        } finally {
            setLoading(false)
        }
    }

    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target
        setFilters(prev => ({ ...prev, [name]: value }))
    }

    // Apply filters
    const handleApplyFilters = () => {
        fetchPayments(1)
    }

    // Reset filters
    const handleResetFilters = () => {
        setFilters({
            status: '',
            method: '',
            startDate: '',
            endDate: ''
        })
        setTimeout(() => fetchPayments(1), 0)
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700'
            case 'pending': return 'bg-yellow-100 text-yellow-700'
            case 'failed': return 'bg-red-100 text-red-700'
            case 'refunded': return 'bg-purple-100 text-purple-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    // Fetch on mount
    useEffect(() => {
        fetchPayments()
    }, [])

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                                <option value="">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Method</label>
                            <select
                                name="method"
                                value={filters.method}
                                onChange={handleFilterChange}
                                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                                <option value="">All Methods</option>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="khalti">Khalti</option>
                                <option value="esewa">eSewa</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleApplyFilters}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Filter size={16} />
                            Filter
                        </button>
                        <button
                            onClick={handleResetFilters}
                            className={`px-4 py-2 border rounded-lg ${darkMode
                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                } transition-colors`}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Payment History
                        <span className={`ml-2 text-sm font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            ({pagination.total} records)
                        </span>
                    </h3>
                    <button
                        onClick={() => fetchPayments(pagination.page)}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${darkMode
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            } transition-colors disabled:opacity-50`}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <span className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading payments...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className={`text-red-500 mb-4`}>{error}</p>
                        <button
                            onClick={() => fetchPayments(pagination.page)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>ID</th>
                                        <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Guest / Ref</th>
                                        <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Amount</th>
                                        <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Method</th>
                                        <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Date</th>
                                        <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Type</th>
                                        <th className={`text-left py-4 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-semibold`}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-12">
                                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No payments found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((payment) => {
                                            const guestName = payment.booking?.guest
                                                ? `${payment.booking.guest.firstName} ${payment.booking.guest.lastName}`
                                                : payment.serviceOrder?.guest
                                                    ? `${payment.serviceOrder.guest.firstName} ${payment.serviceOrder.guest.lastName}`
                                                    : 'Unknown Guest';

                                            const refId = payment.bookingId ? `Booking #${payment.bookingId}` : payment.serviceOrderId ? `Order #${payment.serviceOrderId}` : 'N/A';

                                            return (
                                                <tr
                                                    key={payment.id}
                                                    className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                                                >
                                                    <td className="py-4 px-4">
                                                        <span className={`font-mono text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            #{payment.id}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div>
                                                            <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {guestName}
                                                            </div>
                                                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                {refId}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-1">

                                                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                NPR {Number(payment.amount).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                                                            <span className={`capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {payment.method}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                                {formatDate(payment.createdAt)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${payment.bookingId
                                                            ? (darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700')
                                                            : (darkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700')
                                                            }`}>
                                                            {payment.bookingId ? 'Booking' : 'Service'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex justify-between items-center mt-6">
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Showing page {pagination.page} of {pagination.totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchPayments(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className={`px-3 py-1 rounded-lg border ${darkMode
                                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:text-gray-600'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400'
                                            } disabled:cursor-not-allowed`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => fetchPayments(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className={`px-3 py-1 rounded-lg border ${darkMode
                                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:text-gray-600'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400'
                                            } disabled:cursor-not-allowed`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Payments
