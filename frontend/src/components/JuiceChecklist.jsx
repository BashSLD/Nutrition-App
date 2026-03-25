import { useState } from 'react'

export default function JuiceChecklist({ jugo, isEimy, onUpdate }) {
  const [checked, setChecked] = useState({})

  const ingredientes = jugo.ingredientes || []
  const total = ingredientes.length
  const done = Object.values(checked).filter(Boolean).length
  const pct = total ? Math.round(done / total * 100) : 0

  function toggle(idx) {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  function reset() {
    setChecked({})
  }

  return (
    <div className={`juice-card ${isEimy ? 'juice-eimy' : 'juice-bash'}`}>
      {isEimy && jugo.emoji && <span className="juice-emoji">{jugo.emoji}</span>}
      <div className="juice-name">{jugo.nombre}</div>
      {jugo.subtitulo && <div className="juice-sub">{jugo.subtitulo}</div>}

      <ul className="juice-list">
        {ingredientes.map((ing, idx) => (
          <li
            key={idx}
            className={`juice-item ${checked[idx] ? 'done' : ''}`}
            onClick={() => toggle(idx)}
          >
            <div className={`jchk ${checked[idx] ? 'jchk-done' : ''}`}>
              {checked[idx] && '✓'}
            </div>
            <span className="ji-name">{ing.nombre}</span>
            <span className="ji-qty">{ing.cantidad} {ing.unidad}</span>
          </li>
        ))}
      </ul>

      <div className="juice-prog">
        <div className="juice-prog-fill" style={{ width: `${pct}%` }} />
      </div>

      <button className="juice-reset" onClick={reset}>↺ reiniciar</button>

      {jugo.nota && <div className="juice-note">{jugo.nota}</div>}
    </div>
  )
}
