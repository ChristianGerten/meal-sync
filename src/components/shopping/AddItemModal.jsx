import { useState } from 'react'
import { X, Check } from 'lucide-react'
import {
  SUGGESTIONS_SUPERMARKET, SUGGESTIONS_DRUGSTORE,
  SUPERMARKET_CATS, DRUGSTORE_CATS, UNITS, guessCategory
} from '../../data/shoppingData'

export default function AddItemModal({ onClose, onAdd, activeStore }) {
  const [newItem, setNewItem] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [added, setAdded] = useState([]) // Zuletzt hinzugefügt

  const accentColor = activeStore === 'drugstore' ? '#5F5E5A' : '#c1522a'

  const computeSuggestions = (value) => {
    if (!value.trim() || value.length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const lower = value.toLowerCase()
    const base = activeStore === 'drugstore'
      ? SUGGESTIONS_DRUGSTORE
      : SUGGESTIONS_SUPERMARKET
    const filtered = base
      .filter(s => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower)
      .slice(0, 7)
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
  }

  const handleSelectSuggestion = (suggestion) => {
    setNewItem(suggestion)
    setNewCategory(guessCategory(suggestion, activeStore))
    setShowSuggestions(false)
  }

  const handleAdd = async () => {
    if (!newItem.trim()) return
    const category = newCategory || guessCategory(newItem, activeStore)
    await onAdd(
      newItem.trim(),
      newAmount ? parseFloat(newAmount) : null,
      newUnit || null,
      category
    )
    setAdded(prev => [...prev.slice(-2), newItem.trim()])
    setNewItem('')
    setNewAmount('')
    setNewUnit('')
    setNewCategory('')
    setSuggestions([])
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 200,
      display: 'flex', alignItems: 'flex-end'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px 20px 0 0',
        width: '100%'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '0.5px solid var(--color-border)'
        }}>
          <span style={{
            fontSize: '16px', fontWeight: '600',
            color: 'var(--color-text)'
          }}>
            {activeStore === 'drugstore' ? 'Drogerie' : 'Supermarkt'} — Artikel hinzufügen
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--color-text-muted)'
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{padding: '14px 16px'}}>

          {/* Zuletzt hinzugefügt */}
          {added.length > 0 && (
            <div style={{
              display: 'flex', gap: '6px', flexWrap: 'wrap',
              marginBottom: '10px'
            }}>
              {added.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '3px 10px',
                  background: '#f0fdf4',
                  border: '0.5px solid #bbf7d0',
                  borderRadius: '20px',
                  fontSize: '12px', color: '#166534'
                }}>
                  <Check size={10} />
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* Name + Autocomplete */}
          <div style={{position: 'relative', marginBottom: '10px'}}>
            <input
              value={newItem}
              onChange={e => {
                setNewItem(e.target.value)
                computeSuggestions(e.target.value)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && newItem.trim()) handleAdd()
                if (e.key === 'Escape') setShowSuggestions(false)
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Artikel tippen... (Enter = Hinzufügen)"
              autoFocus
              style={{
                width: '100%', padding: '13px 14px',
                background: 'var(--color-surface-2)',
                border: '1px solid ' + (newItem ? accentColor : 'var(--color-border)'),
                borderRadius: showSuggestions ? '12px 12px 0 0' : '12px',
                fontSize: '16px', color: 'var(--color-text)',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
            />
            {showSuggestions && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                zIndex: 50, background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderTop: 'none', borderRadius: '0 0 12px 12px',
                overflow: 'hidden', maxHeight: '220px', overflowY: 'auto'
              }}>
                {suggestions.map((s, idx) => {
                  const lower = newItem.toLowerCase()
                  const matchIdx = s.toLowerCase().indexOf(lower)
                  return (
                    <button
                      key={s}
                      onMouseDown={() => handleSelectSuggestion(s)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '12px 14px', background: 'none', border: 'none',
                        borderTop: idx > 0
                          ? '0.5px solid var(--color-border)'
                          : 'none',
                        cursor: 'pointer', fontSize: '15px',
                        color: 'var(--color-text)',
                        display: 'flex', alignItems: 'center', gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: accentColor, flexShrink: 0, opacity: 0.5
                      }} />
                      <span>
                        {matchIdx >= 0 ? (
                          <>
                            {s.slice(0, matchIdx)}
                            <span style={{fontWeight: '600', color: accentColor}}>
                              {s.slice(matchIdx, matchIdx + newItem.length)}
                            </span>
                            {s.slice(matchIdx + newItem.length)}
                          </>
                        ) : s}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Menge + Einheit in einer Zeile */}
          <div style={{display: 'flex', gap: '8px', marginBottom: '10px'}}>
            <input
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              placeholder="Menge"
              type="number" min="0" step="0.1"
              style={{
                width: '90px', padding: '12px 10px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '15px',
                color: 'var(--color-text)', outline: 'none',
                textAlign: 'center', flexShrink: 0,
                boxSizing: 'border-box'
              }}
            />
            <select
              value={newUnit}
              onChange={e => setNewUnit(e.target.value)}
              style={{
                flex: 1, padding: '12px 8px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '14px',
                color: newUnit ? 'var(--color-text)' : 'var(--color-text-muted)',
                outline: 'none'
              }}
            >
              <option value="">Einheit (optional)</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{
                flex: 1, padding: '12px 8px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '10px', fontSize: '14px',
                color: newCategory ? 'var(--color-text)' : 'var(--color-text-muted)',
                outline: 'none'
              }}
            >
              <option value="">Kategorie</option>
              {(activeStore === 'drugstore' ? DRUGSTORE_CATS : SUPERMARKET_CATS).map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div style={{display: 'flex', gap: '8px'}}>
            <button
              onClick={handleAdd}
              disabled={!newItem.trim()}
              style={{
                flex: 1, padding: '14px',
                background: !newItem.trim()
                  ? 'var(--color-surface-2)' : accentColor,
                color: !newItem.trim() ? 'var(--color-text-muted)' : '#fff',
                border: 'none', borderRadius: '12px',
                cursor: !newItem.trim() ? 'not-allowed' : 'pointer',
                fontSize: '15px', fontWeight: '500',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px'
              }}
            >
              + Hinzufügen
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '14px 18px',
                background: 'var(--color-surface-2)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '12px', cursor: 'pointer',
                fontSize: '14px', color: 'var(--color-text-muted)',
                fontWeight: '500'
              }}
            >
              Fertig
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}