import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getTodayFecha } from '../lib/dates'
import MealCard from '../components/MealCard'
import JuiceChecklist from '../components/JuiceChecklist'
import AdminPlanPanel from '../components/AdminPlanPanel'
import s from '../styles/Plan.module.css'
import err from '../styles/shared.module.css'

const MEAL_TYPES = ['desayuno', 'comida', 'cena', 'snack']
const MEAL_ICONS = { desayuno: '🌅', comida: '☀️', cena: '🌙', snack: '🍿' }
const MEAL_LABELS = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snacks' }

export default function Plan() {
  const { user, viewingProfile, viewUserId, viewingOther } = useAuth()
  const [meals, setMeals] = useState([])
  const [jugos, setJugos] = useState([])
  const [selecciones, setSelecciones] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [importData, setImportData]   = useState(null)
  const [importing, setImporting]     = useState(false)
  const [importError, setImportError] = useState(null)
  const [historial, setHistorial]         = useState([])
  const [showHistorial, setShowHistorial] = useState(false)
  const [showAI, setShowAI]               = useState(false)
  const [aiMensaje, setAiMensaje]         = useState('')
  const [aiLoading, setAiLoading]         = useState(false)
  const [aiError, setAiError]             = useState(null)
  const [aiRechazado, setAiRechazado]     = useState(null)
  const isEimy = viewingProfile?.theme === 'eimy'
  const today = getTodayFecha()

  const fetchData = useCallback(async () => {
    if (!user || !viewUserId) return
    setError(null)
    try {
      const [mealsRes, jugosRes, selRes] = await Promise.all([
        supabase.from('meals').select('*').eq('user_id', viewUserId).order('orden'),
        supabase.from('jugos').select('*').eq('user_id', viewUserId).order('orden'),
        supabase.from('selecciones_dia').select('tipo,meal_id').eq('user_id', viewUserId).eq('fecha', today)
      ])
      if (mealsRes.error) throw mealsRes.error
      if (jugosRes.error) throw jugosRes.error

      const { data: hist } = await supabase
        .from('plan_historial')
        .select('id, created_at, motivo, snapshot')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setHistorial(hist || [])
      setMeals(mealsRes.data || [])
      setJugos(jugosRes.data || [])
      const sel = {}
      if (!selRes.error && selRes.data) {
        selRes.data.forEach(r => { sel[r.tipo] = r.meal_id })
      }
      if (!isEimy && mealsRes.data) {
        MEAL_TYPES.forEach(tipo => {
          if (!sel[tipo]) {
            const opts = mealsRes.data.filter(m => m.tipo === tipo)
            if (opts.length === 1) sel[tipo] = opts[0].id
          }
        })
      }
      setSelecciones(sel)
    } catch {
      setError('No se pudo cargar el plan. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [user, viewUserId, isEimy, today])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSelectMeal(tipo, mealId) {
    if (viewingOther) return
    const newSel = { ...selecciones, [tipo]: mealId }
    setSelecciones(newSel)
    await supabase.from('selecciones_dia').upsert(
      { user_id: user.id, fecha: today, tipo, meal_id: mealId },
      { onConflict: 'user_id,fecha,tipo' }
    )
  }


  async function exportPlan() {
    setExporting(true)
    try {
      const [mealsRes, jugosRes] = await Promise.all([
        supabase.from('meals').select('tipo,nombre,kcal_total,orden,ingredientes').eq('user_id', viewUserId).order('orden'),
        supabase.from('jugos').select('nombre,subtitulo,emoji,ingredientes,nota,orden').eq('user_id', viewUserId).order('orden'),
      ])
      const payload = {
        profile: viewingProfile?.theme || 'unknown',
        exportedAt: new Date().toISOString(),
        meta: {
          meta_kcal:       viewingProfile?.meta_kcal       ?? null,
          sexo:            viewingProfile?.sexo            ?? null,
          nivel_actividad: viewingProfile?.nivel_actividad ?? null,
          peso_kg:         viewingProfile?.peso_kg         ?? null,
          altura_cm:       viewingProfile?.altura_cm       ?? null,
          edad:            viewingProfile?.edad            ?? null,
        },
        meals: mealsRes.data || [],
        jugos: jugosRes.data || [],
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `plan_${payload.profile}_${today}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function generateWithAI() {
    if (!aiMensaje.trim()) return
    setAiLoading(true)
    setAiError(null)
    setAiRechazado(null)
    try {
      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Sin sesión activa')

      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const body = { mensaje: aiMensaje.trim() }
      if (viewingOther && viewingProfile?.id) body.target_user_id = viewingProfile.id

      const res = await fetch(`${apiUrl}/plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Error ${res.status}`)
      }

      const result = await res.json()

      if (result.rechazado) {
        setAiRechazado(result)
        return
      }

      // Pasar al flujo de preview/confirmación existente
      setShowAI(false)
      setImportError(null)
      setImportData({
        meals:        result.plan_actualizado?.meals || [],
        jugos:        result.plan_actualizado?.jugos || [],
        exportedAt:   new Date().toISOString(),
        profile:      viewingProfile?.theme || '—',
        _fromAI:      true,
        _cambios:     result.cambios     || [],
        _explicacion: result.explicacion || '',
        _advertencias: result.advertencias || [],
        _kcalTotal:   result.kcal_total_plan || null,
      })
    } catch (e) {
      setAiError(e.message || 'Error inesperado. Intenta de nuevo.')
    } finally {
      setAiLoading(false)
    }
  }

  function restoreSnapshot(entry) {
    setShowHistorial(false)
    setImportError(null)
    setImportData({
      meals:       entry.snapshot.meals || [],
      jugos:       entry.snapshot.jugos || [],
      exportedAt:  entry.snapshot.savedAt || entry.created_at,
      profile:     viewingProfile?.theme || '—',
      _fromHistorial: true,
      _motivo:     entry.motivo,
    })
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!Array.isArray(parsed.meals) || !Array.isArray(parsed.jugos))
          throw new Error('El archivo no tiene el formato correcto (faltan "meals" o "jugos").')
        if (parsed.meals.some(m => !m.tipo || !m.nombre))
          throw new Error('Alguna comida no tiene "tipo" o "nombre".')
        setImportData(parsed)
      } catch (err) {
        setImportError(err.message || 'No se pudo leer el archivo.')
      }
    }
    reader.readAsText(file)
  }

  async function confirmImport() {
    if (!importData || !user) return
    setImporting(true)
    setImportError(null)
    try {
      // Validación de kcal
      const totalKcal = importData.meals.reduce((sum, m) => sum + (m.kcal_total || 0), 0)
      const metaKcal  = viewingProfile?.meta_kcal ?? 0
      const minKcal   = viewingProfile?.sexo === 'femenino' ? 1200 : 1500
      const margen    = Math.round(metaKcal * 0.05)

      if (totalKcal > 0) {
        if (totalKcal < minKcal) {
          setImportError(`El plan suma ${totalKcal} kcal, por debajo del mínimo absoluto de ${minKcal} kcal.`)
          setImporting(false)
          return
        }
        if (metaKcal && Math.abs(totalKcal - metaKcal) > margen) {
          setImportError(`El plan suma ${totalKcal} kcal, fuera del rango permitido: ${metaKcal - margen}–${metaKcal + margen} kcal (meta ${metaKcal} ± 5%).`)
          setImporting(false)
          return
        }
      }
      // 1. Guardar snapshot actual en plan_historial
      const snapshot = { meals, jugos, savedAt: new Date().toISOString() }
      await supabase.from('plan_historial').insert({
        user_id:  user.id,
        snapshot,
        motivo:   'importado',
      })

      // 2. Limpiar plan actual
      await Promise.all([
        supabase.from('meals').delete().eq('user_id', user.id),
        supabase.from('jugos').delete().eq('user_id', user.id),
      ])

      // 3. Insertar nuevo plan
      const newMeals = importData.meals.map(({ tipo, nombre, kcal_total, orden, ingredientes }) => ({
        user_id: user.id, tipo, nombre,
        kcal_total: kcal_total ?? null,
        orden:      orden      ?? 0,
        ingredientes: ingredientes ?? [],
      }))
      const newJugos = importData.jugos.map(({ nombre, subtitulo, emoji, ingredientes, nota, orden }) => ({
        user_id: user.id, nombre,
        subtitulo:   subtitulo   ?? null,
        emoji:       emoji       ?? null,
        ingredientes: ingredientes ?? [],
        nota:        nota        ?? null,
        orden:       orden       ?? 0,
      }))

      if (newMeals.length) await supabase.from('meals').insert(newMeals)
      if (newJugos.length) await supabase.from('jugos').insert(newJugos)

      // 4. Mantener máx. 10 snapshots
      const { data: historial } = await supabase
        .from('plan_historial')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (historial && historial.length > 10) {
        const toDelete = historial.slice(10).map(h => h.id)
        await supabase.from('plan_historial').delete().in('id', toDelete)
      }

      setImportData(null)
      fetchData()
    } catch {
      setImportError('No se pudo importar el plan. Intenta de nuevo.')
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <div className="page-loading">Cargando plan...</div>

  if (error) return (
    <div className="page">
      <div className={err.pageError}>
        {error}
        <button className={err.pageErrorRetry} onClick={fetchData}>↺ Reintentar</button>
      </div>
    </div>
  )

  const mealsByType = MEAL_TYPES.reduce((acc, tipo) => {
    acc[tipo] = meals.filter(m => m.tipo === tipo)
    return acc
  }, {})

  const metaKcal = viewingProfile?.meta_kcal || 0
  const peso = viewingProfile?.peso_kg || 0
  const altura = viewingProfile?.altura_cm || 0
  const edad = viewingProfile?.edad || 0
  const sexo = viewingProfile?.sexo || (isEimy ? 'femenino' : 'masculino')
  const actividad = viewingProfile?.nivel_actividad || 1.2

  // Mifflin-St Jeor (1990) — más precisa que Harris-Benedict
  const tmb = peso && altura && edad
    ? Math.round(
        sexo === 'femenino'
          ? (10 * peso) + (6.25 * altura) - (5 * edad) - 161
          : (10 * peso) + (6.25 * altura) - (5 * edad) + 5
      )
    : 0
  const tdee = tmb ? Math.round(tmb * actividad) : 0
  const deficitTeorico = tdee && metaKcal ? tdee - metaKcal : 0

  // Daily summary
  const selectedMeals = Object.values(selecciones)
    .map(id => meals.find(m => m.id === id))
    .filter(Boolean)
  const kcalHoy = selectedMeals.reduce((sum, m) => sum + (m.kcal_total || 0), 0)
  const deficit = metaKcal && kcalHoy ? metaKcal - kcalHoy : null
  const selCount = selectedMeals.length
  const totalTypes = MEAL_TYPES.filter(t => mealsByType[t].length > 0).length

  return (
    <div className="page plan-page">

      {/* HEADER */}
      <div className={s.planHeader}>
        {isEimy
          ? <><div className={s.planStars}>✦ ✧ ✦ ✧ ✦</div><h1 className={s.planTitleEimy}>Mi Plan 💖</h1></>
          : <><span className={s.planTag}>PLAN NUTRICIONAL / 2026</span><h1 className={s.planTitleBash}>MI<br/><span>DÉFICIT</span></h1></>
        }
        {!viewingOther && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className={err.btnEdit}
              onClick={exportPlan}
              disabled={exporting || loading}
              title="Descargar plan como JSON"
            >
              {exporting ? 'Exportando...' : '↓ Exportar'}
            </button>
            <label
              className={err.btnEdit}
              style={{ cursor: 'pointer' }}
              title="Cargar plan desde JSON"
            >
              ↑ Importar
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
            </label>
            {historial.length > 0 && (
              <button
                className={err.btnEdit}
                onClick={() => setShowHistorial(true)}
                title={`${historial.length} versión${historial.length !== 1 ? 'es' : ''} guardada${historial.length !== 1 ? 's' : ''}`}
              >
                ↩ Deshacer ({historial.length})
              </button>
            )}
            <button
              className={err.btnEdit}
              onClick={() => { setShowAI(true); setAiError(null); setAiRechazado(null) }}
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              ✦ IA
            </button>
          </div>
        )}
      </div>

      {/* MÉTRICAS */}
      <div className={s.metricsGrid}>
        <div className={s.metricCard}>
          <div className={s.mcLabel}>TMB</div>
          <div className={s.mcVal}>{tmb.toLocaleString()}</div>
          <div className={s.mcUnit}>kcal/día</div>
          <div className={s.mcDef}>Calorías en reposo absoluto</div>
        </div>
        <div className={s.metricCard}>
          <div className={s.mcLabel}>TDEE</div>
          <div className={s.mcVal}>{tdee.toLocaleString()}</div>
          <div className={s.mcUnit}>kcal/día</div>
          <div className={s.mcDef}>Gasto real con tu actividad</div>
        </div>
        <div className={`${s.metricCard} ${s.metricHighlight}`}>
          <div className={s.mcLabel}>Meta {isEimy ? '✦' : ''}</div>
          <div className={s.mcVal}>{(metaKcal || (isEimy ? 1300 : 1700)).toLocaleString()}</div>
          <div className={s.mcUnit}>{tdee && metaKcal ? `déficit −${tdee - metaKcal} kcal` : 'déficit kcal'}</div>
        </div>
        <div className={s.metricCard}>
          <div className={s.mcLabel}>Déficit</div>
          <div className={s.mcVal}>−{deficitTeorico}</div>
          <div className={s.mcUnit}>kcal/día</div>
          <div className={s.mcDef}>{actividad > 1.2 ? 'Con tu actividad actual' : 'Sedentario'}</div>
        </div>
      </div>

      {/* RESUMEN DEL DÍA */}
      {(isEimy || selCount > 0) && (
        <div className={s.daySummary}>
          <div className={s.dsHeader}>
            <span className={s.dsTitle}>{isEimy ? '✦ Hoy' : 'Hoy'}</span>
            <span className={s.dsProgress}>{selCount}/{totalTypes} comidas</span>
          </div>
          <div className={s.dsKcalRow}>
            <div className={s.dsKcalVal}>{kcalHoy > 0 ? kcalHoy.toLocaleString() : '—'}</div>
            <div className={s.dsKcalUnit}>kcal seleccionadas</div>
            {deficit !== null && (
              <div className={`${s.dsDeficit} ${deficit >= 0 ? s.dsOk : s.dsOver}`}>
                {deficit >= 0 ? `−${deficit} del plan` : `+${Math.abs(deficit)} sobre meta`}
              </div>
            )}
          </div>
          {selCount > 0 && (
            <div className={s.dsChips}>
              {selectedMeals.map(m => (
                <span key={m.id} className={s.dsChip}>
                  {MEAL_ICONS[m.tipo]} {m.nombre}
                  {m.kcal_total ? <span className={s.dsChipKcal}> {m.kcal_total}</span> : null}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMIDAS */}
      {MEAL_TYPES.map(tipo => (
        mealsByType[tipo].length > 0 && (
          <div key={tipo} className={s.planSection}>
            <div>
              {mealsByType[tipo].map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  isEimy={isEimy}
                  icon={MEAL_ICONS[tipo]}
                  selected={selecciones[tipo] === meal.id}
                  onSelect={isEimy ? () => handleSelectMeal(tipo, meal.id) : null}
                />
              ))}
            </div>
          </div>
        )
      ))}

      {/* JUGOS */}
      <div className={s.planSection}>
        <div className={s.planSectionHeader}>
          <span className={s.pshIcon}>🥤</span>
          <span className={s.pshTitle}>{isEimy ? 'Mis Jugos' : 'Jugos'}</span>
        </div>
        {isEimy && <p className={s.jugosHint}>Toca cada ingrediente para tacharlo mientras preparas 💅</p>}
        <div className={`${s.jugosGrid} ${isEimy ? s.jugosGrid3 : s.jugosGrid2}`}>
          {jugos.map(jugo => (
            <JuiceChecklist
              key={jugo.id}
              jugo={jugo}
              isEimy={isEimy}
            />
          ))}
        </div>
      </div>

      {/* ERROR DE IMPORTAR */}
      {importError && (
        <div className={err.pageError}>
          {importError}
          <button className={err.pageErrorRetry} onClick={() => setImportError(null)}>✕</button>
        </div>
      )}

      {/* MODAL IA */}
      {showAI && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => !aiLoading && setShowAI(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 460, border: '1px solid var(--accent)', boxShadow: '0 0 32px rgba(200,241,53,0.1)' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)' }}>✦ Generar plan con IA</h3>
              <button onClick={() => setShowAI(false)} disabled={aiLoading} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                Describe el cambio que quieres. La IA ajustará el plan respetando tu meta de <strong>{metaKcal} kcal</strong>.
              </p>
              <textarea
                value={aiMensaje}
                onChange={e => setAiMensaje(e.target.value)}
                placeholder={isEimy
                  ? 'Ej: Quiero más variedad en los desayunos, sin huevo los lunes'
                  : 'Ej: Cambia el pollo de la comida por salmón dos veces por semana'}
                disabled={aiLoading}
                style={{
                  width: '100%', minHeight: 100, padding: '10px 12px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 13,
                  fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none',
                  lineHeight: 1.6,
                }}
              />

              {/* Rechazo */}
              {aiRechazado && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ color: '#f87171', fontWeight: 600, marginBottom: 4 }}>No es posible ese cambio</div>
                  <div style={{ color: 'var(--muted)' }}>{aiRechazado.explicacion}</div>
                  {aiRechazado.alternativa_sugerida && (
                    <div style={{ marginTop: 8, color: 'var(--text)' }}>
                      💡 Alternativa: {aiRechazado.alternativa_sugerida}
                    </div>
                  )}
                </div>
              )}

              {aiError && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
                  {aiError}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <button
                onClick={generateWithAI}
                disabled={aiLoading || !aiMensaje.trim()}
                style={{ flex: 1, background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 99, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: (!aiMensaje.trim() || aiLoading) ? 0.5 : 1 }}
              >
                {aiLoading ? '✦ Generando...' : '✦ Generar'}
              </button>
              <button
                onClick={() => setShowAI(false)}
                disabled={aiLoading}
                style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 99, padding: '10px 0', fontSize: 13, cursor: 'pointer', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {showHistorial && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowHistorial(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 440, border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)' }}>Historial de planes</h3>
              <button onClick={() => setShowHistorial(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '8px 0' }}>
              {historial.map((entry) => {
                const mealCount = entry.snapshot?.meals?.length ?? 0
                const jugoCount = entry.snapshot?.jugos?.length ?? 0
                const kcalTotal = (entry.snapshot?.meals || []).reduce((s, m) => s + (m.kcal_total || 0), 0)
                const motivoLabel = { manual: 'manual', ia: '✦ IA', importado: '↑ importado' }[entry.motivo] || entry.motivo
                return (
                  <div key={entry.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => restoreSnapshot(entry)}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {new Date(entry.created_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {mealCount} comidas · {jugoCount} jugos{kcalTotal ? ` · ${kcalTotal} kcal` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--surface2)', color: 'var(--muted)' }}>
                      {motivoLabel}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
              Toca una versión para previsualizarla antes de restaurar.
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW IMPORTAR */}
      {importData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setImportData(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontFamily: 'var(--font-head)' }}>Vista previa — Importar plan</h3>
              <button onClick={() => setImportData(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Contenido scrolleable */}
            <div style={{ overflowY: 'auto', padding: '14px 16px', flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, padding: '8px 12px', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 8 }}>
                ⚠️ Esto reemplazará tu plan actual. El plan anterior se guardará en el historial.
              </div>

              {/* Metadata + resumen kcal */}
              {importData.exportedAt && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                  {importData._fromHistorial
                    ? <>↩ Versión guardada el {new Date(importData.exportedAt).toLocaleString('es-MX')} · origen: <strong>{importData._motivo}</strong></>
                    : importData._fromAI
                      ? <><strong style={{ color: 'var(--accent)' }}>✦ Generado por IA</strong> · {new Date(importData.exportedAt).toLocaleString('es-MX')}</>
                      : <>Exportado el {new Date(importData.exportedAt).toLocaleString('es-MX')} · perfil: <strong>{importData.profile}</strong></>
                  }
                </div>
              )}

              {/* Resumen IA */}
              {importData._fromAI && (
                <>
                  {importData._explicacion && (
                    <div style={{ fontSize: 13, padding: '10px 12px', background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.2)', borderRadius: 8, marginBottom: 10, color: 'var(--text)' }}>
                      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Razonamiento</div>
                      {importData._explicacion}
                    </div>
                  )}
                  {importData._cambios?.length > 0 && (
                    <div style={{ fontSize: 12, marginBottom: 10 }}>
                      <div style={{ color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11, fontWeight: 600 }}>Cambios</div>
                      {importData._cambios.map((c, i) => (
                        <div key={i} style={{ padding: '3px 0', color: 'var(--text)' }}>· {c}</div>
                      ))}
                    </div>
                  )}
                  {importData._advertencias?.length > 0 && (
                    <div style={{ fontSize: 12, padding: '8px 12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, marginBottom: 10 }}>
                      {importData._advertencias.map((a, i) => (
                        <div key={i} style={{ color: '#fbbf24' }}>⚠ {a}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {(() => {
                const total   = importData.meals.reduce((s, m) => s + (m.kcal_total || 0), 0)
                const meta    = viewingProfile?.meta_kcal ?? 0
                const minK    = viewingProfile?.sexo === 'femenino' ? 1200 : 1500
                const margen  = Math.round(meta * 0.05)
                const ok      = total === 0 || (total >= minK && (!meta || Math.abs(total - meta) <= margen))
                return total > 0 ? (
                  <div style={{ fontSize: 13, padding: '8px 12px', borderRadius: 8, marginBottom: 14,
                    background: ok ? 'rgba(200,241,53,0.08)' : 'rgba(248,113,113,0.1)',
                    border: `1px solid ${ok ? 'rgba(200,241,53,0.25)' : 'rgba(248,113,113,0.3)'}`,
                    color: ok ? 'var(--accent)' : '#f87171' }}>
                    {ok ? '✓' : '⚠'} Total del plan: <strong>{total} kcal</strong>
                    {meta ? ` · meta: ${meta} kcal (rango: ${meta - margen}–${meta + margen})` : ''}
                  </div>
                ) : null
              })()}

              {/* Comidas */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Comidas ({importData.meals.length})
                </div>
                {importData.meals.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{MEAL_ICONS[m.tipo] || '🍽'} {m.nombre}</span>
                    <span style={{ color: 'var(--muted)' }}>{m.kcal_total ? `${m.kcal_total} kcal` : '—'}</span>
                  </div>
                ))}
              </div>

              {/* Jugos */}
              {importData.jugos.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Jugos ({importData.jugos.length})
                  </div>
                  {importData.jugos.map((j, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      {j.emoji} {j.nombre} {j.subtitulo && <span style={{ color: 'var(--muted)', fontSize: 12 }}>— {j.subtitulo}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones */}
            {importError && <div className={err.pageError} style={{ margin: '0 16px' }}>{importError}</div>}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <button
                onClick={confirmImport}
                disabled={importing}
                style={{ flex: 1, background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: 99, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                {importing ? 'Importando...' : '✓ Confirmar e importar'}
              </button>
              <button
                onClick={() => setImportData(null)}
                style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 99, padding: '10px 0', fontSize: 13, cursor: 'pointer', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PANEL — solo Bash */}
      {!viewingOther && !isEimy && (
        <AdminPlanPanel
          profile={viewingProfile}
          meals={meals}
          jugos={jugos}
          tmb={tmb}
          tdee={tdee}
        />
      )}

    </div>
  )
}
