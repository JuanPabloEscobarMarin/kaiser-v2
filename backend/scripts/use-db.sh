#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

target="${1:-}"

case "$target" in
  local|supabase)
    src=".env.${target}"
    if [ ! -f "$src" ]; then
      echo "❌ ${src} no existe"
      exit 1
    fi
    cp "$src" .env
    echo "✅ Conmutado a: ${target}"
    grep -E '^DATABASE_URL=' .env | sed 's/:[^@]*@/:****@/'
    ;;
  current)
    echo "📦 .env actual:"
    grep -E '^DATABASE_URL=' .env | sed 's/:[^@]*@/:****@/' || echo "(no .env)"
    ;;
  *)
    echo "Uso: $0 <local|supabase|current>"
    echo ""
    echo "  local      copia .env.local → .env"
    echo "  supabase   copia .env.supabase → .env"
    echo "  current    muestra qué DB esta activa"
    exit 1
    ;;
esac
