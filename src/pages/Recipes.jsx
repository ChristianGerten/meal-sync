import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import ImportModal from '../components/recipes/ImportModal'
import { Heart, Star, Search, Plus, SlidersHorizontal } from 'lucide-react'

const CATEGORIES = [
  'Alle', 'Favoriten', '⭐ Bewertet',
  'Pasta', 'Suppe', 'Salat', 'Fleisch', 'Fisch',
  'Vegetarisch', 'Vegan', 'Backen', 'Dessert', 'Frühstück', 'Snack'
]

function StarRating({ rating, onRate, size = 16 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{display: 'flex', gap: '2px'}}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); onRate(star) }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px',
            color: star <= (hover || rating || 0) ? '#f59e0b' : 'var(--color-border)',
            transition: 'color 0.1s'
          }}
        >
          <Star
            size={size}
            fill={star <= (hover || rating || 0) ? '#f59e0b' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

export default function Recipes() {
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipes, loading, toggleFavorite, setRating } = useRecipeStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Alle')
  const [sortBy, setSortBy] = useState('name')
  const [showImport, setShowImport] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (household) fetchRecipes(household.id)
  }, [household])

  const filtered = recipes
    .filter(r => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase()) ||
        r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))

      const matchCategory =
        activeCategory === 'Alle' ? true :
        activeCategory === 'Favoriten' ? r.is_favorite :
        activeCategory === '⭐ Bewertet' ? r.rating != null :
        r.category?.toLowerCase() === activeCategory.toLowerCase() ||
        r.tags?.some(t => t.toLowerCase() === activeCategory.toLowerCase())

      return matchSearch && matchCategory
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'favorites') return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0)
      return a.name.localeCompare(b.name)
    })

  const favCount = recipes.filter(r => r.is_favorite).length

  return (
    <div style={{padding: '16px', paddingBottom: '80px'}}>

      {/* Suchleiste */}
      <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px', padding: '0 12px'
        }}>
          <Search size={15} color="var(--color-text-muted)" />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rezepte suchen..."
            style={{
              flex: 1, padding: '10px 0',
              background: 'none', border: 'none',
              fontSize: '14px', color: 'var(--color-text)', outline: 'none'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '16px',
              color: 'var(--color-text-muted)'
            }}>×</button>
          )}
        </div>

        {/* Sortierung */}
        <div style={{position: 'relative'}}>
          <button onClick={() => setShowSort(s => !s)} style={{
            width: '42px', height: '42px',
            background: showSort ? 'var(--color-accent-soft)' : 'var(--color-surface)',
            border: showSort
              ? '0.5px solid var(--color-accent)'
              : '0.5px solid var(--color-border)',
            borderRadius: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: showSort ? 'var(--color-accent)' : 'var(--color-text-muted)'
          }}>
            <SlidersHorizontal size={17} />
          </button>
          {showSort && (
            <div style={{
              position: 'absolute', right: 0, top: '48px', zIndex: 50,
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '12px', overflow: 'hidden',
              minWidth: '160px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              {[
                { key: 'name', label: 'A–Z' },
                { key: 'rating', label: 'Beste Bewertung' },
                { key: 'favorites', label: 'Favoriten zuerst' }
              ].map((opt, idx) => (
                <button key={opt.key} onClick={() => { setSortBy(opt.key); setShowSort(false) }} style={{
                  width: '100%', padding: '11px 14px', textAlign: 'left',
                  background: sortBy === opt.key ? 'var(--color-accent-soft)' : 'none',
                  border: 'none', cursor: 'pointer', fontSize: '13px',
                  color: sortBy === opt.key ? 'var(--color-accent-text)' : 'var(--color-text)',
                  fontWeight: sortBy === opt.key ? '500' : '400',
                  borderBottom: idx < 2 ? '0.5px solid var(--color-border)' : 'none'
                }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowImport(true)} style={{
          width: '42px', height: '42px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '12px', cursor: 'pointer', fontSize: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          📥
        </button>

        <button onClick={() => navigate('/recipes/new')} style={{
          width: '42px', height: '42px',
          background: 'var(--color-accent)', border: 'none',
          borderRadius: '12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Plus size={20} color="#fff" />
        </button>
      </div>

      {/* Kategorie Filter */}
      <div style={{
        display: 'flex', gap: '6px', overflowX: 'auto',
        paddingBottom: '8px', marginBottom: '12px'
      }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '6px 12px', borderRadius: '20px',
            border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: '500',
            whiteSpace: 'nowrap', flexShrink: 0,
            background: activeCategory === cat ? 'var(--color-accent)' : 'var(--color-surface)',
            color: activeCategory === cat ? '#fff' : 'var(--color-text-muted)',
            transition: 'all 0.15s'
          }}>
            {cat === 'Favoriten' && favCount > 0 ? `Favoriten (${favCount})` : cat}
          </button>
        ))}
      </div>

      {/* Anzahl */}
      {!loading && (
        <div style={{
          fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px'
        }}>
          {filtered.length} {filtered.length === 1 ? 'Rezept' : 'Rezepte'}
        </div>
      )}

      {/* Rezept Grid */}
      {loading ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              borderRadius: '16px', overflow: 'hidden'
            }}>
              <div style={{
                aspectRatio: '4/3',
                background: 'var(--color-surface-2)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <div style={{padding: '10px'}}>
                <div style={{
                  height: '14px', background: 'var(--color-surface-2)',
                  borderRadius: '4px', marginBottom: '6px',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <div style={{
                  height: '10px', background: 'var(--color-surface-2)',
                  borderRadius: '4px', width: '60%',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              </div>
            </div>
          ))}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign: 'center', padding: '48px'}}>
          <div style={{fontSize: '48px', marginBottom: '12px'}}>👨‍🍳</div>
          <p style={{
            fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px'
          }}>
            {activeCategory === 'Favoriten' ? 'Noch keine Favoriten' : 'Keine Rezepte gefunden'}
          </p>
          <p style={{
            fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px'
          }}>
            {activeCategory === 'Favoriten'
              ? 'Tippe auf das Herz bei einem Rezept'
              : 'Füge dein erstes Rezept hinzu'}
          </p>
          {activeCategory !== 'Favoriten' && (
            <button onClick={() => setShowImport(true)} style={{
              padding: '10px 20px', background: 'var(--color-accent)',
              color: '#fff', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500'
            }}>
              📷 Rezept importieren
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
        }}>
          {filtered.map(recipe => (
            <div
              key={recipe.id}
              style={{
                background: 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                borderRadius: '16px', overflow: 'hidden',
                cursor: 'pointer', position: 'relative'
              }}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              {/* Bild */}
              <div style={{
                aspectRatio: '4/3',
                background: 'var(--color-surface-2)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '32px',
                overflow: 'hidden', position: 'relative'
              }}>
                {recipe.image_url
                  ? <img
                      src={recipe.image_url}
                      alt={recipe.name}
                      loading="lazy"
                      decoding="async"
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  : '🍽️'
                }

                {/* Favorit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(recipe.id, household.id)
                  }}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.3)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <Heart
                    size={15}
                    color={recipe.is_favorite ? '#ef4444' : '#fff'}
                    fill={recipe.is_favorite ? '#ef4444' : 'none'}
                    strokeWidth={2}
                  />
                </button>

                {/* Bewertung Badge */}
                {recipe.rating && (
                  <div style={{
                    position: 'absolute', bottom: '8px', left: '8px',
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '20px', padding: '2px 7px',
                    display: 'flex', alignItems: 'center', gap: '3px'
                  }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span style={{
                      fontSize: '11px', color: '#fff', fontWeight: '600'
                    }}>
                      {recipe.rating}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{padding: '10px'}}>
                <div style={{
                  fontWeight: '600', fontSize: '13px',
                  color: 'var(--color-text)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', lineHeight: '1.3', marginBottom: '6px'
                }}>
                  {recipe.name}
                </div>

                {/* Sterne */}
                <div onClick={e => e.stopPropagation()}>
                  <StarRating
                    rating={recipe.rating}
                    onRate={(star) => setRating(recipe.id, star, household.id)}
                    size={13}
                  />
                </div>

                {recipe.category && (
                  <div style={{
                    fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px'
                  }}>
                    {recipe.category}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showImport && (
        <ImportModal onClose={() => {
          setShowImport(false)
          if (household) fetchRecipes(household.id, true)
        }} />
      )}
    </div>
  )
}