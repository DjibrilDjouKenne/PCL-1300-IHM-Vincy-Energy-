'use client'

import { useEffect, useState } from 'react'
import { VisTypeConfig, ValidationResult } from '../_types'
import styles from './FileValidator.module.css'

interface Props {
  file:       File
  typeConfig: VisTypeConfig
  onResult:   (result: ValidationResult) => void
}

export default function FileValidator({ file, typeConfig, onResult }: Props) {
  const [result, setResult] = useState<ValidationResult>({ status: 'loading' })

  useEffect(() => {
    validate(file, typeConfig).then(r => {
      setResult(r)
      onResult(r)
    })
  }, [file, typeConfig])

  return (
    <div className={styles.wrapper}>
      <div className={styles.introTitle}>
        🔍 Validation du fichier
      </div>

      {result.status === 'loading' && (
        <div className={styles.stateBox}>
          <span className={styles.spinner}>⏳</span>
          <span className={styles.stateMsg}>Lecture et validation en cours…</span>
        </div>
      )}

      {result.status === 'error' && (
        <div className={`${styles.stateBox} ${styles.stateError}`}>
          <span className={styles.stateIcon}>⛔</span>
          <div className={styles.stateContent}>
            <span className={styles.stateTitle}>Fichier incompatible</span>
            <span className={styles.stateMsg}>{result.message}</span>
            {result.summary?.missingRequired && (
              <div className={styles.missingList}>
                <span className={styles.missingTitle}>Variables manquantes :</span>
                {result.summary.missingRequired.map(v => (
                  <span key={v} className={styles.missingItem}>{v}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {result.status === 'ok' && result.summary && (
        <div className={`${styles.stateBox} ${styles.stateOk}`}>
          <span className={styles.stateIcon}>✅</span>
          <div className={styles.stateContent}>
            <span className={styles.stateTitle}>Fichier valide — {file.name}</span>

            {/* Dimensions */}
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Dimensions</span>
              <div className={styles.chips}>
                {Object.entries(result.summary.dims).map(([k, v]) => (
                  <span key={k} className={styles.chip}>{k} : {v}</span>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div className={styles.summarySection}>
              <span className={styles.summaryLabel}>Variables détectées</span>
              <div className={styles.chips}>
                {result.summary.vars.map(v => {
                  const isReq = typeConfig.requiredVars?.includes(v)
                  const isOpt = typeConfig.optionalVars?.includes(v)
                  return (
                    <span key={v} className={`${styles.chip} ${isReq ? styles.chipReq : isOpt ? styles.chipOpt : ''}`}>
                      {v}
                      {isReq && ' ✓'}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Métadonnées */}
            {result.summary.meta && Object.keys(result.summary.meta).length > 0 && (
              <div className={styles.summarySection}>
                <span className={styles.summaryLabel}>Métadonnées</span>
                <div className={styles.metaList}>
                  {Object.entries(result.summary.meta).slice(0, 4).map(([k, v]) => (
                    <div key={k} className={styles.metaRow}>
                      <span className={styles.metaKey}>{k}</span>
                      <span className={styles.metaVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   LOGIQUE DE VALIDATION
   ============================================================ */
async function validate(file: File, cfg: VisTypeConfig): Promise<ValidationResult> {
  try {
    // Upload du fichier vers l'API de validation
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', cfg.id)

    const res = await fetch('/api/netcdf/validate', {
      method: 'POST',
      body:   formData,
    })

    const json = await res.json()

    if (json.error) {
      return { status: 'error', message: json.error }
    }

    // Vérification des variables requises
    const missingRequired = (cfg.requiredVars ?? []).filter(
      v => !json.vars.includes(v)
    )

    if (missingRequired.length > 0) {
      return {
        status:  'error',
        message: `Ce fichier ne contient pas les variables nécessaires pour "${cfg.label}".`,
        summary: { dims: json.dims, vars: json.vars, meta: json.meta, missingRequired },
      }
    }

    return {
      status:  'ok',
      summary: { dims: json.dims, vars: json.vars, meta: json.meta },
      payload: json.payload,
    }

  } catch (err) {
    return {
      status:  'error',
      message: `Erreur de communication avec le serveur : ${(err as Error).message}`,
    }
  }
}
