import { useState } from 'react'
import s from '../styles/Plan.module.css'

export default function JuiceChecklist({ jugo, isEimy }) {
  const [checked, setChecked] = useState({})
  const [open, setOpen] = useState(false)

  const ingredientes = jugo.ingredientes || []
  const total = ingredientes.length
  const done = Object.values(checked).filter(Boolean).length
  const pct = total ? Math.round(done / total * 100) : 0

  function toggle(idx) {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  function reset(e) {
    e.stopPropagation()
    setChecked({})
  }

  return (
    <div className={`${s.juiceCard} ${isEimy ? s.juiceEimy : s.juiceBash}`}>
      <div className={s.juiceAccordionHead} onClick={() => setOpen(o => !o)}>
        <div className={s.juiceHeadLeft}>
          {isEimy && jugo.emoji && <span className={s.juiceEmoji}>{jugo.emoji}</span>}
          <div>
            <div className={s.juiceName}>{jugo.nombre}</div>
            {jugo.subtitulo && <div className={s.juiceSub}>{jugo.subtitulo}</div>}
          </div>
        </div>
        <div className={s.juiceHeadRight}>
          {done > 0 && <span className={s.juiceProgBadge}>{done}/{total}</span>}
          <span className={s.juiceChevron}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      <div className={`${s.juiceProg} ${s.juiceProgSlim}`}>
        <div className={s.juiceProgFill} style={{ width: `${pct}%` }} />
      </div>

      {open && (
        <>
          <ul className={s.juiceList}>
            {ingredientes.map((ing, idx) => (
              <li
                key={idx}
                className={`${s.juiceItem} ${checked[idx] ? s.juiceItemDone : ''}`}
                onClick={() => toggle(idx)}
              >
                <div className={`${s.jchk} ${checked[idx] ? s.jchkDone : ''}`}>
                  {checked[idx] && '✓'}
                </div>
                <span className={s.jiName}>{ing.nombre}</span>
                <span className={s.jiQty}>{ing.cantidad} {ing.unidad}</span>
              </li>
            ))}
          </ul>

          {jugo.nota && <div className={s.juiceNote}>{jugo.nota}</div>}

          <button className={s.juiceReset} onClick={reset}>↺ reiniciar</button>
        </>
      )}
    </div>
  )
}
