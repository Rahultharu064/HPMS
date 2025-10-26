import React, { useState } from 'react'

const CouponInput = ({ couponCode, onCouponChange, onCouponApply, loading, error, success }) => {
  const [inputValue, setInputValue] = useState(couponCode || '')

  const handleApply = () => {
    if (inputValue.trim()) {
      onCouponApply(inputValue.trim().toUpperCase())
    }
  }

  const handleRemove = () => {
    setInputValue('')
    onCouponChange('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Coupon Code (Optional)
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={!inputValue.trim() || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Applying...' : 'Apply'}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {success && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm">{success}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-green-600 hover:text-green-800 text-sm underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

export default CouponInput
