// Navbar.jsx
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import s from '../styles/Navbar.module.css'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, viewingProfile, viewingOther, toggleView, logout } = useAuth()
  const isEimy = viewingProfile?.theme === 'eimy'
  const isBash = profile?.theme === 'bash'

  const links = [
    { path: '/',            icon: isEimy ? '🏠' : '⌂',  label: 'Inicio' },
    { path: '/plan',        icon: '🥗',                   label: 'Plan' },
    { path: '/lista',       icon: '🛒',                   label: 'Lista' },
    { path: '/seguimiento', icon: '📊',                   label: 'Progreso' },
  ]


  return (
    <nav className={s.navbar}>
      {links.map(l => (
        <button
          key={l.path}
          className={`${s.navItem} ${location.pathname === l.path ? s.active : ''}`}
          onClick={() => navigate(l.path)}
        >
          <span className={s.navIcon}>{l.icon}</span>
          <span className={s.navLabel}>{l.label}</span>
        </button>
      ))}
      {isBash && (
        <button className={s.navItem} onClick={toggleView} title={viewingOther ? 'Volver a mi vista' : 'Ver datos de Eimy'}>
          <span className={s.navIcon}>{viewingOther ? '👁' : '🎨'}</span>
          <span className={s.navLabel}>{viewingOther ? 'Tú' : 'Vista'}</span>
        </button>
      )}
      <button className={s.navItem} onClick={logout}>
        <span className={s.navIcon}>↩</span>
        <span className={s.navLabel}>Salir</span>
      </button>
    </nav>
  )
}
