import Tooltip from './Tooltip'
import styles from './ResultField.module.css'

interface ResultFieldProps {
  label: string
  tooltipId: string
  value: string
  unit?: string
}

export default function ResultField({ label, tooltipId, value, unit }: ResultFieldProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>
        <Tooltip id={tooltipId}>{label}</Tooltip>
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
