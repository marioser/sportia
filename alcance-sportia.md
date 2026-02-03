# 🏊‍♂️ SPORTIA

## Plataforma de Gestión Deportiva y Análisis de Rendimiento

### Documento de Alcance – MVP (Enfoque Natación)

---

## 1. Nombre de la aplicación

**SPORTIA**

**Concepto:**  
Plataforma digital para **seguimiento, análisis y proyección del rendimiento deportivo**, orientada a deportistas, entrenadores y clubes, basada en datos reales y criterios de ciencia deportiva.

**Tagline (interno):**

> Measure what matters. Improve what counts.

---

## 2. Objetivo del sistema

Construir una **aplicación web mobile-first, instalable (PWA)** que permita:

- Gestionar deportistas, entrenadores y clubes
- Registrar entrenamientos con datos mínimos pero científicamente relevantes
- Analizar progreso, eficiencia y carga de entrenamiento
- Comparar deportistas por categoría (edad, sexo, estilo)
- Contextualizar el rendimiento frente a resultados reales de competencia
- Escalar a otros deportes sin rehacer la base

El MVP se centra **exclusivamente en natación**, dejando la arquitectura preparada para ciclismo y atletismo.

---

## 3. Principios de diseño (no negociables)

- 📱 **Mobile first** (tablet y desktop secundarios)
- 📦 **Instalable (PWA)**
- 🧠 **Basado en ciencia deportiva**, no solo tiempos
- 🧩 **Menor código posible**
- 🧱 **Supabase-first** (DB + Auth + CRUD)
- ⚡ **Performance** (cache con DragonflyDB)
- 🔓 **100% librerías gratuitas**
- 🔁 **Datos derivados se calculan, no se duplican**

---

## 4. Usuarios y roles

### Roles del sistema

- `ADMIN` → configuración global, métricas, importaciones
- `CLUB_ADMIN` → gestión del club
- `COACH` → seguimiento y análisis de deportistas
- `ATHLETE` → registro y visualización personal

### Reglas clave

- El entrenador puede gestionar múltiples deportistas
- Un deportista puede tener uno o más entrenadores
- Comparaciones siempre se hacen **dentro de la misma categoría**

---

## 5. Enfoque científico (Natación)

El sistema maneja tres capas de análisis:

### 1️⃣ Resultado

- Tiempo total
- Parciales (splits)

### 2️⃣ Técnica (biomecánica)

- Conteo de brazadas
- Longitud de brazada (DPS)
- Frecuencia de brazada (estimada)
- Índice de nado (derivado)

### 3️⃣ Carga / respuesta

- Session-RPE (1–10)
- Duración de la sesión
- Carga = RPE × minutos

> Solo se solicita información que **habilite estos cálculos**.

---

## 6. Comparaciones y competidores directos

### 6.1 Categoría (natación)

Un deportista **solo se compara** con otros que cumplan **todas** las siguientes condiciones:

- Mismo sexo
- Misma distancia (ej. 100 m)
- Mismo estilo (Libre, Espalda, Pecho, Mariposa, Combinado)
- Misma categoría de edad
  - Exacta (ej. 14 años) **o**
  - Por rango (ej. 13–14, 15–16)
- Misma fuente de comparación:
  - Club
  - Resultados de competencia general (ligas / campeonatos)

> ❗ No se permiten comparaciones cruzadas entre categorías, estilos o distancias diferentes.

---

### 6.2 Competidores directos

Para una marca específica (entrenamiento u oficial):

- Se muestran:
  - **3 competidores inmediatamente más rápidos**
  - **3 competidores inmediatamente más lentos**

Ordenados únicamente por:

- Tiempo (ms)
- Dentro de la misma categoría definida

Las comparaciones pueden ejecutarse en dos modos:

- **Modo Club** → solo deportistas del mismo club
- **Modo General** → tabla completa de resultados de competencia

---

## 7. Arquitectura general

### 7.1 Tipo de arquitectura

**Monolito modular en monorepo**

Decisión tomada para:

- Reducir complejidad inicial
- Minimizar código duplicado
- Facilitar trabajo con agentes (Codex / Claude)
- Mantener despliegue simple en CapRover

---

### 7.2 Estructura recomendada del proyecto

```text
/sportia
├── apps/
│   ├── web/                # Frontend Nuxt 3 (PWA, mobile-first)
│   └── api/                # FastAPI (solo lógica compleja)
│
├── packages/
│   ├── shared/             # Tipos, helpers, validaciones, enums
│   └── config/             # Constantes, catálogos, reglas deportivas
│
├── infra/
│   ├── docker/             # Dockerfiles
│   └── caprover/           # Configuración de despliegue
│
├── docs/                   # Documentación del proyecto
│
└── README.md
---

### 7.3 Principios de separación de responsabilidades
	•	Frontend (Nuxt)
	•	UI
	•	Formularios
	•	Visualización de métricas
	•	Consumo directo de Supabase (CRUD básico)
	•	Supabase
	•	Autenticación
	•	Base de datos PostgreSQL
	•	CRUD estándar
	•	RLS (Row Level Security)
	•	Backend (FastAPI)
	•	Rankings complejos
	•	Competidores directos
	•	Importación de resultados externos
	•	Cálculos deportivos
	•	Cache e invalidación

## 8. Stack tecnológico

### 8.1 Frontend
	•	Nuxt 3
	•	PWA (instalable en móvil y tablet)
	•	Tailwind CSS
	•	ECharts (gráficas)
	•	Supabase JS SDK

### Principios:
	•	Mobile-first
	•	Componentes simples
	•	Gráficas claras (no sobrecargadas)

⸻

### 8.2 Backend
	•	FastAPI
	•	Python 3.11+
	•	Solo se usa cuando:
	•	Supabase no cubre la necesidad
	•	Hay cálculos o lógica pesada
	•	Se requiere cache o agregaciones complejas

⸻

### 8.3 Base de datos y autenticación
	•	Supabase
	•	PostgreSQL
	•	Auth (email + OAuth social)
	•	RLS
	•	Funciones SQL cuando aplique

⸻

### 8.4 Cache
	•	DragonflyDB
	•	Rankings
	•	Comparaciones frecuentes
	•	Competidores directos
	•	Mejores marcas

TTL recomendado:
	•	Rankings: 10–30 minutos
	•	Comparaciones directas: 5–10 minutos

⸻

### 8.5 Infraestructura
	•	Docker
	•	CapRover
	•	Monorepo desplegado como:
	•	Frontend (Nuxt)
	•	Backend (FastAPI)
	•	Cache (DragonflyDB)

---

## 9. Organización de responsabilidades

### Supabase maneja:
- Auth
- CRUD básico
- Relaciones simples
- Queries estándar
- RLS por rol

### FastAPI maneja:
- Cálculos complejos
- Rankings avanzados
- Competidores directos
- Importación de datos externos
- Cache + invalidación

---

## 10. Modelo de datos (Supabase / PostgreSQL)

### 10.1 Usuarios y roles

**users** (Supabase Auth)

**profiles**
- id (uuid PK → users.id)
- full_name
- role (ADMIN / COACH / ATHLETE / CLUB_ADMIN)
- created_at

---

### 10.2 Clubes

**clubs**
- id (uuid PK)
- name
- country
- city
- created_at

**club_members**
- club_id FK
- user_id FK
- role_in_club (ADMIN / COACH / ATHLETE)
- PK (club_id, user_id)

---

### 10.3 Deportistas y entrenadores

**athletes**
- id (uuid PK)
- user_id FK (nullable)
- club_id FK
- first_name
- last_name
- birth_date
- sex (M/F)
- created_at

**coaches**
- id (uuid PK)
- user_id FK
- is_independent
- created_at

**coach_athlete**
- coach_id FK
- athlete_id FK
- PK (coach_id, athlete_id)

---

### 10.4 Catálogos natación

**swim_strokes**
- id (smallint PK)
- code (FREE, BACK, BREAST, FLY, IM)

**tests**
- id (uuid PK)
- distance_m
- stroke_id FK
- pool_type (SCM / LCM)
- UNIQUE (distance_m, stroke_id, pool_type)

---

### 10.5 Entrenamientos

**training_sessions**
- id (uuid PK)
- athlete_id FK
- session_date
- session_type (AEROBIC / THRESHOLD / SPEED / TECH)
- duration_min
- session_rpe
- created_by
- validated_by
- notes

**training_sets**
- id (uuid PK)
- session_id FK
- test_id FK
- total_time_ms
- pool_length_m
- attempt_no
- is_best

**training_splits**
- training_set_id FK
- split_index
- split_distance_m
- split_time_ms

**training_strokes**
- training_set_id FK
- length_index
- stroke_count

---

### 10.6 Objetivos

**objectives**
- id (uuid PK)
- test_id FK
- target_time_ms
- scope (GLOBAL / CLUB / TEMPLATE)
- created_by

**objective_assignments**
- objective_id FK
- athlete_id FK
- custom_target_time_ms
- status

---

### 10.7 Resultados de competencia (normalizados)

**swim_competition_results**
- id (bigserial PK)
- year
- tournament_name
- event_date
- gender
- distance_m
- stroke
- round
- age
- swimmer_name
- swimmer_name_norm
- team_code
- rank
- final_time_ms
- seed_time_ms
- created_at

---

### 10.8 Configuración de métricas

**metric_flags**
- key
- enabled
- scope (GLOBAL / CLUB / ROLE)
- scope_id
- config_json

---

## 11. Cache (DragonflyDB)

Se cachea:
- Rankings por prueba/categoría
- Competidores directos
- Mejores marcas por atleta
- Comparaciones club vs general

TTL recomendado:
- Rankings: 10–30 min
- Comparaciones: 5–10 min

---

## 12. Flujo de desarrollo recomendado

### Fase 1 – Base sólida
- Auth + roles
- Club / atletas / entrenadores
- Catálogos natación
- Registro de entrenamientos
- Resultados en ms

### Fase 2 – Análisis
- Objetivos
- Comparaciones
- Rankings
- Cache

### Fase 3 – Contexto competitivo
- Importación resultados
- Matching
- Comparadores externos

---

## 13. Prompt maestro para agentes (Codex / Claude)

### Rol del agente
> Eres un ingeniero senior fullstack. Construyes una app mobile-first con Nuxt 3 + Supabase + FastAPI. Prioriza claridad, poco código, buenas prácticas y performance.

### Objetivos del agente
- No duplicar lógica de Supabase
- No crear endpoints innecesarios
- Calcular métricas, no almacenarlas
- Usar SQL eficiente
- Documentar decisiones

### Skills requeridos
- Supabase SQL & RLS
- FastAPI
- Nuxt 3 PWA
- ECharts
- PostgreSQL performance
- Cache patterns

---

## 14. Cierre

SPORTIA no es una app de tiempos.
Es una plataforma de **entendimiento del rendimiento**.

Este documento define una base **sólida, realista y escalable**, lista para empezar desarrollo sin reprocesos.

---
```
