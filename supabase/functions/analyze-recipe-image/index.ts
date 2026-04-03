import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const emptyRecipe = {
  name: '',
  description: '',
  category: '',
  servings: 2,
  prep_time: null,
  cook_time: null,
  tags: [],
  ingredients: [],
  steps: []
}

const sanitizeJson = (str: string) => {
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\t/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
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
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 }
              },
              {
                type: 'text',
                text: `You are a recipe extraction expert. Analyze this recipe image carefully.

Extract ALL information and return ONLY a valid single-line JSON object.

CRITICAL RULES:
1. Return ONLY JSON - no text before or after
2. No newlines inside string values - replace with space
3. For "steps": Extract ALL preparation/cooking instructions as individual steps.
   - If steps are numbered (1. 2. 3.) → split by numbers
   - If steps are separated by paragraphs → split by paragraph  
   - If it is one long text → split into logical cooking actions
   - Each step should be ONE clear action (e.g. "Zwiebeln würfeln und in Butter anschwitzen")
   - Minimum 3 steps, maximum 15 steps
4. For "ingredients": extract name, amount, unit for each ingredient

JSON format:
{"name":"","description":"","category":"","servings":2,"prep_time":null,"cook_time":null,"tags":[],"ingredients":[{"name":"","amount":null,"unit":"","category":"Sonstiges"}],"steps":["step 1","step 2","step 3"]}

Ingredient categories: Gemüse, Obst, Fleisch, Fisch, Kühlregal, Milchprodukte, Nudeln, Reis & Getreide, Konserven, Gewürze, Backen, Sonstiges.

ONLY return the JSON object. Nothing else.`
              }
            ]
          },
          {
            role: 'assistant',
            content: '{'
          }
        ]
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Claude API Fehler')
    }

    const data = await response.json()
    const rawText = '{' + data.content[0].text.trim()

    let recipe
    try {
      recipe = JSON.parse(sanitizeJson(rawText))
    } catch {
      try {
        const match = rawText.match(/\{[\s\S]*\}/)
        if (match) {
          recipe = JSON.parse(sanitizeJson(match[0]))
        } else {
          recipe = emptyRecipe
        }
      } catch {
        recipe = emptyRecipe
      }
    }

    // Sicherstellen dass steps ein Array von Strings ist
    if (recipe.steps && Array.isArray(recipe.steps)) {
      recipe.steps = recipe.steps
        .map((s: any) => typeof s === 'string' ? s.trim() : String(s).trim())
        .filter((s: string) => s.length > 0)
    } else {
      recipe.steps = []
    }

    // Sicherstellen dass ingredients valide sind
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      recipe.ingredients = recipe.ingredients
        .filter((i: any) => i.name?.trim())
        .map((i: any) => ({
          name: i.name?.trim() || '',
          amount: i.amount || null,
          unit: i.unit?.trim() || '',
          category: i.category || 'Sonstiges'
        }))
    } else {
      recipe.ingredients = []
    }

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