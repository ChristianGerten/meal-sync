import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { base64, mediaType } = await req.json()
    if (!base64 || !mediaType) throw new Error('Bild fehlt')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: `Extrahiere das Rezept aus diesem Bild. Antworte NUR mit validem JSON ohne Markdown:
{"name":"","description":"","category":"","servings":2,"prep_time":null,"cook_time":null,"tags":[],"ingredients":[{"name":"","amount":null,"unit":"","category":"Sonstiges"}]}
Kategorien für Zutaten: Gemüse, Obst, Fleisch, Fisch, Kühlregal, Milchprodukte, Nudeln, Reis & Getreide, Konserven, Gewürze, Backen, Sonstiges.`
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Claude API Fehler')
    }

    const data = await response.json()
    const text = data.content[0].text.trim()
    const clean = text.replace(/```json|```/g, '').trim()
    const recipe = JSON.parse(clean)

    return new Response(
      JSON.stringify(recipe),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})