# Guía de Despliegue - SPORTIA Web

## Opciones de Despliegue Gratuito

### Opción 1: Vercel (Recomendado)

Vercel tiene soporte nativo para Nuxt 3 y ofrece el mejor rendimiento.

#### Pasos:

1. **Crear cuenta en Vercel**
   - Ve a [vercel.com](https://vercel.com) y crea una cuenta gratuita
   - Conecta tu cuenta de GitHub/GitLab

2. **Importar proyecto**
   - Click en "New Project"
   - Selecciona tu repositorio de SPORTIA
   - Vercel detectará automáticamente que es un proyecto Nuxt

3. **Configurar variables de entorno**
   En la sección "Environment Variables", agrega:
   ```
   SUPABASE_URL=https://dbnihrkysrjdvglsfavk.supabase.co
   SUPABASE_KEY=tu-anon-key
   API_URL=https://tu-api.com (opcional)
   ```

4. **Configurar directorio raíz**
   - Root Directory: `apps/web`

5. **Deploy**
   - Click en "Deploy"
   - Vercel construirá y desplegará automáticamente

#### Configuración adicional (vercel.json):
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".output/public",
  "framework": "nuxtjs"
}
```

---

### Opción 2: Netlify

#### Pasos:

1. **Crear cuenta en Netlify**
   - Ve a [netlify.com](https://netlify.com) y crea una cuenta gratuita
   - Conecta tu cuenta de GitHub/GitLab

2. **Importar proyecto**
   - Click en "Add new site" → "Import an existing project"
   - Selecciona tu repositorio

3. **Configuración de build**
   ```
   Base directory: apps/web
   Build command: pnpm run build
   Publish directory: apps/web/.output/public
   ```

4. **Variables de entorno**
   En Site Settings → Environment Variables:
   ```
   SUPABASE_URL=https://dbnihrkysrjdvglsfavk.supabase.co
   SUPABASE_KEY=tu-anon-key
   API_URL=https://tu-api.com (opcional)
   NODE_VERSION=20
   ```

5. **Deploy**
   - Click en "Deploy site"

---

### Opción 3: Cloudflare Pages

#### Pasos:

1. **Crear cuenta en Cloudflare**
   - Ve a [pages.cloudflare.com](https://pages.cloudflare.com)
   - Conecta tu cuenta de GitHub

2. **Crear proyecto**
   - Click en "Create a project"
   - Selecciona tu repositorio

3. **Configuración**
   ```
   Framework preset: Nuxt.js
   Root directory: apps/web
   Build command: pnpm run build
   Build output directory: .output/public
   ```

4. **Variables de entorno**
   ```
   SUPABASE_URL=https://dbnihrkysrjdvglsfavk.supabase.co
   SUPABASE_KEY=tu-anon-key
   NODE_VERSION=20
   ```

---

## Variables de Entorno Requeridas

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `SUPABASE_URL` | URL de tu proyecto Supabase | Sí |
| `SUPABASE_KEY` | Anon key de Supabase | Sí |
| `API_URL` | URL del backend FastAPI | No |
| `NODE_VERSION` | Versión de Node.js (usar 20) | Depende |

---

## Configurar Supabase para Producción

1. **Agregar dominio a Supabase**
   - Ve a Authentication → URL Configuration
   - Agrega tu dominio de producción a "Site URL"
   - Agrega tu dominio a "Redirect URLs"

2. **Habilitar RLS**
   - Asegúrate de que todas las tablas tengan Row Level Security habilitado

---

## Despliegue Continuo

Una vez configurado:
- Cada push a `main` desplegará automáticamente
- Los Pull Requests generarán previews

---

## Comandos Útiles

```bash
# Build local para probar
pnpm build:web

# Preview del build
cd apps/web && node .output/server/index.mjs

# Verificar tipos
pnpm typecheck
```

---

## Solución de Problemas

### Error: "Cannot find module"
- Verifica que `pnpm install` se ejecute antes del build
- Revisa que el directorio base sea correcto (`apps/web`)

### Error: "SUPABASE_URL is not defined"
- Verifica que las variables de entorno estén configuradas en el servicio de hosting

### PWA no funciona
- Asegúrate de que el sitio use HTTPS
- Verifica que los iconos PWA existan en `/public`
