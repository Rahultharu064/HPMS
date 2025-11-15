import React from 'react'
import CreateRoom from './components/owner/forum/createRoom'
import OwnerAdmin from './pages/owner/OwnerAdmin'
import Home from './pages/Publicwebsite/Home'
import PublicRooms from './pages/Publicwebsite/Rooms'
import PublicFacilities from './pages/Publicwebsite/Facilities'
import OwnerRooms from './components/owner/sections/Rooms'
import RoomTypes from './components/owner/sections/RoomTypes'
import Facilities from './components/owner/sections/Facilities'
import ExtraServicesAdmin from './components/owner/sections/ExtraServicesAdmin'
import RoomDetail from './pages/Publicwebsite/RoomDetail'
import BookingForm from './pages/Publicwebsite/BookingForm'
import BookingConfirmation from './pages/Publicwebsite/BookingConfirmation'
import BookingSuccess from './pages/Publicwebsite/BookingSuccess'
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
import RoomAvailability from './components/frontoffice/sections/RoomAvailability'
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
import HKReports from './components/housekeeping/sections/Reports'
import HKSettings from './components/housekeeping/sections/Settings'
import Register from './components/auth/Register'
import Login from './components/auth/Login'
import AdminLogin from './components/auth/AdminLogin'
import StaffLogin from './components/auth/StaffLogin'
import HousekeepingLogin from './components/auth/HousekeepingLogin'
import StaffChangePassword from './pages/StaffChangePassword'
import GuestProfile from './pages/Publicwebsite/GuestProfile'
import Users from './components/owner/sections/Users'
import OwnerDashboard from './components/owner/sections/Dashboard'
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute'
import ProtectedStaffRoute from './components/auth/ProtectedStaffRoute'
import ProtectedHousekeepingRoute from './components/auth/ProtectedHousekeepingRoute'
import Staff from './components/owner/sections/Staff'



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
      element: <ProtectedHousekeepingRoute><HousekeepingDashboard /></ProtectedHousekeepingRoute>,
      children: [
        { index: true, element: <Navigate to="/housekeeping/dashboard" replace /> },
        { path: "dashboard", element: <HKDashboard /> },

        { path: "rooms", element: <HKRooms /> },
        { path: "schedule", element: <HKSchedule /> },
        { path: "staff", element: <HKStaff /> },
        { path: "reports", element: <HKReports /> },
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
      path: "/booking",
      element: <BookingForm />
    },
    {
      path: "/booking/confirm/:id",
      element: <BookingConfirmation />
    },
    {
      path: "/booking/success/:id",
      element: <BookingSuccess />
    },
    {
      path: "/register",
      element: <Register />
    },
    {
      path: "/login",
      element: <Login />
    },
    {
      path: "/admin/login",
      element: <AdminLogin />
    },
    {
      path: "/staff/login",
      element: <StaffLogin />
    },
    {
      path: "/staff/change-password",
      element: <StaffChangePassword />
    },
    {
      path: "/housekeeping/login",
      element: <HousekeepingLogin />
    },
    {
      path: "/profile/:id",
      element: <GuestProfile />
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
      element: <ProtectedAdminRoute><OwnerAdmin /></ProtectedAdminRoute>,

      children: [
        { index: true, element: <Navigate to="/owner-admin/dashboard" replace /> },
        {path:"dashboard", element: <OwnerDashboard /> },
        { path: "create-room", element: <CreateRoom /> },
        { path: "ota", element: <OTA /> },
        { path: "owneroom", element: <OwnerRooms /> },
        { path: "room-types", element: <RoomTypes /> },
        { path: "facilities", element: <Facilities /> },
        { path: "extra-services", element: <ExtraServicesAdmin /> },
        {path: "users", element: <Users />},
        {path: "staff", element :<Staff />}
      ]
    },
    //frontoffice routes
    {
      path: "/front-office",
      element: <ProtectedStaffRoute><FrontOffice /></ProtectedStaffRoute>,
      children: [
        { index: true, element: <Navigate to="/front-office/dashboard" replace /> },
        { path: "dashboard", element: <Dashboard /> },
        { path: "reservations", element: <Reservations /> },
        { path: "reservations/:id", element: <ReservationDetail /> },
        { path: "new-reservation", element: <OfflineReservation /> },
        { path: "rooms", element: <RoomStatus /> },
        { path: "room-availability", element: <RoomAvailability /> },
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

