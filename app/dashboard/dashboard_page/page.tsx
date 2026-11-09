'use client'

import { useRadar } from '@/context/RadarContext'
import SpectreDoppler from './_components/SpectreDoppler'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const { radarActif, setRadarActif } = useRadar()

  return (
    <div className={styles.page}>

      {/* ── Panneau gauche 1/3 ── */}
      <aside className={styles.sidebar}>

        {/* Commandes radar */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Commandes radar</div>

          <div className={styles.cmdRow}>
            <button
              className={`${styles.cmdBtn} ${styles.cmdStart}`}
              disabled={radarActif}
              onClick={() => setRadarActif(true)}
            >
              <span className={styles.cmdIcon}>▶</span>
              Départ
            </button>
            <button
              className={`${styles.cmdBtn} ${styles.cmdStop}`}
              disabled={!radarActif}
              onClick={() => setRadarActif(false)}
            >
              <span className={styles.cmdIcon}>■</span>
              Arrêt
            </button>
          </div>

          {/* Indicateur d'état */}
          <div className={`${styles.statusBadge} ${radarActif ? styles.statusOn : styles.statusOff}`}>
            <span className={styles.statusDot} />
            {radarActif ? 'En acquisition' : 'Arrêté'}
          </div>
        </div>

        {/* Paramètres — à venir */}
        <div className={`${styles.card} ${styles.cardFuture}`}>
          <div className={styles.cardTitle}>Paramètres</div>
          <div className={styles.cardPlaceholder}>
            À venir
          </div>
        </div>

      </aside>

      {/* ── Spectre Doppler 2/3 ── */}
      <main className={styles.main}>
        <SpectreDoppler />
      </main>

    </div>
  )
}
