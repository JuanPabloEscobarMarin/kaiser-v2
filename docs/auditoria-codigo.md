# Auditoría de código — Kaiser (frontend + backend)

Revisión completa en busca de problemas de seguridad, lógica, código muerto y
mala estructura. **Solo listado — nada está corregido.** Fecha: 2026-06-12.

---

## 🔴 Seguridad — alta prioridad

1. **Registro público abierto sin UI que lo use** — `backend/src/routes/auth.routes.ts` expone `POST /api/auth/register` sin autenticación (limitado a 30 req/15min). Cualquiera crea cuentas `CLIENT`. Encadenado con que `POST /api/resources/images` solo pide `requireAuth`, un anónimo puede: registrarse → loguearse → subir imágenes de hasta 5 MB al bucket (abuso de almacenamiento). El frontend ni siquiera tiene página de registro.

2. **El error middleware filtra mensajes internos en producción** — `backend/src/middlewares/error.middleware.ts`: para errores que no son `HttpException` responde `error.message` tal cual (mensajes de Prisma/PG/SDK con detalles de esquema o conexión). En producción debería ser un mensaje genérico.

3. **Upsert de clientes sin verificación desde endpoint público** — `POST /api/appointments/book` → `CustomerRepository.upsert`: quien conozca (o adivine) una cédula **sobrescribe** el `fullName`/`phone` del cliente existente y vincula reservas a su historial. Manipulación/enumeración de PII por cédula, sin autenticación.

4. **Upload valida solo el mimetype declarado por el cliente** — `backend/src/services/resources.service.ts`: no hay validación por magic bytes; la extensión sale del `originalname` del atacante (con fallback `.bin`); en S3 el `ContentType` guardado es el declarado. Permite almacenar contenido no-imagen (HTML/SVG) bajo extensión arbitraria. Falta allowlist de extensiones y sniffing de contenido.

5. **Dependencias con CVEs conocidos** —
   - Frontend: 7 vulnerabilidades (2 moderate, 5 high). `xlsx@0.18.5`: prototype pollution (GHSA-4r6h-8v6p-xvw6) y ReDoS (GHSA-5pgg-2g8v-p4x9) — **sin fix en npm** (SheetJS se mudó de registry).
   - Backend: 17 vulnerabilidades (6 moderate, 11 high), incl. `path-to-regexp` ReDoS y `qs` DoS — la mayoría se arregla con `npm audit fix`.

6. **Secretos reales fuera de control de versiones y sin respaldo** — `backend/.env`, `.env.local`, `.env.supabase` contienen `JWT_SECRET`, `DATABASE_URL` y credenciales de Supabase. Como el backend no es un repo git real (ver Estructura #1), no hay trazabilidad; al arreglar el git hay riesgo de commitearlos por accidente. Además conviven `.env-example` Y `.env.example` (duplicados).

7. **Seed con credenciales por defecto y borrado total sin guard** — `backend/prisma/seed.ts`: crea `admin`/`admin123` hardcodeado y ejecuta `deleteMany()` sobre TODAS las tablas sin chequear `NODE_ENV`. Si se corre contra producción (p. ej. `db:bootstrap`), borra los datos y deja una cuenta admin conocida.

8. **Sin protección CSRF explícita** — JWT en cookie con `sameSite: "lax"` mitiga POST cross-site, pero no hay token anti-CSRF; toda la defensa de mutaciones recae en lax + CORS.

9. **Falta `app.set("trust proxy", …)`** — con `express-rate-limit` activo, detrás de un proxy/CDN real todas las requests comparten la IP del proxy: o se bloquea a todos los usuarios o no se limita a nadie.

## 🟡 Seguridad — media/baja

10. **`requireAdmin`/`requireEmployee` convierten el 403 en 401** — `backend/src/middlewares/auth.middleware.ts`: el `throw` del check de rol ocurre dentro del callback que `requireAuth` ejecuta en su `try`, y el `catch` lo re-lanza como `401 Unauthorized`. El `403 Forbidden` nunca llega al cliente; cualquier error del handler interno también se disfraza de 401.

11. **Logout no revoca el token** — solo borra la cookie; el JWT sigue siendo válido las 2 h restantes. No hay blacklist ni versión de token.

12. **`GET /api/services` (público) devuelve servicios inactivos** — `ServiceRepository.all()` no filtra `state`; precios y descuentos de servicios no publicados quedan expuestos. El filtrado se hace client-side en Home/Booking.

13. **Search castea `req.query.q` sin validar** — `backend/src/controllers/search.controller.ts`: `?q[]=a&q[]=b` produce un array → `raw.replace` lanza TypeError → 500. Falta validación de tipo (los demás endpoints usan zod; este no).

14. **El driver S3 no sanitiza el slug** — `s3Driver.get` interpola `images/${slug}` directo en la Key. El driver local sí usa `path.basename`. Riesgo bajo (S3 no normaliza `../`), pero inconsistente.

## 🟠 Lógica

15. **Race condition en reservas (TOCTOU)** — `appointment.service.createBooking`: `conflicts()` y `createWithBooking()` no comparten transacción y no hay constraint de exclusión en la DB → dos requests simultáneas al mismo slot pueden doble-reservar. (Contraste: las ventas sí lo hacen bien con decremento condicional en transacción.)

16. **Empleados desactivados quedan irrecuperables** — `EmployeeRepository.all()` hardcodea `state: true`. El delete es soft (`state=false`), pero ni siquiera el admin puede listarlos → no hay forma de reactivarlos desde la UI. Efecto secundario: el stat del Dashboard "Empleados activos X/Y" siempre muestra X/X.

17. **Citas que cruzan medianoche no cuentan en availability** — `byEmployeeOnDateLean` filtra `scheduledAt >= dayStart`: una cita admin de ayer 23:30→00:30 no aparece al calcular la disponibilidad de hoy a las 00:00.

18. **El booking público no fuerza la grilla de 30 min** — `scheduledAt: "…T10:07:23Z"` pasa todos los checks (horario, no-solape) y fragmenta la agenda que ven los demás clientes (los slots ofrecidos siguen siendo cada 30 min pero chocan parcialmente).

19. **`PUT /appointments/:id` nunca valida horario laboral ni bloqueos** — al reprogramar solo chequea conflicto con otras citas; puede mover citas a días cerrados o sobre bloqueos del empleado (para admin es "por diseño", pero es la única vía de edición y no hay variante validada).

20. **El sistema de notificaciones pierde mensajes** — `NotifyProvider.notify()`: `if (isVisible) return` descarta el segundo toast si llega en <5 s; peor, como `setMessage` ya corrió, el toast visible **cambia su texto a mitad de vida** sin reiniciar su timer.

21. **Convención horaria frágil: la "hora del negocio" ES UTC** — slots, business hours y el frontend (`getUTCHours` en `formatTime`) asumen que la hora de pared se guarda como UTC literal. Funciona mientras nada use hora local real (Colombia = UTC-5), pero cualquier `toLocaleTimeString` o integración externa mostrará horas corridas. No está documentado en un único lugar.

22. **Card de horarios vacía mientras carga** — `Home`: si `business` aún es null, `hours = []` y la card "Horario" del bloque contacto se renderiza vacía sin estado de carga (los servicios sí tienen "Cargando…").

23. **`validate()` de query/params no aplica las transformaciones de zod** — `validate.middleware.ts` solo reasigna `req.body`; para `query`/`params` los datos parseados/defaults de zod se descartan (hoy no muerde porque esos schemas no transforman, pero es una trampa lista para activarse).

## ⚪ Código muerto / sin uso

**Frontend:**
24. `src/ui/components/DatePicker.tsx` — ningún import (Booking usa `react-day-picker` directo).
25. `src/ui/layouts/Hero/index.tsx` — sin uso; `src/ui/layouts/index.ts` lo re-exporta y ese index tampoco lo importa nadie relevante.
26. `src/core/exceptions/NotFoundException.ts` y `RuntimeException.ts` — solo se referencian entre sí; nadie los usa.
27. `src/lib/utils.ts` — sin imports.
28. `src/assets/react.svg` — sin uso.
29. Dependencia `cally` en `package.json` — cero imports.
30. `AuthContext.register` (y su `authApi.register`) — exportado, nunca llamado desde ninguna página.
31. `frontend/TODO.md` — desactualizado: lista como pendientes la vista de agendar cita y la lógica de asignación, que ya existen.

**Backend:**
32. `src/lib/uuid.ts` (`isUuid`) — sin imports en todo el backend.

## 🔵 Estructura

33. **El repositorio git está roto** — `backend` y `frontend` figuran como *gitlinks* (modo 160000, commits `25ff4ef`/`a43771f`) sin `.gitmodules` y sin `.git` interno. Consecuencia: **todo el código fuente está fuera de control de versiones**; el repo raíz solo trackea 6 archivos. Una pérdida de disco = pérdida total.

34. **Working tree sucio de base** — `.DS_Store` sin ignorar en la raíz; `docs/loop.md` borrado y `.claude/loop.md` sin commitear.

35. **Deuda de lint conocida (~20 errores)** — `react-hooks/set-state-in-effect` (el patrón `setLoading(true)` síncrono al inicio de efectos de fetch) repetido en los 6 managers, Dashboard, Reports, contexts; 2 errores `react-refresh/only-export-components` en `AuthContext` y `BrandingProvider`; `_id`/`_u` sin usar (×2) en `Settings/index.tsx`.

36. **Inconsistencia de naming** — `EmployeeManager/EmployeeManager.tsx` mientras los otros 7 managers usan `*/index.tsx`.

37. **Duplicación masiva de código** —
    - `initials()` copiado en ≥4 archivos (Home, ServiceDetail, TopCustomers, ProfileSettingsModal, employee-portal backend).
    - `formatPrice`/`formatCurrency` con la misma config `Intl.NumberFormat("es-CO")` en ≥5 archivos.
    - 6 FabButtons, 6 MobileLists y 6 DesktopTables prácticamente idénticos entre managers (solo cambian campos).
    - Helper zod `isoDate` duplicado en `appointment.validators.ts` y `sale.validators.ts`.
38. **Pérdida de type-safety deliberada** — `employee.repository`/`employee.service` usan `any` en los mappers; `service.repository` castea `data as any` en create/update; `loadBusinessHours` castea settings con `as unknown as`.

39. **Cuatro archivos de entorno en backend** — `.env`, `.env.local`, `.env.supabase`, más dos ejemplos (`.env-example` y `.env.example`). Confuso y propenso a divergencia.

40. **Spinners residuales vs skeletons** — quedan `loading-spinner` puntuales (TimeOff, botones) tras la migración a skeletons; menor, pero el criterio quedó mixto.

---

### Sugerencia de orden de ataque (cuando decidas arreglar)
1. Git roto (#33) — todo lo demás depende de poder versionar.
2. Seguridad alta: #1, #2, #3, #7 (rápidos y de alto impacto), luego #4, #5.
3. Lógica de negocio: #15 (doble reserva) y #16 (empleados irrecuperables).
4. Limpieza: código muerto (#24-32) y duplicación (#37) como PR mecánico.
