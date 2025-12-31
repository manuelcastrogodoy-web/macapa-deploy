const axios = require('axios');
const logger = require('../utils/logger');

/**
 * MACAPA ClickUp Service
 * 
 * Servicio dedicado para la integración con ClickUp API
 * Soporta:
 * - Gestión de tareas
 * - Gestión de espacios y listas
 * - Webhooks
 * - Campos personalizados
 * - Comentarios y adjuntos
 */
class ClickUpService {
  constructor() {
    this.apiToken = process.env.CLICKUP_API_TOKEN || 'pk_168250572_KV2XRP93P3TBHGU825KD32T24ISJ02OZ';
    this.baseUrl = 'https://api.clickup.com/api/v2';
    this.defaultWorkspaceId = process.env.CLICKUP_WORKSPACE_ID || '90132602813';
    this.defaultListId = process.env.CLICKUP_DEFAULT_LIST_ID || '901309298887';
    
    // Cache para reducir llamadas a la API
    this.cache = {
      workspaces: null,
      spaces: new Map(),
      lists: new Map(),
      lastUpdate: null
    };
    
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Headers de autenticación
   */
  getHeaders() {
    return {
      'Authorization': this.apiToken,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Verifica la conexión con ClickUp
   */
  async checkConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: this.getHeaders()
      });
      
      return {
        connected: true,
        user: response.data.user,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('ClickUp connection check failed:', error.message);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene los workspaces (teams)
   */
  async getWorkspaces() {
    try {
      // Verificar cache
      if (this.cache.workspaces && 
          this.cache.lastUpdate && 
          Date.now() - this.cache.lastUpdate < this.cacheTimeout) {
        return this.cache.workspaces;
      }

      const response = await axios.get(`${this.baseUrl}/team`, {
        headers: this.getHeaders()
      });

      this.cache.workspaces = response.data.teams;
      this.cache.lastUpdate = Date.now();

      return response.data.teams;
    } catch (error) {
      logger.error('Failed to get workspaces:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene los spaces de un workspace
   */
  async getSpaces(teamId = this.defaultWorkspaceId) {
    try {
      // Verificar cache
      if (this.cache.spaces.has(teamId)) {
        const cached = this.cache.spaces.get(teamId);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const response = await axios.get(`${this.baseUrl}/team/${teamId}/space`, {
        headers: this.getHeaders()
      });

      this.cache.spaces.set(teamId, {
        data: response.data.spaces,
        timestamp: Date.now()
      });

      return response.data.spaces;
    } catch (error) {
      logger.error('Failed to get spaces:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene las listas de un space
   */
  async getLists(spaceId) {
    try {
      // Verificar cache
      if (this.cache.lists.has(spaceId)) {
        const cached = this.cache.lists.get(spaceId);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const response = await axios.get(`${this.baseUrl}/space/${spaceId}/list`, {
        headers: this.getHeaders()
      });

      this.cache.lists.set(spaceId, {
        data: response.data.lists,
        timestamp: Date.now()
      });

      return response.data.lists;
    } catch (error) {
      logger.error('Failed to get lists:', error.message);
      throw error;
    }
  }

  /**
   * Crea una tarea en ClickUp
   */
  async createTask(taskData, listId = this.defaultListId) {
    try {
      const payload = {
        name: taskData.name,
        description: taskData.description || '',
        priority: taskData.priority || 3,
        status: taskData.status || 'to do',
        tags: taskData.tags || [],
        due_date: taskData.dueDate || null,
        due_date_time: taskData.dueDateTime || false,
        time_estimate: taskData.timeEstimate || null,
        start_date: taskData.startDate || null,
        notify_all: taskData.notifyAll || false,
        parent: taskData.parentTaskId || null,
        links_to: taskData.linkedTasks || null,
        custom_fields: taskData.customFields || []
      };

      // Limpiar campos nulos
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      const response = await axios.post(
        `${this.baseUrl}/list/${listId}/task`,
        payload,
        { headers: this.getHeaders() }
      );

      logger.info(`Task created in ClickUp: ${response.data.id}`);

      return {
        success: true,
        task: response.data,
        taskId: response.data.id,
        taskUrl: response.data.url
      };
    } catch (error) {
      logger.error('Failed to create task:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Actualiza una tarea existente
   */
  async updateTask(taskId, updates) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/task/${taskId}`,
        updates,
        { headers: this.getHeaders() }
      );

      logger.info(`Task updated in ClickUp: ${taskId}`);

      return {
        success: true,
        task: response.data
      };
    } catch (error) {
      logger.error('Failed to update task:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtiene una tarea por ID
   */
  async getTask(taskId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/task/${taskId}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get task:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene tareas de una lista
   */
  async getTasks(listId = this.defaultListId, options = {}) {
    try {
      const params = new URLSearchParams({
        archived: options.archived || false,
        page: options.page || 0,
        order_by: options.orderBy || 'due_date',
        reverse: options.reverse || false,
        subtasks: options.subtasks || false,
        statuses: options.statuses?.join(',') || '',
        include_closed: options.includeClosed || false
      });

      const response = await axios.get(
        `${this.baseUrl}/list/${listId}/task?${params}`,
        { headers: this.getHeaders() }
      );

      return response.data.tasks;
    } catch (error) {
      logger.error('Failed to get tasks:', error.message);
      throw error;
    }
  }

  /**
   * Crea una subtarea
   */
  async createSubtask(parentTaskId, subtaskData) {
    try {
      // Primero obtener la tarea padre para conocer su lista
      const parentTask = await this.getTask(parentTaskId);
      
      const subtask = await this.createTask({
        ...subtaskData,
        parentTaskId: parentTaskId
      }, parentTask.list.id);

      return subtask;
    } catch (error) {
      logger.error('Failed to create subtask:', error.message);
      throw error;
    }
  }

  /**
   * Agrega un comentario a una tarea
   */
  async addComment(taskId, commentText, notifyAll = false) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/task/${taskId}/comment`,
        {
          comment_text: commentText,
          notify_all: notifyAll
        },
        { headers: this.getHeaders() }
      );

      logger.info(`Comment added to task ${taskId}`);

      return {
        success: true,
        comment: response.data
      };
    } catch (error) {
      logger.error('Failed to add comment:', error.message);
      throw error;
    }
  }

  /**
   * Crea un webhook en ClickUp
   */
  async createWebhook(teamId, endpoint, events) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/team/${teamId}/webhook`,
        {
          endpoint: endpoint,
          events: events || [
            'taskCreated',
            'taskUpdated',
            'taskDeleted',
            'taskStatusUpdated',
            'taskCommentPosted'
          ]
        },
        { headers: this.getHeaders() }
      );

      logger.info(`Webhook created: ${response.data.id}`);

      return {
        success: true,
        webhook: response.data
      };
    } catch (error) {
      logger.error('Failed to create webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Lista webhooks existentes
   */
  async getWebhooks(teamId = this.defaultWorkspaceId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/team/${teamId}/webhook`,
        { headers: this.getHeaders() }
      );

      return response.data.webhooks;
    } catch (error) {
      logger.error('Failed to get webhooks:', error.message);
      throw error;
    }
  }

  /**
   * Elimina un webhook
   */
  async deleteWebhook(webhookId) {
    try {
      await axios.delete(
        `${this.baseUrl}/webhook/${webhookId}`,
        { headers: this.getHeaders() }
      );

      logger.info(`Webhook deleted: ${webhookId}`);

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete webhook:', error.message);
      throw error;
    }
  }

  /**
   * Crea múltiples tareas en batch
   */
  async createTasksBatch(tasks, listId = this.defaultListId) {
    const results = [];
    
    for (const task of tasks) {
      try {
        const result = await this.createTask(task, listId);
        results.push({
          success: true,
          task: task.name,
          ...result
        });
      } catch (error) {
        results.push({
          success: false,
          task: task.name,
          error: error.message
        });
      }
      
      // Pequeña pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  /**
   * Crea una estructura de proyecto completa
   */
  async createProjectStructure(projectData) {
    const { projectName, client, type, tasks } = projectData;
    const results = {
      projectName,
      client,
      type,
      createdTasks: [],
      errors: []
    };

    // Tarea principal del proyecto
    try {
      const mainTask = await this.createTask({
        name: `📁 ${projectName}`,
        description: `**Cliente:** ${client}\n**Tipo:** ${type}\n\nProyecto creado automáticamente por MACAPA SuperAgent`,
        priority: 2,
        tags: ['proyecto', type, 'macapa']
      });
      results.mainTaskId = mainTask.taskId;
      results.createdTasks.push(mainTask);

      // Crear subtareas si se proporcionan
      if (tasks && tasks.length > 0) {
        for (const subtask of tasks) {
          try {
            const result = await this.createSubtask(mainTask.taskId, {
              name: subtask.name,
              description: subtask.description || '',
              priority: subtask.priority || 3,
              tags: subtask.tags || []
            });
            results.createdTasks.push(result);
          } catch (error) {
            results.errors.push({
              task: subtask.name,
              error: error.message
            });
          }
        }
      }

    } catch (error) {
      results.errors.push({
        task: 'main',
        error: error.message
      });
    }

    return results;
  }

  /**
   * Busca tareas por nombre o descripción
   */
  async searchTasks(query, teamId = this.defaultWorkspaceId) {
    try {
      // ClickUp no tiene búsqueda directa, usamos filtrado local
      const spaces = await this.getSpaces(teamId);
      const allTasks = [];

      for (const space of spaces) {
        const lists = await this.getLists(space.id);
        for (const list of lists) {
          const tasks = await this.getTasks(list.id);
          allTasks.push(...tasks);
        }
      }

      // Filtrar por query
      const queryLower = query.toLowerCase();
      const matchedTasks = allTasks.filter(task => 
        task.name.toLowerCase().includes(queryLower) ||
        (task.description && task.description.toLowerCase().includes(queryLower))
      );

      return matchedTasks;
    } catch (error) {
      logger.error('Failed to search tasks:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del workspace
   */
  async getWorkspaceStats(teamId = this.defaultWorkspaceId) {
    try {
      const spaces = await this.getSpaces(teamId);
      let totalTasks = 0;
      let totalLists = 0;
      const statusCounts = {};

      for (const space of spaces) {
        const lists = await this.getLists(space.id);
        totalLists += lists.length;

        for (const list of lists) {
          const tasks = await this.getTasks(list.id, { includeClosed: true });
          totalTasks += tasks.length;

          tasks.forEach(task => {
            const status = task.status?.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
        }
      }

      return {
        teamId,
        spacesCount: spaces.length,
        listsCount: totalLists,
        tasksCount: totalTasks,
        statusDistribution: statusCounts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get workspace stats:', error.message);
      throw error;
    }
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache = {
      workspaces: null,
      spaces: new Map(),
      lists: new Map(),
      lastUpdate: null
    };
    logger.info('ClickUp cache cleared');
  }
}

module.exports = new ClickUpService();
