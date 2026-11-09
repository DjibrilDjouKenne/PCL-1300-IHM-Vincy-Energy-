import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion — IHM Radariste | Degrané Horizon',
  description: 'Accès sécurisé au système de mesure atmosphérique',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
