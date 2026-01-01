# MACAPA - Guía de Despliegue FREE Tier en Render

## 🎯 Objetivo
Desplegar MACAPA en Render con **$0 costo mensual**, preservando los **300 créditos completos**.

## ✅ Optimizaciones Implementadas

### 1. Keep-Alive Service
- **Archivo**: `backend/utils/keepAlive.js`
- **Función**: Evita que el servicio FREE tier se duerma después de 15 minutos
- **Intervalo**: Ping cada 14 minutos
- **Costo**: $0 (no consume créditos adicionales)

### 2. Configuración de Memoria
- **Límite**: 400MB de 512MB disponibles
- **Variable**: `NODE_OPTIONS=--max-old-space-size=400`
- **Optimización**: Garbage collection eficiente

### 3. Rate Limiting Optimizado
- **Ventana**: 15 minutos
- **Máximo**: 50 requests por ventana
- **Objetivo**: Proteger recursos limitados del FREE tier

### 4. Logging Reducido
- **Nivel**: `warn` (solo warnings y errores)
- **Objetivo**: Reducir I/O y uso de memoria

## 📋 Variables de Entorno Requeridas

### En Render Dashboard

1. **FREE Tier Optimizations**
   ```
   OPTIMIZE_FOR_FREE_TIER=true
   ENABLE_KEEP_ALIVE=true
   RENDER_EXTERNAL_URL=https://manu-macapa-api-gmi6.onrender.com
   ```

2. **Keep-Alive Configuration**
   ```
   KEEP_ALIVE_INTERVAL=840000
   KEEP_ALIVE_ENDPOINT=/health
   KEEP_ALIVE_RETRIES=3
   KEEP_ALIVE_TIMEOUT=10000
   ```

3. **Memory Management**
   ```
   NODE_OPTIONS=--max-old-space-size=400
   ```

4. **Rate Limiting**
   ```
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=50
   ```

5. **Logging**
   ```
   LOG_LEVEL=warn
   NODE_ENV=production
   ```

6. **Existing Variables** (mantener las actuales)
   - `GEMINI_API_KEY`
   - `CLICKUP_API_TOKEN`
   - `CLICKUP_WORKSPACE_ID`
   - `CLICKUP_DEFAULT_LIST_ID`
   - `ZAPIER_WEBHOOK_*`

## 🚀 Pasos de Deployment

### Paso 1: Verificar Cambios Locales
```bash
cd /home/ubuntu/macapa-app-deploy
git status
```

### Paso 2: Commit y Push
```bash
git add -A
git commit -m "feat: Add FREE tier optimizations with keep-alive"
git push origin main
```

### Paso 3: Configurar Variables en Render
1. Ir a https://dashboard.render.com/web/srv-d5a5mcq4d50c73fggpdg
2. Click en "Environment"
3. Agregar las variables listadas arriba
4. Click "Save Changes"

### Paso 4: Verificar Deploy
1. Render detectará automáticamente los cambios
2. Iniciará un nuevo deploy
3. Esperar a que el estado sea "Live"

### Paso 5: Verificar Keep-Alive
```bash
curl https://manu-macapa-api-gmi6.onrender.com/api/keep-alive/stats
```

Respuesta esperada:
```json
{
  "service": "MACAPA Keep-Alive Statistics",
  "totalPings": 1,
  "successfulPings": 1,
  "successRate": "100.0%",
  "configuration": {
    "url": "https://manu-macapa-api-gmi6.onrender.com",
    "endpoint": "/health",
    "interval": "14 minutes",
    "enabled": true
  }
}
```

## 📊 Endpoints Disponibles

### Keep-Alive Monitoring
- `GET /api/keep-alive/stats` - Estadísticas del servicio keep-alive

### Health Check (con keep-alive info)
- `GET /health` - Health check con información de keep-alive

### Existing Endpoints
- Todos los endpoints del Super Agente v2.0
- ClickUp integration
- Zapier webhooks
- Orchestrator Alpha/Omega

## 💰 Análisis de Costos

### FREE Tier Actual
- **Plan**: Free
- **Costo Mensual**: $0
- **Créditos Consumidos**: 0 de 300
- **Memoria**: 512MB
- **CPU**: Compartida
- **Bandwidth**: 100GB/mes
- **Build Minutes**: 500/mes

### Capacidad Estimada
- **Usuarios Concurrentes**: 50-100
- **Requests/día**: ~5,000
- **Uptime**: 95%+ (con keep-alive)
- **Response Time**: <1000ms

### Triggers para Upgrade
Considerar upgrade a Starter ($7/mes) cuando:
- Usuarios concurrentes > 100
- Memory usage > 90% por 24h
- Response time > 2000ms promedio
- Necesidad de custom domain

## 🔍 Monitoreo

### Logs en Tiempo Real
```bash
# Desde Render Dashboard
https://dashboard.render.com/web/srv-d5a5mcq4d50c73fggpdg/logs
```

### Métricas Clave
1. **Memory Usage**: Debe estar < 400MB
2. **Response Time**: Debe estar < 1000ms
3. **Keep-Alive Success Rate**: Debe estar > 95%
4. **Uptime**: Debe estar > 95%

### Alertas
- Memory > 450MB: Warning
- Memory > 480MB: Critical
- Keep-alive failures > 3: Warning
- Response time > 2000ms: Warning

## 🛠️ Troubleshooting

### Servicio se duerme
**Síntoma**: Requests lentos después de inactividad
**Solución**: Verificar que `ENABLE_KEEP_ALIVE=true`

### Memory Limit Exceeded
**Síntoma**: Servicio se reinicia frecuentemente
**Solución**: Reducir `NODE_OPTIONS` a `--max-old-space-size=350`

### Keep-Alive Failures
**Síntoma**: Success rate < 90%
**Solución**: Aumentar `KEEP_ALIVE_TIMEOUT` a 15000

### Rate Limit Errors
**Síntoma**: Usuarios reciben 429 Too Many Requests
**Solución**: Aumentar `RATE_LIMIT_MAX_REQUESTS` a 75

## 📈 Próximos Pasos

1. ✅ Deploy con optimizaciones FREE tier
2. ✅ Monitorear métricas por 24-48 horas
3. ⏳ Ejecutar beta program con 50 usuarios
4. ⏳ Analizar necesidad de upgrade
5. ⏳ Preparar migración a Starter si es necesario

## 🎉 Éxito

Una vez desplegado correctamente, deberías ver:
- ✅ Costo mensual: $0
- ✅ Créditos preservados: 300/300
- ✅ Keep-alive activo
- ✅ Super Agente v2.0 funcionando
- ✅ Todos los endpoints operacionales
- ✅ Uptime > 95%

## 📚 Recursos

- [Render FREE Tier Docs](https://render.com/docs/free)
- [MACAPA Documentation](https://github.com/manuelcastrogodoy-web/macapa-deploy)
- [Super Agent Guide](/SUPER_AGENT_DOCUMENTATION.md)
