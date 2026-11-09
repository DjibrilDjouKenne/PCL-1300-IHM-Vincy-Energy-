'use client'

import { useState } from 'react'
import ConfigTraitement    from './_Components/ConfigTraitement'
import SpectreDopplerGraph from './_Components/SpectreDopplerGraph'
import styles from './traitement.module.css'

type Onglet = 'tr' | 'td'

export default function TraitementPage() {
  const [onglet, setOnglet] = useState<Onglet>('td')

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Traitement vent</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${onglet === 'tr' ? styles.tabActive : ''}`}
          onClick={() => setOnglet('tr')}
        >
          Temps réel
        </button>
        <button
          className={`${styles.tab} ${onglet === 'td' ? styles.tabActive : ''}`}
          onClick={() => setOnglet('td')}
        >
          Temps différé
        </button>
      </div>

      <div className={styles.content}>

        {onglet === 'tr' && (
          <div className={styles.emptyPane}>
            <span className={styles.emptyMsg}>Visualisation temps réel — à venir</span>
          </div>
        )}

        {onglet === 'td' && (
          <div className={styles.tdLayout}>
            <div className={styles.tdLeft}>
              <ConfigTraitement />
            </div>
            <div className={styles.tdRight}>
              <SpectreDopplerGraph />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
