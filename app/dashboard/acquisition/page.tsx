'use client'

import { useRadar } from '@/context/RadarContext'
import { useState, useCallback } from 'react'
import MesureList    from './_components/MesureList'
import MesureForm    from './_components/MesureForm'
import CyclePanel    from './_components/CyclePanel'
import ConfirmDialog from './_components/ConfirmDialog'
import type { Mesure, MesureFormType, Antenne, CycleItem, DialogContext } from './_types'
import styles from './acquisition.module.css'

/* ── Constantes ── */
const ANTENNES: Antenne[] = [
  { id: 0, nom: 'Vert.', elevation: 90, azimut: 0  },
  { id: 1, nom: 'N',     elevation: 73, azimut: 0  },
  { id: 2, nom: 'E',     elevation: 73, azimut: 90 },
]

const MESURE_DEFAUT: MesureFormType = {
  nom: '', dureePulse: 2.5, pri: 100, resEchantillonnee: 150,
  nbCasesDistance: 70, antenneId: 0, numeroCode: 0,
  nciHard: 29, nciSoft: 1, nfft: 128, nspec: 50,
  recouvrement: 0, fenHanning: true, filtredc: 1, nbPics: 3, fusionPics: 0.9,
}

const MOCK_MESURES: Mesure[] = [
  { id: 1, ...MESURE_DEFAUT, nom: 'Mesure 1', antenneId: 0 },
  { id: 2, ...MESURE_DEFAUT, nom: 'Mesure 2', antenneId: 1 },
  { id: 3, ...MESURE_DEFAUT, nom: 'Mesure 3', antenneId: 2 },
]

const MOCK_CYCLE: CycleItem[] = [
  { mesureId: 1, repetitions: 1 },
  { mesureId: 2, repetitions: 1 },
  { mesureId: 3, repetitions: 1 },
]

/* ── Validation formulaire ── */
export function validate(form: MesureFormType): Record<string, string> {
  const e: Record<string, string> = {}
  if (!form.nom.trim())                        e.nom             = 'Nom requis'
  if (form.pri < 8 * form.dureePulse)         e.pri             = `PRI ≥ ${8 * form.dureePulse} µs`
  if (form.nbCasesDistance <= 0)              e.nbCasesDistance = '> 0'
  if (form.nciHard < 1 || form.nciHard > 50) e.nciHard         = '1–50'
  if (form.nciSoft < 1 || form.nciSoft > 50) e.nciSoft         = '1–50'
  if (form.nspec   < 1 || form.nspec   > 50) e.nspec           = '1–50'
  if (form.nbPics  < 1 || form.nbPics  > 6)  e.nbPics          = '1–6'
  if (form.fusionPics <= 0)                   e.fusionPics      = '> 0'
  if (form.filtredc < 1)                      e.filtredc        = '≥ 1'
  return e
}

/* ============================================================
   PAGE PRINCIPALE
   ============================================================ */
export default function AcquisitionPage() {
  /* État global */
  const [mesures,    setMesures]    = useState<Mesure[]>(MOCK_MESURES)
  const [cycle,      setCycle]      = useState<CycleItem[]>(MOCK_CYCLE)
  const { radarActif, setRadarActif } = useRadar()

  /* État formulaire */
  const [selectedId, setSelected] = useState<number | null>(1)
  const [form,       setForm]     = useState<MesureFormType>({ ...MESURE_DEFAUT, nom: 'Mesure 1' })
  const [isNew,      setIsNew]    = useState(false)
  const [errors,     setErrors]   = useState<Record<string, string>>({})

  /* Dialogue (cas 1/2/3 gérés ici — cas 4/5 gérés dans CyclePanel) */
  const [dialog, setDialog] = useState<DialogContext | null>(null)

  /* Helpers */
  const selected    = mesures.find(m => m.id === selectedId) ?? null
  const posInCycle  = (id: number) => cycle.reduce<number[]>((acc, c, i) => c.mesureId === id ? [...acc, i] : acc, [])
  const isInCycle   = (id: number) => posInCycle(id).length > 0

  /* ── Sélection ── */
  const handleSelect = (m: Mesure) => {
    setSelected(m.id)
    const { id, ...rest } = m
    setForm(rest)
    setIsNew(false)
    setErrors({})
  }

  /* ── Nouvelle mesure ── */
  const handleNew = () => {
    setSelected(null)
    setForm({ ...MESURE_DEFAUT, nom: `Mesure ${mesures.length + 1}` })
    setIsNew(true)
    setErrors({})
  }

  /* ── Changer un champ ── */
  const handleChange = useCallback((key: keyof MesureFormType, val: string) => {
    setForm(prev => {
      const num  = parseFloat(val)
      const next = { ...prev } as Record<string, unknown>
      next[key]  = isNaN(num) ? val === '1' ? true : val === '0' ? false : val : num
      return next as MesureFormType
    })
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }, [])

  /* ── Valider (créer ou modifier) ── */
  const handleSave = () => {
    const e = validate(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }

    if (isNew) {
      const id = Math.max(0, ...mesures.map(m => m.id)) + 1
      setMesures(prev => [...prev, { id, ...form }])
      setSelected(id)
      setIsNew(false)
      setErrors({})
      return
    }

    if (!selectedId) return

    /* Cas 3 — modifier une mesure dans le cycle avec radar actif */
    if (radarActif && isInCycle(selectedId)) {
      setDialog({ type: 'EDIT_MESURE_RADAR_ON', mesureId: selectedId })
    } else {
      applyEdit(selectedId)
    }
    setErrors({})
  }

  const applyEdit = (id: number) => {
    setMesures(prev => prev.map(m => m.id === id ? { id, ...form } : m))
    setDialog(null)
  }

  /* ── Supprimer une mesure ── */
  const handleDelete = () => {
    if (!selectedId) return
    const positions = posInCycle(selectedId)
    const inCycle   = positions.length > 0

    /* Cas 2 — dans le cycle ET radar actif */
    if (radarActif && inCycle) {
      setDialog({ type: 'DELETE_MESURE_RADAR_ON', mesureId: selectedId, positionsCycle: positions })
    /* Cas 1 — dans le cycle, radar arrêté */
    } else if (inCycle) {
      setDialog({ type: 'DELETE_MESURE_IN_CYCLE', mesureId: selectedId, positionsCycle: positions })
    /* Cas simple — pas dans le cycle */
    } else {
      setDialog({ type: 'DELETE_MESURE_SIMPLE', mesureId: selectedId })
    }
  }

  const applyDelete = (id: number) => {
    setCycle(prev => prev.filter(c => c.mesureId !== id))
    setMesures(prev => prev.filter(m => m.id !== id))
    setSelected(null)
    setIsNew(false)
    setDialog(null)
  }

  /* ── Annuler ── */
  const handleCancel = () => {
    if (selected) { setForm({ ...selected }); setErrors({}) }
    else { setSelected(null); setIsNew(false) }
  }

  /* ── Config des dialogues (cas 1, 2, 3) ── */
  const dialogConfig = (() => {
    if (!dialog) return null
    const m   = mesures.find(x => x.id === (dialog as { mesureId?: number }).mesureId)
    const nom = m?.nom ?? '—'

    switch (dialog.type) {

      /* Cas simple — pas dans le cycle */
      case 'DELETE_MESURE_SIMPLE':
        return {
          severity: 'warn' as const,
          title: 'Confirmer la suppression',
          message: <>Supprimer <strong>{nom}</strong> définitivement ?</>,
          actions: [
            { label: 'Annuler',    variant: 'secondary' as const, onClick: () => setDialog(null) },
            { label: 'Supprimer', variant: 'danger'    as const, onClick: () => applyDelete(dialog.mesureId) },
          ],
        }

      /* Cas 1 — dans le cycle, radar arrêté */
      case 'DELETE_MESURE_IN_CYCLE': {
        const nb  = dialog.positionsCycle.length
        const pos = nb === 1
          ? `à la position ${dialog.positionsCycle[0] + 1}`
          : `à ${nb} positions`
        return {
          severity: 'warn' as const,
          title: 'Mesure utilisée dans le cycle',
          message: (
            <>
              <strong>{nom}</strong> est présente dans le cycle ({pos}).<br /><br />
              La supprimer la retirera <strong>également du cycle</strong>.
            </>
          ),
          actions: [
            { label: 'Annuler',                 variant: 'secondary' as const, onClick: () => setDialog(null) },
            { label: 'Supprimer quand même',    variant: 'danger'    as const, onClick: () => applyDelete(dialog.mesureId) },
          ],
        }
      }

      /* Cas 2 — dans le cycle + radar actif */
      case 'DELETE_MESURE_RADAR_ON': {
        const nb  = dialog.positionsCycle.length
        const pos = nb === 1
          ? `à la position ${dialog.positionsCycle[0] + 1}`
          : `à ${nb} positions`
        return {
          severity: 'danger' as const,
          title: "Suppression pendant l'acquisition",
          message: (
            <>
              Le radar est <strong>en cours d'acquisition</strong>.<br /><br />
              <strong>{nom}</strong> est active dans le cycle ({pos}).
              La supprimer la retirera du cycle au{' '}
              <strong>prochain cycle d'acquisition</strong>.
            </>
          ),
          actions: [
            { label: 'Annuler',                 variant: 'secondary' as const, onClick: () => setDialog(null) },
            { label: 'Supprimer quand même',    variant: 'danger'    as const, onClick: () => applyDelete(dialog.mesureId) },
          ],
        }
      }

      /* Cas 3 — modifier mesure active */
      case 'EDIT_MESURE_RADAR_ON':
        return {
          severity: 'warn' as const,
          title: "Modification pendant l'acquisition",
          message: (
            <>
              Le radar est <strong>en acquisition</strong> et{' '}
              <strong>{nom}</strong> fait partie du cycle actif.<br /><br />
              Les modifications prendront effet au{' '}
              <strong>prochain cycle</strong>.
            </>
          ),
          actions: [
            { label: 'Annuler',              variant: 'secondary' as const, onClick: () => setDialog(null) },
            { label: 'Modifier quand même', variant: 'primary'   as const, onClick: () => applyEdit(dialog.mesureId) },
          ],
        }

      default:
        return null
    }
  })()

  /* ============================================================
     RENDU
     ============================================================ */
  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Acquisition</h1>
        <span className={styles.pageSubtitle}>Configuration et commande</span>
        {radarActif && (
          <span className={styles.radarBadge}>● Radar en acquisition</span>
        )}
      </div>

      <div className={styles.layout}>

        {/* Gauche — cycle + commandes */}
        <CyclePanel
          mesures={mesures}
          antennes={ANTENNES}
          radarActif={radarActif}
          cycle={cycle}
          onCycleChange={setCycle}
          onRadarChange={setRadarActif}
        />

        {/* Centre — formulaire mesure */}
        <div className={styles.center}>
          {(selectedId !== null || isNew) ? (
            <MesureForm
              form={form}
              antennes={ANTENNES}
              errors={errors}
              isNew={isNew}
              hasSelection={!!selected}
              onChange={handleChange}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          ) : (
            <div className={styles.placeholder}>
              Sélectionnez une mesure ou créez-en une nouvelle
            </div>
          )}
        </div>

        {/* Droite — liste mesures */}
        <MesureList
          mesures={mesures}
          antennes={ANTENNES}
          selectedId={selectedId}
          cycle={cycle}
          onSelect={handleSelect}
          onNew={handleNew}
        />

      </div>

      {/* Dialogue global — cas 1, 2, 3 */}
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
