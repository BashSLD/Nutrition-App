// Navbar.jsx
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, logout } = useAuth()
  const isEimy = profile?.theme === 'eimy'

  const links = [
    { path: '/',            icon: isEimy ? '🏠' : '⌂',  label: 'Inicio' },
    { path: '/plan',        icon: '🥗',                   label: 'Plan' },
    { path: '/lista',       icon: '🛒',                   label: 'Lista' },
    { path: '/seguimiento', icon: '📊',                   label: 'Progreso' },
  ]

  return (
    <nav className="navbar">
      {links.map(l => (
        <button
          key={l.path}
          className={`nav-item ${location.pathname === l.path ? 'active' : ''}`}
          onClick={() => navigate(l.path)}
        >
          <span className="nav-icon">{l.icon}</span>
          <span className="nav-label">{l.label}</span>
        </button>
      ))}
      <button className="nav-item nav-logout" onClick={logout}>
        <span className="nav-icon">↩</span>
        <span className="nav-label">Salir</span>
      </button>
    </nav>
  )
}
