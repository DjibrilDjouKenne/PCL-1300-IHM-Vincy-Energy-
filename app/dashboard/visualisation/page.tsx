'use client'

import { useState } from 'react'
import TypeSelector        from './_components/TypeSelector'
import FileDropZone        from './_components/FileDropZone'
import FileValidator       from './_components/FileValidator'
import ProfilVentViewer    from './_components/viewers/ProfilVentViewer'
import SpectreDopplerViewer from './_components/viewers/SpectreDopplerViewer'
import PlaceholderViewer   from './_components/viewers/PlaceholderViewer'
import { VIS_TYPES, VisType, Step, ValidationResult } from './_types'
import styles from './visualisation.module.css'

const STEPS: { id: Step; label: string }[] = [
  { id: 'type',       label: '1. Type' },
  { id: 'file',       label: '2. Fichier' },
  { id: 'validation', label: '3. Validation' },
  { id: 'viewer',     label: '4. Visualisation' },
]

export default function VisualisationPage() {
  const [step,       setStep]       = useState<Step>('type')
  const [visType,    setVisType]    = useState<VisType | null>(null)
  const [file,       setFile]       = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  const typeConfig = VIS_TYPES.find(t => t.id === visType) ?? null

  const goTo = (s: Step) => setStep(s)

  const handleTypeSelect = (t: VisType) => {
    setVisType(t)
    setFile(null)
    setValidation(null)
    setStep('file')
  }

  const handleFile = (f: File) => {
    setFile(f)
    setValidation(null)
    setStep('validation')
  }

  const handleValidation = (r: ValidationResult) => {
    setValidation(r)
    if (r.status === 'ok') setStep('viewer')
  }

  const reset = () => {
    setStep('type'); setVisType(null); setFile(null); setValidation(null)
  }

  return (
    <div className={styles.page}>

      {/* Titre */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Visualisation</h1>
        <span className={styles.pageSub}>Explorateur de données</span>
        {step !== 'type' && (
          <button className={styles.resetBtn} onClick={reset}>↩ Recommencer</button>
        )}
      </div>

      {/* Stepper */}
      <div className={styles.stepper}>
        {STEPS.map((s, i) => {
          const idx     = STEPS.findIndex(x => x.id === step)
          const isDone  = i < idx
          const isActive = s.id === step
          return (
            <div key={s.id} className={styles.stepperItem}>
              <button
                className={`${styles.stepBtn} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}
                onClick={() => isDone && goTo(s.id)}
                disabled={!isDone && !isActive}
              >
                <span className={styles.stepNum}>{isDone ? '✓' : i + 1}</span>
                <span className={styles.stepLabel}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`${styles.stepConnector} ${isDone ? styles.connectorDone : ''}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Contenu par étape */}
      <div className={styles.content}>

        {step === 'type' && (
          <TypeSelector selected={visType} onSelect={handleTypeSelect} />
        )}

        {step === 'file' && typeConfig && (
          <FileDropZone typeConfig={typeConfig} onFile={handleFile} />
        )}

        {step === 'validation' && typeConfig && file && (
          <div className={styles.validationWrap}>
            <FileValidator
              file={file}
              typeConfig={typeConfig}
              onResult={handleValidation}
            />
            {validation?.status === 'error' && (
              <button className={styles.retryBtn} onClick={() => setStep('file')}>
                ← Choisir un autre fichier
              </button>
            )}
          </div>
        )}

        {step === 'viewer' && typeConfig && validation?.payload && (
          <div className={styles.viewerWrap}>
            {/* En-tête viewer */}
            <div className={styles.viewerHeader}>
              <span className={styles.viewerTitle}>
                {typeConfig.icon} {typeConfig.label}
              </span>
              <span className={styles.viewerFile}>{file?.name}</span>
              <button className={styles.changeFileBtn} onClick={() => setStep('file')}>
                Changer de fichier
              </button>
            </div>

            {/* Viewer */}
            <div className={styles.viewerBody}>
              {visType === 'profil_vent' && (
                <ProfilVentViewer payload={validation.payload as Record<string,unknown>} />
              )}
              {visType === 'spectre_doppler' && (
                <SpectreDopplerViewer payload={validation.payload as Record<string,unknown>} />
              )}
              {visType !== 'profil_vent' && visType !== 'spectre_doppler' && typeConfig && (
                <PlaceholderViewer cfg={typeConfig} />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
