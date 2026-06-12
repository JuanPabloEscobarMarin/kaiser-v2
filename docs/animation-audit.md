# Auditoría de animaciones — Kaiser frontend

Revisión completa del frontend para identificar dónde agregar animaciones y
micro-interacciones, con opciones y variantes por zona. Construye sobre lo ya
implementado: animaciones del Login (`animate-blob`, `animate-card-in`,
`animate-pop-in`, reloj/agenda), la Landing (`Reveal`, `useReveal`,
`useSpotlight`, hover enriquecido en cards) y las utilidades existentes en
`src/index.css` (`animate-section-in`, `animate-guide-flash`, etc.).

**Regla transversal:** toda animación nueva debe respetar
`prefers-reduced-motion` (ya hay infraestructura para eso) y en móvil
preferir `transform`/`opacity` (compositor) sobre sombras/filtros animados.

---

## Estado actual

| Zona | Estado |
|---|---|
| Login | ✅ Animado (blobs, reloj, card-in, time-lapse) |
| Landing (Home) | ✅ Animado (Reveal en cascada, spotlight móvil, hover) |
| Booking (lista servicios) | ⚠️ Solo skeletons `animate-pulse`; cards entran de golpe |
| ServiceDetail (wizard reserva) | ⚠️ Tiene `animate-section-in` y `guide-flash`; pasos y slots sin cascada |
| NavBar pública | ❌ Estática |
| AdminLayout (sidebar) | ⚠️ Solo `transition-[width]` al colapsar |
| Admin Dashboard | ❌ Stats y progress aparecen de golpe, sin count-up |
| Managers CRUD (×6: servicios, empleados, citas, inventario, productos, ventas) | ❌ Tablas/listas móviles estáticas; drawers sin transición de entrada; FAB sin stagger |
| Reports (heatmap, comparativos) | ❌ Heatmap pinta de golpe; sin barridos ni tooltips animados |
| Portal empleado (4 vistas) | ❌ Stats y listas estáticas |
| BaseAlert (toast global) | ❌ Aparece/desaparece sin transición |
| Drawers (×10) | ❌ El panel no desliza; solo aparece |

---

## 1. Booking — lista de servicios

**Dónde:** `ui/pages/public/Booking/index.tsx`

- **Cascada al cargar y al buscar.** Envolver cada `ServiceCard` en `<Reveal index={i} spotlight>` igual que en Home. Ya tiene el hover enriquecido gratis (vive en `ServiceCard`).
  - *Variante A:* cascada solo en el primer render y al cambiar resultados de búsqueda (key por `query`), para que filtrar se sienta "vivo".
  - *Variante B (más sutil):* crossfade — los resultados viejos bajan opacidad 150 ms y los nuevos entran con `animate-section-in`.
- **Transición skeleton → contenido.** Hoy el skeleton desaparece de golpe. Hacer fade-out del skeleton (200 ms) mientras las cards hacen fade-in-up.
- **Buscador.** Al enfocar el input, expandirlo levemente (`focus-within:scale-[1.02]` + sombra primary) y animar el icono de lupa (pequeño wiggle al empezar a escribir).
- **Estado vacío.** El card "no se encontraron servicios" con `animate-pop-in` y un emoji/icono que haga un shake suave una vez.

## 2. ServiceDetail — wizard de reserva

**Dónde:** `ui/pages/public/ServiceDetail.tsx`

- **Cascada en grid de profesionales.** Los botones de empleado con stagger (delay `i*60ms`) usando `animate-card-in` al montar.
- **Slots de hora en cascada rápida.** Al cargar horarios, entrar en oleada (delay `i*25ms`, máx ~300 ms total). Hoy aparecen de golpe tras el skeleton.
  - *Variante:* oleada por columnas (efecto "persiana") en vez de secuencial.
- **Steps con progreso animado.** Al avanzar de paso, el `step` recién completado puede hacer un `animate-pop-in` en su check ✓.
- **Selección de slot.** Al elegir hora, el botón seleccionado con un pulso de anillo (reusar `animate-guide-flash` recortado a 1 ciclo).
- **Confirmación de reserva.** Hoy solo hay un alert verde. Opciones:
  - *Variante A (recomendada):* check circular dibujado con SVG `stroke-dashoffset` (300 ms) + confeti ligero de 8–12 partículas CSS.
  - *Variante B:* reutilizar `animate-circle-expand` del login como fondo del mensaje de éxito.

## 3. NavBar pública

**Dónde:** `ui/layouts/components/NavBar.tsx`

- **Navbar "consciente del scroll".** Al hacer scroll > 50 px: encoger altura, fondo `bg-base-100/80 backdrop-blur` y sombra; transición 300 ms. Es el cambio que más "vida" da a las páginas públicas por esfuerzo invertido.
- **Subrayado animado en links.** Pseudo-elemento `after:` que crece de 0 → 100% de ancho al hover y queda fijo en el link activo.
- **Logo.** Micro-bounce al hover (`hover:scale-105 active:scale-95`).

## 4. Admin Dashboard

**Dónde:** `ui/pages/admin/Dashboard/`

- **Count-up en stats.** Números de `AggregateStats` y stats del portal empleado animados de 0 → valor (400–600 ms, easing out). Hook reutilizable `useCountUp(value)` con respeto a reduced-motion (salta directo al valor).
  - *Variante:* solo animar al primer load, no al cambiar filtro de fechas (o sí, con duración menor de 250 ms — se siente reactivo al filtrar).
- **Entrada en cascada de las stat cards.** `<Reveal index>` (sin spotlight — es admin, no móvil-first).
- **Barras de "Servicios más populares".** Animar `<progress>` de 0 → valor con transition en `value` vía CSS (`transition: width`) usando un div propio en vez de `<progress>` si hace falta control fino.
- **Cambio de rango de fechas.** Pequeño fade del contenido (150 ms) al recalcular, para comunicar "se actualizó".

## 5. Managers CRUD (servicios, empleados, citas, inventario, productos, ventas)

**Dónde:** `ui/pages/admin/*Manager/`

Comparten estructura — una sola mejora se replica en los 6:

- **Drawers laterales (el mayor impacto).** Los 10 drawers usan DaisyUI `drawer-end` sin transición: el panel aparece de golpe. Añadir deslizamiento desde la derecha + fade del overlay:
  - *Variante A (recomendada, CSS puro):* clase utilitaria `drawer-panel-in` con `translate-x-full → 0` (250 ms, ease-out) aplicada al `div` del panel cuando `isOpen`, y `transition-opacity` en el overlay. Un solo patrón copiable a los 10 drawers.
  - *Variante B:* extraer un componente `<SideDrawer>` compartido que encapsule overlay + panel + animación + botón cerrar, y migrar drawers gradualmente (mejor a largo plazo, más trabajo).
- **Filas de tabla / cards móviles.** Entrada en oleada al cargar (stagger `i*30ms`, tope 400 ms). En móvil reusar `<Reveal spotlight>` para que la card centrada resalte, igual que la landing.
- **Selección con checkbox.** Al marcar, la fila/card sube levemente de fondo (`bg-primary/5`) con transición 200 ms; ya hay feedback de estado pero es seco.
- **FAB flower.** Los botones satélite con stagger al abrir (delay 0/40/80 ms) y `animate-pop-in`; el icono central rotando 45° al abrir (`transition-transform`).
- **Borrado.** Al eliminar elementos, colapsar la fila (height + opacity 200 ms) antes de recargar la lista, en vez del salto seco del refetch.

## 6. Reports

**Dónde:** `ui/pages/admin/Reports/`

- **Heatmap con barrido.** Las celdas aparecen con delay diagonal (`(fila+col)*15ms`) y fade-in — efecto "onda" muy vistoso y barato (solo opacity).
  - *Variante:* delay por columna (barrido horario de izquierda a derecha).
- **Celdas interactivas.** `hover:scale-110` + `z-10` + tooltip DaisyUI en vez del `title` nativo.
- **Comparativos de periodo.** Flechas ↑/↓ de variación con `animate-pop-in` y color (success/error) al entrar con `Reveal`.
- **TopCustomers / ReturnRate.** Mismas barras animadas que el Dashboard (crecen de 0 al montar).

## 7. Portal empleado

**Dónde:** `ui/pages/employee/`

- **Stats con count-up** (mismo hook del Dashboard admin).
- **Saludo.** El 👋 de "Hola, X" con un wave de 1–2 ciclos al montar (rotate keyframes en el emoji).
- **Listas de citas/ventas.** Stagger suave al montar; en móvil `<Reveal spotlight>`.
- **TimeOff.** Al crear un bloqueo, la nueva entrada entra con `animate-section-in`; al aprobar/rechazar, transición de color del badge.

## 8. Componentes globales

- **BaseAlert (toast) — prioridad alta.** Hoy aparece y desaparece de golpe en `fixed bottom-5`. Añadir:
  - entrada: slide-up + fade (250 ms, `cubic-bezier(0.22,1,0.36,1)`);
  - salida: fade + slide-down (200 ms) antes de desmontar (requiere retrasar el unmount en `NotifyProvider` ~200 ms);
  - *Variante:* barra de progreso del tiempo restante en el borde inferior del alert.
- **ProfileSettingsModal.** Entrada con `animate-card-in` en el panel + fade del backdrop; cambio de tab perfil/contraseña con crossfade horizontal (slide 8 px).
- **AdminLayout sidebar.** Al colapsar/expandir, además del width: fade de las etiquetas (`opacity` con delay 100 ms) para que el texto no "salte"; icono activo con un dot indicador que se desliza entre items (*variante avanzada*).
- **Skeletons.** Unificar: donde hoy hay `loading-spinner` centrado (Dashboard, managers, portal empleado) usar skeletons tipo Booking — perciben menos espera y permiten el crossfade skeleton→contenido.

---

## Priorización sugerida

| # | Cambio | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | Drawers con slide-in (patrón único ×10) | Alto — se usa en toda la admin | Bajo |
| 2 | BaseAlert animado | Alto — visible en cada acción | Bajo |
| 3 | Booking con `Reveal` en cascada | Alto — página pública principal | Muy bajo (ya existe `Reveal`) |
| 4 | NavBar scroll-aware + subrayados | Alto en públicas | Bajo |
| 5 | Count-up en stats (admin + empleado) | Medio-alto | Bajo (1 hook) |
| 6 | Slots/profesionales en cascada (ServiceDetail) | Medio | Bajo |
| 7 | Heatmap con barrido diagonal | Medio (efecto "wow" en reports) | Bajo |
| 8 | FAB stagger + filas en oleada | Medio | Medio |
| 9 | Éxito de reserva con check SVG/confeti | Medio (momento clave del cliente) | Medio |
| 10 | Skeletons unificados + crossfade | Medio | Medio |

Herramientas: todo se puede hacer con CSS + IntersectionObserver ya presentes
(sin librerías). Si más adelante se quiere física de resortes o layout
animations (reordenar listas al filtrar), evaluar `motion` (framer-motion),
pero no es necesario para nada de lo listado.
