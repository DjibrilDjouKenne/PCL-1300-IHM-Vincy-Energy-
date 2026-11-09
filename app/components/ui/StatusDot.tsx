import styles from './StatusDot.module.css'

export type DotColor = 'green' | 'yellow' | 'red' | 'blue' | 'grey'

interface StatusDotProps {
  color: DotColor
  label?: string
  value?: string
  pulse?: boolean
}

export default function StatusDot({ color, label, value, pulse = false }: StatusDotProps) {
  return (
    <div className={styles.wrapper}>
      <span className={[styles.dot, styles[color], pulse ? styles.pulse : ''].join(' ')} />
      {label && (
        <span className={styles.label}>
          {label}
          {value && <> — <strong>{value}</strong></>}
        </span>
      )}
    </div>
  )
}
