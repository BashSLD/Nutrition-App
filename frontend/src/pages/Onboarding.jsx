import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Onboarding({ user, onComplete }) {
  const [loading, setLoading] = useState(false)

  async function elegir(theme) {
    setLoading(true)
    const nombre = theme === 'bash' ? 'Bash' : 'Eimy'
    const meta = theme === 'bash' ? 1700 : 1300
    const peso = theme === 'bash' ? 80 : 60
    const altura = theme === 'bash' ? 164 : 150
    const edad = theme === 'bash' ? 34 : 24

    await supabase.from('profiles').upsert({
      id: user.id,
      name: nombre,
      theme,
      peso_kg: peso,
      altura_cm: altura,
      edad,
      meta_kcal: meta,
    })

    onComplete()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
      padding: '2rem',
    }}>
      <h1 style={{ color: '#fff', fontSize: '1.5rem', fontFamily: 'sans-serif' }}>
        ¿Quién eres?
      </h1>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <button
          onClick={() => elegir('bash')}
          disabled={loading}
          style={{
            padding: '2rem 3rem',
            background: '#111',
            border: '2px solid #c8f135',
            borderRadius: '12px',
            color: '#c8f135',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'sans-serif',
          }}
        >
          Bash
        </button>
        <button
          onClick={() => elegir('eimy')}
          disabled={loading}
          style={{
            padding: '2rem 3rem',
            background: '#2a0035',
            border: '2px solid #ff1aab',
            borderRadius: '12px',
            color: '#ff1aab',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: 'sans-serif',
          }}
        >
          Eimy
        </button>
      </div>
    </div>
  )
}
