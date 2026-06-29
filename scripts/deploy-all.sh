#!/usr/bin/env bash
#
# Redespliega backend y luego frontend a Vercel (producción).
# Atajo para cuando tocaste ambos.
#
set -euo pipefail
DIR="$(dirname "$0")"

bash "$DIR/deploy-backend.sh"
echo ""
bash "$DIR/deploy-frontend.sh"
echo ""
echo "🎉 Backend + frontend desplegados."
