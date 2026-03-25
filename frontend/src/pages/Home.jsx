import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { diffDias } from '../lib/dates'
import s from '../styles/Home.module.css'
import m from '../styles/Modal.module.css'
import f from '../styles/Modal.module.css'
import btn from '../styles/shared.module.css'

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
      sexo:             profile?.sexo             ?? '',
      nivel_actividad:  profile?.nivel_actividad  ?? 1.2,
      peso_kg:          profile?.peso_kg          ?? '',
      altura_cm:        profile?.altura_cm        ?? '',
      edad:             profile?.edad             ?? '',
      meta_kcal:        profile?.meta_kcal        ?? '',
    })
    setShowEditPerfil(true)
  }

  async function handleSavePerfil() {
    setSavingPerfil(true)
    setPerfilError(null)
    try {
      const { error: err } = await supabase.from('profiles').update({
        sexo:             editValues.sexo || null,
        nivel_actividad:  parseFloat(editValues.nivel_actividad) || 1.2,
        peso_kg:          parseFloat(editValues.peso_kg)   || null,
        altura_cm:        parseFloat(editValues.altura_cm) || null,
        edad:             parseInt(editValues.edad)         || null,
        meta_kcal:        parseInt(editValues.meta_kcal)   || null,
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
      <div className={s.homeHeader}>
        <h1 className={s.homeGreeting}>
          {isEimy ? '✨ Hola, ' : 'Hola, '}{nombre}
        </h1>
        <p className={s.homeSub}>
          Meta: <strong>{profile?.meta_kcal || '—'} kcal/día</strong>
        </p>
      </div>

      {/* MIS DATOS */}
      <div className={s.homeLastRegistro} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className={s.hlrLabel}>Mis datos</div>
          <button className={btn.btnEdit} onClick={openEditPerfil}>✏️ Editar</button>
        </div>
        <div className={s.hlrRow}>
          <div className={s.hlrStat}>
            <div className={s.hlrVal}>{profile?.peso_kg ?? '—'} kg</div>
            <div className={s.hlrKey}>Peso</div>
          </div>
          <div className={s.hlrStat}>
            <div className={s.hlrVal}>{profile?.altura_cm ?? '—'} cm</div>
            <div className={s.hlrKey}>Altura</div>
          </div>
          <div className={s.hlrStat}>
            <div className={s.hlrVal}>{profile?.edad ?? '—'}</div>
            <div className={s.hlrKey}>Edad</div>
          </div>
          <div className={s.hlrStat}>
            <div className={s.hlrVal}>{profile?.meta_kcal ?? '—'}</div>
            <div className={s.hlrKey}>Meta kcal</div>
          </div>
        </div>
      </div>

      {diasSinRegistro !== null && diasSinRegistro >= 7 && (
        <div className={s.homeAlert} onClick={() => navigate('/seguimiento')}>
          ⚠️ Llevas {diasSinRegistro} días sin registrar tu peso — <span>registrar ahora →</span>
        </div>
      )}

      {lastRegistro && (
        <div className={s.homeLastRegistro}>
          <div className={s.hlrLabel}>Último registro</div>
          <div className={s.hlrRow}>
            <div className={s.hlrStat}>
              <div className={s.hlrVal}>{lastRegistro.peso_kg} kg</div>
              <div className={s.hlrKey}>Peso</div>
            </div>
            {lastRegistro.cintura_cm && (
              <div className={s.hlrStat}>
                <div className={s.hlrVal}>{lastRegistro.cintura_cm} cm</div>
                <div className={s.hlrKey}>Cintura</div>
              </div>
            )}
            <div className={s.hlrStat}>
              <div className={s.hlrVal}>{diasSinRegistro === 0 ? 'Hoy' : `Hace ${diasSinRegistro}d`}</div>
              <div className={s.hlrKey}>Fecha</div>
            </div>
          </div>
        </div>
      )}

      <div className={s.homeNavGrid}>
        {navCards.map(card => (
          <div key={card.path} className={s.homeNavCard} onClick={() => navigate(card.path)}>
            <span className={s.hncIcon}>{card.icon}</span>
            <div className={s.hncLabel}>{card.label}</div>
            <div className={s.hncDesc}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* MODAL EDITAR PERFIL */}
      {showEditPerfil && (
        <div className={m.modalOverlay} onClick={() => setShowEditPerfil(false)}>
          <div className={m.modalCard} onClick={e => e.stopPropagation()}>
            <div className={m.modalHeader}>
              <h3>Editar mis datos</h3>
              <button className={m.modalClose} onClick={() => setShowEditPerfil(false)}>✕</button>
            </div>
            <div className={f.medidaForm}>
              <div className={f.mfGrid}>
                <div className={f.mfField}>
                  <label className={f.mfLabel}>Sexo</label>
                  <select
                    className={f.mfInput}
                    value={editValues.sexo}
                    onChange={e => setEditValues(v => ({ ...v, sexo: e.target.value }))}
                  >
                    <option value="">Seleccionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                </div>
                <div className={f.mfField}>
                  <label className={f.mfLabel}>Actividad</label>
                  <select
                    className={f.mfInput}
                    value={editValues.nivel_actividad}
                    onChange={e => setEditValues(v => ({ ...v, nivel_actividad: e.target.value }))}
                  >
                    <option value="1.2">Sedentario</option>
                    <option value="1.375">Ligero (1-3 días/sem)</option>
                    <option value="1.55">Moderado (3-5 días/sem)</option>
                    <option value="1.725">Intenso (6-7 días/sem)</option>
                  </select>
                </div>
                <div className={f.mfField}>
                  <label className={f.mfLabel}>Peso <span className={f.mfUnit}>(kg)</span></label>
                  <input
                    type="number" step="0.1" className={f.mfInput}
                    value={editValues.peso_kg}
                    onChange={e => setEditValues(v => ({ ...v, peso_kg: e.target.value }))}
                  />
                </div>
                <div className={f.mfField}>
                  <label className={f.mfLabel}>Altura <span className={f.mfUnit}>(cm)</span></label>
                  <input
                    type="number" className={f.mfInput}
                    value={editValues.altura_cm}
                    onChange={e => setEditValues(v => ({ ...v, altura_cm: e.target.value }))}
                  />
                </div>
                <div className={f.mfField}>
                  <label className={f.mfLabel}>Edad <span className={f.mfUnit}>(años)</span></label>
                  <input
                    type="number" className={f.mfInput}
                    value={editValues.edad}
                    onChange={e => setEditValues(v => ({ ...v, edad: e.target.value }))}
                  />
                </div>
                <div className={f.mfField}>
                  <label className={f.mfLabel}>Meta <span className={f.mfUnit}>(kcal/día)</span></label>
                  <input
                    type="number" className={f.mfInput}
                    value={editValues.meta_kcal}
                    onChange={e => setEditValues(v => ({ ...v, meta_kcal: e.target.value }))}
                  />
                </div>
              </div>
              {perfilError && <div className={btn.pageError}>{perfilError}</div>}
              <div className={f.mfActions}>
                <button className={btn.btnPrimary} onClick={handleSavePerfil} disabled={savingPerfil}>
                  {savingPerfil ? 'Guardando...' : 'Guardar'}
                </button>
                <button className={btn.btnSecondary} onClick={() => { setShowEditPerfil(false); setPerfilError(null) }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
