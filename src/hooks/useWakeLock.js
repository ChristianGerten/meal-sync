import { useEffect, useRef } from 'react'

export function useWakeLock(active = true) {
  const wakeLockRef = useRef(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    const acquire = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch (err) {
        console.warn('Wake Lock nicht verfügbar:', err)
      }
    }

    acquire()

    // Bei Tab-Wechsel neu anfordern
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      wakeLockRef.current?.release()
    }
  }, [active])
}