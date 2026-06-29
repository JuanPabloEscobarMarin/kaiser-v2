#!/usr/bin/env bash
#
# Descarga y procesa las imágenes del seed "AB Hair Studio" hacia
# backend/uploads/images con slugs estables (seed-*.jpg / seed-*.png).
#
# - Fotos de Unsplash, recortadas a tamaño consistente con ImageMagick.
# - Si una descarga falla, genera un placeholder de marca con el nombre del ítem
#   (así el seed nunca queda con imágenes rotas).
# - Idempotente: re-ejecutar sobrescribe los mismos archivos.
#
# Requisitos: curl + ImageMagick (`magick`/`convert`). Necesita red para las
# fotos; sin red, todo cae a placeholders de marca.

set -euo pipefail

cd "$(dirname "$0")/.."
OUT="uploads/images"
mkdir -p "$OUT"

FONT="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
BRAND="#6d28d9"
BRAND_DARK="#4c1d95"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "🧹 Limpiando imágenes seed previas"
rm -f "$OUT"/seed-*.jpg "$OUT"/seed-*.png

# branded <outfile> <WxH> <label>  → tarjeta de marca con texto centrado
branded () {
  local out="$1" size="$2" label="$3"
  magick -size "$size" "gradient:${BRAND}-${BRAND_DARK}" \
    -gravity center -font "$FONT" -fill white \
    -pointsize 34 -annotate +0-20 "AB Hair Studio" \
    -pointsize 26 -fill "#e9d5ff" -annotate +0+30 "$label" \
    -quality 82 "$out"
  echo "   placeholder → $(basename "$out")  [$label]"
}

# fetch <slugfile> <unsplash_id> <WxH> <label>
fetch () {
  local out="$OUT/$1" id="$2" size="$3" label="$4"
  local w="${size%x*}" h="${size#*x}"
  local raw="$TMP/raw.img"
  local code
  code=$(curl -sL -o "$raw" -w "%{http_code}" --max-time 25 \
    "https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=75" || echo "000")
  if [ "$code" = "200" ] && magick identify "$raw" >/dev/null 2>&1; then
    magick "$raw" -resize "${size}^" -gravity center -extent "$size" \
      -strip -quality 82 "$out"
    echo "   ok          → $1  [$label]"
  else
    echo "   ⚠️  descarga falló ($code) para $1 — usando placeholder"
    branded "$out" "$size" "$label"
  fi
}

echo "🎨 Generando logo"
magick -size 512x512 "radial-gradient:${BRAND}-${BRAND_DARK}" \
  -gravity center -font "$FONT" -fill white \
  -pointsize 200 -annotate +0-30 "AB" \
  -pointsize 44 -fill "#e9d5ff" -annotate +0+120 "HAIR STUDIO" \
  "$OUT/seed-logo.png"
echo "   ok          → seed-logo.png"

echo "🖼️  Hero"
fetch seed-hero.jpg            1521590832167-7bcbfaa6381f 1600x900 "Salón"

echo "✂️  Servicios"
fetch seed-svc-corte-dama.jpg       1562322140-8baeececf3df   800x600 "Corte dama"
fetch seed-svc-corte-caballero.jpg  1599351431202-1e0f0137899a 800x600 "Corte caballero"
fetch seed-svc-barba.jpg            1622287162716-f311baa1a2b8 800x600 "Barba"
fetch seed-svc-afeitado.jpg         1503951914875-452162b0f3f1 800x600 "Afeitado"
fetch seed-svc-color.jpg            1595476108010-b4d1f102b1b1 800x600 "Color"
fetch seed-svc-mechas.jpg           1580618672591-eb180b1a973f 800x600 "Mechas"
fetch seed-svc-peinado.jpg          1559599101-f09722fb4948   800x600 "Peinado"
fetch seed-svc-barba-premium.jpg    1605497788044-5a32c7078486 800x600 "Barba premium"

echo "🧴 Productos"
fetch seed-prod-shampoo.jpg     1585232351009-aa87416fca90 600x600 "Shampoo"
fetch seed-prod-acond.jpg       1610705267928-1b9f2fa7f1c5 600x600 "Acondicionador"
fetch seed-prod-serum.jpg       1608248543803-ba4f8c70ae0b 600x600 "Sérum"
fetch seed-prod-aceite.jpg      1556228578-8c89e6adf883   600x600 "Aceite de argán"
fetch seed-prod-crema.jpg       1571781926291-c477ebfd024b 600x600 "Crema de peinar"
fetch seed-prod-kit.jpg         1598440947619-2c35fc9aa908 600x600 "Kit cuidado"
fetch seed-prod-tonico.jpg      1631730486572-226d1f595b68 600x600 "Tónico"
fetch seed-prod-cera.jpg        1626766632648-78a3a3f6f8a4 600x600 "Cera modeladora"

echo "🧑‍🎤 Empleados"
fetch seed-emp-andrea.jpg    1494790108377-be9c29b29330 500x500 "Andrea"
fetch seed-emp-bryan.jpg     1500648767791-00dcc994a43e 500x500 "Bryan"
fetch seed-emp-camila.jpg    1438761681033-6461ffad8d80 500x500 "Camila"
fetch seed-emp-diego.jpg     1507003211169-0a1dd7228f2d 500x500 "Diego"
fetch seed-emp-valentina.jpg 1544005313-94ddf0286df2   500x500 "Valentina"

echo "✅ Listo. Imágenes en $OUT"
ls -1 "$OUT"/seed-* | wc -l | xargs echo "   archivos seed-*:"
