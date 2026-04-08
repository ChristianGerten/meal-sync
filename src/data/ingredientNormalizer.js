// Normalisierungsregeln — Plural/Singular + Schreibvarianten
const NORMALIZE_RULES = [
  // Gemüse
  [/^zwiebeln?$/i, 'Zwiebeln'],
  [/^rote zwiebeln?$/i, 'Rote Zwiebeln'],
  [/^frühlingszwiebeln?$/i, 'Frühlingszwiebeln'],
  [/^knoblauchzehen?$|^knoblauch$/i, 'Knoblauch'],
  [/^kartoffeln?$/i, 'Kartoffeln'],
  [/^süßkartoffeln?$/i, 'Süßkartoffeln'],
  [/^tomaten?$/i, 'Tomaten'],
  [/^cherrytomaten?$/i, 'Cherrytomaten'],
  [/^paprika$/i, 'Paprika'],
  [/^möhren?$|^karotten?$/i, 'Karotten'],
  [/^gurken?$/i, 'Gurke'],
  [/^zucchini$/i, 'Zucchini'],
  [/^auberginen?$/i, 'Aubergine'],
  [/^champignons?$/i, 'Champignons'],
  [/^spinat$/i, 'Spinat'],
  [/^blattspinat$/i, 'Spinat'],
  [/^brokkoli$/i, 'Brokkoli'],
  [/^blumenkohl$/i, 'Blumenkohl'],
  [/^lauch$|^porree$/i, 'Lauch'],
  [/^fenchel$/i, 'Fenchel'],
  [/^avocado(s)?$/i, 'Avocado'],
  [/^ingwer$/i, 'Ingwer'],
  [/^chili(s)?$|^chilischoten?$/i, 'Chili'],
  [/^salat$/i, 'Salat'],
  [/^rucola$/i, 'Rucola'],
  // Fleisch & Fisch
  [/^hähnchenbrüste?$|^hähnchenbrust$/i, 'Hähnchenbrust'],
  [/^hähnchenkeule[n]?$/i, 'Hähnchenkeule'],
  [/^hackfleisch.*$/i, 'Hackfleisch'],
  [/^rinderhack$/i, 'Rinderhack'],
  [/^schweinehack$/i, 'Schweinehack'],
  [/^lachs(filet)?$/i, 'Lachs'],
  [/^räucherlachs$/i, 'Räucherlachs'],
  [/^garnelen?$/i, 'Garnelen'],
  [/^speck$/i, 'Speck'],
  [/^schinken$/i, 'Schinken'],
  // Milchprodukte
  [/^milch$|^vollmilch$/i, 'Milch'],
  [/^butter$/i, 'Butter'],
  [/^eier?$|^ei$/i, 'Eier'],
  [/^sahne$|^schlagsahne$|^schlagobers$/i, 'Sahne'],
  [/^saure sahne$|^saurer rahm$/i, 'Saure Sahne'],
  [/^parmesan(käse)?$/i, 'Parmesan'],
  [/^mozzarella$/i, 'Mozzarella'],
  [/^feta(käse)?$/i, 'Feta'],
  [/^frischkäse$/i, 'Frischkäse'],
  [/^joghurt$|^naturjoghurt$/i, 'Joghurt'],
  [/^quark$|^magerquark$/i, 'Quark'],
  // Nudeln & Getreide
  [/^spaghetti$/i, 'Spaghetti'],
  [/^penne$/i, 'Penne'],
  [/^fusilli$/i, 'Fusilli'],
  [/^reis$|^basmatireis$|^basmati.reis$/i, 'Reis'],
  [/^couscous$/i, 'Couscous'],
  [/^nudeln?$/i, 'Nudeln'],
  // Konserven & Öle
  [/^(geschälte )?tomaten \(dose\)$|^dosentomaten?$/i, 'Tomaten (Dose)'],
  [/^tomatenmark$/i, 'Tomatenmark'],
  [/^passata$/i, 'Passata'],
  [/^kichererbsen.*$/i, 'Kichererbsen'],
  [/^linsen.*$/i, 'Linsen'],
  [/^kokosmilch.*$/i, 'Kokosmilch'],
  [/^olivenöl$|^oliven.öl$/i, 'Olivenöl'],
  [/^sonnenblumenöl$/i, 'Sonnenblumenöl'],
  // Gewürze & Basics
  [/^knoblauchzehen?$|^knoblauchzehe$/i, 'Knoblauch'],
  [/^petersilie$/i, 'Petersilie'],
  [/^basilikum$/i, 'Basilikum'],
  [/^thymian$/i, 'Thymian'],
  [/^rosmarin$/i, 'Rosmarin'],
  [/^zitrone[n]?$/i, 'Zitrone'],
  [/^limette[n]?$/i, 'Limette'],
]

// Normalisiert einen Zutatennamen
export const normalizeIngredientName = (name) => {
  const trimmed = name.trim()
  for (const [pattern, normalized] of NORMALIZE_RULES) {
    if (pattern.test(trimmed)) return normalized
  }
  // Ersten Buchstaben groß
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

// Berechnet Ähnlichkeit zwischen zwei Strings (0-1)
const similarity = (a, b) => {
  const la = a.toLowerCase().trim()
  const lb = b.toLowerCase().trim()
  if (la === lb) return 1
  if (la.includes(lb) || lb.includes(la)) return 0.9
  // Levenshtein-Distanz
  const matrix = []
  for (let i = 0; i <= lb.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= la.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= lb.length; i++) {
    for (let j = 1; j <= la.length; j++) {
      if (lb[i-1] === la[j-1]) {
        matrix[i][j] = matrix[i-1][j-1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j] + 1
        )
      }
    }
  }
  const dist = matrix[lb.length][la.length]
  const maxLen = Math.max(la.length, lb.length)
  return 1 - dist / maxLen
}

// Dedupliziert eine Liste von Zutaten und addiert Mengen
export const deduplicateIngredients = (ingredients) => {
  const result = []

  for (const ing of ingredients) {
    const normalizedName = normalizeIngredientName(ing.name)

    // Ähnliche Zutat in result suchen
    const existingIdx = result.findIndex(r => {
      const sim = similarity(r.name, normalizedName)
      return sim >= 0.85
    })

    if (existingIdx >= 0) {
      const existing = result[existingIdx]
      // Mengen addieren wenn gleiche Einheit
      if (ing.unit && existing.unit && ing.unit === existing.unit && ing.amount && existing.amount) {
        result[existingIdx] = {
          ...existing,
          amount: Math.round((Number(existing.amount) + Number(ing.amount)) * 10) / 10
        }
      }
      // Sonst Menge ignorieren aber nicht duplizieren
    } else {
      result.push({ ...ing, name: normalizedName })
    }
  }

  return result
}