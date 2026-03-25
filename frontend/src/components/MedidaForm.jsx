import { useState } from 'react'

export default function MedidaForm({ initial, onSave, onCancel }) {
  const [values, setValues] = useState({
    fecha:       initial?.fecha       || new Date().toISOString().split('T')[0],
    peso_kg:     initial?.peso_kg     || '',
    cintura_cm:  initial?.cintura_cm  || '',
    cadera_cm:   initial?.cadera_cm   || '',
    cuello_cm:   initial?.cuello_cm   || '',
    abdomen_cm:  initial?.abdomen_cm  || '',
    notas:       initial?.notas       || '',
  })

  function handle(field, val) {
    setValues(prev => ({ ...prev, [field]: val }))
  }

  function submit() {
    const clean = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])
    )
    onSave(clean)
  }

  const fields = [
    { key: 'peso_kg',    label: 'Peso',    unit: 'kg',   type: 'number' },
    { key: 'cintura_cm', label: 'Cintura', unit: 'cm',   type: 'number' },
    { key: 'cadera_cm',  label: 'Cadera',  unit: 'cm',   type: 'number' },
    { key: 'cuello_cm',  label: 'Cuello',  unit: 'cm',   type: 'number' },
    { key: 'abdomen_cm', label: 'Abdomen', unit: 'cm',   type: 'number' },
  ]

  return (
    <div className="medida-form">
      <div className="mf-field">
        <label className="mf-label">Fecha</label>
        <input
          type="date"
          className="mf-input"
          value={values.fecha}
          onChange={e => handle('fecha', e.target.value)}
        />
      </div>

      <div className="mf-grid">
        {fields.map(f => (
          <div key={f.key} className="mf-field">
            <label className="mf-label">{f.label} <span className="mf-unit">({f.unit})</span></label>
            <input
              type={f.type}
              step="0.1"
              className="mf-input"
              placeholder="—"
              value={values[f.key]}
              onChange={e => handle(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="mf-field">
        <label className="mf-label">Notas</label>
        <textarea
          className="mf-input mf-textarea"
          placeholder="Cómo me siento, observaciones..."
          value={values.notas}
          onChange={e => handle('notas', e.target.value)}
          rows={3}
        />
      </div>

      <div className="mf-actions">
        <button className="btn-primary" onClick={submit}>Guardar</button>
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
