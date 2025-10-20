import React from 'react'
import { Wifi, Car, Coffee, Dumbbell, Shield, Clock, Star, Award } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: Wifi,
      title: 'Free WiFi',
      description: 'High-speed internet throughout the hotel'
    },
    {
      icon: Car,
      title: 'Free Parking',
      description: 'Complimentary valet parking service'
    },
    {
      icon: Coffee,
      title: 'Free Breakfast',
      description: 'Complimentary breakfast for all guests'
    },
    {
      icon: Dumbbell,
      title: 'Fitness Center',
      description: 'State-of-the-art gym facilities'
    },
    {
      icon: Shield,
      title: '24/7 Security',
      description: 'Round-the-clock security and safety'
    },
    {
      icon: Clock,
      title: '24/7 Concierge',
      description: 'Always available to assist you'
    }
  ]

  const stats = [
    { number: '500+', label: 'Happy Guests', icon: Star },
    { number: '50+', label: 'Luxury Rooms', icon: Award },
    { number: '15+', label: 'Years Experience', icon: Clock },
    { number: '4.8', label: 'Average Rating', icon: Star }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-4 py-2 mb-4">
            <Award className="fill-current" size={16} />
            <span className="font-semibold">Why Choose Us</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Exceptional Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We are committed to providing world-class hospitality with attention to every detail, 
            ensuring your stay is nothing short of extraordinary.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div key={index} className="group text-center p-8 rounded-2xl hover:bg-gray-50 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Our Achievements</h3>
            <p className="text-xl text-blue-100">
              Numbers that speak for our commitment to excellence
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="text-white" size={32} />
                  </div>
                  <div className="text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-blue-100 font-semibold">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
