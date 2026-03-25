import { useState, useEffect, useRef } from 'react'
import s from '../styles/Modal.module.css'
import btn from '../styles/shared.module.css'

export default function SearchFoodModal({ onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const inputRef = useRef(null)

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) inputRef.current.focus()
  }, [])

  async function handleSearch(e) {
    if (e) e.preventDefault()
    if (!query || query.length < 2) return

    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/fatsecret/search?query=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Error buscando alimentos')
      const data = await res.json()
      setResults(data)
    } catch (err) {
      setError('No se pudo conectar con la base de datos de alimentos.')
    } finally {
      setLoading(false)
    }
  }

  // Parse strings like "Por 100g - Calories: 165kcal | Fat: 3.57g | Carbs: ..."
  function parseKcal(description) {
    const match = description.match(/Calories:\s*(\d+)kcal/i) || description.match(/Calorías:\s*(\d+)kcal/i)
    return match ? parseInt(match[1]) : 0
  }
  
  function getServing(description) {
    const parts = description.split('-')
    return parts[0] ? parts[0].trim().replace(/^Por /, '') : '1 porción'
  }

  function handleSelect(food) {
    const kcal = parseKcal(food.description)
    const serving = getServing(food.description)
    onSelect({
      nombre: food.name,
      cantidad: serving,
      kcal: kcal
    })
  }

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modalCard} onClick={e => e.stopPropagation()} style={{ padding: '20px', maxWidth: '500px' }}>
        <div className={s.modalHeader}>
          <h3>Buscar alimento</h3>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            ref={inputRef}
            type="text"
            className={btn.editInput}
            style={{ flex: 1, fontSize: '14px', padding: '8px 12px' }}
            placeholder="Ej. Pechuga de pollo, Gansito..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className={btn.btnPrimary} style={{ padding: '8px 16px' }} disabled={loading}>
            {loading ? '...' : '🔍'}
          </button>
        </form>

        {error && <div className={btn.pageError} style={{ marginBottom: '16px' }}>{error}</div>}

        <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.length === 0 && !loading && query && !error && (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No se encontraron resultados</div>
          )}
          
          {loading && <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Buscando...</div>}

          {results.map(food => (
            <div 
              key={food.id} 
              onClick={() => handleSelect(food)}
              style={{
                background: 'var(--surface2)',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontWeight: 'bold', color: 'var(--text)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{food.name}</span>
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-head)' }}>{parseKcal(food.description)} kcal</span>
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {food.brand && <span style={{ marginRight: '8px', color: '#ccc' }}>[{food.brand}]</span>}
                {food.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
