import { VisTypeConfig } from '../../_types'
import styles from './PlaceholderViewer.module.css'

export default function PlaceholderViewer({ cfg }: { cfg: VisTypeConfig }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icon}>{cfg.icon}</span>
      <span className={styles.title}>{cfg.label}</span>
      <span className={styles.msg}>
        La visualisation de ce type de données sera disponible prochainement.
      </span>
    </div>
  )
}
