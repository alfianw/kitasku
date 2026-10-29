'use client'

import React, { Children, cloneElement, isValidElement, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ChevronDown, Languages, Menu, MessageCircle, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { serviceExactIdToEn } from '@/lib/service-translations'

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

const serviceExactIdToEnLower: Record<string, string> = Object.fromEntries(
  Object.entries(serviceExactIdToEn).map(([k, v]) => [k.toLowerCase(), v]),
)

function translateString(raw: string, language: 'EN' | 'ID'): string {
  const trimmed = raw.trim()
  if (!trimmed) return raw
  const normalized = trimmed.replace(/\s+/g, ' ')
  const leading = raw.match(/^\s*/)?.[0] ?? ''
  const trailing = raw.match(/\s*$/)?.[0] ?? ''

  if (language === 'ID') {
    const match = exactEnToId[trimmed] ?? exactEnToId[normalized]
    return match ? `${leading}${match}${trailing}` : raw
  }

  const match =
    serviceExactIdToEn[trimmed] ??
    serviceExactIdToEn[normalized] ??
    serviceExactIdToEnLower[normalized.toLowerCase()]
  return match ? `${leading}${match}${trailing}` : raw
}

function translateReactNode(node: React.ReactNode, language: 'EN' | 'ID'): React.ReactNode {
  if (typeof node === 'string') {
    return translateString(node, language)
  }
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const translated = translateReactNode(child, language)
      if (isValidElement(translated) && translated.key == null) {
        return cloneElement(translated, { key: `tr-${index}` })
      }
      return translated
    })
  }
  if (isValidElement<{ children?: React.ReactNode; alt?: string }>(node)) {
    const props = node.props
    const nextProps: { children?: React.ReactNode; alt?: string } = {}
    let changed = false

    if (typeof props.alt === 'string') {
      const nextAlt = translateString(props.alt, language)
      if (nextAlt !== props.alt) {
        nextProps.alt = nextAlt
        changed = true
      }
    }

    if (props.children !== undefined) {
      const translatedChildren = translateReactNode(props.children, language)
      if (translatedChildren !== props.children) {
        nextProps.children = translatedChildren
        changed = true
      }
    }

    return changed ? cloneElement(node, nextProps) : node
  }
  return node
}

export function TranslatedMain({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { language } = useLanguage()
  return <main className={className}>{translateReactNode(children, language)}</main>
}

export function ServiceLanguageSelector() {
  const { language, setLanguage, isIndonesian, tr } = useLanguage()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
    setOpen(false)
  }, [pathname])

  const mobileNavLinks = [
    { label: tr('Home', 'Beranda'), href: '/', active: false },
    { label: tr('About Us', 'Tentang Kami'), href: '/#about-us', active: false },
    { label: tr('Services', 'Layanan'), href: '/#services', active: true },
    { label: tr('Process', 'Proses'), href: '/#process', active: false },
    { label: tr('Gallery', 'Galeri'), href: '/#gallery', active: false },
    { label: tr('News', 'Berita'), href: '/#news', active: false },
    { label: tr('Contact', 'Kontak'), href: '/#contact', active: false },
  ]

  const backHref =
    pathname === '/services/e-visa-services' ||
    pathname === '/services/business-establishment' ||
    pathname === '/services/product-import-export-registration' ||
    pathname === '/services/other-services' ||
    pathname === '/services/rptka-imta-services' ||
    pathname === '/services/immigration-services' ||
    pathname === '/services/kitas-itas-services'
      ? '/#services'
      : '/services/e-visa-services'

  return (
    <div data-no-translate="true" className="relative shrink-0">
      {/* Desktop Language Selector */}
      <div className="hidden lg:block">
        <button
          type="button"
          aria-label={tr('Choose language', 'Pilih bahasa')}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-w-[132px] items-center justify-between gap-2 whitespace-nowrap rounded-full border border-[#c5a059]/40 bg-white/70 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#242421]/75 shadow-sm transition hover:border-[#c5a059] hover:text-[#a77d2f]"
        >
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`inline-block h-4 w-6 shrink-0 rounded-sm shadow-[0_0_0_1px_rgba(36,36,33,0.12)] ${
                language === 'EN'
                  ? 'bg-[linear-gradient(#b22234_0_14%,#fff_14%_28%,#b22234_28%_42%,#fff_42%_56%,#b22234_56%_70%,#fff_70%_84%,#b22234_84%)]'
                  : 'bg-[linear-gradient(to_bottom,#e53935_0_50%,#fff_50%)]'
              }`}
            />
            <span>{language === 'EN' ? 'English' : 'Indonesia'}</span>
          </span>
          <ChevronDown size={13} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div
            role="listbox"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 rounded-2xl border border-[#c5a059]/30 bg-[#fffdf8] p-1.5 shadow-xl"
          >
            <button
              type="button"
              role="option"
              aria-selected={language === 'EN'}
              onClick={() => {
                setLanguage('EN')
                setOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                language === 'EN' ? 'bg-[#f4ead4] text-[#8d6829]' : 'text-[#242421]/70 hover:bg-[#f8f5ed]'
              }`}
            >
              <span className="inline-block h-4 w-6 rounded-sm bg-[linear-gradient(#b22234_0_14%,#fff_14%_28%,#b22234_28%_42%,#fff_42%_56%,#b22234_56%_70%,#fff_70%_84%,#b22234_84%)]" />
              English
              <span className="ml-auto text-[#c5a059]">{language === 'EN' ? '✓' : ''}</span>
            </button>
            <button
              type="button"
              role="option"
              aria-selected={language === 'ID'}
              onClick={() => {
                setLanguage('ID')
                setOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                language === 'ID' ? 'bg-[#f4ead4] text-[#8d6829]' : 'text-[#242421]/70 hover:bg-[#f8f5ed]'
              }`}
            >
              <span className="inline-block h-4 w-6 rounded-sm bg-[linear-gradient(to_bottom,#e53935_0_50%,#fff_50%)]" />
              Indonesia
              <span className="ml-auto text-[#c5a059]">{language === 'ID' ? '✓' : ''}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Hamburger Button (matches Home page) */}
      <button
        type="button"
        aria-label={tr('Open navigation', 'Buka navigasi')}
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="flex items-center justify-center p-1 text-[#242421] lg:hidden"
      >
        {mobileMenuOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 top-[76px] z-50 flex flex-col gap-5 border-b border-t border-black/5 bg-[#fcfcfa] px-6 py-6 shadow-xl lg:hidden"
        >
          {mobileNavLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={item.active ? 'page' : undefined}
              className={`border-l-2 pl-3 text-xs uppercase tracking-[0.16em] transition-colors ${
                item.active ? 'border-[#c5a059] font-semibold text-[#b08a43]' : 'border-transparent text-[#242421]/70'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={backHref}
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex items-center gap-2 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#a77d2f]"
          >
            <ArrowLeft size={15} /> {tr('All services', 'Semua layanan')}
          </Link>
          <button
            type="button"
            onClick={() => setLanguage(isIndonesian ? 'EN' : 'ID')}
            className="flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-[0.16em] text-[#b08a43]"
          >
            <Languages size={15} /> {isIndonesian ? 'English' : 'Indonesia'}
          </button>
          <a
            href="https://wa.me/6281932024405"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#c5a059] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#a88342]"
          >
            <MessageCircle size={14} /> {tr('Consult via WhatsApp', 'Konsultasi WhatsApp')}
          </a>
        </nav>
      )}
    </div>
  )
}
