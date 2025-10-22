import React from 'react'
import CreateRoom from './components/owner/forum/createRoom'
import OwnerAdmin from './pages/owner/OwnerAdmin'
import Home from './pages/Publicwebsite/Home'
import PublicRooms from './pages/Publicwebsite/Rooms'
import PublicFacilities from './pages/Publicwebsite/Facilities'
import OwnerRooms from './components/owner/sections/Rooms'
import Facilities from './components/owner/sections/Facilities'
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
import OTA from './components/owner/sections/OTA'
import HousekeepingDashboard from './pages/housekeeping/HousekeepingDashboard'
import HKDashboard from './components/housekeeping/sections/Dashboard'
import HKRooms from './components/housekeeping/sections/Rooms'
import HKSchedule from './components/housekeeping/sections/Schedule'
import HKStaff from './components/housekeeping/sections/Staff'
import HKSettings from './components/housekeeping/sections/Settings'
import HKTasks from './components/housekeeping/sections/Tasks'


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
    // Housekeeping Dashboard
    {
      path: "/housekeeping",
      element: <HousekeepingDashboard />,
      children: [
        { index: true, element: <Navigate to="/housekeeping/dashboard" replace /> },
        { path: "dashboard", element: <HKDashboard /> },
        { path: "tasks", element: <HKTasks /> },
        { path: "rooms", element: <HKRooms /> },
        { path: "schedule", element: <HKSchedule /> },
        { path: "staff", element: <HKStaff /> },
        { path: "settings", element: <HKSettings /> }
      ]
    },
    {
      path: "/rooms",
      element: <PublicRooms />
    },
    {
      path: "/facilities",
      element: <PublicFacilities />
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
      path: "/owner-admin",
      element: <OwnerAdmin />,
      
      children: [
        { index: true, element: <Navigate to="/owner-admin/create-room" replace /> },
        { path: "create-room", element: <CreateRoom /> },
        { path: "ota", element: <OTA /> },
        { path: "owneroom", element: <OwnerRooms /> },
        { path: "facilities", element: <Facilities /> }
      ]
    },
    //frontoffice routes
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

