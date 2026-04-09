import { useState } from 'react'
import { createPortal } from 'react-dom'
import s from '../styles/Plan.module.css'
import m from '../styles/Modal.module.css'

export default function JuiceChecklist({ jugo, isEimy }) {
  const [checked, setChecked] = useState({})
  const [open, setOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)

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
          <button
            className={s.juiceShopBtn}
            onClick={e => { e.stopPropagation(); setShopOpen(true) }}
            title="Lista de compras"
          >🛒</button>
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

      {shopOpen && createPortal(
        <div className={m.modalOverlay} onClick={() => setShopOpen(false)}>
          <div className={m.modalCard} onClick={e => e.stopPropagation()}>
            <div className={m.modalHeader}>
              <h3>
                {isEimy && jugo.emoji ? `${jugo.emoji} ` : '🛒 '}
                {jugo.nombre}
              </h3>
              <button className={m.modalClose} onClick={() => setShopOpen(false)}>✕</button>
            </div>
            <ul className={s.shopList}>
              {ingredientes.map((ing, idx) => (
                <li key={idx} className={s.shopItem}>
                  <span className={s.shopDot} />
                  <span className={s.shopName}>{ing.nombre}</span>
                  <span className={s.shopQty}>{ing.cantidad} {ing.unidad}</span>
                </li>
              ))}
            </ul>
            {jugo.nota && <p className={s.juiceNote} style={{ marginTop: 16 }}>{jugo.nota}</p>}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
