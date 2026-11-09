import styles from './FormSection.module.css'

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.title}>{title}</div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
