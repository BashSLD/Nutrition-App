import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ACTIVIDAD_LABEL = {
  1.2:   'Sedentario',
  1.375: 'Ligero (1–3 días/sem)',
  1.55:  'Moderado (3–5 días/sem)',
  1.725: 'Intenso (6–7 días/sem)',
}

function calcModo(metaKcal, tdee) {
  if (!metaKcal || !tdee) return '—'
  if (metaKcal < tdee - 100) return 'déficit'
  if (Math.abs(metaKcal - tdee) <= 100) return 'mantenimiento'
  return 'superávit'
}

function calcTendencia(registros) {
  if (!registros || registros.length < 2) return 'sin datos suficientes'
  const delta = registros[registros.length - 1].peso_kg - registros[0].peso_kg
  if (delta < -0.5) return `bajando (${delta.toFixed(1)} kg)`
  if (delta > 0.5)  return `subiendo (+${delta.toFixed(1)} kg)`
  return `estancado (${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg)`
}

function buildPrompt({ profile, meals, jugos, tmb, tdee, registros }) {
  const metaKcal    = profile?.meta_kcal      || 0
  const peso        = profile?.peso_kg         || 0
  const altura      = profile?.altura_cm       || 0
  const edad        = profile?.edad            || 0
  const sexo        = profile?.sexo            || 'masculino'
  const actividad   = profile?.nivel_actividad || 1.2
  const deficit     = tdee - metaKcal
  const modo        = calcModo(metaKcal, tdee)
  const minKcal     = sexo === 'femenino' ? 1200 : 1500
  const protMin     = peso ? Math.round(peso * 1.6) : 0
  const tendencia   = calcTendencia(registros)
  const actLabel    = ACTIVIDAD_LABEL[actividad] || actividad
  const nOpciones   = profile?.theme === 'eimy' ? '5 desayunos, 6 comidas, 3 cenas' : '1 por tiempo de comida'

  const planJson = JSON.stringify({ meals, jugos }, null, 2)
  const registrosJson = JSON.stringify(
    registros.map(r => ({
      fecha: r.fecha,
      peso_kg: r.peso_kg,
      cintura_cm: r.cintura_cm ?? undefined,
      cadera_cm: r.cadera_cm ?? undefined,
    })),
    null, 2
  )

  return `Eres un nutriólogo asistente especializado en planes de nutrición deportiva y composición corporal.

## Datos del usuario
- Sexo: ${sexo}
- Edad: ${edad} años
- Peso actual: ${peso} kg
- Altura: ${altura} cm
- Nivel de actividad: ${actividad} (${actLabel})
- TMB (Mifflin-St Jeor 1990): ${tmb} kcal
- TDEE: ${tdee} kcal
- Meta: ${metaKcal} kcal/día (${modo}, ${deficit > 0 ? 'déficit' : 'superávit'} de ${Math.abs(deficit)} kcal)
- Mínimo absoluto: ${minKcal} kcal
- Proteína mínima: ${protMin}g/día (${peso}kg × 1.6)
- Modo: ${profile?.theme === 'eimy' ? 'eimy — rotación variada' : 'bash — plan fijo'}

## Objetivo actual
- Modo: ${modo}
- Diferencia con TDEE: ${metaKcal - tdee > 0 ? '+' : ''}${metaKcal - tdee} kcal

## Progreso reciente (últimos registros)
${registrosJson}
→ Tendencia de peso: ${tendencia}

## Plan actual
${planJson}

## Instrucción del usuario
"{mensaje}"

## Tu rol
Proporciona el plan nutricional actualizado con alimentos reales, porciones concretas y el valor calórico de cada comida (kcal_total).
El sistema calculará y validará los totales — tú NO sumas ni verificas el total, solo aporta datos precisos por comida.

## Reglas
1. kcal_total de cada meal debe ser el valor calórico real de esa comida, basado en ingredientes y porciones
2. Meta del día: ${metaKcal} kcal (rango ${metaKcal - Math.round(metaKcal * 0.05)}–${metaKcal + Math.round(metaKcal * 0.05)}) — distribuye bien entre comidas
3. Proteína mínima: ${protMin}g/día — no negociable
4. Ingredientes disponibles en México, sin ultraprocesados
5. No reemplazar comidas reales por snacks o postres
6. Número de opciones por perfil: ${nOpciones}
7. Si la instrucción viola alguna restricción, responde con rechazado: true y NO modifiques el plan

## Restricciones no negociables
- Sin reemplazar proteína completa por carbohidrato
- En superávit: no exceder TDEE + 600 kcal

## Formato de respuesta obligatorio
Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown.

{
  "rechazado": false,
  "cambios": ["descripción breve de cada cambio realizado"],
  "plan_actualizado": { ...mismo schema que plan actual... },
  "explicacion": "razonamiento nutricional del ajuste",
  "advertencias": ["si algo se acerca al límite o hay algo a considerar"]
}`
}

const ROW = ({ campo, fuente, valor, calculado }) => (
  <tr>
    <td style={{ padding: '6px 10px', color: 'var(--text)', fontWeight: 500 }}>{campo}</td>
    <td style={{ padding: '6px 10px' }}>
      <span style={{
        fontSize: 11, padding: '2px 7px', borderRadius: 99,
        background: calculado ? 'rgba(200,241,53,0.12)' : 'rgba(100,150,255,0.12)',
        color: calculado ? '#c8f135' : '#6b9fff',
        whiteSpace: 'nowrap'
      }}>
        {calculado ? '⚙ calculado' : '🗄 BD'}
      </span>
    </td>
    <td style={{ padding: '6px 10px', color: 'var(--muted)', fontSize: 12 }}>{fuente}</td>
    <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--accent)' }}>
      {valor ?? <span style={{ color: 'var(--muted)' }}>—</span>}
    </td>
  </tr>
)

export default function AdminPlanPanel({ profile, meals, jugos, tmb, tdee }) {
  const [open, setOpen] = useState(false)
  const [registros, setRegistros] = useState([])
  const [prompt, setPrompt] = useState('')
  const [promptEditado, setPromptEditado] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !profile?.id) return
    supabase
      .from('registros')
      .select('fecha, peso_kg, cintura_cm, cadera_cm')
      .eq('user_id', profile.id)
      .order('fecha', { ascending: true })
      .limit(10)
      .then(({ data }) => setRegistros(data || []))
  }, [open, profile?.id])

  useEffect(() => {
    if (!open) return
    const p = buildPrompt({ profile, meals, jugos, tmb, tdee, registros })
    setPrompt(p)
    setPromptEditado(p)
  }, [open, profile, meals, jugos, tmb, tdee, registros])

  function handleCopy() {
    navigator.clipboard.writeText(promptEditado)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReset() {
    setPromptEditado(prompt)
  }

  const metaKcal  = profile?.meta_kcal      || 0
  const peso      = profile?.peso_kg         || 0
  const altura    = profile?.altura_cm       || 0
  const edad      = profile?.edad            || 0
  const sexo      = profile?.sexo            || '—'
  const actividad = profile?.nivel_actividad || 1.2
  const deficit   = tdee - metaKcal
  const modo      = calcModo(metaKcal, tdee)
  const minKcal   = sexo === 'femenino' ? 1200 : 1500
  const protMin   = peso ? Math.round(peso * 1.6) : 0
  const tendencia = calcTendencia(registros)
  const actLabel  = ACTIVIDAD_LABEL[actividad] || actividad

  const tableStyle = {
    width: '100%', borderCollapse: 'collapse', fontSize: 13,
  }
  const thStyle = {
    padding: '6px 10px', textAlign: 'left', fontSize: 11,
    color: 'var(--muted)', borderBottom: '1px solid var(--border)',
    fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em'
  }

  return (
    <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 16 }}>

      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: '1px solid var(--border)',
          color: 'var(--muted)', padding: '6px 14px', borderRadius: 8,
          cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)',
          width: '100%', justifyContent: 'space-between'
        }}
      >
        <span>⚙ Panel admin — IA &amp; datos del prompt</span>
        <span style={{ fontSize: 10 }}>{open ? '▲ cerrar' : '▼ abrir'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── SECCIÓN 1: DATOS ── */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Datos del prompt
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Campo</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Fuente</th>
                    <th style={thStyle}>Valor actual</th>
                  </tr>
                </thead>
                <tbody>
                  <ROW campo="Sexo"              fuente="profiles.sexo"              valor={sexo}                                    calculado={false} />
                  <ROW campo="Edad"              fuente="profiles.edad"              valor={edad ? `${edad} años` : null}             calculado={false} />
                  <ROW campo="Peso"              fuente="profiles.peso_kg"           valor={peso ? `${peso} kg` : null}               calculado={false} />
                  <ROW campo="Altura"            fuente="profiles.altura_cm"         valor={altura ? `${altura} cm` : null}           calculado={false} />
                  <ROW campo="Nivel actividad"   fuente="profiles.nivel_actividad"   valor={`${actividad} — ${actLabel}`}             calculado={false} />
                  <ROW campo="Meta kcal"         fuente="profiles.meta_kcal"         valor={metaKcal ? `${metaKcal} kcal/día` : null} calculado={false} />
                  <ROW campo="TMB"               fuente="Mifflin-St Jeor 1990"       valor={tmb ? `${tmb.toLocaleString()} kcal` : null}  calculado={true} />
                  <ROW campo="TDEE"              fuente="TMB × nivel_actividad"      valor={tdee ? `${tdee.toLocaleString()} kcal` : null} calculado={true} />
                  <ROW campo="Déficit/Superávit" fuente="TDEE − meta_kcal"           valor={tdee && metaKcal ? `${deficit > 0 ? '-' : '+'}${Math.abs(deficit)} kcal` : null} calculado={true} />
                  <ROW campo="Modo"              fuente="meta vs TDEE (±100 kcal)"   valor={modo}                                    calculado={true} />
                  <ROW campo="Mínimo absoluto"   fuente="sexo (♂1500 / ♀1200)"      valor={`${minKcal} kcal`}                       calculado={true} />
                  <ROW campo="Proteína mínima"   fuente="peso × 1.6"                valor={protMin ? `${protMin}g/día` : null}       calculado={true} />
                  <ROW campo="Registros cargados" fuente="registros (últimos 10)"   valor={`${registros.length} registros`}         calculado={false} />
                  <ROW campo="Tendencia peso"    fuente="Δ primer → último registro" valor={tendencia}                               calculado={true} />
                  <ROW campo="Comidas en plan"   fuente="meals (user_id)"            valor={`${meals.length} comidas`}               calculado={false} />
                  <ROW campo="Jugos en plan"     fuente="jugos (user_id)"            valor={`${jugos.length} jugos`}                 calculado={false} />
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SECCIÓN 2: PROMPT ── */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Prompt ensamblado
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleReset}
                  style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-body)' }}
                >
                  ↺ Restaurar
                </button>
                <button
                  onClick={handleCopy}
                  style={{ background: 'var(--accent)', border: 'none', color: 'var(--bg)', padding: '3px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 700 }}
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            <textarea
              value={promptEditado}
              onChange={e => setPromptEditado(e.target.value)}
              style={{
                width: '100%', minHeight: 480,
                background: 'var(--surface2)', color: 'var(--text)',
                border: 'none', padding: '14px 16px',
                fontFamily: 'DM Mono, monospace', fontSize: 11.5,
                lineHeight: 1.7, resize: 'vertical', outline: 'none',
              }}
              spellCheck={false}
            />
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{promptEditado.length.toLocaleString()} caracteres</span>
              <span>{promptEditado !== prompt ? '● modificado' : '○ sin cambios'}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
