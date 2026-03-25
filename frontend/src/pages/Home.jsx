import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { diffDias } from '../lib/dates'

export default function Home() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [lastRegistro, setLastRegistro] = useState(null)
  const [diasSinRegistro, setDiasSinRegistro] = useState(null)
  const [showEditPerfil, setShowEditPerfil] = useState(false)
  const [editValues, setEditValues] = useState({})
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [perfilError, setPerfilError] = useState(null)

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
          setDiasSinRegistro(diffDias(data.fecha))
        }
      })
  }, [user])

  const isEimy = profile?.theme === 'eimy'
  const nombre = profile?.name || (isEimy ? 'Eimy' : 'Bash')

  function openEditPerfil() {
    setEditValues({
      peso_kg:   profile?.peso_kg   ?? '',
      altura_cm: profile?.altura_cm ?? '',
      edad:      profile?.edad      ?? '',
      meta_kcal: profile?.meta_kcal ?? '',
    })
    setShowEditPerfil(true)
  }

  async function handleSavePerfil() {
    setSavingPerfil(true)
    setPerfilError(null)
    try {
      const { error: err } = await supabase.from('profiles').update({
        peso_kg:   parseFloat(editValues.peso_kg)   || null,
        altura_cm: parseFloat(editValues.altura_cm) || null,
        edad:      parseInt(editValues.edad)         || null,
        meta_kcal: parseInt(editValues.meta_kcal)   || null,
      }).eq('id', user.id)
      if (err) throw err
      await refreshProfile()
      setShowEditPerfil(false)
    } catch {
      setPerfilError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSavingPerfil(false)
    }
  }

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

      {/* MIS DATOS */}
      <div className="home-last-registro" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="hlr-label">Mis datos</div>
          <button className="btn-edit" onClick={openEditPerfil}>✏️ Editar</button>
        </div>
        <div className="hlr-row">
          <div className="hlr-stat">
            <div className="hlr-val">{profile?.peso_kg ?? '—'} kg</div>
            <div className="hlr-key">Peso</div>
          </div>
          <div className="hlr-stat">
            <div className="hlr-val">{profile?.altura_cm ?? '—'} cm</div>
            <div className="hlr-key">Altura</div>
          </div>
          <div className="hlr-stat">
            <div className="hlr-val">{profile?.edad ?? '—'}</div>
            <div className="hlr-key">Edad</div>
          </div>
          <div className="hlr-stat">
            <div className="hlr-val">{profile?.meta_kcal ?? '—'}</div>
            <div className="hlr-key">Meta kcal</div>
          </div>
        </div>
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

      {/* MODAL EDITAR PERFIL */}
      {showEditPerfil && (
        <div className="modal-overlay" onClick={() => setShowEditPerfil(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar mis datos</h3>
              <button className="modal-close" onClick={() => setShowEditPerfil(false)}>✕</button>
            </div>
            <div className="medida-form">
              <div className="mf-grid">
                <div className="mf-field">
                  <label className="mf-label">Peso <span className="mf-unit">(kg)</span></label>
                  <input
                    type="number" step="0.1" className="mf-input"
                    value={editValues.peso_kg}
                    onChange={e => setEditValues(v => ({ ...v, peso_kg: e.target.value }))}
                  />
                </div>
                <div className="mf-field">
                  <label className="mf-label">Altura <span className="mf-unit">(cm)</span></label>
                  <input
                    type="number" className="mf-input"
                    value={editValues.altura_cm}
                    onChange={e => setEditValues(v => ({ ...v, altura_cm: e.target.value }))}
                  />
                </div>
                <div className="mf-field">
                  <label className="mf-label">Edad <span className="mf-unit">(años)</span></label>
                  <input
                    type="number" className="mf-input"
                    value={editValues.edad}
                    onChange={e => setEditValues(v => ({ ...v, edad: e.target.value }))}
                  />
                </div>
                <div className="mf-field">
                  <label className="mf-label">Meta <span className="mf-unit">(kcal/día)</span></label>
                  <input
                    type="number" className="mf-input"
                    value={editValues.meta_kcal}
                    onChange={e => setEditValues(v => ({ ...v, meta_kcal: e.target.value }))}
                  />
                </div>
              </div>
              {perfilError && <div className="page-error">{perfilError}</div>}
              <div className="mf-actions">
                <button className="btn-primary" onClick={handleSavePerfil} disabled={savingPerfil}>
                  {savingPerfil ? 'Guardando...' : 'Guardar'}
                </button>
                <button className="btn-secondary" onClick={() => { setShowEditPerfil(false); setPerfilError(null) }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
