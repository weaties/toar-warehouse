# 🐾 OAR Rescue

Data capture and management app for **Okanagan Animal Rescue** — a volunteer-run rescue organization in BC.

Built with Expo (React Native), Supabase, and Claude AI.

---

## Features

| Feature | Details |
|---|---|
| **Pet intake** | Full intake form — species, breed, age, weight, microchip, vaccinations, photos |
| **Owner/contact management** | Optional contact info; multi-select contact type (adopter / foster / donor) |
| **Status tracking** | Status change log with full history timeline per pet |
| **Paper form scanning** | Photograph a paper intake form → Claude AI pre-fills the digital form for review |
| **Printable intake form** | Clean paper form for field use, accessible from Admin → Print Intake Form |
| **Search & filtering** | Filter pets by name, species, status, and intake type; filter owners by name and contact type |
| **CSV export** | Export contacts list and pets list as CSV (web: browser download; native: share sheet) |
| **Google Sheets sync** | Push contacts or pets data directly to a Google Sheet via a service account |
| **Offline-first** | Forms work without internet; sync queue flushes when connection is restored |
| **Draft auto-save** | Forms auto-save every 1.5 s to local storage; restore prompt on re-open |
| **Photo capture** | Up to 5 photos per pet from camera or gallery; stored in Supabase Storage |
| **Auth** | Email/password login via Supabase Auth; all routes protected |

---

## Getting Started

### Option A — GitHub Codespaces (recommended)

1. Click the green **Code** button on GitHub → **Codespaces** → **Create codespace on main**
2. Wait for the environment to build (~2 minutes)
3. Copy `.env.example` to `.env` and fill in your Supabase credentials (see below)
4. `npm run web` — opens the app on port 8081

### Option B — Local Development

**Prerequisites:** Node 22+, npm 10+

```bash
git clone https://github.com/weaties/toar-warehouse.git
cd toar-warehouse
npm install
cp .env.example .env
# Fill in .env with your Supabase credentials
npm run web
```

---

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)

2. Copy your credentials from **Settings → API** into `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. Run the database schema:
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

4. Create a storage bucket called `pet-photos` (public) in the Supabase dashboard → Storage.

5. Create volunteer accounts in the Supabase dashboard → Authentication → Users → **Add user**. There is no self-registration screen.

---

## Paper Form Scanning (Claude AI)

Volunteers can photograph a paper intake form and have Claude AI pre-fill the digital form for review.

**Setup:**

1. Deploy the edge function:
   ```bash
   supabase functions deploy scan-form
   ```

2. Set your Anthropic API key as a secret (it must **never** go in `.env` or be committed):
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

**Usage in the app:** Pets → New Intake → **Scan Paper Form**

Pre-filled fields are highlighted in blue. The volunteer reviews every field before saving — nothing is written until they tap **Save Record**.

**Printing the paper form:** Admin → **Print Intake Form** opens a print-ready form in a new tab. Use the browser's Print or Save as PDF to produce copies.

---

## Google Sheets Sync

Push the full contacts or pets dataset to a Google Sheet on demand (replaces sheet contents, no duplicates).

**Setup:**

1. Create a Google Cloud project and enable the **Google Sheets API**.

2. Create a **Service Account**, download the JSON key.

3. Share your target Google Sheet with the service account's email address (Editor access).

4. Deploy the edge function:
   ```bash
   supabase functions deploy push-to-sheets
   ```

5. Set the service account JSON as a secret:
   ```bash
   supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='{ "type": "service_account", ... }'
   ```

6. In the app: **Admin → Settings** — enter your Google Sheet ID (the long string in the sheet URL).

7. **Admin → Export** — use the **Push to Sheets** buttons. The function will auto-create "Contacts" and "Pets" tabs if they don't exist.

---

## Running the App

| Command | Description |
|---|---|
| `npm run web` | Run in web browser (port 8081) |
| `npx expo start` | Run with Expo Go — scan QR code on phone |
| `npx expo start --tunnel` | Expo Go via tunnel (for Codespaces / different networks) |
| `npx expo run:ios` | Build for iOS simulator |
| `npx expo run:android` | Build for Android emulator |
| `supabase start` | Start local Supabase instance |
| `supabase studio` | Open local database UI |
| `npx tsc --noEmit` | TypeScript type-check |

---

## Project Structure

```
app/
├── index.tsx               # Root redirect (→ dashboard or login)
├── (auth)/login.tsx        # Email/password login
└── (tabs)/
    ├── dashboard.tsx       # Summary counts and recent activity
    ├── pets/               # Pet list, detail, new intake, edit
    ├── owners/             # Owner list, detail, new, edit
    └── admin/              # Export, print form, settings

components/
├── PetForm.tsx             # Shared pet intake/edit form (with AI scan support)
├── OwnerForm.tsx           # Shared owner form
├── PetCard.tsx             # Pet list row
├── OwnerCard.tsx           # Owner list row
└── SyncStatusBanner.tsx    # Online/offline/syncing indicator

lib/
├── supabase/               # DB service functions (pets, owners, vaccinations, storage…)
├── sync.ts                 # Offline write queue (AsyncStorage-backed)
├── drafts.ts               # Form draft auto-save helpers
├── export.ts               # CSV export (browser download on web, share sheet on native)
└── sheets.ts               # Google Sheets push (calls push-to-sheets edge function)

supabase/
├── migrations/001_initial_schema.sql   # Full schema + RLS policies
└── functions/
    ├── scan-form/          # Claude AI paper form OCR
    └── push-to-sheets/     # Google Sheets sync via service account

public/
└── intake-form.html        # Printable paper intake form

types/index.ts              # Shared TypeScript types
```

---

## Environment Variables

See `.env.example`. Only two variables go in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

> ⚠️ **Never commit secrets.** `ANTHROPIC_API_KEY` and `GOOGLE_SERVICE_ACCOUNT_JSON` must only ever be set as Supabase Edge Function secrets via `supabase secrets set`. They must never appear in `.env`, in the app bundle, or in the repository.

---

## Contributing

This is a volunteer project. Please open an issue before starting any large changes.
