# 🚀 INSTRUCCIONES DE DEPLOY AUTOMÁTICO - MACAPA

## 📋 **Información de Tu Deploy**

- **Desarrollador**: Manuel Castro Godoy
- **GitHub**: https://github.com/manuelcastrogodoy-web
- **Proyecto**: MACAPA - Sistema de Auditorías Forenses

## 🎯 **URLs Finales (Después del Deploy)**

- 🌐 **Dashboard Frontend**: `https://manu-macapa-dashboard.onrender.com`
- 🔗 **API Backend**: `https://manu-macapa-api.onrender.com`
- 📡 **Webhook para Zapier**: `https://manu-macapa-api.onrender.com/api/webhooks/zapier/agent-activity`
- ✅ **Health Check**: `https://manu-macapa-api.onrender.com/health`

## 🚀 **PASOS PARA DEPLOY (Súper Fácil)**

### **Paso 1: Subir Código a GitHub**

```bash
# 1. Crear repositorio en GitHub (si no existe)
# Ve a: https://github.com/manuelcastrogodoy-web
# Crea nuevo repositorio llamado: "macapa-app"

# 2. Subir código
cd macapa-app
git init
git add .
git commit -m "MACAPA - Sistema completo listo para deploy"
git remote add origin https://github.com/manuelcastrogodoy-web/macapa-app.git
git branch -M main
git push -u origin main
```

### **Paso 2: Deploy en Render.com**

1. **Ir a Render.com**:
   - Ve a: https://render.com
   - Crear cuenta gratis con tu GitHub

2. **Conectar GitHub**:
   - Autorizar acceso a tu repositorio `macapa-app`

3. **Deploy Backend (API)**:
   - Click "New +" → "Web Service"
   - Seleccionar repositorio: `macapa-app`
   - Configuración:
     ```
     Name: manu-macapa-api
     Region: Oregon (US West)
     Branch: main
     Root Directory: backend
     Runtime: Node
     Build Command: npm install
     Start Command: npm start
     ```
   - **Variables de Entorno** (copiar y pegar):
     ```
     NODE_ENV=production
     GEMINI_API_KEY=AIzaSyB8J-mt5VEkrSL3lwh68an_Ni9pbU4d29Q
     ZAPIER_WEBHOOK_SECRET=manu_macapa_webhook_secret_2024
     ALLOWED_ORIGINS=https://manu-macapa-dashboard.onrender.com
     RATE_LIMIT_WINDOW_MS=900000
     RATE_LIMIT_MAX_REQUESTS=100
     LOG_LEVEL=info
     ```
   - Click "Create Web Service"

4. **Deploy Frontend (Dashboard)**:
   - Click "New +" → "Static Site"
   - Seleccionar repositorio: `macapa-app`
   - Configuración:
     ```
     Name: manu-macapa-dashboard
     Branch: main
     Root Directory: frontend
     Build Command: npm install && npm run build
     Publish Directory: build
     ```
   - **Variables de Entorno**:
     ```
     REACT_APP_API_URL=https://manu-macapa-api.onrender.com
     REACT_APP_ENVIRONMENT=production
     GENERATE_SOURCEMAP=false
     ```
   - Click "Create Static Site"

## ⏱️ **Tiempo de Deploy**

- ⏳ **Backend**: 5-8 minutos
- ⏳ **Frontend**: 3-5 minutos
- ✅ **Total**: ~10-15 minutos

## 🧪 **Testing Después del Deploy**

### **1. Verificar Backend**
```bash
# Health check
curl https://manu-macapa-api.onrender.com/health

# Respuesta esperada:
{
  "status": "OK",
  "timestamp": "2024-12-23T...",
  "uptime": 123,
  "environment": "production"
}
```

### **2. Verificar Frontend**
- Ir a: `https://manu-macapa-dashboard.onrender.com`
- Debería cargar el dashboard de MACAPA

### **3. Probar Webhook de Zapier**
```bash
curl -X POST https://manu-macapa-api.onrender.com/api/webhooks/zapier/agent-activity \
  -H "Content-Type: application/json" \
  -d '{
    "recordId": "test-123",
    "type": "audit",
    "clientName": "Cliente Test",
    "projectName": "Proyecto Test",
    "description": "Prueba de deploy",
    "priority": "medium"
  }'
```

## 🔧 **Configurar Zapier**

Una vez que el deploy esté listo:

1. **En tu Zap (ID: 339995837)**:
   - Editar paso "Webhooks by Zapier - POST"
   - Cambiar URL a: `https://manu-macapa-api.onrender.com/api/webhooks/zapier/agent-activity`
   - Método: POST
   - Content-Type: application/json

2. **Probar Zap**:
   - Crear registro de prueba en Zapier Tables
   - Verificar que se ejecuta correctamente

## 📊 **Monitoreo**

### **Logs en Render**:
- Backend: https://dashboard.render.com → manu-macapa-api → Logs
- Frontend: https://dashboard.render.com → manu-macapa-dashboard → Logs

### **Métricas**:
- Dashboard interno: `https://manu-macapa-dashboard.onrender.com/dashboard`
- API stats: `https://manu-macapa-api.onrender.com/api/reports/stats/dashboard`

## 🆘 **Soporte**

Si algo no funciona:

1. **Verificar logs** en Render Dashboard
2. **Revisar variables de entorno** están correctas
3. **Probar endpoints** individualmente
4. **Contactar soporte**: Los archivos incluyen toda la documentación

## 🎉 **¡Listo!**

Una vez completados estos pasos, tendrás:

✅ **Sistema MACAPA** funcionando online
✅ **Webhook** listo para Zapier
✅ **Dashboard** accesible desde cualquier lugar
✅ **API** completa para auditorías automáticas
✅ **Integración IA** con Gemini 2.5 Flash

**¡Tu sistema de auditorías forenses automatizadas estará funcionando 24/7!** 🚀