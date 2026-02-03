#!/bin/bash

# Script para configurar branches de despliegue en CapRover
# Uso: ./infra/caprover/setup-branches.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 SPORTIA - Configurar Branches de Despliegue${NC}"
echo ""

# Verificar que estamos en la raíz
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Ejecuta desde la raíz del proyecto${NC}"
  exit 1
fi

# Verificar que hay remote configurado
if ! git remote get-url origin > /dev/null 2>&1; then
  echo -e "${RED}❌ No hay remote configurado${NC}"
  echo -e "${YELLOW}Primero configura tu repositorio remoto:${NC}"
  echo "  git remote add origin https://github.com/tu-usuario/sportia.git"
  exit 1
fi

REMOTE_URL=$(git remote get-url origin)
echo -e "${GREEN}✓${NC} Remote: ${REMOTE_URL}"
echo ""

# Guardar branch actual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "Branch actual: ${CURRENT_BRANCH}"
echo ""

# Verificar cambios sin commitear
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  Tienes cambios sin commitear${NC}"
  read -p "¿Deseas hacer commit ahora? (y/n): " do_commit
  if [ "$do_commit" = "y" ]; then
    git add .
    read -p "Mensaje de commit: " commit_msg
    git commit -m "$commit_msg"
  else
    echo -e "${RED}Cancela los cambios o haz commit antes de continuar${NC}"
    exit 1
  fi
fi

echo -e "${BLUE}Creando branches de despliegue...${NC}"
echo ""

# ========================================
# Branch deploy/web
# ========================================
echo -e "${YELLOW}📦 Configurando deploy/web...${NC}"

if git rev-parse --verify deploy/web > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Branch deploy/web ya existe"
else
  git checkout -b deploy/web

  # Crear captain-definition para Web
  cat > captain-definition <<EOF
{
  "schemaVersion": 2,
  "dockerfilePath": "./infra/docker/Dockerfile.web",
  "dockerfileContext": "."
}
EOF

  git add captain-definition
  git commit -m "ci: Setup branch deploy/web para CapRover"

  echo -e "${GREEN}✓${NC} Branch deploy/web creado"
fi

# Push
git checkout deploy/web
git push -u origin deploy/web || echo -e "${YELLOW}Branch ya existe en remote${NC}"

# ========================================
# Branch deploy/api
# ========================================
echo ""
echo -e "${YELLOW}📦 Configurando deploy/api...${NC}"

git checkout main

if git rev-parse --verify deploy/api > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Branch deploy/api ya existe"
else
  git checkout -b deploy/api

  # Crear captain-definition para API
  cat > captain-definition <<EOF
{
  "schemaVersion": 2,
  "dockerfilePath": "./infra/docker/Dockerfile.api",
  "dockerfileContext": "."
}
EOF

  git add captain-definition
  git commit -m "ci: Setup branch deploy/api para CapRover"

  echo -e "${GREEN}✓${NC} Branch deploy/api creado"
fi

# Push
git checkout deploy/api
git push -u origin deploy/api || echo -e "${YELLOW}Branch ya existe en remote${NC}"

# ========================================
# Volver al branch original
# ========================================
git checkout "$CURRENT_BRANCH"

echo ""
echo -e "${GREEN}✅ Branches de despliegue creados${NC}"
echo ""
echo "Branches disponibles:"
echo "  • main         → Desarrollo"
echo "  • deploy/web   → Autodeploy de sportia-web"
echo "  • deploy/api   → Autodeploy de sportia-api"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo ""
echo "1. Configura cada app en CapRover Dashboard:"
echo "   Deployment > Method 3 (Deploy from Github/Bitbucket/Gitlab)"
echo ""
echo "   ${YELLOW}sportia-web:${NC}"
echo "   - Repository: ${REMOTE_URL}"
echo "   - Branch: deploy/web"
echo "   - Username: tu-usuario-github"
echo "   - Password: [GitHub Personal Access Token]"
echo ""
echo "   ${YELLOW}sportia-api:${NC}"
echo "   - Repository: ${REMOTE_URL}"
echo "   - Branch: deploy/api"
echo "   - Username: tu-usuario-github"
echo "   - Password: [GitHub Personal Access Token]"
echo ""
echo "2. Copia los webhook URLs generados"
echo ""
echo "3. Configura webhooks en GitHub:"
echo "   Settings > Webhooks > Add webhook"
echo "   - Payload URL: [webhook de CapRover]"
echo "   - Content type: application/json"
echo "   - Events: Just the push event"
echo ""
echo "4. Para desplegar:"
echo "   ${GREEN}git checkout deploy/web && git merge main && git push${NC}"
echo "   ${GREEN}git checkout deploy/api && git merge main && git push${NC}"
echo ""
echo -e "${YELLOW}📚 Lee infra/caprover/CICD.md para más detalles${NC}"
