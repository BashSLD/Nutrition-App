import { useState } from 'react'
import s from '../styles/Modal.module.css'
import btn from '../styles/shared.module.css'

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
    <div className={s.medidaForm}>
      <div className={s.mfField}>
        <label className={s.mfLabel}>Fecha</label>
        <input
          type="date"
          className={s.mfInput}
          value={values.fecha}
          onChange={e => handle('fecha', e.target.value)}
        />
      </div>

      <div className={s.mfGrid}>
        {fields.map(f => (
          <div key={f.key} className={s.mfField}>
            <label className={s.mfLabel}>{f.label} <span className={s.mfUnit}>({f.unit})</span></label>
            <input
              type={f.type}
              step="0.1"
              className={s.mfInput}
              placeholder="—"
              value={values[f.key]}
              onChange={e => handle(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className={s.mfField}>
        <label className={s.mfLabel}>Notas</label>
        <textarea
          className={`${s.mfInput} ${s.mfTextarea}`}
          placeholder="Cómo me siento, observaciones..."
          value={values.notas}
          onChange={e => handle('notas', e.target.value)}
          rows={3}
        />
      </div>

      <div className={s.mfActions}>
        <button className={btn.btnPrimary} onClick={submit}>Guardar</button>
        <button className={btn.btnSecondary} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
