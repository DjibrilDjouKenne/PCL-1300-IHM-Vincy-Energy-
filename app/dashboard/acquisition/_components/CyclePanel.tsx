'use client'

import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import type { Mesure, Antenne, CycleItem, DialogContext } from '../_types'
import styles from './CyclePanel.module.css'

function isCycleComplet(cycle: CycleItem[], mesures: Mesure[], antennes: Antenne[]) {
  const ids = new Set(
    cycle.map(c => mesures.find(m => m.id === c.mesureId)?.antenneId)
         .filter((id): id is number => id !== undefined)
  )
  return antennes.every(a => ids.has(a.id))
}

interface Props {
  mesures: Mesure[]
  antennes: Antenne[]
  radarActif: boolean
  cycle: CycleItem[]
  onCycleChange: (cycle: CycleItem[]) => void
  onRadarChange: (active: boolean) => void
}

export default function CyclePanel({ mesures, antennes, radarActif, cycle, onCycleChange, onRadarChange }: Props) {
  const [attPluie,    setAttPluie]    = useState(true)
  const [dopplerAuto, setDopplerAuto] = useState(false)
  const [dialog, setDialog]           = useState<DialogContext | null>(null)

  const complet = isCycleComplet(cycle, mesures, antennes)
  const antennesManquantes = antennes.filter(a =>
    !cycle.some(c => mesures.find(m => m.id === c.mesureId)?.antenneId === a.id)
  )
  const tooltipVoyant = complet
    ? 'Cycle complet — chaque antenne est représentée au moins une fois.'
    : `Cycle incomplet — antenne(s) manquante(s) : ${antennesManquantes.map(a => a.nom).join(', ')}`

  /* Ajouter au cycle */
  const handleAdd = (mesureId: number) => {
    if (radarActif) {
      setDialog({ type: 'ADD_TO_CYCLE_RADAR_ON', mesureId })
    } else {
      onCycleChange([...cycle, { mesureId, repetitions: 1 }])
    }
  }

  /* Retirer du cycle */
  const handleRemove = (idx: number) => {
    const m = mesures.find(x => x.id === cycle[idx]?.mesureId)
    if (radarActif) {
      setDialog({ type: 'REMOVE_FROM_CYCLE_RADAR_ON', cycleIdx: idx, mesureNom: m?.nom ?? '—' })
    } else {
      onCycleChange(cycle.filter((_, i) => i !== idx))
    }
  }

  /* Répétitions */
  const handleRep = (idx: number, val: number) =>
    onCycleChange(cycle.map((c, i) => i === idx ? { ...c, repetitions: Math.max(1, val) } : c))

  /* Confirmer */
  const confirm = () => {
    if (!dialog) return
    if (dialog.type === 'ADD_TO_CYCLE_RADAR_ON') {
      onCycleChange([...cycle, { mesureId: dialog.mesureId, repetitions: 1 }])
    } else if (dialog.type === 'REMOVE_FROM_CYCLE_RADAR_ON') {
      onCycleChange(cycle.filter((_, i) => i !== dialog.cycleIdx))
    }
    setDialog(null)
  }

  /* Config dialogue */
  const dialogConfig = (() => {
    if (!dialog) return null
    if (dialog.type === 'ADD_TO_CYCLE_RADAR_ON') {
      const m = mesures.find(x => x.id === dialog.mesureId)
      return {
        severity: 'warn' as const,
        title: "Ajout pendant l'acquisition",
        message: (
          <>
            Le radar est <strong>en acquisition</strong>.<br />
            L'ajout de <strong>{m?.nom}</strong> prendra effet au{' '}
            <strong>prochain cycle</strong>, pas immédiatement.
          </>
        ),
        actions: [
          { label: 'Annuler',          variant: 'secondary' as const, onClick: () => setDialog(null) },
          { label: 'Ajouter quand même', variant: 'primary' as const,   onClick: confirm },
        ],
      }
    }
    if (dialog.type === 'REMOVE_FROM_CYCLE_RADAR_ON') {
      return {
        severity: 'danger' as const,
        title: "Retrait pendant l'acquisition",
        message: (
          <>
            Le radar est <strong>en acquisition</strong>.<br />
            Retirer <strong>{dialog.mesureNom}</strong> prendra effet au{' '}
            <strong>prochain cycle</strong>.<br /><br />
            Si c'est la seule mesure de son antenne, le cycle deviendra incomplet.
          </>
        ),
        actions: [
          { label: 'Annuler',            variant: 'secondary' as const, onClick: () => setDialog(null) },
          { label: 'Retirer quand même', variant: 'danger'    as const, onClick: confirm },
        ],
      }
    }
    return null
  })()

  const getMesure  = (id: number) => mesures.find(m => m.id === id)
  const getAntenne = (id: number) => antennes.find(a => a.id === id)

  return (
    <div className={styles.panel}>

      {/* En-tête + voyant */}
      <div className={styles.cycleHeader}>
        <span className={styles.sectionTitle}>Cycle de mesure</span>
        <span className={styles.voyantWrapper} title={tooltipVoyant}>
          <span className={`${styles.voyant} ${complet ? styles.voyantOk : styles.voyantErr}`} />
          <span className={styles.voyantLabel}>{complet ? 'Complet' : 'Incomplet'}</span>
        </span>
      </div>

      {/* Séquence du cycle */}
      <div className={styles.cycleList}>
        {cycle.map((item, idx) => {
          const m   = getMesure(item.mesureId)
          const ant = m ? getAntenne(m.antenneId) : null
          return (
            <div key={idx} className={styles.cycleItem}>
              <span className={styles.cycleIdx}>{idx + 1}</span>
              <div className={styles.cycleInfo}>
                <span className={styles.cycleName}>{m?.nom ?? '—'}</span>
                <span className={styles.cycleAnt}>{ant?.nom}</span>
              </div>
              <input
                type="number"
                className={styles.repInput}
                value={item.repetitions}
                min={1} max={10}
                title="Nombre de répétitions"
                onChange={e => handleRep(idx, parseInt(e.target.value) || 1)}
              />
              <button
                className={styles.removeBtn}
                title="Retirer du cycle"
                onClick={() => handleRemove(idx)}
              >×</button>
            </div>
          )
        })}
        {cycle.length === 0 && <div className={styles.empty}>Aucune mesure dans le cycle</div>}
      </div>

      {/* Ajouter au cycle */}
      <div className={styles.sectionTitle} style={{ marginTop: 6 }}>Ajouter au cycle</div>
      <div className={styles.addList}>
        {mesures.map(m => (
          <button key={m.id} className={styles.addBtn} onClick={() => handleAdd(m.id)}>
            + {m.nom}
          </button>
        ))}
        {mesures.length === 0 && <span className={styles.empty}>Créez d'abord des mesures</span>}
      </div>

      <div className={styles.sep} />

      {/* Contrôle automatique */}
      <div className={styles.sectionTitle}>Contrôle automatique</div>
      <div className={styles.checkList}>
        <label className={styles.checkRow}>
          <input type="checkbox" className={styles.check}
            checked={attPluie} onChange={e => setAttPluie(e.target.checked)} />
          Atténuation pluie
        </label>
        <label className={styles.checkRow}>
          <input type="checkbox" className={styles.check}
            checked={dopplerAuto} onChange={e => setDopplerAuto(e.target.checked)} />
          Doppler automatique
        </label>
      </div>

      <div className={styles.sep} />

      {/* Commandes */}
      <div className={styles.sectionTitle}>Commandes</div>
      <div className={styles.cmdRow}>
        <button className={`${styles.cmdBtn} ${styles.cmdStart}`}
          disabled={radarActif} onClick={() => onRadarChange(true)}>
          ▶ Départ
        </button>
        <button className={`${styles.cmdBtn} ${styles.cmdStop}`}
          disabled={!radarActif} onClick={() => onRadarChange(false)}>
          ■ Arrêt
        </button>
      </div>
      <div className={`${styles.statusBadge} ${radarActif ? styles.statusOn : styles.statusOff}`}>
        {radarActif ? '● En acquisition' : '○ Arrêté'}
      </div>

      {/* Dialogue */}
      {dialogConfig && (
        <ConfirmDialog
          open={true}
          severity={dialogConfig.severity}
          title={dialogConfig.title}
          message={dialogConfig.message}
          actions={dialogConfig.actions}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
