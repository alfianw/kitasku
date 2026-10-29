import { NextRequest, NextResponse } from 'next/server'
import { serviceExactIdToEn } from '@/lib/service-translations'

const serverTranslationCache = new Map<string, string>()

const offlinePhraseDictIdToEn: [RegExp, string][] = [
  [/\bizin tinggal terbatas\b/gi, 'limited stay permit'],
  [/\bizin tinggal tetap\b/gi, 'permanent stay permit'],
  [/\bwarga negara asing\b/gi, 'foreign nationals'],
  [/\btenaga kerja asing\b/gi, 'foreign workers'],
  [/\bpemerintah indonesia\b/gi, 'the Indonesian government'],
  [/\bkementerian ketenagakerjaan\b/gi, 'the Ministry of Manpower'],
  [/\bdirektorat jenderal imigrasi\b/gi, 'the Directorate General of Immigration'],
  [/\bkantor imigrasi\b/gi, 'the immigration office'],
  [/\bperusahaan sponsor\b/gi, 'sponsoring company'],
  [/\bmasa berlaku\b/gi, 'validity period'],
  [/\bpersyaratan dokumen\b/gi, 'document requirements'],
  [/\bdokumen pendukung\b/gi, 'supporting documents'],
  [/\bpengurusan visa\b/gi, 'visa processing'],
  [/\bizin kerja\b/gi, 'work permit'],
  [/\bizin usaha\b/gi, 'business license'],
  [/\bpendirian perusahaan\b/gi, 'company establishment'],
  [/\bpenanaman modal asing\b/gi, 'foreign direct investment'],
  [/\brekening koran\b/gi, 'bank statement'],
  [/\bakta pendirian\b/gi, 'deed of establishment'],
  [/\bsurat keterangan\b/gi, 'certificate'],
  [/\bhubungi kami\b/gi, 'contact us'],
  [/\blebih lanjut\b/gi, 'further'],
  [/\bsecara resmi\b/gi, 'officially'],
  [/\bsecara berkala\b/gi, 'periodically'],
  [/\btepat waktu\b/gi, 'on time'],
]

const offlineWordDictIdToEn: Record<string, string> = {
  berita: 'news',
  terbaru: 'latest',
  aturan: 'regulation',
  peraturan: 'regulation',
  kebijakan: 'policy',
  pembaruan: 'update',
  informasi: 'information',
  panduan: 'guide',
  lengkap: 'complete',
  resmi: 'official',
  untuk: 'for',
  bagi: 'for',
  dan: 'and',
  atau: 'or',
  yang: 'that',
  di: 'in',
  ke: 'to',
  dari: 'from',
  dengan: 'with',
  dalam: 'in',
  pada: 'on',
  oleh: 'by',
  ini: 'this',
  itu: 'that',
  adalah: 'is',
  merupakan: 'is',
  akan: 'will',
  telah: 'has',
  sudah: 'already',
  dapat: 'can',
  bisa: 'can',
  harus: 'must',
  wajib: 'mandatory',
  perlu: 'need',
  mengurus: 'process',
  pengurusan: 'processing',
  pengajuan: 'application',
  permohonan: 'application',
  perpanjangan: 'extension',
  layanan: 'service',
  konsultasi: 'consultation',
  imigrasi: 'immigration',
  ketenagakerjaan: 'manpower',
  perusahaan: 'company',
  bisnis: 'business',
  usaha: 'business',
  investor: 'investor',
  investasi: 'investment',
  pekerja: 'worker',
  asing: 'foreign',
  keluarga: 'family',
  pasangan: 'spouse',
  anak: 'child',
  paspor: 'passport',
  dokumen: 'document',
  syarat: 'requirement',
  proses: 'process',
  tahap: 'stage',
  tahapan: 'stages',
  langkah: 'step',
  mudah: 'easy',
  cepat: 'fast',
  aman: 'safe',
  terpercaya: 'trusted',
  profesional: 'professional',
  tahun: 'year',
  bulan: 'month',
  hari: 'day',
  berlaku: 'valid',
  indonesia: 'Indonesia',
  jakarta: 'Jakarta',
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function encodeHtmlEntities(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function offlineFallbackTranslate(text: string, target: 'en' | 'id'): string {
  if (target !== 'en') return text
  const normalized = text.trim().replace(/\s+/g, ' ')
  if (serviceExactIdToEn[normalized]) {
    return serviceExactIdToEn[normalized]
  }
  let result = text
  for (const [pattern, replacement] of offlinePhraseDictIdToEn) {
    result = result.replace(pattern, replacement)
  }
  result = result.replace(/\b([A-Za-zÀ-ÿ]+)\b/g, (word) => {
    const lower = word.toLowerCase()
    const mapped = offlineWordDictIdToEn[lower]
    if (!mapped) return word
    if (word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) {
      return mapped.charAt(0).toUpperCase() + mapped.slice(1)
    }
    if (word === word.toUpperCase() && word.length > 1) {
      return mapped.toUpperCase()
    }
    return mapped
  })
  return result
}

async function translatePlainSegment(text: string, target: 'en' | 'id'): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return text

  const leading = text.match(/^\s*/)?.[0] ?? ''
  const trailing = text.match(/\s*$/)?.[0] ?? ''
  const normalized = trimmed.replace(/\s+/g, ' ')

  if (target === 'en' && serviceExactIdToEn[normalized]) {
    return `${leading}${serviceExactIdToEn[normalized]}${trailing}`
  }

  const cacheKey = `${target}:${normalized}`
  const cached = serverTranslationCache.get(cacheKey)
  if (cached) {
    return `${leading}${cached}${trailing}`
  }

  try {
    const sl = target === 'en' ? 'id' : 'auto'
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(trimmed)}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((chunk: unknown) => (Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : ''))
          .join('')
          .trim()
        if (translated) {
          serverTranslationCache.set(cacheKey, translated)
          return `${leading}${translated}${trailing}`
        }
      }
    }
  } catch {
    // Fallback below if network is unavailable
  }

  const fallback = offlineFallbackTranslate(trimmed, target)
  serverTranslationCache.set(cacheKey, fallback)
  return `${leading}${fallback}${trailing}`
}

async function translateHtmlOrText(input: string, target: 'en' | 'id'): Promise<string> {
  if (!input || !input.trim()) return input

  if (!/<[a-z][\s\S]*>/i.test(input)) {
    return translatePlainSegment(input, target)
  }

  const parts = input.split(/(<[^>]+>)/g)
  const translatedParts: string[] = []
  for (const part of parts) {
    if (part.startsWith('<') && part.endsWith('>')) {
      translatedParts.push(part)
    } else if (!part.trim()) {
      translatedParts.push(part)
    } else {
      const decoded = decodeHtmlEntities(part)
      const translated = await translatePlainSegment(decoded, target)
      translatedParts.push(encodeHtmlEntities(translated))
    }
  }

  return translatedParts.join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { texts?: unknown; target?: string }
    const texts = Array.isArray(body.texts) ? body.texts.map((item) => String(item ?? '')) : []
    const target: 'en' | 'id' = body.target === 'id' ? 'id' : 'en'

    if (texts.length === 0) {
      return NextResponse.json({ translations: [] })
    }

    const translations: string[] = []
    // Process in small batches of 5 to avoid rate limiting
    const batchSize = 5
    for (let i = 0; i < texts.length; i += batchSize) {
      const slice = texts.slice(i, i + batchSize)
      const sliceResult = await Promise.all(slice.map((text) => translateHtmlOrText(text, target)))
      translations.push(...sliceResult)
    }

    return NextResponse.json({ translations })
  } catch {
    return NextResponse.json({ translations: [] }, { status: 200 })
  }
}
