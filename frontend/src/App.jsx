import React from 'react'
import CreateRoom from './components/owner/forum/createRoom'
import OwnerAdmin from './pages/owner/OwnerAdmin'
import Home from './pages/publicwebsite/Home'
import Rooms from './pages/publicwebsite/Rooms'
import RoomDetail from './pages/publicwebsite/RoomDetail'
import About from './pages/publicwebsite/About'
import Contact from './pages/publicwebsite/Contact'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'



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
