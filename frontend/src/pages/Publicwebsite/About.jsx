import React from 'react'
import Header from '../../components/Publicwebsite/Layout/Header'
import Footer from '../../components/Publicwebsite/Layout/Footer'
import { Award, Users, Clock, Star, Heart, Shield, Coffee, Car } from 'lucide-react'

const About = () => {
  const stats = [
    { icon: Users, number: '500+', label: 'Happy Guests' },
    { icon: Award, number: '15+', label: 'Years Experience' },
    { icon: Star, number: '4.8', label: 'Average Rating' },
    { icon: Heart, number: '100%', label: 'Satisfaction Rate' }
  ]

  const values = [
    {
      icon: Heart,
      title: 'Hospitality',
      description: 'We treat every guest like family, ensuring their comfort and satisfaction is our top priority.'
    },
    {
      icon: Shield,
      title: 'Excellence',
      description: 'We maintain the highest standards in everything we do, from service to facilities.'
    },
    {
      icon: Coffee,
      title: 'Warmth',
      description: 'Our team brings genuine warmth and care to every interaction with our guests.'
    },
    {
      icon: Car,
      title: 'Innovation',
      description: 'We continuously innovate to provide modern amenities while preserving traditional values.'
    }
  ]

  const team = [
    {
      name: 'Rajesh Sharma',
      position: 'General Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      experience: '15+ years'
    },
    {
      name: 'Priya Singh',
      position: 'Head of Operations',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      experience: '12+ years'
    },
    {
      name: 'Aarav Patel',
      position: 'Guest Relations Manager',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      experience: '8+ years'
    }
  ]

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-900 to-purple-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">About HamroStay</h1>
            <p className="text-xl text-white/90">
              Discover our story of hospitality, excellence, and commitment to creating 
              unforgettable experiences for our guests.
            </p>
          </div>
        </div>
      </section>

      <main>
        {/* Our Story */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-4 py-2 mb-6">
                  <Clock className="fill-current" size={16} />
                  <span className="font-semibold">Our Story</span>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  A Legacy of Hospitality
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Founded in 2008, HamroStay has been at the forefront of luxury hospitality 
                  in Nepal. What started as a small family business has grown into one of 
                  the most prestigious hotels in Kathmandu, known for its exceptional service 
                  and warm Nepali hospitality.
                </p>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Our journey has been marked by continuous innovation, attention to detail, 
                  and an unwavering commitment to providing our guests with experiences that 
                  exceed their expectations. We believe that true luxury lies not just in 
                  beautiful spaces, but in the genuine care and attention we provide to every guest.
                </p>
                <div className="flex gap-4">
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                    Our History
                  </button>
                  <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all">
                    Awards & Recognition
                  </button>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                  alt="Hotel Exterior"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Award className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">15+</div>
                      <div className="text-gray-600">Years of Excellence</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="text-white" size={32} />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                    <div className="text-gray-600 font-semibold">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-600 rounded-full px-4 py-2 mb-4">
                <Heart className="fill-current" size={16} />
                <span className="font-semibold">Our Values</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                What Drives Us
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our core values guide everything we do and shape the experience 
                we create for our guests.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon
                return (
                  <div key={index} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <IconComponent className="text-white" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Our Team */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-600 rounded-full px-4 py-2 mb-4">
                <Users className="fill-current" size={16} />
                <span className="font-semibold">Our Team</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Meet Our Leaders
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our experienced team is dedicated to providing exceptional service 
                and creating memorable experiences for our guests.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-6 object-cover"
                  />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-2">{member.position}</p>
                  <p className="text-gray-600">{member.experience} experience</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Experience Our Hospitality
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Book your stay with us and discover why we're considered one of 
              the best hotels in Kathmandu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all hover:scale-105">
                Book Now
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all">
                Contact Us
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default About
