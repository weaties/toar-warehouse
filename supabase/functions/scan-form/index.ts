// Supabase Edge Function — scan-form
// Receives a base64-encoded JPEG of a paper intake form,
// sends it to Claude for data extraction, and returns structured JSON.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_PROMPT = `You are helping digitize a paper animal rescue intake form.
Extract all readable information from this form image and return ONLY a valid JSON object with the following fields. Use null for any field that is blank, illegible, or not present on the form.

{
  "owner": {
    "full_name": null,
    "phone_primary": null,
    "phone_secondary": null,
    "email": null,
    "street_address": null,
    "city": null,
    "province": null,
    "postal_code": null,
    "contact_type": [],
    "notes": null
  },
  "pet": {
    "name": null,
    "species": null,
    "breed": null,
    "age_years": null,
    "age_months": null,
    "sex": null,
    "weight_lbs": null,
    "colour_markings": null,
    "microchip_number": null,
    "spayed_neutered": null,
    "intake_type": null,
    "medical_notes": null,
    "behavioural_notes": null,
    "vaccinations": []
  }
}

Return only the JSON object, no explanation or markdown.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  let imageBase64: string;
  try {
    const body = await req.json() as { image_base64: string };
    imageBase64 = body.image_base64;
    if (!imageBase64) throw new Error('Missing image_base64');
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Claude API error' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const claudeData = await claudeResponse.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const textContent = claudeData.content.find((c) => c.type === 'text');
    if (!textContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'No text response from Claude' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    let parsedData: unknown;
    try {
      // Strip any accidental markdown code fences
      const cleaned = textContent.text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsedData = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Claude response as JSON:', textContent.text);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not parse form data' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal error';
    console.error('scan-form error:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
