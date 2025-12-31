const express = require('express');
const router = express.Router();
const zapierService = require('../services/zapierIntegrationService');
const logger = require('../utils/logger');

/**
 * MACAPA Zapier Integration API Routes
 */

/**
 * GET /api/zapier/status
 * Estado de la integración con Zapier
 */
router.get('/status', (req, res) => {
  try {
    const stats = zapierService.getStats();
    const config = zapierService.getConfig();
    
    res.json({
      success: true,
      status: 'connected',
      stats,
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Zapier status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/zapier/config
 * Configuración actual de Zapier
 */
router.get('/config', (req, res) => {
  try {
    const config = zapierService.getConfig();
    res.json({ success: true, ...config });
  } catch (error) {
    logger.error('Zapier config error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/webhook/send
 * Envía un webhook a Zapier
 */
router.post('/webhook/send', async (req, res) => {
  try {
    const { webhookType, data, options } = req.body;
    
    if (!webhookType) {
      return res.status(400).json({ error: 'webhookType is required' });
    }

    const result = await zapierService.sendWebhook(webhookType, data || {}, options || {});
    res.json(result);
  } catch (error) {
    logger.error('Zapier send webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/webhook/incoming
 * Recibe webhooks de Zapier
 */
router.post('/webhook/incoming', async (req, res) => {
  try {
    const signature = req.headers['x-zapier-signature'] || req.headers['x-macapa-signature'];
    const result = await zapierService.processIncomingWebhook(req.body, signature);
    
    res.json(result);
  } catch (error) {
    logger.error('Zapier incoming webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/trigger/:zapType
 * Dispara un tipo específico de Zap
 */
router.post('/trigger/:zapType', async (req, res) => {
  try {
    const { zapType } = req.params;
    const data = req.body;

    const validTypes = [
      'agentActivity', 'auditResult', 'reportGenerated', 
      'taskCreated', 'alphaOmega', 'notification', 'escalation'
    ];

    if (!validTypes.includes(zapType)) {
      return res.status(400).json({ 
        error: `Invalid zapType. Valid types: ${validTypes.join(', ')}` 
      });
    }

    const result = await zapierService.sendWebhook(zapType, data);
    res.json(result);
  } catch (error) {
    logger.error('Zapier trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/alpha
 * Dispara flujo Alpha (inicio de proyecto)
 */
router.post('/alpha', async (req, res) => {
  try {
    const projectData = req.body;
    
    if (!projectData.projectName) {
      return res.status(400).json({ error: 'projectName is required' });
    }

    const result = await zapierService.triggerAlphaFlow(projectData);
    res.json({
      success: true,
      workflow: 'alpha',
      ...result
    });
  } catch (error) {
    logger.error('Zapier Alpha error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/omega
 * Dispara flujo Omega (finalización de proyecto)
 */
router.post('/omega', async (req, res) => {
  try {
    const projectData = req.body;
    
    if (!projectData.projectId && !projectData.projectName) {
      return res.status(400).json({ error: 'projectId or projectName is required' });
    }

    const result = await zapierService.triggerOmegaFlow(projectData);
    res.json({
      success: true,
      workflow: 'omega',
      ...result
    });
  } catch (error) {
    logger.error('Zapier Omega error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/notify
 * Envía notificación via Zapier
 */
router.post('/notify', async (req, res) => {
  try {
    const notification = req.body;
    
    if (!notification.message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const result = await zapierService.sendNotification(notification);
    res.json(result);
  } catch (error) {
    logger.error('Zapier notify error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/escalate
 * Envía escalamiento via Zapier
 */
router.post('/escalate', async (req, res) => {
  try {
    const escalation = req.body;
    
    if (!escalation.reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    const result = await zapierService.sendEscalation(escalation);
    res.json(result);
  } catch (error) {
    logger.error('Zapier escalate error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/sync-table
 * Sincroniza datos con Zapier Tables
 */
router.post('/sync-table', async (req, res) => {
  try {
    const { tableName, data } = req.body;
    
    if (!tableName || !data) {
      return res.status(400).json({ error: 'tableName and data are required' });
    }

    const result = await zapierService.syncToTable(tableName, data);
    res.json(result);
  } catch (error) {
    logger.error('Zapier sync-table error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/sync-agent
 * Sincroniza actividad del agente
 */
router.post('/sync-agent', async (req, res) => {
  try {
    const activity = req.body;
    
    if (!activity.type) {
      return res.status(400).json({ error: 'activity type is required' });
    }

    const result = await zapierService.syncAgentActivity(activity);
    res.json(result);
  } catch (error) {
    logger.error('Zapier sync-agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/determine-path
 * Determina el path del Zap basado en datos
 */
router.post('/determine-path', (req, res) => {
  try {
    const data = req.body;
    const path = zapierService.determineZapPath(data);
    
    res.json({
      success: true,
      ...path
    });
  } catch (error) {
    logger.error('Zapier determine-path error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/queue
 * Encola evento para procesamiento posterior
 */
router.post('/queue', (req, res) => {
  try {
    const { webhookType, data } = req.body;
    
    if (!webhookType) {
      return res.status(400).json({ error: 'webhookType is required' });
    }

    zapierService.queueEvent(webhookType, data || {});
    
    res.json({
      success: true,
      message: 'Event queued for processing',
      queueLength: zapierService.getStats().queueLength
    });
  } catch (error) {
    logger.error('Zapier queue error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/zapier/test/:webhookType
 * Prueba conexión con webhook
 */
router.post('/test/:webhookType', async (req, res) => {
  try {
    const { webhookType } = req.params;
    const result = await zapierService.testWebhook(webhookType);
    res.json(result);
  } catch (error) {
    logger.error('Zapier test error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/zapier/stats
 * Estadísticas de la integración
 */
router.get('/stats', (req, res) => {
  try {
    const stats = zapierService.getStats();
    res.json({ success: true, ...stats });
  } catch (error) {
    logger.error('Zapier stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/zapier/interfaces
 * Lista interfaces de Zapier disponibles
 */
router.get('/interfaces', (req, res) => {
  try {
    const config = zapierService.getConfig();
    res.json({ 
      success: true, 
      interfaces: config.interfaces 
    });
  } catch (error) {
    logger.error('Zapier interfaces error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
