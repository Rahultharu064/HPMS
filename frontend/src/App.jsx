import React from 'react'
import CreateRoom from './components/owner/forum/createRoom'
import OwnerAdmin from './pages/owner/OwnerAdmin'
import Home from './pages/Publicwebsite/Home'
import Rooms from './pages/Publicwebsite/Rooms'
import RoomDetail from './pages/Publicwebsite/RoomDetail'
import BookingForm from './pages/Publicwebsite/BookingForm'
import BookingConfirmation from './pages/Publicwebsite/BookingConfirmation'
import About from './pages/Publicwebsite/About'
import Contact from './pages/Publicwebsite/Contact'
import FrontOffice from './pages/frontoffice/FrontOffice'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Guests from './components/frontoffice/sections/Guests'
import GuestProfilePage from './components/frontoffice/sections/GuestProfilePage'



const App = () => {
  const router = createBrowserRouter([
    // Public Website Routes
    {
      path: "/",
      element: <Home />
    },
    {
      path: "/rooms",
      element: <Rooms />
    },
    {
      path: "/rooms/:id",
      element: <RoomDetail />
    },
    {
      path: "/rooms/:roomId/book",
      element: <BookingForm />
    },
    {
      path: "/booking/confirm/:id",
      element: <BookingConfirmation />
    },
    {
      path: "/guest/profile",
      element: <Guests />
    },
    {
      path: "/about",
      element: <About />
    },
    {
      path: "/contact",
      element: <Contact />
    },
    // Owner Admin Routes
    {
      path: "/create-room", 
      element: <CreateRoom />
    },
    {
      path: "/owner-admin",
      element: <OwnerAdmin />
    },
    {
      path: "/front-office",
      element: <FrontOffice />
    },
    {
      path: "/frontoffice/guests/:id",
      element: <GuestProfilePage />
    }
  ])
  return (
   <>
     <RouterProvider router={router} />
      <Toaster position="top-center" reverseOrder={false} />
   </>
  )
}

export default App
