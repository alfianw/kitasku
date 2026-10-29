'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

export function SiteFooter() {
  const { tr } = useLanguage()

  return (
    <footer data-no-translate="true" className="bg-[#242421] px-6 pb-8 pt-16 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-[0.28em]">
              <img src="/logo-kitasku.png" alt="Logo KITASKU.ID" className="size-10 object-contain" />
              KITASKU.ID
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-7 text-white/45">
              {tr(
                'Professional legal, licensing, and immigration services in Indonesia.',
                'Layanan legal, perizinan, dan keimigrasian profesional di Indonesia.',
              )}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4b36d]">
              {tr('Navigation', 'Navigasi')}
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
              <Link href="/#about-us">{tr('About us', 'Tentang kami')}</Link>
              <Link href="/#services">{tr('Services', 'Layanan')}</Link>
              <Link href="/#process">{tr('Process', 'Proses')}</Link>
              <Link href="/#contact">{tr('Contact', 'Kontak')}</Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4b36d]">
              {tr('Services', 'Layanan')}
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
              <Link href="/services/immigration-services">{tr('Immigration', 'Keimigrasian')}</Link>
              <Link href="/services/kitas-itas-services">KITAS / ITAS</Link>
              <Link href="/services/rptka-imta-services">RPTKA &amp; IMTA</Link>
              <Link href="/services/business-establishment">{tr('Business legal', 'Legalitas bisnis')}</Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4b36d]">
              {tr('Contact', 'Kontak')}
            </p>
            <p className="mt-5 text-sm leading-7 text-white/65">
              Bonia Residence blok D13 RT.004/RW.005, Jatimurni, Kec. Pd. Melati, Kota Bks, Jawa Barat 17431
              <br />
              {tr('Available nationwide', 'Tersedia di seluruh Indonesia')}
            </p>
            <div className="mt-4 flex flex-col gap-1 text-sm text-[#d4b36d]">
              <a href="mailto:kitaskuu@gmail.com">kitaskuu@gmail.com</a>
              <a href="https://wa.me/6281932024405">081932024405</a>
              <a href="https://wa.me/6281310096989">081310096989</a>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.14em] text-white/45 sm:flex-row">
          <span>
            &copy; {new Date().getFullYear()} KITASKU.ID &mdash;{' '}
            {tr(
              'Legal & Immigration Consultant. All rights reserved.',
              'Konsultan Legal & Imigrasi. Seluruh hak cipta dilindungi.',
            )}
          </span>
          <span>{tr('Privacy policy · Terms of service', 'Kebijakan privasi · Ketentuan layanan')}</span>
        </div>
      </div>
    </footer>
  )
}
