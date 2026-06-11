# Kaiser — Documentación de cambios y arquitectura

> Documento de referencia para las 10 modificaciones añadidas en junio 2026 y la
> revisión de seguridad/calidad posterior. Léelo antes de tocar empleados,
> citas, disponibilidad o el portal de empleados.

---

## 1. Resumen de features implementadas

| # | Feature | Capa | Notas |
|---|---------|------|-------|
| F6 | Resaltado del ítem activo en el sidebar admin | front | `NavLink` con `className` como función (`isActive`) |
| F5 | Admin puede agendar servicios ocultos (`state=false`) | full | endpoint dedicado `POST /appointments/admin-book` |
| F12 | Selector de emojis para el contenido del home | front | `EmojiPicker.tsx` (paleta + texto libre, sin dependencias) |
| F1 | Comisión `%` por servicio y empleado | full | columna `EmployeeService.commission` |
| F4 | Horario del negocio editable que **afecta** la disponibilidad | full | reemplazó campos de texto por horas estructuradas |
| F11 | Logo personalizable | full | `BusinessSettings.logoSlug` (subida a S3) |
| F2 | Bloqueo de días/horas por empleado | full | modelo `EmployeeScheduleBlock` |
| F8 | Inventario (ítems + categorías) | full | `InventoryItem`, `InventoryCategory` |
| F9 | Productos para vender (CRUD) | full | modelo `Product` |
| F13 | Portal con login propio para empleados | full | `Role.EMPLOYEE`, `Employee.userId` |

**Fuera de alcance (pendientes a pedido del cliente):** #3 ("Wasa que tire código")
y #7 (recordatorio automático por WhatsApp). No hay código para ellos.

---

## 2. Modelo de datos (Prisma)

Cambios sobre `backend/prisma/schema.prisma`. **Importante:** se aplicaron con
`prisma db push` (entorno de desarrollo), **no** con migraciones formales. Antes
de desplegar a producción hay que generar las migraciones equivalentes con
`prisma migrate dev`.

- `EmployeeService.commission Decimal @default(0)` — porcentaje 0–100.
- `BusinessSettings`: se **eliminaron** `hoursWeekday/Saturday/Sunday` (texto) y
  se agregaron, por cada franja (Weekday/Saturday/Sunday):
  `openTime* String`, `closeTime* String` (formato `"HH:MM"`), `closed* Boolean`.
  También `logoSlug String?`.
- `EmployeeScheduleBlock` (nuevo): bloqueo puntual (`date`) **o** recurrente
  (`dayOfWeek` 0=Dom…6=Sáb), con `startTime`/`endTime` o `isFullDay`.
- `InventoryCategory` + `InventoryItem` (FK opcional → `SetNull` al borrar categoría).
- `Product`.
- `Role` ahora incluye `EMPLOYEE`. `Employee.userId String? @unique` con relación
  inversa `User.employee`.

---

## 3. Modelo de seguridad (LEER antes de tocar endpoints)

### 3.1 Niveles de acceso
- **Público** (sin token): listar servicios/empleados visibles y reservar.
- **`requireAdmin`**: todo el panel admin (CRUD de servicios, empleados, citas,
  inventario, productos, settings, bloqueos, crear cuentas de empleado).
- **`requireEmployee`**: portal del empleado (`/api/employee/*`).
- **`optionalAuth`**: no rechaza; si hay token válido puebla `req.auth`. Se usa
  en endpoints públicos que cambian su respuesta para un admin autenticado.

### 3.2 Proyección de datos sensibles de empleados
`GET /employees` y `GET /employees/:id` son **públicos** (los usa el flujo de
reserva para elegir profesional). Para no filtrar datos internos:

- El controlador usa `optionalAuth` y decide según `req.auth?.role === "ADMIN"`.
- **Público** → `EmployeeService.list(serviceId)` / `getPublicById` devuelven solo
  `{ id, fullName, state, services:[{id,name}] }` (ver `toPublicEmployee`).
- **Admin** → `EmployeeService.list(serviceId, true)` / `getById` devuelven el
  registro completo (`salary`, `commission`, `phone`, `userId`).

> ⚠️ Regla: cualquier campo nuevo y sensible en `Employee`/`EmployeeService` debe
> excluirse de `toPublicEmployee` (`backend/src/services/employee.service.ts`).
> Antes de la revisión, salario y comisión se exponían públicamente.

### 3.3 Invariante de disponibilidad ↔ reserva
La lógica de "qué horarios ofrecer" y "qué reserva permitir" **comparte** las
funciones puras de `backend/src/lib/business-hours.ts`
(`resolveDaySchedule`, `isBlocked`, `timeToMinutes`). Esto evita que el cálculo de
slots y la validación al reservar se desincronicen.

`AppointmentService.createBooking(data, { adminOverride })`:
- **Cliente** (`book`): valida visibilidad del servicio, horario del negocio y
  bloqueos del empleado vía `assertWithinAvailability`. Cierra el agujero por el
  que un request manual podía reservar en día cerrado/bloqueado.
- **Admin** (`adminBook`): se salta esas validaciones (override intencional, igual
  que ignora `service.state`), pero **nunca** se salta el chequeo de
  doble-reserva (solapamiento con otra cita).

---

## 4. Mapa de archivos por feature

### Backend (`backend/src/`)
- **Horarios/disponibilidad:** `lib/business-hours.ts` (puro), `services/appointment.service.ts`.
- **Comisiones:** `validators/employee.validators.ts` (array `services:[{serviceId,commission}]`),
  `repositories/employee.repository.ts` (mapeo `commission`).
- **Bloqueos:** `routes/employee-blocks.routes.ts`, `controllers/employee-blocks.controller.ts`,
  `repositories/employee-blocks.repository.ts`, `validators/employee-blocks.validators.ts`.
  Montado en `routes/index.ts` como `"/employees/:id/blocks"` (sub-router con `mergeParams`).
- **Inventario:** `routes/inventory.routes.ts`, `controllers/inventory.controller.ts`,
  `repositories/inventory.repository.ts`, `validators/inventory.validators.ts`.
- **Productos:** `routes/product.routes.ts`, `controllers/product.controller.ts`,
  `repositories/product.repository.ts`, `validators/product.validators.ts`.
- **Portal empleado:** `routes/employee-portal.routes.ts` (`requireEmployee`),
  rutas `create-account`/`remove-account` en `routes/employee.routes.ts`,
  `lib/jwt.ts` (payload con `employeeId`), `middlewares/auth.middleware.ts`
  (`requireEmployee`, `optionalAuth`).
- **Logo/horario settings:** `validators/settings.validators.ts`, `services/settings.service.ts`.

### Frontend (`frontend/src/`)
- **APIs nuevas:** `core/api/{employee-blocks,inventory,products,employee-portal}.api.ts`
  (exportadas en `core/api/index.ts`).
- **Admin:** `ui/pages/admin/InventoryManager/`, `ui/pages/admin/ProductManager/`,
  `EmployeeManager/components/{ScheduleBlocksDrawer,CreateAccountModal}`,
  comisión en `CreateEmployeeDrawer`, columna comisión en `Dashboard`.
- **Portal empleado:** `ui/layouts/{Employee,EmployeeGuard}`,
  `ui/pages/employee/{Dashboard,Appointments}`, rutas `/employee/*` en
  `core/config/router.tsx`, redirección por rol en `pages/public/Login`.
- **Settings:** logo + time pickers en `ui/pages/admin/Settings/index.tsx`,
  emoji picker en `Settings/HomeContentSection.tsx`, `ui/components/EmojiPicker.tsx`.
- **Branding:** logo en `layouts/Admin/index.tsx` y `layouts/components/NavBar.tsx`
  (vía `business.logoSlug`).

---

## 5. Convenciones a respetar
- **Params de Express:** siempre `String(req.params.x)` (los tipos son
  `string | string[]`). No usar `req.params.x!`.
- **`exactOptionalPropertyTypes` está activo:** no asignar `undefined` explícito a
  propiedades opcionales; normalizar a `null` o construir el objeto condicionalmente
  (ver `lib/jwt.ts` y `repositories/employee-blocks.repository.ts`).
- **Decimales:** los validadores aceptan string|number y guardan string; el front
  los muestra con `Intl.NumberFormat`.
- **Imágenes:** se sube el archivo con `resourcesApi.upload()` → se guarda el
  `slug` en el campo (`urlImage`, `logoSlug`, `heroImageSlug`) → se renderiza con
  `resourcesApi.imageUrl(slug)`. Productos siguen el mismo patrón que Servicios.

---

## 6. Verificación rápida (smoke test)
```bash
cd backend && node --experimental-strip-types src/server.ts   # arranca API en :3000

# Público sanitizado (sin salary/commission/userId):
curl -s localhost:3000/api/employees

# Disponibilidad respeta horario (Domingo cerrado por defecto = 0 slots):
curl -s "localhost:3000/api/appointments/availability?employeeId=<EMP>&serviceId=<SVC>&date=<YYYY-MM-DD>"

# Reserva en día cerrado se rechaza:
curl -s -X POST localhost:3000/api/appointments/book -H 'Content-Type: application/json' \
  -d '{"serviceId":"<SVC>","employeeId":"<EMP>","scheduledAt":"<domingo>T10:00:00.000Z","customer":{...}}'
# -> {"error":"The business is closed on this day"}
```
- Typecheck: `cd backend && npx tsc --noEmit` y `cd frontend && npx tsc --noEmit`
  deben pasar sin errores.

---

## 7. Almacenamiento de imágenes (avatares, logo, hero, servicios, productos)

### Cómo funciona (flujo completo)
1. El componente sube el archivo con `resourcesApi.upload(file)` →
   `POST /api/resources/images` (multipart, campo `image`, máx 5 MB, solo imágenes).
   Requiere estar **autenticado** (`requireAuth`) — cualquier rol, no solo admin,
   para que clientes/empleados puedan cambiar su avatar.
2. El backend genera un nombre único `‹uuid›.‹ext›` (el **slug**) y guarda el binario.
3. Se persiste **solo el slug** en la columna correspondiente:
   `User.avatarSlug`, `BusinessSettings.logoSlug`/`heroImageSlug`,
   `Service.urlImage`, `Product.urlImage`.
4. Para mostrarla, el front arma la URL con
   `resourcesApi.imageUrl(slug)` → `GET /api/resources/images/‹slug›` (público).

### Dónde se guardan — dos drivers (`backend/src/services/resources.service.ts`)
Seleccionados por la env `STORAGE_DRIVER`:

- **`s3`** (default, producción): bucket `resources/images/‹slug›` en
  **Supabase Storage** vía el SDK de AWS S3 (`config/s3.ts`, `forcePathStyle`).
  Credenciales en `AWS_S3_*` + `SUPABASE_STORAGE_URL`.
- **`local`** (desarrollo offline): disco local en
  `backend/uploads/images/‹slug›` (carpeta gitignored). No requiere nube.
  El `GET` sirve el archivo infiriendo el Content-Type por extensión y protege
  contra *path traversal* con `path.basename`.

### ⚠️ Gotcha que bloqueó el cambio de avatar
La DB de dev es **local**, pero el `.env` apuntaba el storage a un proyecto de
**Supabase pausado**, que responde `HTTP 540` + `"Project paused…"`. El SDK de S3
intentaba parsear ese texto como XML y fallaba (`char 'P' is not expected`), así
que toda subida de imagen reventaba. Solución para dev: `STORAGE_DRIVER=local`.
Para volver a la nube: despausar el proyecto en Supabase y poner `STORAGE_DRIVER=s3`.

## 7-bis. Auditoría de seguridad/escalabilidad (endurecimiento)

Cambios aplicados tras una revisión integral:

- **Rate-limit en booking público** (`app.ts`): `/api/appointments/book` es público
  y crea citas + clientes, así que se limitó a 12 req/15 min por IP (vs. 300 global).
  `/admin-book` no se ve afectado.
- **Cache del singleton BusinessSettings** (`settings.service.ts`): se leía en cada
  cálculo de disponibilidad/reserva. Ahora cachea 60 s en memoria, invalidado al
  guardar configuración.
- **Query lean para disponibilidad** (`appointment.repository.ts`
  `byEmployeeOnDateLean`): la verificación de solapamientos solo necesita
  `scheduledAt`/`endsAt`; se eliminaron los joins de service/employee/customer.
- **Filtrado server-side de citas** (`GET /appointments?from&to&state`): retrocompatible
  (sin params = todas). Reduce el payload conforme crecen las citas. Validado con
  `listAppointmentsQuerySchema`.
- **Health check con ping a DB** (`/api/health`): ejecuta `SELECT 1`; responde 503 +
  `database:"down"` si la DB no está disponible.
- **Tipado**: `AppointmentRepository` usa `Prisma.AppointmentWhereInput` en vez de `any`.

> Auditoría: el gating de rutas es correcto (escrituras `requireAdmin`, portal
> `requireEmployee`, lecturas públicas; empleados con `optionalAuth` + sanitización).
> El registro no permite auto-asignarse ADMIN (Zod descarta campos extra + default
> CLIENT). JWT y cookie expiran ambos a 2 h.

## 7-ter. Portal del empleado — autogestión

El portal pasó de solo-lectura a **autoservicio** (todo derivado del JWT, nunca de
un `employeeId` del cliente → un empleado solo toca sus propios datos):

- **Estado de cita** (`PATCH /employee/me/appointments/:id/status`): el empleado
  tiene **control total** del estado de sus citas — transición libre entre
  `SCHEDULED` ↔ `FINISHED` ↔ `CANCELLED` (incluye reabrir/reagendar). Verifica
  propiedad (cita ajena → 403; estado inválido → 400). UI: botones de cambio de
  estado en el modal de detalle de "Mis citas".
- **Tiempo libre** (`GET/POST/DELETE /employee/me/blocks`): el empleado crea/borra
  sus propios bloqueos (día puntual o recurrente semanal, todo el día o franja).
  UI: nueva página `/employee/time-off`. Reutiliza `EmployeeBlocksRepository` y
  `createBlockSchema`. **Integra con el motor de reservas**: un bloqueo elimina los
  slots correspondientes (verificado: día bloqueado → 0 slots).
- Rutas del portal refactorizadas con helper `getMyEmployee(req)` (sin duplicación).
- Tipo compartido `ScheduleBlock` en `core/types`.

## 7-quater. Responsive (móvil + desktop)

Auditoría de responsividad de toda la app:
- **Portal del empleado** (`layouts/Employee`): la sidebar fija `w-48` rompía en
  móvil. Ahora: **sidebar vertical** (`hidden lg:block`) en desktop y **barra de
  navegación horizontal** con scroll en móvil/tablet. Verificado a 375px y 1280px.
- Tablas admin: ya tenían `overflow-x-auto`; Service/Employee usan patrón
  Desktop-table + Mobile-list; Products usa grid de cards (`sm:grid-cols-2 lg:grid-cols-3`).
- Drawers admin: `w-full md:w-150/120` (full en móvil). Calendario con
  `overflow-x-auto`. Login con `overflow-hidden` (decorativos no desbordan).
- Páginas públicas (Home, Booking, ServiceDetail) verificadas en móvil.

## 8. Deuda técnica / próximos pasos
- Generar **migraciones Prisma formales** (hoy solo `db push`) antes de producción.
- `update()` de citas (edición admin) tampoco valida horario/bloqueos — consistente
  con el override admin, pero revisar si se quiere endurecer.
- Las rutas `create-account`/`remove-account` viven en `employee.routes.ts`; si
  crecen, moverlas a su propio controlador/servicio.
- Considerar índice/único para evitar duplicados de `InventoryItem` por nombre si
  el negocio lo requiere (hoy permite nombres repetidos).

### Mejoras recomendadas (más allá de WhatsApp)
1. **Notificaciones (capa abstracta)**: interfaz `Notifier` con drivers email/SMS/
   WhatsApp; recordatorios de cita y confirmaciones. WhatsApp sería un driver más.
2. **Estado `NO_SHOW`** en citas + métrica de ausentismo por cliente/empleado.
3. **Paginación server-side real** en `GET /appointments` (page/pageSize) y que el
   Dashboard/Reports usen `from`/`to` en vez de traer todo y filtrar en cliente.
4. **Suite de tests**: hoy no hay. Priorizar `appointment.service` (disponibilidad,
   solapamientos, horarios, bloqueos) y los guards de auth.
5. **Auditoría/soft-delete**: `DELETE` de citas es permanente; conviene `deletedAt`
   o tabla de auditoría para trazabilidad.
6. **CSRF**: cookies con `SameSite=lax` mitiga la mayoría; si se exponen orígenes
   adicionales, añadir token anti-CSRF en mutaciones.
7. **Logging estructurado** (pino) + request-id, en vez de `console.error`.
8. **Confirmación de cita por el cliente** (token en link) y autogestión de
   cancelación/reagenda sin pasar por el admin.
9. **Índices para reportes** (p. ej. `Appointment(state, scheduledAt)`), y mover
   agregaciones pesadas de Reports a SQL en vez de JS en memoria.
