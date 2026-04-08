import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipeStore } from '../store/useRecipeStore'
import { useAuthStore } from '../store/useAuthStore'
import ImportModal from '../components/recipes/ImportModal'
import { SkeletonRecipeCard, SkeletonStyles } from '../components/Skeleton'
import { Heart, Star, Search, Plus, SlidersHorizontal, Leaf, Refrigerator } from 'lucide-react'
import Fuse from 'fuse.js'
import { getCurrentSeason, isInSeason, MONTH_NAMES } from '../data/seasons'

const CATEGORIES = [
  'Alle', 'Saisonal', 'Favoriten', 'Bewertet',
  'Pasta', 'Suppe', 'Salat', 'Fleisch', 'Fisch',
  'Vegetarisch', 'Vegan', 'Backen', 'Dessert', 'Frühstück'
]

function StarRating({ rating, onRate, size = 13 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{display: 'flex', gap: '1px'}}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); onRate(star) }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            color: star <= (hover || rating || 0) ? '#c1522a' : 'var(--color-border)',
            transition: 'color 0.1s'
          }}
        >
          <Star
            size={size}
            fill={star <= (hover || rating || 0) ? '#c1522a' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

export default function Recipes() {
  const navigate = useNavigate()
  const household = useAuthStore(s => s.household)
  const { recipes, fetchRecipes, loading, toggleFavorite, setRating } = useRecipeStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Alle')
  const [sortBy, setSortBy] = useState('name')
  const [showImport, setShowImport] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [showSeasonBanner, setShowSeasonBanner] = useState(true)

  const season = getCurrentSeason()
  const monthName = MONTH_NAMES[new Date().getMonth()]

  useEffect(() => {
    if (household) fetchRecipes(household.id)
  }, [household])

  const fuse = new Fuse(recipes, {
    keys: ['name', 'category', 'tags', 'description'],
    threshold: 0.35,
    includeScore: true
  })

  const filtered = (search.trim()
    ? fuse.search(search).map(r => r.item)
    : [...recipes]
  )
    .filter(r => {
      if (activeCategory === 'Alle') return true
      if (activeCategory === 'Favoriten') return r.is_favorite
      if (activeCategory === 'Bewertet') return r.rating != null
      if (activeCategory === 'Saisonal') return isInSeason(r.name, r.tags, [])
      return (
        r.category?.toLowerCase() === activeCategory.toLowerCase() ||
        r.tags?.some(t => t.toLowerCase() === activeCategory.toLowerCase())
      )
    })
    .sort((a, b) => {
      if (search.trim()) return 0
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'favorites') return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0)
      return a.name.localeCompare(b.name)
    })

  const favCount = recipes.filter(r => r.is_favorite).length
  const seasonalCount = recipes.filter(r => isInSeason(r.name, r.tags, [])).length

  return (
    <div style={{paddingBottom: '80px'}}>

      <div style={{
        padding: '16px 16px 0',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '12px'
        }}>
          <div>
            <h1 style={{
              fontSize: '20px', fontWeight: '600',
              color: 'var(--color-text)', letterSpacing: '-0.3px'
            }}>
              Rezepte
            </h1>
            {!loading && (
              <p style={{fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px'}}>
                {recipes.length} Gerichte
              </p>
            )}
          </div>
          <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>

            {/* Sort */}
            <div style={{position: 'relative'}}>
              <button onClick={() => setShowSort(s => !s)} style={{
                width: '34px', height: '34px', borderRadius: '9px',
                background: showSort ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                border: '0.5px solid var(--color-border)',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: showSort ? 'var(--color-accent)' : 'var(--color-text-muted)'
              }}>
                <SlidersHorizontal size={15} />
              </button>
              {showSort && (
                <div style={{
                  position: 'absolute', right: 0, top: '40px', zIndex: 50,
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '12px', overflow: 'hidden',
                  minWidth: '160px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }}>
                  {[
                    { key: 'name', label: 'A – Z' },
                    { key: 'rating', label: 'Beste Bewertung' },
                    { key: 'favorites', label: 'Favoriten zuerst' }
                  ].map((opt, idx, arr) => (
                    <button key={opt.key}
                      onClick={() => { setSortBy(opt.key); setShowSort(false) }}
                      style={{
                        width: '100%', padding: '10px 14px', textAlign: 'left',
                        background: sortBy === opt.key
                          ? 'var(--color-accent-soft)' : 'none',
                        border: 'none', cursor: 'pointer', fontSize: '13px',
                        color: sortBy === opt.key
                          ? 'var(--color-accent)' : 'var(--color-text)',
                        fontWeight: sortBy === opt.key ? '500' : '400',
                        borderBottom: idx < arr.length - 1
                          ? '0.5px solid var(--color-border)' : 'none'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kühlschrank */}
            <button onClick={() => navigate('/fridge')} style={{
              height: '34px', padding: '0 10px', borderRadius: '9px',
              background: 'var(--color-accent-soft)',
              border: '0.5px solid var(--color-accent)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '5px',
              color: 'var(--color-accent-text)',
              fontSize: '12px', fontWeight: '500'
            }}>
              <Refrigerator size={14} />
              Kühlschrank
            </button>

            {/* Import */}
            <button onClick={() => setShowImport(true)} style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'var(--color-surface)',
              border: '0.5px solid var(--color-border)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)'
            }}>
              <span style={{fontSize: '15px'}}>↓</span>
            </button>

            {/* Neu */}
            <button onClick={() => navigate('/recipes/new')} style={{
              height: '34px', padding: '0 12px', borderRadius: '9px',
              background: 'var(--color-accent)', border: 'none',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '5px',
              color: '#fff', fontSize: '13px', fontWeight: '500'
            }}>
              <Plus size={15} /> Neu
            </button>
          </div>
        </div>

        {/* Saison-Banner */}
        {showSeasonBanner && activeCategory !== 'Saisonal' && seasonalCount > 0 && (
          <div
            onClick={() => setActiveCategory('Saisonal')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 13px', marginBottom: '10px',
              background: '#f0fdf4',
              border: '0.5px solid #bbf7d0',
              borderRadius: '12px', cursor: 'pointer'
            }}
          >
            <Leaf size={15} color="#16a34a" style={{flexShrink: 0}} />
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{
                fontSize: '12px', fontWeight: '500', color: '#166534'
              }}>
                Jetzt saisonal im {monthName}
              </div>
              <div style={{
                fontSize: '11px', color: '#16a34a',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {[...season.vegetables.slice(0, 3), ...season.fruits.slice(0, 2)].join(' · ')}
              </div>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: '500',
              color: '#16a34a', flexShrink: 0
            }}>
              {seasonalCount} Rezepte →
            </span>
            <button
              onClick={e => { e.stopPropagation(); setShowSeasonBanner(false) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#16a34a', fontSize: '16px', lineHeight: 1,
                padding: '0 2px', flexShrink: 0
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Suche */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--color-surface)',
          border: '0.5px solid var(--color-border)',
          borderRadius: '10px', padding: '0 12px',
          marginBottom: '10px'
        }}>
          <Search size={14} color="var(--color-text-muted)" strokeWidth={1.5} />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen — auch mit Tippfehlern..."
            style={{
              flex: 1, padding: '10px 0',
              background: 'none', border: 'none',
              fontSize: '14px', color: 'var(--color-text)', outline: 'none'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-muted)',
              fontSize: '16px', lineHeight: 1
            }}>×</button>
          )}
        </div>

        {/* Kategorie-Filter */}
        <div style={{
          display: 'flex', gap: '5px', overflowX: 'auto',
          paddingBottom: '10px', scrollbarWidth: 'none'
        }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '5px 11px', borderRadius: '20px',
              border: activeCategory === cat
                ? 'none' : '0.5px solid var(--color-border)',
              cursor: 'pointer', fontSize: '12px',
              fontWeight: activeCategory === cat ? '500' : '400',
              whiteSpace: 'nowrap', flexShrink: 0,
              background: activeCategory === cat
                ? cat === 'Saisonal' ? '#16a34a' : 'var(--color-accent)'
                : 'var(--color-surface)',
              color: activeCategory === cat ? '#fff' : 'var(--color-text-muted)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              {cat === 'Saisonal' && <Leaf size={10} />}
              {cat === 'Favoriten' && favCount > 0
                ? 'Favoriten (' + favCount + ')'
                : cat === 'Saisonal' && seasonalCount > 0
                  ? 'Saisonal (' + seasonalCount + ')'
                  : cat
              }
            </button>
          ))}
        </div>
      </div>

      {/* Saison Detail */}
      {activeCategory === 'Saisonal' && (
        <div style={{
          margin: '0 16px 14px',
          padding: '12px 14px',
          background: '#f0fdf4',
          border: '0.5px solid #bbf7d0',
          borderRadius: '12px'
        }}>
          <div style={{
            fontSize: '12px', fontWeight: '500',
            color: '#166534', marginBottom: '8px',
            display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            <Leaf size={12} /> Saisonal im {monthName}
          </div>
          <div style={{marginBottom: '6px'}}>
            <div style={{
              fontSize: '10px', color: '#16a34a',
              fontWeight: '500', marginBottom: '3px'
            }}>GEMÜSE</div>
            <div style={{
              fontSize: '12px', color: '#166534', lineHeight: '1.6'
            }}>
              {season.vegetables.join(' · ')}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '10px', color: '#16a34a',
              fontWeight: '500', marginBottom: '3px'
            }}>OBST</div>
            <div style={{
              fontSize: '12px', color: '#166534', lineHeight: '1.6'
            }}>
              {season.fruits.join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* Rezept-Grid */}
      <div style={{padding: '0 16px'}}>
        {loading ? (
          <>
            <SkeletonStyles />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
            }}>
              {[1,2,3,4,5,6].map(i => <SkeletonRecipeCard key={i} />)}
            </div>
          </>
        ) : filtered.length === 0 ? (
          <div style={{textAlign: 'center', padding: '56px 24px'}}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--color-surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', fontSize: '24px'
            }}>
              {activeCategory === 'Saisonal' ? '🌿' : '🍽️'}
            </div>
            <p style={{
              fontWeight: '500', fontSize: '15px',
              color: 'var(--color-text)', marginBottom: '6px'
            }}>
              {search ? 'Kein Rezept gefunden'
                : activeCategory === 'Favoriten' ? 'Noch keine Favoriten'
                : activeCategory === 'Saisonal' ? 'Keine saisonalen Rezepte'
                : 'Keine Rezepte'
              }
            </p>
            <p style={{
              fontSize: '13px', color: 'var(--color-text-muted)',
              marginBottom: '20px'
            }}>
              {activeCategory === 'Saisonal'
                ? 'Füge Rezepte mit saisonalen Zutaten hinzu'
                : search ? 'Versuche einen anderen Suchbegriff'
                : 'Füge dein erstes Rezept hinzu'
              }
            </p>
            {!search && activeCategory !== 'Favoriten'
              && activeCategory !== 'Saisonal' && (
              <button onClick={() => setShowImport(true)} style={{
                padding: '10px 20px',
                background: 'var(--color-accent)', color: '#fff',
                border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500'
              }}>
                Rezept importieren
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
          }}>
            {filtered.map(recipe => (
              <div
                key={recipe.id}
                onClick={() => navigate('/recipes/' + recipe.id)}
                style={{
                  background: 'var(--color-surface)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: '14px', overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  aspectRatio: '4/3', position: 'relative',
                  background: 'var(--color-surface-2)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '28px',
                  overflow: 'hidden'
                }}>
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url} alt={recipe.name}
                      loading="lazy" decoding="async"
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{opacity: 0.4}}>🍽️</span>
                  )}

                  {/* Favoriten */}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      toggleFavorite(recipe.id, household.id)
                    }}
                    style={{
                      position: 'absolute', top: '7px', right: '7px',
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: recipe.is_favorite
                        ? 'rgba(193,82,42,0.15)'
                        : 'rgba(0,0,0,0.2)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Heart
                      size={14}
                      color={recipe.is_favorite ? '#c1522a' : '#fff'}
                      fill={recipe.is_favorite ? '#c1522a' : 'none'}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Saison Badge */}
                  {isInSeason(recipe.name, recipe.tags, []) && (
                    <div style={{
                      position: 'absolute', top: '7px', left: '7px',
                      background: '#16a34a',
                      borderRadius: '20px', padding: '2px 6px',
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      <Leaf size={9} color="#fff" />
                      <span style={{
                        fontSize: '9px', color: '#fff', fontWeight: '500'
                      }}>
                        Saison
                      </span>
                    </div>
                  )}

                  {/* Rating Badge */}
                  {recipe.rating && (
                    <div style={{
                      position: 'absolute', bottom: '7px', left: '7px',
                      background: 'rgba(0,0,0,0.45)',
                      borderRadius: '20px', padding: '2px 6px',
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      <Star size={10} fill="#f59e0b" color="#f59e0b" />
                      <span style={{
                        fontSize: '10px', color: '#fff', fontWeight: '500'
                      }}>
                        {recipe.rating}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{padding: '9px 10px'}}>
                  <div style={{
                    fontWeight: '500', fontSize: '13px',
                    color: 'var(--color-text)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.3', marginBottom: '5px'
                  }}>
                    {recipe.name}
                  </div>

                  <div onClick={e => e.stopPropagation()}>
                    <StarRating
                      rating={recipe.rating}
                      onRate={star => setRating(recipe.id, star, household.id)}
                      size={12}
                    />
                  </div>

                  {recipe.category && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      marginTop: '4px'
                    }}>
                      {recipe.category}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showImport && (
        <ImportModal onClose={() => {
          setShowImport(false)
          if (household) fetchRecipes(household.id, true)
        }} />
      )}
    </div>
  )
}