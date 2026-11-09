import styles from './Badge.module.css'

export type BadgeVariant = 'ok' | 'err' | 'warn' | 'live' | 'maint' | 'info'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  )
}
