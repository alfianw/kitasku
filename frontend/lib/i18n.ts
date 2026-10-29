'use client'

import { useCallback, useEffect, useState } from 'react'
import { serviceExactIdToEn } from './service-translations'

export type AppLanguage = 'EN' | 'ID'

const LANG_STORAGE_KEY = 'kitasku_lang'
const LANG_EVENT_NAME = 'kitasku-lang-change'
const TRANSLATION_CACHE_KEY = 'kitasku_i18n_cache_v3'

const memoryCache = new Map<string, string>()
let cacheLoaded = false

function loadCacheFromStorage() {
  if (cacheLoaded || typeof window === 'undefined') return
  cacheLoaded = true
  try {
    const raw = window.localStorage.getItem(TRANSLATION_CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, string>
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') {
        memoryCache.set(k, v)
      }
    }
  } catch {
    // Ignore storage errors
  }
}

function saveCacheToStorage() {
  if (typeof window === 'undefined') return
  try {
    const obj: Record<string, string> = {}
    const entries = Array.from(memoryCache.entries()).slice(-1500)
    for (const [k, v] of entries) {
      obj[k] = v
    }
    window.localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(obj))
  } catch {
    // Ignore storage quota errors
  }
}

// Exact dictionary for instant 0ms translations on service pages
const exactEnToId: Record<string, string> = {
  Home: 'Beranda',
  Services: 'Layanan',
  About: 'Tentang Kami',
  'About us': 'Tentang kami',
  Contact: 'Kontak',
  Process: 'Proses',
  Navigation: 'Navigasi',
  'All service': 'Semua layanan',
  'All services': 'Semua layanan',
  'KITASKU.ID service': 'Layanan KITASKU.ID',
  'KITASKU.ID business services': 'Layanan Bisnis KITASKU.ID',
  'KITASKU.ID business legal': 'Legalitas Bisnis KITASKU.ID',
  'KITASKU.ID immigration': 'Imigrasi KITASKU.ID',
  'Requirements checklist': 'Daftar Persyaratan',
  'Step-by-step timeline': 'Alur Tahapan Proses',
  'Compliance & reporting': 'Kepatuhan & Pelaporan',
  'Multiple entries': 'Beberapa Kali Masuk (Multiple Entries)',
  'Available nationwide': 'Tersedia di seluruh Indonesia',
  'Business legal': 'Legalitas bisnis',
  Immigration: 'Keimigrasian',
}

export function getSavedLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'EN'
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY)
    if (saved === 'ID' || saved === 'EN') return saved
  } catch {
    // Ignore storage errors
  }
  return 'EN'
}

export function setSavedLanguage(lang: AppLanguage) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    // Ignore storage errors
  }
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent<AppLanguage>(LANG_EVENT_NAME, { detail: lang }))
  }, 0)
}

export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>('EN')

  useEffect(() => {
    setLanguageState(getSavedLanguage())

    const handleCustomChange = (event: Event) => {
      const custom = event as CustomEvent<AppLanguage>
      if (custom.detail === 'EN' || custom.detail === 'ID') {
        setLanguageState(custom.detail)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LANG_STORAGE_KEY && (event.newValue === 'EN' || event.newValue === 'ID')) {
        setLanguageState(event.newValue)
      }
    }

    window.addEventListener(LANG_EVENT_NAME, handleCustomChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener(LANG_EVENT_NAME, handleCustomChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const setLanguage = useCallback((next: AppLanguage | ((prev: AppLanguage) => AppLanguage)) => {
    setLanguageState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      setSavedLanguage(resolved)
      return resolved
    })
  }, [])

  const isIndonesian = language === 'ID'
  const tr = useCallback(
    (english: string, indonesian: string) => (language === 'ID' ? indonesian : english),
    [language],
  )

  return { language, setLanguage, isIndonesian, tr }
}

export async function translateTextsClient(texts: string[], target: 'en' | 'id'): Promise<string[]> {
  if (texts.length === 0) return []
  loadCacheFromStorage()

  const results: string[] = new Array(texts.length)
  const missingIndices: number[] = []
  const missingTexts: string[] = []

  const exactDict = target === 'id' ? exactEnToId : serviceExactIdToEn

  for (let i = 0; i < texts.length; i++) {
    const raw = texts[i] ?? ''
    const trimmed = raw.trim()
    if (!trimmed) {
      results[i] = raw
      continue
    }

    const normalized = trimmed.replace(/\s+/g, ' ')
    const exactMatch = exactDict[trimmed] ?? exactDict[normalized]
    if (exactMatch) {
      const leading = raw.match(/^\s*/)?.[0] ?? ''
      const trailing = raw.match(/\s*$/)?.[0] ?? ''
      results[i] = `${leading}${exactMatch}${trailing}`
      continue
    }

    const cacheKey = `${target}:${normalized}`
    const cached = memoryCache.get(cacheKey)
    if (cached !== undefined) {
      const leading = raw.match(/^\s*/)?.[0] ?? ''
      const trailing = raw.match(/\s*$/)?.[0] ?? ''
      results[i] = `${leading}${cached}${trailing}`
      continue
    }

    missingIndices.push(i)
    missingTexts.push(raw)
  }

  if (missingTexts.length === 0) {
    return results
  }

  const chunkSize = 15
  for (let start = 0; start < missingTexts.length; start += chunkSize) {
    const chunk = missingTexts.slice(start, start + chunkSize)
    const indices = missingIndices.slice(start, start + chunkSize)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: chunk, target }),
      })
      if (res.ok) {
        const data = (await res.json()) as { translations?: string[] }
        const translatedChunk = Array.isArray(data.translations) ? data.translations : chunk
        for (let j = 0; j < chunk.length; j++) {
          const originalRaw = chunk[j]
          const translatedRaw = translatedChunk[j] ?? originalRaw
          results[indices[j]] = translatedRaw
          const normalizedOrig = originalRaw.trim().replace(/\s+/g, ' ')
          const trimmedTrans = translatedRaw.trim()
          if (normalizedOrig && trimmedTrans && trimmedTrans !== normalizedOrig) {
            memoryCache.set(`${target}:${normalizedOrig}`, trimmedTrans)
          }
        }
      } else {
        for (let j = 0; j < chunk.length; j++) {
          results[indices[j]] = chunk[j]
        }
      }
    } catch {
      for (let j = 0; j < chunk.length; j++) {
        results[indices[j]] = chunk[j]
      }
    }
  }

  saveCacheToStorage()
  return results
}
