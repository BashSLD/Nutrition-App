import { useState } from 'react'

export default function MealCard({ meal, isEimy, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [ingredientes, setIngredientes] = useState(meal.ingredientes || [])

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

  const totalKcal = ingredientes.reduce((s, i) => s + (Number(i.kcal) || 0), 0)

  if (isEimy) {
    return (
      <div className="meal-card-eimy">
        <div className="mce-head" onClick={() => setExpanded(!expanded)}>
          <div className="mce-letter">{meal.nombre[0]}</div>
          <div className="mce-name">{meal.nombre}</div>
          <div className="mce-kcal">{meal.kcal_total || totalKcal} kcal</div>
        </div>
        {expanded && (
          <div className="mce-body">
            {ingredientes.map((ing, idx) => (
              <div key={idx} className="mce-ing">
                <div className="mce-ing-name">
                  {editing
                    ? <input value={ing.nombre} onChange={e => handleIngChange(idx, 'nombre', e.target.value)} className="edit-input" />
                    : ing.nombre
                  }
                  {ing.tip && <div className="mce-tip">💡 {ing.tip}</div>}
                </div>
                <div className="mce-ing-right">
                  {editing
                    ? <input value={ing.cantidad || ''} onChange={e => handleIngChange(idx, 'cantidad', e.target.value)} className="edit-input edit-input-sm" />
                    : <span className="mce-qty">{ing.cantidad} {ing.unidad}</span>
                  }
                  <span className="mce-kcal-ing">{ing.kcal} kcal</span>
                </div>
              </div>
            ))}
            <div className="mce-footer">
              <span className="mce-total">Total: <strong>{meal.kcal_total || totalKcal} kcal</strong></span>
              {editing
                ? <><button className="btn-save" onClick={saveChanges}>Guardar</button><button className="btn-cancel" onClick={() => { setIngredientes(meal.ingredientes); setEditing(false) }}>Cancelar</button></>
                : <button className="btn-edit" onClick={() => setEditing(true)}>✏️ Editar</button>
              }
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="meal-card-bash">
      <div className="mcb-header" onClick={() => setExpanded(!expanded)}>
        <span className="mcb-name">{meal.nombre}</span>
        <span className="mcb-kcal">{meal.kcal_total || totalKcal} kcal</span>
      </div>
      {expanded && (
        <div className="mcb-body">
          {ingredientes.map((ing, idx) => (
            <div key={idx} className="mcb-row">
              <div>
                <div className="mcb-ing-name">
                  {editing
                    ? <input value={ing.nombre} onChange={e => handleIngChange(idx, 'nombre', e.target.value)} className="edit-input" />
                    : ing.nombre
                  }
                </div>
                {ing.tip && <div className="mcb-tip">{ing.tip}</div>}
              </div>
              <div className="mcb-qty">
                {editing
                  ? <input value={ing.cantidad || ''} onChange={e => handleIngChange(idx, 'cantidad', e.target.value)} className="edit-input edit-input-sm" />
                  : `${ing.cantidad || ''} ${ing.unidad || ''}`
                }
              </div>
              <div className="mcb-kcal">{ing.kcal}</div>
            </div>
          ))}
          <div className="mcb-footer">
            <span>Total: <strong>{meal.kcal_total || totalKcal} kcal</strong></span>
            {editing
              ? <><button className="btn-save" onClick={saveChanges}>Guardar</button><button className="btn-cancel" onClick={() => { setIngredientes(meal.ingredientes); setEditing(false) }}>Cancelar</button></>
              : <button className="btn-edit" onClick={() => setEditing(true)}>✏️ Editar</button>
            }
          </div>
        </div>
      )}
    </div>
  )
}
