import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'waldas-watch-install-dismissed'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

type InstallPromptState =
  | { status: 'unavailable' }
  | { status: 'dismissed' }
  | { status: 'ready'; prompt: () => Promise<'accepted' | 'dismissed'> }
  | { status: 'ios' }

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isStandalone = ('standalone' in navigator) && (navigator as { standalone?: boolean }).standalone
  return isIos && !isStandalone
}

function isStandaloneMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}

export function useInstallPrompt(): [InstallPromptState, () => void] {
  const [state, setState] = useState<InstallPromptState>({ status: 'unavailable' })

  useEffect(() => {
    if (isStandaloneMode()) return
    const dismissedAt = localStorage.getItem(DISMISSED_KEY)
    if (dismissedAt && Date.now() - Number(dismissedAt) < THIRTY_DAYS_MS) return

    if (isIosSafari()) {
      setState({ status: 'ios' })
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setState({
        status: 'ready',
        prompt: async () => {
          const { outcome } = await promptEvent.prompt()
          return outcome
        },
      })
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setState({ status: 'dismissed' })
  }

  return [state, dismiss]
}
