import Tooltip from './Tooltip'
import styles from './InputField.module.css'

type Option = { value: string | number; label: string }

interface InputFieldProps {
  label: string
  tooltipId?: string
  value: string | number | boolean
  onChange: (v: string) => void
  type?: 'number' | 'select' | 'checkbox'
  unit?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  options?: Option[]
  error?: string
}

export default function InputField({
  label, tooltipId, value, onChange,
  type = 'number', unit, min, max, step,
  disabled, options, error,
}: InputFieldProps) {
  const labelNode = tooltipId
    ? <Tooltip id={tooltipId}>{label}</Tooltip>
    : label

  return (
    <div className={styles.group}>
      <div className={styles.row}>
        <label className={styles.label}>
          {labelNode}
          {unit && <span className={styles.unit}>{unit}</span>}
        </label>

        {type === 'select' && options ? (
          <select
            className={styles.input}
            value={String(value)}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
          >
            {options.map(o => (
              <option key={o.value} value={String(o.value)}>{o.label}</option>
            ))}
          </select>
        ) : type === 'checkbox' ? (
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked ? '1' : '0')}
            disabled={disabled}
          />
        ) : (
          <input
            type="number"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            value={String(value)}
            onChange={e => onChange(e.target.value)}
            min={min}
            max={max}
            step={step ?? 1}
            disabled={disabled}
          />
        )}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
