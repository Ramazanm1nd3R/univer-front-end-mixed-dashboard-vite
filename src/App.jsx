import React, { useState, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Outlet
} from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext.jsx'

import Header from 'Layout/Header.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import ToolsPage from './components/Pages/ToolsPage.jsx'
import DataPage from './components/Pages/DataPage.jsx'
import ProfilePage from './components/Pages/ProfilePage.jsx'
import NotFoundPage from './components/Pages/NotFoundPage.jsx'
import Login from './components/Auth/Login.jsx'
import Register from './components/Auth/Register.jsx'

import './App.css'


/**
 * ProtectedRouteWrapper
 * защищает вложенные routes
 */
function ProtectedRouteWrapper() {

  const { currentUser, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}



/**
 * Основной routing контент
 */
function AppContent({ isDarkTheme, toggleTheme }) {

  const { currentUser, loading } = useAuth()

  const navigate = useNavigate()

  const location = useLocation()


  if (loading) {
    return <div>Loading...</div>
  }


  const currentView =
    location.pathname === '/'
      ? 'dashboard'
      : location.pathname.replace('/', '')


  return (
    <>

      {/* Header только если авторизован */}
      {currentUser && (
        <Header
          onViewChange={(view) =>
            navigate(view === 'dashboard' ? '/' : `/${view}`)
          }
          currentView={currentView}
          isDarkTheme={isDarkTheme}
          toggleTheme={toggleTheme}
        />
      )}


      <main className="app-content">

        <Routes>


          {/* PUBLIC ROUTES */}

          <Route
            path="/login"
            element={
              currentUser
                ? <Navigate to="/" replace />
                : <Login />
            }
          />

          <Route
            path="/register"
            element={
              currentUser
                ? <Navigate to="/" replace />
                : <Register />
            }
          />



          {/* PROTECTED ROUTES */}

          <Route element={<ProtectedRouteWrapper />}>

            <Route path="/" element={<Dashboard />} />

            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            <Route path="/tools" element={<ToolsPage />} />

            <Route path="/data" element={<DataPage />} />

            <Route path="/profile" element={<ProfilePage />} />

          </Route>



          {/* 404 */}

          <Route path="*" element={<NotFoundPage />} />


        </Routes>

      </main>

    </>
  )
}



/**
 * Root App (Vite compatible)
 */
function App() {

  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    const themeClass = isDarkTheme ? 'dark-theme' : 'light-theme'
    const oppositeClass = isDarkTheme ? 'light-theme' : 'dark-theme'
    document.documentElement.classList.remove(oppositeClass)
    document.documentElement.classList.add(themeClass)
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  const toggleTheme = () => setIsDarkTheme(prev => !prev)

  return (

    <BrowserRouter>

      <AuthProvider>

        <div className={`App ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>

          <AppContent isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />

        </div>

      </AuthProvider>

    </BrowserRouter>

  )

}

export default App