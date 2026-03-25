import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import MealCard from '../components/MealCard'
import JuiceChecklist from '../components/JuiceChecklist'

const MEAL_TYPES = ['desayuno', 'comida', 'cena', 'snack']
const MEAL_ICONS = { desayuno: '🌅', comida: '☀️', cena: '🌙', snack: '🍿' }
const MEAL_LABELS = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snacks' }

export default function Plan() {
  const { user, profile } = useAuth()
  const [meals, setMeals] = useState([])
  const [jugos, setJugos] = useState([])
  const [loading, setLoading] = useState(true)
  const isEimy = profile?.theme === 'eimy'

  const fetchData = useCallback(async () => {
    if (!user) return
    const [mealsRes, jugosRes] = await Promise.all([
      supabase.from('meals').select('*').eq('user_id', user.id).order('orden'),
      supabase.from('jugos').select('*').eq('user_id', user.id).order('orden')
    ])
    setMeals(mealsRes.data || [])
    setJugos(jugosRes.data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleUpdateMeal(mealId, updates) {
    await supabase.from('meals').update(updates).eq('id', mealId).eq('user_id', user.id)
    fetchData()
  }

  async function handleUpdateJugo(jugoId, updates) {
    await supabase.from('jugos').update(updates).eq('id', jugoId).eq('user_id', user.id)
    fetchData()
  }

  if (loading) return <div className="page-loading">Cargando plan...</div>

  const mealsByType = MEAL_TYPES.reduce((acc, tipo) => {
    acc[tipo] = meals.filter(m => m.tipo === tipo)
    return acc
  }, {})

  const metaKcal = profile?.meta_kcal || 0
  const tmb = isEimy ? 1380 : 1750
  const tdee = isEimy ? 1650 : 2100
  const metaGym = isEimy ? 1400 : 1850

  return (
    <div className="page plan-page">

      {/* HEADER */}
      <div className="plan-header">
        {isEimy
          ? <><div className="plan-stars">✦ ✧ ✦ ✧ ✦</div><h1 className="plan-title-eimy">Mi Plan 💖</h1></>
          : <><span className="plan-tag">PLAN NUTRICIONAL / 2026</span><h1 className="plan-title-bash">MI<br/><span>DÉFICIT</span></h1></>
        }
      </div>

      {/* MÉTRICAS */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="mc-label">TMB</div>
          <div className="mc-val">{tmb.toLocaleString()}</div>
          <div className="mc-unit">kcal/día</div>
          <div className="mc-def">Calorías en reposo absoluto</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">TDEE</div>
          <div className="mc-val">{tdee.toLocaleString()}</div>
          <div className="mc-unit">kcal/día</div>
          <div className="mc-def">Gasto real con tu actividad</div>
        </div>
        <div className="metric-card metric-highlight">
          <div className="mc-label">Meta {isEimy ? '✦' : ''}</div>
          <div className="mc-val">{(metaKcal || (isEimy ? 1300 : 1700)).toLocaleString()}</div>
          <div className="mc-unit">déficit {isEimy ? '−350' : '−400'} kcal</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Con gym</div>
          <div className="mc-val">{metaGym.toLocaleString()}</div>
          <div className="mc-unit">kcal/día</div>
          <div className="mc-def">Al iniciar actividad física</div>
        </div>
      </div>

      {/* COMIDAS */}
      {MEAL_TYPES.map(tipo => (
        mealsByType[tipo].length > 0 && (
          <div key={tipo} className="plan-section">
            <div className="plan-section-header">
              <span className="psh-icon">{MEAL_ICONS[tipo]}</span>
              <span className="psh-title">{MEAL_LABELS[tipo]}</span>
              <span className="psh-kcal">
                {mealsByType[tipo].reduce((s, m) => s + (m.kcal_total || 0), 0)} kcal
              </span>
            </div>
            <div className="meals-list">
              {mealsByType[tipo].map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  isEimy={isEimy}
                  onUpdate={(updates) => handleUpdateMeal(meal.id, updates)}
                />
              ))}
            </div>
          </div>
        )
      ))}

      {/* JUGOS */}
      <div className="plan-section">
        <div className="plan-section-header">
          <span className="psh-icon">🥤</span>
          <span className="psh-title">{isEimy ? 'Mis Jugos' : 'Jugos'}</span>
        </div>
        {isEimy && <p className="jugos-hint">Toca cada ingrediente para tacharlo mientras preparas 💅</p>}
        <div className={`jugos-grid jugos-grid-${isEimy ? 3 : 2}`}>
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
