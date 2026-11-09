import styles from './Divider.module.css'

interface DividerProps {
  label?: string
}

export default function Divider({ label }: DividerProps) {
  if (!label) return <hr className={styles.line} />

  return (
    <div className={styles.labeled}>
      <span className={styles.line} />
      <span className={styles.label}>{label}</span>
      <span className={styles.line} />
    </div>
  )
}
