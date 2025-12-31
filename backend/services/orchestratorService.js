const { GoogleGenerativeAI } = require('@google/generative-ai');
const clickUpService = require('./clickUpService');
const zapierService = require('./zapierIntegrationService');
const logger = require('../utils/logger');

/**
 * MACAPA Orchestrator Service - Alpha & Omega
 * 
 * Sistema de orquestación autónoma para gestión de proyectos
 * 
 * ALPHA: Inicio de proyecto
 * - Crea estructura en ClickUp
 * - Configura webhooks
 * - Notifica a stakeholders
 * - Inicia flujo de trabajo
 * 
 * OMEGA: Finalización de proyecto
 * - Genera reportes finales
 * - Cierra tareas pendientes
 * - Archiva proyecto
 * - Notifica completación
 */
class OrchestratorService {
  constructor() {
    this.genAI = null;
    this.model = null;
    
    // Estado del orquestador
    this.state = {
      activeProjects: new Map(),
      completedProjects: [],
      pendingActions: [],
      metrics: {
        projectsStarted: 0,
        projectsCompleted: 0,
        averageCompletionTime: 0,
        successRate: 1.0
      }
    };

    // Configuración de flujos
    this.workflows = {
      alpha: {
        phases: [
          'initialization',
          'structure_creation',
          'team_notification',
          'workflow_activation'
        ],
        timeout: 5 * 60 * 1000 // 5 minutos
      },
      omega: {
        phases: [
          'validation',
          'report_generation',
          'task_closure',
          'archival',
          'notification'
        ],
        timeout: 10 * 60 * 1000 // 10 minutos
      }
    };

    // Templates de proyecto
    this.projectTemplates = {
      audit_forensic: {
        name: 'Auditoría Forense',
        tasks: [
          { name: 'Recopilación de evidencia', priority: 2, tags: ['evidencia'] },
          { name: 'Análisis preliminar', priority: 2, tags: ['análisis'] },
          { name: 'Investigación detallada', priority: 3, tags: ['investigación'] },
          { name: 'Documentación de hallazgos', priority: 3, tags: ['documentación'] },
          { name: 'Elaboración de informe', priority: 2, tags: ['informe'] },
          { name: 'Revisión y validación', priority: 2, tags: ['revisión'] },
          { name: 'Entrega al cliente', priority: 1, tags: ['entrega'] }
        ]
      },
      compliance: {
        name: 'Auditoría de Cumplimiento',
        tasks: [
          { name: 'Revisión de políticas', priority: 2, tags: ['políticas'] },
          { name: 'Evaluación de controles', priority: 2, tags: ['controles'] },
          { name: 'Identificación de brechas', priority: 2, tags: ['brechas'] },
          { name: 'Plan de remediación', priority: 3, tags: ['remediación'] },
          { name: 'Informe de cumplimiento', priority: 2, tags: ['informe'] }
        ]
      },
      security: {
        name: 'Evaluación de Seguridad',
        tasks: [
          { name: 'Escaneo de vulnerabilidades', priority: 1, tags: ['vulnerabilidades'] },
          { name: 'Pruebas de penetración', priority: 2, tags: ['pentest'] },
          { name: 'Análisis de riesgos', priority: 2, tags: ['riesgos'] },
          { name: 'Recomendaciones de seguridad', priority: 3, tags: ['recomendaciones'] },
          { name: 'Informe ejecutivo', priority: 2, tags: ['informe'] }
        ]
      },
      general: {
        name: 'Proyecto General',
        tasks: [
          { name: 'Planificación inicial', priority: 2, tags: ['planificación'] },
          { name: 'Ejecución', priority: 3, tags: ['ejecución'] },
          { name: 'Revisión', priority: 3, tags: ['revisión'] },
          { name: 'Entrega', priority: 2, tags: ['entrega'] }
        ]
      }
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
            temperature: 0.3,
            maxOutputTokens: 4096,
          }
        });
        logger.info('Orchestrator AI initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize Orchestrator AI:', error);
    }
  }

  /**
   * ALPHA: Inicia un nuevo proyecto
   */
  async executeAlpha(projectData) {
    const projectId = this.generateProjectId();
    const startTime = Date.now();

    logger.info(`[ALPHA] Starting project: ${projectData.projectName} (${projectId})`);

    const result = {
      projectId,
      projectName: projectData.projectName,
      client: projectData.client,
      type: projectData.type || 'general',
      status: 'initializing',
      phases: [],
      createdTasks: [],
      notifications: [],
      startedAt: new Date().toISOString()
    };

    try {
      // Fase 1: Inicialización
      result.phases.push({ name: 'initialization', status: 'completed', timestamp: new Date().toISOString() });

      // Fase 2: Crear estructura en ClickUp
      const template = this.projectTemplates[projectData.type] || this.projectTemplates.general;
      const clickUpResult = await this.createProjectStructure(projectId, projectData, template);
      result.createdTasks = clickUpResult.tasks;
      result.mainTaskId = clickUpResult.mainTaskId;
      result.phases.push({ name: 'structure_creation', status: 'completed', timestamp: new Date().toISOString() });

      // Fase 3: Notificar a stakeholders via Zapier
      const notificationResult = await this.notifyProjectStart(projectId, projectData);
      result.notifications.push(notificationResult);
      result.phases.push({ name: 'team_notification', status: 'completed', timestamp: new Date().toISOString() });

      // Fase 4: Activar flujo de trabajo
      await this.activateWorkflow(projectId, projectData);
      result.phases.push({ name: 'workflow_activation', status: 'completed', timestamp: new Date().toISOString() });

      // Registrar proyecto activo
      this.state.activeProjects.set(projectId, {
        ...result,
        status: 'active'
      });
      this.state.metrics.projectsStarted++;

      result.status = 'active';
      result.executionTime = Date.now() - startTime;

      logger.info(`[ALPHA] Project ${projectId} started successfully in ${result.executionTime}ms`);

      return result;

    } catch (error) {
      logger.error(`[ALPHA] Project ${projectId} failed:`, error);
      result.status = 'failed';
      result.error = error.message;
      return result;
    }
  }

  /**
   * OMEGA: Finaliza un proyecto
   */
  async executeOmega(projectData) {
    const projectId = projectData.projectId || this.findProjectByName(projectData.projectName);
    const startTime = Date.now();

    logger.info(`[OMEGA] Completing project: ${projectId}`);

    const result = {
      projectId,
      status: 'finalizing',
      phases: [],
      reports: [],
      closedTasks: [],
      notifications: [],
      completedAt: null
    };

    try {
      // Fase 1: Validación
      const project = this.state.activeProjects.get(projectId);
      if (!project && !projectData.forceComplete) {
        throw new Error(`Project ${projectId} not found in active projects`);
      }
      result.phases.push({ name: 'validation', status: 'completed', timestamp: new Date().toISOString() });

      // Fase 2: Generar reportes finales
      if (projectData.generateReport !== false) {
        const reportResult = await this.generateFinalReport(projectId, projectData, project);
        result.reports.push(reportResult);
      }
      result.phases.push({ name: 'report_generation', status: 'completed', timestamp: new Date().toISOString() });

      // Fase 3: Cerrar tareas pendientes
      if (project?.mainTaskId) {
        const closureResult = await this.closeProjectTasks(project.mainTaskId);
        result.closedTasks = closureResult;
      }
      result.phases.push({ name: 'task_closure', status: 'completed', timestamp: new Date().toISOString() });

      // Fase 4: Archivar proyecto
      await this.archiveProject(projectId, project);
      result.phases.push({ name: 'archival', status: 'completed', timestamp: new Date().toISOString() });

      // Fase 5: Notificar completación
      if (projectData.notifyClient !== false) {
        const notificationResult = await this.notifyProjectComplete(projectId, projectData, result);
        result.notifications.push(notificationResult);
      }
      result.phases.push({ name: 'notification', status: 'completed', timestamp: new Date().toISOString() });

      // Actualizar estado
      if (project) {
        this.state.activeProjects.delete(projectId);
        this.state.completedProjects.push({
          ...project,
          completedAt: new Date().toISOString(),
          omegaResult: result
        });
      }
      this.state.metrics.projectsCompleted++;
      this.updateAverageCompletionTime(project?.startedAt);

      result.status = 'completed';
      result.completedAt = new Date().toISOString();
      result.executionTime = Date.now() - startTime;

      logger.info(`[OMEGA] Project ${projectId} completed successfully in ${result.executionTime}ms`);

      return result;

    } catch (error) {
      logger.error(`[OMEGA] Project ${projectId} completion failed:`, error);
      result.status = 'failed';
      result.error = error.message;
      return result;
    }
  }

  /**
   * Crea estructura de proyecto en ClickUp
   */
  async createProjectStructure(projectId, projectData, template) {
    const tasks = [];
    let mainTaskId = null;

    try {
      // Crear tarea principal del proyecto
      const mainTask = await clickUpService.createTask({
        name: `📁 [${projectId}] ${projectData.projectName}`,
        description: this.generateProjectDescription(projectData),
        priority: this.mapPriorityToClickUp(projectData.priority),
        tags: ['proyecto', projectData.type || 'general', 'macapa', 'alpha']
      });
      
      mainTaskId = mainTask.taskId;
      tasks.push({ type: 'main', ...mainTask });

      // Crear subtareas basadas en template
      for (const taskTemplate of template.tasks) {
        try {
          const subtask = await clickUpService.createSubtask(mainTaskId, {
            name: `${taskTemplate.name} - ${projectData.client}`,
            description: `Tarea del proyecto: ${projectData.projectName}\nCliente: ${projectData.client}`,
            priority: taskTemplate.priority,
            tags: [...taskTemplate.tags, projectData.type || 'general']
          });
          tasks.push({ type: 'subtask', ...subtask });
        } catch (error) {
          logger.warn(`Failed to create subtask: ${taskTemplate.name}`, error);
        }
        
        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (error) {
      logger.error('Failed to create project structure:', error);
      throw error;
    }

    return { mainTaskId, tasks };
  }

  /**
   * Genera descripción del proyecto
   */
  generateProjectDescription(projectData) {
    return `
# ${projectData.projectName}

## Información del Proyecto
- **ID:** ${projectData.projectId || 'Pendiente'}
- **Cliente:** ${projectData.client}
- **Tipo:** ${projectData.type || 'General'}
- **Prioridad:** ${projectData.priority || 'Media'}
- **Fecha de inicio:** ${new Date().toLocaleDateString('es-ES')}

## Descripción
${projectData.description || 'Sin descripción proporcionada.'}

## Notas
${projectData.notes || 'Sin notas adicionales.'}

---
*Proyecto creado automáticamente por MACAPA SuperAgent - Flujo Alpha*
    `.trim();
  }

  /**
   * Notifica inicio de proyecto
   */
  async notifyProjectStart(projectId, projectData) {
    try {
      const result = await zapierService.triggerAlphaFlow({
        projectId,
        projectName: projectData.projectName,
        client: projectData.client,
        type: projectData.type,
        priority: projectData.priority,
        startedAt: new Date().toISOString()
      });

      return {
        type: 'project_start',
        status: 'sent',
        ...result
      };
    } catch (error) {
      logger.warn('Failed to send project start notification:', error);
      return {
        type: 'project_start',
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Activa flujo de trabajo
   */
  async activateWorkflow(projectId, projectData) {
    // Sincronizar con Zapier para activar automatizaciones
    await zapierService.syncAgentActivity({
      type: 'workflow_activated',
      details: {
        projectId,
        projectName: projectData.projectName,
        workflow: 'alpha'
      },
      metrics: {
        activeProjects: this.state.activeProjects.size + 1
      }
    });
  }

  /**
   * Genera reporte final del proyecto
   */
  async generateFinalReport(projectId, projectData, project) {
    if (!this.model) {
      return {
        type: 'final_report',
        status: 'skipped',
        reason: 'AI not available'
      };
    }

    try {
      const prompt = `
Genera un reporte ejecutivo de cierre de proyecto con la siguiente información:

**Proyecto:** ${projectData.projectName || project?.projectName}
**Cliente:** ${projectData.client || project?.client}
**Tipo:** ${projectData.type || project?.type}
**Fecha de inicio:** ${project?.startedAt || 'No disponible'}
**Fecha de cierre:** ${new Date().toISOString()}

**Resumen proporcionado:**
${projectData.summary || 'No se proporcionó resumen.'}

Genera un reporte profesional que incluya:
1. Resumen ejecutivo
2. Objetivos alcanzados
3. Hallazgos principales
4. Recomendaciones
5. Próximos pasos sugeridos

El reporte debe ser conciso pero completo, en español.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const reportContent = response.text();

      return {
        type: 'final_report',
        status: 'generated',
        content: reportContent,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to generate final report:', error);
      return {
        type: 'final_report',
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Cierra tareas del proyecto
   */
  async closeProjectTasks(mainTaskId) {
    const closedTasks = [];

    try {
      // Actualizar tarea principal a completada
      await clickUpService.updateTask(mainTaskId, {
        status: 'complete'
      });
      closedTasks.push({ taskId: mainTaskId, status: 'closed' });

      // Agregar comentario de cierre
      await clickUpService.addComment(mainTaskId, 
        `✅ **Proyecto completado**\n\nEste proyecto ha sido cerrado automáticamente por MACAPA SuperAgent - Flujo Omega.\n\nFecha de cierre: ${new Date().toLocaleString('es-ES')}`
      );

    } catch (error) {
      logger.warn('Failed to close project tasks:', error);
    }

    return closedTasks;
  }

  /**
   * Archiva proyecto
   */
  async archiveProject(projectId, project) {
    // Guardar en historial
    if (project) {
      this.state.completedProjects.push({
        ...project,
        archivedAt: new Date().toISOString()
      });
    }

    // Mantener solo los últimos 100 proyectos completados
    if (this.state.completedProjects.length > 100) {
      this.state.completedProjects = this.state.completedProjects.slice(-100);
    }
  }

  /**
   * Notifica completación de proyecto
   */
  async notifyProjectComplete(projectId, projectData, result) {
    try {
      const notifyResult = await zapierService.triggerOmegaFlow({
        projectId,
        projectName: projectData.projectName,
        client: projectData.client,
        completedAt: result.completedAt,
        reportGenerated: result.reports.length > 0,
        tasksCompleted: result.closedTasks.length
      });

      return {
        type: 'project_complete',
        status: 'sent',
        ...notifyResult
      };
    } catch (error) {
      logger.warn('Failed to send project complete notification:', error);
      return {
        type: 'project_complete',
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Busca proyecto por nombre
   */
  findProjectByName(projectName) {
    for (const [id, project] of this.state.activeProjects) {
      if (project.projectName === projectName) {
        return id;
      }
    }
    return null;
  }

  /**
   * Actualiza tiempo promedio de completación
   */
  updateAverageCompletionTime(startedAt) {
    if (!startedAt) return;
    
    const completionTime = Date.now() - new Date(startedAt).getTime();
    const currentAvg = this.state.metrics.averageCompletionTime;
    const count = this.state.metrics.projectsCompleted;
    
    this.state.metrics.averageCompletionTime = 
      (currentAvg * (count - 1) + completionTime) / count;
  }

  /**
   * Genera ID de proyecto único
   */
  generateProjectId() {
    return `PRJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  /**
   * Mapea prioridad a ClickUp
   */
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

  // ==================== API PÚBLICA ====================

  /**
   * Obtiene estado del orquestador
   */
  getStatus() {
    return {
      activeProjects: this.state.activeProjects.size,
      completedProjects: this.state.completedProjects.length,
      pendingActions: this.state.pendingActions.length,
      metrics: this.state.metrics,
      aiAvailable: !!this.model,
      clickUpConnected: !!clickUpService.apiToken,
      zapierConnected: Object.keys(zapierService.webhooks).filter(k => zapierService.webhooks[k]).length > 0
    };
  }

  /**
   * Lista proyectos activos
   */
  getActiveProjects() {
    return Array.from(this.state.activeProjects.values());
  }

  /**
   * Obtiene proyecto por ID
   */
  getProject(projectId) {
    return this.state.activeProjects.get(projectId) || 
           this.state.completedProjects.find(p => p.projectId === projectId);
  }

  /**
   * Obtiene métricas
   */
  getMetrics() {
    return {
      ...this.state.metrics,
      activeProjectsCount: this.state.activeProjects.size,
      completedProjectsCount: this.state.completedProjects.length,
      averageCompletionTimeHours: Math.round(this.state.metrics.averageCompletionTime / (1000 * 60 * 60) * 10) / 10
    };
  }

  /**
   * Obtiene templates disponibles
   */
  getTemplates() {
    return Object.keys(this.projectTemplates).map(key => ({
      id: key,
      name: this.projectTemplates[key].name,
      tasksCount: this.projectTemplates[key].tasks.length
    }));
  }
}

module.exports = new OrchestratorService();
