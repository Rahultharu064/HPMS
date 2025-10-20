import React from 'react'
import Header from '../../components/publicwebsite/Layout/Header'
import Footer from '../../components/publicwebsite/Layout/Footer'
import Hero from '../../components/publicwebsite/sections/Hero'
import FeaturedRooms from '../../components/publicwebsite/sections/FeaturedRooms'
import Features from '../../components/publicwebsite/sections/Features'
import Testimonials from '../../components/publicwebsite/sections/Testimonials'

const Home = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedRooms />
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}

export default Home
