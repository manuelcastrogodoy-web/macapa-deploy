const express = require('express');
const router = express.Router();
const axios = require('axios');

// =====================================================
// MACAPA SUPER AGENT - Automated Task Creation System
// =====================================================
// This module implements intelligent automation for creating
// ClickUp tasks based on report content using AI analysis

// Configuration
const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ClickUp API client
const clickupApi = axios.create({
  baseURL: CLICKUP_API_URL,
  headers: {
    'Authorization': CLICKUP_API_TOKEN,
    'Content-Type': 'application/json'
  }
});

// In-memory storage for automation rules and history
let automationState = {
  rules: [],
  history: [],
  settings: {
    autoCreateTasks: true,
    defaultListId: null,
    defaultWorkspaceId: null,
    aiAnalysisEnabled: true,
    notifyOnCreate: true
  }
};

// =====================================================
// AI-POWERED TASK EXTRACTION
// =====================================================

/**
 * Uses Gemini AI to analyze report content and extract actionable tasks
 */
async function extractTasksFromReport(report) {
  if (!GEMINI_API_KEY) {
    console.log('Gemini API key not configured, using basic extraction');
    return basicTaskExtraction(report);
  }

  try {
    const prompt = `
Analiza el siguiente reporte de auditoría/consultoría y extrae las tareas accionables que deben crearse en un sistema de gestión de proyectos.

REPORTE:
Título: ${report.title}
Cliente: ${report.client}
Tipo: ${report.type}
Prioridad: ${report.priority}
Descripción: ${report.description || 'Sin descripción'}
Contenido: ${report.content || ''}

INSTRUCCIONES:
1. Identifica las acciones específicas que deben realizarse
2. Asigna una prioridad a cada tarea (alta, media, baja)
3. Estima el tiempo necesario para cada tarea
4. Agrupa las tareas por categoría si es posible

Responde SOLO con un JSON válido con el siguiente formato:
{
  "tasks": [
    {
      "name": "Nombre de la tarea",
      "description": "Descripción detallada",
      "priority": "alta|media|baja",
      "estimatedHours": 2,
      "category": "Categoría",
      "tags": ["tag1", "tag2"]
    }
  ],
  "summary": "Resumen breve del análisis"
}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return basicTaskExtraction(report);
  } catch (error) {
    console.error('AI task extraction error:', error.message);
    return basicTaskExtraction(report);
  }
}

/**
 * Basic task extraction without AI
 */
function basicTaskExtraction(report) {
  const tasks = [];
  
  // Create main task from report
  tasks.push({
    name: `Revisar: ${report.title}`,
    description: `Revisar y procesar el reporte "${report.title}" para el cliente ${report.client}`,
    priority: report.priority || 'media',
    estimatedHours: 2,
    category: report.type,
    tags: ['MACAPA', report.type, 'Revisión']
  });

  // Add follow-up task
  tasks.push({
    name: `Seguimiento: ${report.title}`,
    description: `Realizar seguimiento con el cliente ${report.client} sobre el reporte`,
    priority: 'media',
    estimatedHours: 1,
    category: 'Seguimiento',
    tags: ['MACAPA', 'Seguimiento']
  });

  return {
    tasks,
    summary: `Se generaron ${tasks.length} tareas básicas del reporte`
  };
}

// =====================================================
// AUTOMATED TASK CREATION ENDPOINTS
// =====================================================

/**
 * Main endpoint: Automatically create ClickUp tasks from a report
 */
router.post('/auto-create-tasks', async (req, res) => {
  try {
    const { report, listId, useAI = true, createSubtasks = false } = req.body;

    if (!report) {
      return res.status(400).json({
        success: false,
        error: 'Report data is required'
      });
    }

    const targetListId = listId || automationState.settings.defaultListId;
    
    if (!targetListId) {
      return res.status(400).json({
        success: false,
        error: 'No listId provided and no default list configured'
      });
    }

    if (!CLICKUP_API_TOKEN) {
      return res.status(400).json({
        success: false,
        error: 'ClickUp API token not configured'
      });
    }

    // Extract tasks using AI or basic method
    const extraction = useAI && automationState.settings.aiAnalysisEnabled
      ? await extractTasksFromReport(report)
      : basicTaskExtraction(report);

    const createdTasks = [];
    const errors = [];

    // Create main parent task
    const mainTaskData = {
      name: `[MACAPA] ${report.title}`,
      description: `
**Cliente:** ${report.client}
**Tipo:** ${report.type}
**Prioridad:** ${report.priority}
**Generado por:** MACAPA Super Agent

---

${report.description || 'Sin descripción adicional'}

---

**Análisis AI:** ${extraction.summary}

*Este task fue creado automáticamente por MACAPA Super Agent*
      `.trim(),
      priority: report.priority === 'alta' ? 1 : report.priority === 'media' ? 2 : 3,
      tags: ['MACAPA', 'Auto-Generated', report.type]
    };

    const mainTaskResponse = await clickupApi.post(`/list/${targetListId}/task`, mainTaskData);
    const mainTask = mainTaskResponse.data;
    createdTasks.push(mainTask);

    // Create subtasks if enabled
    if (createSubtasks && extraction.tasks.length > 0) {
      for (const task of extraction.tasks) {
        try {
          const subtaskData = {
            name: task.name,
            description: `
${task.description}

**Categoría:** ${task.category}
**Tiempo estimado:** ${task.estimatedHours} horas

*Subtarea generada por MACAPA Super Agent*
            `.trim(),
            priority: task.priority === 'alta' ? 1 : task.priority === 'media' ? 2 : 3,
            parent: mainTask.id,
            tags: task.tags || ['MACAPA']
          };

          const subtaskResponse = await clickupApi.post(`/list/${targetListId}/task`, subtaskData);
          createdTasks.push(subtaskResponse.data);
        } catch (subtaskError) {
          errors.push({
            task: task.name,
            error: subtaskError.response?.data || subtaskError.message
          });
        }
      }
    }

    // Record in history
    const historyEntry = {
      id: `AUTO-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reportTitle: report.title,
      reportClient: report.client,
      tasksCreated: createdTasks.length,
      mainTaskId: mainTask.id,
      mainTaskUrl: mainTask.url,
      aiUsed: useAI && automationState.settings.aiAnalysisEnabled,
      extraction
    };
    automationState.history.push(historyEntry);

    res.json({
      success: true,
      message: `Successfully created ${createdTasks.length} task(s) in ClickUp`,
      mainTask: {
        id: mainTask.id,
        name: mainTask.name,
        url: mainTask.url
      },
      tasksCreated: createdTasks.length,
      subtasksCreated: createdTasks.length - 1,
      extraction,
      errors: errors.length > 0 ? errors : undefined,
      historyEntry
    });

  } catch (error) {
    console.error('Auto-create tasks error:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

/**
 * Batch create tasks from multiple reports
 */
router.post('/batch-create-tasks', async (req, res) => {
  try {
    const { reports, listId, useAI = true } = req.body;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reports array is required'
      });
    }

    const results = [];
    
    for (const report of reports) {
      try {
        const extraction = useAI ? await extractTasksFromReport(report) : basicTaskExtraction(report);
        
        const taskData = {
          name: `[MACAPA] ${report.title}`,
          description: `Cliente: ${report.client}\nTipo: ${report.type}\n\n${extraction.summary}`,
          priority: report.priority === 'alta' ? 1 : report.priority === 'media' ? 2 : 3,
          tags: ['MACAPA', 'Batch', report.type]
        };

        const response = await clickupApi.post(`/list/${listId}/task`, taskData);
        results.push({
          success: true,
          reportTitle: report.title,
          taskId: response.data.id,
          taskUrl: response.data.url
        });
      } catch (error) {
        results.push({
          success: false,
          reportTitle: report.title,
          error: error.response?.data || error.message
        });
      }
    }

    res.json({
      success: true,
      totalReports: reports.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// AUTOMATION RULES
// =====================================================

/**
 * Create automation rule
 */
router.post('/rules', (req, res) => {
  const { name, trigger, conditions, actions } = req.body;

  const rule = {
    id: `RULE-${Date.now()}`,
    name,
    trigger, // 'report_created', 'report_completed', 'status_changed'
    conditions, // { type: 'auditoria', priority: 'alta' }
    actions, // { createTask: true, listId: '...', notifyEmail: '...' }
    enabled: true,
    createdAt: new Date().toISOString()
  };

  automationState.rules.push(rule);

  res.json({
    success: true,
    rule
  });
});

/**
 * Get all automation rules
 */
router.get('/rules', (req, res) => {
  res.json({
    success: true,
    rules: automationState.rules
  });
});

/**
 * Update automation rule
 */
router.put('/rules/:ruleId', (req, res) => {
  const { ruleId } = req.params;
  const updates = req.body;

  const ruleIndex = automationState.rules.findIndex(r => r.id === ruleId);
  if (ruleIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Rule not found'
    });
  }

  automationState.rules[ruleIndex] = {
    ...automationState.rules[ruleIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    rule: automationState.rules[ruleIndex]
  });
});

/**
 * Delete automation rule
 */
router.delete('/rules/:ruleId', (req, res) => {
  const { ruleId } = req.params;
  
  const ruleIndex = automationState.rules.findIndex(r => r.id === ruleId);
  if (ruleIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Rule not found'
    });
  }

  automationState.rules.splice(ruleIndex, 1);

  res.json({
    success: true,
    message: 'Rule deleted successfully'
  });
});

// =====================================================
// SETTINGS & CONFIGURATION
// =====================================================

/**
 * Get Super Agent settings
 */
router.get('/settings', (req, res) => {
  res.json({
    success: true,
    settings: automationState.settings
  });
});

/**
 * Update Super Agent settings
 */
router.put('/settings', (req, res) => {
  const updates = req.body;
  
  automationState.settings = {
    ...automationState.settings,
    ...updates
  };

  res.json({
    success: true,
    settings: automationState.settings
  });
});

/**
 * Get automation history
 */
router.get('/history', (req, res) => {
  const { limit = 50 } = req.query;
  
  res.json({
    success: true,
    history: automationState.history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit))
  });
});

/**
 * Get Super Agent status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    clickupConnected: !!CLICKUP_API_TOKEN,
    aiEnabled: !!GEMINI_API_KEY && automationState.settings.aiAnalysisEnabled,
    stats: {
      totalAutomations: automationState.history.length,
      activeRules: automationState.rules.filter(r => r.enabled).length,
      lastAutomation: automationState.history.length > 0 
        ? automationState.history[automationState.history.length - 1].timestamp 
        : null
    },
    settings: automationState.settings
  });
});

/**
 * Test AI task extraction
 */
router.post('/test-extraction', async (req, res) => {
  try {
    const { report } = req.body;
    
    if (!report) {
      return res.status(400).json({
        success: false,
        error: 'Report data is required'
      });
    }

    const extraction = await extractTasksFromReport(report);

    res.json({
      success: true,
      extraction,
      aiUsed: !!GEMINI_API_KEY
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
