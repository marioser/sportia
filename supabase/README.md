# Supabase - Migraciones

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `001_initial_schema.sql` | Esquema inicial: enums, tablas, índices, triggers |
| `002_rls_policies.sql` | Políticas de Row Level Security |
| `003_functions_views.sql` | Funciones helper, vistas y funciones de ranking |

## Ejecutar migraciones

### Opción 1: SQL Editor en Supabase Dashboard

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Abre **SQL Editor**
3. Ejecuta cada archivo en orden:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_functions_views.sql`

### Opción 2: Supabase CLI

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link proyecto
supabase link --project-ref <tu-project-ref>

# Ejecutar migraciones
supabase db push
```

## Modelo de datos

```
profiles ←──────┐
    │           │
    ▼           │
club_members ───┼──→ clubs
    │           │
    ▼           │
athletes ←──────┘
    │
    ├──→ coach_athlete ←── coaches
    │
    ▼
training_sessions
    │
    ▼
training_sets ──→ tests ──→ swim_strokes
    │
    ├──→ training_splits
    └──→ training_strokes
```

## Funciones principales

| Función | Descripción |
|---------|-------------|
| `get_club_rankings(club_id, test_id, ...)` | Rankings de un club por prueba |
| `get_direct_competitors(athlete_id, test_id, time_ms, mode)` | 3 más rápidos y 3 más lentos |
| `calculate_swimming_metrics(training_set_id)` | DPS, frecuencia, velocidad, índice |
| `ms_to_time_string(ms)` | Convierte ms a formato `mm:ss.cc` |
| `calculate_age(birth_date)` | Edad actual |
| `get_age_category(age)` | Categoría: `10-`, `11-12`, etc. |

## Vistas

| Vista | Descripción |
|-------|-------------|
| `athletes_with_age` | Atletas con edad y categoría calculada |
| `training_sessions_with_load` | Sesiones con carga de entrenamiento |
| `athlete_best_times` | Mejores marcas por atleta y prueba |
