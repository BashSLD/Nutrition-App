// ShoppingItem.jsx
export function ShoppingItem({ item, onToggle }) {
  const BADGE_CLASSES = {
    'Para los dos': 'badge-both',
    'Bash':         'badge-bash',
    'Eimy':         'badge-eimy',
    'Jugos':        'badge-juice',
    'Opcional':     'badge-opt',
  }

  return (
    <div
      className={`shopping-item ${item.checked ? 'checked' : ''}`}
      onClick={() => onToggle(!item.checked)}
    >
      <div className="si-chk-wrap">
        <div className={`si-chk ${item.checked ? 'si-chk-done' : ''}`}>
          {item.checked && <span>✓</span>}
        </div>
      </div>
      <div className="si-info">
        <div className="si-name">{item.nombre}</div>
        {item.nota && <div className="si-note">{item.nota}</div>}
        <div className="si-meta">
          {item.cantidad && <span className="si-qty">{item.cantidad}</span>}
          {item.badge && <span className={`si-badge ${BADGE_CLASSES[item.badge] || ''}`}>{item.badge}</span>}
        </div>
      </div>
    </div>
  )
}

export default ShoppingItem
