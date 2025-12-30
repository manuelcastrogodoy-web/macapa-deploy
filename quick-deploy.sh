#!/bin/bash

# 🚀 MACAPA Quick Deploy Script
# Autor: Manuel Castro Godoy
# Este script automatiza el deploy completo de MACAPA

echo "🚀 MACAPA - Deploy Automático Iniciado"
echo "======================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
show_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

show_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    show_error "No se encontró package.json. Asegúrate de estar en el directorio macapa-app"
    exit 1
fi

show_message "Verificando estructura del proyecto..."

# Verificar estructura de archivos
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    show_error "Estructura de proyecto incorrecta. Se necesitan carpetas 'backend' y 'frontend'"
    exit 1
fi

show_success "Estructura del proyecto verificada ✓"

# Configurar Git si no está configurado
show_message "Configurando Git..."

if [ ! -d ".git" ]; then
    git init
    show_success "Repositorio Git inicializado ✓"
fi

# Agregar archivos al repositorio
show_message "Preparando archivos para deploy..."

git add .
git commit -m "MACAPA - Sistema completo listo para deploy en Render.com

- Backend API con webhook para Zapier
- Frontend Dashboard con React + Material-UI  
- Integración IA con Gemini 2.5 Flash
- Configuración automática para Render.com
- Variables de entorno configuradas
- Documentación completa incluida

Deploy configurado para:
- API: https://manu-macapa-api.onrender.com
- Dashboard: https://manu-macapa-dashboard.onrender.com
- Webhook: https://manu-macapa-api.onrender.com/api/webhooks/zapier/agent-activity"

show_success "Archivos preparados para deploy ✓"

# Mostrar información de deploy
echo ""
echo "🎯 INFORMACIÓN DE DEPLOY"
echo "========================"
echo ""
echo "📋 URLs que tendrás después del deploy:"
echo "   🌐 Dashboard: https://manu-macapa-dashboard.onrender.com"
echo "   🔗 API: https://manu-macapa-api.onrender.com"
echo "   📡 Webhook Zapier: https://manu-macapa-api.onrender.com/api/webhooks/zapier/agent-activity"
echo ""
echo "🔧 Configuración incluida:"
echo "   ✅ Gemini API Key configurada"
echo "   ✅ Variables de entorno listas"
echo "   ✅ CORS configurado"
echo "   ✅ Rate limiting activado"
echo "   ✅ Logs automáticos"
echo ""

# Verificar si hay remote configurado
if ! git remote get-url origin > /dev/null 2>&1; then
    show_warning "No hay remote de GitHub configurado"
    echo ""
    echo "📝 PRÓXIMOS PASOS MANUALES:"
    echo "=========================="
    echo ""
    echo "1. 📁 Crear repositorio en GitHub:"
    echo "   - Ve a: https://github.com/manuelcastrogodoy-web"
    echo "   - Crea nuevo repositorio: 'macapa-app'"
    echo "   - NO inicialices con README"
    echo ""
    echo "2. 🔗 Conectar repositorio local:"
    echo "   git remote add origin https://github.com/manuelcastrogodoy-web/macapa-app.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    echo "3. 🚀 Deploy en Render.com:"
    echo "   - Ve a: https://render.com"
    echo "   - Crea cuenta gratis"
    echo "   - Conecta GitHub"
    echo "   - Sigue las instrucciones en: deploy-instructions.md"
    echo ""
else
    show_message "Remote de GitHub detectado, intentando push..."
    
    if git push origin main 2>/dev/null; then
        show_success "Código subido a GitHub exitosamente ✓"
        echo ""
        echo "🎉 ¡LISTO PARA DEPLOY!"
        echo "===================="
        echo ""
        echo "📝 Próximo paso:"
        echo "   1. Ve a: https://render.com"
        echo "   2. Crea cuenta gratis"
        echo "   3. Conecta tu GitHub"
        echo "   4. Sigue las instrucciones en: deploy-instructions.md"
        echo ""
        echo "⏱️  Tiempo estimado de deploy: 10-15 minutos"
        echo ""
    else
        show_warning "No se pudo hacer push automático"
        echo ""
        echo "🔧 Ejecuta manualmente:"
        echo "   git push origin main"
        echo ""
        echo "   Luego sigue las instrucciones en: deploy-instructions.md"
    fi
fi

echo "📚 ARCHIVOS DE AYUDA CREADOS:"
echo "   📖 deploy-instructions.md - Guía paso a paso"
echo "   🔧 render.yaml - Configuración automática"
echo "   ⚙️  .env.production - Variables de entorno"
echo ""

show_success "Script de deploy completado ✓"
echo ""
echo "🎯 Tu sistema MACAPA está listo para funcionar 24/7 en la nube"
echo "   Una vez desplegado, podrás automatizar auditorías forenses con IA"
echo ""
echo "🆘 ¿Necesitas ayuda? Revisa deploy-instructions.md"