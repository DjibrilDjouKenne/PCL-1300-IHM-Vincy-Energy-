import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'danger' | 'success' | 'secondary' | 'ghost'

interface ButtonProps {
  variant?: ButtonVariant
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  icon?: React.ReactNode
  type?: 'button' | 'submit'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  disabled = false,
  onClick,
  children,
  icon,
  type = 'button',
  fullWidth = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        styles.btn,
        styles[variant],
        fullWidth ? styles.fullWidth : '',
      ].join(' ')}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  )
}
