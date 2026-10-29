'use client'
// @refresh reset

import { useEffect, useRef, useState } from 'react'
import { fetchPublicGallery, fetchPublicNews } from '@/lib/api'
import { translateTextsClient, useLanguage } from '@/lib/i18n'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Globe2,
  Languages,
  Landmark,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

const services = [
  { slug: 'e-visa-services', icon: Globe2, title: 'e-Visa Services', text: 'A clear electronic visa pathway for entering Indonesia with confidence.', detail: 'KITASKU.ID helps clients identify the appropriate e-Visa pathway, prepare supporting documents, and coordinate the application process. We review the purpose of travel, eligibility, passport details, and timeline so the submission is complete and easy to follow. Our team also explains the next steps after approval, including entry requirements and related stay arrangements.', cta: 'Consult e-Visa Services' },
  { slug: 'kitas-itas-services', icon: FileCheck2, title: 'KITAS / ITAS Services', text: 'Practical support for limited stay permits for expatriates and their families.', detail: 'From initial eligibility review through application, extension, and reporting requirements, KITASKU.ID manages the details of your KITAS or ITAS journey. We coordinate the required documents and help employers, expatriates, and dependants understand each milestone, deadline, and responsibility.', cta: 'Consult KITAS / ITAS Services' },
  { slug: 'rptka-imta-services', icon: ShieldCheck, title: 'RPTKA & IMTA Services', text: 'Work permit assistance that keeps foreign workforce plans compliant.', detail: 'KITASKU.ID supports companies with RPTKA preparation, foreign worker eligibility, DKPTKA obligations, and the documentation associated with work authorization. We help align the company plan, role requirements, and submission timeline so the process is structured from planning through approval.', cta: 'Consult RPTKA & IMTA Services' },
  { slug: 'immigration-services', icon: Landmark, title: 'Immigration Services', text: 'Coordinated immigration administration for a smooth stay in Indonesia.', detail: 'Our immigration service covers supporting administration such as police reporting or STM, SKTT registration, and related immigration documents. KITASKU.ID maps the requirements to each client’s situation, checks the supporting evidence, and keeps every handoff clear between the client and the relevant institutions.', cta: 'Consult Immigration Services' },
  { slug: 'business-establishment', icon: Sparkles, title: 'Business Establishment', text: 'Build a compliant legal foundation for your company in Indonesia.', detail: 'KITASKU.ID assists with PT and PMA establishment, business licensing, NIB, and the legal documentation needed to operate with confidence. We help founders and international companies understand the available structure, coordinate registrations, and keep the setup aligned with their business goals.', cta: 'Consult Business Establishment' },
  { slug: 'product-import-export-registration', icon: MessageCircle, title: 'Product, Import & Export Registration', text: 'Prepare the registrations that help products move into and across Indonesia.', detail: 'We support product and trade compliance, including BPOM registration, halal certification, NIB, and import or export-related permits. KITASKU.ID helps organize the required product, company, and logistics documents while guiding clients through the relevant registration sequence.', cta: 'Consult Product Registration' },
  { slug: 'other-services', icon: ClipboardCheck, title: 'Other Services', text: 'Additional support tailored to your legal, immigration, and business needs.', detail: 'KITASKU.ID also provides practical support for other legal, immigration, licensing, and business administration needs. Share your situation with our team and we will help clarify the available options, requirements, and next steps for a focused solution.', cta: 'Consult Other Services' },
]

const processStages = [
  { number: '01', en: { title: 'KEMNAKER', description: 'Manpower stage for approving the company’s foreign workforce plan.', items: [['RPTKA', 'Foreign workforce utilization plan'], ['HPK', 'Eligibility assessment result'], ['DKPTKA', 'Notification and compensation payment'], ['IMTA', 'Finalization and approval']] }, id: { title: 'KEMNAKER', description: 'Tahap ketenagakerjaan untuk menyetujui rencana penggunaan tenaga kerja asing perusahaan.', items: [['RPTKA', 'Rencana penggunaan tenaga kerja asing'], ['HPK', 'Hasil penilaian kelayakan'], ['DKPTKA', 'Notifikasi dan pembayaran dana kompensasi'], ['IMTA', 'Penyelesaian dan pengesahan']] } },
  { number: '02', en: { title: 'IMMIGRATION', description: 'Immigration stage to secure entry authorization and a limited stay permit.', items: [['e-Visa', 'Visa processing according to the applicable requirements'], ['ITAS', 'Limited stay permit for foreign workers']] }, id: { title: 'IMIGRASI', description: 'Tahap imigrasi untuk mengamankan otorisasi masuk dan izin tinggal terbatas.', items: [['e-Visa', 'Pemrosesan visa sesuai persyaratan yang berlaku'], ['ITAS', 'Izin tinggal terbatas bagi pekerja asing']] } },
  { number: '03', en: { title: 'POLDA', description: 'Police reporting and administrative processes required for foreign nationals.', items: [['STM', 'Police reporting documentation']] }, id: { title: 'POLDA', description: 'Pelaporan kepolisian dan proses administratif yang diperlukan bagi warga negara asing.', items: [['STM', 'Dokumentasi pelaporan kepolisian']] } },
  { number: '04', en: { title: 'DUKCAPIL', description: 'Population administration stage for registering a foreign national’s residence.', items: [['SKTT', 'Residence registration and documentation']] }, id: { title: 'DUKCAPIL', description: 'Tahap administrasi kependudukan untuk pendaftaran tempat tinggal warga negara asing.', items: [['SKTT', 'Pendaftaran tempat tinggal dan dokumentasi']] } },
]

type CmsArticle = { date: string; title: string; tag: string; text: string; image: string }

const fallbackArticles = [
  { date: '12 Sep 2024', title: 'Navigating Indonesia’s latest work permit updates', tag: 'Regulation' },
  { date: '28 Aug 2024', title: 'A practical guide to ITAS for foreign professionals', tag: 'Guides' },
  { date: '09 Aug 2024', title: 'Building compliant teams across borders', tag: 'Insights' },
]

const fallbackArticleDetails = [
  { title: 'Navigating Indonesia’s latest work permit updates', text: 'A concise overview of the regulatory changes businesses should understand when planning work permits for foreign professionals. The update highlights the practical points employers should review before starting a new application, including eligibility checks, supporting documentation, coordination between internal teams, and the importance of allowing enough time for each administrative stage. Understanding these changes early can help businesses set realistic timelines, avoid preventable rework, and communicate expectations clearly with foreign professionals and their managers. KITASKU.ID recommends reviewing each case individually because the correct pathway may depend on the role, employment arrangement, location, and current permit status.' },
  { title: 'A practical guide to ITAS for foreign professionals', text: 'The essential documents, milestones, and considerations to help foreign professionals prepare their ITAS journey with confidence.' },
  { title: 'Building compliant teams across borders', text: 'How thoughtful planning and reliable documentation help companies build international teams while staying compliant.' },
]

const fallbackArticleImages = [
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556761175-54ebf92ef47b?auto=format&fit=crop&w=900&q=80',
]

function formatCmsDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function sanitizeArticleHtml(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
  }
  return trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}

export default function Page() {
  const [open, setOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [selectedGallery, setSelectedGallery] = useState<number | null>(null)
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null)
  const { language, setLanguage, isIndonesian, tr } = useLanguage()
  const [languageOpen, setLanguageOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('home')
  const [cmsNews, setCmsNews] = useState<CmsArticle[]>([])
  const [cmsNewsI18n, setCmsNewsI18n] = useState<{ EN?: CmsArticle[]; ID?: CmsArticle[] }>({})
  const [cmsGallery, setCmsGallery] = useState<{ src: string; alt: string; title: string; caption: string }[]>([])
  const [cmsGalleryI18n, setCmsGalleryI18n] = useState<{
    EN?: { src: string; alt: string; title: string; caption: string }[]
    ID?: { src: string; alt: string; title: string; caption: string }[]
  }>({})
  const [showAllGallery, setShowAllGallery] = useState(false)
  const [showAllNews, setShowAllNews] = useState(false)
  const scrollLockUntilRef = useRef<number>(0)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nav = isIndonesian ? ['Beranda', 'Tentang Kami', 'Layanan', 'Proses', 'Galeri', 'Berita', 'Kontak'] : ['Home', 'About Us', 'Services', 'Process', 'Gallery', 'News', 'Contact']
  const navIds = ['home', 'about-us', 'services', 'process', 'gallery', 'news', 'contact']

  const computeActiveSection = (): string => {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0
    if (scrollY <= 100) {
      return 'home'
    }
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    if (maxScroll > 0 && scrollY >= maxScroll - 40) {
      return 'contact'
    }

    const contactEl = document.getElementById('contact')
    if (contactEl) {
      const contactRect = contactEl.getBoundingClientRect()
      if (contactRect.top <= Math.max(200, window.innerHeight * 0.45) && contactRect.bottom > 120) {
        return 'contact'
      }
    }

    const triggerY = 76 + Math.min(180, Math.max(110, Math.round((window.innerHeight - 76) * 0.3)))
    let current = 'home'
    for (const id of navIds) {
      const element = document.getElementById(id)
      if (!element) continue
      const rect = element.getBoundingClientRect()
      if (rect.top <= triggerY) {
        current = id
      }
    }
    return current
  }

  const releaseScrollLock = (recompute = true) => {
    scrollLockUntilRef.current = 0
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
      scrollTimeoutRef.current = null
    }
    if (recompute && typeof window !== 'undefined') {
      setActiveNav(computeActiveSection())
    }
  }

  const scrollToSection = (id: string, behavior: ScrollBehavior = 'smooth') => {
    const HEADER_HEIGHT = 76
    const element = document.getElementById(id)
    if (!element) return
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0
    const rawTop = id === 'home' ? 0 : element.getBoundingClientRect().top + currentScrollY - HEADER_HEIGHT
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const targetTop = Math.min(Math.max(0, rawTop), maxScroll)
    const initialDist = Math.abs(currentScrollY - targetTop)

    setActiveNav(id)

    if (initialDist <= 4 || behavior === 'auto') {
      window.scrollTo({ top: targetTop, behavior })
      releaseScrollLock(true)
      return
    }

    scrollLockUntilRef.current = Date.now() + 900
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      releaseScrollLock(true)
    }, 160)

    window.scrollTo({ top: targetTop, behavior })
  }

  useEffect(() => {
    const syncFromHash = (behavior: ScrollBehavior = 'smooth') => {
      const hash = window.location.hash.replace(/^#/, '')
      const normalized = hash === 'about' ? 'about-us' : hash
      if (navIds.includes(normalized)) {
        scrollToSection(normalized, behavior)
        return true
      }
      return false
    }

    const onUserManualScrollInput = () => {
      if (scrollLockUntilRef.current > 0) {
        scrollLockUntilRef.current = 0
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
          scrollTimeoutRef.current = null
        }
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
        onUserManualScrollInput()
      }
    }

    let ticking = false
    const onScroll = () => {
      if (Date.now() < scrollLockUntilRef.current) {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = setTimeout(() => {
          releaseScrollLock(true)
        }, 120)
        return
      }

      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        if (Date.now() >= scrollLockUntilRef.current) {
          setActiveNav(computeActiveSection())
        }
        ticking = false
      })
    }

    const onScrollEnd = () => {
      releaseScrollLock(true)
    }

    const onResize = () => {
      if (Date.now() >= scrollLockUntilRef.current) {
        setActiveNav(computeActiveSection())
      }
    }

    const onHashChange = () => {
      syncFromHash('smooth')
    }

    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0
    if (currentScrollY <= 10 && window.location.hash) {
      syncFromHash('auto')
    } else {
      setActiveNav(computeActiveSection())
    }

    const verifyTimer1 = setTimeout(() => {
      if (Date.now() >= scrollLockUntilRef.current) {
        setActiveNav(computeActiveSection())
      }
    }, 80)

    const verifyTimer2 = setTimeout(() => {
      if (Date.now() >= scrollLockUntilRef.current) {
        setActiveNav(computeActiveSection())
      }
    }, 300)

    window.addEventListener('wheel', onUserManualScrollInput, { passive: true })
    window.addEventListener('touchmove', onUserManualScrollInput, { passive: true })
    window.addEventListener('keydown', onKeyDown, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('scrollend', onScrollEnd, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      clearTimeout(verifyTimer1)
      clearTimeout(verifyTimer2)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      window.removeEventListener('wheel', onUserManualScrollInput)
      window.removeEventListener('touchmove', onUserManualScrollInput)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  useEffect(() => {
    let active = true

    Promise.all([fetchPublicNews(100), fetchPublicGallery(100)])
      .then(([news, gallery]) => {
        if (!active) return
        setCmsNews(news.data.map((item) => ({
          date: formatCmsDate(item.published_at ?? item.created_at),
          title: item.title,
          tag: 'News',
          text: item.content || item.excerpt,
          image: item.cover_image || '',
        })))
        setCmsGallery(gallery.data.map((item) => ({
          src: item.image_url,
          alt: item.title,
          title: item.title,
          caption: item.caption || '',
        })))
      })
      .catch(() => {
        // Keep the built-in fallback content when the API is unavailable.
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (cmsNews.length === 0) return
    let cancelled = false
    const target = language === 'ID' ? 'id' : 'en'
    if (cmsNewsI18n[language]) return

    const textsToTranslate: string[] = []
    for (const item of cmsNews) {
      textsToTranslate.push(item.title || '')
      textsToTranslate.push(item.text || '')
    }

    translateTextsClient(textsToTranslate, target).then((translated) => {
      if (cancelled) return
      const mapped = cmsNews.map((item, idx) => ({
        ...item,
        tag: language === 'ID' ? 'Berita' : 'News',
        title: translated[idx * 2] || item.title,
        text: translated[idx * 2 + 1] || item.text,
      }))
      setCmsNewsI18n((prev) => ({ ...prev, [language]: mapped }))
    })

    return () => {
      cancelled = true
    }
  }, [cmsNews, language, cmsNewsI18n])

  useEffect(() => {
    if (cmsGallery.length === 0) return
    let cancelled = false
    const target = language === 'ID' ? 'id' : 'en'
    if (cmsGalleryI18n[language]) return

    const textsToTranslate: string[] = []
    for (const item of cmsGallery) {
      textsToTranslate.push(item.title || '')
      textsToTranslate.push(item.caption || '')
    }

    translateTextsClient(textsToTranslate, target).then((translated) => {
      if (cancelled) return
      const mapped = cmsGallery.map((item, idx) => ({
        ...item,
        alt: translated[idx * 2] || item.alt,
        title: translated[idx * 2] || item.title,
        caption: translated[idx * 2 + 1] || item.caption,
      }))
      setCmsGalleryI18n((prev) => ({ ...prev, [language]: mapped }))
    })

    return () => {
      cancelled = true
    }
  }, [cmsGallery, language, cmsGalleryI18n])

  const navigateTo = (id: string) => {
    if (typeof window !== 'undefined') {
      scrollToSection(id, 'smooth')
    } else {
      setActiveNav(id)
    }
    setOpen(false)
  }

  const translatedServices = isIndonesian ? services.map((service, i) => ({ ...service, title: ['Layanan e-Visa', 'Layanan KITAS / ITAS', 'Layanan RPTKA & IMTA', 'Layanan Imigrasi', 'Pendirian Bisnis di Indonesia', 'Registrasi Produk, Impor & Ekspor', 'Layanan Lainnya'][i], text: ['Jalur visa elektronik yang jelas untuk memasuki Indonesia dengan percaya diri.', 'Dukungan praktis untuk izin tinggal terbatas bagi ekspatriat dan keluarga.', 'Bantuan izin kerja agar rencana tenaga kerja asing tetap sesuai aturan.', 'Administrasi imigrasi yang terkoordinasi untuk masa tinggal yang lancar.', 'Membangun dasar legal yang patuh untuk perusahaan di Indonesia.', 'Menyiapkan registrasi agar produk dapat masuk dan bergerak di Indonesia.', 'Menjaga setiap dokumen penting tetap lengkap, selaras, dan siap ditinjau.'][i], detail: ['KITASKU.ID membantu memilih jalur e-Visa yang tepat, menyiapkan dokumen pendukung, dan mengoordinasikan proses pengajuan.', 'Dari peninjauan kelayakan hingga pengajuan, perpanjangan, dan pelaporan, KITASKU.ID mengelola detail perjalanan KITAS atau ITAS Anda.', 'KITASKU.ID mendukung perusahaan dalam persiapan RPTKA, kelayakan pekerja asing, kewajiban DKPTKA, dan dokumen izin kerja.', 'Layanan kami mencakup STM, pendaftaran SKTT, dan dokumen imigrasi terkait dengan persyaratan yang dipetakan sesuai kondisi klien.', 'KITASKU.ID membantu pendirian PT dan PMA, perizinan usaha, NIB, serta dokumen legal agar bisnis dapat beroperasi dengan percaya diri.', 'Kami mendukung registrasi BPOM, sertifikasi halal, NIB, serta perizinan impor dan ekspor dengan dokumen yang tertata.', 'KITASKU.ID meninjau dokumen bisnis, imigrasi, dan ketenagakerjaan sebelum diajukan agar informasinya lengkap dan tertata.'][i], cta: ['Konsultasi Layanan e-Visa', 'Konsultasi Layanan KITAS / ITAS', 'Konsultasi Layanan RPTKA & IMTA', 'Konsultasi Layanan Imigrasi', 'Konsultasi Pendirian Bisnis', 'Konsultasi Registrasi Produk', 'Konsultasi Peninjauan Kepatuhan'][i] })) : services
  const articles: CmsArticle[] = cmsNews.length
    ? cmsNews
    : fallbackArticles.map((article, index) => ({
        ...article,
        text: fallbackArticleDetails[index]?.text ?? '',
        image: '',
      }))
  const translatedArticles: CmsArticle[] = cmsNews.length
    ? (cmsNewsI18n[language] ?? cmsNews.map((article) => ({ ...article, tag: isIndonesian ? 'Berita' : 'News' })))
    : isIndonesian
      ? articles.map((article, index) => ({
          ...article,
          tag: ['Peraturan', 'Panduan', 'Wawasan'][index] ?? article.tag,
          title: [
            'Menavigasi pembaruan izin kerja terbaru di Indonesia',
            'Panduan praktis ITAS untuk tenaga profesional asing',
            'Membangun tim yang patuh di berbagai negara',
          ][index] ?? article.title,
          text: [
            'Ringkasan praktis mengenai perubahan regulasi yang perlu dipahami pelaku usaha saat merencanakan izin kerja bagi tenaga profesional asing. Pembaruan ini menyoroti poin penting sebelum memulai pengajuan baru, termasuk pemeriksaan kelayakan, dokumen pendukung, koordinasi antar-tim, serta pentingnya menyiapkan waktu yang cukup di setiap tahap administrasi.',
            'Dokumen utama, tahapan penting, dan hal-hal yang perlu diperhatikan untuk membantu tenaga profesional asing menyiapkan perjalanan ITAS mereka dengan percaya diri.',
            'Bagaimana perencanaan yang matang dan dokumentasi yang andal membantu perusahaan membangun tim internasional sambil tetap mematuhi regulasi yang berlaku.',
          ][index] ?? article.text,
        }))
      : articles
  const galleryImages = cmsGallery.length ? (cmsGalleryI18n[language] ?? cmsGallery) : [
    {
      src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85',
      alt: 'KITASKU.ID office interior',
      title: tr('KITASKU.ID office interior', 'Interior kantor KITASKU.ID'),
      caption: tr('A calm, professional space for every consultation.', 'Ruang yang tenang dan profesional untuk setiap konsultasi.'),
    },
    {
      src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1400&q=85',
      alt: 'Consultation at KITASKU.ID',
      title: tr('Consultation at KITASKU.ID', 'Konsultasi di KITASKU.ID'),
      caption: tr('Clear guidance from the first conversation.', 'Panduan yang jelas sejak percakapan pertama.'),
    },
    {
      src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=85',
      alt: 'Professional meeting room',
      title: tr('Professional meeting room', 'Ruang rapat profesional'),
      caption: tr('A focused setting for documents, reviews, and approvals.', 'Suasana fokus untuk dokumen, peninjauan, dan persetujuan.'),
    },
    {
      src: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=85',
      alt: 'KITASKU.ID team meeting',
      title: tr('KITASKU.ID team meeting', 'Rapat tim KITASKU.ID'),
      caption: tr('Every case is handled with care by a coordinated team.', 'Setiap kasus ditangani dengan cermat oleh tim yang terkoordinasi.'),
    },
  ]
  const articleDetails = translatedArticles.map((article) => ({ title: article.title, text: article.text }))

  return (
    <main className="min-h-screen overflow-x-clip bg-[#fcfcfa] text-[#242421]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-[#fcfcfa]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
          <a href="#home" onClick={(event) => { event.preventDefault(); navigateTo('home') }} className="flex shrink-0 items-center gap-3 whitespace-nowrap text-lg font-semibold tracking-[0.24em] text-[#242421] xl:tracking-[0.28em]">
            <img src="/logo-kitasku.png" alt="Logo KITASKU.ID" className="size-10 shrink-0 object-contain" />
            KITASKU.ID
          </a>
          <nav className="hidden items-center justify-center gap-5 lg:flex xl:gap-6">
            {nav.map((item, i) => { const isActive = activeNav === navIds[i]; return <a key={item} href={`#${navIds[i]}`} onClick={(event) => { event.preventDefault(); event.currentTarget.blur(); navigateTo(navIds[i]) }} aria-current={isActive ? 'page' : undefined} className={`relative whitespace-nowrap py-2 text-[11px] uppercase tracking-[0.14em] transition-colors focus:outline-none hover:text-[#b08a43] xl:tracking-[0.16em] ${isActive ? 'font-semibold text-[#b08a43]' : 'text-[#242421]/70'}`}><span>{item}</span><span aria-hidden="true" className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-[#c5a059] transition-all duration-300 ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0'}`} /></a> })}
          </nav>
          <div className="hidden shrink-0 items-center gap-2.5 sm:flex xl:gap-3">
            <div className="relative"><button type="button" aria-expanded={languageOpen} aria-haspopup="listbox" aria-label={tr('Choose language', 'Pilih bahasa')} onClick={() => setLanguageOpen((open) => !open)} className="inline-flex min-w-[132px] items-center justify-between gap-2 whitespace-nowrap rounded-full border border-[#c5a059]/40 bg-white/60 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#242421]/75 shadow-sm transition hover:border-[#c5a059] hover:text-[#b08a43]"><span className="inline-flex items-center gap-2"><span aria-hidden="true" className={`inline-block h-4 w-6 shrink-0 overflow-hidden rounded-sm shadow-[0_0_0_1px_rgba(36,36,33,0.12)] ${language === 'EN' ? 'bg-[linear-gradient(#b22234_0_14%,#fff_14%_28%,#b22234_28%_42%,#fff_42%_56%,#b22234_56%_70%,#fff_70%_84%,#b22234_84%)]' : 'bg-[linear-gradient(to_bottom,#e53935_0_50%,#fff_50%)]'}`} /><span>{language === 'EN' ? 'English' : 'Indonesia'}</span></span><ChevronDown size={13} className={`shrink-0 transition-transform ${languageOpen ? 'rotate-180' : ''}`} /></button>{languageOpen && <div role="listbox" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 overflow-hidden rounded-2xl border border-[#c5a059]/30 bg-[#fffdf8] p-1.5 shadow-xl"><button type="button" role="option" aria-selected={language === 'EN'} onClick={() => { setLanguage('EN'); setLanguageOpen(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] transition ${language === 'EN' ? 'bg-[#f4ead4] text-[#8d6829]' : 'text-[#242421]/70 hover:bg-[#f8f5ed]'}`}><span aria-hidden="true" className="inline-block h-4 w-6 rounded-sm bg-[linear-gradient(#b22234_0_14%,#fff_14%_28%,#b22234_28%_42%,#fff_42%_56%,#b22234_56%_70%,#fff_70%_84%,#b22234_84%)]" />English<span className="ml-auto text-[#c5a059]">{language === 'EN' ? '✓' : ''}</span></button><button type="button" role="option" aria-selected={language === 'ID'} onClick={() => { setLanguage('ID'); setLanguageOpen(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] transition ${language === 'ID' ? 'bg-[#f4ead4] text-[#8d6829]' : 'text-[#242421]/70 hover:bg-[#f8f5ed]'}`}><span aria-hidden="true" className="inline-block h-4 w-6 rounded-sm bg-[linear-gradient(to_bottom,#e53935_0_50%,#fff_50%)]" />Indonesia<span className="ml-auto text-[#c5a059]">{language === 'ID' ? '✓' : ''}</span></button></div>}</div>
            <a href="https://wa.me/6281932024405" className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#c5a059] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a88342] md:flex xl:px-5 xl:py-3"><MessageCircle size={14} className="shrink-0" /> {isIndonesian ? 'Konsultasi WhatsApp' : 'Consult via WhatsApp'}</a>
          </div>
          <button aria-label={tr('Open navigation', 'Buka navigasi')} onClick={() => setOpen(!open)} className="lg:hidden">{open ? <X /> : <Menu />}</button>
        </div>
        {open && <nav className="flex flex-col gap-5 border-t border-black/5 bg-[#fcfcfa] px-6 py-6 lg:hidden">{nav.map((item, i) => { const isActive = activeNav === navIds[i]; return <a onClick={(event) => { event.preventDefault(); navigateTo(navIds[i]) }} key={item} href={`#${navIds[i]}`} aria-current={isActive ? 'page' : undefined} className={`border-l-2 pl-3 text-xs uppercase tracking-[0.16em] transition-colors ${isActive ? 'border-[#c5a059] font-semibold text-[#b08a43]' : 'border-transparent text-[#242421]/70'}`}>{item}</a> })}<button type="button" onClick={() => setLanguage(isIndonesian ? 'EN' : 'ID')} className="flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-[0.16em] text-[#b08a43]"><Languages size={15} /> {isIndonesian ? 'English' : 'Indonesia'}</button><a href="https://wa.me/6281932024405" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#c5a059] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a88342]"><MessageCircle size={14} /> {isIndonesian ? 'Konsultasi WhatsApp' : 'Consult via WhatsApp'}</a></nav>}
      </header>

      <section id="home" className="relative flex min-h-[760px] scroll-mt-[76px] items-center pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(197,160,89,0.14),transparent_30%),linear-gradient(90deg,#fcfcfa_0%,#fcfcfa_52%,rgba(252,252,250,0.72)_100%)]" />
        <div className="absolute right-0 top-0 h-full w-[52%] bg-[url('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center grayscale-[25%] opacity-25 mix-blend-multiply" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="max-w-2xl self-center">
            <div className="mb-7 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.28em] text-[#b08a43]"><span className="h-px w-10 bg-[#c5a059]" /> {tr('IMMIGRATION & PERMIT SERVICES', 'LAYANAN IMIGRASI & PERIZINAN')}</div>
            <h1 className="font-serif text-5xl leading-[1.08] tracking-[-0.03em] text-[#242421] sm:text-6xl lg:text-[76px]">{tr('Your certainty in a world of', 'Kepastian Anda di dunia penuh')} <em className="font-normal text-[#c5a059]">{tr('possibilities.', 'kemungkinan.')}</em></h1>
            <p className="mt-8 max-w-lg text-base leading-8 text-[#77756d]">{tr('Professional licensing, immigration, and legal services designed to help people and businesses move forward with confidence.', 'Layanan perizinan, imigrasi, dan legal profesional untuk membantu individu dan bisnis melangkah dengan percaya diri.')}</p>
            <div className="mt-10 flex flex-wrap items-center gap-4"><a href="#services" onClick={(event) => { event.preventDefault(); navigateTo('services') }} className="inline-flex items-center gap-3 rounded-full bg-[#242421] px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#c5a059]">{tr('Explore our services', 'Jelajahi layanan kami')} <ArrowRight size={16} /></a><a href="#about-us" onClick={(event) => { event.preventDefault(); navigateTo('about-us') }} className="inline-flex items-center gap-2 px-3 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#242421]/80 transition hover:text-[#b08a43]">{tr('Discover KITASKU.ID', 'Kenali KITASKU.ID')} <ArrowRight size={15} className="text-[#c5a059]" /></a></div>
            <div className="mt-16 flex gap-12 border-t border-black/10 pt-6"><div><p className="font-serif text-3xl text-[#c5a059]">10+</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8c8b84]">{tr('Years of trust', 'Tahun kepercayaan')}</p></div><div><p className="font-serif text-3xl text-[#c5a059]">500+</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8c8b84]">{tr('Cases handled', 'Kasus ditangani')}</p></div></div>
          </div>
          <div className="hidden items-end justify-end lg:flex"><div className="relative h-[450px] w-[350px] overflow-hidden rounded-t-full rounded-b-[180px] border-[10px] border-white/70 shadow-2xl"><img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85" alt={tr('KITASKU.ID team collaborating in a bright office', 'Tim KITASKU.ID berkolaborasi di ruang kerja')} className="h-full w-full object-cover" /></div></div>
        </div>
        <div className="absolute bottom-8 left-6 hidden items-center gap-4 lg:flex"><span className="h-14 w-px bg-[#c5a059]" /><span className="text-[9px] uppercase tracking-[0.22em] text-[#8c8b84] [writing-mode:vertical-rl]">{tr('Scroll to explore', 'Gulir untuk menjelajah')}</span></div>
      </section>

      <section id="about-us" className="mx-auto grid max-w-7xl scroll-mt-[76px] gap-14 px-6 py-28 lg:grid-cols-[0.8fr_1.2fr] lg:px-10"><div><p className="eyebrow">{tr('The KITASKU.ID difference', 'Keunggulan KITASKU.ID')}</p><h2 className="mt-5 max-w-md font-serif text-4xl leading-tight sm:text-5xl">{tr('Clarity for every step of your journey.', 'Kejelasan di setiap langkah perjalanan Anda.')}</h2></div><div><p className="max-w-2xl text-lg leading-8 text-[#77756d]">{tr('At KITASKU.ID, we believe legal processes should feel less complicated. Our team brings together deep expertise, attentive service, and a clear way of working — so you can focus on what matters most.', 'Di KITASKU.ID, kami percaya proses legal tidak harus terasa rumit. Tim kami memadukan keahlian mendalam, layanan penuh perhatian, dan cara kerja yang jelas agar Anda dapat fokus pada hal yang paling penting.')}</p><div className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2">{[[tr('Professional assistance', 'Pendampingan profesional'), tr('Thoughtful advice, tailored to your situation.', 'Saran yang tepat dan disesuaikan dengan situasi Anda.')],[tr('Experienced team', 'Tim berpengalaman'), tr('A team that understands the details.', 'Tim yang memahami setiap detail persyaratan.')],[tr('Clear process', 'Proses yang jelas'), tr('Transparent milestones, no surprises.', 'Tahapan yang transparan, tanpa kejutan.')],[tr('Reliable service', 'Layanan terpercaya'), tr('Consistent support from start to finish.', 'Dukungan konsisten dari awal hingga selesai.')]].map(([title,text]) => <div key={title} className="border-t border-[#d9c49a] pt-4"><div className="flex items-center gap-3"><Check size={16} className="text-[#c5a059]" /><h3 className="text-sm font-semibold">{title}</h3></div><p className="mt-2 pl-7 text-sm leading-6 text-[#8c8b84]">{text}</p></div>)}</div></div></section>

      <section id="services" className="scroll-mt-[76px] bg-[#f3f1eb] px-6 py-28 lg:px-10"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow">{tr('What we do', 'Layanan kami')}</p><h2 className="mt-4 font-serif text-4xl sm:text-5xl">{tr('Services with substance.', 'Layanan yang bermakna.')}</h2></div><p className="max-w-sm text-sm leading-7 text-[#77756d]">{tr('From the first document to the final approval, our specialists make complex requirements feel simple.', 'Dari dokumen pertama hingga persetujuan akhir, spesialis kami membuat persyaratan yang rumit terasa sederhana.')}</p></div><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{translatedServices.map(({icon: Icon,title,text,cta}, i) => <a href={`/services/${services[i].slug}`} key={title} aria-label={`${tr('Open details for', 'Buka detail layanan')} ${title}`} className="group rounded-xl border border-black/5 bg-[#fcfcfa] p-7 text-left transition duration-300 hover:-translate-y-1 hover:border-[#c5a059]/50 hover:shadow-xl"><div className="flex items-start justify-between"><Icon className="text-[#c5a059]" size={25} strokeWidth={1.4} /><span className="font-serif text-3xl text-[#e1d9c8]">0{i+1}</span></div><h3 className="mt-12 max-w-[220px] text-lg font-medium leading-6">{title}</h3><p className="mt-3 text-sm leading-6 text-[#8c8b84]">{text}</p><span className="mt-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b08a43]">{tr('View service details', 'Lihat detail layanan')} <ArrowRight size={13} /></span></a>)}</div></div></section>

      <section id="process" className="scroll-mt-[76px] bg-[#242421] px-6 py-28 text-white lg:px-10"><div className="mx-auto max-w-7xl"><div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="eyebrow text-[#c5a059]">{tr('Our process', 'Proses kami')}</p><h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">{tr('Progress, made visible.', 'Kemajuan yang terlihat.')}</h2><p className="mt-6 max-w-sm text-sm leading-7 text-white/55">{tr('A clear, guided workflow across every institution involved in your legal and immigration journey.', 'Alur kerja yang jelas dan terpandu di setiap instansi yang terlibat dalam perjalanan legal dan imigrasi Anda.')}</p></div><div><div className="relative grid gap-4 md:grid-cols-2">{processStages.map((stage, i) => { const content = isIndonesian ? stage.id : stage.en; return <button type="button" key={stage.number} onClick={() => setActiveStep(i)} className={`relative rounded-xl border p-5 text-left transition ${activeStep === i ? 'border-[#c5a059] bg-[#c5a059] text-[#242421] shadow-xl' : 'border-white/15 bg-white/[0.03] hover:border-[#c5a059]/70'}`}><span className={`font-serif text-3xl ${activeStep === i ? 'text-[#242421]/60' : 'text-[#c5a059]'}`}>{stage.number}</span><h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.14em]">{content.title}</h3><p className={`mt-3 text-sm leading-6 ${activeStep === i ? 'text-[#242421]/70' : 'text-white/55'}`}>{content.description}</p><div className={`mt-5 flex flex-col gap-2 border-t pt-4 text-xs ${activeStep === i ? 'border-[#242421]/20' : 'border-white/15'}`}>{content.items.map(([label, description]) => <span key={label}><strong className="mr-2 font-semibold">{label}</strong><span className={activeStep === i ? 'text-[#242421]/65' : 'text-white/45'}>{description}</span></span>)}</div></button> })}</div><div className="mt-10 flex flex-wrap items-center gap-2 border-y border-white/15 py-5">{processStages.flatMap((stage) => (isIndonesian ? stage.id : stage.en).items.map(([label]) => label)).map((label, i, flow) => <span key={`${label}-${i}`} className="flex items-center gap-2"><span className="rounded-full border border-[#c5a059]/60 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#e5c47d]">{label}</span>{i < flow.length - 1 && <ArrowRight size={13} className="text-[#c5a059]" />}</span>)}</div><p className="mt-5 text-[10px] leading-5 text-white/35">{tr('General guidance only and subject to applicable government regulations.', 'Panduan umum dan dapat berubah sesuai peraturan pemerintah yang berlaku.')}</p></div></div></div></section>

      <section id="gallery" className="scroll-mt-[76px] px-6 py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">{tr('Inside KITASKU.ID', 'Di dalam KITASKU.ID')}</p>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl">{tr('Where details matter.', 'Di mana setiap detail berarti.')}</h2>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {(showAllGallery ? galleryImages : galleryImages.slice(0, 8)).map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                aria-label={image.title || image.alt}
                onClick={() => setSelectedGallery(index)}
                className="group overflow-hidden rounded-xl border-4 border-white bg-white text-left shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img alt={image.alt} src={image.src} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="px-4 py-4">
                  <p className="line-clamp-1 text-sm font-semibold text-[#242421]">{image.title || image.alt}</p>
                  {image.caption && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8c8b84]">{image.caption}</p>}
                </div>
              </button>
            ))}
          </div>
          {galleryImages.length > 8 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllGallery((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-[#c5a059] bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#b08a43] transition hover:bg-[#c5a059] hover:text-white"
              >
                {showAllGallery ? tr('Show less', 'Tampilkan lebih sedikit') : tr('View more', 'Lihat selengkapnya')}
                <ChevronDown size={15} className={`transition-transform ${showAllGallery ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="news" className="scroll-mt-[76px] bg-[#f3f1eb] px-6 py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">{tr('Insights & updates', 'Wawasan & pembaruan')}</p>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl">{tr('Stay informed.', 'Tetap terinformasi.')}</h2>
            </div>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {(showAllNews ? translatedArticles : translatedArticles.slice(0, 3)).map((article, i) => (
              <button key={`${article.title}-${i}`} onClick={() => setSelectedArticle(i)} className="group text-left">
                <div className="relative h-56 overflow-hidden rounded-xl bg-[#ddd] bg-cover bg-center transition duration-500 group-hover:brightness-90" style={{ backgroundImage: `url("${article.image || fallbackArticleImages[i % fallbackArticleImages.length]}")` }}>
                  <span className="absolute left-4 top-4 rounded-full bg-[#fcfcfa] px-3 py-1 text-[9px] uppercase tracking-[0.15em] text-[#b08a43]">{article.tag}</span>
                </div>
                <p className="mt-5 text-[10px] uppercase tracking-[0.15em] text-[#b08a43]">{article.date}</p>
                <h3 className="mt-2 text-xl leading-7 transition group-hover:text-[#b08a43]">{article.title}</h3>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#242421]">{tr('Read article', 'Baca berita')} <ArrowRight size={14} /></span>
              </button>
            ))}
          </div>
          {translatedArticles.length > 3 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllNews((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-[#c5a059] bg-[#fcfcfa] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#b08a43] transition hover:bg-[#c5a059] hover:text-white"
              >
                {showAllNews ? tr('Show less', 'Tampilkan lebih sedikit') : tr('View more', 'Lihat selengkapnya')}
                <ChevronDown size={15} className={`transition-transform ${showAllNews ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-7xl border-y border-black/10 py-12">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#b08a43]">{tr('Partners we work with', 'Partner yang bekerja sama')}</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#77756d]">{tr('Trusted institutions and companies supporting clear, compliant journeys.', 'Institusi dan perusahaan terpercaya yang mendukung perjalanan yang jelas dan sesuai aturan.')}</p>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8c8b84]">{tr('Trusted alongside', 'Dipercaya bersama')}</p>
            </div>

            <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
              <div className="animate-marquee-ltr" style={{ ['--marquee-duration' as string]: '26s' }}>
                {[0, 1].map((groupIndex) => (
                  <div key={groupIndex} aria-hidden={groupIndex === 1 ? 'true' : undefined} className="flex shrink-0 gap-3 pr-3">
                    {[
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/KEMNAKER-460geIiVhZJAbVmU4QdessVNI9QrrI.png', 'Logo KEMNAKER', 'KEMNAKER', tr('Manpower', 'Ketenagakerjaan')],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMIGRASI-QLoVMeOJoHscDd9t6TyUjjwUULDQKM.png', 'Logo IMIGRASI', 'IMIGRASI', tr('Immigration', 'Keimigrasian')],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DUKCAPIL-zuhsjCrnyEc8ZpcrHVCP1Zop2wFAVa.png', 'Logo DUKCAPIL', 'DUKCAPIL', tr('Civil registry', 'Kependudukan & Pencatatan Sipil')],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/POLDA-puS6FnWP4TS4OGSRZmLxyToXWwZUE1.png', 'Logo POLDA', 'POLDA', tr('Public safety', 'Kepolisian')],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/KEMNAKER-460geIiVhZJAbVmU4QdessVNI9QrrI.png', 'Logo KEMNAKER', 'KEMNAKER', tr('Manpower', 'Ketenagakerjaan')],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMIGRASI-QLoVMeOJoHscDd9t6TyUjjwUULDQKM.png', 'Logo IMIGRASI', 'IMIGRASI', tr('Immigration', 'Keimigrasian')],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DUKCAPIL-zuhsjCrnyEc8ZpcrHVCP1Zop2wFAVa.png', 'Logo DUKCAPIL', 'DUKCAPIL', tr('Civil registry', 'Kependudukan & Pencatatan Sipil')],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/POLDA-puS6FnWP4TS4OGSRZmLxyToXWwZUE1.png', 'Logo POLDA', 'POLDA', tr('Public safety', 'Kepolisian')],
                    ].map(([src, alt, name, role], idx) => (
                      <div key={`${name}-${idx}`} className="flex min-h-[112px] w-[240px] shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-4 text-center sm:w-[280px]">
                        <img src={src} alt={alt} className="h-14 max-w-[100px] object-contain" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#242421]">{name}</p>
                        <p className="text-[9px] uppercase tracking-[0.12em] text-[#8c8b84]">{role}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <p className="pt-4 text-[10px] uppercase tracking-[0.2em] text-[#8c8b84]">{tr('Company partners', 'Mitra perusahaan')}</p>

            <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
              <div className="animate-marquee-ltr" style={{ ['--marquee-duration' as string]: '30s' }}>
                {[0, 1].map((groupIndex) => (
                  <div key={groupIndex} aria-hidden={groupIndex === 1 ? 'true' : undefined} className="flex shrink-0 gap-3 pr-3">
                    {[
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pt%20sumisho%20global%20logistics%20indonesia-iC0GvdmQUxbH788BNm839A5HwEozKL.jpg', 'Logo SUMISHO', 'pt sumisho global logistics indonesia'],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/global%20inbyra%20school-zG0OYlRWV26eQIkOId52ZSNnKvFs17.jpg', 'Logo GLOBAL INBYRA SCHOOL', 'GLOBAL INBYRA SCHOOL'],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sansin%20indonesia-Eo8rspuga4PpteALOwGXyO7Fl8u4gp.jpg', 'Logo SANSIN', 'sansin indonesia'],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PT%20NETLINK%20WORLD%20INDONESIA-S6uH7bSKWdX3j6dgziw5YyEcCrJTvC.jpg', 'Logo NETLINK', 'PT NETLINK WORLD INDONESIA'],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/YANMAR%20INDONESIA-bdwC0CVc6L49cw720AdaHPNDJJYANZ.jpg', 'Logo YANMAR', 'YANMAR INDONESIA'],
                      ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/adlink%20indonesia-osOIIbA2l0jxTwWgBRiqADL28NFkcg.svg', 'Logo ADLINK', 'adlink indonesia'],
                    ].map(([src, alt, name], idx) => (
                      <div key={`${name}-${idx}`} className="flex min-h-[112px] w-[200px] shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-black/10 bg-[#f3f1eb] px-4 py-4 text-center sm:w-[220px]">
                        <img src={src} alt={alt} className="h-12 max-w-[150px] object-contain" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#242421]">{name}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="relative mx-6 mb-10 scroll-mt-[76px] overflow-hidden rounded-2xl bg-[#242421] px-6 py-16 text-white shadow-2xl ring-1 ring-white/10 sm:px-10 lg:mx-auto lg:max-w-7xl lg:px-14 lg:py-20"><div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full border border-[#c5a059]/20" /><div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full border border-[#c5a059]/10" /><div className="relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16"><p className="eyebrow text-[#c5a059] lg:col-start-1">{tr('Get in touch', 'Hubungi kami')}</p><h2 className="mt-5 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl lg:col-start-1">{tr('Let’s make your next step clear.', 'Mari buat langkah Anda berikutnya lebih jelas.')}</h2><p className="mt-6 max-w-xl text-sm leading-7 text-white/60 lg:col-start-1">{tr('Have questions about visa, stay permit, or work permit services? Our team is ready to help.', 'Punya pertanyaan tentang layanan visa, izin tinggal, atau izin kerja? Tim kami siap membantu.')}</p><div className="mt-2 grid gap-7 text-left sm:grid-cols-2 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:mt-0"><div className="flex gap-4"><span className="mt-0.5 text-xl text-[#c5a059]">⌖</span><div><p className="font-semibold text-white">{tr('Office address', 'Alamat kantor')}</p><p className="mt-1 leading-6 text-white/55">Bonia Residence blok D13 RT.004/RW.005, Jatimurni, Kec. Pd. Melati, Kota Bks, Jawa Barat 17431</p></div></div><div className="flex gap-4"><span className="mt-0.5 text-xl text-[#c5a059]">@</span><div><p className="font-semibold text-white">Email</p><a href="mailto:kitaskuu@gmail.com" className="mt-1 block text-white/70 hover:text-[#b08a43]">kitaskuu@gmail.com</a></div></div><div className="flex gap-4"><span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border-2 border-[#c5a059] text-[0px] after:size-2 after:rounded-full after:border-2 after:border-[#c5a059] after:content-['']" /><div><p className="font-semibold text-white">{tr('Instagram', 'Instagram')}</p><a href="https://instagram.com/kitasku.id?dlrf=MWR1ZXBvM2RzeGYxYw==" target="_blank" rel="noreferrer" className="mt-1 block text-white/55 transition hover:text-[#c5a059]">kitasku.id</a></div></div><div className="flex gap-4"><MessageCircle className="mt-0.5 shrink-0 text-[#c5a059]" size={20} /><div><p className="font-semibold text-white">{tr('Phone / WhatsApp', 'Telepon / WhatsApp')}</p><p className="mt-1 flex flex-col text-white/70">
  <a href="https://wa.me/6281932024405" target="_blank" rel="noreferrer" className="hover:text-[#c5a059]">081932024405</a>
  <a href="https://wa.me/6281310096989" target="_blank" rel="noreferrer" className="hover:text-[#c5a059]">081310096989</a>
</p></div></div><div className="flex gap-4"><Clock3 className="mt-0.5 shrink-0 text-[#c5a059]" size={20} /><div><p className="font-semibold text-white">{tr('Operating hours', 'Jam operasional')}</p><p className="mt-1 text-white/70">{tr('Open: 09:00 – 17:00 WIB', 'Buka: 09.00 – 17.00 WIB')}</p><p className="mt-1 text-xs text-[#8c8b84]">{tr('Closed Saturdays, Sundays, and national holidays.', 'Tutup Sabtu, Minggu, dan hari libur nasional.')}</p></div></div></div><div className="mt-10 border-t border-black/10 pt-8 text-center"><p className="font-semibold text-[#242421]">{tr('', 'Media sosial')}</p><a href="#contact" className="mt-2 inline-block text-[#b08a43] hover:underline"></a></div></div></section>

      <footer className="bg-[#242421] px-6 pb-8 pt-16 text-white lg:px-10"><div className="mx-auto max-w-7xl"><div className="grid gap-12 md:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]"><div><a href="#home" onClick={(event) => { event.preventDefault(); navigateTo('home') }} className="flex items-center gap-3 text-lg font-semibold tracking-[0.28em]"><img src="/logo-kitasku.png" alt="Logo KITASKU.ID" className="size-10 object-contain" />KITASKU.ID</a><p className="mt-6 max-w-xs text-sm leading-7 text-white/45">{tr('Professional legal, licensing, and immigration solutions for a world in motion.', 'Solusi legal, perizinan, dan imigrasi profesional untuk dunia yang terus bergerak.')}</p><div className="mt-6 flex gap-3"><a aria-label="Instagram kitasku.id" href="https://instagram.com/kitasku.id?dlrf=MWR1ZXBvM2RzeGYxYw==" target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-3 py-2 text-white/60 hover:text-[#c5a059]"><span className="text-[10px] font-semibold">kitasku.id</span></a></div></div><div><p className="footer-label">{tr('Explore', 'Jelajahi')}</p><div className="mt-5 flex flex-col gap-3 text-sm text-white/50"><a href="#about-us" onClick={(event) => { event.preventDefault(); navigateTo('about-us') }}>{tr('About Us', 'Tentang Kami')}</a><a href="#services" onClick={(event) => { event.preventDefault(); navigateTo('services') }}>{tr('Services', 'Layanan')}</a><a href="#process" onClick={(event) => { event.preventDefault(); navigateTo('process') }}>{tr('Our Process', 'Proses Kami')}</a><a href="#news" onClick={(event) => { event.preventDefault(); navigateTo('news') }}>{tr('Insights', 'Berita & Wawasan')}</a></div></div><div><p className="footer-label">{tr('Contact', 'Kontak')}</p><div className="mt-5 flex flex-col gap-3 text-sm text-white/50">
  <a href="mailto:kitaskuu@gmail.com">kitaskuu@gmail.com</a>
  <a href="https://wa.me/6281932024405" target="_blank" rel="noreferrer">081932024405</a>
  <a href="https://wa.me/6281310096989" target="_blank" rel="noreferrer">081310096989</a>
  <span>Jakarta, Indonesia</span>
</div></div><div><p className="footer-label !text-white">{tr('Office hours', 'Jam operasional')}</p><div className="mt-5 flex items-start gap-3 text-sm leading-6 text-white"><Clock3 className="mt-1 shrink-0 text-[#c5a059]" size={16} /><span className="text-white"><strong className="font-medium text-white">{tr('Monday – Friday', 'Senin – Jumat')}</strong><br /><span className="text-white">09:00 – 17:00 WIB</span></span></div></div></div><div className="mt-16 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.14em] text-white/45 sm:flex-row"><span>&copy; {new Date().getFullYear()} KITASKU.ID &mdash; {tr('Legal & Immigration Consultant. All rights reserved.', 'Konsultan Legal & Imigrasi. Seluruh hak cipta dilindungi.')}</span><span>{tr('Privacy policy · Terms of service', 'Kebijakan privasi · Ketentuan layanan')}</span></div></div></footer>

      {(selectedGallery !== null || selectedService !== null || selectedArticle !== null) && <div role="presentation" onClick={() => { setSelectedGallery(null); setSelectedService(null); setSelectedArticle(null) }} className="fixed inset-0 z-[60] flex items-center justify-center bg-[#242421]/90 p-3 backdrop-blur-sm sm:p-6"><div role="dialog" aria-modal="true" aria-labelledby="detail-modal-title" onClick={(event) => event.stopPropagation()} className={`relative flex w-full ${selectedGallery !== null ? 'max-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center overflow-y-auto rounded-2xl bg-[#242421] p-3 sm:p-5 [scrollbar-color:#c5a059_transparent] [scrollbar-width:thin]' : 'max-h-[calc(100vh-2rem)] max-w-lg flex-col overflow-y-auto rounded-2xl bg-[#fcfcfa] p-8 sm:p-10 [scrollbar-color:#c5a059_transparent] [scrollbar-width:thin]'} shadow-2xl`}><button type="button" aria-label={tr('Close details', 'Tutup detail')} onClick={() => { setSelectedGallery(null); setSelectedService(null); setSelectedArticle(null) }} className={`absolute right-5 top-5 z-20 rounded-full p-2.5 transition ${selectedGallery !== null ? 'bg-[#242421]/75 text-white hover:bg-[#c5a059] hover:text-white' : 'text-[#242421]/70 hover:bg-[#e8e5dc] hover:text-[#242421]'}`}><X size={18} /></button>{selectedGallery !== null ? <div className="flex w-full flex-col items-center justify-center"><div className="relative flex w-full items-center justify-center"><img src={galleryImages[selectedGallery].src} alt={galleryImages[selectedGallery].alt} className="max-h-[70vh] w-full rounded-xl object-contain" /><button type="button" aria-label={tr('Previous gallery image', 'Foto galeri sebelumnya')} onClick={() => setSelectedGallery((selectedGallery - 1 + galleryImages.length) % galleryImages.length)} className="absolute left-3 rounded-full bg-[#242421]/75 p-3 text-white transition hover:bg-[#c5a059]"><ArrowLeft size={18} /></button><button type="button" aria-label={tr('Next gallery image', 'Foto galeri berikutnya')} onClick={() => setSelectedGallery((selectedGallery + 1) % galleryImages.length)} className="absolute right-3 rounded-full bg-[#242421]/75 p-3 text-white transition hover:bg-[#c5a059]"><ArrowRight size={18} /></button><span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#242421]/75 px-3 py-1 text-[10px] tracking-[0.14em] text-white">{selectedGallery + 1} / {galleryImages.length}</span></div><div className="mt-4 w-full rounded-xl bg-white/[0.06] px-5 py-4 text-center text-white"><p id="detail-modal-title" className="font-serif text-xl">{galleryImages[selectedGallery].title}</p>{galleryImages[selectedGallery].caption && <p className="mt-1 text-sm leading-6 text-white/60">{galleryImages[selectedGallery].caption}</p>}</div></div> : selectedService !== null ? <><p className="eyebrow">{tr('Service details', 'Detail layanan')}</p><h2 id="detail-modal-title" className="mt-4 max-w-md font-serif text-3xl leading-tight">{translatedServices[selectedService].title}</h2><p className="mt-5 text-sm leading-7 text-[#77756d]">{translatedServices[selectedService].detail}</p></> : <><p className="eyebrow">{translatedArticles[selectedArticle!].tag} · {translatedArticles[selectedArticle!].date}</p><h2 id="detail-modal-title" className="mt-4 max-w-md font-serif text-3xl leading-tight">{articleDetails[selectedArticle!].title}</h2><div className="mt-5 text-sm leading-7 text-[#77756d] [&_a]:text-[#b08a43] [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#c5a059] [&_blockquote]:pl-3.5 [&_blockquote]:italic [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#242421] [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#242421] [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(articleDetails[selectedArticle!].text) }} /></>}</div></div>}
    </main>
  )
}
