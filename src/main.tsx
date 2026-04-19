import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from "./components/theme-provider"
import './index.css'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Onboarding from './pages/auth/Onboarding'

// Dashboard Layout & Pages
import DashboardLayout from './layouts/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import ConvertDocs from './pages/dashboard/Convert'
import Assistant from './pages/dashboard/Assistant'
import Analysis from './pages/dashboard/Analysis'
import Drive from './pages/dashboard/Drive'
import DocumentDetail from './pages/dashboard/DocumentDetail'

// Route Guards
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  
  {
    element: <PublicRoute />, 
    children: [
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
    ]
  },
  
  {
    element: <ProtectedRoute />, 
    children: [
      { path: "/onboarding", element: <Onboarding /> },
      
      // NESTED DASHBOARD ROUTES
      { 
        path: "/dashboard", 
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Overview /> },
          { path: "convert", element: <ConvertDocs /> },
          { path: "assistant", element: <Assistant /> },
          { path: "analysis", element: <Analysis /> },
          
          // Drive Routes
          { path: "drive", element: <Drive /> },
          { path: "drive/:id", element: <DocumentDetail /> } // <-- Document Detail Page
        ]
      },
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)