const express = require('express');
const router = express.Router();
const axios = require('axios');

// =====================================================
// MACAPA SMART EXECUTOR AGENT
// =====================================================
// An intelligent agent that autonomously executes tasks,
// generates content, and synchronizes with ClickUp & Zapier

// Configuration
const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZAPIER_WEBHOOK_URL = process.env.ZAPIER_WEBHOOK_URL;

// ClickUp API client
const clickupApi = axios.create({
  baseURL: CLICKUP_API_URL,
  headers: {
    'Authorization': CLICKUP_API_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Agent State
let agentState = {
  isRunning: false,
  currentTask: null,
  taskQueue: [],
  executionHistory: [],
  learnings: [],
  config: {
    autoExecute: true,
    maxConcurrentTasks: 3,
    aiModel: 'gemini-2.0-flash',
    notifyOnComplete: true,
    syncToClickUp: true,
    syncToZapier: true
  }
};

// =====================================================
// AI CORE - Gemini Integration for Task Execution
// =====================================================

/**
 * Main AI function to analyze and execute a task
 */
async function executeTaskWithAI(task) {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      error: 'Gemini API key not configured',
      fallbackResult: generateBasicOutput(task)
    };
  }

  try {
    const prompt = buildExecutionPrompt(task);
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192
        }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    
    return {
      success: true,
      result: parseAIResponse(aiResponse, task),
      rawResponse: aiResponse
    };
  } catch (error) {
    console.error('AI execution error:', error.message);
    return {
      success: false,
      error: error.message,
      fallbackResult: generateBasicOutput(task)
    };
  }
}

/**
 * Build the execution prompt based on task type
 */
function buildExecutionPrompt(task) {
  const baseContext = `
Eres un agente ejecutor inteligente de MACAPA, un sistema de auditoría y consultoría forense.
Tu trabajo es ejecutar tareas de manera autónoma y generar resultados de alta calidad.

CONTEXTO DEL SISTEMA:
- Sistema: MACAPA (Sistema de Auditoría y Consultoría)
- Cliente: ${task.client || 'No especificado'}
- Proyecto: ${task.project || 'No especificado'}
`;

  const taskPrompts = {
    'report_generation': `
${baseContext}

TAREA: Generar un reporte profesional

DATOS DE ENTRADA:
- Título: ${task.title}
- Tipo: ${task.type}
- Descripción: ${task.description || 'Sin descripción'}
- Datos adicionales: ${JSON.stringify(task.data || {})}

INSTRUCCIONES:
1. Genera un reporte profesional completo
2. Incluye: Resumen ejecutivo, Análisis detallado, Hallazgos, Recomendaciones, Conclusiones
3. Usa formato Markdown
4. Mantén un tono profesional y técnico
5. Incluye métricas y datos cuando sea posible

Responde con el reporte completo en formato Markdown.
`,

    'task_analysis': `
${baseContext}

TAREA: Analizar y descomponer una tarea compleja

DATOS DE ENTRADA:
- Tarea principal: ${task.title}
- Descripción: ${task.description || 'Sin descripción'}
- Prioridad: ${task.priority || 'media'}

INSTRUCCIONES:
1. Analiza la tarea y descomponla en subtareas manejables
2. Estima el tiempo para cada subtarea
3. Identifica dependencias entre subtareas
4. Sugiere recursos necesarios

Responde con un JSON válido:
{
  "analysis": "Análisis de la tarea",
  "subtasks": [
    {
      "name": "Nombre de subtarea",
      "description": "Descripción",
      "estimatedHours": 2,
      "priority": "alta|media|baja",
      "dependencies": []
    }
  ],
  "totalEstimatedHours": 10,
  "recommendations": ["Recomendación 1", "Recomendación 2"]
}
`,

    'content_creation': `
${baseContext}

TAREA: Crear contenido profesional

DATOS DE ENTRADA:
- Tipo de contenido: ${task.contentType || 'documento'}
- Tema: ${task.title}
- Descripción: ${task.description || 'Sin descripción'}
- Audiencia: ${task.audience || 'profesional'}
- Tono: ${task.tone || 'formal'}

INSTRUCCIONES:
1. Genera contenido de alta calidad según las especificaciones
2. Adapta el tono y estilo a la audiencia
3. Incluye estructura clara con secciones
4. Agrega puntos clave y conclusiones

Responde con el contenido completo.
`,

    'data_analysis': `
${baseContext}

TAREA: Analizar datos y generar insights

DATOS DE ENTRADA:
- Título del análisis: ${task.title}
- Datos: ${JSON.stringify(task.data || {})}
- Métricas solicitadas: ${task.metrics || 'generales'}

INSTRUCCIONES:
1. Analiza los datos proporcionados
2. Identifica patrones y tendencias
3. Genera insights accionables
4. Proporciona recomendaciones basadas en datos

Responde con un JSON válido:
{
  "summary": "Resumen del análisis",
  "insights": ["Insight 1", "Insight 2"],
  "trends": ["Tendencia 1", "Tendencia 2"],
  "recommendations": ["Recomendación 1", "Recomendación 2"],
  "metrics": {
    "key1": "value1"
  }
}
`,

    'email_draft': `
${baseContext}

TAREA: Redactar un correo profesional

DATOS DE ENTRADA:
- Asunto: ${task.subject || task.title}
- Destinatario: ${task.recipient || 'Cliente'}
- Propósito: ${task.purpose || task.description}
- Tono: ${task.tone || 'profesional'}

INSTRUCCIONES:
1. Redacta un correo profesional y efectivo
2. Incluye saludo apropiado
3. Estructura clara del mensaje
4. Llamada a la acción si es necesario
5. Despedida profesional

Responde con el correo completo.
`,

    'default': `
${baseContext}

TAREA: ${task.title}

DESCRIPCIÓN: ${task.description || 'Sin descripción adicional'}

DATOS ADICIONALES: ${JSON.stringify(task.data || {})}

INSTRUCCIONES:
1. Analiza la tarea y determina la mejor manera de ejecutarla
2. Genera un resultado completo y profesional
3. Incluye cualquier información relevante
4. Proporciona recomendaciones si es apropiado

Responde con el resultado de la ejecución.
`
  };

  return taskPrompts[task.taskType] || taskPrompts['default'];
}

/**
 * Parse AI response based on task type
 */
function parseAIResponse(response, task) {
  // Try to extract JSON if expected
  if (['task_analysis', 'data_analysis'].includes(task.taskType)) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          type: 'json',
          data: JSON.parse(jsonMatch[0]),
          raw: response
        };
      }
    } catch (e) {
      // Fall through to text response
    }
  }

  return {
    type: 'text',
    content: response,
    formatted: formatMarkdown(response)
  };
}

/**
 * Generate basic output without AI
 */
function generateBasicOutput(task) {
  return {
    type: 'basic',
    content: `Tarea: ${task.title}\nEstado: Pendiente de ejecución manual\nDescripción: ${task.description || 'Sin descripción'}`,
    note: 'Generado sin AI - requiere revisión manual'
  };
}

/**
 * Format markdown content
 */
function formatMarkdown(content) {
  return content
    .replace(/^# /gm, '## ')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

// =====================================================
// TASK EXECUTION ENDPOINTS
// =====================================================

/**
 * Execute a single task
 */
router.post('/execute', async (req, res) => {
  try {
    const { task, syncClickUp = true, syncZapier = true } = req.body;

    if (!task || !task.title) {
      return res.status(400).json({
        success: false,
        error: 'Task with title is required'
      });
    }

    const executionId = `EXEC-${Date.now()}`;
    const startTime = new Date();

    // Update agent state
    agentState.isRunning = true;
    agentState.currentTask = { ...task, executionId };

    // Execute task with AI
    const aiResult = await executeTaskWithAI(task);

    const execution = {
      id: executionId,
      task,
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      duration: Date.now() - startTime.getTime(),
      aiResult,
      clickupSync: null,
      zapierSync: null
    };

    // Sync to ClickUp if enabled
    if (syncClickUp && CLICKUP_API_TOKEN && task.clickupListId) {
      try {
        const clickupResult = await syncExecutionToClickUp(execution, task.clickupListId);
        execution.clickupSync = clickupResult;
      } catch (error) {
        execution.clickupSync = { success: false, error: error.message };
      }
    }

    // Sync to Zapier if enabled
    if (syncZapier && (ZAPIER_WEBHOOK_URL || task.zapierWebhook)) {
      try {
        const zapierResult = await syncExecutionToZapier(execution, task.zapierWebhook || ZAPIER_WEBHOOK_URL);
        execution.zapierSync = zapierResult;
      } catch (error) {
        execution.zapierSync = { success: false, error: error.message };
      }
    }

    // Save to history
    agentState.executionHistory.push(execution);
    agentState.isRunning = false;
    agentState.currentTask = null;

    res.json({
      success: true,
      execution
    });

  } catch (error) {
    agentState.isRunning = false;
    agentState.currentTask = null;
    console.error('Task execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute multiple tasks in batch
 */
router.post('/execute-batch', async (req, res) => {
  try {
    const { tasks, syncClickUp = true, syncZapier = true } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tasks array is required'
      });
    }

    const results = [];
    
    for (const task of tasks) {
      const executionId = `EXEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date();

      try {
        const aiResult = await executeTaskWithAI(task);
        
        const execution = {
          id: executionId,
          task,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString(),
          duration: Date.now() - startTime.getTime(),
          aiResult,
          success: true
        };

        agentState.executionHistory.push(execution);
        results.push(execution);
      } catch (error) {
        results.push({
          id: executionId,
          task,
          success: false,
          error: error.message
        });
      }
    }

    // Batch sync to Zapier
    if (syncZapier && ZAPIER_WEBHOOK_URL) {
      try {
        await axios.post(ZAPIER_WEBHOOK_URL, {
          event: 'BATCH_EXECUTION_COMPLETE',
          totalTasks: tasks.length,
          successCount: results.filter(r => r.success).length,
          timestamp: new Date().toISOString(),
          results: results.map(r => ({
            taskTitle: r.task.title,
            success: r.success,
            executionId: r.id
          }))
        });
      } catch (e) {
        console.error('Zapier batch sync error:', e.message);
      }
    }

    res.json({
      success: true,
      totalTasks: tasks.length,
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
// CLICKUP SYNC FUNCTIONS
// =====================================================

async function syncExecutionToClickUp(execution, listId) {
  const taskData = {
    name: `[MACAPA Ejecutado] ${execution.task.title}`,
    description: `
**Ejecución Automática de MACAPA Smart Executor**

**ID de Ejecución:** ${execution.id}
**Fecha:** ${new Date(execution.startTime).toLocaleString('es-ES')}
**Duración:** ${execution.duration}ms

---

**Resultado:**

${execution.aiResult.success 
  ? (execution.aiResult.result.type === 'text' 
      ? execution.aiResult.result.content 
      : JSON.stringify(execution.aiResult.result.data, null, 2))
  : `Error: ${execution.aiResult.error}`}

---

*Generado automáticamente por MACAPA Smart Executor Agent*
    `.trim(),
    priority: execution.task.priority === 'alta' ? 1 : execution.task.priority === 'media' ? 2 : 3,
    tags: ['MACAPA', 'Auto-Executed', 'Smart-Agent']
  };

  const response = await clickupApi.post(`/list/${listId}/task`, taskData);
  
  return {
    success: true,
    taskId: response.data.id,
    taskUrl: response.data.url
  };
}

// =====================================================
// ZAPIER SYNC FUNCTIONS
// =====================================================

async function syncExecutionToZapier(execution, webhookUrl) {
  const payload = {
    event: 'TASK_EXECUTED',
    executionId: execution.id,
    taskTitle: execution.task.title,
    taskType: execution.task.taskType || 'default',
    client: execution.task.client,
    project: execution.task.project,
    startTime: execution.startTime,
    endTime: execution.endTime,
    duration: execution.duration,
    success: execution.aiResult.success,
    resultSummary: execution.aiResult.success 
      ? (execution.aiResult.result.type === 'text' 
          ? execution.aiResult.result.content.substring(0, 500) + '...'
          : 'JSON result generated')
      : execution.aiResult.error,
    timestamp: new Date().toISOString()
  };

  await axios.post(webhookUrl, payload);
  
  return {
    success: true,
    message: 'Synced to Zapier'
  };
}

// =====================================================
// WEBHOOK ENDPOINTS (For Zapier/ClickUp triggers)
// =====================================================

/**
 * Webhook to receive tasks from Zapier
 */
router.post('/webhook/zapier', async (req, res) => {
  try {
    const { task, autoExecute = true } = req.body;

    if (!task) {
      return res.status(400).json({
        success: false,
        error: 'Task data is required'
      });
    }

    const queuedTask = {
      ...task,
      source: 'zapier',
      receivedAt: new Date().toISOString(),
      queueId: `QUEUE-${Date.now()}`
    };

    if (autoExecute && agentState.config.autoExecute) {
      // Execute immediately
      const aiResult = await executeTaskWithAI(queuedTask);
      
      const execution = {
        id: `EXEC-${Date.now()}`,
        task: queuedTask,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        aiResult,
        source: 'zapier-webhook'
      };

      agentState.executionHistory.push(execution);

      // Notify back to Zapier if webhook provided
      if (task.callbackWebhook) {
        await axios.post(task.callbackWebhook, {
          event: 'EXECUTION_COMPLETE',
          execution
        });
      }

      res.json({
        success: true,
        message: 'Task executed immediately',
        execution
      });
    } else {
      // Add to queue
      agentState.taskQueue.push(queuedTask);
      
      res.json({
        success: true,
        message: 'Task added to queue',
        queueId: queuedTask.queueId,
        queuePosition: agentState.taskQueue.length
      });
    }

  } catch (error) {
    console.error('Zapier webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Webhook to receive tasks from ClickUp
 */
router.post('/webhook/clickup', async (req, res) => {
  try {
    const event = req.body;

    console.log('ClickUp webhook received:', event.event);

    // Handle different ClickUp events
    if (event.event === 'taskCreated' && event.task_id) {
      // Fetch task details from ClickUp
      const taskResponse = await clickupApi.get(`/task/${event.task_id}`);
      const clickupTask = taskResponse.data;

      // Check if task has MACAPA-EXECUTE tag
      const shouldExecute = clickupTask.tags?.some(t => 
        t.name.toLowerCase().includes('macapa-execute') || 
        t.name.toLowerCase().includes('auto-execute')
      );

      if (shouldExecute) {
        const task = {
          title: clickupTask.name,
          description: clickupTask.description,
          priority: clickupTask.priority?.priority === 1 ? 'alta' : 
                   clickupTask.priority?.priority === 2 ? 'media' : 'baja',
          clickupTaskId: clickupTask.id,
          source: 'clickup'
        };

        const aiResult = await executeTaskWithAI(task);

        // Add comment to ClickUp task with result
        await clickupApi.post(`/task/${clickupTask.id}/comment`, {
          comment_text: `
**MACAPA Smart Executor - Resultado de Ejecución**

${aiResult.success 
  ? (aiResult.result.type === 'text' 
      ? aiResult.result.content.substring(0, 2000) 
      : '```json\n' + JSON.stringify(aiResult.result.data, null, 2).substring(0, 2000) + '\n```')
  : `Error: ${aiResult.error}`}

---
*Ejecutado automáticamente por MACAPA Smart Agent*
          `.trim()
        });

        return res.json({
          success: true,
          message: 'Task executed and result posted to ClickUp',
          taskId: clickupTask.id
        });
      }
    }

    res.json({
      success: true,
      message: 'Webhook received',
      event: event.event
    });

  } catch (error) {
    console.error('ClickUp webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// QUEUE MANAGEMENT
// =====================================================

/**
 * Get task queue
 */
router.get('/queue', (req, res) => {
  res.json({
    success: true,
    queue: agentState.taskQueue,
    queueLength: agentState.taskQueue.length
  });
});

/**
 * Process next task in queue
 */
router.post('/queue/process-next', async (req, res) => {
  if (agentState.taskQueue.length === 0) {
    return res.json({
      success: false,
      message: 'Queue is empty'
    });
  }

  const task = agentState.taskQueue.shift();
  const aiResult = await executeTaskWithAI(task);

  const execution = {
    id: `EXEC-${Date.now()}`,
    task,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    aiResult,
    source: 'queue'
  };

  agentState.executionHistory.push(execution);

  res.json({
    success: true,
    execution,
    remainingInQueue: agentState.taskQueue.length
  });
});

/**
 * Clear task queue
 */
router.delete('/queue', (req, res) => {
  const clearedCount = agentState.taskQueue.length;
  agentState.taskQueue = [];
  
  res.json({
    success: true,
    message: `Cleared ${clearedCount} tasks from queue`
  });
});

// =====================================================
// STATUS & HISTORY
// =====================================================

/**
 * Get agent status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: agentState.isRunning ? 'executing' : 'idle',
    currentTask: agentState.currentTask,
    queueLength: agentState.taskQueue.length,
    totalExecutions: agentState.executionHistory.length,
    config: agentState.config,
    connections: {
      clickup: !!CLICKUP_API_TOKEN,
      geminiAI: !!GEMINI_API_KEY,
      zapier: !!ZAPIER_WEBHOOK_URL
    }
  });
});

/**
 * Get execution history
 */
router.get('/history', (req, res) => {
  const { limit = 50, source } = req.query;
  
  let history = agentState.executionHistory;
  
  if (source) {
    history = history.filter(e => e.source === source);
  }

  res.json({
    success: true,
    history: history
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, parseInt(limit))
  });
});

/**
 * Get specific execution
 */
router.get('/history/:executionId', (req, res) => {
  const { executionId } = req.params;
  
  const execution = agentState.executionHistory.find(e => e.id === executionId);
  
  if (!execution) {
    return res.status(404).json({
      success: false,
      error: 'Execution not found'
    });
  }

  res.json({
    success: true,
    execution
  });
});

// =====================================================
// CONFIGURATION
// =====================================================

/**
 * Get agent configuration
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: agentState.config
  });
});

/**
 * Update agent configuration
 */
router.put('/config', (req, res) => {
  const updates = req.body;
  
  agentState.config = {
    ...agentState.config,
    ...updates
  };

  res.json({
    success: true,
    config: agentState.config
  });
});

// =====================================================
// SPECIALIZED EXECUTION ENDPOINTS
// =====================================================

/**
 * Generate a report using AI
 */
router.post('/generate-report', async (req, res) => {
  try {
    const { title, type, client, description, data } = req.body;

    const task = {
      title,
      taskType: 'report_generation',
      type,
      client,
      description,
      data
    };

    const aiResult = await executeTaskWithAI(task);

    res.json({
      success: true,
      report: aiResult.result,
      executionId: `REPORT-${Date.now()}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze a task and break it down
 */
router.post('/analyze-task', async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    const task = {
      title,
      taskType: 'task_analysis',
      description,
      priority
    };

    const aiResult = await executeTaskWithAI(task);

    res.json({
      success: true,
      analysis: aiResult.result,
      executionId: `ANALYSIS-${Date.now()}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Draft an email
 */
router.post('/draft-email', async (req, res) => {
  try {
    const { subject, recipient, purpose, tone } = req.body;

    const task = {
      title: subject,
      taskType: 'email_draft',
      subject,
      recipient,
      purpose,
      tone
    };

    const aiResult = await executeTaskWithAI(task);

    res.json({
      success: true,
      email: aiResult.result,
      executionId: `EMAIL-${Date.now()}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
