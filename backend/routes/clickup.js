const express = require('express');
const router = express.Router();
const axios = require('axios');

// ClickUp API Configuration
const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const CLICKUP_TEAM_ID = process.env.CLICKUP_TEAM_ID;

// Helper function for ClickUp API calls
const clickupApi = axios.create({
  baseURL: CLICKUP_API_URL,
  headers: {
    'Authorization': CLICKUP_API_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Test ClickUp connection
router.get('/test', async (req, res) => {
  try {
    if (!CLICKUP_API_TOKEN) {
      return res.json({
        success: false,
        error: 'CLICKUP_API_TOKEN not configured',
        message: 'Please configure the ClickUp API token in environment variables'
      });
    }

    const response = await clickupApi.get('/user');
    res.json({
      success: true,
      message: 'ClickUp connection successful',
      user: response.data.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get ClickUp workspaces (teams)
router.get('/workspaces', async (req, res) => {
  try {
    const response = await clickupApi.get('/team');
    res.json({
      success: true,
      workspaces: response.data.teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get spaces in a workspace
router.get('/workspaces/:teamId/spaces', async (req, res) => {
  try {
    const { teamId } = req.params;
    const response = await clickupApi.get(`/team/${teamId}/space`);
    res.json({
      success: true,
      spaces: response.data.spaces
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get folders in a space
router.get('/spaces/:spaceId/folders', async (req, res) => {
  try {
    const { spaceId } = req.params;
    const response = await clickupApi.get(`/space/${spaceId}/folder`);
    res.json({
      success: true,
      folders: response.data.folders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get lists in a folder
router.get('/folders/:folderId/lists', async (req, res) => {
  try {
    const { folderId } = req.params;
    const response = await clickupApi.get(`/folder/${folderId}/list`);
    res.json({
      success: true,
      lists: response.data.lists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Create a task in ClickUp (for syncing reports)
router.post('/tasks', async (req, res) => {
  try {
    const { listId, name, description, priority, dueDate, tags } = req.body;
    
    const taskData = {
      name,
      description,
      priority: priority === 'alta' ? 1 : priority === 'media' ? 2 : 3,
      due_date: dueDate ? new Date(dueDate).getTime() : null,
      tags: tags || ['MACAPA']
    };

    const response = await clickupApi.post(`/list/${listId}/task`, taskData);
    res.json({
      success: true,
      task: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Update a task in ClickUp
router.put('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, description, status, priority } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority === 'alta' ? 1 : priority === 'media' ? 2 : 3;

    const response = await clickupApi.put(`/task/${taskId}`, updateData);
    res.json({
      success: true,
      task: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get task details
router.get('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await clickupApi.get(`/task/${taskId}`);
    res.json({
      success: true,
      task: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Webhook endpoint to receive ClickUp events
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('ClickUp Webhook received:', JSON.stringify(event, null, 2));
    
    // Process different event types
    switch (event.event) {
      case 'taskCreated':
        console.log('New task created in ClickUp:', event.task_id);
        // TODO: Sync to MACAPA if needed
        break;
      
      case 'taskUpdated':
        console.log('Task updated in ClickUp:', event.task_id);
        // TODO: Update corresponding report in MACAPA
        break;
      
      case 'taskStatusUpdated':
        console.log('Task status changed:', event.task_id, event.history_items);
        // TODO: Update report status in MACAPA
        break;
      
      case 'taskDeleted':
        console.log('Task deleted in ClickUp:', event.task_id);
        break;
      
      default:
        console.log('Unknown event type:', event.event);
    }
    
    res.json({ success: true, received: true });
  } catch (error) {
    console.error('ClickUp webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create webhook in ClickUp
router.post('/webhooks/create', async (req, res) => {
  try {
    const { teamId, endpoint, events } = req.body;
    
    const webhookData = {
      endpoint: endpoint || `${process.env.API_URL || 'https://manu-macapa-api-gmi6.onrender.com'}/api/clickup/webhook`,
      events: events || [
        'taskCreated',
        'taskUpdated',
        'taskDeleted',
        'taskStatusUpdated',
        'taskCommentPosted'
      ]
    };

    const response = await clickupApi.post(`/team/${teamId || CLICKUP_TEAM_ID}/webhook`, webhookData);
    res.json({
      success: true,
      webhook: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Get webhooks
router.get('/webhooks', async (req, res) => {
  try {
    const teamId = req.query.teamId || CLICKUP_TEAM_ID;
    const response = await clickupApi.get(`/team/${teamId}/webhook`);
    res.json({
      success: true,
      webhooks: response.data.webhooks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Delete webhook
router.delete('/webhooks/:webhookId', async (req, res) => {
  try {
    const { webhookId } = req.params;
    await clickupApi.delete(`/webhook/${webhookId}`);
    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Sync report to ClickUp (create task from MACAPA report)
router.post('/sync/report', async (req, res) => {
  try {
    const { report, listId } = req.body;
    
    if (!listId) {
      return res.status(400).json({
        success: false,
        error: 'listId is required'
      });
    }

    const taskData = {
      name: `[MACAPA] ${report.title}`,
      description: `
**Cliente:** ${report.client}
**Tipo:** ${report.type}
**Prioridad:** ${report.priority}
**Estado:** ${report.status}

---

${report.description || ''}

---

*Sincronizado desde MACAPA*
      `.trim(),
      priority: report.priority === 'alta' ? 1 : report.priority === 'media' ? 2 : 3,
      tags: ['MACAPA', report.type]
    };

    const response = await clickupApi.post(`/list/${listId}/task`, taskData);
    
    res.json({
      success: true,
      message: 'Report synced to ClickUp',
      task: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
