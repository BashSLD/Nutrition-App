import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [lastRegistro, setLastRegistro] = useState(null)
  const [diasSinRegistro, setDiasSinRegistro] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('registros')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setLastRegistro(data)
          const diff = Math.floor((new Date() - new Date(data.fecha)) / (1000 * 60 * 60 * 24))
          setDiasSinRegistro(diff)
        }
      })
  }, [user])

  const isEimy = profile?.theme === 'eimy'
  const nombre = profile?.name || (isEimy ? 'Eimy' : 'Bash')

  const navCards = [
    { label: 'Mi plan', icon: '🥗', path: '/plan', desc: 'Comidas, jugos y macros' },
    { label: 'Lista de compras', icon: '🛒', path: '/lista', desc: 'Semanal + reposición fresca' },
    { label: 'Seguimiento', icon: '📊', path: '/seguimiento', desc: 'Peso, medidas y gráficas' },
  ]

  return (
    <div className="page home-page">
      <div className="home-header">
        <h1 className="home-greeting">
          {isEimy ? '✨ Hola, ' : 'Hola, '}{nombre}
        </h1>
        <p className="home-sub">
          Meta: <strong>{profile?.meta_kcal || '—'} kcal/día</strong>
        </p>
      </div>

      {diasSinRegistro !== null && diasSinRegistro >= 7 && (
        <div className="home-alert" onClick={() => navigate('/seguimiento')}>
          ⚠️ Llevas {diasSinRegistro} días sin registrar tu peso — <span>registrar ahora →</span>
        </div>
      )}

      {lastRegistro && (
        <div className="home-last-registro">
          <div className="hlr-label">Último registro</div>
          <div className="hlr-row">
            <div className="hlr-stat">
              <div className="hlr-val">{lastRegistro.peso_kg} kg</div>
              <div className="hlr-key">Peso</div>
            </div>
            {lastRegistro.cintura_cm && (
              <div className="hlr-stat">
                <div className="hlr-val">{lastRegistro.cintura_cm} cm</div>
                <div className="hlr-key">Cintura</div>
              </div>
            )}
            <div className="hlr-stat">
              <div className="hlr-val">{diasSinRegistro === 0 ? 'Hoy' : `Hace ${diasSinRegistro}d`}</div>
              <div className="hlr-key">Fecha</div>
            </div>
          </div>
        </div>
      )}

      <div className="home-nav-grid">
        {navCards.map(card => (
          <div key={card.path} className="home-nav-card" onClick={() => navigate(card.path)}>
            <span className="hnc-icon">{card.icon}</span>
            <div className="hnc-label">{card.label}</div>
            <div className="hnc-desc">{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
