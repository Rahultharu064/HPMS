import React, { useEffect, useState } from 'react'
import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'
import { facilityService } from '../../services/facilityService'
import { buildMediaUrl } from '../../utils/media'

const Facilities = () => {
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await facilityService.getFacilities()
        setFacilities(res.data || [])
      } catch (e) {
        setError(e.message || 'Failed to load facilities')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      <Header />
      <section className="pt-24 pb-12 bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Facilities</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">Explore the amenities that make your stay comfortable and memorable.</p>
        </div>
      </section>

      <main className="py-16">
        <div className="container mx-auto px-4">
          {loading && <div className="py-16 text-center text-gray-500">Loading facilities...</div>}
          {error && !loading && <div className="py-8 text-center text-red-500">{error}</div>}
          {!loading && facilities.length === 0 && (
            <div className="py-16 text-center text-gray-500">No facilities available right now</div>
          )}
          {!loading && facilities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {facilities.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                  <div className="h-52 bg-gray-100">
                    <img src={buildMediaUrl(f.images?.[0]?.url) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'} alt={f.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{f.name}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-3">{f.description}</p>
                    <div className="text-sm text-gray-500">{f.openingHours || 'Hours: N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Facilities
