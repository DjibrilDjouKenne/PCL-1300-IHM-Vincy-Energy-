'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

/* ============================================================
   CONTEXTE GLOBAL — État du radar (partagé entre toutes les pages)
   Placer <RadarProvider> dans app/layout.tsx ou app/dashboard/layout.tsx
   ============================================================ */

interface RadarContextType {
  radarActif:    boolean
  setRadarActif: (active: boolean) => void
}

const RadarContext = createContext<RadarContextType | null>(null)

export function RadarProvider({ children }: { children: ReactNode }) {
  const [radarActif, setRadarActif] = useState(false)
  return (
    <RadarContext.Provider value={{ radarActif, setRadarActif }}>
      {children}
    </RadarContext.Provider>
  )
}

export function useRadar(): RadarContextType {
  const ctx = useContext(RadarContext)
  if (!ctx) throw new Error('useRadar doit être utilisé dans un <RadarProvider>')
  return ctx
}
