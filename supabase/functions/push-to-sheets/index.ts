// Supabase Edge Function — push-to-sheets
// Reads contacts or pets data from Supabase, then replaces the corresponding
// tab in a Google Sheet using a service account.
//
// Required secrets (set via `supabase secrets set`):
//   GOOGLE_SERVICE_ACCOUNT_JSON  — full service account JSON string
//
// Required env (auto-injected by Supabase):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

// ---------------------------------------------------------------------------
// JWT helpers for Google service-account auth
// ---------------------------------------------------------------------------

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function uint8ToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return base64url(binary);
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN[^-]*-----/, '')
    .replace(/-----END[^-]*-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const signingInput = `${header}.${payload}`;
  const keyData = pemToArrayBuffer(sa.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput)),
  );
  const jwt = `${signingInput}.${uint8ToBase64url(signatureBytes)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Failed to get Google access token: ${err}`);
  }
  const { access_token } = await tokenRes.json() as { access_token: string };
  return access_token;
}

// ---------------------------------------------------------------------------
// Sheets API helpers
// ---------------------------------------------------------------------------

async function ensureSheetTab(
  token: string,
  spreadsheetId: string,
  tabName: string,
): Promise<void> {
  // Get existing sheet names
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!metaRes.ok) {
    const err = await metaRes.text();
    throw new Error(`Could not read spreadsheet metadata: ${err}`);
  }
  const meta = await metaRes.json() as { sheets: Array<{ properties: { title: string } }> };
  const exists = meta.sheets.some((s) => s.properties.title === tabName);

  if (!exists) {
    // Add a new sheet tab
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: tabName } } }],
        }),
      },
    );
    if (!addRes.ok) {
      const err = await addRes.text();
      throw new Error(`Could not create sheet tab "${tabName}": ${err}`);
    }
  }
}

async function replaceSheetData(
  token: string,
  spreadsheetId: string,
  tabName: string,
  values: string[][],
): Promise<void> {
  const range = `${tabName}!A1`;

  // Clear existing content
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    },
  );

  // Write new content
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    },
  );

  if (!writeRes.ok) {
    const err = await writeRes.text();
    throw new Error(`Failed to write to sheet: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Data builders
// ---------------------------------------------------------------------------

interface Owner {
  full_name: string | null;
  email: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  street_address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  contact_type: string[] | null;
  notes: string | null;
  created_at: string;
}

interface Pet {
  name: string;
  species: string;
  breed: string | null;
  current_status: string;
  intake_type: string | null;
  created_at: string;
  owner?: { full_name: string | null } | null;
}

function buildContactRows(owners: Owner[]): string[][] {
  const headers = ['Name', 'Email', 'Phone (Primary)', 'Phone (Secondary)', 'Address', 'Contact Type', 'Notes', 'Added'];
  const rows = owners.map((o) => [
    o.full_name ?? '',
    o.email ?? '',
    o.phone_primary ?? '',
    o.phone_secondary ?? '',
    [o.street_address, o.city, o.province, o.postal_code].filter(Boolean).join(', '),
    (o.contact_type ?? []).join('; '),
    o.notes ?? '',
    o.created_at.slice(0, 10),
  ]);
  return [headers, ...rows];
}

function buildPetRows(pets: Pet[]): string[][] {
  const headers = ['Pet Name', 'Species', 'Breed', 'Status', 'Owner', 'Intake Type', 'Intake Date'];
  const rows = pets.map((p) => [
    p.name,
    p.species,
    p.breed ?? '',
    p.current_status,
    p.owner?.full_name ?? '',
    p.intake_type ?? '',
    p.created_at.slice(0, 10),
  ]);
  return [headers, ...rows];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    return new Response(
      JSON.stringify({ success: false, error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Supabase env not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  let sheetId: string;
  let type: 'contacts' | 'pets';
  try {
    const body = await req.json() as { sheet_id: string; type: 'contacts' | 'pets' };
    sheetId = body.sheet_id;
    type = body.type;
    if (!sheetId || !type) throw new Error('Missing sheet_id or type');
    if (type !== 'contacts' && type !== 'pets') throw new Error('type must be contacts or pets');
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const sa: ServiceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getGoogleAccessToken(sa);

    const tabName = type === 'contacts' ? 'Contacts' : 'Pets';
    await ensureSheetTab(accessToken, sheetId, tabName);

    // Fetch data from Supabase using service role key
    const table = type === 'contacts' ? 'owners' : 'pets';
    const select = type === 'contacts' ? '*' : '*, owner:owners(full_name)';
    const dataRes = await fetch(
      `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=created_at.asc`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (!dataRes.ok) {
      const err = await dataRes.text();
      throw new Error(`Failed to fetch ${table}: ${err}`);
    }

    const records = await dataRes.json();
    const values = type === 'contacts'
      ? buildContactRows(records as Owner[])
      : buildPetRows(records as Pet[]);

    await replaceSheetData(accessToken, sheetId, tabName, values);

    return new Response(
      JSON.stringify({ success: true, rows: values.length - 1 }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal error';
    console.error('push-to-sheets error:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
