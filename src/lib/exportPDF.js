import jsPDF from 'jspdf'

export const exportWeekPlanAsPDF = (weekLabel, days, entries, recipes) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 16

  // Header
  doc.setFillColor(108, 99, 255)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('MealSync – Wochenplan', margin, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(weekLabel, pageW - margin, 14, { align: 'right' })

  let y = 32
  const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

  days.forEach((day, i) => {
    const entry = entries.find(e => e.day_of_week === i + 1 && e.meal_type === 'dinner')
    const recipeName = entry
      ? (entry.recipes?.name || entry.custom_name || '—')
      : '—'
    const recipe = entry ? recipes.find(r => r.id === entry.recipe_id) : null

    // Tag-Box
    doc.setFillColor(240, 240, 255)
    doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, 'F')

    // Tag Name
    doc.setTextColor(108, 99, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(dayNames[i], margin + 4, y + 8)

    // Datum
    doc.setTextColor(120, 120, 140)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(day, margin + 4, y + 14)

    // Rezeptname
    doc.setTextColor(30, 30, 50)
    doc.setFontSize(11)
    doc.setFont('helvetica', entry ? 'bold' : 'normal')
    doc.text(recipeName, pageW / 2, y + 11, { align: 'center' })

    // Kategorie
    if (recipe?.category) {
      doc.setTextColor(120, 120, 140)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(recipe.category, pageW - margin - 4, y + 8, { align: 'right' })
    }

    y += 26
  })

  // Einkaufsliste Hinweis
  y += 4
  doc.setFillColor(245, 245, 250)
  doc.roundedRect(margin, y, pageW - margin * 2, 12, 2, 2, 'F')
  doc.setTextColor(120, 120, 140)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Einkaufsliste automatisch in MealSync generiert', pageW / 2, y + 8, { align: 'center' })

  // Footer
  doc.setTextColor(180, 180, 200)
  doc.setFontSize(8)
  doc.text(`Erstellt mit MealSync · ${new Date().toLocaleDateString('de-DE')}`, pageW / 2, 285, { align: 'center' })

  doc.save(`MealSync-Wochenplan-${weekLabel.replace(/\s/g, '_')}.pdf`)
}