// Utilidades de fecha para zona horaria México (America/Mexico_City)

const TZ = 'America/Mexico_City'

/**
 * Convierte un string de fecha ISO (ej. "2026-03-25" o "2026-03-25T06:00:00Z")
 * en un objeto Date interpretado en hora local México, evitando el off-by-one UTC.
 */
export function parseFecha(fechaStr) {
  if (!fechaStr) return null
  // Si solo es YYYY-MM-DD, construir como local para evitar que JS lo trate como UTC
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)
  if (dateOnly) {
    const [y, m, d] = fechaStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(fechaStr)
}

/**
 * Retorna la fecha de hoy como string "YYYY-MM-DD" en hora México.
 */
export function getTodayFecha() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Formatea un string de fecha para mostrar, ej. "25 mar 2026".
 */
export function formatFecha(fechaStr) {
  if (!fechaStr) return '—'
  const d = parseFecha(fechaStr)
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  }).format(d)
}

/**
 * Calcula días de diferencia entre dos fechas "YYYY-MM-DD" (o Date).
 * Retorna número entero (puede ser negativo).
 */
export function diffDias(desde, hasta = getTodayFecha()) {
  const a = parseFecha(typeof desde === 'string' ? desde : desde.toISOString().slice(0, 10))
  const b = parseFecha(typeof hasta === 'string' ? hasta : hasta.toISOString().slice(0, 10))
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}
