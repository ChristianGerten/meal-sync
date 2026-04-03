import { useState, useEffect, useCallback } from 'react'
import { Check, X, AlertCircle, Info } from 'lucide-react'

let toastFn = null

export const toast = {
  success: (msg) => toastFn?.('success', msg),
  error: (msg) => toastFn?.('error', msg),
  info: (msg) => toastFn?.('info', msg),
}

const ICONS = {
  success: Check,
  error: AlertCircle,
  info: Info,
}

const COLORS = {
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#166534',
    icon: '#22c55e',
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#991b1b',
    icon: '#ef4444',
  },
  info: {
    bg: 'var(--color-accent-soft)',
    border: 'var(--color-accent)',
    text: 'var(--color-accent-text)',
    icon: 'var(--color-accent)',
  },
}

const DARK_COLORS = {
  success: {
    bg: '#052e16',
    border: '#166534',
    text: '#bbf7d0',
    icon: '#22c55e',
  },
  error: {
    bg: '#2d1515',
    border: '#991b1b',
    text: '#fecaca',
    icon: '#ef4444',
  },
  info: {
    bg: 'var(--color-accent-soft)',
    border: 'var(--color-accent)',
    text: 'var(--color-accent-text)',
    icon: 'var(--color-accent)',
  },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.getAttribute('data-theme') === 'dark')
    })
    obs.observe(document.documentElement, { attributes: true })
    return () => obs.disconnect()
  }, [])

  const add = useCallback((type, message) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    toastFn = add
    return () => { toastFn = null }
  }, [add])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', top: '70px', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999, display: 'flex',
      flexDirection: 'column', gap: '8px',
      width: 'calc(100% - 32px)', maxWidth: '360px',
      pointerEvents: 'none'
    }}>
      {toasts.map(({ id, type, message }) => {
        const colors = dark ? DARK_COLORS[type] : COLORS[type]
        const Icon = ICONS[type]
        return (
          <div key={id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px',
            background: colors.bg,
            border: `0.5px solid ${colors.border}`,
            borderRadius: '14px',
            pointerEvents: 'auto',
            animation: 'slideIn 0.2s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <Icon size={16} color={colors.icon} strokeWidth={2.5} style={{flexShrink: 0}} />
            <span style={{
              flex: 1, fontSize: '13px', fontWeight: '500',
              color: colors.text, lineHeight: '1.4'
            }}>
              {message}
            </span>
            <button onClick={() => remove(id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', color: colors.text, opacity: 0.6,
              display: 'flex', alignItems: 'center', flexShrink: 0
            }}>
              <X size={14} />
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}