import styles from './Card.module.css'
import Badge, { BadgeVariant } from './Badge'

interface CardProps {
  title: string
  badge?: {
    label: string
    variant: BadgeVariant
  }
  children: React.ReactNode
  action?: React.ReactNode
}

export default function Card({ title, badge, children, action }: CardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.headerRight}>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
          {action && <div className={styles.action}>{action}</div>}
        </div>
      </div>
      <div className={styles.body}>
        {children}
      </div>
    </div>
  )
}
