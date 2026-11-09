'use client'

import { VIS_TYPES, VisType, VisTypeConfig } from '../_types'
import styles from './TypeSelector.module.css'

interface Props {
  selected: VisType | null
  onSelect: (type: VisType) => void
}

export default function TypeSelector({ selected, onSelect }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.intro}>
        <span className={styles.introTitle}>Que souhaitez-vous visualiser ?</span>
        <span className={styles.introSub}>Sélectionnez un type de visualisation pour commencer.</span>
      </div>
      <div className={styles.grid}>
        {VIS_TYPES.map(cfg => (
          <TypeCard
            key={cfg.id}
            cfg={cfg}
            isSelected={selected === cfg.id}
            onSelect={() => cfg.status === 'active' && onSelect(cfg.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TypeCard({ cfg, isSelected, onSelect }: {
  cfg: VisTypeConfig
  isSelected: boolean
  onSelect: () => void
}) {
  const isSoon = cfg.status === 'soon'
  return (
    <button
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${isSoon ? styles.cardSoon : ''}`}
      onClick={onSelect}
      disabled={isSoon}
      title={isSoon ? 'Disponible prochainement' : cfg.description}
    >
      <span className={styles.cardIcon}>{cfg.icon}</span>
      <span className={styles.cardLabel}>{cfg.label}</span>
      <span className={styles.cardDesc}>{cfg.description}</span>
      <div className={styles.cardFooter}>
        {isSoon
          ? <span className={styles.badgeSoon}>Bientôt</span>
          : <span className={styles.badgeExt}>{cfg.extensions.join(' · ')}</span>
        }
        {isSelected && <span className={styles.badgeOk}>✓ Sélectionné</span>}
      </div>
    </button>
  )
}
