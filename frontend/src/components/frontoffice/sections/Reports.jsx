import React, { useEffect, useState } from 'react'

const Reports = () => {
  const [summary, setSummary] = useState({ arrivals: 0, departures: 0, revenue: 0, occupancy: 0 })

  useEffect(() => {
    // TODO: fetch report summary
    setSummary({ arrivals: 12, departures: 8, revenue: 245000, occupancy: 82 })
  }, [])

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Reconciliation</h3>
        <div className="h-48 bg-gray-50 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-gray-400">Chart Placeholder</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Breakdown</h3>
          <div className="h-40 bg-gray-50 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-gray-400">Bar Chart Placeholder</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Source Analysis</h3>
          <div className="h-40 bg-gray-50 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-gray-400">Pie Chart Placeholder</div>
        </div>
      </div>
    </div>
  )
}

export default Reports


