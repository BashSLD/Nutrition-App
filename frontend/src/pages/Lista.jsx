import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import { supabase } from '../lib/supabase'
import ShoppingItem from '../components/ShoppingItem'

const TABS = [
  { key: 'compartida', label: '🛒 Compartida' },
  { key: 'bash',       label: '⚡ Bash' },
  { key: 'eimy',       label: '✨ Eimy' },
]

const FREQ_LABELS = {
  'semanal':   { label: 'Cada 7 días',    color: 'blue',  icon: '📦' },
  '3-4 dias':  { label: 'Cada 3–4 días',  color: 'green', icon: '🥬' },
}

export default function Lista() {
  const { user } = useAuth()
  const [tab, setTab] = useState('compartida')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchItems = useCallback(async () => {
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('lista_items')
        .select('*')
        .eq('owner', tab)
        .order('categoria')
      if (err) throw err
      setItems(data || [])
    } catch {
      setError('No se pudo cargar la lista. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { setLoading(true); fetchItems() }, [fetchItems])

  // Realtime — actualiza item específico sin recargar todo
  const handleRealtime = useCallback((payload) => {
    if (payload.new?.owner !== tab) return
    setLastUpdate(new Date())
    if (payload.eventType === 'UPDATE') {
      setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new : i))
    } else if (payload.eventType === 'INSERT') {
      setItems(prev => [...prev, payload.new])
    } else if (payload.eventType === 'DELETE') {
      setItems(prev => prev.filter(i => i.id !== payload.old.id))
    }
  }, [tab])

  useRealtime(handleRealtime)

  async function toggleItem(id, checked) {
    await supabase.from('lista_items').update({
      checked,
      checked_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('id', id)
  }

  async function resetAll() {
    try {
      const { error: err } = await supabase.from('lista_items')
        .update({ checked: false, checked_by: null })
        .eq('owner', tab)
      if (err) throw err
      fetchItems()
    } catch {
      setError('No se pudo reiniciar la lista.')
    }
  }

  // Agrupar por categoría
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = []
    acc[item.categoria].push(item)
    return acc
  }, {})

  const total = items.length
  const done = items.filter(i => i.checked).length
  const pct = total ? Math.round(done / total * 100) : 0

  // Agrupar categorías por frecuencia
  const freqMap = {}
  items.forEach(i => {
    const cat = i.categoria
    if (!freqMap[cat]) freqMap[cat] = i.frecuencia || 'semanal'
  })

  return (
    <div className="page lista-page">

      <div className="lista-header">
        <h1 className="lista-title">Lista de compras</h1>
        {lastUpdate && (
          <span className="lista-updated">
            actualizado {Math.round((new Date() - lastUpdate) / 1000)}s atrás
          </span>
        )}
      </div>

      {error && (
        <div className="page-error">
          {error}
          <button className="page-error-retry" onClick={fetchItems}>↺ Reintentar</button>
        </div>
      )}

      {/* TABS */}
      <div className="lista-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`lista-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* FRECUENCIA CARDS */}
      <div className="freq-cards">
        <div className="freq-card freq-semanal">
          <div className="fc-icon">📦</div>
          <div className="fc-title">Cada 7 días</div>
          <div className="fc-desc">Proteínas, lácteos, carbohidratos, especias</div>
        </div>
        <div className="freq-card freq-fresca">
          <div className="fc-icon">🥬</div>
          <div className="fc-title">Cada 3–4 días</div>
          <div className="fc-desc">Verdura y fruta fresca para jugos y comidas</div>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="lista-progress">
        <div className="lp-top">
          <span className="lp-label">Progreso</span>
          <span className="lp-pct">{pct}%</span>
          <button className="btn-reset" onClick={resetAll}>↺ Reiniciar</button>
        </div>
        <div className="lp-bar">
          <div className="lp-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="lp-stats">
          <div className="lps"><div className="lps-val">{done}</div><div className="lps-key">Comprados</div></div>
          <div className="lps"><div className="lps-val lps-pending">{total - done}</div><div className="lps-key">Pendientes</div></div>
          <div className="lps"><div className="lps-val">{total}</div><div className="lps-key">Total</div></div>
        </div>
      </div>

      {/* ITEMS por categoría */}
      {loading
        ? <div className="page-loading">Cargando...</div>
        : Object.entries(grouped).map(([cat, catItems]) => {
            const freq = freqMap[cat]
            return (
              <div key={cat} className="cat-section">
                <div className={`cat-header ${freq === '3-4 dias' ? 'fresca' : ''}`}>
                  <span className="cat-name">{cat}</span>
                  {freq === '3-4 dias' && <span className="cat-freq">🔄 c/3–4 días</span>}
                  <span className="cat-count">{catItems.filter(i => i.checked).length}/{catItems.length}</span>
                </div>
                <div className="cat-items">
                  {catItems.map(item => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={(checked) => toggleItem(item.id, checked)}
                    />
                  ))}
                </div>
              </div>
            )
          })
      }

    </div>
  )
}
