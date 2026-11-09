'use client'

import { useState } from 'react'
import styles from './ConfigTraitement.module.css'

/* ============================================================
   Types
   ============================================================ */

interface ConfigTraitementData {
  premiereDonnee: string   // date-heure ISO
  derniereDonnee: string
  dureeTraitement: number  // minutes
  decalage: number         // minutes
}

/* Durées disponibles en minutes */
const DUREES    = [5, 10, 15, 20, 30, 45, 60]
const DECALAGES = [1, 2, 3, 5, 10, 15, 20, 30]

/* ============================================================
   Helpers
   ============================================================ */

function formatDatetime(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  const yy = String(d.getFullYear()).slice(2)
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${dd}/${mo}/${yy} ${hh}:${mm}:${ss}`
}

function nbMesuresCycle() {
  // Mock — sera remplacé par la vraie valeur issue du cycle configuré
  return 6
}

function dureeCycle(dureeTraitement: number, nbMesures: number) {
  // Durée approx d'un cycle en secondes (mock : ~30s par mesure)
  return nbMesures * 30
}

function nbCycles(dureeMin: number, dureeCycleSec: number) {
  if (dureeCycleSec <= 0) return 0
  return Math.floor((dureeMin * 60) / dureeCycleSec)
}

function formatDuree(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ============================================================
   Composant
   ============================================================ */

export default function ConfigTraitement() {
  const [config, setConfig] = useState<ConfigTraitementData>({
    premiereDonnee:  '2026-03-09T10:01:55',
    derniereDonnee:  '2026-03-09T12:56:34',
    dureeTraitement: 15,
    decalage:        15,
  })

  const [showPicker, setShowPicker] = useState<'premiere' | 'derniere' | null>(null)

  const nb    = nbMesuresCycle()
  const cyc   = dureeCycle(config.dureeTraitement, nb)
  const ncyc  = nbCycles(config.dureeTraitement, cyc)

  const handleAutre = (which: 'premiere' | 'derniere') => {
    // Ouvre le sélecteur natif datetime-local
    setShowPicker(which)
  }

  const handleDateChange = (which: 'premiere' | 'derniere', val: string) => {
    setConfig(prev => ({
      ...prev,
      [which === 'premiere' ? 'premiereDonnee' : 'derniereDonnee']: val,
    }))
    setShowPicker(null)
  }

  const handleOk = () => {
    // TODO — appel API backend
    console.log('Config traitement validée :', config)
  }

  const handleAnnuler = () => {
    // Reset ou fermer
  }

  return (
    <div className={styles.card}>

      {/* ── Titre ── */}
      <div className={styles.cardTitle}>Configuration du traitement</div>

      {/* ── Plage de données ── */}
      <div className={styles.row}>
        <span className={styles.rowLabel}>Première donnée</span>
        <span className={styles.datetimeVal}>{formatDatetime(config.premiereDonnee)}</span>
        <button className={styles.autreBtn} onClick={() => handleAutre('premiere')}>autre…</button>
      </div>

      <div className={styles.row}>
        <span className={styles.rowLabel}>Dernière donnée</span>
        <span className={styles.datetimeVal}>{formatDatetime(config.derniereDonnee)}</span>
        <button className={styles.autreBtn} onClick={() => handleAutre('derniere')}>autre…</button>
        <span className={styles.arrow}>›</span>
      </div>

      {/* Info cycle */}
      <div className={styles.infoRow}>
        <span className={styles.infoChip}>{nb} mesures/cycle</span>
        <span className={styles.infoChip}>
          durée d'un cycle : {cyc}s = {formatDuree(cyc)}
        </span>
      </div>

      {/* ── Durée du traitement ── */}
      <div className={styles.row}>
        <span className={styles.rowLabel}>Durée du traitement</span>
        <select
          className={styles.select}
          value={config.dureeTraitement}
          onChange={e => setConfig(prev => ({ ...prev, dureeTraitement: Number(e.target.value) }))}
        >
          {DUREES.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span className={styles.unit}>min</span>
        <span className={styles.cycleInfo}>({ncyc} cycles)</span>
      </div>

      {/* ── Décalage entre traitements ── */}
      <div className={styles.row}>
        <span className={styles.rowLabel}>Décalage entre traitements</span>
        <select
          className={styles.select}
          value={config.decalage}
          onChange={e => setConfig(prev => ({ ...prev, decalage: Number(e.target.value) }))}
        >
          {DECALAGES.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <span className={styles.unit}>min</span>
      </div>

      {/* ── Sélecteur datetime natif (caché) ── */}
      {showPicker && (
        <div className={styles.pickerOverlay} onClick={() => setShowPicker(null)}>
          <div className={styles.pickerBox} onClick={e => e.stopPropagation()}>
            <div className={styles.pickerTitle}>
              {showPicker === 'premiere' ? 'Première donnée' : 'Dernière donnée'}
            </div>
            <input
              type="datetime-local"
              className={styles.dtInput}
              defaultValue={
                showPicker === 'premiere'
                  ? config.premiereDonnee.slice(0, 16)
                  : config.derniereDonnee.slice(0, 16)
              }
              onChange={e => handleDateChange(showPicker, e.target.value + ':00')}
            />
            <div className={styles.pickerActions}>
              <button className={styles.pickerCancel} onClick={() => setShowPicker(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className={styles.actions}>
        <button className={styles.btnOk}      onClick={handleOk}>OK</button>
        <button className={styles.btnAnnuler} onClick={handleAnnuler}>Annuler</button>
      </div>

    </div>
  )
}
