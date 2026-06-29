#!/usr/bin/env bash
#
# Redespliega el BACKEND (API Express serverless) a Vercel en producción.
# Úsalo cada vez que cambies código del backend.
#
# Requisitos (una sola vez):
#   - vercel login
#   - desde backend/: vercel link   (vincula la carpeta a tu proyecto de Vercel)
#
set -euo pipefail
cd "$(dirname "$0")/../backend"

echo "🚀 Desplegando backend a Vercel (producción)…"
vercel deploy --prod --yes

echo "✅ Backend desplegado."
echo "   Si es la PRIMERA vez, copia el dominio de producción del backend a"
echo "   frontend/vercel.json (reemplaza __BACKEND_URL__) y redepliega el frontend."
