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
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Guests from './components/frontoffice/sections/Guests'
import GuestProfilePage from './components/frontoffice/sections/GuestProfilePage'
import Dashboard from './components/frontoffice/sections/Dashboard'
import Reservations from './components/frontoffice/sections/Reservations'
import OfflineReservation from './components/frontoffice/sections/OfflineReservation'
import RoomStatus from './components/frontoffice/sections/RoomStatus'
import CheckInOut from './components/frontoffice/sections/CheckInOut'
import Billing from './components/frontoffice/sections/Billing'
import Reports from './components/frontoffice/sections/Reports'
import ReservationDetail from './components/frontoffice/sections/ReservationDetail'



const App = () => {
  const RedirectLegacyFrontOffice = () => {
    const location = useLocation()
    const to = location.pathname.replace(/^\/frontoffice/, '/front-office') + location.search
    return <Navigate to={to} replace />
  }
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
      element: <FrontOffice />,
      children: [
        { index: true, element: <Navigate to="/front-office/dashboard" replace /> },
        { path: "dashboard", element: <Dashboard /> },
        { path: "reservations", element: <Reservations /> },
        { path: "reservations/:id", element: <ReservationDetail /> },
        { path: "new-reservation", element: <OfflineReservation /> },
        { path: "rooms", element: <RoomStatus /> },
        { path: "checkin", element: <CheckInOut /> },
        { path: "billing", element: <Billing /> },
        { path: "guests", element: <Guests /> },
        { path: "reports", element: <Reports /> }
      ]
    },
    // Legacy alias: /frontoffice -> /front-office (with subpaths)
    { path: "/frontoffice", element: <Navigate to="/front-office" replace /> },
    { path: "/frontoffice/*", element: <RedirectLegacyFrontOffice /> },
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
