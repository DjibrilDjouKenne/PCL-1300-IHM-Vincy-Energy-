'use client'

import { useRef, useState, DragEvent } from 'react'
import { VisTypeConfig } from '../_types'
import styles from './FileDropZone.module.css'

interface Props {
  typeConfig: VisTypeConfig
  onFile: (file: File) => void
}

export default function FileDropZone({ typeConfig, onFile }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [picked,   setPicked]   = useState<File | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const accept = typeConfig.extensions.join(',')

  const validate = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!typeConfig.extensions.includes(ext)) {
      setError(`Format non supporté : ${ext}. Attendu : ${typeConfig.extensions.join(', ')}`)
      return false
    }
    setError(null)
    return true
  }

  const handleFile = (file: File) => {
    if (!validate(file)) return
    setPicked(file)
    onFile(file)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.intro}>
        <span className={styles.introTitle}>
          {typeConfig.icon} {typeConfig.label} — Sélection du fichier
        </span>
        <span className={styles.introSub}>
          Formats acceptés : {typeConfig.extensions.join(', ')}
        </span>
      </div>

      <div
        className={`${styles.dropZone} ${dragging ? styles.dragging : ''} ${picked ? styles.picked : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className={styles.hiddenInput}
          onChange={onInputChange}
        />

        {picked ? (
          <div className={styles.fileInfo}>
            <span className={styles.fileIcon}>📄</span>
            <div className={styles.fileMeta}>
              <span className={styles.fileName}>{picked.name}</span>
              <span className={styles.fileSize}>{formatSize(picked.size)}</span>
            </div>
            <button
              className={styles.changeBtn}
              onClick={e => { e.stopPropagation(); setPicked(null); setError(null) }}
            >
              Changer
            </button>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>⬆</span>
            <span className={styles.placeholderText}>
              Déposez un fichier ici ou <span className={styles.browse}>parcourir</span>
            </span>
            <span className={styles.placeholderSub}>
              {typeConfig.extensions.join(', ')}
            </span>
          </div>
        )}
      </div>

      {error && <div className={styles.errorBanner}>⚠ {error}</div>}
    </div>
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024)       return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`
}
