# Kaiser 

MVP completo de reservas de barbería: cliente reserva turnos, admin gestiona servicios, empleados y citas.

## ⚠️ PENDIENTE en producción (activar correo, WhatsApp y recordatorios)

Las funciones de **confirmación de cita**, **recordatorios** y **campañas** (por correo y
WhatsApp) ya están en el código pero quedan **inactivas (no-op)** hasta configurar
credenciales. Para activarlas, agregar estas variables de entorno en Vercel → proyecto
**`kaiser-backend`** → Settings → Environment Variables (Production) y **redeployar el
backend** (`bash scripts/deploy-backend.sh`):

| Variable | Para qué | Notas |
|----------|----------|-------|
| `RESEND_API_KEY` | Enviar correos (confirmación + campañas + recordatorios) | Crear cuenta en [resend.com](https://resend.com) y **verificar un dominio** de envío. |
| `RESEND_FROM` | Remitente de los correos | Ej: `Kaiser <hola@tudominio.com>`. Con dominio verificado. |
| `TWILIO_ACCOUNT_SID` | Enviar WhatsApp (confirmación + campañas + recordatorios) | Crear cuenta en [twilio.com](https://www.twilio.com), Console → Account SID. |
| `TWILIO_AUTH_TOKEN` | Autenticar con Twilio | Console → Auth Token (junto al Account SID). |
| `TWILIO_WHATSAPP_FROM` | Remitente de WhatsApp | Con el Sandbox de Twilio: `whatsapp:+14155238886`. Con un número propio aprobado: `whatsapp:+<tu número>`. |
| `CRON_SECRET` | Proteger el cron de recordatorios | Cualquier string secreto. **Obligatorio**: sin él, `/api/cron/reminders` responde 403. Vercel lo envía solo como `Authorization: Bearer`. |

- Sin estas variables, el resto de la app funciona igual; solo el envío de correo/WhatsApp queda en no-op.
- **Twilio Sandbox** (gratis, para pruebas) solo entrega a números que primero le mandan el código "join" al número sandbox — para enviar a cualquier cliente sin ese paso hace falta un **WhatsApp Sender propio** aprobado en Twilio (proceso guiado desde su consola).
- El envío de WhatsApp es solo mensajes de texto (sin botones interactivos ni webhook entrante).
- El cron de recordatorios está en `backend/vercel.json` como **diario** (`0 13 * * *` ≈ 8am COT)
  porque la cuenta Vercel es **Hobby** (no permite crons horarios). Con plan Pro se puede subir la frecuencia.

## Despliegue a producción

Vercel **no** despliega automáticamente al hacer `git push`; el deploy es manual con los scripts:

```bash
bash scripts/deploy-all.sh        # backend + frontend
# o por separado:
bash scripts/deploy-backend.sh
bash scripts/deploy-frontend.sh
```

- Proyectos Vercel: `kaiser-backend` (API) y `kaiser-ab-hair-studio` (SPA).
- BD de producción: Supabase **`kaiser-ab-hair-studio`**. El repo se mantiene con `prisma db push`
  (la carpeta `prisma/migrations` está desactualizada respecto a `schema.prisma`); para cambios
  de esquema en prod, generar SQL con `prisma migrate diff` y aplicarlo, o usar `db push` con cuidado.

## Stack

**Backend:** Node 22+ con TS strip-only, Express 5, Prisma 7 + PostgreSQL (Supabase), Zod, bcryptjs, helmet, rate-limit.
**Frontend:** React 19, Vite 7, React Router 7, Tailwind 4 + DaisyUI 5.

## Estructura

```
kaiserVibeCoding/
├── backend/            # API REST
│   ├── prisma/         # schema + seed
│   └── src/
│       ├── config/     # env validation, S3 client
│       ├── lib/        # prisma, jwt, password, uuid
│       ├── validators/ # Zod schemas
│       ├── repositories/
│       ├── services/
│       ├── controllers/
│       ├── routes/
│       ├── middlewares/
│       └── exceptions/
└── frontend/           # SPA
    └── src/
        ├── core/
        │   ├── api/    # cliente HTTP centralizado por entidad
        │   ├── config/
        │   └── types/  # tipos compartidos con backend
        └── ui/
            ├── pages/
            ├── components/
            ├── contexts/   # auth, notify
            ├── hooks/
            └── layouts/
```

## Setup

### 1. Reactivar Supabase

El proyecto Supabase puede estar pausado. Entrar a [supabase.com/dashboard](https://supabase.com/dashboard) y darle "Restore project". Esperar 1-2 min.

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init   # crea las tablas
npm run seed                          # crea admin/cliente y servicios demo
npm run dev
```

Variables en `.env`:

```
NODE_ENV=development
PORT=3000
JWT_SECRET=al-menos-16-caracteres
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"
SUPABASE_STORAGE_URL=...
AWS_S3_REGION=...
AWS_S3_ACCESS_KEY_ID=...
AWS_S3_SECRET_ACCESS_KEY=...
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Variables en `.env`:

```
VITE_API_URL=http://localhost:3000/api
```

## Usuarios demo (después del seed)

| Usuario  | Contraseña  | Rol    |
|----------|-------------|--------|
| `admin`  | `admin123`  | ADMIN  |
| `cliente`| `client123` | CLIENT |

## Flujo de reserva (cliente)

1. `/booking` — listado de servicios + buscador con debounce
2. `/booking/:id` — elige profesional, día, hora (slots de 30 min calculados según duración del servicio y horario laboral 9–18)
3. Confirma → si no tiene sesión, redirige a `/login`
4. `/my-appointments` — lista sus citas, puede cancelar las que estén SCHEDULED

## Flujo admin

- `/admin/dashboard` — métricas totales
- `/admin/services` — CRUD servicios + upload de imagen a S3
- `/admin/employees` — CRUD empleados (delete = soft delete)
- `/admin/appointments` — listado filtrable, finalizar/cancelar citas

## Endpoints clave

```
POST   /api/auth/register        público
POST   /api/auth/login           público
POST   /api/auth/logout
GET    /api/auth/me              auth

GET    /api/services             público
GET    /api/services/:id         público
POST   /api/services             admin
PUT    /api/services/:id         admin
DELETE /api/services/:id         admin
DELETE /api/services             admin (bulk)

GET    /api/employees            público
POST   /api/employees            admin
PUT    /api/employees/:id        admin
DELETE /api/employees/:id        admin

GET    /api/appointments/availability?serviceId=&employeeId=&date=YYYY-MM-DD
POST   /api/appointments/book    auth (cliente)
GET    /api/appointments/me      auth
GET    /api/appointments         admin
PUT    /api/appointments/:id     admin
POST   /api/appointments/:id/cancel  auth

GET    /api/search?q=...         público
GET    /api/resources/images/:slug   público
POST   /api/resources/images     admin (multipart)

GET    /api/health               público
```

## Cambios respecto al proyecto original

Backend:
- Schema redesignado: `Appointment` con `scheduledAt`/`endsAt`; reemplazo de `Customer` por `Booking` con relación 1:1 a `Appointment` y FK a `User`.
- Passwords hasheadas con bcryptjs.
- JWT con secret validado al arrancar (Zod env).
- Rutas admin protegidas (antes estaban comentadas).
- Validación Zod en todos los endpoints.
- helmet + express-rate-limit (general + auth).
- Cookie httpOnly + secure-en-prod.
- Endpoint `/availability` que calcula slots libres en bloques de 30 min.
- Detección de conflictos de horario al crear/actualizar citas.
- Subida de imágenes con UUID + filtro de mime + límite 5MB.
- Repositorios sin `any`, services sin código duplicado de validación UUID.

Frontend:
- API client centralizado (`core/api`) por entidad, todos pasando por un fetch wrapper con manejo de errores.
- AuthContext real con estado, `useAuth` hook, `AdminGuard` para proteger rutas.
- Tipos compartidos (`core/types`) en lugar de interfaces dispersas.
- `ServiceDetail` con flujo de reserva completo: empleado → fecha → slot → confirmar.
- Página `MyAppointments`.
- `RegisterPage`.
- Búsqueda con debounce (antes pegaba a la API por cada tecla).
- `EmployeeManager` y `AppointmentManager` implementados.
- `Dashboard` con stats reales.
- Manejo de errores con `ApiError` + notificaciones toast.
