const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * MACAPA Super Agent - Agente Autónomo Inteligente
 * 
 * Este agente es capaz de:
 * 1. Analizar tareas y contexto automáticamente
 * 2. Tomar decisiones autónomas basadas en reglas y aprendizaje
 * 3. Crear y gestionar tareas en ClickUp
 * 4. Disparar Zaps de Zapier según contexto
 * 5. Ejecutar flujos Alpha/Omega de forma autónoma
 * 6. Aprender de patrones de uso
 */
class SuperAgentService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.clickUpToken = process.env.CLICKUP_API_TOKEN;
    this.clickUpBaseUrl = 'https://api.clickup.com/api/v2';
    this.zapierWebhooks = {
      agentActivity: process.env.ZAPIER_WEBHOOK_AGENT_ACTIVITY,
      auditResult: process.env.ZAPIER_WEBHOOK_AUDIT_RESULT,
      reportGenerated: process.env.ZAPIER_WEBHOOK_REPORT_GENERATED,
      taskCreated: process.env.ZAPIER_WEBHOOK_TASK_CREATED,
      alphaOmega: process.env.ZAPIER_WEBHOOK_ALPHA_OMEGA
    };
    
    // Estado del agente
    this.agentState = {
      isActive: true,
      currentMode: 'autonomous', // 'autonomous', 'supervised', 'manual'
      learningEnabled: true,
      executionHistory: [],
      patterns: new Map(),
      confidenceThreshold: 0.75
    };

    // Reglas de decisión
    this.decisionRules = {
      highPriority: ['critical', 'urgent', 'high'],
      autoApprove: ['low', 'routine', 'standard'],
      requiresReview: ['compliance', 'legal', 'financial'],
      escalation: ['critical', 'security_breach', 'fraud']
    };

    this.initializeAI();
  }

  /**
   * Inicializa el modelo de IA
   */
  initializeAI() {
    try {
      if (process.env.GEMINI_API_KEY) {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.3, // Más determinístico para decisiones
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        });
        logger.info('SuperAgent AI initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize SuperAgent AI:', error);
    }
  }

  /**
   * MÉTODO PRINCIPAL: Procesa una solicitud de forma autónoma
   */
  async processAutonomously(input) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      logger.info(`[${requestId}] SuperAgent processing request autonomously`);

      // Paso 1: Analizar la solicitud
      const analysis = await this.analyzeRequest(input, requestId);

      // Paso 2: Determinar acciones necesarias
      const actions = await this.determineActions(analysis, requestId);

      // Paso 3: Validar decisiones (si es necesario)
      const validatedActions = await this.validateDecisions(actions, analysis, requestId);

      // Paso 4: Ejecutar acciones
      const results = await this.executeActions(validatedActions, requestId);

      // Paso 5: Sincronizar con sistemas externos
      await this.syncExternalSystems(results, requestId);

      // Paso 6: Registrar para aprendizaje
      this.recordExecution(input, analysis, actions, results, requestId);

      const executionTime = Date.now() - startTime;
      logger.info(`[${requestId}] SuperAgent completed in ${executionTime}ms`);

      return {
        success: true,
        requestId,
        analysis,
        actions: validatedActions,
        results,
        executionTime,
        agentMode: this.agentState.currentMode
      };

    } catch (error) {
      logger.error(`[${requestId}] SuperAgent error:`, error);
      return {
        success: false,
        requestId,
        error: error.message,
        fallbackAction: 'manual_review_required'
      };
    }
  }

  /**
   * Analiza la solicitud usando IA
   */
  async analyzeRequest(input, requestId) {
    const prompt = `
Eres un agente inteligente de MACAPA especializado en auditorías forenses y gestión de proyectos.
Analiza la siguiente solicitud y proporciona un análisis estructurado en JSON.

SOLICITUD:
${JSON.stringify(input, null, 2)}

ANÁLISIS REQUERIDO (responde SOLO con JSON válido):
{
  "type": "tipo de solicitud (audit, report, task, consultation, alert)",
  "priority": "prioridad (critical, high, medium, low)",
  "category": "categoría (forensic, compliance, security, financial, operational)",
  "complexity": "complejidad (simple, moderate, complex)",
  "urgency": "urgencia (immediate, within_hours, within_days, flexible)",
  "riskLevel": "nivel de riesgo (1-10)",
  "requiredActions": ["lista de acciones necesarias"],
  "suggestedWorkflow": "flujo sugerido (alpha, omega, standard, express)",
  "estimatedDuration": "duración estimada en minutos",
  "confidence": "confianza del análisis (0-1)",
  "keywords": ["palabras clave relevantes"],
  "entities": {
    "client": "nombre del cliente si se menciona",
    "project": "nombre del proyecto si se menciona",
    "deadline": "fecha límite si se menciona"
  },
  "reasoning": "explicación breve del análisis"
}
`;

    try {
      if (!this.model) {
        return this.fallbackAnalysis(input);
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extraer JSON de la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        logger.info(`[${requestId}] Analysis completed with confidence: ${analysis.confidence}`);
        return analysis;
      }

      return this.fallbackAnalysis(input);

    } catch (error) {
      logger.error(`[${requestId}] Analysis failed:`, error);
      return this.fallbackAnalysis(input);
    }
  }

  /**
   * Análisis de respaldo sin IA
   */
  fallbackAnalysis(input) {
    const text = JSON.stringify(input).toLowerCase();
    
    return {
      type: text.includes('audit') ? 'audit' : text.includes('report') ? 'report' : 'task',
      priority: text.includes('urgent') || text.includes('critical') ? 'high' : 'medium',
      category: text.includes('forensic') ? 'forensic' : 'operational',
      complexity: 'moderate',
      urgency: 'within_days',
      riskLevel: 5,
      requiredActions: ['create_task', 'notify_team'],
      suggestedWorkflow: 'standard',
      estimatedDuration: 60,
      confidence: 0.5,
      keywords: [],
      entities: {},
      reasoning: 'Análisis de respaldo sin IA'
    };
  }

  /**
   * Determina las acciones a ejecutar
   */
  async determineActions(analysis, requestId) {
    const actions = [];

    // Acción 1: Crear tarea en ClickUp si es necesario
    if (analysis.requiredActions.includes('create_task') || 
        analysis.type === 'task' || 
        analysis.type === 'audit') {
      actions.push({
        type: 'clickup_task',
        priority: this.mapPriorityToClickUp(analysis.priority),
        data: {
          name: this.generateTaskName(analysis),
          description: this.generateTaskDescription(analysis),
          priority: this.mapPriorityToClickUp(analysis.priority),
          dueDate: this.calculateDueDate(analysis),
          tags: analysis.keywords || []
        }
      });
    }

    // Acción 2: Disparar Zap según tipo
    if (analysis.type === 'audit') {
      actions.push({
        type: 'zapier_trigger',
        webhook: 'auditResult',
        data: {
          auditType: analysis.category,
          riskLevel: analysis.riskLevel,
          priority: analysis.priority
        }
      });
    }

    // Acción 3: Flujo Alpha/Omega
    if (analysis.suggestedWorkflow === 'alpha') {
      actions.push({
        type: 'workflow_alpha',
        data: {
          projectName: analysis.entities.project || 'Nuevo Proyecto',
          client: analysis.entities.client || 'Cliente',
          type: analysis.category
        }
      });
    } else if (analysis.suggestedWorkflow === 'omega') {
      actions.push({
        type: 'workflow_omega',
        data: {
          generateReport: true,
          notifyClient: analysis.priority !== 'low'
        }
      });
    }

    // Acción 4: Generar contenido con IA si es necesario
    if (analysis.type === 'report' || analysis.requiredActions.includes('generate_content')) {
      actions.push({
        type: 'ai_generation',
        contentType: analysis.type,
        data: analysis
      });
    }

    // Acción 5: Notificaciones
    if (this.decisionRules.highPriority.includes(analysis.priority)) {
      actions.push({
        type: 'notification',
        channels: ['email', 'zapier'],
        data: {
          message: `Tarea de alta prioridad: ${analysis.type}`,
          urgency: analysis.urgency
        }
      });
    }

    // Acción 6: Escalamiento si es necesario
    if (this.decisionRules.escalation.includes(analysis.category) || analysis.riskLevel >= 8) {
      actions.push({
        type: 'escalation',
        level: analysis.riskLevel >= 9 ? 'critical' : 'high',
        data: {
          reason: `Riesgo nivel ${analysis.riskLevel}: ${analysis.category}`,
          requiresImmediate: analysis.urgency === 'immediate'
        }
      });
    }

    logger.info(`[${requestId}] Determined ${actions.length} actions`);
    return actions;
  }

  /**
   * Valida las decisiones antes de ejecutar
   */
  async validateDecisions(actions, analysis, requestId) {
    const validatedActions = [];

    for (const action of actions) {
      const validation = {
        ...action,
        validated: true,
        validationMethod: 'automatic'
      };

      // Validación basada en confianza
      if (analysis.confidence < this.agentState.confidenceThreshold) {
        validation.validated = false;
        validation.validationMethod = 'requires_manual_review';
        validation.reason = `Confianza ${analysis.confidence} < umbral ${this.agentState.confidenceThreshold}`;
      }

      // Validación basada en reglas
      if (this.decisionRules.requiresReview.includes(analysis.category)) {
        validation.validationMethod = 'requires_approval';
        validation.approvalRequired = true;
      }

      // Auto-aprobación para tareas rutinarias
      if (this.decisionRules.autoApprove.includes(analysis.priority) && 
          analysis.complexity === 'simple') {
        validation.validated = true;
        validation.validationMethod = 'auto_approved';
      }

      validatedActions.push(validation);
    }

    logger.info(`[${requestId}] Validated ${validatedActions.filter(a => a.validated).length}/${actions.length} actions`);
    return validatedActions;
  }

  /**
   * Ejecuta las acciones validadas
   */
  async executeActions(actions, requestId) {
    const results = [];

    for (const action of actions) {
      if (!action.validated && action.validationMethod !== 'auto_approved') {
        results.push({
          action: action.type,
          status: 'skipped',
          reason: action.reason || 'Validation failed'
        });
        continue;
      }

      try {
        let result;

        switch (action.type) {
          case 'clickup_task':
            result = await this.createClickUpTask(action.data, requestId);
            break;

          case 'zapier_trigger':
            result = await this.triggerZapierWebhook(action.webhook, action.data, requestId);
            break;

          case 'workflow_alpha':
            result = await this.executeAlphaWorkflow(action.data, requestId);
            break;

          case 'workflow_omega':
            result = await this.executeOmegaWorkflow(action.data, requestId);
            break;

          case 'ai_generation':
            result = await this.generateAIContent(action.contentType, action.data, requestId);
            break;

          case 'notification':
            result = await this.sendNotification(action.channels, action.data, requestId);
            break;

          case 'escalation':
            result = await this.handleEscalation(action.level, action.data, requestId);
            break;

          default:
            result = { status: 'unknown_action', action: action.type };
        }

        results.push({
          action: action.type,
          status: 'completed',
          result
        });

      } catch (error) {
        logger.error(`[${requestId}] Action ${action.type} failed:`, error);
        results.push({
          action: action.type,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Crea una tarea en ClickUp
   */
  async createClickUpTask(taskData, requestId) {
    if (!this.clickUpToken) {
      logger.warn(`[${requestId}] ClickUp token not configured`);
      return { status: 'skipped', reason: 'No ClickUp token' };
    }

    try {
      // Usar lista por defecto o la configurada
      const listId = process.env.CLICKUP_DEFAULT_LIST_ID || '901309298887';

      const response = await axios.post(
        `${this.clickUpBaseUrl}/list/${listId}/task`,
        {
          name: taskData.name,
          description: taskData.description,
          priority: taskData.priority,
          due_date: taskData.dueDate,
          tags: taskData.tags,
          status: 'to do'
        },
        {
          headers: {
            'Authorization': this.clickUpToken,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`[${requestId}] ClickUp task created: ${response.data.id}`);
      return {
        status: 'created',
        taskId: response.data.id,
        taskUrl: response.data.url
      };

    } catch (error) {
      logger.error(`[${requestId}] ClickUp task creation failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Dispara un webhook de Zapier
   */
  async triggerZapierWebhook(webhookType, data, requestId) {
    const webhookUrl = this.zapierWebhooks[webhookType];
    
    if (!webhookUrl) {
      logger.warn(`[${requestId}] Zapier webhook ${webhookType} not configured`);
      return { status: 'skipped', reason: 'Webhook not configured' };
    }

    try {
      const payload = {
        ...data,
        timestamp: new Date().toISOString(),
        requestId,
        source: 'MACAPA_SuperAgent'
      };

      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MACAPA-SuperAgent/2.0'
        },
        timeout: 10000
      });

      logger.info(`[${requestId}] Zapier webhook ${webhookType} triggered`);
      return {
        status: 'triggered',
        webhookType,
        response: response.status
      };

    } catch (error) {
      logger.error(`[${requestId}] Zapier webhook failed:`, error.message);
      throw error;
    }
  }

  /**
   * Ejecuta el flujo Alpha (inicio de proyecto)
   */
  async executeAlphaWorkflow(data, requestId) {
    logger.info(`[${requestId}] Executing Alpha workflow`);

    const alphaResult = {
      projectId: this.generateProjectId(),
      status: 'initiated',
      createdAt: new Date().toISOString(),
      tasks: []
    };

    // Crear estructura de tareas para el proyecto
    const projectTasks = [
      { name: `[ALPHA] Inicio: ${data.projectName}`, priority: 2 },
      { name: `Análisis inicial - ${data.client}`, priority: 2 },
      { name: `Recopilación de evidencia - ${data.type}`, priority: 3 },
      { name: `Revisión de documentación`, priority: 3 }
    ];

    for (const task of projectTasks) {
      try {
        const result = await this.createClickUpTask({
          name: task.name,
          description: `Proyecto: ${data.projectName}\nCliente: ${data.client}\nTipo: ${data.type}`,
          priority: task.priority,
          tags: ['alpha', data.type]
        }, requestId);
        
        alphaResult.tasks.push(result);
      } catch (error) {
        logger.error(`[${requestId}] Alpha task creation failed:`, error);
      }
    }

    // Notificar a Zapier
    await this.triggerZapierWebhook('alphaOmega', {
      workflow: 'alpha',
      ...alphaResult,
      ...data
    }, requestId);

    return alphaResult;
  }

  /**
   * Ejecuta el flujo Omega (finalización de proyecto)
   */
  async executeOmegaWorkflow(data, requestId) {
    logger.info(`[${requestId}] Executing Omega workflow`);

    const omegaResult = {
      status: 'finalizing',
      completedAt: new Date().toISOString(),
      actions: []
    };

    // Generar reporte final si se solicita
    if (data.generateReport) {
      const reportResult = await this.generateAIContent('final_report', {
        type: 'omega_report',
        ...data
      }, requestId);
      omegaResult.report = reportResult;
      omegaResult.actions.push('report_generated');
    }

    // Crear tarea de cierre
    await this.createClickUpTask({
      name: `[OMEGA] Cierre de proyecto`,
      description: `Proyecto finalizado.\nReporte: ${data.generateReport ? 'Generado' : 'No solicitado'}`,
      priority: 2,
      tags: ['omega', 'closure']
    }, requestId);
    omegaResult.actions.push('closure_task_created');

    // Notificar a Zapier
    await this.triggerZapierWebhook('alphaOmega', {
      workflow: 'omega',
      ...omegaResult,
      ...data
    }, requestId);

    omegaResult.status = 'completed';
    return omegaResult;
  }

  /**
   * Genera contenido con IA
   */
  async generateAIContent(contentType, data, requestId) {
    if (!this.model) {
      return { status: 'skipped', reason: 'AI not available' };
    }

    const prompts = {
      report: `Genera un reporte profesional basado en: ${JSON.stringify(data)}`,
      audit: `Genera una auditoría forense basada en: ${JSON.stringify(data)}`,
      summary: `Genera un resumen ejecutivo basado en: ${JSON.stringify(data)}`,
      final_report: `Genera un reporte final de cierre de proyecto: ${JSON.stringify(data)}`,
      omega_report: `Genera un reporte de finalización Omega: ${JSON.stringify(data)}`
    };

    try {
      const prompt = prompts[contentType] || prompts.summary;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return {
        status: 'generated',
        contentType,
        content: response.text(),
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`[${requestId}] AI generation failed:`, error);
      throw error;
    }
  }

  /**
   * Envía notificaciones
   */
  async sendNotification(channels, data, requestId) {
    const results = [];

    for (const channel of channels) {
      if (channel === 'zapier') {
        const result = await this.triggerZapierWebhook('agentActivity', {
          type: 'notification',
          ...data
        }, requestId);
        results.push({ channel, ...result });
      }
      // Agregar más canales según sea necesario (email, slack, etc.)
    }

    return { status: 'sent', channels: results };
  }

  /**
   * Maneja escalamientos
   */
  async handleEscalation(level, data, requestId) {
    logger.warn(`[${requestId}] ESCALATION ${level}: ${data.reason}`);

    // Crear tarea de escalamiento
    await this.createClickUpTask({
      name: `🚨 ESCALAMIENTO ${level.toUpperCase()}: ${data.reason}`,
      description: `Escalamiento automático del SuperAgent.\n\nRazón: ${data.reason}\nRequiere acción inmediata: ${data.requiresImmediate}`,
      priority: 1, // Urgente
      tags: ['escalation', level]
    }, requestId);

    // Notificar via Zapier
    await this.triggerZapierWebhook('agentActivity', {
      type: 'escalation',
      level,
      ...data
    }, requestId);

    return {
      status: 'escalated',
      level,
      notified: true
    };
  }

  /**
   * Sincroniza con sistemas externos
   */
  async syncExternalSystems(results, requestId) {
    // Sincronizar estado con Zapier Tables
    try {
      await this.triggerZapierWebhook('agentActivity', {
        type: 'sync',
        requestId,
        results: results.map(r => ({ action: r.action, status: r.status })),
        timestamp: new Date().toISOString()
      }, requestId);
    } catch (error) {
      logger.error(`[${requestId}] External sync failed:`, error);
    }
  }

  /**
   * Registra la ejecución para aprendizaje
   */
  recordExecution(input, analysis, actions, results, requestId) {
    if (!this.agentState.learningEnabled) return;

    const record = {
      requestId,
      timestamp: new Date().toISOString(),
      input: JSON.stringify(input).substring(0, 500),
      analysisType: analysis.type,
      analysisPriority: analysis.priority,
      actionsCount: actions.length,
      successRate: results.filter(r => r.status === 'completed').length / results.length,
      confidence: analysis.confidence
    };

    this.agentState.executionHistory.push(record);

    // Mantener solo los últimos 100 registros
    if (this.agentState.executionHistory.length > 100) {
      this.agentState.executionHistory.shift();
    }

    // Actualizar patrones
    const patternKey = `${analysis.type}_${analysis.priority}`;
    const currentPattern = this.agentState.patterns.get(patternKey) || { count: 0, avgSuccess: 0 };
    currentPattern.count++;
    currentPattern.avgSuccess = (currentPattern.avgSuccess * (currentPattern.count - 1) + record.successRate) / currentPattern.count;
    this.agentState.patterns.set(patternKey, currentPattern);
  }

  // ==================== UTILIDADES ====================

  generateRequestId() {
    return `SA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateProjectId() {
    return `PRJ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  generateTaskName(analysis) {
    const prefix = analysis.type === 'audit' ? '🔍' : analysis.type === 'report' ? '📊' : '📋';
    return `${prefix} ${analysis.type.toUpperCase()}: ${analysis.entities.project || analysis.entities.client || 'Nueva tarea'}`;
  }

  generateTaskDescription(analysis) {
    return `
**Tipo:** ${analysis.type}
**Categoría:** ${analysis.category}
**Prioridad:** ${analysis.priority}
**Complejidad:** ${analysis.complexity}
**Nivel de Riesgo:** ${analysis.riskLevel}/10

**Acciones Requeridas:**
${analysis.requiredActions.map(a => `- ${a}`).join('\n')}

**Análisis:**
${analysis.reasoning}

---
*Generado automáticamente por MACAPA SuperAgent*
    `.trim();
  }

  mapPriorityToClickUp(priority) {
    const mapping = {
      'critical': 1,
      'urgent': 1,
      'high': 2,
      'medium': 3,
      'low': 4
    };
    return mapping[priority] || 3;
  }

  calculateDueDate(analysis) {
    const now = Date.now();
    const durations = {
      'immediate': 1 * 60 * 60 * 1000, // 1 hora
      'within_hours': 4 * 60 * 60 * 1000, // 4 horas
      'within_days': 2 * 24 * 60 * 60 * 1000, // 2 días
      'flexible': 7 * 24 * 60 * 60 * 1000 // 1 semana
    };
    return now + (durations[analysis.urgency] || durations.within_days);
  }

  // ==================== API PÚBLICA ====================

  /**
   * Obtiene el estado del agente
   */
  getStatus() {
    return {
      isActive: this.agentState.isActive,
      mode: this.agentState.currentMode,
      learningEnabled: this.agentState.learningEnabled,
      executionCount: this.agentState.executionHistory.length,
      patternsLearned: this.agentState.patterns.size,
      aiAvailable: !!this.model,
      clickUpConfigured: !!this.clickUpToken,
      zapierWebhooks: Object.keys(this.zapierWebhooks).filter(k => this.zapierWebhooks[k]).length
    };
  }

  /**
   * Cambia el modo del agente
   */
  setMode(mode) {
    if (['autonomous', 'supervised', 'manual'].includes(mode)) {
      this.agentState.currentMode = mode;
      logger.info(`SuperAgent mode changed to: ${mode}`);
      return true;
    }
    return false;
  }

  /**
   * Ajusta el umbral de confianza
   */
  setConfidenceThreshold(threshold) {
    if (threshold >= 0 && threshold <= 1) {
      this.agentState.confidenceThreshold = threshold;
      return true;
    }
    return false;
  }

  /**
   * Obtiene estadísticas de aprendizaje
   */
  getLearningStats() {
    const patterns = {};
    this.agentState.patterns.forEach((value, key) => {
      patterns[key] = value;
    });

    return {
      totalExecutions: this.agentState.executionHistory.length,
      patterns,
      recentExecutions: this.agentState.executionHistory.slice(-10)
    };
  }
}

module.exports = new SuperAgentService();
