#!/bin/bash
# setup-local.sh — Configuración inicial del entorno local de Toori360
set -e

echo ""
echo "========================================="
echo "  Toori360 — Setup de entorno local"
echo "========================================="
echo ""

# 1. Verificar prerequisitos
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js no está instalado. Instalá Node 20+"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Instalando pnpm..."; npm install -g pnpm; }

echo "✓ Node $(node -v) | pnpm $(pnpm -v)"

# 2. Crear .env del API si no existe
if [ ! -f "apps/api/.env" ]; then
  echo ""
  echo "📝 Creando apps/api/.env desde .env.example..."
  cp apps/api/.env.example apps/api/.env
  echo ""
  echo "⚠  IMPORTANTE: Editá apps/api/.env con tus credenciales antes de continuar."
  echo "   Variables requeridas:"
  echo "   - DATABASE_URL (Supabase o PostgreSQL local)"
  echo "   - JWT_SECRET y JWT_REFRESH_SECRET (strings aleatorios largos)"
  echo "   - SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (opcional para uploads)"
  echo "   - RESEND_API_KEY (opcional para emails)"
  echo ""
  read -p "Presioná Enter cuando hayas configurado el .env..."
fi

# 3. Crear .env.local del web si no existe
if [ ! -f "apps/web/.env.local" ]; then
  echo "📝 Creando apps/web/.env.local..."
  cp apps/web/.env.example apps/web/.env.local
fi

# 4. Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
pnpm install

# 5. Generar cliente Prisma
echo ""
echo "🔧 Generando cliente Prisma..."
pnpm --filter @toori360/db db:generate

# 6. Correr migraciones
echo ""
echo "🗄  Corriendo migraciones..."
pnpm --filter @toori360/db db:migrate

# 7. Seed
echo ""
echo "🌱 Corriendo seed de datos demo..."
pnpm --filter @toori360/db db:seed

echo ""
echo "========================================="
echo "  ✅ Setup completado!"
echo "========================================="
echo ""
echo "Para levantar el proyecto:"
echo "  pnpm dev"
echo ""
echo "URLs:"
echo "  Dashboard: http://localhost:3000"
echo "  API:       http://localhost:3001/api/v1"
echo "  Swagger:   http://localhost:3001/api/docs"
echo "  Portal:    http://localhost:3000/portal"
echo ""
echo "Credenciales demo:"
echo "  admin@demo.com    / Demo1234!"
echo "  operador@demo.com / Demo1234!"
echo "  inquilino@demo.com/ Demo1234!"
echo ""
