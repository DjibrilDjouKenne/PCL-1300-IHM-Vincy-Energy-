'use client'

import InputField   from '../../../components/ui/InputField'
import ResultField  from '../../../components/ui/ResultField'
import FormSection  from '../../../components/ui/FormSection'
import DureeBanner from './DureeBanner'
import type { MesureFormType, Antenne } from '../_types'
import styles from './MesureForm.module.css'

const DUREES_PULSE   = [0.3, 0.5, 1, 2.5] as const
const NFFT_OPTIONS   = [32, 64, 128, 256, 512, 1024, 2048, 4096] as const
const RECOUVREMENT   = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
const C              = 299792458
const P_MAX = 4000
const LAMBDA = 0.23

// export function calcul(m: MesureFormType) {
//   const prf         = m.pri > 0 ? 1000 / m.pri : 0
//   const rapCyc      = m.pri > 0 ? (m.dureePulse / m.pri) * 100 : 0
//   const nbImp       = m.nciHard * m.nciSoft * m.nfft * m.nspec
//   const duree       = m.pri > 0 ? (nbImp * m.pri) / 1e6 : 0
//   const resolution  = (C * m.resEchantillonnee * 1e-9) / 2
//   const puissanceMoy= 100 * (m.dureePulse / (m.pri || 1))
//   const portee      = m.resEchantillonnee * m.nbCasesDistance
//   const distAveugle = (C * m.dureePulse * 1e-6) / 2
//   const vDopMax     = C / (m.pri * 1e-6 * 4 * 1290e6) || 0
//   const vDopRes     = m.nfft > 0 ? (2 * vDopMax) / m.nfft : 0
//   return { prf, rapCyc, nbImp, duree, resolution, puissanceMoy, portee, distAveugle, vDopMax, vDopRes }
// }
export function calcul(m: MesureFormType) {

  const prf =
    m.pri > 0
      ? 1000 / m.pri
      : 0

  const rapCyc =
    m.pri > 0
      ? (m.dureePulse / m.pri) * 100
      : 0

  const nbImp =
    m.nciHard *
    m.nciSoft *
    (
      m.nfft +
      (
        (m.nspec - 1) * Math.round(
        m.nfft *
        ((100 - m.recouvrement) / 100)
      ))
    )

  const duree =
    m.pri > 0
      ? (
          m.nciHard *
          m.nciSoft *
          (
            m.nfft +
            (
              (m.nspec - 1) * 
              m.nfft *
              ((100 - m.recouvrement) / 100)
            )
          ) *
          m.pri
        ) / 1000000
      : 0

  const resolution =
    150 *
    m.dureePulse

  const puissanceMoy =
    m.pri > 0
      ? (m.dureePulse / m.pri) * P_MAX
      : 0

  const portee =
    150 *
    m.pri

  const porteeEchantillonnee =
    m.nbCasesDistance *
    m.resEchantillonnee

  const distAveugle =
    150 *
    m.dureePulse

  const vDopMax =
    (LAMBDA / 2) *
    (
      1 /
      (
        2 *
        m.pri *
        m.nciHard *
        m.nciSoft
      )
    ) *
    1000000

  const vDopRes =
    (LAMBDA / 2) *
    (
      1 /
      (
        m.pri *
        m.nciHard *
        m.nciSoft
      )
    ) *
    1000000 *
    (
      1 /
      m.nfft
    )

  return {
    prf,
    rapCyc,
    nbImp,
    duree,
    resolution,
    puissanceMoy,
    portee,
    porteeEchantillonnee,
    distAveugle,
    vDopMax,
    vDopRes
  }
}


interface Props {
  form: MesureFormType
  antennes: Antenne[]
  errors: Record<string, string>
  isNew: boolean
  hasSelection: boolean
  onChange: (key: keyof MesureFormType, val: string) => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}

export default function MesureForm({ form, antennes, errors, isNew, hasSelection, onChange, onSave, onCancel, onDelete }: Props) {
  const calc = calcul(form)

  return (
    <div className={styles.panel}>

      {/* Nom */}
      <div className={styles.header}>
        <input
          className={`${styles.titleInput} ${errors.nom ? styles.titleError : ''}`}
          value={form.nom}
          onChange={e => onChange('nom', e.target.value)}
          placeholder="Nom de la mesure"
        />
        {errors.nom && <span className={styles.errMsg}>{errors.nom}</span>}
      </div>

      {/* Corps 2 colonnes */}
      <div className={styles.body}>

        {/* Colonne gauche — saisie */}
        <div className={styles.col}>
          <FormSection title="Acquisition">
            <InputField label="Antenne" tooltipId="A9" type="select"
              value={form.antenneId} onChange={v => onChange('antenneId', v)}
              options={antennes.map(a => ({ value: a.id, label: `${a.nom} — ÉL${a.elevation}° AZ${a.azimut}°` }))} />
            <InputField label="Impulsion" tooltipId="A1" type="select" unit="µs"
              value={form.dureePulse} onChange={v => onChange('dureePulse', v)}
              options={DUREES_PULSE.map(d => ({ value: d, label: String(d) }))} />
            <InputField label="PRI" tooltipId="A2" unit="µs"
              value={form.pri} min={Math.ceil(8 * form.dureePulse)} step={1}
              onChange={v => onChange('pri', v)} error={errors.pri} />
            <InputField label="Rés. échant." tooltipId="A7" unit="m"
              value={form.resEchantillonnee} min={1}
              onChange={v => onChange('resEchantillonnee', v)} />
            <InputField label="Nb portes" tooltipId="A8"
              value={form.nbCasesDistance} min={1}
              onChange={v => onChange('nbCasesDistance', v)} error={errors.nbCasesDistance} />
            <InputField label="Code" tooltipId="A5" type="select"
              value={form.numeroCode} onChange={v => onChange('numeroCode', v)}
              options={[0,1,2,3,4].map(c => ({ value: c, label: `code${c}` }))} />
          </FormSection>

          <FormSection title="Traitement">
            <InputField label="NCI Hard" tooltipId="T1"
              value={form.nciHard} min={1} max={50}
              onChange={v => onChange('nciHard', v)} error={errors.nciHard} />
            <InputField label="NCI Soft" tooltipId="T2"
              value={form.nciSoft} min={1} max={50}
              onChange={v => onChange('nciSoft', v)} error={errors.nciSoft} />
            <InputField label="NFFT" tooltipId="T3" type="select"
              value={form.nfft} onChange={v => onChange('nfft', v)}
              options={NFFT_OPTIONS.map(n => ({ value: n, label: String(n) }))} />
            <InputField label="NSPEC" tooltipId="T4"
              value={form.nspec} min={1} max={50}
              onChange={v => onChange('nspec', v)} error={errors.nspec} />
            <InputField label="Recouvrement" tooltipId="T5" type="select" unit="%"
              value={form.recouvrement} onChange={v => onChange('recouvrement', v)}
              options={RECOUVREMENT.map(r => ({ value: r, label: `${r}%` }))} />
            <InputField label="Hanning" tooltipId="T6" type="checkbox"
              value={form.fenHanning} onChange={v => onChange('fenHanning', v)} />
            <InputField label="Filtre DC" tooltipId="T7" unit="pts"
              value={form.filtredc} min={1}
              onChange={v => onChange('filtredc', v)} error={errors.filtredc} />
            <InputField label="Nb pics" tooltipId="T8"
              value={form.nbPics} min={1} max={6}
              onChange={v => onChange('nbPics', v)} error={errors.nbPics} />
            <InputField label="Fusion pics" tooltipId="T9" unit="m/s"
              value={form.fusionPics} min={0.01} step={0.1}
              onChange={v => onChange('fusionPics', v)} error={errors.fusionPics} />
          </FormSection>
        </div>

        {/* Colonne droite — résultats */}
        <div className={styles.col}>
          <FormSection title="Performance">
            <ResultField label="PRF"           tooltipId="A3" unit="kHz" value={calc.prf.toFixed(3)} />
            <ResultField label="Rapport cycl." tooltipId="A4" unit="%"   value={calc.rapCyc.toFixed(2)} />
            <ResultField label="Nb impulsions" tooltipId="A6"             value={calc.nbImp.toLocaleString('fr')} />
          </FormSection>

          <FormSection title="Performance">
            <ResultField label="Résolution"     tooltipId="P1" unit="m"   value={calc.resolution.toFixed(2)} />
            <ResultField label="Puis. moyenne"  tooltipId="P2" unit="W"   value={calc.puissanceMoy.toFixed(1)} />
            <ResultField label="Portée"         tooltipId="P3" unit="m"   value={calc.portee.toFixed(0)} />
            <ResultField label="Dist. aveugle"  tooltipId="P5" unit="m"   value={calc.distAveugle.toFixed(0)} />
            <ResultField label="Vit. Dopp. max" tooltipId="P6" unit="m/s" value={calc.vDopMax.toFixed(2)} />
            <ResultField label="Rés. vitesse"   tooltipId="P7" unit="m/s" value={calc.vDopRes.toFixed(3)} />
          </FormSection>

          <DureeBanner duree={calc.duree} />

          <div className={styles.actions}>
            <button className={styles.btnOk}     onClick={onSave}>{isNew ? 'Créer' : 'Valider'}</button>
            <button className={styles.btnCancel}  onClick={onCancel}>Annuler</button>
            {!isNew && hasSelection && (
              <button className={styles.btnDelete} onClick={onDelete}>Supprimer</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
