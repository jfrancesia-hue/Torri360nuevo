# CLAUDE.md — Toori360 Platform

## IDENTIDAD DEL PROYECTO

Toori360 es una plataforma B2B de gestión integral de mantenimiento, incidencias y servicios para inmobiliarias, administraciones de consorcios, barrios privados, constructoras y empresas con facility management.

**Visión:** Ser el sistema operativo de mantenimiento y servicios para propiedades y organizaciones en Latinoamérica.
**Mantra:** VELOCIDAD + ORDEN + TRAZABILIDAD + CONFIANZA
**Empresa:** Nativos Consultora Digital — Catamarca, Argentina
**Fundador:** Jorge Eduardo Francesia

## REGLAS PARA CLAUDE CODE

1. **Siempre filtrar por tenant_id** — Nunca hacer queries sin tenant.
2. **Validar transiciones de estado** — Usar el mapa de transiciones válidas.
3. **Registrar todo en TicketEvent** — Cada acción sobre un ticket debe crear un evento.
4. **UI en español** — Labels, mensajes, placeholders, botones siempre en español.
5. **Código en inglés** — Variables, funciones, clases, commits en inglés.
6. **Tipos estrictos** — Nunca usar `any`. TypeScript strict en todo el proyecto.
7. **Componentes shadcn/ui** — No reinventar componentes.
8. **Formato de ticket** — `TK-YYYYMM-XXXX` (autogenerado, secuencial por tenant).
9. **Respuestas de API** — Formato estándar: `{ data, meta?, error? }`.
10. **Archivos** — Subir a Supabase Storage, nunca guardar en filesystem.
