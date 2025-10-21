import React from 'react'
import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'

const GuestProfile = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-600">Guest profile coming soon. You will be able to view your details and booking history here.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default GuestProfile

