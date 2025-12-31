const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * MACAPA Zapier Integration Service
 * 
 * Servicio avanzado para integración bidireccional con Zapier
 * Soporta:
 * - Webhooks de salida (trigger Zaps)
 * - Webhooks de entrada (recibir datos de Zaps)
 * - Sincronización con Zapier Tables
 * - Gestión de Zapier Agents
 * - Paths inteligentes (A/B/C)
 */
class ZapierIntegrationService {
  constructor() {
    // Webhooks de salida configurados
    this.webhooks = {
      // Webhooks principales
      agentActivity: process.env.ZAPIER_WEBHOOK_AGENT_ACTIVITY,
      auditResult: process.env.ZAPIER_WEBHOOK_AUDIT_RESULT,
      reportGenerated: process.env.ZAPIER_WEBHOOK_REPORT_GENERATED,
      taskCreated: process.env.ZAPIER_WEBHOOK_TASK_CREATED,
      alphaOmega: process.env.ZAPIER_WEBHOOK_ALPHA_OMEGA,
      
      // Webhooks de sincronización
      syncAgent: process.env.ZAPIER_WEBHOOK_SYNC_AGENT,
      tableUpdate: process.env.ZAPIER_WEBHOOK_TABLE_UPDATE,
      
      // Webhooks de notificación
      notification: process.env.ZAPIER_WEBHOOK_NOTIFICATION,
      escalation: process.env.ZAPIER_WEBHOOK_ESCALATION,
      
      // Webhook genérico
      generic: process.env.ZAPIER_WEBHOOK_GENERIC
    };

    // Configuración de Zapier Tables
    this.tables = {
      auditorias: process.env.ZAPIER_TABLE_AUDITORIAS,
      entregables: process.env.ZAPIER_TABLE_ENTREGABLES,
      discovery: process.env.ZAPIER_TABLE_DISCOVERY,
      videoExports: process.env.ZAPIER_TABLE_VIDEO_EXPORTS,
      documentos: process.env.ZAPIER_TABLE_DOCUMENTOS
    };

    // Interfaces de Zapier
    this.interfaces = {
      dashboard: 'https://macapa-dashboard.zapier.app/',
      informesForenses: 'https://informes-forenses-completados.zapier.app/',
      sistemaHumanidad: 'https://sistema-para-la-humanidad.zapier.app/'
    };

    // Configuración de seguridad
    this.webhookSecret = process.env.ZAPIER_WEBHOOK_SECRET;

    // Cola de eventos pendientes
    this.eventQueue = [];
    this.isProcessingQueue = false;

    // Estadísticas
    this.stats = {
      webhooksSent: 0,
      webhooksReceived: 0,
      errors: 0,
      lastActivity: null
    };
  }

  /**
   * Genera firma HMAC para verificación
   */
  generateSignature(payload) {
    if (!this.webhookSecret) return null;
    
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Verifica firma de webhook entrante
   */
  verifySignature(payload, signature) {
    if (!this.webhookSecret || !signature) return true; // Skip if not configured
    
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Envía un evento a Zapier
   */
  async sendWebhook(webhookType, data, options = {}) {
    const webhookUrl = this.webhooks[webhookType] || this.webhooks.generic;
    
    if (!webhookUrl) {
      logger.warn(`Zapier webhook ${webhookType} not configured`);
      return { success: false, reason: 'Webhook not configured' };
    }

    const payload = {
      event: webhookType,
      timestamp: new Date().toISOString(),
      source: 'MACAPA_SuperAgent',
      version: '2.0.0',
      data: data,
      metadata: {
        requestId: options.requestId || this.generateRequestId(),
        priority: options.priority || 'normal',
        retryCount: options.retryCount || 0
      }
    };

    // Agregar firma si está configurado
    const signature = this.generateSignature(payload);

    try {
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MACAPA-ZapierIntegration/2.0',
          ...(signature && { 'X-MACAPA-Signature': signature })
        },
        timeout: options.timeout || 10000
      });

      this.stats.webhooksSent++;
      this.stats.lastActivity = new Date().toISOString();

      logger.info(`Zapier webhook ${webhookType} sent successfully`);

      return {
        success: true,
        webhookType,
        status: response.status,
        requestId: payload.metadata.requestId
      };

    } catch (error) {
      this.stats.errors++;
      logger.error(`Zapier webhook ${webhookType} failed:`, error.message);

      // Reintentar si es un error temporal
      if (options.retryCount < 3 && this.isRetryableError(error)) {
        return this.retryWebhook(webhookType, data, options);
      }

      return {
        success: false,
        webhookType,
        error: error.message
      };
    }
  }

  /**
   * Verifica si el error es reintentable
   */
  isRetryableError(error) {
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    return retryableCodes.includes(error.response?.status);
  }

  /**
   * Reintenta enviar webhook
   */
  async retryWebhook(webhookType, data, options) {
    const delay = Math.pow(2, options.retryCount) * 1000; // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return this.sendWebhook(webhookType, data, {
      ...options,
      retryCount: (options.retryCount || 0) + 1
    });
  }

  /**
   * Procesa webhook entrante de Zapier
   */
  async processIncomingWebhook(payload, signature) {
    // Verificar firma
    if (!this.verifySignature(payload, signature)) {
      logger.warn('Invalid webhook signature');
      return { success: false, error: 'Invalid signature' };
    }

    this.stats.webhooksReceived++;
    this.stats.lastActivity = new Date().toISOString();

    const { event, data, source } = payload;

    logger.info(`Processing incoming webhook: ${event} from ${source}`);

    // Procesar según el tipo de evento
    switch (event) {
      case 'audit_request':
        return this.handleAuditRequest(data);
      
      case 'task_update':
        return this.handleTaskUpdate(data);
      
      case 'report_request':
        return this.handleReportRequest(data);
      
      case 'sync_request':
        return this.handleSyncRequest(data);
      
      case 'agent_command':
        return this.handleAgentCommand(data);
      
      default:
        return this.handleGenericEvent(event, data);
    }
  }

  /**
   * Maneja solicitud de auditoría desde Zapier
   */
  async handleAuditRequest(data) {
    logger.info('Handling audit request from Zapier');
    
    // Aquí se integraría con el SuperAgent
    return {
      success: true,
      action: 'audit_queued',
      data: {
        client: data.client,
        type: data.auditType,
        queuedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Maneja actualización de tarea desde Zapier
   */
  async handleTaskUpdate(data) {
    logger.info('Handling task update from Zapier');
    
    return {
      success: true,
      action: 'task_update_processed',
      taskId: data.taskId
    };
  }

  /**
   * Maneja solicitud de reporte desde Zapier
   */
  async handleReportRequest(data) {
    logger.info('Handling report request from Zapier');
    
    return {
      success: true,
      action: 'report_queued',
      reportType: data.reportType
    };
  }

  /**
   * Maneja solicitud de sincronización
   */
  async handleSyncRequest(data) {
    logger.info('Handling sync request from Zapier');
    
    return {
      success: true,
      action: 'sync_initiated',
      syncType: data.syncType
    };
  }

  /**
   * Maneja comando para el agente
   */
  async handleAgentCommand(data) {
    logger.info('Handling agent command from Zapier:', data.command);
    
    const validCommands = ['start', 'stop', 'pause', 'resume', 'status', 'config'];
    
    if (!validCommands.includes(data.command)) {
      return {
        success: false,
        error: `Invalid command: ${data.command}`
      };
    }

    return {
      success: true,
      action: 'command_executed',
      command: data.command,
      result: `Command ${data.command} processed`
    };
  }

  /**
   * Maneja evento genérico
   */
  async handleGenericEvent(event, data) {
    logger.info(`Handling generic event: ${event}`);
    
    return {
      success: true,
      action: 'event_logged',
      event,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Determina el path del Zap basado en el contenido
   */
  determineZapPath(data) {
    const { type, priority, riskLevel, category } = data;

    // Path A: Auditorías Complejas / Alta Prioridad
    if (type === 'audit' && (priority === 'critical' || priority === 'high' || riskLevel >= 7)) {
      return {
        path: 'A',
        name: 'Auditorías Complejas',
        requiresReview: true,
        escalation: riskLevel >= 8,
        webhook: 'auditResult'
      };
    }

    // Path B: Requiere Revisión (compliance, legal, financial)
    if (['compliance', 'legal', 'financial'].includes(category)) {
      return {
        path: 'B',
        name: 'Requiere Revisión',
        requiresReview: true,
        escalation: false,
        webhook: 'reportGenerated'
      };
    }

    // Path C: Procesamiento Automático
    return {
      path: 'C',
      name: 'Automático',
      requiresReview: false,
      escalation: false,
      webhook: 'taskCreated'
    };
  }

  /**
   * Envía datos a Zapier Tables
   */
  async syncToTable(tableName, data) {
    const tableWebhook = this.tables[tableName];
    
    if (!tableWebhook) {
      logger.warn(`Zapier table ${tableName} not configured`);
      return { success: false, reason: 'Table not configured' };
    }

    return this.sendWebhook('tableUpdate', {
      table: tableName,
      operation: 'upsert',
      record: data
    });
  }

  /**
   * Dispara flujo Alpha (inicio de proyecto)
   */
  async triggerAlphaFlow(projectData) {
    logger.info('Triggering Alpha flow');
    
    return this.sendWebhook('alphaOmega', {
      workflow: 'alpha',
      action: 'project_start',
      project: projectData,
      initiatedAt: new Date().toISOString()
    }, { priority: 'high' });
  }

  /**
   * Dispara flujo Omega (finalización de proyecto)
   */
  async triggerOmegaFlow(projectData) {
    logger.info('Triggering Omega flow');
    
    return this.sendWebhook('alphaOmega', {
      workflow: 'omega',
      action: 'project_complete',
      project: projectData,
      completedAt: new Date().toISOString()
    }, { priority: 'high' });
  }

  /**
   * Envía notificación via Zapier
   */
  async sendNotification(notification) {
    return this.sendWebhook('notification', {
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      recipient: notification.recipient,
      channels: notification.channels || ['email'],
      priority: notification.priority || 'normal'
    });
  }

  /**
   * Envía escalamiento via Zapier
   */
  async sendEscalation(escalation) {
    return this.sendWebhook('escalation', {
      level: escalation.level || 'high',
      reason: escalation.reason,
      context: escalation.context,
      requiredAction: escalation.requiredAction,
      deadline: escalation.deadline,
      escalatedAt: new Date().toISOString()
    }, { priority: 'critical' });
  }

  /**
   * Sincroniza actividad del agente
   */
  async syncAgentActivity(activity) {
    return this.sendWebhook('agentActivity', {
      agentId: 'MACAPA_SuperAgent',
      activityType: activity.type,
      details: activity.details,
      metrics: activity.metrics,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Encola evento para procesamiento posterior
   */
  queueEvent(webhookType, data) {
    this.eventQueue.push({
      webhookType,
      data,
      queuedAt: new Date().toISOString()
    });

    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Procesa cola de eventos
   */
  async processQueue() {
    if (this.eventQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await this.sendWebhook(event.webhookType, event.data);
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
    }

    this.isProcessingQueue = false;
  }

  /**
   * Genera ID de solicitud único
   */
  generateRequestId() {
    return `ZAP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.eventQueue.length,
      configuredWebhooks: Object.keys(this.webhooks).filter(k => this.webhooks[k]).length,
      configuredTables: Object.keys(this.tables).filter(k => this.tables[k]).length
    };
  }

  /**
   * Obtiene configuración actual
   */
  getConfig() {
    return {
      webhooks: Object.keys(this.webhooks).reduce((acc, key) => {
        acc[key] = !!this.webhooks[key];
        return acc;
      }, {}),
      tables: Object.keys(this.tables).reduce((acc, key) => {
        acc[key] = !!this.tables[key];
        return acc;
      }, {}),
      interfaces: this.interfaces,
      securityEnabled: !!this.webhookSecret
    };
  }

  /**
   * Prueba conexión con webhook
   */
  async testWebhook(webhookType) {
    return this.sendWebhook(webhookType, {
      test: true,
      message: 'Connection test from MACAPA SuperAgent',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new ZapierIntegrationService();
