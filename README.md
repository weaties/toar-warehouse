# 🐾 TOAR Warehouse

Data capture and management app for **Team Okanagan Animal Rescue**.

Built with Expo (React Native), Supabase, and Claude AI.

---

## Getting Started

### Option A — GitHub Codespaces (recommended)
1. Click the green **Code** button on GitHub → **Codespaces** → **Create codespace on main**
2. Wait for the environment to build (~2 minutes)
3. Fill in your credentials in `.env` (copied automatically from `.env.example`)
4. Run `npx expo start --web` to launch the app

### Option B — Local Development
**Prerequisites:** Node 22+, npm 10+

```bash
git clone https://github.com/your-org/toar-warehouse.git
cd toar-warehouse
npm install
cp .env.example .env
# Fill in .env with your Supabase credentials
npx expo start
```

---

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your Project URL and anon key into `.env`
3. Run the database migrations: `supabase db push`
4. Set the Anthropic API key as a secret (for paper form OCR):
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=your-key-here
   ```

---

## Running the App

| Command | Description |
|---|---|
| `npx expo start --web` | Run in web browser |
| `npx expo start` | Run with Expo Go (scan QR on phone) |
| `npx expo run:ios` | Build for iOS simulator |
| `npx expo run:android` | Build for Android emulator |
| `supabase start` | Start local Supabase instance |
| `supabase studio` | Open local database UI |

---

## Project Structure

```
.devcontainer/      # GitHub Codespaces configuration
app/                # Expo Router screens
  (auth)/           # Login
  (tabs)/           # Main app tabs
lib/                # Business logic & API services
  supabase/         # Database service functions
  sync.ts           # Offline sync layer
  export.ts         # CSV export
types/              # Shared TypeScript types
supabase/
  migrations/       # Database schema migrations
  functions/        # Edge Functions (incl. form OCR)
```

---

## Environment Variables

See `.env.example` for all required variables.

> ⚠️ Never commit `.env` to the repository. The `ANTHROPIC_API_KEY` must only ever live in Supabase Edge Function secrets.

---

## Contributing

This is a volunteer project. Please open an issue before starting any large changes.
