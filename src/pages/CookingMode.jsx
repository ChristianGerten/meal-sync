import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCookHistoryStore } from '../store/useCookHistoryStore'
import { ArrowLeft, ArrowRight, Check, X, Timer, Play, Pause, RotateCcw } from 'lucide-react'

const TIMER_PRESETS = [5, 10, 15, 20, 30]

function TimerWidget() {
  const [seconds, setSeconds] = useState(0)
  const [inputMinutes, setInputMinutes] = useState('')
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            setFinished(true)
            if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300])
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const start = (mins) => {
    clearInterval(intervalRef.current)
    setSeconds(mins * 60)
    setRunning(true)
    setFinished(false)
  }

  const handleCustomStart = () => {
    const mins = parseInt(inputMinutes)
    if (mins > 0) { start(mins); setInputMinutes('') }
  }

  const toggle = () => {
    if (finished) { setFinished(false); setSeconds(0); return }
    setRunning(r => !r)
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setFinished(false)
    setSeconds(0)
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const isActive = seconds > 0 || running || finished

  return (
    <div style={{
      background: finished ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
      borderRadius: '16px', padding: '16px',
      border: finished
        ? '1.5px solid var(--color-accent)'
        : '0.5px solid var(--color-border)',
      transition: 'all 0.3s'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '6px', marginBottom: '12px'
      }}>
        <Timer size={14} color="var(--color-accent)" />
        <span style={{
          fontSize: '11px', fontWeight: '600',
          color: 'var(--color-accent)',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          Timer
        </span>
        {finished && (
          <span style={{
            marginLeft: 'auto', fontSize: '12px',
            fontWeight: '600', color: 'var(--color-accent)'
          }}>
            ✓ Fertig!
          </span>
        )}
      </div>

      {!isActive && (
        <>
          <div style={{
            display: 'flex', gap: '5px',
            marginBottom: '10px', flexWrap: 'wrap'
          }}>
            {TIMER_PRESETS.map(min => (
              <button key={min} onClick={() => start(min)} style={{
                padding: '5px 10px', borderRadius: '20px',
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                cursor: 'pointer', fontSize: '12px',
                color: 'var(--color-text-muted)', fontWeight: '500'
              }}>
                {min} min
              </button>
            ))}
          </div>
          <div style={{display: 'flex', gap: '6px', marginBottom: '12px'}}>
            <input
              type="number" value={inputMinutes}
              onChange={e => setInputMinutes(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomStart()}
              placeholder="Eigene Zeit (min)" min="1" max="999"
              style={{
                flex: 1, padding: '8px 12px',
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '13px',
                color: 'var(--color-text)', outline: 'none'
              }}
            />
            <button onClick={handleCustomStart} style={{
              padding: '8px 14px',
              background: 'var(--color-accent)', color: '#fff',
              border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500'
            }}>
              Start
            </button>
          </div>
        </>
      )}

      {isActive && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: '36px', fontWeight: '700',
            letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums',
            color: finished ? 'var(--color-accent)' : 'var(--color-text)'
          }}>
            {finished ? '00:00' : display}
          </span>
          <div style={{display: 'flex', gap: '6px'}}>
            <button onClick={toggle} style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'var(--color-accent)', color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {finished
                ? <Check size={18} />
                : running ? <Pause size={16} /> : <Play size={16} />
              }
            </button>
            <button onClick={reset} style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)'
            }}>
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      )}

      {isActive && !finished && (
        <div style={{marginTop: '10px'}}>
          <div style={{
            height: '3px', background: 'var(--color-surface)',
            borderRadius: '2px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: 'var(--color-accent)',
              borderRadius: '2px',
              width: `${100 - (seconds / (Math.ceil(seconds / 60) * 60)) * 100}%`,
              transition: 'width 1s linear'
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function CookingMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { recipes } = useRecipeStore()
  const { household } = useAuthStore()
  const { addEntry } = useCookHistoryStore()
  const recipe = recipes.find(r => r.id === id)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [done, setDone] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [cookNotes, setCookNotes] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let wakeLock = null
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(wl => { wakeLock = wl })
        .catch(() => {})
    }
    return () => { if (wakeLock) wakeLock.release() }
  }, [])

  if (!recipe) return (
    <div style={{
      padding: '32px', textAlign: 'center',
      color: 'var(--color-text-muted)'
    }}>
      Rezept nicht gefunden
    </div>
  )

  const steps = [...(recipe.recipe_steps || [])]
    .sort((a, b) => a.step_number - b.step_number)

  if (!steps.length) return (
    <div style={{
      padding: '32px', textAlign: 'center',
      background: 'var(--color-bg)', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{fontSize: '48px', marginBottom: '12px'}}>📝</div>
      <p style={{color: 'var(--color-text-muted)', marginBottom: '16px'}}>
        Keine Zubereitungsschritte vorhanden
      </p>
      <button onClick={() => navigate(`/recipes/${id}`)} style={{
        padding: '10px 20px', background: 'var(--color-accent)',
        color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer'
      }}>
        Schritte hinzufügen
      </button>
    </div>
  )

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  const markComplete = async () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    if (isLast) {
      setDone(true)
      if (household && !saved) {
        setSaved(true)
        await addEntry(
          household.id,
          recipe.id,
          recipe.name,
          recipe.servings || 2
        )
      }
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  if (done) return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      flexDirection: 'column', background: 'var(--color-bg)'
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px', textAlign: 'center'
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--color-accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <Check size={40} color="var(--color-accent)" />
        </div>
        <h2 style={{
          fontSize: '24px', fontWeight: '700',
          color: 'var(--color-text)', marginBottom: '6px'
        }}>
          Guten Appetit! 🍽️
        </h2>
        <p style={{
          fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '4px'
        }}>
          {recipe.name}
        </p>
        <p style={{
          fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px'
        }}>
          {steps.length} Schritte · automatisch gespeichert
        </p>

        {/* Notizen */}
        <div style={{width: '100%', maxWidth: '340px', marginBottom: '24px'}}>
          <textarea
            value={cookNotes}
            onChange={e => setCookNotes(e.target.value)}
            placeholder="Notiz zum Gericht (optional)..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', fontSize: '14px',
              color: 'var(--color-text)', outline: 'none',
              resize: 'none', boxSizing: 'border-box', lineHeight: '1.5'
            }}
          />
        </div>

        <div style={{
          display: 'flex', gap: '10px',
          width: '100%', maxWidth: '340px'
        }}>
          <button onClick={() => navigate('/planner')} style={{
            flex: 1, padding: '13px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '12px', cursor: 'pointer',
            fontSize: '14px', color: 'var(--color-text-muted)'
          }}>
            Zum Planer
          </button>
          <button onClick={() => navigate('/recipes')} style={{
            flex: 1, padding: '13px',
            background: 'var(--color-accent)', color: '#fff',
            border: 'none', borderRadius: '12px',
            cursor: 'pointer', fontSize: '14px', fontWeight: '500'
          }}>
            Zu Rezepten
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      flexDirection: 'column', background: 'var(--color-bg)'
    }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center'
        }}>
          <X size={20} />
        </button>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{
            fontSize: '13px', fontWeight: '600', color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {recipe.name}
          </div>
          <div style={{
            fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px'
          }}>
            Schritt {currentStep + 1} von {steps.length}
          </div>
        </div>
        <button onClick={() => setShowTimer(t => !t)} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 10px', borderRadius: '10px',
          background: showTimer ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
          border: '0.5px solid var(--color-border)',
          cursor: 'pointer', fontSize: '12px',
          color: showTimer ? 'var(--color-accent)' : 'var(--color-text-muted)'
        }}>
          <Timer size={14} /> Timer
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{height: '3px', background: 'var(--color-surface-2)'}}>
        <div style={{
          height: '100%', background: 'var(--color-accent)',
          width: `${progress}%`, transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }}>

        {showTimer && <TimerWidget />}

        {/* Zutaten (nur Schritt 1) */}
        {currentStep === 0 && recipe.ingredients?.length > 0 && (
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '14px',
            border: '0.5px solid var(--color-border)',
            padding: '12px'
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '600',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Zutaten für {recipe.servings} Portionen
            </div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
              {recipe.ingredients.map((ing, i) => (
                <span key={i} style={{
                  fontSize: '12px', padding: '3px 8px',
                  background: 'var(--color-surface-2)',
                  borderRadius: '20px', color: 'var(--color-text-muted)',
                  border: '0.5px solid var(--color-border)'
                }}>
                  {ing.amount && `${ing.amount} `}
                  {ing.unit && `${ing.unit} `}
                  {ing.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Schritt-Übersicht */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '14px',
          border: '0.5px solid var(--color-border)',
          overflow: 'hidden'
        }}>
          {steps.map((s, i) => (
            <div
              key={i}
              onClick={() => setCurrentStep(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px',
                background: i === currentStep ? 'var(--color-accent-soft)' : 'transparent',
                borderTop: i > 0 ? '0.5px solid var(--color-border)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: completedSteps.has(i)
                  ? 'var(--color-accent)'
                  : i === currentStep
                    ? 'var(--color-accent)'
                    : 'var(--color-surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {completedSteps.has(i)
                  ? <Check size={12} color="#fff" strokeWidth={3} />
                  : <span style={{
                      fontSize: '11px', fontWeight: '600',
                      color: i === currentStep ? '#fff' : 'var(--color-text-muted)'
                    }}>
                      {i + 1}
                    </span>
                }
              </div>
              <span style={{
                fontSize: '12px',
                color: completedSteps.has(i)
                  ? 'var(--color-text-muted)'
                  : 'var(--color-text)',
                textDecoration: completedSteps.has(i) ? 'line-through' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1, fontWeight: i === currentStep ? '500' : '400'
              }}>
                {s.description}
              </span>
            </div>
          ))}
        </div>

        {/* Aktueller Schritt groß */}
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: '16px',
          border: '0.5px solid var(--color-border)',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--color-accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700', flexShrink: 0
            }}>
              {currentStep + 1}
            </div>
            <span style={{
              fontSize: '11px', fontWeight: '600',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              Aktueller Schritt
            </span>
          </div>
          <p style={{
            fontSize: '17px', lineHeight: '1.6',
            color: 'var(--color-text)', fontWeight: '400'
          }}>
            {step.description}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        padding: '16px 16px 32px', display: 'flex', gap: '10px',
        background: 'var(--color-surface)',
        borderTop: '0.5px solid var(--color-border)'
      }}>
        {currentStep > 0 && (
          <button onClick={() => setCurrentStep(s => s - 1)} style={{
            flex: 1, padding: '14px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '14px', cursor: 'pointer',
            fontSize: '14px', color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            <ArrowLeft size={16} /> Zurück
          </button>
        )}
        <button onClick={markComplete} style={{
          flex: 2, padding: '14px',
          background: 'var(--color-accent)', color: '#fff',
          border: 'none', borderRadius: '14px', cursor: 'pointer',
          fontSize: '15px', fontWeight: '600',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          {isLast
            ? <><Check size={18} /> Fertig!</>
            : <>Schritt erledigt <ArrowRight size={16} /></>
          }
        </button>
      </div>
    </div>
  )
}