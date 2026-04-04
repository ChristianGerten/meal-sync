import { useState, useEffect, useCallback } from 'react'
import { Check, X, AlertCircle, Info, RotateCcw } from 'lucide-react'

let toastFn = null

export const toast = {
  success: (msg) => toastFn?.('success', msg),
  error: (msg) => toastFn?.('error', msg),
  info: (msg) => toastFn?.('info', msg),
  undo: (msg, onUndo) => toastFn?.('undo', msg, onUndo),
}

const COLORS_LIGHT = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '#ef4444' },
  info:    { bg: '#faf0eb', border: '#c1522a', text: '#8b3318', icon: '#c1522a' },
  undo:    { bg: '#faf9f7', border: '#d1c9c0', text: '#1a1814', icon: '#c1522a' },
}

const COLORS_DARK = {
  success: { bg: '#052e16', border: '#166534', text: '#bbf7d0', icon: '#22c55e' },
  error:   { bg: '#2d1515', border: '#991b1b', text: '#fecaca', icon: '#ef4444' },
  info:    { bg: '#2d1a12', border: '#c1522a', text: '#f0a882', icon: '#d4673a' },
  undo:    { bg: '#1e1c1a', border: '#3a3530', text: '#f5f3f0', icon: '#d4673a' },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.getAttribute('data-theme') === 'dark')
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true })
    return () => obs.disconnect()
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((type, message, onUndo) => {
    const id = Date.now()
    const duration = type === 'undo' ? 5000 : 3000

    setToasts(prev => [...prev, { id, type, message, onUndo }])

    // Für Undo-Toasts: Countdown-Ref
    const timer = setTimeout(() => remove(id), duration)

    // Timer-ID im Toast speichern damit Undo ihn stoppen kann
    setToasts(prev => prev.map(t => t.id === id ? { ...t, timer } : t))
  }, [remove])

  useEffect(() => {
    toastFn = add
    return () => { toastFn = null }
  }, [add])

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
      {toasts.map(({ id, type, message, onUndo, timer }) => {
        const colors = dark ? COLORS_DARK[type] : COLORS_LIGHT[type]
        return (
          <div key={id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px',
            background: colors.bg,
            border: '0.5px solid ' + colors.border,
            borderRadius: '14px',
            pointerEvents: 'auto',
            animation: 'slideIn 0.2s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            {type === 'success' && <Check size={16} color={colors.icon} strokeWidth={2.5} style={{flexShrink: 0}} />}
            {type === 'error' && <AlertCircle size={16} color={colors.icon} strokeWidth={2.5} style={{flexShrink: 0}} />}
            {type === 'info' && <Info size={16} color={colors.icon} strokeWidth={2.5} style={{flexShrink: 0}} />}
            {type === 'undo' && <RotateCcw size={16} color={colors.icon} strokeWidth={2} style={{flexShrink: 0}} />}

            <span style={{
              flex: 1, fontSize: '13px', fontWeight: '500',
              color: colors.text, lineHeight: '1.4'
            }}>
              {message}
            </span>

            {type === 'undo' && onUndo && (
              <button
                onClick={() => {
                  clearTimeout(timer)
                  remove(id)
                  onUndo()
                }}
                style={{
                  padding: '4px 10px',
                  background: colors.icon,
                  color: '#fff',
                  border: 'none', borderRadius: '7px',
                  cursor: 'pointer', fontSize: '12px',
                  fontWeight: '500', flexShrink: 0
                }}
              >
                Rückgängig
              </button>
            )}

            <button onClick={() => remove(id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', color: colors.text, opacity: 0.5,
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