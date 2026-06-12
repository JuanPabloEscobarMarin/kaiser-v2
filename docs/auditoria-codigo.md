# Auditoría de código — Kaiser (frontend + backend)

Revisión completa en busca de problemas de seguridad, lógica, código muerto y
mala estructura. Auditoría: 2026-06-12. **Resolución: 2026-06-12 — 39 de 40
ítems resueltos** (el #3 se omitió por decisión explícita del negocio).

---

## 🔴 Seguridad — alta prioridad

1. ✅ **RESUELTO — Registro público abierto.** Eliminado `POST /api/auth/register` completo (ruta, servicio, validator) y su contraparte muerta en el frontend (`authApi.register`, `AuthContext.register`). Las cuentas solo las crea el admin vía `/employees/:id/...`. Cierra también el vector de abuso de storage por anónimos.

2. ✅ **RESUELTO — Error middleware filtraba mensajes internos.** En producción ahora responde `"Internal server error"` genérico; los mensajes reales solo salen en desarrollo (`error.middleware.ts`).

3. ⏭️ **OMITIDO a pedido** — Upsert de clientes sin verificación desde `/appointments/book`. Se conserva el comportamiento actual ("si ya reservaste con esta cédula, vinculamos tu historial") por decisión de producto.

4. ✅ **RESUELTO — Upload confiaba en el mimetype declarado.** `resources.service.ts` ahora valida por **magic bytes** (JPEG/PNG/WebP/GIF) y la extensión se deriva SIEMPRE del tipo detectado, nunca del nombre original del cliente. El `ContentType` guardado en S3 es el detectado.

5. ✅ **RESUELTO — Dependencias con CVEs.** Frontend: **0 vulnerabilidades** (xlsx actualizado a 0.20.3 desde el registry oficial de SheetJS — corrige prototype pollution y ReDoS — y `npm audit fix`). Backend: de 17 a **3 moderate residuales**, todas en la cadena dev-only del CLI de Prisma (`@prisma/dev → @hono/node-server`); el "fix" forzaría un downgrade breaking a Prisma 6, no afecta runtime. Residual aceptado y documentado.

6. ✅ **RESUELTO — Secretos y archivos de entorno.** `backend/.gitignore` endurecido a `.env` + `.env.*` + `!.env.example` (el patrón viejo `*.env` NO cubría `.env.local` ni `.env.supabase`); duplicado `.env-example` eliminado. Verificado: ningún archivo con secretos quedó trackeado en el commit de rescate.

7. ✅ **RESUELTO — Seed peligroso.** `prisma/seed.ts` ahora se niega a correr con `NODE_ENV=production` (salvo `SEED_FORCE=1`) y la contraseña del admin sale de `SEED_ADMIN_PASSWORD` (con aviso si se usa el default de desarrollo).

8. ✅ **RESUELTO — Sin protección CSRF explícita.** Middleware en `app.ts`: las requests mutantes (no GET/HEAD/OPTIONS) con header `Origin` fuera de la allowlist de CORS reciben 403. Complementa `sameSite: lax`.

9. ✅ **RESUELTO — trust proxy.** Nueva variable `TRUST_PROXY` (saltos de proxy confiables) aplicada en `app.ts`; el rate limit ve la IP real detrás de un reverse proxy.

## 🟡 Seguridad — media/baja

10. ✅ **RESUELTO — 403 disfrazado de 401.** `requireAdmin`/`requireEmployee` reescritos sin anidamiento: autentican y luego verifican rol, lanzando `ForbiddenException` (403) real.

11. ✅ **RESUELTO — Logout no revocaba.** Los JWT llevan `jti`; el logout añade el token a una denylist en memoria hasta su expiración (`revokeToken` en `lib/jwt.ts`, con purga periódica). Nota: con múltiples instancias habría que moverla a Redis.

12. ✅ **RESUELTO — Servicios inactivos expuestos.** `GET /services` usa `optionalAuth`: el público recibe solo activos; el admin sigue viendo el catálogo completo.

13. ✅ **RESUELTO — Search 500 con `?q[]=`.** El controller valida que `q` sea string antes de operar.

14. ✅ **RESUELTO — Slug sin sanitizar en S3.** `s3Driver.get` aplica `path.basename(slug)` igual que el driver local.

## 🟠 Lógica

15. ✅ **RESUELTO — Race condition en reservas.** `createWithBooking` re-valida el solape DENTRO de una transacción `Serializable`; los fallos de serialización (P2034) se convierten en `ConflictException`. Dos requests simultáneas ya no pueden doble-reservar.

16. ✅ **RESUELTO — Empleados desactivados irrecuperables.** `EmployeeRepository.all` acepta `includeInactive`; el admin ve (y puede reactivar) empleados con `state=false`. El stat "Empleados activos X/Y" vuelve a tener sentido.

17. ✅ **RESUELTO — Citas cruzando medianoche.** La consulta de disponibilidad filtra por solape real (`endsAt > dayStart AND scheduledAt < dayEnd`), no solo por citas que empiezan ese día.

18. ✅ **RESUELTO — Grilla de 30 min no forzada.** El booking público exige segundos/ms en cero y alineación exacta a la grilla ofrecida (`(startMin - apertura) % 30 === 0`).

19. ✅ **RESUELTO (por diseño, documentado)** — `PUT /appointments/:id` es admin-only y conserva deliberadamente la misma capacidad que `adminBook` (reprogramar fuera de horario es caso de uso del mostrador). El docstring del método ahora lo deja explícito; el no-solape duro se aplica siempre.

20. ✅ **RESUELTO — Toasts perdidos.** `notify()` ya no descarta avisos: el nuevo reemplaza al visible y reinicia sus timers.

21. ✅ **RESUELTO (documentado)** — La convención "hora de pared = UTC literal" quedó documentada en un único lugar (`backend/src/lib/business-hours.ts`, cabecera) con las reglas para backend y frontend y la advertencia de qué NO hacer. Cambiarla de verdad exigiría migración de datos coordinada.

22. ✅ **RESUELTO — Card de horario vacía al cargar.** Home muestra skeleton de 3 líneas mientras `business` es null.

23. ✅ **RESUELTO — validate() descartaba transforms de query/params.** El resultado parseado por Zod queda en `req.validated[source]`, disponible para los controllers.

## ⚪ Código muerto / sin uso

24-29. ✅ **RESUELTOS — Eliminados:** `DatePicker.tsx`, `layouts/Hero/` (y su re-export), `core/exceptions/{NotFoundException,RuntimeException}.ts`, `lib/utils.ts`, `assets/react.svg`, dependencia `cally` desinstalada.

30. ✅ **RESUELTO** — `AuthContext.register` + `authApi.register` eliminados (junto con el endpoint, ver #1).

31. ✅ **RESUELTO** — `frontend/TODO.md` actualizado: refleja lo completado y apunta a los documentos de auditoría vivos.

32. ✅ **RESUELTO** — `backend/src/lib/uuid.ts` eliminado.

## 🔵 Estructura

33. ✅ **RESUELTO** (commit `8211139`) — gitlinks convertidos a directorios trackeados; 200+ archivos fuente ahora versionados.

34. ✅ **RESUELTO** (commit `8211139`) — `.DS_Store` eliminado e ignorado; working tree limpio.

35. ✅ **RESUELTO — Deuda de lint: 20 → 0 errores.** (a) regla `no-unused-vars` con convención `^_`; (b) los 14 `set-state-in-effect` corregidos con los patrones recomendados: estado inicial `true` sin `setLoading(true)` síncrono en montaje, sincronización prop→estado durante render (DateRangeFilter, paginación de citas), `setState` tras `await` (AuthContext, BrandingProvider), reset diferido (Booking); (c) los 2 `react-refresh` resueltos extrayendo `AuthContext` y `BrandingContext`+`useBranding` a archivos `context.ts` propios.

36. ✅ **RESUELTO** — `EmployeeManager/EmployeeManager.tsx` → `EmployeeManager/index.tsx`, consistente con los demás managers.

37. ✅ **RESUELTO — Duplicación.** Nuevo `lib/format.ts` como **única** fuente de `formatPrice`/`formatCurrency`/`initials` — verificado: `grep "new Intl.NumberFormat"` solo aparece en `lib/format.ts` (se consolidaron también las 6 copias que vivían en las MobileLists/TableRows de Product/Inventory/Employee). Los 6 `*FabButton` idénticos reemplazados por un `FabActions` compartido; helper zod `isoDate` extraído a `validators/common.ts`. *Nota:* las 6 MobileLists/DesktopTables siguen separadas por entidad — difieren en campos y un genérico forzado costaría legibilidad; se acepta como especialización legítima.

38. ✅ **RESUELTO — Type-safety.** Cero `: any` en `backend/src` (verificado por grep): `employee.repository` tipado con `Prisma.EmployeeGetPayload`, `toPublicEmployee` en `employee.service` con interfaz propia, y `service.repository` cambia `as any` por compactación de `undefined` + casts estrechos contra los tipos generados de Prisma.

39. ✅ **RESUELTO** — Queda 1 solo ejemplo (`.env.example`); `.env`/`.env.local`/`.env.supabase` son los entornos reales del flujo `use-db.sh` y están todos ignorados por git.

40. ✅ **RESUELTO** — Último spinner de carga de página (TimeOff) reemplazado por skeleton; los spinners restantes son feedback inline de botones (intencionales).

---

## Verificación final

- `tsc` limpio en frontend y backend; `eslint src --quiet`: **0 errores**.
- `npm run build` (frontend) exitoso; página pública verificada en preview sin errores de consola.
- `npm audit`: frontend **0**; backend 3 moderate residuales dev-only (documentadas en #5).
