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
  const { user, profile, refreshProfile, viewingProfile, viewUserId, viewingOther } = useAuth()
  const [registros, setRegistros] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [showLimpiar, setShowLimpiar] = useState(false)
  const [limpiarDesde, setLimpiarDesde] = useState('')
  const [limpiarHasta, setLimpiarHasta] = useState('')
  const [limpiarCount, setLimpiarCount] = useState(null)
  const [limpiarLoading, setLimpiarLoading] = useState(false)
  const [limpiarError, setLimpiarError] = useState(null)
  const isEimy = viewingProfile?.theme === 'eimy'

  const fetchRegistros = useCallback(async () => {
    if (!user || !viewUserId) return
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('registros')
        .select('*')
        .eq('user_id', viewUserId)
        .order('fecha', { ascending: true })
      if (err) throw err
      setRegistros(data || [])
    } catch {
      setError('No se pudo cargar el historial. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [user, viewUserId])

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

  async function contarRegistros() {
    if (!limpiarDesde || !limpiarHasta) return
    const { count } = await supabase
      .from('registros')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('fecha', limpiarDesde)
      .lte('fecha', limpiarHasta)
    setLimpiarCount(count ?? 0)
  }

  async function handleLimpiar() {
    if (!limpiarDesde || !limpiarHasta || limpiarCount === 0) return
    setLimpiarLoading(true)
    setLimpiarError(null)
    try {
      const { error: err } = await supabase
        .from('registros')
        .delete()
        .eq('user_id', user.id)
        .gte('fecha', limpiarDesde)
        .lte('fecha', limpiarHasta)
      if (err) throw err
      setShowLimpiar(false)
      setLimpiarDesde('')
      setLimpiarHasta('')
      setLimpiarCount(null)
      fetchRegistros()
    } catch {
      setLimpiarError('No se pudo eliminar. Intenta de nuevo.')
    } finally {
      setLimpiarLoading(false)
    }
  }

  function abrirLimpiar() {
    setLimpiarDesde('')
    setLimpiarHasta('')
    setLimpiarCount(null)
    setLimpiarError(null)
    setShowLimpiar(true)
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
        {!viewingOther && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={btn.btnPrimary} onClick={() => { setEditando(null); setFormError(null); setShowForm(true) }}>
              + Registrar
            </button>
            <button className={btn.btnSecondary} onClick={abrirLimpiar} title="Borrar registros por rango de fechas">
              🗑 Limpiar
            </button>
          </div>
        )}
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
                  {!viewingOther && (
                    <div className={s.hrActions}>
                      <button className={s.hrBtn} onClick={() => { setEditando(r); setShowForm(true) }}>✏️</button>
                      <button className={`${s.hrBtn} ${s.hrDelete}`} onClick={() => handleDelete(r.id)}>🗑</button>
                    </div>
                  )}
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

      {/* MODAL LIMPIAR */}
      {showLimpiar && (
        <div className={m.modalOverlay} onClick={() => setShowLimpiar(false)}>
          <div className={m.modalCard} onClick={e => e.stopPropagation()}>
            <div className={m.modalHeader}>
              <h3>Limpiar registros</h3>
              <button className={m.modalClose} onClick={() => setShowLimpiar(false)}>✕</button>
            </div>
            <div style={{ padding: '0 4px' }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Elimina registros en un rango de fechas. Útil para borrar datos de prueba sin afectar registros reales.
              </p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Desde</label>
                  <input
                    type="date"
                    className={btn.mfInput}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}
                    value={limpiarDesde}
                    onChange={e => { setLimpiarDesde(e.target.value); setLimpiarCount(null) }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Hasta</label>
                  <input
                    type="date"
                    className={btn.mfInput}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}
                    value={limpiarHasta}
                    onChange={e => { setLimpiarHasta(e.target.value); setLimpiarCount(null) }}
                  />
                </div>
              </div>
              <button
                className={btn.btnSecondary}
                style={{ width: '100%', marginBottom: 12 }}
                onClick={contarRegistros}
                disabled={!limpiarDesde || !limpiarHasta}
              >
                Verificar cuántos registros hay
              </button>
              {limpiarCount !== null && (
                <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 14 }}>
                  {limpiarCount === 0
                    ? <span style={{ color: 'var(--muted)' }}>No hay registros en ese rango.</span>
                    : <span style={{ color: 'var(--danger, #f87171)', fontWeight: 600 }}>Se eliminarán {limpiarCount} registro{limpiarCount !== 1 ? 's' : ''}. Esta acción no se puede deshacer.</span>
                  }
                </div>
              )}
              {limpiarError && <div className={btn.pageError} style={{ marginBottom: 12 }}>{limpiarError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={btn.btnPrimary}
                  style={{ flex: 1, background: 'var(--danger, #ef4444)' }}
                  onClick={handleLimpiar}
                  disabled={!limpiarCount || limpiarLoading}
                >
                  {limpiarLoading ? 'Eliminando...' : `Eliminar ${limpiarCount ?? ''}`}
                </button>
                <button className={btn.btnSecondary} style={{ flex: 1 }} onClick={() => setShowLimpiar(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
