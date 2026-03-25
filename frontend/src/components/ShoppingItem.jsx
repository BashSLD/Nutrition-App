// ShoppingItem.jsx
import s from '../styles/Lista.module.css'

const BADGE_CLASSES = {
  'Para los dos': 'badgeBoth',
  'Bash':         'badgeBash',
  'Eimy':         'badgeEimy',
  'Jugos':        'badgeJuice',
  'Opcional':     'badgeOpt',
}

export function ShoppingItem({ item, onToggle }) {
  return (
    <div
      className={`${s.shoppingItem} ${item.checked ? s.shoppingItemChecked : ''}`}
      onClick={() => onToggle(!item.checked)}
    >
      <div className={s.siChkWrap}>
        <div className={`${s.siChk} ${item.checked ? s.siChkDone : ''}`}>
          {item.checked && <span>✓</span>}
        </div>
      </div>
      <div className={s.siInfo}>
        <div className={s.siName}>{item.nombre}</div>
        {item.nota && <div className={s.siNote}>{item.nota}</div>}
        <div className={s.siMeta}>
          {item.cantidad && <span className={s.siQty}>{item.cantidad}</span>}
          {item.badge && <span className={`${s.siBadge} ${s[BADGE_CLASSES[item.badge]] || ''}`}>{item.badge}</span>}
        </div>
      </div>
    </div>
  )
}

export default ShoppingItem
