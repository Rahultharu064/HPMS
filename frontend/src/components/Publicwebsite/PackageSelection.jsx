import React, { useState, useEffect } from 'react'
import { packageService } from '../../services/packageService'

const PackageSelection = ({ selectedPackage, onPackageSelect, roomId, checkIn, checkOut }) => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        // TODO: Implement package API call
        // const response = await roomService.getPackages()
        // setPackages(response.data.packages || [])

        // Mock data for now
        setPackages([
          {
            id: 1,
            name: 'Weekend Special',
            description: 'Special weekend rates',
            type: 'percent',
            value: 15,
            validFrom: '2024-01-01',
            validTo: '2024-12-31',
            active: true
          },
          {
            id: 2,
            name: 'Long Stay Package',
            description: 'Discount for 7+ nights',
            type: 'fixed',
            value: 500,
            validFrom: '2024-01-01',
            validTo: '2024-12-31',
            active: true
          }
        ])
      } catch (error) {
        console.error('Failed to fetch packages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPackages()
  }, [])

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const ms = new Date(checkOut) - new Date(checkIn)
    return Math.ceil(ms / (1000 * 60 * 60 * 24))
  }

  const calculateSavings = (pkg) => {
    const nights = calculateNights()
    const basePrice = 100 // TODO: Get actual room price
    const baseTotal = nights * basePrice

    if (pkg.type === 'percent') {
      return baseTotal * (pkg.value / 100)
    } else if (pkg.type === 'fixed') {
      return pkg.value
    }
    return 0
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Available Packages</h3>

      <div className="grid gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedPackage?.id === pkg.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onPackageSelect(selectedPackage?.id === pkg.id ? null : pkg)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                <div className="mt-2">
                  {pkg.type === 'percent' ? (
                    <span className="text-green-600 font-medium">{pkg.value}% off</span>
                  ) : (
                    <span className="text-green-600 font-medium">₹{pkg.value} off</span>
                  )}
                  <span className="text-sm text-gray-500 ml-2">
                    Save ₹{calculateSavings(pkg).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={selectedPackage?.id === pkg.id}
                  onChange={() => onPackageSelect(selectedPackage?.id === pkg.id ? null : pkg)}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <p className="text-gray-500 text-center py-4">No packages available for selected dates</p>
      )}
    </div>
  )
}

export default PackageSelection
