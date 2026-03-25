import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MedidaForm from '../components/MedidaForm'
import { parseFecha, diffDias } from '../lib/dates'
import s from '../styles/Seguimiento.module.css'
import m from '../styles/Modal.module.css'
import btn from '../styles/shared.module.css'

export default function Seguimiento() {
  const { user, profile, refreshProfile } = useAuth()
  const [registros, setRegistros] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const isEimy = profile?.theme === 'eimy'

  const fetchRegistros = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('registros')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: true })
      if (err) throw err
      setRegistros(data || [])
    } catch {
      setError('No se pudo cargar el historial. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchRegistros() }, [fetchRegistros])

  async function handleSave(values) {
    setFormError(null)
    try {
      if (editando) {
        const { error: err } = await supabase.from('registros').update(values).eq('id', editando.id).eq('user_id', user.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('registros').upsert({ ...values, user_id: user.id }, { onConflict: 'user_id,fecha' })
        if (err) throw err
      }
      if (values.peso_kg) {
        await supabase.from('profiles').update({ peso_kg: values.peso_kg }).eq('id', user.id)
        await refreshProfile()
      }
      setShowForm(false)
      setEditando(null)
      fetchRegistros()
    } catch {
      setFormError('No se pudo guardar el registro. Intenta de nuevo.')
    }
  }

  async function handleDelete(id) {
    try {
      const { error: err } = await supabase.from('registros').delete().eq('id', id).eq('user_id', user.id)
      if (err) throw err
      fetchRegistros()
    } catch {
      setError('No se pudo eliminar el registro.')
    }
  }

  const ultimo = registros[registros.length - 1]
  const primero = registros[0]

  const pesoInicial = primero?.peso_kg
  const pesoActual = ultimo?.peso_kg
  const diferencia = pesoInicial && pesoActual ? (pesoActual - pesoInicial).toFixed(1) : null

  const accentColor = isEimy ? '#ff1aab' : '#c8f135'
  const lineColors = {
    peso_kg:     isEimy ? '#ff1aab' : '#c8f135',
    cintura_cm:  '#60a5fa',
    cadera_cm:   '#c084fc',
    abdomen_cm:  '#fb923c',
    cuello_cm:   '#34d399',
  }

  const chartData = registros.map(r => ({
    fecha: parseFecha(r.fecha).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    peso_kg: r.peso_kg,
    cintura_cm: r.cintura_cm,
    cadera_cm: r.cadera_cm,
    abdomen_cm: r.abdomen_cm,
    cuello_cm: r.cuello_cm,
  }))

  return (
    <div className="page seguimiento-page">

      <div className={s.segHeader}>
        <h1 className={s.segTitle}>{isEimy ? '📊 Mi progreso 💖' : '📊 Seguimiento'}</h1>
        <button className={btn.btnPrimary} onClick={() => { setEditando(null); setFormError(null); setShowForm(true) }}>
          + Registrar
        </button>
      </div>

      {error && (
        <div className={btn.pageError}>
          {error}
          <button className={btn.pageErrorRetry} onClick={() => { setError(null); fetchRegistros() }}>↺ Reintentar</button>
        </div>
      )}

      {/* RESUMEN */}
      {ultimo && (
        <div className={s.segSummary}>
          <div className={s.ssCard}>
            <div className={s.ssLabel}>Peso actual</div>
            <div className={s.ssVal}>{ultimo.peso_kg} kg</div>
          </div>
          {ultimo.cintura_cm && (
            <div className={s.ssCard}>
              <div className={s.ssLabel}>Cintura</div>
              <div className={s.ssVal}>{ultimo.cintura_cm} cm</div>
            </div>
          )}
          {diferencia && (
            <div className={s.ssCard}>
              <div className={s.ssLabel}>Cambio total</div>
              <div className={`${s.ssVal} ${parseFloat(diferencia) < 0 ? s.ssPositive : s.ssNegative}`}>
                {parseFloat(diferencia) > 0 ? '+' : ''}{diferencia} kg
              </div>
            </div>
          )}
          <div className={s.ssCard}>
            <div className={s.ssLabel}>Registros</div>
            <div className={s.ssVal}>{registros.length}</div>
          </div>
        </div>
      )}

      {/* GRÁFICA PESO */}
      {chartData.length > 1 && (
        <div className={s.chartSection}>
          <h3 className={s.chartTitle}>Peso (kg)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="fecha" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #333', borderRadius: 8 }} />
              <Line type="monotone" dataKey="peso_kg" stroke={accentColor} strokeWidth={2} dot={{ fill: accentColor, r: 4 }} name="Peso (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* GRÁFICA MEDIDAS */}
      {chartData.length > 1 && chartData.some(d => d.cintura_cm) && (
        <div className={s.chartSection}>
          <h3 className={s.chartTitle}>Medidas (cm)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="fecha" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #333', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {['cintura_cm','cadera_cm','abdomen_cm','cuello_cm'].map(key => (
                chartData.some(d => d[key]) && (
                  <Line key={key} type="monotone" dataKey={key} stroke={lineColors[key]} strokeWidth={2} dot={false} name={key.replace('_cm', '')} />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* HISTORIAL */}
      <div className={s.historialSection}>
        <h3 className={s.historialTitle}>Historial</h3>
        {loading
          ? <div className="page-loading">Cargando...</div>
          : registros.length === 0
            ? <div className={s.historialEmpty}>Aún no hay registros — ¡empieza hoy!</div>
            : [...registros].reverse().map(r => (
                <div key={r.id} className={s.historialRow}>
                  <div className={s.hrFecha}>{parseFecha(r.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                  <div className={s.hrDatos}>
                    {r.peso_kg && <span>{r.peso_kg} kg</span>}
                    {r.cintura_cm && <span>C: {r.cintura_cm}</span>}
                    {r.cadera_cm && <span>Ca: {r.cadera_cm}</span>}
                    {r.abdomen_cm && <span>Ab: {r.abdomen_cm}</span>}
                  </div>
                  {r.notas && <div className={s.hrNotas}>{r.notas}</div>}
                  <div className={s.hrActions}>
                    <button className={s.hrBtn} onClick={() => { setEditando(r); setShowForm(true) }}>✏️</button>
                    <button className={`${s.hrBtn} ${s.hrDelete}`} onClick={() => handleDelete(r.id)}>🗑</button>
                  </div>
                </div>
              ))
        }
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div className={m.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={m.modalCard} onClick={e => e.stopPropagation()}>
            <div className={m.modalHeader}>
              <h3>{editando ? 'Editar registro' : 'Nuevo registro'}</h3>
              <button className={m.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>
            {formError && <div className={btn.pageError} style={{ marginBottom: 16 }}>{formError}</div>}
            <MedidaForm
              initial={editando}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditando(null); setFormError(null) }}
            />
          </div>
        </div>
      )}

    </div>
  )
}
