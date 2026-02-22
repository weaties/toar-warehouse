#!/bin/bash
set -e

echo "🐾 Setting up TOAR Warehouse development environment..."

# ── Node & package manager ──────────────────────────────────────────────────
echo "📦 Installing global tools..."
npm install -g expo-cli @expo/cli supabase @anthropic-ai/claude-code

# ── Install project dependencies (if package.json exists) ───────────────────
if [ -f "package.json" ]; then
  echo "📦 Installing project dependencies..."
  npm install
else
  echo "⚠️  No package.json found yet — skipping npm install."
  echo "    Run 'npx create-expo-app@latest . --template blank-typescript' to scaffold the project."
fi

# ── Supabase CLI ─────────────────────────────────────────────────────────────
echo "🗄️  Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
  npm install -g supabase
fi

# ── .env setup ───────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "🔑 Creating .env from .env.example..."
    cp .env.example .env
    echo "    ⚠️  Remember to fill in your credentials in .env"
  else
    echo "🔑 Creating blank .env file..."
    cat > .env << 'EOF'
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Anthropic (for paper form OCR — set this in Supabase Edge Function secrets, NOT here)
# ANTHROPIC_API_KEY=

# Google Sheets sync (stretch goal)
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_SHEET_ID=
EOF
    echo "    ⚠️  Fill in your Supabase credentials in .env before starting the app."
  fi
else
  echo "✅ .env already exists — skipping."
fi

# ── Git configuration ─────────────────────────────────────────────────────────
echo "🔧 Configuring git..."
git config --global core.autocrlf input
git config --global pull.rebase false

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "✅ TOAR Warehouse environment ready!"
echo ""
echo "Next steps:"
echo "  1. Fill in your credentials in .env"
echo "  2. If starting fresh: npx create-expo-app@latest . --template blank-typescript"
echo "  3. Start the app:     npx expo start --web"
echo "  4. Start Supabase:    supabase start"
echo ""
echo "Happy rescuing! 🐶🐱"
