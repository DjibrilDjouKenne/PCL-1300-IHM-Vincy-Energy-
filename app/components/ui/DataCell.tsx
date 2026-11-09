import styles from './DataCell.module.css'

export type DataVariant = 'normal' | 'altered' | 'error' | 'highlight' | 'exergue' | 'invalid'

interface DataCellProps {
  label: string
  value: string
  variant?: DataVariant
  unit?: string
}

export default function DataCell({
  label,
  value,
  variant = 'normal',
  unit,
}: DataCellProps) {
  return (
    <div className={styles.cell}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${styles[variant]}`}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
    </div>
  )
}
