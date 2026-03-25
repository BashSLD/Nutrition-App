import { useState } from 'react'
import s from '../styles/Plan.module.css'
import btn from '../styles/shared.module.css'
import SearchFoodModal from './SearchFoodModal'

export default function MealCard({ meal, isEimy, selected, onSelect, onUpdate, icon }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [ingredientes, setIngredientes] = useState(meal.ingredientes || [])
  const [searchingIdx, setSearchingIdx] = useState(null)

  function handleIngChange(idx, field, value) {
    const updated = ingredientes.map((ing, i) =>
      i === idx ? { ...ing, [field]: value } : ing
    )
    setIngredientes(updated)
  }

  async function saveChanges() {
    await onUpdate({ ingredientes })
    setEditing(false)
  }

  function handleFoodSelect(food) {
    if (searchingIdx !== null) {
      const updated = ingredientes.map((ing, i) =>
        i === searchingIdx ? { ...ing, nombre: food.nombre, cantidad: food.cantidad, kcal: food.kcal } : ing
      )
      setIngredientes(updated)
      setSearchingIdx(null)
    }
  }

  const totalKcal = ingredientes.reduce((sum, i) => sum + (Number(i.kcal) || 0), 0)

  if (isEimy) {
    return (
      <div className={`${s.mealCardEimy} ${selected ? s.mealSelected : ''}`}>
        <div className={s.mceHead} onClick={() => setExpanded(!expanded)}>
          <div className={s.mceLetter}>{meal.nombre[0]}</div>
          <div className={s.mceName}>{icon && <span style={{marginRight: '8px'}}>{icon}</span>} {meal.nombre}</div>
          <div className={s.mceKcal}>{meal.kcal_total || totalKcal} kcal</div>
          {selected && <span className={s.mealSelBadge}>✓</span>}
        </div>
        {expanded && (
          <div className={s.mceBody}>
            {ingredientes.map((ing, idx) => (
              <div key={idx} className={s.mceIng}>
                <div className={s.mceIngName}>
                  {editing ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input value={ing.nombre} onChange={e => handleIngChange(idx, 'nombre', e.target.value)} className={btn.editInput} style={{ flex: 1 }} />
                      <button className={btn.btnSecondary} onClick={() => setSearchingIdx(idx)} style={{ padding: '0 8px' }}>🔍</button>
                    </div>
                  ) : ing.nombre}
                  {ing.tip && <div className={s.mceTip}>💡 {ing.tip}</div>}
                </div>
                <div className={s.mceIngRight}>
                  {editing
                    ? <input value={ing.cantidad || ''} onChange={e => handleIngChange(idx, 'cantidad', e.target.value)} className={`${btn.editInput} ${btn.editInputSm}`} />
                    : <span className={s.mceQty}>{ing.cantidad} {ing.unidad}</span>
                  }
                  {editing
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><input type="number" value={ing.kcal || ''} onChange={e => handleIngChange(idx, 'kcal', e.target.value)} className={`${btn.editInput} ${btn.editInputSm}`} style={{ width: '40px' }} /> <span style={{fontSize: '10px', color: 'var(--muted)'}}>kcal</span></div>
                    : <span className={s.mceKcalIng}>{ing.kcal} kcal</span>
                  }
                </div>
              </div>
            ))}
            <div className={s.mceFooter}>
              <span className={s.mceTotal}>Total: <strong>{meal.kcal_total || totalKcal} kcal</strong></span>
              <div className={s.mceFooterActions}>
                {onSelect && (
                  <button
                    className={`${s.btnElegir} ${selected ? s.btnElegirActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); onSelect() }}
                  >
                    {selected ? '✓ Elegida' : 'Elegir esta'}
                  </button>
                )}
                {editing
                  ? <><button className={btn.btnSave} onClick={saveChanges}>Guardar</button><button className={btn.btnCancel} onClick={() => { setIngredientes(meal.ingredientes); setEditing(false) }}>Cancelar</button></>
                  : <button className={btn.btnEdit} onClick={() => setEditing(true)}>✏️ Editar</button>
                }
              </div>
            </div>
          </div>
        )}
        {searchingIdx !== null && (
          <SearchFoodModal 
            onClose={() => setSearchingIdx(null)} 
            onSelect={handleFoodSelect} 
          />
        )}
      </div>
    )
  }

  return (
    <div className={`${s.mealCardBash} ${selected ? s.mealSelected : ''}`}>
      <div className={s.mcbHeader} onClick={() => setExpanded(!expanded)}>
        <span className={s.mcbName}>{icon && <span style={{marginRight: '8px'}}>{icon}</span>} {meal.nombre}</span>
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
                <div className={s.mcbIngName}>
                  {editing ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input value={ing.nombre} onChange={e => handleIngChange(idx, 'nombre', e.target.value)} className={btn.editInput} style={{ flex: 1 }} />
                      <button className={btn.btnSecondary} onClick={() => setSearchingIdx(idx)} style={{ padding: '0 8px' }}>🔍</button>
                    </div>
                  ) : ing.nombre}
                </div>
                {ing.tip && <div className={s.mcbTip}>{ing.tip}</div>}
              </div>
              <div className={s.mcbQty}>
                {editing
                  ? <input value={ing.cantidad || ''} onChange={e => handleIngChange(idx, 'cantidad', e.target.value)} className={`${btn.editInput} ${btn.editInputSm}`} />
                  : `${ing.cantidad || ''} ${ing.unidad || ''}`
                }
              </div>
              <div className={s.mcbKcal}>
                {editing
                  ? <input type="number" value={ing.kcal || ''} onChange={e => handleIngChange(idx, 'kcal', e.target.value)} className={`${btn.editInput} ${btn.editInputSm}`} style={{ width: '40px' }} />
                  : ing.kcal
                }
              </div>
            </div>
          ))}
          <div className={s.mcbFooter}>
            <span>Total: <strong>{meal.kcal_total || totalKcal} kcal</strong></span>
            {editing
              ? <><button className={btn.btnSave} onClick={saveChanges}>Guardar</button><button className={btn.btnCancel} onClick={() => { setIngredientes(meal.ingredientes); setEditing(false) }}>Cancelar</button></>
              : <button className={btn.btnEdit} onClick={() => setEditing(true)}>✏️ Editar</button>
            }
          </div>
        </div>
      )}
      {searchingIdx !== null && (
        <SearchFoodModal 
          onClose={() => setSearchingIdx(null)} 
          onSelect={handleFoodSelect} 
        />
      )}
    </div>
  )
}
