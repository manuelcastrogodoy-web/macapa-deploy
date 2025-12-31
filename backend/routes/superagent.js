const express = require('express');
const router = express.Router();
const superAgentService = require('../services/superAgentService');
const logger = require('../utils/logger');

/**
 * MACAPA Super Agent API Routes
 * 
 * Endpoints para interactuar con el Super Agente Inteligente
 */

/**
 * POST /api/superagent/process
 * Procesa una solicitud de forma autónoma
 */
router.post('/process', async (req, res) => {
  try {
    const input = req.body;
    
    if (!input || Object.keys(input).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }

    logger.info('SuperAgent processing request:', { 
      type: input.type || 'unknown',
      hasClient: !!input.client,
      hasProject: !!input.project
    });

    const result = await superAgentService.processAutonomously(input);
    
    res.json(result);

  } catch (error) {
    logger.error('SuperAgent process error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/superagent/alpha
 * Inicia un nuevo proyecto (flujo Alpha)
 */
router.post('/alpha', async (req, res) => {
  try {
    const { projectName, client, type, priority, description } = req.body;

    if (!projectName || !client) {
      return res.status(400).json({
        success: false,
        error: 'projectName and client are required'
      });
    }

    const input = {
      type: 'project_start',
      workflow: 'alpha',
      projectName,
      client,
      projectType: type || 'general',
      priority: priority || 'medium',
      description: description || '',
      requestedAt: new Date().toISOString()
    };

    const result = await superAgentService.processAutonomously(input);
    
    res.json({
      success: true,
      workflow: 'alpha',
      ...result
    });

  } catch (error) {
    logger.error('SuperAgent Alpha error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/superagent/omega
 * Finaliza un proyecto (flujo Omega)
 */
router.post('/omega', async (req, res) => {
  try {
    const { projectId, projectName, generateReport, notifyClient, summary } = req.body;

    if (!projectId && !projectName) {
      return res.status(400).json({
        success: false,
        error: 'projectId or projectName is required'
      });
    }

    const input = {
      type: 'project_end',
      workflow: 'omega',
      projectId,
      projectName,
      generateReport: generateReport !== false,
      notifyClient: notifyClient !== false,
      summary: summary || '',
      completedAt: new Date().toISOString()
    };

    const result = await superAgentService.processAutonomously(input);
    
    res.json({
      success: true,
      workflow: 'omega',
      ...result
    });

  } catch (error) {
    logger.error('SuperAgent Omega error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/superagent/audit
 * Procesa una solicitud de auditoría
 */
router.post('/audit', async (req, res) => {
  try {
    const { 
      client, 
      project, 
      auditType, 
      riskLevel, 
      priority,
      description,
      evidenceFiles,
      complianceFramework
    } = req.body;

    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'client is required'
      });
    }

    const input = {
      type: 'audit',
      category: 'forensic',
      client,
      project: project || `Auditoría - ${client}`,
      auditType: auditType || 'general',
      riskLevel: riskLevel || 'medium',
      priority: priority || 'medium',
      description: description || '',
      evidenceFiles: evidenceFiles || [],
      complianceFramework: complianceFramework || 'ISO-27037',
      requestedAt: new Date().toISOString()
    };

    const result = await superAgentService.processAutonomously(input);
    
    res.json({
      success: true,
      auditType: input.auditType,
      ...result
    });

  } catch (error) {
    logger.error('SuperAgent Audit error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/superagent/task
 * Crea una tarea inteligente
 */
router.post('/task', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      client, 
      priority, 
      dueDate,
      tags,
      assignee
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name is required'
      });
    }

    const input = {
      type: 'task',
      name,
      description: description || '',
      client: client || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
      assignee: assignee || null,
      requestedAt: new Date().toISOString()
    };

    const result = await superAgentService.processAutonomously(input);
    
    res.json({
      success: true,
      taskCreated: true,
      ...result
    });

  } catch (error) {
    logger.error('SuperAgent Task error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/superagent/report
 * Genera un reporte inteligente
 */
router.post('/report', async (req, res) => {
  try {
    const { 
      client, 
      project, 
      reportType, 
      data,
      format,
      includeAnalysis
    } = req.body;

    if (!client && !project) {
      return res.status(400).json({
        success: false,
        error: 'client or project is required'
      });
    }

    const input = {
      type: 'report',
      client: client || '',
      project: project || `Reporte - ${client}`,
      reportType: reportType || 'general',
      data: data || {},
      format: format || 'markdown',
      includeAnalysis: includeAnalysis !== false,
      requestedAt: new Date().toISOString()
    };

    const result = await superAgentService.processAutonomously(input);
    
    res.json({
      success: true,
      reportType: input.reportType,
      ...result
    });

  } catch (error) {
    logger.error('SuperAgent Report error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/superagent/status
 * Obtiene el estado del Super Agente
 */
router.get('/status', (req, res) => {
  try {
    const status = superAgentService.getStatus();
    
    res.json({
      success: true,
      agent: 'MACAPA SuperAgent',
      version: '2.0.0',
      ...status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('SuperAgent Status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/superagent/stats
 * Obtiene estadísticas de aprendizaje
 */
router.get('/stats', (req, res) => {
  try {
    const stats = superAgentService.getLearningStats();
    
    res.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('SuperAgent Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/superagent/mode
 * Cambia el modo del agente
 */
router.put('/mode', (req, res) => {
  try {
    const { mode } = req.body;

    if (!mode) {
      return res.status(400).json({
        success: false,
        error: 'mode is required (autonomous, supervised, manual)'
      });
    }

    const success = superAgentService.setMode(mode);
    
    if (success) {
      res.json({
        success: true,
        message: `Agent mode changed to: ${mode}`,
        newMode: mode
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid mode. Use: autonomous, supervised, or manual'
      });
    }

  } catch (error) {
    logger.error('SuperAgent Mode error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/superagent/confidence
 * Ajusta el umbral de confianza
 */
router.put('/confidence', (req, res) => {
  try {
    const { threshold } = req.body;

    if (threshold === undefined || threshold === null) {
      return res.status(400).json({
        success: false,
        error: 'threshold is required (0-1)'
      });
    }

    const success = superAgentService.setConfidenceThreshold(parseFloat(threshold));
    
    if (success) {
      res.json({
        success: true,
        message: `Confidence threshold set to: ${threshold}`,
        newThreshold: threshold
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid threshold. Use a value between 0 and 1'
      });
    }

  } catch (error) {
    logger.error('SuperAgent Confidence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/superagent/webhook
 * Recibe webhooks externos (Zapier, ClickUp)
 */
router.post('/webhook', async (req, res) => {
  try {
    const { source, event, data } = req.body;

    logger.info('SuperAgent webhook received:', { source, event });

    // Procesar el webhook según la fuente
    const input = {
      type: 'webhook',
      source: source || 'unknown',
      event: event || 'generic',
      data: data || req.body,
      receivedAt: new Date().toISOString()
    };

    const result = await superAgentService.processAutonomously(input);
    
    res.json({
      success: true,
      webhookProcessed: true,
      ...result
    });

  } catch (error) {
    logger.error('SuperAgent Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/superagent/analyze
 * Analiza una solicitud sin ejecutar acciones
 */
router.post('/analyze', async (req, res) => {
  try {
    const input = req.body;
    
    if (!input || Object.keys(input).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }

    // Usar el método interno de análisis
    const requestId = `ANALYZE-${Date.now()}`;
    const analysis = await superAgentService.analyzeRequest(input, requestId);
    
    res.json({
      success: true,
      analysisOnly: true,
      requestId,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('SuperAgent Analyze error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
