import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRealtime } from '../hooks/useRealtime'
import { supabase } from '../lib/supabase'
import ShoppingItem from '../components/ShoppingItem'
import s from '../styles/Lista.module.css'
import err from '../styles/shared.module.css'

const TABS = [
  { key: 'compartida', label: '🛒 Compartida' },
  { key: 'bash',       label: '⚡ Bash' },
  { key: 'eimy',       label: '✨ Eimy' },
]

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
      const { data, error: fetchErr } = await supabase
        .from('lista_items')
        .select('*')
        .eq('owner', tab)
        .order('categoria')
      if (fetchErr) throw fetchErr
      setItems(data || [])
    } catch {
      setError('No se pudo cargar la lista. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { setLoading(true); fetchItems() }, [fetchItems])

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
      const { error: resetErr } = await supabase.from('lista_items')
        .update({ checked: false, checked_by: null })
        .eq('owner', tab)
      if (resetErr) throw resetErr
      fetchItems()
    } catch {
      setError('No se pudo reiniciar la lista.')
    }
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = []
    acc[item.categoria].push(item)
    return acc
  }, {})

  const total = items.length
  const done = items.filter(i => i.checked).length
  const pct = total ? Math.round(done / total * 100) : 0

  const freqMap = {}
  items.forEach(i => {
    const cat = i.categoria
    if (!freqMap[cat]) freqMap[cat] = i.frecuencia || 'semanal'
  })

  return (
    <div className="page lista-page">

      <div className={s.listaHeader}>
        <h1 className={s.listaTitle}>Lista de compras</h1>
        {lastUpdate && (
          <span className={s.listaUpdated}>
            actualizado {Math.round((new Date() - lastUpdate) / 1000)}s atrás
          </span>
        )}
      </div>

      {error && (
        <div className={err.pageError}>
          {error}
          <button className={err.pageErrorRetry} onClick={fetchItems}>↺ Reintentar</button>
        </div>
      )}

      <div className={s.listaTabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${s.listaTab} ${tab === t.key ? s.listaTabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={s.freqCards}>
        <div className={s.freqCard}>
          <div className={s.fcIcon}>📦</div>
          <div className={s.fcTitle}>Cada 7 días</div>
          <div className={s.fcDesc}>Proteínas, lácteos, carbohidratos, especias</div>
        </div>
        <div className={`${s.freqCard} ${s.freqFresca}`}>
          <div className={s.fcIcon}>🥬</div>
          <div className={s.fcTitle}>Cada 3–4 días</div>
          <div className={s.fcDesc}>Verdura y fruta fresca para jugos y comidas</div>
        </div>
      </div>

      <div className={s.listaProgress}>
        <div className={s.lpTop}>
          <span className={s.lpLabel}>Progreso</span>
          <span className={s.lpPct}>{pct}%</span>
          <button className={s.btnReset} onClick={resetAll}>↺ Reiniciar</button>
        </div>
        <div className={s.lpBar}>
          <div className={s.lpFill} style={{ width: `${pct}%` }} />
        </div>
        <div className={s.lpStats}>
          <div className={s.lps}><div className={s.lpsVal}>{done}</div><div className={s.lpsKey}>Comprados</div></div>
          <div className={s.lps}><div className={`${s.lpsVal} ${s.lpsPending}`}>{total - done}</div><div className={s.lpsKey}>Pendientes</div></div>
          <div className={s.lps}><div className={s.lpsVal}>{total}</div><div className={s.lpsKey}>Total</div></div>
        </div>
      </div>

      {loading
        ? <div className="page-loading">Cargando...</div>
        : Object.entries(grouped).map(([cat, catItems]) => {
            const freq = freqMap[cat]
            return (
              <div key={cat} className={s.catSection}>
                <div className={`${s.catHeader} ${freq === '3-4 dias' ? s.catHeaderFresca : ''}`}>
                  <span className={s.catName}>{cat}</span>
                  {freq === '3-4 dias' && <span className={s.catFreq}>🔄 c/3–4 días</span>}
                  <span className={s.catCount}>{catItems.filter(i => i.checked).length}/{catItems.length}</span>
                </div>
                <div className={s.catItems}>
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
