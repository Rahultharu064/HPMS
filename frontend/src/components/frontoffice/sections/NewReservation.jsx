import React, { useState } from 'react'

const steps = ['Guest Info', 'Stay Details', 'Payment', 'Rate & Package', 'Room Selection']

const NewReservation = () => {
  const [active, setActive] = useState(0)
  const next = () => setActive(Math.min(active + 1, steps.length - 1))
  const back = () => setActive(Math.max(active - 1, 0))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">New Reservation</h2>

      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-2 rounded-full ${i <= active ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <p className={`text-xs mt-2 ${i === active ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>{s}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-64">
        {active === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
        )}

        {active === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Adults</label>
              <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Children</label>
              <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
        )}

        {active === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Cash</option>
                <option>Card</option>
                <option>Khalti</option>
                <option>eSewa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Discount</label>
              <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
        )}

        {active === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rate Plan</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Standard</option>
                <option>Non-refundable</option>
                <option>Breakfast Included</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Package</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Room Only</option>
                <option>Room + Dinner</option>
              </select>
            </div>
          </div>
        )}

        {active === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="border rounded-xl p-3 hover:shadow cursor-pointer">
                <div className="w-full h-24 bg-gray-100 rounded-md mb-2"></div>
                <p className="text-sm font-medium text-gray-900">Deluxe Room {i}</p>
                <p className="text-xs text-gray-500">₹8,500 / night</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={back} disabled={active===0} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 disabled:opacity-50">Back</button>
        <button onClick={next} disabled={active===steps.length-1} className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}

export default NewReservation


