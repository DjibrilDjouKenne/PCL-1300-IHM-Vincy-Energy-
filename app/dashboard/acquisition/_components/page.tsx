'use client'

import { useState, useCallback } from 'react'
import MesureList    from './_components/MesureList'
import MesureForm    from './_components/MesureForm'
import CyclePanel    from './_components/CyclePanel'
import type { Mesure, MesureFormType, Antenne } from './_types'
import styles from './acquisition.module.css'

const ANTENNES: Antenne[] = [
  { id: 0, nom: 'Vert.', elevation: 90, azimut: 0   },
  { id: 1, nom: 'N',     elevation: 73, azimut: 0   },
  { id: 2, nom: 'E',     elevation: 73, azimut: 90  },
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

export default function AcquisitionPage() {
  const [mesures, setMesures]     = useState<Mesure[]>(MOCK_MESURES)
  const [selectedId, setSelected] = useState<number | null>(1)
  const [form, setForm]           = useState<MesureFormType>({ ...MESURE_DEFAUT, nom: 'Mesure 1', antenneId: 0 })
  const [isNew, setIsNew]         = useState(false)
  const [errors, setErrors]       = useState<Record<string, string>>({})

  const selected = mesures.find(m => m.id === selectedId) ?? null

  const handleSelect = (m: Mesure) => {
    setSelected(m.id)
    const { id, ...rest } = m
    setForm(rest)
    setIsNew(false)
    setErrors({})
  }

  const handleNew = () => {
    setSelected(null)
    setForm({ ...MESURE_DEFAUT, nom: `Mesure ${mesures.length + 1}` })
    setIsNew(true)
    setErrors({})
  }

  const handleChange = useCallback((key: keyof MesureFormType, val: string) => {
    setForm(prev => {
      const num = parseFloat(val)
      const next = { ...prev } as Record<string, unknown>
      next[key] = isNaN(num)
        ? val === '1' ? true : val === '0' ? false : val
        : num
      return next as MesureFormType
    })
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }, [])

  const handleSave = () => {
    const e = validate(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    if (isNew) {
      const id = Math.max(0, ...mesures.map(m => m.id)) + 1
      setMesures(prev => [...prev, { id, ...form }])
      setSelected(id)
      setIsNew(false)
    } else if (selectedId) {
      setMesures(prev => prev.map(m => m.id === selectedId ? { id: selectedId, ...form } : m))
    }
    setErrors({})
  }

  const handleCancel = () => {
    if (selected) { setForm({ ...selected }); setErrors({}) }
    else { setSelected(null); setIsNew(false) }
  }

  const handleDelete = () => {
    if (!selectedId) return
    setMesures(prev => prev.filter(m => m.id !== selectedId))
    setSelected(null)
    setIsNew(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Acquisition</h1>
        <span className={styles.pageSubtitle}>Configuration et commande</span>
      </div>

      <div className={styles.layout}>
        {/* Gauche — cycle + commandes */}
        <CyclePanel mesures={mesures} antennes={ANTENNES} />

        {/* Centre — paramètres mesure sélectionnée */}
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
          onSelect={handleSelect}
          onNew={handleNew}
        />
      </div>
    </div>
  )
}
