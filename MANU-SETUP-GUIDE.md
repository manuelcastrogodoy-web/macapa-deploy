# 🎯 GUÍA COMPLETA PARA MANU - MACAPA DEPLOY

## 👋 ¡Hola Manu!

He configurado **TODO** para que tengas tu sistema MACAPA funcionando online en **menos de 20 minutos**. Solo necesitas seguir estos pasos súper simples.

## 🚀 **OPCIÓN 1: DEPLOY AUTOMÁTICO (RECOMENDADO)**

### **Paso 1: Ejecutar Script Automático**
```bash
cd macapa-app
./quick-deploy.sh
```

El script hace **TODO** automáticamente:
- ✅ Configura Git
- ✅ Prepara archivos
- ✅ Te da las instrucciones exactas
- ✅ Te dice qué hacer en cada paso

### **Paso 2: Crear Repositorio GitHub**
1. Ve a: https://github.com/manuelcastrogodoy-web
2. Click "New repository"
3. Nombre: `macapa-app`
4. **NO** marcar "Initialize with README"
5. Click "Create repository"

### **Paso 3: Subir Código**
```bash
git remote add origin https://github.com/manuelcastrogodoy-web/macapa-app.git
git branch -M main
git push -u origin main
```

### **Paso 4: Deploy en Render**
1. Ve a: https://render.com
2. Crear cuenta gratis con GitHub
3. Click "New +" → "Web Service"
4. Seleccionar tu repo `macapa-app`
5. **Copiar y pegar esta configuración**:

#### **Backend (API)**:
```
Name: manu-macapa-api
Region: Oregon
Root Directory: backend
Build Command: npm install
Start Command: npm start

Variables de Entorno:
NODE_ENV=production
GEMINI_API_KEY=AIzaSyB8J-mt5VEkrSL3lwh68an_Ni9pbU4d29Q
ZAPIER_WEBHOOK_SECRET=manu_macapa_webhook_secret_2024
ALLOWED_ORIGINS=https://manu-macapa-dashboard.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### **Frontend (Dashboard)**:
```
Name: manu-macapa-dashboard
Type: Static Site
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: build

Variables de Entorno:
REACT_APP_API_URL=https://manu-macapa-api.onrender.com
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

## 🎯 **RESULTADO FINAL**

Después del deploy tendrás:

- 🌐 **Tu Dashboard**: `https://manu-macapa-dashboard.onrender.com`
- 🔗 **Tu API**: `https://manu-macapa-api.onrender.com`
- 📡 **Webhook para Zapier**: `https://manu-macapa-api.onrender.com/api/webhooks/zapier/agent-activity`

## 🧪 **PROBAR QUE FUNCIONA**

### **1. Verificar API**
Ve a: `https://manu-macapa-api.onrender.com/health`

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2024-12-23T...",
  "uptime": 123,
  "environment": "production"
}
```

### **2. Verificar Dashboard**
Ve a: `https://manu-macapa-dashboard.onrender.com`

Deberías ver el dashboard de MACAPA cargando.

### **3. Probar IA**
En el dashboard:
1. Ve a "Pruebas IA"
2. Click "Probar Conexión con IA"
3. Debería mostrar "Conexión exitosa"

## 🔧 **CONFIGURAR ZAPIER**

Una vez que todo funcione:

1. **En tu Zap (ID: 339995837)**:
   - Editar paso "Webhooks by Zapier"
   - Cambiar URL a: `https://manu-macapa-api.onrender.com/api/webhooks/zapier/agent-activity`
   - Método: POST
   - Content-Type: application/json

2. **Probar Zap**:
   - Crear registro de prueba en Zapier Tables
   - Verificar que genera auditoría automáticamente

## 🆘 **SI ALGO NO FUNCIONA**

### **Problema: Error en deploy**
- Revisar logs en Render Dashboard
- Verificar que variables de entorno están correctas

### **Problema: Frontend no carga**
- Verificar que backend está funcionando primero
- Revisar URL de API en variables de entorno

### **Problema: Zapier no funciona**
- Probar webhook manualmente con curl
- Verificar que URL está correcta en Zap

## 📞 **CONTACTO**

Si necesitas ayuda:
- Todos los archivos tienen documentación completa
- `deploy-instructions.md` tiene pasos detallados
- `ZAPIER_INTEGRATION.md` tiene guía de Zapier

## 🎉 **¡ESO ES TODO!**

En **20 minutos máximo** tendrás:

✅ **Sistema MACAPA** funcionando 24/7
✅ **Auditorías automáticas** con IA
✅ **Dashboard profesional** 
✅ **Integración Zapier** completa
✅ **Webhook** listo para usar

**¡Tu sistema de auditorías forenses automatizadas estará listo para usar!** 🚀

---

**Configurado especialmente para Manuel Castro Godoy** 
**GitHub**: https://github.com/manuelcastrogodoy-web
**Proyecto**: MACAPA - Sistema de Auditorías Forenses