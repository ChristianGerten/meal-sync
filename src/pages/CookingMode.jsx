import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'

export default function CookingMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { recipes } = useRecipeStore()
  const recipe = recipes.find(r => r.id === id)
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)

  // Bildschirm an lassen
  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').catch(() => {})
    }
  }, [])

  if (!recipe) return (
    <div style={{padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)'}}>
      Rezept nicht gefunden
    </div>
  )

  const steps = [...(recipe.recipe_steps || [])]
    .sort((a, b) => a.step_number - b.step_number)

  if (!steps.length) return (
    <div style={{padding: '32px', textAlign: 'center'}}>
      <div style={{fontSize: '48px', marginBottom: '12px'}}>📝</div>
      <p style={{color: 'var(--color-text-muted)', marginBottom: '16px'}}>
        Keine Zubereitungsschritte vorhanden
      </p>
      <button onClick={() => navigate(`/recipes/${id}`)} style={{
        padding: '10px 20px', background: '#6c63ff', color: '#fff',
        border: 'none', borderRadius: '10px', cursor: 'pointer'
      }}>
        Schritte hinzufügen
      </button>
    </div>
  )

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  if (done) return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px',
      background: 'var(--color-bg)', textAlign: 'center'
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'var(--color-accent-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <Check size={40} color="#6c63ff" />
      </div>
      <h2 style={{fontSize: '22px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px'}}>
        Guten Appetit! 🍽️
      </h2>
      <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '32px'}}>
        {recipe.name} ist fertig
      </p>
      <button onClick={() => navigate('/recipes')} style={{
        padding: '13px 28px', background: '#6c63ff', color: '#fff',
        border: 'none', borderRadius: '12px', cursor: 'pointer',
        fontSize: '15px', fontWeight: '500'
      }}>
        Zurück zu Rezepten
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--color-bg)'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--color-surface)',
        borderBottom: '0.5px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)'
        }}>
          <X size={20} />
        </button>
        <div style={{flex: 1}}>
          <div style={{
            fontSize: '13px', fontWeight: '500',
            color: 'var(--color-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {recipe.name}
          </div>
          <div style={{fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px'}}>
            Schritt {currentStep + 1} von {steps.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{height: '3px', background: 'var(--color-surface-2)'}}>
        <div style={{
          height: '100%', background: '#6c63ff',
          width: `${progress}%`, transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Zutaten Reminder (nur Schritt 1) */}
      {currentStep === 0 && recipe.ingredients?.length > 0 && (
        <div style={{
          margin: '16px', padding: '12px',
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '0.5px solid var(--color-border)'
        }}>
          <div style={{
            fontSize: '11px', fontWeight: '500', color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'
          }}>
            Zutaten für {recipe.servings} Portionen
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>
            {recipe.ingredients.map((ing, i) => (
              <span key={i} style={{
                fontSize: '12px', padding: '3px 8px',
                background: 'var(--color-surface-2)',
                borderRadius: '20px', color: 'var(--color-text-muted)'
              }}>
                {ing.amount && `${ing.amount} `}{ing.unit && `${ing.unit} `}{ing.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Schritt Inhalt */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 24px'
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: '#6c63ff', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: '500', marginBottom: '24px'
        }}>
          {currentStep + 1}
        </div>

        <p style={{
          fontSize: '18px', lineHeight: '1.6',
          color: 'var(--color-text)', textAlign: 'center',
          maxWidth: '360px'
        }}>
          {step.description}
        </p>
      </div>

      {/* Navigation */}
      <div style={{
        padding: '20px 24px 32px',
        display: 'flex', gap: '12px'
      }}>
        {currentStep > 0 && (
          <button onClick={() => setCurrentStep(s => s - 1)} style={{
            flex: 1, padding: '14px',
            background: 'var(--color-surface)',
            border: '0.5px solid var(--color-border)',
            borderRadius: '14px', cursor: 'pointer',
            fontSize: '14px', color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            <ArrowLeft size={16} /> Zurück
          </button>
        )}
        <button onClick={() => {
          if (isLast) setDone(true)
          else setCurrentStep(s => s + 1)
        }} style={{
          flex: 2, padding: '14px',
          background: '#6c63ff', color: '#fff',
          border: 'none', borderRadius: '14px', cursor: 'pointer',
          fontSize: '15px', fontWeight: '500',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          {isLast ? (
            <><Check size={18} /> Fertig!</>
          ) : (
            <>Weiter <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  )
}