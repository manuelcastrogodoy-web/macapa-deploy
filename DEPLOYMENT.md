# Guía de Despliegue - MACAPA

## 🚀 Opciones de Despliegue

### 1. Despliegue Local con Docker

```bash
# Clonar el repositorio
git clone <repository-url>
cd macapa-app

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales

# Construir y ejecutar con Docker Compose
docker-compose up -d

# Verificar estado
docker-compose ps
```

### 2. Despliegue en Manus.space

#### Backend API

1. **Preparar archivos**:
```bash
cd backend
zip -r macapa-backend.zip . -x "node_modules/*" "logs/*" ".env"
```

2. **Subir a Manus**:
   - Acceder a https://mafersapp-dcug8tre.manus.space
   - Subir `macapa-backend.zip`
   - Configurar variables de entorno en el panel

3. **Variables de entorno requeridas**:
```env
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=tu_api_key_aqui
ZAPIER_WEBHOOK_SECRET=tu_secret_zapier
ALLOWED_ORIGINS=https://mafersapp-dcug8tre.manus.space
```

#### Frontend Dashboard

1. **Build de producción**:
```bash
cd frontend
npm run build
```

2. **Subir build**:
   - Comprimir carpeta `build/`
   - Subir a Manus como aplicación estática

### 3. Despliegue en Vercel/Netlify

#### Frontend (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la carpeta frontend
cd frontend
vercel --prod
```

#### Backend (Railway/Render)

1. **Railway**:
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Deploy
cd backend
railway login
railway init
railway up
```

2. **Render**:
   - Conectar repositorio GitHub
   - Configurar build command: `npm install`
   - Configurar start command: `npm start`

## 🔧 Configuración de Producción

### Variables de Entorno

```env
# Backend (.env)
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=AIzaSy...
ZAPIER_WEBHOOK_SECRET=webhook_secret_123
ALLOWED_ORIGINS=https://tu-dominio.com,https://mafersapp-dcug8tre.manus.space
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Nginx (Opcional)

```nginx
# /etc/nginx/sites-available/macapa
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoreo y Logs

### Health Checks

```bash
# Backend health
curl https://tu-dominio.com/api/health

# Respuesta esperada:
{
  "status": "OK",
  "timestamp": "2024-12-23T...",
  "uptime": 3600,
  "environment": "production"
}
```

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f macapa-backend

# Logs específicos
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

### Métricas

- **Endpoint**: `/api/reports/stats/dashboard`
- **Webhook Stats**: Tiempo de procesamiento en logs
- **AI Performance**: Tokens utilizados y tiempo de respuesta

## 🔒 Seguridad en Producción

### 1. HTTPS Obligatorio

```javascript
// En server.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 2. Rate Limiting Estricto

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 requests por IP
  message: 'Too many requests',
});
```

### 3. Validación de Webhooks

```javascript
// Verificar firma de Zapier
const isValidSignature = zapierService.verifySignature(
  req.body, 
  req.headers['x-zapier-signature']
);
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión con Gemini**:
```bash
# Verificar API key
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1/models
```

2. **Webhook no recibe datos**:
```bash
# Probar endpoint
curl -X POST https://tu-dominio.com/api/webhooks/zapier/test
```

3. **Frontend no carga**:
```bash
# Verificar build
cd frontend && npm run build
# Verificar proxy en package.json
```

### Logs de Debug

```javascript
// Activar logs detallados
LOG_LEVEL=debug npm start
```

## 📈 Escalabilidad

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  macapa-backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### Load Balancer

```nginx
upstream backend {
    server macapa-backend-1:3001;
    server macapa-backend-2:3001;
    server macapa-backend-3:3001;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy MACAPA
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
          
      - name: Build frontend
        run: cd frontend && npm run build
        
      - name: Deploy to production
        run: |
          # Tu script de deploy aquí
```

## 📞 Soporte Post-Despliegue

### Contactos de Emergencia
- **DevOps**: devops@macapa.com
- **Backend**: backend@macapa.com
- **Frontend**: frontend@macapa.com

### Documentación Adicional
- [API Documentation](./API.md)
- [Zapier Integration Guide](./ZAPIER.md)
- [Monitoring Setup](./MONITORING.md)

---

¿Necesitas ayuda con el despliegue? Contacta al equipo de soporte técnico.