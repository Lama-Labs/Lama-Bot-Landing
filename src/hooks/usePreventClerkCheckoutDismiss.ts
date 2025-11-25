'use client'

import { useEffect } from 'react'

/**
 * Prevents Clerk's checkout drawer from closing via outside click or Escape.
 * Allows closing via the built-in close button or any controls inside the drawer.
 */
export function usePreventClerkCheckoutDismiss(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const isDrawerOpen = () =>
      document.querySelector('.cl-drawerRoot[role="dialog"]') != null

    const shouldBlock = (target: EventTarget | null) => {
      if (!isDrawerOpen()) return false
      const root = document.querySelector(
        '.cl-drawerRoot[role="dialog"]'
      ) as HTMLElement | null
      if (!root) return false
      const content = root.querySelector(
        '.cl-drawerContent'
      ) as HTMLElement | null
      const closeBtn = root.querySelector(
        '.cl-drawerClose'
      ) as HTMLElement | null
      const node = target as Node | null
      if (!node) return false
      if (content && content.contains(node)) return false
      if (closeBtn && closeBtn.contains(node)) return false
      return true
    }

    const stop = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      // @ts-ignore
      if (typeof e.stopImmediatePropagation === 'function') {
        // @ts-ignore
        e.stopImmediatePropagation()
      }
    }

    const onPointerDown = (e: PointerEvent | MouseEvent) => {
      if (shouldBlock(e.target)) stop(e)
    }
    const onClick = (e: MouseEvent) => {
      if (shouldBlock(e.target)) stop(e)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (isDrawerOpen() && (e.key === 'Escape' || e.key === 'Esc')) stop(e)
    }

    const capture = true
    document.addEventListener('pointerdown', onPointerDown as any, { capture })
    document.addEventListener('mousedown', onPointerDown as any, { capture })
    document.addEventListener('click', onClick, { capture })
    document.addEventListener('keydown', onKeyDown, { capture })

    return () => {
      document.removeEventListener(
        'pointerdown',
        onPointerDown as any,
        {
          capture,
        } as any
      )
      document.removeEventListener(
        'mousedown',
        onPointerDown as any,
        {
          capture,
        } as any
      )
      document.removeEventListener('click', onClick, { capture } as any)
      document.removeEventListener('keydown', onKeyDown, { capture } as any)
    }
  }, [enabled])
}
