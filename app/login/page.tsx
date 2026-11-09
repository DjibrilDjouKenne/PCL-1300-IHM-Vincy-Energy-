'use client'
import { useRouter } from 'next/navigation'
import Button from '../components/ui/Button'
import { useState } from 'react'
import Image from 'next/image'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  if (!username || !password) {
    setError('Veuillez remplir tous les champs')
    return
  }

  // Identifiants de test
  const MOCK_USERNAME = 'pcl1300'
  const MOCK_PASSWORD = 'pcl1300'

  setIsLoading(true)

  // Simulation appel api  un appel API
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (
    username === MOCK_USERNAME &&
    password === MOCK_PASSWORD
  ) {
    router.push('/dashboard')
  } else {
    setError('Identifiants incorrects. Veuillez réessayer.')
  }

  setIsLoading(false)
}

  return (
    <div className={styles.page}>
      {/* Panneau gauche — identité DH */}
      <aside className={styles.leftPanel}>
        <div className={styles.brandBlock}>
          <div className={styles.logoWrapper}>
            
             <Image src="/logo_DH_white.svg" alt="Degrané Horizon" width={160} height={60} priority /> 
            <div className={styles.logoFallback}>
              <span className={styles.logoLetters}>DH</span>
              <div className={styles.logoText}>
                <span className={styles.logoDegreane}>DEGREANE</span>
                <span className={styles.logoHorizon}>HORIZON</span>
              </div>
            </div>
          </div>
          <div className={styles.divider} />
          <p className={styles.tagline}>Systèmes de mesure atmosphérique</p>
        </div>

        <div className={styles.vinciBlock}>
          <span className={styles.vinciLabel}>Un groupe</span>
          <Image src="/Logo_VINCI.svg" alt="Vinci" width={80} height={20} /> 
          <span className={styles.vinciName}>VINCI</span>
        </div>
      </aside>

      {/* Panneau droit — formulaire */}
      <main className={styles.rightPanel}>
        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Connexion</h1>
            <p className={styles.cardSub}>Accès sécurisé — IHM PCL1300 </p>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>
                Identifiant
              </label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="username"
                  type="text"
                  className={styles.input}
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Mot de passe
              </label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>



            <button
              type="submit"
              className={`${styles.btnSubmit} ${isLoading ? styles.btnLoading : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : null}
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
         
          </form>

          <div className={styles.cardFooter}>
            <a href="#" className={styles.forgotLink}>
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        <p className={styles.versionTag}>v1.0.0</p>
      </main>
    </div>
  )
}
