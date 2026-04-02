# Toori360 Platform

Plataforma B2B de gestión integral de mantenimiento, incidencias y servicios para inmobiliarias y administraciones.

**Stack:** Next.js 14 + NestJS + Expo + Prisma + PostgreSQL (Supabase) + Redis + Turborepo

## Setup inicial

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 3. Levantar servicios locales (Docker)

```bash
docker-compose up -d
```

### 4. Base de datos

```bash
pnpm db:generate   # Generar Prisma Client
pnpm db:migrate    # Crear tablas
pnpm db:seed       # Datos de ejemplo
```

### 5. Iniciar desarrollo

```bash
pnpm dev           # Web + API en paralelo
pnpm dev:web       # Solo Next.js (port 3000)
pnpm dev:api       # Solo NestJS (port 3001)
```

## URLs

| Servicio | URL |
|----------|-----|
| Web (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/api/docs |
| Prisma Studio | http://localhost:5555 |
| Redis Commander | http://localhost:8081 |

## Credenciales demo

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin@demo.com | Demo1234! | Administrador |
| operador@demo.com | Demo1234! | Operador |
| supervisor@demo.com | Demo1234! | Supervisor |
| inquilino@demo.com | Demo1234! | Solicitante |
| proveedor@demo.com | Demo1234! | Proveedor |

## Estructura

```
toori360/
├── apps/
│   ├── web/          # Next.js 14 (App Router) — Admin dashboard
│   ├── api/          # NestJS — Backend API REST
│   └── mobile/       # React Native / Expo (Fase 3)
├── packages/
│   ├── shared/       # Types, constants, validators
│   ├── ui/           # Componentes UI compartidos
│   └── db/           # Prisma schema + migrations + seed
└── docker-compose.yml
```

## Roadmap

- ✅ **Fase 1:** Fundación — monorepo, auth, CRUD base, UI base
- 🔧 **Fase 2:** Motor de Tickets — estados, timeline, eventos, realtime
- ⏳ **Fase 3:** Presupuestos y Coordinación — quotes, visitas, evidencias
- ⏳ **Fase 4:** Dashboard + WhatsApp + IA
