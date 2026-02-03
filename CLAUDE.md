# SPORTIA - Memoria del Proyecto

> Measure what matters. Improve what counts.

## Descripción

Plataforma de gestión deportiva y análisis de rendimiento. MVP enfocado en **natación**, con arquitectura preparada para ciclismo y atletismo.

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Frontend | Nuxt 3 + Tailwind | PWA mobile-first |
| UI Library | Nuxt UI v2 | Componentes pre-construidos |
| Backend | FastAPI | Solo lógica compleja (rankings, importaciones) |
| Base de datos | Supabase (PostgreSQL) | Auth + CRUD + RLS |
| Cache | DragonflyDB | Rankings y comparaciones |
| Gráficas | ECharts + vue-echarts | Visualización de métricas |

## Estructura del Monorepo

```
/sportia
├── apps/
│   ├── web/                # Nuxt 3 (PWA)
│   └── api/                # FastAPI
├── packages/
│   ├── shared/             # Tipos, helpers, database.types.ts
│   └── config/             # Catálogos deportivos
├── infra/docker/           # Dockerfiles
├── supabase/migrations/    # SQL migrations (ya aplicadas)
└── docs/
```

## Comandos

```bash
# Desarrollo
pnpm dev:web          # Frontend en localhost:3000
pnpm dev:api          # Backend en localhost:8000

# Build
pnpm build            # Todos los servicios
pnpm build:web        # Solo frontend

# Cache local (DragonflyDB)
docker compose -f docker-compose.dev.yml up -d
```

## Configuración Supabase

- **URL**: https://dbnihrkysrjdvglsfavk.supabase.co
- **Credenciales**: `apps/web/.env`
- **Tipos generados**: `packages/shared/src/database.types.ts`

## Credenciales de Prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Admin | `admin@sportia.test` | `Test1234!` | ADMIN |

## Modelo de Datos

### Entidades principales
- `profiles` - Usuarios (extiende auth.users)
- `clubs` - Clubes deportivos
- `athletes` - Deportistas
- `coaches` - Entrenadores
- `training_sessions` - Sesiones de entrenamiento
- `training_sets` - Series (tiempo, prueba)
- `training_splits` - Parciales
- `training_strokes` - Conteo de brazadas

### Catálogos
- `swim_strokes` - Estilos (FREE, BACK, BREAST, FLY, IM)
- `tests` - Pruebas (distancia + estilo + piscina)

### Análisis y Gamificación
- `objectives` - Objetivos de tiempo (scope: GLOBAL/CLUB/TEMPLATE)
- `objective_assignments` - Asignación de objetivos a atletas (status: PENDING/IN_PROGRESS/ACHIEVED/FAILED)
- `badge_types` - Tipos de medallas (categoría: OBJECTIVE/MILESTONE/RECORD)
- `athlete_badges` - Medallas ganadas por atletas (auto-asignadas via trigger)
- `swim_competition_results` - Resultados externos (con `athlete_id` para vincular)

### Matching de Entidades Externas
- `athlete_external_mappings` - Vínculos entre nombres externos y atletas del sistema
- `club_external_mappings` - Vínculos entre códigos de equipo y clubes del sistema

## Roles y Permisos

### Roles de Sistema (`profiles.role` - user_role)
| Rol | Permisos |
|-----|----------|
| ADMIN | Acceso total a todas las tablas y clubes |
| CLUB_ADMIN | Gestión de su(s) club(es) |
| COACH | Seguimiento de atletas asignados |
| ATHLETE | Registro y visualización personal |

### Roles de Club (`club_members.role_in_club` - club_role)
| Rol | Permisos |
|-----|----------|
| ADMIN | Gestiona atletas, coaches y datos del club |
| COACH | Ve/edita atletas asignados en el club |
| ATHLETE | Ve su propio perfil en el club |

**Nota**: Un usuario con `profiles.role = 'ADMIN'` tiene acceso global. Los roles en `club_members` solo aplican dentro del contexto de un club específico.

## Métricas de Natación

### Capturadas
- Tiempo total (ms)
- Parciales (splits)
- Conteo de brazadas
- RPE de sesión (1-10)
- Duración (min)

### Calculadas (no almacenadas)
- **DPS** (Distance Per Stroke) = distancia / brazadas
- **Frecuencia** = brazadas / minuto
- **Índice de nado** = DPS × velocidad
- **Carga** = RPE × duración

## Funciones SQL Disponibles

```sql
-- Rankings por club
SELECT * FROM get_club_rankings(club_id, test_id, 'M', '13-14', 100);

-- Competidores directos (3 más rápidos, 3 más lentos)
SELECT * FROM get_direct_competitors(athlete_id, test_id, time_ms, 'club');

-- Métricas de una serie
SELECT * FROM calculate_swimming_metrics(training_set_id);

-- Helpers
SELECT calculate_age('2010-05-15');           -- 15
SELECT get_age_category(14);                   -- '13-14'
SELECT ms_to_time_string(65230);               -- '1:05.23'

-- Matching de entidades externas
SELECT normalize_name('José García');          -- 'jose garcia'
SELECT name_similarity('garcia jose', 'jose garcia'); -- 0.85
SELECT * FROM find_athlete_matches('garcia, jose', NULL, 0.6, 10);
SELECT * FROM get_unmatched_swimmers(100);
```

## Vistas

- `athletes_with_age` - Atletas con edad y categoría calculada
- `training_sessions_with_load` - Sesiones con carga (RPE × min)
- `athlete_best_times` - Mejores marcas por atleta/prueba

## Principios de Desarrollo

1. **Mobile-first** - Diseño para móvil primero
2. **Supabase-first** - CRUD directo, FastAPI solo para lógica compleja
3. **Datos derivados se calculan** - No duplicar en DB
4. **Menor código posible** - Simplicidad sobre abstracción
5. **Comparaciones por categoría** - Mismo sexo, edad, estilo, distancia

## Sistema de Diseño

### Paleta de Colores: Azul Océano

| Rol | Color | Hex | Uso |
|-----|-------|-----|-----|
| **Primary** | Sky Blue | `#0EA5E9` | Navegación, CTAs principales |
| **Primary Dark** | Ocean | `#0284C7` | Hover, estados activos |
| **Secondary** | Teal | `#14B8A6` | Progreso, métricas positivas |
| **Accent** | Coral | `#F97316` | Alertas, iniciar sesión, energía |
| **Success** | Emerald | `#10B981` | Completado, PRs, buenos tiempos |
| **Error** | Rose | `#F43F5E` | Errores, tiempos malos |
| **Warning** | Amber | `#F59E0B` | Advertencias, objetivos cercanos |

### Escala Primary (Tailwind)

```
primary-50:  #f0f9ff    primary-500: #0ea5e9 (Principal)
primary-100: #e0f2fe    primary-600: #0284c7 (Hover)
primary-200: #bae6fd    primary-700: #0369a1
primary-300: #7dd3fc    primary-800: #075985
primary-400: #38bdf8    primary-900: #0c4a6e
```

### Modo Oscuro

- **Detección**: Automática por preferencia del sistema
- **Toggle manual**: Disponible en perfil/settings
- **Persistencia**: localStorage (`sportia-color-mode`)

**Modo Claro:**
| Token | Color | Hex |
|-------|-------|-----|
| `--bg-primary` | White | `#FFFFFF` |
| `--bg-secondary` | Gray 50 | `#F9FAFB` |
| `--bg-tertiary` | Gray 100 | `#F3F4F6` |
| `--text-primary` | Gray 900 | `#111827` |
| `--text-secondary` | Gray 500 | `#6B7280` |
| `--border-default` | Gray 200 | `#E5E7EB` |

**Modo Oscuro:**
| Token | Color | Hex |
|-------|-------|-----|
| `--bg-primary` | Slate 900 | `#0F172A` |
| `--bg-secondary` | Slate 800 | `#1E293B` |
| `--bg-tertiary` | Slate 700 | `#334155` |
| `--text-primary` | Slate 50 | `#F8FAFC` |
| `--text-secondary` | Slate 400 | `#94A3B8` |
| `--border-default` | Slate 600 | `#475569` |

### Tipografía

```
Font: Inter / Sistema nativo
Tamaño mínimo: 16px (móvil)

xs:     12px (labels, badges)
sm:     14px (texto secundario)
base:   16px (body)
lg:     18px (subtítulos)
xl:     20px (H3)
2xl:    24px (H2)
3xl:    28px (H1)
metric: 32px (números/tiempos grandes)
```

### Sombras (Elevación)

| Nivel | Sombra | Uso |
|-------|--------|-----|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | Inputs, chips |
| `DEFAULT` | `0 2px 4px rgba(0,0,0,0.08)` | Cards |
| `md` | `0 4px 8px rgba(0,0,0,0.12)` | Dropdowns |
| `lg` | `0 8px 16px rgba(0,0,0,0.16)` | Modales |
| `xl` | `0 16px 32px rgba(0,0,0,0.20)` | Toasts flotantes |

**Modo Oscuro**: Opacidad x2 (usar `shadow-dark-*`)

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `sm` | 6px | Inputs, badges |
| `DEFAULT` | 8px | Botones, chips |
| `md` | 12px | Cards |
| `lg` | 16px | Modales |
| `xl` | 20px | Bottom sheets |
| `full` | 9999px | Pills, avatares |

### Clases CSS Utilitarias

```css
/* Backgrounds */
.bg-surface          /* Fondo primario (blanco/slate-900) */
.bg-surface-secondary
.bg-surface-tertiary

/* Text */
.text-body           /* Texto principal */
.text-secondary      /* Texto secundario */
.text-muted          /* Texto deshabilitado */

/* Borders */
.border-surface      /* Borde estándar */
.border-surface-light

/* Components */
.card                /* Tarjeta con sombra y borde */
.card-elevated       /* Tarjeta con sombra más pronunciada */
.metric-display      /* Números/tiempos grandes */
.focus-ring          /* Focus accesible */
```

### Archivos de Configuración

- `apps/web/tailwind.config.ts` - Colores, sombras, tipografía, bordes
- `apps/web/nuxt.config.ts` - colorMode (system preference)
- `apps/web/assets/css/main.css` - Variables CSS y clases utilitarias

## Categorías de Edad (Natación)

| Código | Rango |
|--------|-------|
| 10- | 10 y menores |
| 11-12 | 11-12 años |
| 13-14 | 13-14 años |
| 15-16 | 15-16 años |
| 17-18 | 17-18 años |
| OPEN | 19+ |

## Estado Actual

### Completado
- [x] Estructura del monorepo
- [x] Configuración Nuxt 3 + Tailwind + PWA
- [x] Configuración FastAPI
- [x] Packages compartidos (tipos, helpers, config)
- [x] Esquema de base de datos (16 tablas)
- [x] Políticas RLS (incluyendo ADMIN global)
- [x] Funciones y vistas SQL
- [x] Tipos TypeScript generados
- [x] Conexión con Supabase
- [x] Autenticación (login/registro/logout)
- [x] CRUD de atletas
- [x] CRUD de clubes
- [x] Registro de entrenamientos
- [x] Formulario de series con métricas
- [x] Dashboard con datos reales
- [x] PWA instalable
- [x] Integración Nuxt UI v2
- [x] Sistema de diseño (paleta Azul Océano, modo oscuro, tipografía)
- [x] Toggle modo claro/oscuro en perfil

### Completado (Fase 2)
- [x] Gráficas de progreso (ECharts)

### Completado (Fase 3)
- [x] Objetivos de tiempo
- [x] Asignación de objetivos a atletas
- [x] Sistema de medallas/badges (gamificación)
- [x] Auto-asignación de medallas via trigger
- [x] Búsqueda de resultados de competencias (FECNA)

### Pendiente (Fase 4)
- [ ] Rankings por club
- [ ] Competidores directos
- [ ] Cache con DragonflyDB

## Frontend - Composables

### useAuth
**Archivo**: `apps/web/composables/useAuth.ts`
**Propósito**: Manejo de autenticación (login, registro, logout, reset password)
**Dependencias**: `useSupabaseClient`, `useSupabaseUser`, `useAppToast`
**Retorna**: `{ user, loading, errorMessage, isAuthenticated, login, register, logout, forgotPassword, clearError }`

### useProfile
**Archivo**: `apps/web/composables/useProfile.ts`
**Propósito**: Perfil del usuario, rol, permisos, membresías de club
**Dependencias**: `useSupabaseClient`, `useSupabaseUser`, `useAppToast`
**Retorna**: `{ profile, clubMemberships, role, isAdmin, isCoach, primaryClubId, updateProfile, hasPermission }`

### useAthletes
**Archivo**: `apps/web/composables/useAthletes.ts`
**Propósito**: CRUD de atletas usando vista `athletes_with_age`
**Dependencias**: `useSupabaseClient`, `useAppToast`
**Retorna**: `{ athletes, currentAthlete, loading, fetchAthletes, fetchAthlete, createAthlete, updateAthlete, deleteAthlete }`

### useClubs
**Archivo**: `apps/web/composables/useClubs.ts`
**Propósito**: CRUD de clubes
**Dependencias**: `useSupabaseClient`, `useAppToast`
**Retorna**: `{ clubs, currentClub, loading, fetchClubs, fetchClub, createClub, updateClub }`

### useCoaches
**Archivo**: `apps/web/composables/useCoaches.ts`
**Propósito**: CRUD de entrenadores, asignaciones atleta-coach
**Dependencias**: `useSupabaseClient`, `useAppToast`
**Retorna**: `{ coaches, currentCoach, loading, fetchCoaches, createCoach, assignAthleteToCoach }`

### useCatalogs
**Archivo**: `apps/web/composables/useCatalogs.ts`
**Propósito**: Catálogos de estilos, pruebas, opciones para select
**Dependencias**: `useSupabaseClient`, `@sportia/config`
**Retorna**: `{ tests, swimStrokes, swimStrokeOptions, sessionTypeOptions, poolTypeOptions, sexOptions, rpeLabels, testOptions, fetchTests, fetchSwimStrokes }`

### useTrainingSessions
**Archivo**: `apps/web/composables/useTrainingSessions.ts`
**Propósito**: CRUD de sesiones de entrenamiento
**Dependencias**: `useSupabaseClient`, `useSupabaseUser`, `useToast`
**Retorna**: `{ sessions, currentSession, loading, fetchSessions, fetchSession, createSession, updateSession, deleteSession }`

### useTrainingSets
**Archivo**: `apps/web/composables/useTrainingSets.ts`
**Propósito**: CRUD de series, parciales, conteo de brazadas
**Dependencias**: `useSupabaseClient`, `useToast`
**Retorna**: `{ sets, splits, strokes, createSet, deleteSet, createSplits, createStrokes }`

### useSwimmingMetrics
**Archivo**: `apps/web/composables/useSwimmingMetrics.ts`
**Propósito**: Cálculo de métricas de natación (DPS, frecuencia, índice)
**Dependencias**: `@sportia/shared`
**Retorna**: `{ calculateMetrics, getTotalStrokeCount, calculateSplitVelocities, getFastestSplit }`

### useAppToast
**Archivo**: `apps/web/composables/useAppToast.ts`
**Propósito**: Wrapper sobre useToast de Nuxt UI con API simplificada
**Dependencias**: `useToast` (Nuxt UI)
**Retorna**: `{ success, error, warning, info, toast }`
**Nota**: Reemplaza el antiguo `useToast` personalizado. Usa `UNotifications` en layouts para mostrar los toasts.

### usePWAInstall
**Archivo**: `apps/web/composables/usePWAInstall.ts`
**Propósito**: Estado de instalación PWA, estado offline (complementa el usePWA del módulo @vite-pwa/nuxt)
**Dependencias**: Ninguna
**Retorna**: `{ isInstalled, isOnline, canInstall, install }`

### useCharts
**Archivo**: `apps/web/composables/useCharts.ts`
**Propósito**: Configuración de gráficas ECharts con tema SPORTIA, fetch de datos de progreso
**Dependencias**: `useSupabaseClient`, `useColorMode`, `@sportia/shared`
**Retorna**: `{ colors, isDark, baseChartOptions, fetchTimeProgress, fetchMetricsProgress, formatTime, formatDate, createTimeProgressOptions, createMetricsOptions }`
**Nota**: Los colores se adaptan automáticamente al modo claro/oscuro. Usar `createTimeProgressOptions` para gráficas de tiempos y `createMetricsOptions` para DPS/frecuencia/índice.

### useCompetitionResults
**Archivo**: `apps/web/composables/useCompetitionResults.ts`
**Propósito**: Búsqueda y consulta de resultados de competencias oficiales
**Dependencias**: `useSupabaseClient`, `useAppToast`, `@sportia/shared`
**Retorna**: `{ loading, results, totalCount, strokeLabels, searchResults, getSwimmerResults, getRankings, formatTime, formatEvent, getStrokeLabel }`
**Nota**: Busca en la tabla `swim_competition_results` que contiene datos importados de FECNA.

### useMatching
**Archivo**: `apps/web/composables/useMatching.ts`
**Propósito**: Vinculación de atletas externos (FECNA) con atletas del sistema
**Dependencias**: `useAppToast`, `useAthletes`, `$fetch`
**Retorna**: `{ loading, stats, pendingMatches, unmatchedSwimmers, totalPending, searchResults, fetchStats, fetchUnmatchedSwimmers, fetchPendingMatches, searchMatches, suggestBatchMatches, createMatch, confirmMatch, rejectMatch, autoMatch, formatSimilarity, getStatusColor, getStatusLabel }`
**Nota**: Usa algoritmo de similitud Levenshtein vía funciones SQL. Permite confirmar/rechazar matches y auto-match para alta confianza.

### useObjectives
**Archivo**: `apps/web/composables/useObjectives.ts`
**Propósito**: Gestión de objetivos de tiempo, asignaciones y medallas
**Dependencias**: `useSupabaseClient`, `useSupabaseUser`, `useAppToast`, `@sportia/shared`
**Retorna**: `{ loading, objectives, assignments, badges, badgeTypes, strokeLabels, formatObjective, fetchObjectives, createObjective, deleteObjective, fetchAthleteAssignments, fetchObjectiveAssignments, assignObjective, updateAssignmentStatus, removeAssignment, fetchBadgeTypes, fetchAthleteBadges, getAthletePoints, getStatusLabel, getStatusColor }`
**Nota**: Sistema de gamificación tipo Strava/Garmin. Al marcar un objetivo como ACHIEVED, el trigger `award_objective_badge()` otorga medallas automáticamente.

## Frontend - Componentes

### Nuxt UI (componentes usados)

Nuxt UI v2 está integrado. Los siguientes componentes se usan en lugar de componentes personalizados:

| Componente | Propósito | Documentación |
|------------|-----------|---------------|
| `UCard` | Tarjeta contenedora | https://ui.nuxt.com/components/card |
| `UButton` | Botones y links | https://ui.nuxt.com/components/button |
| `UInput` | Input de texto | https://ui.nuxt.com/components/input |
| `USelect` | Select dropdown | https://ui.nuxt.com/components/select |
| `USelectMenu` | Select con búsqueda | https://ui.nuxt.com/components/select-menu |
| `UFormGroup` | Wrapper para form fields | https://ui.nuxt.com/components/form-group |
| `UCheckbox` | Checkbox | https://ui.nuxt.com/components/checkbox |
| `UNotifications` | Toast notifications | https://ui.nuxt.com/components/notification |

**Uso**: `UNotifications` está en los layouts (`default.vue`, `auth.vue`). Los toasts se muestran con `useAppToast()`.

### Formularios personalizados (`components/form/`)

| Componente | Props | Propósito |
|------------|-------|-----------|
| `SInput` | `v-model`, `label`, `type`, `error`, `placeholder` | Input genérico (legacy) |
| `SSelect` | `v-model`, `options`, `label`, `error` | Select dropdown (legacy) |
| `SDatePicker` | `v-model`, `label`, `min`, `max` | Selector de fecha |
| `STimePicker` | `v-model`, `label` | Tiempo en ms (formato mm:ss.cc) |
| `SNumberInput` | `v-model`, `min`, `max`, `step`, `unit` | Input numérico con +/- |
| `STextarea` | `v-model`, `label`, `rows`, `maxlength` | Textarea |
| `SSlider` | `v-model`, `min`, `max`, `labels` | Slider con etiquetas |
| `SButton` | `variant`, `size`, `loading`, `disabled`, `to` | Botón/link (legacy) |

**Nota**: Preferir componentes de Nuxt UI (`UInput`, `UButton`, etc.) en páginas nuevas.

### UI (`components/ui/`)

| Componente | Props | Propósito |
|------------|-------|-----------|
| `SCard` | `title`, `subtitle`, `noPadding` | Tarjeta contenedora (legacy, usar `UCard`) |
| `SModal` | `v-model`, `title`, `closable`, `size` | Modal centrado |
| `SBottomSheet` | `v-model`, `title`, `height` | Sheet desde abajo (mobile) |
| `SPageHeader` | `title`, `subtitle`, `backTo`, slot `#actions` | Encabezado de página |
| `SEmptyState` | `icon`, `title`, `description`, `actionTo` | Estado vacío |
| `SLoadingState` | `type` (spinner/skeleton/dots), `text` | Estados de carga |
| `SList` | `loading`, `emptyText`, `emptyIcon` | Lista con loading/empty |
| `SListItem` | `title`, `subtitle`, `avatar`, `to`, `badge` | Item de lista |
| `SAvatar` | `src`, `name`, `size` | Avatar con iniciales |
| `SBadge` | `text`, `color`, `size` | Badge/chip |
| `SFab` | `icon`, `position`, `to` | Floating action button |
| `ColorModeToggle` | - | Toggle para cambiar modo claro/oscuro |

### Natación (`components/training/`)

| Componente | Props | Propósito |
|------------|-------|-----------|
| `AthleteCard` | `athlete`, `showClub` | Tarjeta de atleta |
| `SessionCard` | `session` | Tarjeta de sesión |
| `TimeDisplay` | `ms`, `size` | Tiempo formateado |
| `RpeSelector` | `v-model` | Selector visual RPE 1-10 |
| `TestSelector` | `v-model`, `tests`, `swimStrokes` | Selector de prueba |
| `MetricsPanel` | `metrics` | Panel de métricas calculadas |
| `StrokeCounter` | `v-model`, `lengths` | Conteo de brazadas por largo |
| `SplitList` | `splits`, `editable` | Lista de parciales |
| `SetForm` | `v-model`, `tests`, `swimStrokes` | Formulario de serie |
| `CompetitionResultsPanel` | `athleteName` | Resultados de competencias del atleta |

### Gráficas (`components/charts/`)

| Componente | Props | Propósito |
|------------|-------|-----------|
| `TimeProgressChart` | `athleteId`, `testId?`, `title?`, `height?` | Gráfica de evolución de tiempos |
| `MetricsChart` | `athleteId`, `testId?`, `metric?`, `height?` | Gráfica de métricas (DPS, frecuencia, índice) |
| `AthleteProgressPanel` | `athleteId` | Panel completo con selector de prueba y tabs de métricas |

**Uso**: `AthleteProgressPanel` integra ambas gráficas con selector de prueba. Se usa en `/athletes/[id]`.

**Plugin**: `plugins/echarts.client.ts` registra ECharts y vue-echarts globalmente como `<VChart>`.

## Frontend - Páginas

### Autenticación (layout: `auth`)
- `/login` - Inicio de sesión
- `/register` - Registro de usuario
- `/forgot-password` - Recuperar contraseña

### Principal (layout: `default`)
- `/` - Dashboard con resumen y acciones rápidas
- `/profile` - Perfil del usuario
- `/profile/edit` - Editar perfil

### Clubes
- `/clubs` - Lista de clubes
- `/clubs/new` - Crear club
- `/clubs/[id]` - Detalle de club
- `/clubs/[id]/edit` - Editar club

### Atletas
- `/athletes` - Lista de atletas del club
- `/athletes/new` - Crear atleta
- `/athletes/[id]` - Detalle de atleta + mejores tiempos + gráficas de progreso
- `/athletes/[id]/edit` - Editar atleta

### Entrenamientos
- `/training` - Lista de sesiones
- `/training/new` - Crear sesión
- `/training/[id]` - Detalle de sesión + series
- `/training/[id]/add-set` - Agregar serie con métricas

### Competencias
- `/competitions` - Búsqueda de resultados de competencias oficiales

### Administración
- `/admin/matching` - Vinculación de atletas externos con el sistema

## Frontend - Middleware

### auth.ts
**Archivo**: `apps/web/middleware/auth.ts`
**Propósito**: Proteger rutas que requieren autenticación
**Rutas públicas**: `/login`, `/register`, `/forgot-password`, `/reset-password`

## Frontend - Layouts

### default.vue
Layout principal con header y navegación inferior (5 tabs: Inicio, Clubes, Atletas, Entrenos, Perfil).
Incluye `<UNotifications />` para toasts.

### auth.vue
Layout limpio para páginas de autenticación (sin navegación).
Incluye `<UNotifications />` para toasts.

## Backend - API (FastAPI)

### Endpoints de Importación (`/api/import/`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/import/fecna/stats` | Estadísticas de la base de datos FECNA |
| `POST` | `/api/import/fecna` | Importar resultados de FECNA a Supabase |
| `GET` | `/api/import/fecna/preview` | Preview de datos antes de importar |

### Endpoints de Resultados (`/api/results/`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/results/search` | Buscar resultados con filtros |
| `GET` | `/api/results/swimmer/{name}` | Resultados de un nadador |
| `GET` | `/api/results/rankings` | Rankings por evento |
| `GET` | `/api/results/tournaments` | Lista de torneos |

### Endpoints de Matching (`/api/matching/`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/matching/stats` | Estadísticas de matching |
| `GET` | `/api/matching/athletes/unmatched` | Nadadores externos sin vincular |
| `GET` | `/api/matching/athletes/pending` | Matches pendientes de revisión |
| `GET` | `/api/matching/athletes/search` | Buscar matches por nombre |
| `POST` | `/api/matching/athletes/suggest-batch` | Sugerir matches para múltiples nombres |
| `POST` | `/api/matching/athletes/create` | Crear sugerencia de match |
| `POST` | `/api/matching/athletes/{id}/confirm` | Confirmar un match |
| `POST` | `/api/matching/athletes/{id}/reject` | Rechazar un match |
| `POST` | `/api/matching/athletes/auto-match` | Auto-confirmar matches de alta confianza |

### Archivos de Servicios

- `app/services/fecna_import.py` - Lectura y transformación de datos FECNA
- `app/services/matching.py` - Algoritmo de matching y operaciones CRUD
- `app/api/import_routes.py` - Endpoints de importación
- `app/api/results_routes.py` - Endpoints de búsqueda
- `app/api/matching_routes.py` - Endpoints de matching

### Base de datos externa

La base de datos SQLite `fecna_data.db` (en raíz del proyecto) contiene ~15,000 resultados de competencias de natación de FECNA (Federación Colombiana de Natación).

**Tabla `results`:**
- `swimmer_name`, `team`, `age`, `gender`, `age_category`
- `distance`, `style` (estilo en español/inglés)
- `final_time`, `seed_time`, `rank`
- `tournament_name`, `event_date`, `year`

## Convenciones

### Nombres
- Tablas: `snake_case` plural (`training_sessions`)
- Columnas: `snake_case` (`session_date`)
- Componentes Vue: `PascalCase` (`AthleteCard.vue`)
- Composables: `camelCase` con prefijo `use` (`useAthletes`)

### Rutas Dinámicas con Sub-rutas
Cuando una ruta dinámica tiene sub-rutas, usar estructura de directorio:
```
pages/athletes/[id]/index.vue  → /athletes/:id
pages/athletes/[id]/edit.vue   → /athletes/:id/edit
```
**NO usar** `[id].vue` junto con `[id]/edit.vue` (el archivo actúa como layout padre).

### Tiempos
- Siempre en **milisegundos** (`total_time_ms`)
- Formato display: `mm:ss.cc` (función `ms_to_time_string`)

### IDs
- UUIDs para entidades principales
- SMALLINT para catálogos (`swim_strokes`)
