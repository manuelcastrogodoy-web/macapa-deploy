const express = require('express');
const router = express.Router();
const axios = require('axios');

// In-memory storage for orchestrator state (in production, use a database)
let orchestratorState = {
  activeProjects: [],
  completedProjects: [],
  alerts: []
};

// ClickUp API Configuration
const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;

const clickupApi = axios.create({
  baseURL: CLICKUP_API_URL,
  headers: {
    'Authorization': CLICKUP_API_TOKEN,
    'Content-Type': 'application/json'
  }
});

// =====================================================
// FUNCTION ALPHA - Project Initialization & Synchronization
// =====================================================

/**
 * Function Alpha: Marks the start of project synchronization
 * - Creates project structure in ClickUp
 * - Initializes tracking in MACAPA
 * - Sets up webhooks and notifications
 * - Provides order and coherence to the system
 */
router.post('/alpha', async (req, res) => {
  try {
    const {
      projectName,
      client,
      type,
      priority,
      description,
      clickupListId,
      notifyEmail,
      zapierWebhook
    } = req.body;

    // Validate required fields
    if (!projectName || !client) {
      return res.status(400).json({
        success: false,
        error: 'projectName and client are required'
      });
    }

    const projectId = `PROJ-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Initialize project in orchestrator state
    const project = {
      id: projectId,
      name: projectName,
      client,
      type: type || 'general',
      priority: priority || 'media',
      description,
      status: 'initialized',
      phase: 'alpha',
      createdAt: timestamp,
      updatedAt: timestamp,
      clickupTaskId: null,
      reports: [],
      timeline: [
        {
          action: 'PROJECT_INITIALIZED',
          timestamp,
          details: 'Function Alpha executed - Project synchronization started'
        }
      ]
    };

    // Create task in ClickUp if listId provided
    if (clickupListId && CLICKUP_API_TOKEN) {
      try {
        const clickupTask = await clickupApi.post(`/list/${clickupListId}/task`, {
          name: `[MACAPA] ${projectName}`,
          description: `
**Cliente:** ${client}
**Tipo:** ${type || 'general'}
**Prioridad:** ${priority || 'media'}
**ID MACAPA:** ${projectId}

---

${description || 'Sin descripción'}

---

*Proyecto iniciado por MACAPA Orchestrator - Function Alpha*
          `.trim(),
          priority: priority === 'alta' ? 1 : priority === 'media' ? 2 : 3,
          tags: ['MACAPA', 'Orchestrator', type || 'general']
        });

        project.clickupTaskId = clickupTask.data.id;
        project.clickupUrl = clickupTask.data.url;
        
        project.timeline.push({
          action: 'CLICKUP_TASK_CREATED',
          timestamp: new Date().toISOString(),
          details: `ClickUp task created: ${clickupTask.data.id}`
        });
      } catch (clickupError) {
        console.error('ClickUp sync error:', clickupError.message);
        project.timeline.push({
          action: 'CLICKUP_SYNC_FAILED',
          timestamp: new Date().toISOString(),
          details: clickupError.message
        });
      }
    }

    // Send notification via Zapier webhook if provided
    if (zapierWebhook) {
      try {
        await axios.post(zapierWebhook, {
          event: 'PROJECT_STARTED',
          projectId,
          projectName,
          client,
          type,
          priority,
          timestamp,
          message: `Nuevo proyecto iniciado: ${projectName} para ${client}`
        });
        
        project.timeline.push({
          action: 'ZAPIER_NOTIFICATION_SENT',
          timestamp: new Date().toISOString(),
          details: 'Start notification sent via Zapier'
        });
      } catch (zapierError) {
        console.error('Zapier notification error:', zapierError.message);
      }
    }

    // Add to active projects
    orchestratorState.activeProjects.push(project);

    // Create alert
    const alert = {
      id: `ALERT-${Date.now()}`,
      type: 'info',
      title: 'Proyecto Iniciado',
      message: `Function Alpha ejecutada: ${projectName} para ${client}`,
      projectId,
      timestamp,
      read: false
    };
    orchestratorState.alerts.push(alert);

    res.json({
      success: true,
      message: 'Function Alpha executed successfully - Project initialized',
      project,
      alert
    });

  } catch (error) {
    console.error('Function Alpha error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// FUNCTION OMEGA - Project Finalization & Report Generation
// =====================================================

/**
 * Function Omega: Controls the finalization of reports
 * - Generates final report with specialized branding
 * - Closes process flow in ClickUp
 * - Issues completion alerts
 * - Archives project data
 */
router.post('/omega', async (req, res) => {
  try {
    const {
      projectId,
      finalReport,
      brandingStyle,
      archiveToClickUp,
      notifyEmail,
      zapierWebhook
    } = req.body;

    // Validate required fields
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required'
      });
    }

    // Find the project
    const projectIndex = orchestratorState.activeProjects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Project not found in active projects'
      });
    }

    const project = orchestratorState.activeProjects[projectIndex];
    const timestamp = new Date().toISOString();

    // Update project status
    project.status = 'completed';
    project.phase = 'omega';
    project.completedAt = timestamp;
    project.updatedAt = timestamp;

    // Apply branding style to final report
    const styledReport = {
      ...finalReport,
      branding: brandingStyle || 'professional',
      generatedAt: timestamp,
      projectId,
      client: project.client,
      header: `
================================================================================
                           MACAPA - REPORTE FINAL
================================================================================
Proyecto: ${project.name}
Cliente: ${project.client}
Tipo: ${project.type}
ID: ${projectId}
Fecha: ${new Date(timestamp).toLocaleDateString('es-ES', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
================================================================================
      `.trim(),
      footer: `
================================================================================
Este reporte fue generado automáticamente por MACAPA Orchestrator
Function Omega - Finalización de Proyecto
© ${new Date().getFullYear()} MACAPA - Sistema de Auditoría y Consultoría
================================================================================
      `.trim()
    };

    project.finalReport = styledReport;
    project.timeline.push({
      action: 'PROJECT_COMPLETED',
      timestamp,
      details: 'Function Omega executed - Project finalized'
    });

    // Update ClickUp task if exists
    if (project.clickupTaskId && CLICKUP_API_TOKEN) {
      try {
        await clickupApi.put(`/task/${project.clickupTaskId}`, {
          status: 'complete',
          description: `
**PROYECTO COMPLETADO**

${project.description || ''}

---

**Fecha de Finalización:** ${new Date(timestamp).toLocaleString('es-ES')}
**Reporte Final Generado:** Sí
**Estilo de Branding:** ${brandingStyle || 'professional'}

---

*Proyecto cerrado por MACAPA Orchestrator - Function Omega*
          `.trim()
        });

        project.timeline.push({
          action: 'CLICKUP_TASK_COMPLETED',
          timestamp: new Date().toISOString(),
          details: 'ClickUp task marked as complete'
        });
      } catch (clickupError) {
        console.error('ClickUp update error:', clickupError.message);
      }
    }

    // Send completion notification via Zapier
    if (zapierWebhook) {
      try {
        await axios.post(zapierWebhook, {
          event: 'PROJECT_COMPLETED',
          projectId,
          projectName: project.name,
          client: project.client,
          completedAt: timestamp,
          reportGenerated: true,
          message: `Proyecto completado: ${project.name} para ${project.client}`
        });

        project.timeline.push({
          action: 'ZAPIER_COMPLETION_SENT',
          timestamp: new Date().toISOString(),
          details: 'Completion notification sent via Zapier'
        });
      } catch (zapierError) {
        console.error('Zapier notification error:', zapierError.message);
      }
    }

    // Move to completed projects
    orchestratorState.activeProjects.splice(projectIndex, 1);
    orchestratorState.completedProjects.push(project);

    // Create completion alert
    const alert = {
      id: `ALERT-${Date.now()}`,
      type: 'success',
      title: 'Proyecto Completado',
      message: `Function Omega ejecutada: ${project.name} finalizado exitosamente`,
      projectId,
      timestamp,
      read: false
    };
    orchestratorState.alerts.push(alert);

    res.json({
      success: true,
      message: 'Function Omega executed successfully - Project completed',
      project,
      styledReport,
      alert
    });

  } catch (error) {
    console.error('Function Omega error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// STATUS & MONITORING ENDPOINTS
// =====================================================

// Get orchestrator status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    stats: {
      activeProjects: orchestratorState.activeProjects.length,
      completedProjects: orchestratorState.completedProjects.length,
      unreadAlerts: orchestratorState.alerts.filter(a => !a.read).length
    },
    timestamp: new Date().toISOString()
  });
});

// Get all active projects
router.get('/projects/active', (req, res) => {
  res.json({
    success: true,
    projects: orchestratorState.activeProjects
  });
});

// Get all completed projects
router.get('/projects/completed', (req, res) => {
  res.json({
    success: true,
    projects: orchestratorState.completedProjects
  });
});

// Get project by ID
router.get('/projects/:projectId', (req, res) => {
  const { projectId } = req.params;
  
  let project = orchestratorState.activeProjects.find(p => p.id === projectId);
  if (!project) {
    project = orchestratorState.completedProjects.find(p => p.id === projectId);
  }

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
});

// Get all alerts
router.get('/alerts', (req, res) => {
  const { unreadOnly } = req.query;
  
  let alerts = orchestratorState.alerts;
  if (unreadOnly === 'true') {
    alerts = alerts.filter(a => !a.read);
  }

  res.json({
    success: true,
    alerts: alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  });
});

// Mark alert as read
router.put('/alerts/:alertId/read', (req, res) => {
  const { alertId } = req.params;
  
  const alert = orchestratorState.alerts.find(a => a.id === alertId);
  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }

  alert.read = true;
  res.json({
    success: true,
    alert
  });
});

// Mark all alerts as read
router.put('/alerts/read-all', (req, res) => {
  orchestratorState.alerts.forEach(a => a.read = true);
  res.json({
    success: true,
    message: 'All alerts marked as read'
  });
});

// Update project status
router.put('/projects/:projectId/status', (req, res) => {
  const { projectId } = req.params;
  const { status, notes } = req.body;

  const project = orchestratorState.activeProjects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found in active projects'
    });
  }

  project.status = status;
  project.updatedAt = new Date().toISOString();
  project.timeline.push({
    action: 'STATUS_UPDATED',
    timestamp: project.updatedAt,
    details: `Status changed to: ${status}${notes ? ` - ${notes}` : ''}`
  });

  res.json({
    success: true,
    project
  });
});

// Add report to project
router.post('/projects/:projectId/reports', (req, res) => {
  const { projectId } = req.params;
  const { reportId, reportTitle, reportType } = req.body;

  const project = orchestratorState.activeProjects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: 'Project not found in active projects'
    });
  }

  project.reports.push({
    id: reportId,
    title: reportTitle,
    type: reportType,
    addedAt: new Date().toISOString()
  });

  project.updatedAt = new Date().toISOString();
  project.timeline.push({
    action: 'REPORT_ADDED',
    timestamp: project.updatedAt,
    details: `Report added: ${reportTitle}`
  });

  res.json({
    success: true,
    project
  });
});

module.exports = router;
