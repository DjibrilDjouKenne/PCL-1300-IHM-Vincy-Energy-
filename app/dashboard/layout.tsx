'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { RadarProvider } from '@/context/RadarContext'
import styles from './dashboard.module.css'

const NAV_ITEMS = [
  {
    href: '/dashboard/dashboard_page',
    label: 'Dashboard',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/acquisition',
    label: 'ACQUISITION',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
        <path d="M12 6a6 6 0 0 1 6 6"/>
        <line x1="12" y1="12" x2="19" y2="5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/traitement',
    label: 'traitement vent',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8h10c2 0 3-1 3-2.5S14.5 3 13 3c-1.2 0-2.2.7-2.7 1.8" />
        <path d="M3 12h15c1.7 0 3 1.3 3 3s-1.3 3-3 3c-1.3 0-2.4-.8-2.8-2" />
        <path d="M3 16h8c1.7 0 3 1.3 3 3s-1.3 3-3 3c-1.3 0-2.4-.8-2.8-2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profil',
    label: 'profil de vent',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8h10c2 0 3-1 3-2.5S14.5 3 13 3c-1.2 0-2.2.7-2.7 1.8" />
        <path d="M3 12h15c1.7 0 3 1.3 3 3s-1.3 3-3 3c-1.3 0-2.4-.8-2.8-2" />
        <path d="M3 16h8c1.7 0 3 1.3 3 3s-1.3 3-3 3c-1.3 0-2.4-.8-2.8-2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/visualisation',
    label: 'visualisation',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/historique',
    label: 'Histori.',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/export',
    label: 'Export',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/supervision',
    label: 'Superv.',
    icon: (
      <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [utcTime, setUtcTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const h = String(now.getUTCHours()).padStart(2, '0')
      const m = String(now.getUTCMinutes()).padStart(2, '0')
      const s = String(now.getUTCSeconds()).padStart(2, '0')
      setUtcTime(`${h}:${m}:${s} UTC`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <RadarProvider>
      <div className={styles.appShell}>

        {/* ═══ HEADER ═══ */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Image
              src="/logo_DH_white.svg"
              alt="Degreane Horizon"
              width={110}
              height={42}
              priority
            />
            <div className={styles.headerSep} />
            <span className={styles.appName}>PCL1300 — Profileur de Vent</span>
          </div>

          <div className={styles.headerCenter}>
            <span className={styles.siteInfo}>
              Site <strong>DEGR / 632</strong>
            </span>
            <span className={styles.siteInfo}>
              Lat <strong>6°04'23&quot; N</strong> — Lon <strong>43°13'22&quot; E</strong> — Alt <strong>430 m</strong>
            </span>
            <span className={styles.siteInfo}>
              F <strong>1290.0 MHz</strong> — P <strong>4000 W</strong>
            </span>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.utcClock}>{utcTime}</span>
            <div className={styles.userBadge}>
              <div className={styles.userDot} />
              Opérateur
            </div>
          </div>
        </header>

        {/* ═══ BODY ═══ */}
        <div className={styles.body}>

          {/* ── SIDEBAR ── */}
          <nav className={styles.nav}>
            <div className={styles.navTop}>
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                  title={item.label}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          {/* ── CONTENU DES PAGES ── */}
          <main className={styles.main}>
            {children}
          </main>

        </div>

        {/* ═══ STATUS BAR ═══ */}
        <footer className={styles.statusBar}>
          <div className={styles.statusItems}>
            {[
              { dot: styles.sdGreen,  label: 'Radar',         val: 'ACTIF'      },
              { dot: styles.sdGreen,  label: 'Traitement TR', val: 'ACTIF'      },
              { dot: styles.sdYellow, label: 'Alimentation',  val: 'A VERIFIER' },
              { dot: styles.sdGreen,  label: 'Export CAOBS',  val: 'ACTIF'      },
            ].map((s) => (
              <div key={s.label} className={styles.statusItem}>
                <div className={`${styles.statusDot} ${s.dot}`} />
                {s.label} — <strong>{s.val}</strong>
              </div>
            ))}
            <span>PCL1300 <strong>v1 F</strong></span>
            <span>DEGREANE HORIZON — PCL1300</span>
          </div>
        </footer>

      </div>
    </RadarProvider>
  )
}
