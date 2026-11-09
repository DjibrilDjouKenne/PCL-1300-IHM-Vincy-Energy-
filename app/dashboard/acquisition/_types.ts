export type Antenne = {
  id: number
  nom: string
  elevation: number
  azimut: number
}

export type MesureFormType = {
  nom: string
  dureePulse: 0.3 | 0.5 | 1 | 2.5
  pri: number
  resEchantillonnee: number
  nbCasesDistance: number
  antenneId: number
  numeroCode: number
  nciHard: number
  nciSoft: number
  nfft: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096
  nspec: number
  recouvrement: number
  fenHanning: boolean
  filtredc: number
  nbPics: number
  fusionPics: number
}

export type Mesure = MesureFormType & { id: number }

export type CycleItem = {
  mesureId: number
  repetitions: number
}

export type DialogContext =
  | { type: 'DELETE_MESURE_SIMPLE';   mesureId: number }
  | { type: 'DELETE_MESURE_IN_CYCLE'; mesureId: number; positionsCycle: number[] }
  | { type: 'DELETE_MESURE_RADAR_ON'; mesureId: number; positionsCycle: number[] }
  | { type: 'EDIT_MESURE_RADAR_ON';   mesureId: number }
  | { type: 'ADD_TO_CYCLE_RADAR_ON';  mesureId: number }
  | { type: 'REMOVE_FROM_CYCLE_RADAR_ON'; cycleIdx: number; mesureNom: string }
