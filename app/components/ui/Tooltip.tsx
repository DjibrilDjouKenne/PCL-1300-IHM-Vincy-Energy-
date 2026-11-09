import styles from './Tooltip.module.css'

const TOOLTIPS: Record<string, string> = {
  A1: "Durée de l'impulsion radar émise.",
  A2: "Pulse Repetition Interval — temps entre deux impulsions. Doit être ≥ 8× la durée d'impulsion.",
  A3: "Pulse Repetition Frequency — fréquence de répétition des impulsions .",
  A4: "Rapport cyclique — pourcentage du temps où le radar émet.",
  A5: "Code de modulation de phase utilisé pour l'impulsion.",
  A6: "Nombre total d'impulsions émises par mesure.",
  A7: "Espacement entre cases distance en mètres.",
  A8: "Nombre de cases distance analysées. Doit être inférieur au max hardware.",
  A9: "Faisceau antenna sélectionné pour cette mesure parmi les 3 disponibles.",
  A10:"Durée totale de la mesure en secondes .",
  T1: "NCI Hard — intégrations cohérentes réalisées par le FPGA. Entre 1 et 50.",
  T2: "NCI Soft — intégrations cohérentes supplémentaires réalisées par le PC. Entre 1 et 50.",
  T3: "NFFT — nombre de points de la FFT. Doit être une puissance de 2.",
  T4: "NSPEC — nombre de spectres moyennés. Entre 1 et 50.",
  T5: "Recouvrement entre FFT successives, en % du NFFT.",
  T6: "Fenêtre de Hanning appliquée avant la FFT pour réduire les lobes secondaires.",
  T7: "Nombre de points du filtre passe-haut pour supprimer la composante continue.",
  T8: "Nombre maximal de pics Doppler identifiés dans chaque spectre.",
  T9: "Distance minimale en m/s entre deux pics pour qu'ils soient fusionnés.",
  P1: "Résolution en distance réelle.",
  P2: "Puissance moyenne émise en watts",
  P3: "Portée maximale instrumentée en mètres.",
  P4: "Portée maximale échantillonnée en mètres.",
  P5: "Distance aveugle — zone proche non détectable à cause de la durée d'impulsion.",
  P6: "Vitesse Doppler maximale mesurable sans ambiguïté.",
  P7: "Résolution en vitesse Doppler (pas minimal mesurable entre deux vitesses).",
}

interface TooltipProps {
  id: string
  children: React.ReactNode
}

export default function Tooltip({ id, children }: TooltipProps) {
  return (
    <span className={styles.wrapper} title={TOOLTIPS[id] ?? ''}>
      {children}
      <span className={styles.mark}>?</span>
    </span>
  )
}
