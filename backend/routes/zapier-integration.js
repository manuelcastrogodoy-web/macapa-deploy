const express = require('express');
const router = express.Router();
const axios = require('axios');

// ============================================================
// MACAPA - ZAPIER INTEGRATION MODULE
// Integración completa con Zaps, Tables, Interfaces y Agents
// ============================================================

// Configuración de URLs de Zapier del usuario
const ZAPIER_CONFIG = {
  // Interfaces
  interfaces: {
    sistemaPaLaHumanidad: 'https://sistema-para-la-humanidad.zapier.app/',
    macapaDashboard: 'https://macapa-dashboard.zapier.app/',
    informesForenses: 'https://informes-forenses-completados.zapier.app/',
    templateRequestForm: 'https://template-request-form-747698.zapier.app/',
    tableInterface: 'https://table-interface-28accd.zapier.app/'
  },
  
  // Zaps activos relacionados con MACAPA
  zaps: {
    resultadosAuditoriasForenses: '339995837',
    macapaAuditoriaForense: '340287305',
    macapaWebhookSincronizar: '340008726',
    susurroSinfonico: '340164667'
  },
  
  // Tables principales
  tables: {
    auditoriasForensesResultados: 'Auditorías Forenses - Resultados',
    entregablesMacapa: 'Entregables MACAPA',
    discoveryUpload: 'Discovery + Upload Unificado',
    macapaVideoExports: 'MACAPA Video Exports',
    macapaVideoTemplates: 'MACAPA Video Templates',
    macapaVideoConfig: 'MACAPA Video Config',
    macapaVideoJobs: 'MACAPA Video Jobs',
    enviosDocumentos: 'Envios de Documentos Macapa'
  },
  
  // Webhook URLs
  webhooks: {
    agentActivity: process.env.ZAPIER_WEBHOOK_AGENT_ACTIVITY || '',
    auditResult: process.env.ZAPIER_WEBHOOK_AUDIT_RESULT || '',
    reportGenerated: process.env.ZAPIER_WEBHOOK_REPORT_GENERATED || ''
  }
};

// ============================================================
// GET /api/zapier/config - Obtener configuración de Zapier
// ============================================================
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      interfaces: ZAPIER_CONFIG.interfaces,
      zaps: Object.keys(ZAPIER_CONFIG.zaps).map(key => ({
        name: key,
        id: ZAPIER_CONFIG.zaps[key]
      })),
      tables: Object.keys(ZAPIER_CONFIG.tables).map(key => ({
        key: key,
        name: ZAPIER_CONFIG.tables[key]
      })),
      webhooksConfigured: {
        agentActivity: !!ZAPIER_CONFIG.webhooks.agentActivity,
        auditResult: !!ZAPIER_CONFIG.webhooks.auditResult,
        reportGenerated: !!ZAPIER_CONFIG.webhooks.reportGenerated
      }
    }
  });
});

// ============================================================
// GET /api/zapier/interfaces - Listar interfaces disponibles
// ============================================================
router.get('/interfaces', (req, res) => {
  const interfaces = [
    {
      name: 'Sistema para la Humanidad',
      url: ZAPIER_CONFIG.interfaces.sistemaPaLaHumanidad,
      pages: 10,
      description: 'Sistema integral de gestión humanitaria'
    },
    {
      name: 'Macapa Dashboard',
      url: ZAPIER_CONFIG.interfaces.macapaDashboard,
      pages: 6,
      description: 'Dashboard principal de MACAPA en Zapier'
    },
    {
      name: 'Informes Forenses Completados',
      url: ZAPIER_CONFIG.interfaces.informesForenses,
      pages: 30,
      description: 'Visualización de informes forenses completados'
    },
    {
      name: 'Template Request Form',
      url: ZAPIER_CONFIG.interfaces.templateRequestForm,
      pages: 1,
      description: 'Formulario de solicitud de templates'
    },
    {
      name: 'Table Interface',
      url: ZAPIER_CONFIG.interfaces.tableInterface,
      pages: 3,
      description: 'Interfaz de tablas genérica'
    }
  ];
  
  res.json({
    success: true,
    count: interfaces.length,
    interfaces
  });
});

// ============================================================
// GET /api/zapier/tables - Listar tables disponibles
// ============================================================
router.get('/tables', (req, res) => {
  const tables = [
    {
      key: 'auditoriasForensesResultados',
      name: 'Auditorías Forenses - Resultados',
      description: 'Almacena resultados de análisis de auditorías forenses con IA'
    },
    {
      key: 'entregablesMacapa',
      name: 'Entregables MACAPA',
      description: 'Base de datos de los 3 paquetes (LITE, PRO, ENTERPRISE)'
    },
    {
      key: 'discoveryUpload',
      name: 'Discovery + Upload Unificado',
      description: 'Combina datos empresa + archivos en un único flujo'
    },
    {
      key: 'macapaVideoExports',
      name: 'MACAPA Video Exports',
      description: 'Gestión de videos generados por MACAPA Video Engine'
    },
    {
      key: 'macapaVideoTemplates',
      name: 'MACAPA Video Templates',
      description: 'Biblioteca de templates de video'
    },
    {
      key: 'macapaVideoConfig',
      name: 'MACAPA Video Config',
      description: 'Configuraciones del Video Engine'
    },
    {
      key: 'macapaVideoJobs',
      name: 'MACAPA Video Jobs',
      description: 'Control de trabajos de generación de video'
    },
    {
      key: 'enviosDocumentos',
      name: 'Envios de Documentos Macapa',
      description: 'Gestión de documentos con trazabilidad completa'
    }
  ];
  
  res.json({
    success: true,
    count: tables.length,
    tables
  });
});

// ============================================================
// GET /api/zapier/agents - Listar agents disponibles
// ============================================================
router.get('/agents', (req, res) => {
  const agents = [
    {
      name: 'Auditor Forense MACAPA v2.0',
      status: 'published',
      description: 'Experto en Informática Forense y Auditoría de Ciberseguridad',
      capabilities: [
        'Preservación de evidencia digital (ISO-27037)',
        'Integración forense en incidentes (NIST-SP-800-86)',
        'Orden de volatilidad (RFC 3227)',
        'Generación de reportes estructurados',
        'Validación de integridad con SHA-256'
      ],
      lastRun: '2025-12-24T19:10:00Z'
    },
    {
      name: 'MACAPA Agente Auditoría Forense IA',
      status: 'draft',
      description: 'Procesa análisis de auditoría forense, clasifica riesgos y ejecuta acciones',
      capabilities: [
        'Clasificación automática de riesgos',
        'Envío de emails según tipo de auditoría',
        'Alertas Slack para riesgos altos',
        'Registro en Zapier Tables',
        'Webhook de retorno a MACAPA'
      ],
      lastRun: null
    }
  ];
  
  res.json({
    success: true,
    count: agents.length,
    agents
  });
});

// ============================================================
// POST /api/zapier/trigger - Disparar un Zap específico
// ============================================================
router.post('/trigger/:zapType', async (req, res) => {
  const { zapType } = req.params;
  const payload = req.body;
  
  try {
    let webhookUrl;
    
    switch (zapType) {
      case 'agent-activity':
        webhookUrl = ZAPIER_CONFIG.webhooks.agentActivity;
        break;
      case 'audit-result':
        webhookUrl = ZAPIER_CONFIG.webhooks.auditResult;
        break;
      case 'report-generated':
        webhookUrl = ZAPIER_CONFIG.webhooks.reportGenerated;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown zap type: ${zapType}`
        });
    }
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: `Webhook URL not configured for: ${zapType}`
      });
    }
    
    // Enviar al webhook de Zapier
    const response = await axios.post(webhookUrl, {
      ...payload,
      source: 'MACAPA',
      timestamp: new Date().toISOString(),
      zapType
    });
    
    res.json({
      success: true,
      message: `Zap ${zapType} triggered successfully`,
      zapierResponse: response.data
    });
    
  } catch (error) {
    console.error('Error triggering Zap:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger Zap',
      details: error.message
    });
  }
});

// ============================================================
// POST /api/zapier/sync-report - Sincronizar reporte con Zapier Tables
// ============================================================
router.post('/sync-report', async (req, res) => {
  const { report, targetTable } = req.body;
  
  if (!report) {
    return res.status(400).json({
      success: false,
      error: 'Report data is required'
    });
  }
  
  try {
    // Preparar datos para Zapier Tables
    const tableData = {
      id: report.id,
      titulo: report.title,
      cliente: report.client,
      tipo: report.type,
      estado: report.status,
      prioridad: report.priority,
      riesgo: report.riskLevel || 0,
      hallazgos: JSON.stringify(report.findings || []),
      recomendaciones: JSON.stringify(report.recommendations || []),
      fechaCreacion: report.createdAt,
      fechaActualizacion: new Date().toISOString(),
      source: 'MACAPA-Backend'
    };
    
    // Si hay webhook configurado, enviar a Zapier
    if (ZAPIER_CONFIG.webhooks.reportGenerated) {
      await axios.post(ZAPIER_CONFIG.webhooks.reportGenerated, tableData);
    }
    
    res.json({
      success: true,
      message: 'Report synced with Zapier',
      data: tableData
    });
    
  } catch (error) {
    console.error('Error syncing report:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to sync report',
      details: error.message
    });
  }
});

// ============================================================
// POST /api/zapier/execute-agent - Ejecutar un agente de Zapier
// ============================================================
router.post('/execute-agent', async (req, res) => {
  const { agentType, input, context } = req.body;
  
  if (!agentType || !input) {
    return res.status(400).json({
      success: false,
      error: 'Agent type and input are required'
    });
  }
  
  try {
    // Preparar el payload para el agente
    const agentPayload = {
      type: agentType,
      input: input,
      context: context || {},
      timestamp: new Date().toISOString(),
      source: 'MACAPA-Backend',
      requestId: `AGENT-${Date.now()}`
    };
    
    // Simular ejecución del agente (en producción, esto llamaría a la API de Zapier Agents)
    const agentResponse = {
      requestId: agentPayload.requestId,
      status: 'queued',
      message: `Agent ${agentType} execution queued`,
      estimatedTime: '30 seconds'
    };
    
    // Si hay webhook de actividad de agente, notificar
    if (ZAPIER_CONFIG.webhooks.agentActivity) {
      await axios.post(ZAPIER_CONFIG.webhooks.agentActivity, {
        event: 'agent_execution_started',
        ...agentPayload
      });
    }
    
    res.json({
      success: true,
      ...agentResponse
    });
    
  } catch (error) {
    console.error('Error executing agent:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to execute agent',
      details: error.message
    });
  }
});

// ============================================================
// GET /api/zapier/status - Estado de la integración con Zapier
// ============================================================
router.get('/status', (req, res) => {
  const status = {
    connected: true,
    lastSync: new Date().toISOString(),
    resources: {
      interfaces: {
        count: 5,
        active: 5
      },
      tables: {
        count: 36,
        macapaRelated: 8
      },
      zaps: {
        count: 79,
        active: 10,
        macapaRelated: 5
      },
      agents: {
        count: 9,
        published: 1,
        macapaRelated: 5
      }
    },
    webhooks: {
      agentActivity: !!ZAPIER_CONFIG.webhooks.agentActivity,
      auditResult: !!ZAPIER_CONFIG.webhooks.auditResult,
      reportGenerated: !!ZAPIER_CONFIG.webhooks.reportGenerated
    },
    endpoints: {
      mainWebhook: `${process.env.API_URL || 'https://manu-macapa-api-gmi6.onrender.com'}/api/webhooks/zapier/agent-activity`
    }
  };
  
  res.json({
    success: true,
    status
  });
});

// ============================================================
// POST /api/zapier/webhook/incoming - Recibir webhooks de Zapier
// ============================================================
router.post('/webhook/incoming', async (req, res) => {
  const payload = req.body;
  
  console.log('Incoming Zapier webhook:', JSON.stringify(payload, null, 2));
  
  try {
    // Procesar según el tipo de evento
    const eventType = payload.event || payload.type || 'unknown';
    
    let result;
    
    switch (eventType) {
      case 'audit_completed':
        result = await processAuditCompleted(payload);
        break;
      case 'report_generated':
        result = await processReportGenerated(payload);
        break;
      case 'agent_response':
        result = await processAgentResponse(payload);
        break;
      default:
        result = { processed: true, eventType, message: 'Event logged' };
    }
    
    res.json({
      success: true,
      received: true,
      eventType,
      result
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: error.message
    });
  }
});

// Helper functions
async function processAuditCompleted(payload) {
  // Procesar auditoría completada
  return {
    action: 'audit_logged',
    auditId: payload.auditId,
    timestamp: new Date().toISOString()
  };
}

async function processReportGenerated(payload) {
  // Procesar reporte generado
  return {
    action: 'report_logged',
    reportId: payload.reportId,
    timestamp: new Date().toISOString()
  };
}

async function processAgentResponse(payload) {
  // Procesar respuesta de agente
  return {
    action: 'agent_response_logged',
    agentId: payload.agentId,
    timestamp: new Date().toISOString()
  };
}

module.exports = router;
