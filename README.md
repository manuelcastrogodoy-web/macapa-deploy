# MACAPA - Sistema de Auditorías Forenses Automatizadas

Sistema completo de generación automática de auditorías forenses, consultorías y reportes utilizando IA (Gemini 2.5 Flash) e integración con Zapier.

## 🚀 Características Principales

- **Generación Automática con IA**: Utiliza Gemini 2.5 Flash para crear contenido profesional
- **Integración Zapier**: Webhook endpoint para automatización completa del flujo
- **Dashboard Interactivo**: Interfaz moderna con React y Material-UI
- **Múltiples Tipos de Contenido**: Auditorías forenses, consultorías y reportes
- **Análisis en Tiempo Real**: Métricas y estadísticas de productividad

## 🏗️ Arquitectura

```
macapa-app/
├── backend/                 # API Node.js + Express
│   ├── routes/             # Endpoints REST
│   ├── services/           # Lógica de negocio
│   └── utils/              # Utilidades y logging
└── frontend/               # React Dashboard
    ├── src/
    │   ├── components/     # Componentes reutilizables
    │   └── pages/          # Páginas principales
    └── public/
```

## 🔧 Instalación y Configuración

### Backend

1. **Instalar dependencias**:
```bash
cd macapa-app/backend
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=tu_api_key_de_gemini
ZAPIER_WEBHOOK_SECRET=tu_secret_de_zapier
ALLOWED_ORIGINS=http://localhost:3000,https://mafersapp-dcug8tre.manus.space
```

3. **Iniciar servidor**:
```bash
npm run dev
```

### Frontend

1. **Instalar dependencias**:
```bash
cd macapa-app/frontend
npm install
```

2. **Iniciar aplicación**:
```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📡 Integración con Zapier

### Configuración del Zap (ID: 339995837)

1. **Zapier Tables** - New or Updated Record
   - Trigger cuando se actualiza la tabla de auditorías

2. **Manus** - Create Task
   - Crea tarea en Manus con los datos

3. **Webhooks by Zapier** - POST
   - URL: `https://tu-dominio.com/api/webhooks/zapier/agent-activity`
   - Método: POST
   - Content-Type: application/json

4. **Google Docs** - Create Document
   - Genera documento con resultados procesados

5. **Paths** - Split into 3 paths:
   - **Path A**: Auditorías Complejas (riesgo alto/crítico)
   - **Path B**: Duplicados (contenido similar existente)
   - **Path C**: General (flujo estándar)

### Estructura del Payload

```json
{
  "recordId": "string",
  "type": "audit|consultancy|report",
  "clientName": "string",
  "projectName": "string",
  "description": "string",
  "priority": "high|medium|low",
  "analysisData": {},
  "timestamp": "ISO8601",
  "auditType": "financial|digital|compliance|security",
  "evidenceFiles": ["array", "of", "strings"],
  "complianceFramework": "string",
  "riskLevel": "critical|high|medium|low"
}
```

## 🤖 IA - Gemini 2.5 Flash

### Capacidades

- **Auditorías Forenses**: Análisis especializado por tipo (financiera, digital, cumplimiento, seguridad)
- **Consultorías**: Análisis estratégico y recomendaciones accionables
- **Reportes**: Análisis de datos y generación de insights

### Configuración

```javascript
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  }
});
```

## 📊 API Endpoints

### Webhooks
- `POST /api/webhooks/zapier/agent-activity` - Endpoint principal de Zapier
- `GET /api/webhooks/zapier/test` - Prueba de conectividad
- `POST /api/webhooks/zapier/validate` - Validación de payload

### Reportes
- `GET /api/reports` - Lista de reportes con filtros
- `GET /api/reports/:id` - Detalle de reporte específico
- `GET /api/reports/stats/dashboard` - Estadísticas para dashboard
- `POST /api/reports` - Crear nuevo reporte
- `PUT /api/reports/:id` - Actualizar reporte
- `DELETE /api/reports/:id` - Eliminar reporte

### IA
- `POST /api/ai/test` - Probar conexión con Gemini
- `POST /api/ai/generate` - Generar contenido con IA
- `GET /api/ai/models` - Información de modelos disponibles
- `POST /api/ai/analyze` - Análisis de contenido existente

## 🎨 Dashboard Features

### Páginas Principales

1. **Dashboard**: Métricas, gráficos y actividad reciente
2. **Reportes**: Gestión completa de reportes con filtros
3. **Detalle de Reporte**: Vista completa con metadatos
4. **Configuración Zapier**: Setup y pruebas de integración
5. **Pruebas IA**: Testing del sistema de generación

### Componentes

- **Navbar**: Navegación principal con notificaciones
- **Sidebar**: Menú lateral colapsible
- **Charts**: Visualizaciones con Recharts
- **Filters**: Sistema avanzado de filtrado
- **Cards**: Componentes informativos responsivos

## 🔒 Seguridad

- **Rate Limiting**: 100 requests por 15 minutos
- **CORS**: Configuración de orígenes permitidos
- **Helmet**: Headers de seguridad
- **Validación**: Joi para validación de payloads
- **Logging**: Winston para auditoría completa

## 📈 Monitoreo

### Logs
- `logs/error.log` - Errores del sistema
- `logs/combined.log` - Todos los eventos

### Métricas
- Tiempo de procesamiento de webhooks
- Estadísticas de generación IA
- Métricas de productividad
- Análisis de uso por tipo de contenido

## 🚀 Despliegue

### Producción

1. **Variables de entorno**:
```env
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=tu_api_key_produccion
ZAPIER_WEBHOOK_SECRET=tu_secret_produccion
```

2. **Build frontend**:
```bash
cd frontend && npm run build
```

3. **Iniciar servidor**:
```bash
cd backend && npm start
```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@macapa.com
- Documentación: [docs.macapa.com](https://docs.macapa.com)
- Issues: [GitHub Issues](https://github.com/macapa/issues)

---

**MACAPA** - Automatizando auditorías forenses con IA 🤖✨