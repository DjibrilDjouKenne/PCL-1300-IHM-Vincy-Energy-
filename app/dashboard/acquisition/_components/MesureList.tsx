import type { Mesure, Antenne, CycleItem } from '../_types'
import styles from './MesureList.module.css'

interface Props {
  mesures: Mesure[]
  antennes: Antenne[]
  selectedId: number | null
  cycle: CycleItem[]
  onSelect: (m: Mesure) => void
  onNew: () => void
}

export default function MesureList({ mesures, antennes, selectedId, cycle, onSelect, onNew }: Props) {
  const isInCycle = (id: number) => cycle.some(c => c.mesureId === id)

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Mesures</span>
        <button className={styles.btnNew} onClick={onNew}>+ Nouvelle</button>
      </div>
      <div className={styles.list}>
        {mesures.map(m => {
          const ant     = antennes.find(a => a.id === m.antenneId)
          const inCycle = isInCycle(m.id)
          return (
            <button
              key={m.id}
              className={`${styles.item} ${m.id === selectedId ? styles.itemActive : ''}`}
              onClick={() => onSelect(m)}
            >
              <div className={styles.itemTop}>
                <span className={styles.itemName}>{m.nom}</span>
                {inCycle && (
                  <span className={styles.cycleTag} title="Présente dans le cycle">C</span>
                )}
              </div>
              <span className={styles.itemSub}>{ant?.nom} — {m.dureePulse}µs</span>
            </button>
          )
        })}
        {mesures.length === 0 && <div className={styles.empty}>Aucune mesure</div>}
      </div>
    </div>
  )
}
