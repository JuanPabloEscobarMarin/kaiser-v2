#!/usr/bin/env bash
#
# Redespliega el FRONTEND (SPA React/Vite) a Vercel en producción.
# Úsalo cada vez que cambies código del frontend.
#
# Requisitos (una sola vez):
#   - vercel login
#   - desde frontend/: vercel link
#   - reemplazar __BACKEND_URL__ en frontend/vercel.json por el dominio del backend
#
set -euo pipefail
cd "$(dirname "$0")/../frontend"

if grep -q "__BACKEND_URL__" vercel.json; then
  echo "❌ Falta el dominio del backend en frontend/vercel.json."
  echo "   Reemplaza __BACKEND_URL__ por el dominio de producción del backend"
  echo "   (p. ej. kaiser-backend.vercel.app) y vuelve a ejecutar."
  exit 1
fi

echo "🚀 Desplegando frontend a Vercel (producción)…"
vercel deploy --prod --yes

echo "✅ Frontend desplegado."
