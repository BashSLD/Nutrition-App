import { useState } from 'react'
import s from '../styles/Plan.module.css'

export default function MealCard({ meal, isEimy, selected, onSelect, icon }) {
  const [expanded, setExpanded] = useState(false)

  const ingredientes = meal.ingredientes || []
  const totalKcal = ingredientes.reduce((sum, i) => sum + (Number(i.kcal) || 0), 0)

  if (isEimy) {
    return (
      <div className={`${s.mealCardEimy} ${selected ? s.mealSelected : ''}`}>
        <div className={s.mceHead} onClick={() => setExpanded(!expanded)}>
          <div className={s.mceLetter}>{meal.nombre[0]}</div>
          <div className={s.mceName}>{icon && <span style={{ marginRight: '8px' }}>{icon}</span>}{meal.nombre}</div>
          <div className={s.mceKcal}>{meal.kcal_total || totalKcal} kcal</div>
          {selected && <span className={s.mealSelBadge}>✓</span>}
        </div>
        {expanded && (
          <div className={s.mceBody}>
            {ingredientes.map((ing, idx) => (
              <div key={idx} className={s.mceIng}>
                <div className={s.mceIngName}>
                  {ing.nombre}
                  {ing.tip && <div className={s.mceTip}>💡 {ing.tip}</div>}
                </div>
                <div className={s.mceIngRight}>
                  <span className={s.mceQty}>{ing.cantidad} {ing.unidad}</span>
                  <span className={s.mceKcalIng}>{ing.kcal} kcal</span>
                </div>
              </div>
            ))}
            <div className={s.mceFooter}>
              <span className={s.mceTotal}>Total: <strong>{meal.kcal_total || totalKcal} kcal</strong></span>
              {onSelect && (
                <button
                  className={`${s.btnElegir} ${selected ? s.btnElegirActive : ''}`}
                  onClick={(e) => { e.stopPropagation(); onSelect() }}
                >
                  {selected ? '✓ Elegida' : 'Elegir esta'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${s.mealCardBash} ${selected ? s.mealSelected : ''}`}>
      <div className={s.mcbHeader} onClick={() => setExpanded(!expanded)}>
        <span className={s.mcbName}>{icon && <span style={{ marginRight: '8px' }}>{icon}</span>}{meal.nombre}</span>
        <div className={s.mcbHeaderRight}>
          {selected && <span className={s.mealSelDot} />}
          <span className={s.mcbKcal}>{meal.kcal_total || totalKcal} kcal</span>
        </div>
      </div>
      {expanded && (
        <div className={s.mcbBody}>
          {ingredientes.map((ing, idx) => (
            <div key={idx} className={s.mcbRow}>
              <div>
                <div className={s.mcbIngName}>{ing.nombre}</div>
                {ing.tip && <div className={s.mcbTip}>{ing.tip}</div>}
              </div>
              <div className={s.mcbQty}>{ing.cantidad || ''} {ing.unidad || ''}</div>
              <div className={s.mcbKcal}>{ing.kcal}</div>
            </div>
          ))}
          <div className={s.mcbFooter}>
            <span>Total: <strong>{meal.kcal_total || totalKcal} kcal</strong></span>
          </div>
        </div>
      )}
    </div>
  )
}
