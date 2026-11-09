import styles from './ConfirmDialog.module.css'

export type DialogSeverity = 'warn' | 'danger' | 'info'

export interface DialogAction {
  label: string
  variant: 'primary' | 'danger' | 'secondary'
  onClick: () => void
}

interface Props {
  open: boolean
  severity: DialogSeverity
  title: string
  message: React.ReactNode
  actions: DialogAction[]
  onClose: () => void
}

const ICONS: Record<DialogSeverity, string> = {
  warn:   '⚠',
  danger: '⛔',
  info:   'ℹ',
}

export default function ConfirmDialog({ open, severity, title, message, actions, onClose }: Props) {
  if (!open) return null
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.dialog} ${styles[severity]}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.icon}>{ICONS[severity]}</span>
          <span className={styles.title}>{title}</span>
        </div>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          {actions.map((a, i) => (
            <button key={i} className={`${styles.btn} ${styles[`btn_${a.variant}`]}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
