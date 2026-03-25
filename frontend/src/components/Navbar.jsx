// Navbar.jsx
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import s from '../styles/Navbar.module.css'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout, refreshProfile } = useAuth()
  const isEimy = profile?.theme === 'eimy'

  const links = [
    { path: '/',            icon: isEimy ? '🏠' : '⌂',  label: 'Inicio' },
    { path: '/plan',        icon: '🥗',                   label: 'Plan' },
    { path: '/lista',       icon: '🛒',                   label: 'Lista' },
    { path: '/seguimiento', icon: '📊',                   label: 'Progreso' },
  ]

  async function toggleTheme() {
    if (!user) return
    const newTheme = isEimy ? 'bash' : 'eimy'
    await supabase.from('profiles').update({ theme: newTheme }).eq('id', user.id)
    await refreshProfile()
  }

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
      <button className={s.navItem} onClick={toggleTheme} title="Cambiar tema (Dev)">
        <span className={s.navIcon}>🎨</span>
        <span className={s.navLabel}>Tema</span>
      </button>
      <button className={s.navItem} onClick={logout}>
        <span className={s.navIcon}>↩</span>
        <span className={s.navLabel}>Salir</span>
      </button>
    </nav>
  )
}
