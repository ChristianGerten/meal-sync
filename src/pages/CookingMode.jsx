import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import { useCookHistoryStore } from '../store/useCookHistoryStore'
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Timer, X, Users } from 'lucide-react'
import { toast } from '../components/Toast'

// Erkennt Zeitangaben im Text: "10 Minuten", "2 Min", "1 Stunde", "30 Sek"
const extractTimers = (text) => {
  const timers = []
  const patterns = [
    { regex: /(\d+)\s*(?:Stunden?|h)\s*(?:und\s*)?(\d+)\s*(?:Minuten?|Min\.?|min)/gi, fn: (m) => parseInt(m[1]) * 3600 + parseInt(m[2]) * 60, label: (m) => m[1] + 'h ' + m[2] + 'min' },
    { regex: /(\d+)\s*(?:Stunden?|h)/gi, fn: (m) => parseInt(m[1]) * 3600, label: (m) => m[1] + ' Std' },
    { regex: /(\d+)\s*(?:Minuten?|Min\.?|min)/gi, fn: (m) => parseInt(m[1]) * 60, label: (m) => m[1] + ' Min' },
    { regex: /(\d+)\s*(?:Sekunden?|Sek\.?|sec)/gi, fn: (m) => parseInt(m[1]), label: (m) => m[1] + ' Sek' },
  ]

  for (const { regex, fn, label } of patterns) {
    let match
    regex.lastIndex = 0
    while ((match = regex.exec(text)) !== null) {
      const seconds = fn(match)
      if (seconds > 0 && seconds <= 7200) {
        timers.push({ seconds, label: label(match), startIdx: match.index })
      }
    }
  }

  // Deduplizieren
  return timers.filter((t, i, arr) =>
    arr.findIndex(x => Math.abs(x.startIdx - t.startIdx) < 5) === i
  )
}

// Hebt Zeitangaben im Text hervor
const HighlightedText = ({ text, onTimerClick, activeTimerIdx }) => {
  const parts = []
  const regex = /(\d+\s*(?:Stunden?|h(?:\s+und\s+\d+\s*(?:Minuten?|Min\.?))?|Minuten?|Min\.?|min|Sekunden?|Sek\.?|sec))/gi
  let last = 0
  let timerCount = 0
  let match

  regex.lastIndex = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', content: text.slice(last, match.index) })
    }
    const idx = timerCount
    parts.push({ type: 'timer', content: match[0], idx })
    timerCount++
    last = match.index + match[0].length
  }
  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) })
  }

  return (
    <span>
      {parts.map((part, i) =>
        part.type === 'text' ? (
          <span key={i}>{part.content}</span>
        ) : (
          <button
            key={i}
            onClick={() => onTimerClick(part.idx)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: '1px 7px', borderRadius: '20px',
              background: activeTimerIdx === part.idx
                ? 'var(--color-accent)'
                : 'var(--color-accent-soft)',
              color: activeTimerIdx === part.idx
                ? '#fff'
                : 'var(--color-accent-text)',
              border: 'none', cursor: 'pointer',
              fontSize: 'inherit', fontWeight: '500',
              margin: '0 1px', transition: 'all 0.15s'
            }}
          >
            <Timer size={11} />
            {part.content}
          </button>
        )
      )}
    </span>
  )
}

export default function CookingMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipeDetails } = useRecipeStore()
  const { addEntry: addHistory } = useCookHistoryStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [servings, setServings] = useState(null)
  const [completed, setCompleted] = useState(false)

  // Timer States
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerLabel, setTimerLabel] = useState('')
  const [activeTimerIdx, setActiveTimerIdx] = useState(null)
  const timerRef = useRef(null)

  const recipe = recipes.find(r => r.id === id)
  const steps = recipe?.recipe_steps?.sort((a, b) => a.step_number - b.step_number) || []

  useEffect(() => {
    if (id) fetchRecipeDetails(id)
  }, [id])

  useEffect(() => {
    if (recipe && servings === null) {
      setServings(recipe.servings || 2)
    }
  }, [recipe?.id])

  // Timer Logik
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false)
            clearInterval(timerRef.current)
            // Vibration wenn fertig
            if (navigator.vibrate) navigator.vibrate([300, 100, 300])
            toast.success('Timer abgelaufen: ' + timerLabel)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  const startTimer = (seconds, label) => {
    clearInterval(timerRef.current)
    setTimerSeconds(seconds)
    setTimerLabel(label)
    setTimerRunning(true)
  }

  const handleTimerClick = (stepText, timerIdx) => {
    const timers = extractTimers(stepText)
    if (timers[timerIdx]) {
      const t = timers[timerIdx]
      setActiveTimerIdx(timerIdx)
      startTimer(t.seconds, t.label)
      toast.info('Timer gestartet: ' + t.label)
    }
  }

  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
  }

  const scaleAmount = (amount) => {
    if (!amount || !recipe?.servings || servings === null) return amount
    const factor = servings / recipe.servings
    const scaled = amount * factor
    return scaled % 1 === 0 ? scaled : Math.round(scaled * 10) / 10
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1)
      setActiveTimerIdx(null)
    } else {
      handleFinish()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1)
      setActiveTimerIdx(null)
    }
  }

  const handleFinish = async () => {
    setCompleted(true)
    if (household && recipe) {
      await addHistory(recipe.id, recipe.name, household.id, servings)
    }
  }

  if (!recipe || servings === null) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '80vh', color: 'var(--color-text-muted)'
    }}>
      Lädt...
    </div>
  )

  if (completed) return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', padding: '32px', textAlign: 'center'
    }}>
      <div style={{fontSize: '56px', marginBottom: '16px'}}>🎉</div>
      <h2 style={{
        fontSize: '22px', fontWeight: '600',
        color: 'var(--color-text)', marginBottom: '8px'
      }}>
        Guten Appetit!
      </h2>
      <p style={{
        fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '32px'
      }}>
        {recipe.name} für {servings} Personen
      </p>
      <button
        onClick={() => navigate('/recipes')}
        style={{
          padding: '13px 32px',
          background: 'var(--color-accent)', color: '#fff',
          border: 'none', borderRadius: '12px', cursor: 'pointer',
          fontSize: '15px', fontWeight: '500'
        }}
      >
        Zurück zu Rezepten
      </button>
    </div>
  )

  const currentStepData = steps[currentStep]
  const stepTimers = currentStepData ? extractTimers(currentStepData.description) : []
  const progress = steps.length > 0 ? ((currentStep) / steps.length) * 100 : 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100dvh', background: 'var(--color-bg)'
    }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '0.5px solid var(--color-border)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '14px'
        }}>
          <X size={18} /> Beenden
        </button>
        <div style={{fontSize: '13px', fontWeight: '500', color: 'var(--color-text)'}}>
          {currentStep + 1} / {steps.length}
        </div>
        {/* Portionen */}
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <button onClick={() => setServings(s => Math.max(1, s - 1))} style={{
            width: '26px', height: '26px', borderRadius: '7px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: 'var(--color-text)'
          }}>−</button>
          <span style={{fontSize: '13px', fontWeight: '500', color: 'var(--color-text)'}}>
            {servings}P
          </span>
          <button onClick={() => setServings(s => s + 1)} style={{
            width: '26px', height: '26px', borderRadius: '7px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: 'var(--color-text)'
          }}>+</button>
        </div>
      </div>

      {/* Fortschrittsbalken */}
      <div style={{height: '3px', background: 'var(--color-surface-2)'}}>
        <div style={{
          height: '100%', background: 'var(--color-accent)',
          width: progress + '%', transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Rezeptname */}
      <div style={{
        padding: '14px 16px 0',
        fontSize: '13px', color: 'var(--color-text-muted)'
      }}>
        {recipe.name}
        {recipe.cook_time && (
          <span style={{marginLeft: '8px', color: 'var(--color-accent)'}}>
            · {recipe.cook_time} Min
          </span>
        )}
      </div>

      {/* Aktueller Schritt */}
      <div style={{flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px'}}>

        {currentStepData && (
          <div style={{
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '16px', padding: '18px',
            flex: 1
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
              fontSize: '17px', lineHeight: '1.7',
              color: 'var(--color-text)', margin: 0
            }}>
              <HighlightedText
                text={currentStepData.description}
                onTimerClick={(idx) => handleTimerClick(currentStepData.description, idx)}
                activeTimerIdx={activeTimerIdx}
              />
            </p>

            {/* Zutaten dieses Schritts — optional */}
            {recipe.ingredients?.length > 0 && (
              <div style={{marginTop: '16px', paddingTop: '14px', borderTop: '0.5px solid var(--color-border)'}}>
                <div style={{
                  fontSize: '10px', fontWeight: '500',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  Zutaten ({servings} Portionen)
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} style={{
                      padding: '4px 10px',
                      background: 'var(--color-surface-2)',
                      borderRadius: '20px', fontSize: '12px',
                      color: 'var(--color-text)'
                    }}>
                      {scaleAmount(ing.amount)
                        ? <strong style={{color: 'var(--color-accent)'}}>
                            {scaleAmount(ing.amount)}{ing.unit ? ' ' + ing.unit : ''}
                          </strong>
                        : null
                      }
                      {scaleAmount(ing.amount) ? ' ' : ''}{ing.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timer */}
        {(timerSeconds > 0 || timerRunning) && (
          <div style={{
            background: timerSeconds === 0 ? '#EAF3DE' : 'var(--color-surface)',
            border: '0.5px solid ' + (timerSeconds === 0 ? '#27500A' : 'var(--color-accent)'),
            borderRadius: '14px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{flex: 1}}>
              <div style={{
                fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '2px'
              }}>
                {timerLabel}
              </div>
              <div style={{
                fontSize: '28px', fontWeight: '600',
                color: timerSeconds === 0 ? '#27500A' : 'var(--color-accent)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatTime(timerSeconds)}
              </div>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
              <button
                onClick={() => setTimerRunning(r => !r)}
                style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {timerRunning ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={() => {
                  setTimerSeconds(0)
                  setTimerRunning(false)
                  setActiveTimerIdx(null)
                  clearInterval(timerRef.current)
                }}
                style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'var(--color-surface-2)',
                  border: '0.5px solid var(--color-border)',
                  cursor: 'pointer', color: 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Navigation */}
      <div style={{
        padding: '14px 16px',
        borderTop: '0.5px solid var(--color-border)',
        display: 'flex', gap: '10px',
        position: 'sticky', bottom: 0,
        background: 'var(--color-bg)'
      }}>
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          style={{
            width: '48px', height: '52px', borderRadius: '12px',
            background: 'var(--color-surface-2)',
            border: '0.5px solid var(--color-border)',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: currentStep === 0 ? 'var(--color-border)' : 'var(--color-text)',
            opacity: currentStep === 0 ? 0.4 : 1,
            flexShrink: 0
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={handleNext}
          style={{
            flex: 1, height: '52px', borderRadius: '12px',
            background: currentStep === steps.length - 1
              ? '#22c55e'
              : 'var(--color-accent)',
            color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: '15px', fontWeight: '500',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px',
            transition: 'background 0.2s'
          }}
        >
          {currentStep === steps.length - 1 ? (
            <>🎉 Fertig!</>
          ) : (
            <>Weiter <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  )
}