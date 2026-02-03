# CapRover - Despliegue Continuo

Configuración para desplegar SPORTIA en CapRover usando el **Método 3: Deploy from GitHub/Bitbucket/Gitlab**.

## 🚀 Inicio Rápido

### Opción 1: Configuración Automática (Recomendado)

```bash
# 1. Configura tu repositorio remoto (si no lo tienes)
git remote add origin https://github.com/tu-usuario/sportia.git
git push -u origin main

# 2. Ejecuta el script de setup
./infra/caprover/setup-branches.sh
```

Este script:
- ✅ Crea los branches `deploy/web` y `deploy/api`
- ✅ Configura `captain-definition` en cada branch
- ✅ Hace push a GitHub/GitLab

### Opción 2: Configuración Manual

Lee la [Guía Completa de CI/CD](./CICD.md) para configuración paso a paso.

## 📋 Estructura

```
SPORTIA/
├── captain-definition          # Para Web (en main y deploy/web)
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.web     # Build de Nuxt 3
│   │   └── Dockerfile.api     # Build de FastAPI
│   └── caprover/
│       ├── setup-branches.sh  # Script de configuración
│       ├── CICD.md           # Guía detallada
│       └── README.md         # Este archivo
└── .github/
    └── workflows/
        └── auto-deploy.yml   # GitHub Actions (opcional)
```

## 🌿 Estrategia de Branches

| Branch | Propósito | Auto-deploy |
|--------|-----------|-------------|
| `main` | Desarrollo principal | ❌ No |
| `deploy/web` | Deploy de Frontend | ✅ Sí (sportia-web) |
| `deploy/api` | Deploy de Backend | ✅ Sí (sportia-api) |

## 🔧 Configuración en CapRover

### 1. Crear Apps

En el Dashboard de CapRover, crea 3 apps:

#### sportia-cache
- **Tipo**: One-Click App > DragonflyDB (o Redis)
- **Puerto**: 6379
- **Persistent Data**: ✅ Habilitado
- **Directory**: `/data`

#### sportia-api
- **Tipo**: App vacía
- **Container Port**: 8000
- **Variables**:
  ```
  SUPABASE_URL=https://dbnihrkysrjdvglsfavk.supabase.co
  SUPABASE_KEY=tu_anon_key
  REDIS_URL=redis://srv-captain--sportia-cache:6379
  ```

#### sportia-web
- **Tipo**: App vacía
- **Container Port**: 3000
- **Variables**:
  ```
  SUPABASE_URL=https://dbnihrkysrjdvglsfavk.supabase.co
  SUPABASE_KEY=tu_anon_key
  API_URL=https://sportia-api.tu-dominio.com
  NUXT_PUBLIC_SUPABASE_URL=https://dbnihrkysrjdvglsfavk.supabase.co
  NUXT_PUBLIC_SUPABASE_KEY=tu_anon_key
  ```

### 2. Configurar Deploy from Git

#### Para sportia-web:

1. Ve a `sportia-web` > **Deployment** tab
2. Selecciona **Method 3: Deploy from Github/Bitbucket/Gitlab**
3. Configura:
   - **Repository**: Tu repo (ej: `https://github.com/tu-usuario/sportia`)
   - **Branch**: `deploy/web`
   - **Username**: Tu usuario de GitHub
   - **Password**: [Personal Access Token](https://github.com/settings/tokens)
     - Scopes necesarios: `repo` (todos)
4. Click **Save & Update**
5. **Copia el Webhook URL** que aparece

#### Para sportia-api:

1. Ve a `sportia-api` > **Deployment** tab
2. Selecciona **Method 3**
3. Configura:
   - **Repository**: Tu repo
   - **Branch**: `deploy/api`
   - **Username**: Tu usuario
   - **Password**: Tu token
4. Click **Save & Update**
5. **Copia el Webhook URL**

### 3. Configurar Webhooks en GitHub

1. Ve a tu repositorio en GitHub
2. **Settings** > **Webhooks** > **Add webhook**
3. Crea webhook para **sportia-web**:
   - **Payload URL**: Pega el webhook URL de CapRover (sportia-web)
   - **Content type**: `application/json`
   - **Events**: Just the push event
   - Click **Add webhook**
4. Repite para **sportia-api** con su webhook URL

## 🔄 Workflow de Despliegue

### Despliegue Manual

```bash
# Hacer cambios en main
git checkout main
# ... editar código ...
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# Desplegar Web
git checkout deploy/web
git merge main
git push origin deploy/web  # ⚡ Dispara autodeploy

# Desplegar API
git checkout deploy/api
git merge main
git push origin deploy/api  # ⚡ Dispara autodeploy

# Volver a main
git checkout main
```

### Despliegue Automático con GitHub Actions (Opcional)

Si configuraste `.github/workflows/auto-deploy.yml`:

```bash
# Desplegar solo Web
git commit -m "feat: actualizar dashboard [deploy-web]"
git push

# Desplegar solo API
git commit -m "fix: corregir endpoint [deploy-api]"
git push

# Desplegar ambos
git commit -m "feat: nueva feature completa [deploy-all]"
git push
```

GitHub Actions detectará el tag en el mensaje y hará merge automáticamente a los branches de deploy.

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
# Opción 1: Dashboard de CapRover
# Apps > sportia-web > App Logs

# Opción 2: CLI (si instalaste caprover CLI)
npm install -g caprover
caprover login
caprover logs -a sportia-web -f
caprover logs -a sportia-api -f
```

### Verificar estado de webhooks

**En GitHub**:
1. Settings > Webhooks
2. Click en el webhook
3. **Recent Deliveries** tab
4. Verifica que los payloads tengan respuesta 200 OK

## 🐛 Troubleshooting

### Webhook no dispara el build

- ✅ Verifica que el webhook esté activo (✓ verde en GitHub)
- ✅ Revisa "Recent Deliveries" para ver errores
- ✅ Verifica que el branch coincida (`deploy/web` o `deploy/api`)
- ✅ Prueba disparar manualmente en CapRover: Deployment > Force Rebuild

### Build falla

- ✅ Revisa logs en CapRover Dashboard
- ✅ Verifica que `captain-definition` apunte al Dockerfile correcto
- ✅ Verifica que las variables de entorno estén configuradas
- ✅ Verifica que el contexto de Docker sea la raíz (`.`)

### "Repository not accessible"

- ✅ Verifica que el token tenga scope `repo`
- ✅ Para repos privados, usa Personal Access Token, no password
- ✅ Genera un nuevo token en: https://github.com/settings/tokens

### API no se conecta al cache

```bash
# Verifica que sportia-cache esté corriendo
# Dashboard > Apps > sportia-cache > App Logs

# Verifica REDIS_URL en sportia-api:
# Debe ser: redis://srv-captain--sportia-cache:6379
# El prefijo srv-captain-- es necesario
```

### Web no se conecta a la API

```bash
# Verifica que API_URL apunte al dominio PÚBLICO:
# ✅ Correcto: https://sportia-api.tu-dominio.com
# ❌ Incorrecto: http://srv-captain--sportia-api:8000

# El navegador del cliente hace la petición, no el servidor
```

## 🔐 Seguridad

### GitHub Personal Access Token

1. Ve a https://github.com/settings/tokens
2. **Generate new token** > **Classic**
3. Scopes necesarios:
   - ✅ `repo` (todos los permisos)
4. Copia el token (solo se muestra una vez)
5. Úsalo como password en CapRover

**Nota**: Nunca compartas tu token. Si lo expones, revócalo inmediatamente.

## 📚 Recursos

- [Documentación de CapRover](https://caprover.com/docs)
- [Guía CI/CD Completa](./CICD.md)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en CapRover Dashboard
2. Verifica webhooks en GitHub (Recent Deliveries)
3. Lee la [Guía de CI/CD](./CICD.md) para troubleshooting detallado
