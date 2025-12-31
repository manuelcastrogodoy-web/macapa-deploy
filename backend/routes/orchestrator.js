const express = require('express');
const router = express.Router();
const orchestratorService = require('../services/orchestratorService');
const logger = require('../utils/logger');

/**
 * MACAPA Orchestrator API Routes - Alpha & Omega
 */

/**
 * POST /api/orchestrator/alpha
 * Inicia un nuevo proyecto (flujo Alpha)
 */
router.post('/alpha', async (req, res) => {
  try {
    const { projectName, client, type, priority, description, notes } = req.body;

    if (!projectName) {
      return res.status(400).json({ 
        success: false, 
        error: 'projectName is required' 
      });
    }

    if (!client) {
      return res.status(400).json({ 
        success: false, 
        error: 'client is required' 
      });
    }

    logger.info(`[ALPHA] Initiating project: ${projectName} for ${client}`);

    const result = await orchestratorService.executeAlpha({
      projectName,
      client,
      type: type || 'general',
      priority: priority || 'medium',
      description: description || '',
      notes: notes || ''
    });

    res.json({
      success: result.status !== 'failed',
      workflow: 'alpha',
      ...result
    });

  } catch (error) {
    logger.error('Orchestrator Alpha error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/orchestrator/omega
 * Finaliza un proyecto (flujo Omega)
 */
router.post('/omega', async (req, res) => {
  try {
    const { 
      projectId, 
      projectName, 
      generateReport, 
      notifyClient, 
      summary,
      forceComplete 
    } = req.body;

    if (!projectId && !projectName) {
      return res.status(400).json({ 
        success: false, 
        error: 'projectId or projectName is required' 
      });
    }

    logger.info(`[OMEGA] Completing project: ${projectId || projectName}`);

    const result = await orchestratorService.executeOmega({
      projectId,
      projectName,
      generateReport: generateReport !== false,
      notifyClient: notifyClient !== false,
      summary: summary || '',
      forceComplete: forceComplete || false
    });

    res.json({
      success: result.status !== 'failed',
      workflow: 'omega',
      ...result
    });

  } catch (error) {
    logger.error('Orchestrator Omega error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/orchestrator/status
 * Estado del orquestador
 */
router.get('/status', (req, res) => {
  try {
    const status = orchestratorService.getStatus();
    
    res.json({
      success: true,
      orchestrator: 'MACAPA Alpha/Omega',
      version: '2.0.0',
      ...status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Orchestrator status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/orchestrator/projects
 * Lista proyectos activos
 */
router.get('/projects', (req, res) => {
  try {
    const projects = orchestratorService.getActiveProjects();
    
    res.json({
      success: true,
      count: projects.length,
      projects
    });

  } catch (error) {
    logger.error('Orchestrator projects error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/orchestrator/project/:projectId
 * Obtiene un proyecto específico
 */
router.get('/project/:projectId', (req, res) => {
  try {
    const project = orchestratorService.getProject(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    res.json({
      success: true,
      project
    });

  } catch (error) {
    logger.error('Orchestrator get project error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/orchestrator/metrics
 * Métricas del orquestador
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = orchestratorService.getMetrics();
    
    res.json({
      success: true,
      ...metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Orchestrator metrics error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/orchestrator/templates
 * Lista templates de proyecto disponibles
 */
router.get('/templates', (req, res) => {
  try {
    const templates = orchestratorService.getTemplates();
    
    res.json({
      success: true,
      templates
    });

  } catch (error) {
    logger.error('Orchestrator templates error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/orchestrator/quick-start
 * Inicio rápido de proyecto con template
 */
router.post('/quick-start', async (req, res) => {
  try {
    const { template, client, projectName, priority } = req.body;

    if (!template) {
      return res.status(400).json({ 
        success: false, 
        error: 'template is required' 
      });
    }

    if (!client) {
      return res.status(400).json({ 
        success: false, 
        error: 'client is required' 
      });
    }

    const templates = orchestratorService.getTemplates();
    const templateExists = templates.some(t => t.id === template);

    if (!templateExists) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid template. Available: ${templates.map(t => t.id).join(', ')}` 
      });
    }

    const result = await orchestratorService.executeAlpha({
      projectName: projectName || `${template} - ${client}`,
      client,
      type: template,
      priority: priority || 'medium'
    });

    res.json({
      success: result.status !== 'failed',
      workflow: 'alpha',
      template,
      ...result
    });

  } catch (error) {
    logger.error('Orchestrator quick-start error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
