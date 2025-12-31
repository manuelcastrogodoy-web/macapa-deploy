const express = require('express');
const router = express.Router();
const clickUpService = require('../services/clickUpService');
const logger = require('../utils/logger');

/**
 * MACAPA ClickUp API Routes
 */

/**
 * GET /api/clickup/status
 * Verifica el estado de conexión con ClickUp
 */
router.get('/status', async (req, res) => {
  try {
    const status = await clickUpService.checkConnection();
    res.json(status);
  } catch (error) {
    logger.error('ClickUp status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clickup/workspaces
 * Obtiene los workspaces disponibles
 */
router.get('/workspaces', async (req, res) => {
  try {
    const workspaces = await clickUpService.getWorkspaces();
    res.json({ success: true, workspaces });
  } catch (error) {
    logger.error('ClickUp workspaces error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clickup/spaces/:teamId
 * Obtiene los spaces de un workspace
 */
router.get('/spaces/:teamId', async (req, res) => {
  try {
    const spaces = await clickUpService.getSpaces(req.params.teamId);
    res.json({ success: true, spaces });
  } catch (error) {
    logger.error('ClickUp spaces error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clickup/lists/:spaceId
 * Obtiene las listas de un space
 */
router.get('/lists/:spaceId', async (req, res) => {
  try {
    const lists = await clickUpService.getLists(req.params.spaceId);
    res.json({ success: true, lists });
  } catch (error) {
    logger.error('ClickUp lists error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clickup/tasks
 * Crea una nueva tarea
 */
router.post('/tasks', async (req, res) => {
  try {
    const { listId, ...taskData } = req.body;
    
    if (!taskData.name) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    const result = await clickUpService.createTask(taskData, listId);
    res.json(result);
  } catch (error) {
    logger.error('ClickUp create task error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clickup/tasks/:listId
 * Obtiene tareas de una lista
 */
router.get('/tasks/:listId', async (req, res) => {
  try {
    const tasks = await clickUpService.getTasks(req.params.listId, req.query);
    res.json({ success: true, tasks });
  } catch (error) {
    logger.error('ClickUp get tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clickup/task/:taskId
 * Obtiene una tarea específica
 */
router.get('/task/:taskId', async (req, res) => {
  try {
    const task = await clickUpService.getTask(req.params.taskId);
    res.json({ success: true, task });
  } catch (error) {
    logger.error('ClickUp get task error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/clickup/task/:taskId
 * Actualiza una tarea
 */
router.put('/task/:taskId', async (req, res) => {
  try {
    const result = await clickUpService.updateTask(req.params.taskId, req.body);
    res.json(result);
  } catch (error) {
    logger.error('ClickUp update task error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clickup/task/:taskId/subtask
 * Crea una subtarea
 */
router.post('/task/:taskId/subtask', async (req, res) => {
  try {
    const result = await clickUpService.createSubtask(req.params.taskId, req.body);
    res.json(result);
  } catch (error) {
    logger.error('ClickUp create subtask error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clickup/task/:taskId/comment
 * Agrega un comentario a una tarea
 */
router.post('/task/:taskId/comment', async (req, res) => {
  try {
    const { text, notifyAll } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const result = await clickUpService.addComment(req.params.taskId, text, notifyAll);
    res.json(result);
  } catch (error) {
    logger.error('ClickUp add comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clickup/tasks/batch
 * Crea múltiples tareas
 */
router.post('/tasks/batch', async (req, res) => {
  try {
    const { tasks, listId } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    const results = await clickUpService.createTasksBatch(tasks, listId);
    res.json({ success: true, results });
  } catch (error) {
    logger.error('ClickUp batch create error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clickup/project
 * Crea una estructura de proyecto completa
 */
router.post('/project', async (req, res) => {
  try {
    const { projectName, client, type, tasks } = req.body;
    
    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await clickUpService.createProjectStructure({
      projectName,
      client: client || 'Sin cliente',
      type: type || 'general',
      tasks: tasks || []
    });
    
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('ClickUp create project error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clickup/search
 * Busca tareas
 */
router.get('/search', async (req, res) => {
  try {
    const { q, teamId } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const tasks = await clickUpService.searchTasks(q, teamId);
    res.json({ success: true, tasks, count: tasks.length });
  } catch (error) {
    logger.error('ClickUp search error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clickup/stats
 * Obtiene estadísticas del workspace
 */
router.get('/stats', async (req, res) => {
  try {
    const { teamId } = req.query;
    const stats = await clickUpService.getWorkspaceStats(teamId);
    res.json({ success: true, ...stats });
  } catch (error) {
    logger.error('ClickUp stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clickup/webhook
 * Crea un webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const { teamId, endpoint, events } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint URL is required' });
    }

    const result = await clickUpService.createWebhook(teamId, endpoint, events);
    res.json(result);
  } catch (error) {
    logger.error('ClickUp create webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clickup/webhooks
 * Lista webhooks
 */
router.get('/webhooks', async (req, res) => {
  try {
    const { teamId } = req.query;
    const webhooks = await clickUpService.getWebhooks(teamId);
    res.json({ success: true, webhooks });
  } catch (error) {
    logger.error('ClickUp get webhooks error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/clickup/webhook/:webhookId
 * Elimina un webhook
 */
router.delete('/webhook/:webhookId', async (req, res) => {
  try {
    const result = await clickUpService.deleteWebhook(req.params.webhookId);
    res.json(result);
  } catch (error) {
    logger.error('ClickUp delete webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clickup/webhook/incoming
 * Recibe webhooks de ClickUp
 */
router.post('/webhook/incoming', async (req, res) => {
  try {
    logger.info('ClickUp webhook received:', {
      event: req.body.event,
      taskId: req.body.task_id
    });

    // Procesar el webhook según el evento
    const { event, task_id, history_items } = req.body;

    // Aquí puedes agregar lógica para procesar diferentes eventos
    // Por ejemplo, sincronizar con Zapier o actualizar el estado del SuperAgent

    res.json({ 
      success: true, 
      message: 'Webhook received',
      event,
      taskId: task_id
    });
  } catch (error) {
    logger.error('ClickUp incoming webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/clickup/cache
 * Limpia el cache
 */
router.delete('/cache', (req, res) => {
  clickUpService.clearCache();
  res.json({ success: true, message: 'Cache cleared' });
});

module.exports = router;
