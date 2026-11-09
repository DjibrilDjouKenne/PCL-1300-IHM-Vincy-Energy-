import styles from './DureeBanner.module.css'

interface DureeBannerProps { duree: number }

export default function DureeBanner({ duree }: DureeBannerProps) {
  return (
    <div className={styles.banner}>
      <span className={styles.label}>Durée mesure</span>
      <span className={styles.value}>{duree.toFixed(2)} s</span>
    </div>
  )
}
