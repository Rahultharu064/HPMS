import React, { useState } from 'react'
import { Menu, X, Phone, Mail, MapPin, Star, Search, User, Heart, ShoppingCart, Home, Bed, Info, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import authService from '../../../services/authService'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Rooms', path: '/rooms', icon: Bed },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Facilities', path: '/facilities', icon: Settings },
    { name: 'Contact', path: '/contact', icon: Phone }
  ]

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-2 md:mb-0">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>+977 1-2345678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>info@hamrostay.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Kathmandu, Nepal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="fill-yellow-400 text-yellow-400" size={16} />
                <span>4.8 Rating</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-white/30"></div>
              <div className="flex items-center gap-2">
                <span>Follow us:</span>
                <div className="flex gap-2">
                  <a href="#" className="hover:text-yellow-400 transition-colors">FB</a>
                  <a href="#" className="hover:text-yellow-400 transition-colors">IG</a>
                  <a href="#" className="hover:text-yellow-400 transition-colors">TW</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      } sticky top-0`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                H
              </div>
              <div className=" px-3 py-1 rounded-lg">
                <h1 className={`text-2xl font-bold ${isScrolled ? 'text-blue-600' : 'text-blue-600'}`}>
                  HamroStay
                </h1>
                <p className={`text-sm ${isScrolled ? 'text-blue-400' : 'text-blue-400'}`}>
                  Luxury Hotel & Resort
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <button className={`p-2 rounded-full transition-colors border-2 ${
                isScrolled
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700'
                  : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600'
              }`}>
                <Search size={20} />
              </button>

              {/* User Account */}
              {authService.isAuthenticated() ? (
                <Link
                  to={`/profile`}
                  className={`p-2 rounded-full transition-colors border-2 ${
                    isScrolled
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700'
                      : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600'
                  }`}
                >
                  <User size={20} />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className={`p-2 rounded-full transition-colors border-2 ${
                    isScrolled
                      ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                >
                  <User size={20} />
                </Link>
              )}

              {/* Wishlist */}
              <button className={`p-2 rounded-full transition-colors border-2 ${
                isScrolled
                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700'
                  : 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600'
              }`}>
                <Heart size={20} />
              </button>

              {/* Book Now Button */}
              <Link
                to="/booking"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                Book Now
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-full transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white shadow-lg border-t">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="font-medium text-gray-700 hover:text-blue-600 transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  )
}

export default Header
