# CI/CD - Despliegue Continuo con CapRover

Esta guía explica cómo configurar despliegue continuo usando el **Método 3** de CapRover: "Deploy from GitHub/Bitbucket/Gitlab".

## Arquitectura de Despliegue

CapRover soporta monorepos, pero necesitas estrategias diferentes según tu estructura:

### Opción 1: Branches Separados (Recomendado para Monorepo)

Usa diferentes branches para cada servicio:

```
main                    → No se despliega automáticamente
├── deploy/web         → Autodespliega sportia-web
└── deploy/api         → Autodespliega sportia-api
```

### Opción 2: Repositorios Separados

Divide el monorepo en repos independientes (no recomendado si compartes código).

### Opción 3: Single Branch con Paths (Requiere configuración manual)

Un solo branch pero con captain-definition específico por servicio.

---

## Configuración - Opción 1 (Branches Separados)

Esta es la opción más limpia para monorepos.

### Paso 1: Crear estructura de branches

```bash
# Desde la raíz del proyecto SPORTIA

# Crear branch para Web
git checkout -b deploy/web
# El captain-definition ya está en la raíz (configurado para Web)
git add .
git commit -m "Setup: Branch para deploy de Web"
git push origin deploy/web

# Volver a main y crear branch para API
git checkout main
git checkout -b deploy/api

# Cambiar captain-definition para API
cat > captain-definition <<EOF
{
  "schemaVersion": 2,
  "dockerfilePath": "./infra/docker/Dockerfile.api",
  "dockerfileContext": "."
}
EOF

git add captain-definition
git commit -m "Setup: Branch para deploy de API"
git push origin deploy/api

# Volver a main
git checkout main
```

### Paso 2: Configurar CapRover para cada servicio

#### Para sportia-web:

1. Ve al Dashboard de CapRover
2. Abre la app `sportia-web`
3. Ve a **Deployment** tab
4. Selecciona **Method 3: Deploy from Github/Bitbucket/Gitlab**
5. Configura:
   - **Repository**: `https://github.com/tu-usuario/sportia` (o tu URL)
   - **Branch**: `deploy/web`
   - **Username**: Tu usuario de GitHub
   - **Password**: [Personal Access Token](https://github.com/settings/tokens)
6. Copia el webhook URL que te genera

#### Para sportia-api:

1. Abre la app `sportia-api`
2. Ve a **Deployment** tab
3. Selecciona **Method 3**
4. Configura:
   - **Repository**: `https://github.com/tu-usuario/sportia`
   - **Branch**: `deploy/api`
   - **Username**: Tu usuario
   - **Password**: Tu token
5. Copia el webhook URL

### Paso 3: Configurar Webhooks en GitHub

#### Para GitHub:

1. Ve a tu repo: `Settings` > `Webhooks` > `Add webhook`
2. Crea un webhook para **sportia-web**:
   - **Payload URL**: (pega el webhook de CapRover para sportia-web)
   - **Content type**: `application/json`
   - **Events**: `Just the push event`
   - **Branches**: Filtra por `deploy/web` (GitHub no filtra, pero CapRover sí)
3. Repite para **sportia-api** con su webhook

#### Para GitLab:

1. Ve a `Settings` > `Webhooks`
2. Añade webhook:
   - **URL**: Webhook de CapRover
   - **Trigger**: `Push events`
   - **Branch filter**: `deploy/web` o `deploy/api`

#### Para Bitbucket:

1. Ve a `Repository settings` > `Webhooks` > `Add webhook`
2. Configura:
   - **URL**: Webhook de CapRover
   - **Triggers**: `Repository push`

### Paso 4: Workflow de Desarrollo

```bash
# Desarrollo normal en main
git checkout main
# ... hacer cambios en apps/web/ ...
git add .
git commit -m "feat: nueva funcionalidad en web"
git push origin main

# Cuando estés listo para desplegar:
git checkout deploy/web
git merge main
git push origin deploy/web  # ⚡ Dispara autodeploy de sportia-web

# Para API:
git checkout deploy/api
git merge main
git push origin deploy/api  # ⚡ Dispara autodeploy de sportia-api
```

### Paso 5: Automatizar con GitHub Actions (Opcional)

Crea `.github/workflows/deploy.yml`:

```yaml
name: Auto-deploy to CapRover

on:
  push:
    branches:
      - main

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[deploy-web]')
    steps:
      - uses: actions/checkout@v4
      - name: Merge to deploy/web
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git fetch origin deploy/web
          git checkout deploy/web
          git merge main --no-edit
          git push origin deploy/web

  deploy-api:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[deploy-api]')
    steps:
      - uses: actions/checkout@v4
      - name: Merge to deploy/api
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git fetch origin deploy/api
          git checkout deploy/api
          git merge main --no-edit
          git push origin deploy/api
```

**Uso**:
```bash
git commit -m "feat: actualizar dashboard [deploy-web]"
git push
# Automáticamente hace merge a deploy/web y dispara webhook
```

---

## Configuración - Opción 3 (Single Branch)

Si prefieres usar un solo branch (main) para todo:

### Limitación

CapRover no soporta nativamente múltiples apps desde el mismo branch en un monorepo. Necesitarías:

1. **Opción A**: Usar la CLI de CapRover manualmente (pierde automatización)
2. **Opción B**: Usar GitHub Actions como proxy (se explica abajo)

### Opción B: GitHub Actions como Proxy

```yaml
# .github/workflows/caprover-deploy.yml
name: Deploy to CapRover

on:
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.changes.outputs.web }}
      api: ${{ steps.changes.outputs.api }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            web:
              - 'apps/web/**'
              - 'packages/**'
              - 'infra/docker/Dockerfile.web'
            api:
              - 'apps/api/**'
              - 'infra/docker/Dockerfile.api'

  deploy-web:
    needs: detect-changes
    if: needs.detect-changes.outputs.web == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install CapRover CLI
        run: npm install -g caprover
      - name: Deploy Web
        run: |
          # Crear tarball
          tar -czf deploy-web.tar.gz \
            captain-definition \
            infra/docker/Dockerfile.web \
            apps/web \
            packages \
            package.json \
            pnpm-workspace.yaml \
            pnpm-lock.yaml

          # Desplegar
          caprover deploy \
            -h ${{ secrets.CAPROVER_SERVER }} \
            -p ${{ secrets.CAPROVER_PASSWORD }} \
            -a sportia-web \
            -t ./deploy-web.tar.gz

  deploy-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install CapRover CLI
        run: npm install -g caprover
      - name: Deploy API
        run: |
          # Cambiar captain-definition temporalmente
          cat > captain-definition <<EOF
          {
            "schemaVersion": 2,
            "dockerfilePath": "./infra/docker/Dockerfile.api",
            "dockerfileContext": "."
          }
          EOF

          # Crear tarball
          tar -czf deploy-api.tar.gz \
            captain-definition \
            infra/docker/Dockerfile.api \
            apps/api \
            packages

          # Desplegar
          caprover deploy \
            -h ${{ secrets.CAPROVER_SERVER }} \
            -p ${{ secrets.CAPROVER_PASSWORD }} \
            -a sportia-api \
            -t ./deploy-api.tar.gz
```

**Secrets necesarios** (en GitHub: Settings > Secrets):
- `CAPROVER_SERVER`: `https://captain.tu-dominio.com`
- `CAPROVER_PASSWORD`: Tu password de CapRover

---

## Tokens y Credenciales

### GitHub Personal Access Token

1. Ve a https://github.com/settings/tokens
2. `Generate new token` > `Classic`
3. Scopes necesarios:
   - `repo` (todos los permisos)
4. Copia el token (solo se muestra una vez)
5. Úsalo como password en CapRover

### GitLab Access Token

1. Ve a `Settings` > `Access Tokens`
2. Crea token con scope: `read_repository`, `write_repository`
3. Copia y usa en CapRover

---

## Verificar Despliegue

### Ver logs en CapRover

1. Dashboard > Apps > sportia-web (o sportia-api)
2. **App Logs** tab
3. Verás el proceso de build en tiempo real

### Probar webhook manualmente

```bash
# Desde tu máquina local
curl -X POST https://captain.tu-dominio.com/api/v2/user/apps/webhooks/triggerbuild \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "captain",
    "branchName": "deploy/web",
    "repoInfo": {
      "repo": "https://github.com/tu-usuario/sportia",
      "user": "tu-usuario",
      "password": "tu-token"
    }
  }'
```

---

## Troubleshooting

### Webhook no dispara

- Verifica que el webhook esté activo en GitHub/GitLab
- Revisa "Recent Deliveries" en GitHub Webhooks
- Verifica que el branch sea correcto

### Build falla

- Revisa logs en CapRover Dashboard
- Verifica que `captain-definition` apunte al Dockerfile correcto
- Verifica que las rutas sean relativas al contexto

### "Repository not accessible"

- Verifica que el token tenga permisos `repo`
- Para repos privados, asegúrate de usar token, no password

---

## Recomendación Final

Para SPORTIA, recomiendo:

- **Si usas GitHub**: **Opción 1** (Branches separados) con webhooks nativos de CapRover
- **Si necesitas más control**: **Opción B** (GitHub Actions) para detección de cambios automática

La Opción 1 es más simple y no requiere GitHub Actions, solo git y webhooks.
