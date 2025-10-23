import React from 'react'
import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'
import Hero from '../../components/Publicwebsite/sections/Hero'
import FeaturedRooms from '../../components/Publicwebsite/sections/FeaturedRooms'
import Features from '../../components/Publicwebsite/sections/Features'
import Testimonials from '../../components/Publicwebsite/sections/Testimonials'

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
