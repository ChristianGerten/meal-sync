import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCookHistoryStore } from '../store/useCookHistoryStore'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ChefHat, Timer, Plus, Minus, Play, Pause, RotateCcw, Check } from 'lucide-react'

// Zeitangaben im Text erkennen
const extractTime = (text) => {
  const patterns = [
    /(\d+)\s*(?:bis\s*\d+\s*)?minuten?/i,
    /(\d+)\s*min/i,
    /(\d+)\s*stunden?/i,
    /(\d+)\s*std/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1])
      const isHours = pattern.source.includes('stund') || pattern.source.includes('std')
      return isHours ? value * 60 : value
    }
  }
  return null
}

// Mengen im Text skalieren und hervorheben
const scaleTextAmounts = (text, factor) => {
  if (factor === 1) return [{ text, bold: false }]

  const parts = []
  const regex = /(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|EL|TL|Stück|Scheiben?|Zehen?|Prisen?|Tassen?|Bund|Packungen?|Dosen?|Flaschen?)?/gi

  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false })
    }

    const amount = parseFloat(match[1].replace(',', '.'))
    const unit = match[2] || ''
    const scaled = amount * factor
    const formatted = scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1)

    parts.push({ text: formatted + (unit ? ' ' + unit : ''), bold: true })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false })
  }

  return parts.length > 0 ? parts : [{ text, bold: false }]
}

function TimerButton({ minutes, onStart }) {
  return (
    <button
      onClick={() => onStart(minutes)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', marginTop: '6px',
        background: 'var(--color-accent-soft)',
        border: '0.5px solid var(--color-accent)',
        borderRadius: '20px', cursor: 'pointer',
        fontSize: '11px', color: 'var(--color-accent-text)',
        fontWeight: '500'
      }}
    >
      <Timer size={11} /> {minutes} Min Timer starten
    </button>
  )
}

function CountdownTimer({ minutes, onDone, onClose }) {
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (navigator.vibrate) navigator.vibrate([500, 200, 500])
            onDone?.()
            return 0
          }
          return r - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const progress = 1 - remaining / (minutes * 60)

  return (
    <div style={{
      position: 'fixed', bottom: '90px', left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--color-surface)',
      border: '0.5px solid var(--color-border)',
      borderRadius: '16px', padding: '14px 18px',
      zIndex: 50, minWidth: '200px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '10px'
      }}>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          Timer
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '16px'
        }}>×</button>
      </div>

      {/* Progress Ring */}
      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: '10px'
      }}>
        <div style={{position: 'relative', width: '80px', height: '80px'}}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none"
              stroke="var(--color-surface-2)" strokeWidth="6"/>
            <circle cx="40" cy="40" r="34" fill="none"
              stroke={remaining === 0 ? '#22c55e' : '#c1522a'}
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - progress)}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{transition: 'stroke-dashoffset 1s linear'}}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '600',
            color: remaining === 0 ? '#22c55e' : 'var(--color-text)'
          }}>
            {remaining === 0 ? '✓' : mins + ':' + String(secs).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            padding: '7px 16px',
            background: 'var(--color-accent)', color: '#fff',
            border: 'none', borderRadius: '9px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '500',
            display: 'flex', alignItems: 'center', gap: '5px'
          }}
        >
          {running ? <Pause size={13} /> : <Play size={13} />}
          {running ? 'Pause' : 'Weiter'}
        </button>
        <button
          onClick={() => { setRemaining(minutes * 60); setRunning(true) }}
          style={{
            padding: '7px 12px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '9px', cursor: 'pointer',
            display: 'flex', alignItems: 'center'
          }}
        >
          <RotateCcw size={14} color="var(--color-text-muted)" />
        </button>
      </div>
    </div>
  )
}

export default function CookingMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipeDetails } = useRecipeStore()
  const { addCookHistory } = useCookHistoryStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [servings, setServings] = useState(null)
  const [done, setDone] = useState(false)
  const [activeTimer, setActiveTimer] = useState(null) // { minutes }

  const recipe = recipes.find(r => r.id === id)

  useEffect(() => {
    if (recipe && !recipe.recipe_steps) fetchRecipeDetails(id)
    if (recipe) setServings(recipe.servings || 2)
  }, [recipe?.id])

  if (!recipe) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', color: 'var(--color-text-muted)'
    }}>
      Lädt...
    </div>
  )

  const steps = recipe.recipe_steps || []
  const scaleFactor = servings && recipe.servings ? servings / recipe.servings : 1
  const step = steps[currentStep]
  const stepText = step?.description || step || ''
  const detectedMinutes = extractTime(stepText)
  const scaledParts = scaleTextAmounts(stepText, scaleFactor)

  const handleDone = async () => {
    setDone(true)
    if (household) {
      await addCookHistory(recipe.id, household.id, servings)
    }
  }

  if (done) return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', padding: '32px',
      background: 'var(--color-bg)'
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: '#f0fdf4', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px', fontSize: '36px'
      }}>
        🎉
      </div>
      <h2 style={{
        fontSize: '22px', fontWeight: '600',
        color: 'var(--color-text)', marginBottom: '8px',
        textAlign: 'center'
      }}>
        Guten Appetit!
      </h2>
      <p style={{
        fontSize: '14px', color: 'var(--color-text-muted)',
        marginBottom: '32px', textAlign: 'center'
      }}>
        {recipe.name} für {servings} Personen
      </p>
      <button onClick={() => navigate(-1)} style={{
        padding: '13px 32px',
        background: 'var(--color-accent)', color: '#fff',
        border: 'none', borderRadius: '12px',
        cursor: 'pointer', fontSize: '15px', fontWeight: '500'
      }}>
        Fertig
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
      paddingBottom: '80px'
    }}>

      {/* Header */}
      <div style={{
        padding: '16px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '0.5px solid var(--color-border)'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center'
        }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{
            fontSize: '15px', fontWeight: '600',
            color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {recipe.name}
          </div>
          <div style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
            Schritt {currentStep + 1} von {steps.length}
          </div>
        </div>

        {/* Portionen */}
        <div style={{display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0}}>
          <button
            onClick={() => setServings(s => Math.max(1, s - 1))}
            style={{
              width: '26px', height: '26px', borderRadius: '7px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Minus size={12} color="var(--color-text)" />
          </button>
          <span style={{
            fontSize: '13px', fontWeight: '600',
            color: 'var(--color-text)', minWidth: '40px', textAlign: 'center'
          }}>
            {servings} P.
          </span>
          <button
            onClick={() => setServings(s => s + 1)}
            style={{
              width: '26px', height: '26px', borderRadius: '7px',
              background: 'var(--color-surface-2)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Plus size={12} color="var(--color-text)" />
          </button>
        </div>
      </div>

      {/* Fortschrittsbalken */}
      <div style={{height: '3px', background: 'var(--color-surface-2)'}}>
        <div style={{
          height: '100%',
          width: ((currentStep + 1) / steps.length * 100) + '%',
          background: 'var(--color-accent)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Schrittübersicht */}
      <div style={{
        display: 'flex', gap: '5px', padding: '12px 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '0.5px solid var(--color-border)'
      }}>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: 'none', cursor: 'pointer', flexShrink: 0,
              fontSize: '11px', fontWeight: '600',
              background: i === currentStep
                ? 'var(--color-accent)'
                : i < currentStep
                  ? '#22c55e'
                  : 'var(--color-surface-2)',
              color: i <= currentStep ? '#fff' : 'var(--color-text-muted)',
              transition: 'all 0.15s'
            }}
          >
            {i < currentStep ? '✓' : i + 1}
          </button>
        ))}
      </div>

      {/* Zutaten für diesen Schritt (wenn Schritt 0) */}
      {currentStep === 0 && recipe.ingredients?.length > 0 && (
        <div style={{
          margin: '14px 16px 0',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px', overflow: 'hidden'
        }}>
          <div style={{
            padding: '9px 13px',
            borderBottom: '0.5px solid var(--color-border)',
            fontSize: '11px', fontWeight: '500',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            Zutaten für {servings} Portionen
          </div>
          {recipe.ingredients.map((ing, i) => {
            const scaled = ing.amount ? (Number(ing.amount) * scaleFactor) : null
            const formatted = scaled
              ? (scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1))
              : null
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '9px 13px',
                borderTop: i > 0 ? '0.5px solid var(--color-border)' : 'none'
              }}>
                <span style={{fontSize: '13px', color: 'var(--color-text)'}}>
                  {ing.name}
                </span>
                {(formatted || ing.unit) && (
                  <span style={{
                    fontSize: '13px', fontWeight: '600',
                    color: scaleFactor !== 1 ? 'var(--color-accent)' : 'var(--color-text-muted)'
                  }}>
                    {formatted}{ing.unit ? ' ' + ing.unit : ''}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Aktueller Schritt */}
      <div style={{flex: 1, padding: '16px'}}>
        <div style={{
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '14px', padding: '20px',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '11px', fontWeight: '500',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '12px'
          }}>
            Schritt {currentStep + 1}
          </div>

          <p style={{
            fontSize: '17px', color: 'var(--color-text)',
            lineHeight: '1.7', margin: 0
          }}>
            {scaledParts.map((part, i) => (
              <span
                key={i}
                style={{
                  fontWeight: part.bold ? '700' : '400',
                  color: part.bold && scaleFactor !== 1
                    ? 'var(--color-accent)'
                    : 'var(--color-text)'
                }}
              >
                {part.text}
              </span>
            ))}
          </p>

          {/* Timer-Button wenn Zeitangabe erkannt */}
          {detectedMinutes && (
            <TimerButton
              minutes={detectedMinutes}
              onStart={(mins) => setActiveTimer({ minutes: mins })}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{display: 'flex', gap: '10px'}}>
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(s => s - 1)}
              style={{
                flex: 1, padding: '14px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '12px', cursor: 'pointer',
                fontSize: '14px', color: 'var(--color-text-muted)'
              }}
            >
              ← Zurück
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(s => s + 1)}
              style={{
                flex: 2, padding: '14px',
                background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: '12px',
                cursor: 'pointer', fontSize: '14px', fontWeight: '500'
              }}
            >
              Nächster Schritt →
            </button>
          ) : (
            <button
              onClick={handleDone}
              style={{
                flex: 2, padding: '14px',
                background: '#22c55e', color: '#fff',
                border: 'none', borderRadius: '12px',
                cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px'
              }}
            >
              <Check size={18} /> Fertig gekocht!
            </button>
          )}
        </div>
      </div>

      {/* Timer Overlay */}
      {activeTimer && (
        <CountdownTimer
          minutes={activeTimer.minutes}
          onDone={() => {}}
          onClose={() => setActiveTimer(null)}
        />
      )}
    </div>
  )
}