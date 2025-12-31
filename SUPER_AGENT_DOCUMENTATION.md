# 🤖 MACAPA Super Agent - Documentación Completa v2.0

## Resumen Ejecutivo

El **MACAPA Super Agent** es un sistema de automatización inteligente que integra:
- **Análisis de tareas con IA** (Gemini 2.5 Flash)
- **Gestión de proyectos en ClickUp**
- **Automatización con Zapier**
- **Orquestación Alpha/Omega** para ciclo de vida de proyectos

---

## 📁 Estructura de Archivos

```
backend/
├── services/
│   ├── superAgentService.js      # Agente principal autónomo
│   ├── clickUpService.js         # Integración con ClickUp
│   ├── zapierIntegrationService.js # Integración con Zapier
│   ├── orchestratorService.js    # Orquestador Alpha/Omega
│   ├── aiService.js              # Servicio de IA (existente)
│   └── zapierService.js          # Servicio Zapier (existente)
├── routes/
│   ├── superagent.js             # API del Super Agent
│   ├── clickup.js                # API de ClickUp
│   ├── zapier.js                 # API de Zapier
│   ├── orchestrator.js           # API del Orquestador
│   └── ... (rutas existentes)
└── server.js                     # Servidor principal actualizado
```

---

## 🚀 Endpoints del Super Agent

### Procesamiento Autónomo

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/superagent/process` | POST | Procesa solicitud de forma autónoma |
| `/api/superagent/analyze` | POST | Analiza sin ejecutar acciones |
| `/api/superagent/alpha` | POST | Inicia proyecto (flujo Alpha) |
| `/api/superagent/omega` | POST | Finaliza proyecto (flujo Omega) |
| `/api/superagent/audit` | POST | Procesa auditoría |
| `/api/superagent/task` | POST | Crea tarea inteligente |
| `/api/superagent/report` | POST | Genera reporte |

### Estado y Configuración

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/superagent/status` | GET | Estado del agente |
| `/api/superagent/stats` | GET | Estadísticas de aprendizaje |
| `/api/superagent/mode` | PUT | Cambiar modo (autonomous/supervised/manual) |
| `/api/superagent/confidence` | PUT | Ajustar umbral de confianza |
| `/api/superagent/webhook` | POST | Recibir webhooks externos |

---

## 📋 Endpoints de ClickUp

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/clickup/status` | GET | Estado de conexión |
| `/api/clickup/workspaces` | GET | Listar workspaces |
| `/api/clickup/spaces/:teamId` | GET | Listar spaces |
| `/api/clickup/lists/:spaceId` | GET | Listar listas |
| `/api/clickup/tasks` | POST | Crear tarea |
| `/api/clickup/tasks/:listId` | GET | Obtener tareas |
| `/api/clickup/task/:taskId` | GET/PUT | Obtener/Actualizar tarea |
| `/api/clickup/task/:taskId/subtask` | POST | Crear subtarea |
| `/api/clickup/task/:taskId/comment` | POST | Agregar comentario |
| `/api/clickup/tasks/batch` | POST | Crear múltiples tareas |
| `/api/clickup/project` | POST | Crear estructura de proyecto |
| `/api/clickup/search` | GET | Buscar tareas |
| `/api/clickup/stats` | GET | Estadísticas del workspace |
| `/api/clickup/webhook` | POST | Crear webhook |
| `/api/clickup/webhooks` | GET | Listar webhooks |
| `/api/clickup/webhook/incoming` | POST | Recibir webhooks |

---

## 🔗 Endpoints de Zapier

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/zapier/status` | GET | Estado de integración |
| `/api/zapier/config` | GET | Configuración actual |
| `/api/zapier/webhook/send` | POST | Enviar webhook |
| `/api/zapier/webhook/incoming` | POST | Recibir webhooks |
| `/api/zapier/trigger/:zapType` | POST | Disparar Zap específico |
| `/api/zapier/alpha` | POST | Disparar flujo Alpha |
| `/api/zapier/omega` | POST | Disparar flujo Omega |
| `/api/zapier/notify` | POST | Enviar notificación |
| `/api/zapier/escalate` | POST | Enviar escalamiento |
| `/api/zapier/sync-table` | POST | Sincronizar con Tables |
| `/api/zapier/sync-agent` | POST | Sincronizar actividad |
| `/api/zapier/determine-path` | POST | Determinar path A/B/C |
| `/api/zapier/queue` | POST | Encolar evento |
| `/api/zapier/test/:webhookType` | POST | Probar webhook |
| `/api/zapier/stats` | GET | Estadísticas |
| `/api/zapier/interfaces` | GET | Listar interfaces |

---

## 🎯 Endpoints del Orquestador

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/orchestrator/alpha` | POST | Iniciar proyecto |
| `/api/orchestrator/omega` | POST | Finalizar proyecto |
| `/api/orchestrator/status` | GET | Estado del orquestador |
| `/api/orchestrator/projects` | GET | Listar proyectos activos |
| `/api/orchestrator/project/:id` | GET | Obtener proyecto |
| `/api/orchestrator/metrics` | GET | Métricas |
| `/api/orchestrator/templates` | GET | Templates disponibles |
| `/api/orchestrator/quick-start` | POST | Inicio rápido con template |

---

## 📖 Ejemplos de Uso

### 1. Procesar Solicitud Autónoma

```bash
curl -X POST https://your-api.com/api/superagent/process \
  -H "Content-Type: application/json" \
  -d '{
    "type": "audit",
    "client": "Empresa ABC",
    "project": "Auditoría de Seguridad 2025",
    "priority": "high",
    "description": "Evaluación completa de seguridad informática"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "requestId": "SA-1735612345-abc123",
  "analysis": {
    "type": "audit",
    "priority": "high",
    "category": "security",
    "complexity": "complex",
    "riskLevel": 7,
    "requiredActions": ["create_task", "notify_team", "generate_content"],
    "suggestedWorkflow": "alpha",
    "confidence": 0.85
  },
  "actions": [...],
  "results": [...],
  "executionTime": 2345,
  "agentMode": "autonomous"
}
```

### 2. Iniciar Proyecto (Alpha)

```bash
curl -X POST https://your-api.com/api/orchestrator/alpha \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Auditoría Forense - Cliente XYZ",
    "client": "Cliente XYZ",
    "type": "audit_forensic",
    "priority": "high",
    "description": "Investigación de incidente de seguridad"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "workflow": "alpha",
  "projectId": "PRJ-M5ABC-XY12",
  "projectName": "Auditoría Forense - Cliente XYZ",
  "status": "active",
  "phases": [
    {"name": "initialization", "status": "completed"},
    {"name": "structure_creation", "status": "completed"},
    {"name": "team_notification", "status": "completed"},
    {"name": "workflow_activation", "status": "completed"}
  ],
  "createdTasks": [
    {"type": "main", "taskId": "abc123", "taskUrl": "..."},
    {"type": "subtask", "taskId": "def456", "taskUrl": "..."}
  ],
  "executionTime": 5432
}
```

### 3. Finalizar Proyecto (Omega)

```bash
curl -X POST https://your-api.com/api/orchestrator/omega \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PRJ-M5ABC-XY12",
    "generateReport": true,
    "notifyClient": true,
    "summary": "Investigación completada. Se identificaron 3 vulnerabilidades críticas."
  }'
```

### 4. Crear Tarea en ClickUp

```bash
curl -X POST https://your-api.com/api/clickup/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Revisar logs de seguridad",
    "description": "Análisis de logs del servidor principal",
    "priority": 2,
    "tags": ["seguridad", "logs"],
    "listId": "901309298887"
  }'
```

### 5. Disparar Zap

```bash
curl -X POST https://your-api.com/api/zapier/trigger/auditResult \
  -H "Content-Type: application/json" \
  -d '{
    "auditId": "AUD-001",
    "client": "Empresa ABC",
    "riskLevel": 7,
    "findings": ["Vulnerabilidad crítica en firewall"]
  }'
```

---

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# AI
GEMINI_API_KEY=your_key

# ClickUp
CLICKUP_API_TOKEN=pk_168250572_...
CLICKUP_WORKSPACE_ID=90132602813
CLICKUP_DEFAULT_LIST_ID=901309298887

# Zapier Webhooks
ZAPIER_WEBHOOK_AGENT_ACTIVITY=https://hooks.zapier.com/...
ZAPIER_WEBHOOK_AUDIT_RESULT=https://hooks.zapier.com/...
ZAPIER_WEBHOOK_ALPHA_OMEGA=https://hooks.zapier.com/...
```

---

## 🎭 Modos del Agente

| Modo | Descripción |
|------|-------------|
| `autonomous` | Ejecuta acciones automáticamente sin intervención |
| `supervised` | Requiere confirmación para acciones de alto riesgo |
| `manual` | Solo analiza, no ejecuta acciones |

### Cambiar Modo

```bash
curl -X PUT https://your-api.com/api/superagent/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "supervised"}'
```

---

## 📊 Templates de Proyecto

| Template | Descripción | Tareas |
|----------|-------------|--------|
| `audit_forensic` | Auditoría Forense | 7 tareas |
| `compliance` | Auditoría de Cumplimiento | 5 tareas |
| `security` | Evaluación de Seguridad | 5 tareas |
| `general` | Proyecto General | 4 tareas |

### Inicio Rápido con Template

```bash
curl -X POST https://your-api.com/api/orchestrator/quick-start \
  -H "Content-Type: application/json" \
  -d '{
    "template": "audit_forensic",
    "client": "Empresa ABC",
    "priority": "high"
  }'
```

---

## 🔄 Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────────┐
│                    SOLICITUD ENTRANTE                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUPER AGENT - ANÁLISIS                       │
│  • Analiza con Gemini AI                                     │
│  • Determina tipo, prioridad, categoría                      │
│  • Calcula nivel de riesgo y confianza                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              DETERMINACIÓN DE ACCIONES                       │
│  • Crear tarea en ClickUp                                    │
│  • Disparar Zap correspondiente                              │
│  • Iniciar flujo Alpha/Omega                                 │
│  • Generar contenido con IA                                  │
│  • Enviar notificaciones                                     │
│  • Escalar si es necesario                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   VALIDACIÓN                                 │
│  • Verificar confianza > umbral                              │
│  • Aplicar reglas de negocio                                 │
│  • Auto-aprobar tareas rutinarias                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EJECUCIÓN                                  │
│  • Ejecutar acciones validadas                               │
│  • Sincronizar con sistemas externos                         │
│  • Registrar para aprendizaje                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESULTADO                                  │
│  • Retornar resultados al cliente                            │
│  • Actualizar métricas                                       │
│  • Notificar stakeholders                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Métricas y Aprendizaje

El Super Agent registra cada ejecución para mejorar continuamente:

- **Tasa de éxito** por tipo de tarea
- **Patrones de uso** frecuentes
- **Tiempo de ejecución** promedio
- **Confianza** de análisis

### Obtener Estadísticas

```bash
curl https://your-api.com/api/superagent/stats
```

---

## 🔐 Seguridad

- **Firmas HMAC** para webhooks
- **Rate limiting** configurado
- **CORS** restringido
- **Helmet** para headers de seguridad

---

## 📞 Soporte

- **Dashboard:** https://manu-macapa-dashboard-gmi6.onrender.com
- **API:** https://manu-macapa-api-gmi6.onrender.com
- **GitHub:** https://github.com/manuelcastrogodoy-web/macapa-deploy

---

*Documentación generada por MACAPA System v2.0*
*Última actualización: 31 de Diciembre, 2025*
