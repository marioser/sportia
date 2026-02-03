# SPORTIA

Plataforma de Gestión Deportiva y Análisis de Rendimiento

> Measure what matters. Improve what counts.

## Stack

- **Frontend**: Nuxt 3 (PWA, mobile-first)
- **Backend**: FastAPI (solo lógica compleja)
- **Base de datos**: Supabase (PostgreSQL + Auth)
- **Cache**: DragonflyDB

## Estructura

```
/sportia
├── apps/
│   ├── web/          # Frontend Nuxt 3
│   └── api/          # Backend FastAPI
├── packages/
│   ├── shared/       # Tipos y helpers compartidos
│   └── config/       # Catálogos y constantes deportivas
├── infra/
│   ├── docker/       # Dockerfiles
│   └── caprover/     # Configuración de despliegue
└── docs/             # Documentación
```

## Requisitos

- Node.js 22+
- pnpm 9+
- Python 3.11+
- Docker (opcional, para cache local)

## Inicio rápido

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
# Frontend
cp apps/web/.env.example apps/web/.env

# Backend
cp apps/api/.env.example apps/api/.env
```

Edita los archivos `.env` con tus credenciales de Supabase.

### 3. Iniciar cache (opcional)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Desarrollo

```bash
# Todos los servicios
pnpm dev

# Solo frontend
pnpm dev:web

# Solo backend (requiere entorno virtual Python)
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia todos los servicios en desarrollo |
| `pnpm dev:web` | Inicia solo el frontend |
| `pnpm build` | Compila todos los servicios |
| `pnpm lint` | Ejecuta linters |
| `pnpm typecheck` | Verifica tipos |

## Documentación

- [Alcance del proyecto](./alcance-sportia.md)
