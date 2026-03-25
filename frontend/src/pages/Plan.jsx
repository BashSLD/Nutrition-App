import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getTodayFecha } from '../lib/dates'
import MealCard from '../components/MealCard'
import JuiceChecklist from '../components/JuiceChecklist'
import s from '../styles/Plan.module.css'
import err from '../styles/shared.module.css'

const MEAL_TYPES = ['desayuno', 'comida', 'cena', 'snack']
const MEAL_ICONS = { desayuno: '🌅', comida: '☀️', cena: '🌙', snack: '🍿' }
const MEAL_LABELS = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snacks' }

export default function Plan() {
  const { user, profile } = useAuth()
  const [meals, setMeals] = useState([])
  const [jugos, setJugos] = useState([])
  const [selecciones, setSelecciones] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isEimy = profile?.theme === 'eimy'
  const today = getTodayFecha()

  const fetchData = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      const [mealsRes, jugosRes, selRes] = await Promise.all([
        supabase.from('meals').select('*').eq('user_id', user.id).order('orden'),
        supabase.from('jugos').select('*').eq('user_id', user.id).order('orden'),
        supabase.from('selecciones_dia').select('tipo,meal_id').eq('user_id', user.id).eq('fecha', today)
      ])
      if (mealsRes.error) throw mealsRes.error
      if (jugosRes.error) throw jugosRes.error
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
  }, [user, isEimy, today])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSelectMeal(tipo, mealId) {
    const newSel = { ...selecciones, [tipo]: mealId }
    setSelecciones(newSel)
    await supabase.from('selecciones_dia').upsert(
      { user_id: user.id, fecha: today, tipo, meal_id: mealId },
      { onConflict: 'user_id,fecha,tipo' }
    )
  }

  async function handleUpdateMeal(mealId, updates) {
    await supabase.from('meals').update(updates).eq('id', mealId).eq('user_id', user.id)
    fetchData()
  }

  async function handleUpdateJugo(jugoId, updates) {
    await supabase.from('jugos').update(updates).eq('id', jugoId).eq('user_id', user.id)
    fetchData()
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

  const metaKcal = profile?.meta_kcal || 0
  const peso = profile?.peso_kg || 0
  const altura = profile?.altura_cm || 0
  const edad = profile?.edad || 0
  const sexo = profile?.sexo || (isEimy ? 'femenino' : 'masculino')
  const actividad = profile?.nivel_actividad || 1.2

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
                  onUpdate={(updates) => handleUpdateMeal(meal.id, updates)}
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
              onUpdate={(updates) => handleUpdateJugo(jugo.id, updates)}
            />
          ))}
        </div>
      </div>

    </div>
  )
}
