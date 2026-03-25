import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './hooks/useAuth'
import Login from './pages/Login'
import Home from './pages/Home'
import Plan from './pages/Plan'
import Lista from './pages/Lista'
import Seguimiento from './pages/Seguimiento'
import Onboarding from './pages/Onboarding'
import Navbar from './components/Navbar'

// Temas por usuario
import './styles/global.css'

function ProtectedRoute({ children }) {
  const { user, profile, loading, refreshProfile } = useAuth()
  if (loading) return <div className="loading">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Onboarding user={user} onComplete={refreshProfile} />
  return children
}

function AppLayout({ children }) {
  const { profile } = useAuth()
  const theme = profile?.theme || 'bash'

  return (
    <div className={`app theme-${theme}`} data-theme={theme}>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><Home /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/plan" element={
          <ProtectedRoute>
            <AppLayout><Plan /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/lista" element={
          <ProtectedRoute>
            <AppLayout><Lista /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/seguimiento" element={
          <ProtectedRoute>
            <AppLayout><Seguimiento /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}
