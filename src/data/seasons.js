// Monat 0-11
export const SEASONAL = {
  0: { // Januar
    vegetables: ['Rosenkohl', 'Grünkohl', 'Lauch', 'Sellerie', 'Rote Bete', 'Pastinaken', 'Schwarzwurzel'],
    fruits: ['Äpfel', 'Birnen', 'Orangen', 'Clementinen', 'Kiwi', 'Granatapfel'],
  },
  1: { // Februar
    vegetables: ['Rosenkohl', 'Grünkohl', 'Lauch', 'Feldsalat', 'Chicorée', 'Pastinaken'],
    fruits: ['Äpfel', 'Birnen', 'Orangen', 'Clementinen', 'Kiwi'],
  },
  2: { // März
    vegetables: ['Spinat', 'Radieschen', 'Frühlingszwiebeln', 'Feldsalat', 'Lauch'],
    fruits: ['Äpfel', 'Rhabarber', 'Orangen', 'Kiwi'],
  },
  3: { // April
    vegetables: ['Spargel', 'Spinat', 'Radieschen', 'Frühlingszwiebeln', 'Bärlauch', 'Rucola'],
    fruits: ['Rhabarber', 'Erdbeeren', 'Äpfel'],
  },
  4: { // Mai
    vegetables: ['Spargel', 'Spinat', 'Radieschen', 'Kohlrabi', 'Erbsen', 'Bärlauch', 'Rucola', 'Frühlingszwiebeln'],
    fruits: ['Erdbeeren', 'Rhabarber', 'Kirschen'],
  },
  5: { // Juni
    vegetables: ['Zucchini', 'Gurke', 'Tomaten', 'Kohlrabi', 'Erbsen', 'Radieschen', 'Salat', 'Fenchel'],
    fruits: ['Erdbeeren', 'Kirschen', 'Himbeeren', 'Johannisbeeren', 'Aprikosen'],
  },
  6: { // Juli
    vegetables: ['Zucchini', 'Gurke', 'Tomaten', 'Paprika', 'Aubergine', 'Mais', 'Bohnen', 'Fenchel'],
    fruits: ['Himbeeren', 'Heidelbeeren', 'Kirschen', 'Pfirsich', 'Nektarine', 'Aprikosen', 'Johannisbeeren'],
  },
  7: { // August
    vegetables: ['Tomaten', 'Paprika', 'Aubergine', 'Mais', 'Bohnen', 'Zucchini', 'Gurke', 'Kürbis'],
    fruits: ['Pfirsich', 'Nektarine', 'Pflaumen', 'Heidelbeeren', 'Brombeeren', 'Himbeeren', 'Melone'],
  },
  8: { // September
    vegetables: ['Kürbis', 'Tomaten', 'Paprika', 'Mais', 'Lauch', 'Brokkoli', 'Blumenkohl', 'Rote Bete'],
    fruits: ['Äpfel', 'Birnen', 'Pflaumen', 'Trauben', 'Brombeeren', 'Quitten'],
  },
  9: { // Oktober
    vegetables: ['Kürbis', 'Lauch', 'Brokkoli', 'Blumenkohl', 'Rosenkohl', 'Rote Bete', 'Pastinaken', 'Sellerie'],
    fruits: ['Äpfel', 'Birnen', 'Quitten', 'Trauben', 'Pflaumen'],
  },
  10: { // November
    vegetables: ['Rosenkohl', 'Grünkohl', 'Lauch', 'Sellerie', 'Rote Bete', 'Pastinaken', 'Schwarzwurzel'],
    fruits: ['Äpfel', 'Birnen', 'Quitten', 'Orangen', 'Clementinen', 'Granatapfel'],
  },
  11: { // Dezember
    vegetables: ['Rosenkohl', 'Grünkohl', 'Lauch', 'Sellerie', 'Rote Bete', 'Pastinaken', 'Chicorée'],
    fruits: ['Äpfel', 'Birnen', 'Orangen', 'Clementinen', 'Kiwi', 'Granatapfel'],
  },
}

export const getCurrentSeason = () => {
  const month = new Date().getMonth()
  return SEASONAL[month]
}

export const isInSeason = (recipeName, tags, ingredients) => {
  const season = getCurrentSeason()
  const allSeasonal = [...season.vegetables, ...season.fruits]
  const searchText = [recipeName, ...(tags || []), ...(ingredients || [])].join(' ').toLowerCase()
  return allSeasonal.some(item => searchText.includes(item.toLowerCase()))
}

export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]