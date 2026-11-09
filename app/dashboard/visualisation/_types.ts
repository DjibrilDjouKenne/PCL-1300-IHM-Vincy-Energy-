/* ============================================================
   TYPES PARTAGÉS — Outil de visualisation
   ============================================================ */

/* ── Types de visualisation disponibles ── */
export type VisType =
  | 'spectre_doppler'
  | 'profil_vent'
  | 'serie_temporelle'
  | 'parametres_meteo'
  | 'signal_iq'
  | 'tension'

export interface VisTypeConfig {
  id:          VisType
  label:       string
  description: string
  icon:        string          // emoji
  extensions:  string[]        // extensions acceptées
  status:      'active' | 'soon'
  /* Variables NetCDF requises pour validation */
  requiredVars?: string[]
  optionalVars?: string[]
}

export const VIS_TYPES: VisTypeConfig[] = [
  {
    id:           'spectre_doppler',
    label:        'Spectre Doppler',
    description:  'Puissance spectrale par porte distance et vitesse radiale',
    icon:         '📡',
    extensions:   ['.nc', '.nc4'],
    status:       'active',
    requiredVars: ['spectra', 'velocity', 'altitude'],
    optionalVars: ['time', 'power'],
  },
  {
    id:           'profil_vent',
    label:        'Profil de vent',
    description:  'Diagramme temps/altitude avec barbules OMM',
    icon:         '💨',
    extensions:   ['.nc', '.nc4'],
    status:       'active',
    requiredVars: ['u', 'v', 'altitude', 'time'],
    optionalVars: ['w', 'wind_speed', 'wind_from_direction'],
  },
  {
    id:           'serie_temporelle',
    label:        'Série temporelle',
    description:  'Évolution dune variable météo dans le temps',
    icon:         '📈',
    extensions:   ['.nc', '.nc4', '.csv'],
    status:       'soon',
  },
  {
    id:           'parametres_meteo',
    label:        'Paramètres météo',
    description:  'Température, pression, humidité par altitude',
    icon:         '🌡',
    extensions:   ['.nc', '.nc4'],
    status:       'soon',
  },
  {
    id:           'signal_iq',
    label:        'Signal I/Q',
    description:  'Composantes en phase et en quadrature du signal radar',
    icon:         '〰️',
    extensions:   ['.nc', '.nc4', '.bin'],
    status:       'soon',
  },
  {
    id:           'tension',
    label:        'Tension',
    description:  'Signal de tension en fonction du temps',
    icon:         '⚡',
    extensions:   ['.nc', '.nc4', '.csv'],
    status:       'soon',
  },
]

/* ── Étapes du stepper ── */
export type Step = 'type' | 'file' | 'validation' | 'viewer'

/* ── Résultat de validation ── */
export type ValidationStatus = 'idle' | 'loading' | 'ok' | 'error'

export interface ValidationResult {
  status:   ValidationStatus
  message?: string
  summary?: {
    dims:      Record<string, number>
    vars:      string[]
    meta?:     Record<string, string>
    missingRequired?: string[]
  }
  payload?: Record<string, unknown>
}
