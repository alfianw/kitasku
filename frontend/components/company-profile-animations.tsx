'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function CompanyProfileAnimations() {
  const pathname = usePathname()
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const isDashboard = Boolean(pathname?.startsWith('/dashbord'))

  useEffect(() => {
    const root = document.documentElement

    if (isDashboard) {
      root.removeAttribute('data-kp-animated')
      return
    }

    root.setAttribute('data-kp-animated', 'true')

    // 1. Top Gold Scroll Progress Bar
    let rafId = 0
    const updateScrollProgress = () => {
      rafId = 0
      if (!progressBarRef.current) return
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0
      progressBarRef.current.style.transform = `scaleX(${progress})`
    }

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateScrollProgress)
      }
    }

    updateScrollProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    // 2. Non-destructive Scroll & Entrance Animations
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      return () => {
        if (rafId) window.cancelAnimationFrame(rafId)
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    }

    // Clear any stale animation attributes from previous route
    document.querySelectorAll<HTMLElement>('[data-kp-animate], [data-kp-variant]').forEach((el) => {
      el.removeAttribute('data-kp-animate')
      el.removeAttribute('data-kp-variant')
      el.style.removeProperty('--kp-delay')
    })

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            const variant = target.getAttribute('data-kp-variant') || 'up'
            target.setAttribute('data-kp-animate', variant)
            io.unobserve(target)
          }
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -4% 0px',
        threshold: 0.05,
      },
    )

    const registerElement = (
      el: HTMLElement,
      variant: 'up' | 'scale',
      delayMs = 0,
    ) => {
      if (
        el.tagName === 'HEADER' ||
        el.getAttribute('role') === 'presentation' ||
        el.getAttribute('role') === 'dialog' ||
        el.hasAttribute('data-kp-variant')
      ) {
        return
      }

      el.setAttribute('data-kp-variant', variant)
      if (delayMs > 0) {
        el.style.setProperty('--kp-delay', `${delayMs}ms`)
      }
      io.observe(el)
    }

    const scanAndAttachAnimations = () => {
      const main = document.querySelector('main')
      if (!main) return

      const sections = Array.from(main.querySelectorAll(':scope > section'))

      sections.forEach((section, sectionIndex) => {
        const isHero = sectionIndex === 0

        if (isHero) {
          const h1 = section.querySelector<HTMLElement>('h1')
          if (h1) {
            const eyebrow = h1.previousElementSibling as HTMLElement | null
            if (eyebrow) registerElement(eyebrow, 'up', 20)
            registerElement(h1, 'up', 80)

            let sibling = h1.nextElementSibling as HTMLElement | null
            let step = 0
            while (sibling) {
              registerElement(sibling, 'up', 150 + step * 70)
              sibling = sibling.nextElementSibling as HTMLElement | null
              step++
            }
          }

          const heroImages = section.querySelectorAll<HTMLElement>('img')
          heroImages.forEach((img) => {
            const frame = img.parentElement as HTMLElement | null
            if (frame && frame !== section && frame.tagName === 'DIV') {
              registerElement(frame, 'scale', 120)
            }
          })
          return
        }

        // Section headings & lead text
        const headings = section.querySelectorAll<HTMLElement>('h2')
        headings.forEach((h2) => {
          // Do not double-register h2 inside an article card
          if (h2.closest('article')) return
          const eyebrow = h2.previousElementSibling as HTMLElement | null
          if (eyebrow && eyebrow.tagName === 'P') {
            registerElement(eyebrow, 'up', 0)
          }
          registerElement(h2, 'up', 50)
          const lead = h2.nextElementSibling as HTMLElement | null
          if (lead && lead.tagName === 'P') {
            registerElement(lead, 'up', 100)
          }
        })

        // Stagger cards and items inside leaf grids
        const grids = section.querySelectorAll<HTMLElement>('.grid')
        grids.forEach((grid) => {
          // Skip outer layout grids that contain nested grids or section h2 headings
          if (grid.querySelector('.grid')) return
          const children = Array.from(grid.children) as HTMLElement[]
          if (children.length <= 1) return

          children.forEach((child, idx) => {
            if (child.tagName === 'H2' || child.querySelector('h2:not(article h2)')) return
            const staggerDelay = Math.min(idx % 6, 5) * 60
            registerElement(child, 'up', staggerDelay)
          })
        })

        // Standalone articles
        const articles = section.querySelectorAll<HTMLElement>('article')
        articles.forEach((card, idx) => {
          registerElement(card, 'up', Math.min(idx % 4, 3) * 60)
        })
      })

      // Footer columns
      const footer = main.querySelector('footer')
      if (footer) {
        const footerGrid = footer.querySelector('.grid')
        if (footerGrid) {
          Array.from(footerGrid.children).forEach((col, idx) => {
            registerElement(col as HTMLElement, 'up', idx * 65)
          })
        }
      }
    }

    scanAndAttachAnimations()

    let mutationTimer: number | null = null
    const mo = new MutationObserver((mutations) => {
      const hasAddedElements = mutations.some((m) =>
        Array.from(m.addedNodes).some((n) => n.nodeType === Node.ELEMENT_NODE),
      )
      if (!hasAddedElements) return
      if (mutationTimer) window.clearTimeout(mutationTimer)
      mutationTimer = window.setTimeout(() => {
        scanAndAttachAnimations()
      }, 50)
    })

    const mainEl = document.querySelector('main')
    if (mainEl) {
      mo.observe(mainEl, { childList: true, subtree: true })
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      if (mutationTimer) window.clearTimeout(mutationTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname, isDashboard])

  if (isDashboard) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2.5px] overflow-hidden bg-transparent"
    >
      <div
        ref={progressBarRef}
        className="h-full w-full origin-left scale-x-0 bg-[linear-gradient(90deg,#9b742c_0%,#c5a059_50%,#e5c47d_100%)] shadow-[0_0_10px_rgba(197,160,89,0.65)] transition-transform duration-150 ease-out"
      />
    </div>
  )
}
