import React, { useState, useEffect } from 'react'
import { CreditCard, Smartphone, Banknote, Shield } from 'lucide-react'
import { paymentService } from '../../services/paymentService'

const PaymentOptions = ({ value, onChange, gateways = [] }) => {
  const [loading, setLoading] = useState(false)
  const [availableGateways, setAvailableGateways] = useState(gateways)

  // Keep internal state in sync with prop updates
  useEffect(() => {
    setAvailableGateways(gateways)
  }, [gateways])

  // If no gateways were provided, fetch from backend
  useEffect(() => {
    if (!gateways || gateways.length === 0) {
      fetchGateways()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchGateways = async () => {
    try {
      setLoading(true)
      const response = await paymentService.getGateways()
      setAvailableGateways(response.gateways || [])
    } catch (error) {
      console.error('Error fetching gateways:', error)
      // Fallback to default gateways
      setAvailableGateways([
        { code: 'khalti', name: 'Khalti', description: 'Pay with Khalti', enabled: true },
        { code: 'esewa', name: 'eSewa', description: 'Pay with eSewa', enabled: true },
        { code: 'card', name: 'Credit/Debit Card', description: 'Pay with card', enabled: true },
        { code: 'cash', name: 'Cash', description: 'Pay at property', enabled: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getGatewayIcon = (code) => {
    const icons = {
      'cash': Banknote,
      'card': CreditCard
    }
    return icons[code] || CreditCard
  }

  const getGatewayImage = (code) => {
    // Removed image support for khalti and esewa to use styled text instead
    return null
  }

  const getGatewayColor = (code) => {
    const colors = {
      'khalti': 'bg-purple-100 text-purple-600 border-purple-200',
      'esewa': 'bg-blue-100 text-blue-600 border-blue-200',
      'cash': 'bg-green-100 text-green-600 border-green-200',
      'card': 'bg-gray-100 text-gray-600 border-gray-200'
    }
    return colors[code] || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const handleGatewayChange = (gatewayCode) => {
    if (onChange) {
      onChange(gatewayCode)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading payment options...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableGateways.map((gateway) => {
          if (!gateway.enabled) return null
          
          const IconComponent = getGatewayIcon(gateway.code)
          const colorClass = getGatewayColor(gateway.code)
          const isSelected = value === gateway.code
          
          return (
            <div
              key={gateway.code}
              className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleGatewayChange(gateway.code)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {gateway.code === 'khalti' ? (
                    <span className="text-2xl font-bold text-purple-600">Khalti</span>
                  ) : gateway.code === 'esewa' ? (
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-base"
                        style={{ backgroundColor: '#60BB46' }}
                      >
                        e
                      </div>
                      <span className="text-lg font-normal text-black" style={{ fontFamily: 'Arial, sans-serif' }}>Sewa</span>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold text-gray-900">{gateway.name}</h4>
                      <p className="text-sm text-gray-600">{gateway.description}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={gateway.code}
                    checked={isSelected}
                    onChange={() => handleGatewayChange(gateway.code)}
                    className="w-2 h-2 text-blue-600 border-gray-200 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Security badge for online payments */}
              {(gateway.code === 'khalti' || gateway.code === 'esewa' || gateway.code === 'card') && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Shield size={12} />
                    <span>Secure</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment method descriptions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Payment Information</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-green-600" />
            <span>All payments are processed securely</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-blue-600" />
            <span>Online payments are encrypted and protected</span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote size={16} className="text-green-600" />
            <span>Cash payments can be made at the property</span>
          </div>
        </div>
      </div>

      {/* Selected payment method details */}
      {value && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Selected Payment Method</h4>
          <p className="text-sm text-blue-700">
            {availableGateways.find(g => g.code === value)?.description}
          </p>
          {value === 'cash' && (
            <p className="text-xs text-blue-600 mt-1">
              You can pay in cash upon arrival at the hotel.
            </p>
          )}
          {(value === 'khalti' || value === 'esewa') && (
            <p className="text-xs text-blue-600 mt-1">
              You will be redirected to the secure payment page.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default PaymentOptions
