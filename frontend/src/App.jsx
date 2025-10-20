import React from 'react'
import CreateRoom from './components/owner/forum/createRoom'
import OwnerAdmin from './pages/owner/OwnerAdmin'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'



const App = () => {
  const router = createBrowserRouter([
   
    {
      path:"/create-room", 
      element: <CreateRoom />
    },
    {
      path:"/owner-admin",
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
