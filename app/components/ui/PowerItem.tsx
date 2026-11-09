import styles from './PowerItem.module.css'

export type PowerStatus = 'ok' | 'err' | 'warn'

interface PowerItemProps {
  label: string
  value: string
  status: PowerStatus
}

export default function PowerItem({ label, value, status }: PowerItemProps) {
  return (
    <div className={styles.item}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${styles[status]}`}>{value}</span>
    </div>
  )
}
