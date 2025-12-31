const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const router = express.Router();

// Simulación de base de datos en memoria (en producción usar base de datos real)
let reportsDatabase = [
  {
    id: '1',
    title: 'Auditoría Forense - Sistema Financiero ABC',
    client: 'Corporación ABC',
    type: 'forensic_audit',
    status: 'completed',
    createdAt: '2024-12-20T10:30:00Z',
    completedAt: '2024-12-20T14:45:00Z',
    priority: 'high',
    riskLevel: 'critical',
    wordCount: 3500,
    estimatedReadTime: 18
  },
  {
    id: '2',
    title: 'Consultoría - Transformación Digital XYZ',
    client: 'Empresa XYZ',
    type: 'consultancy',
    status: 'in_progress',
    createdAt: '2024-12-21T09:15:00Z',
    priority: 'medium',
    wordCount: 2100,
    estimatedReadTime: 11
  },
  {
    id: '3',
    title: 'Reporte - Análisis de Cumplimiento Q4',
    client: 'TechCorp Ltd',
    type: 'report',
    status: 'completed',
    createdAt: '2024-12-22T08:00:00Z',
    completedAt: '2024-12-22T16:30:00Z',
    priority: 'low',
    wordCount: 1800,
    estimatedReadTime: 9
  },
  {
    id: '4',
    title: 'Auditoría de Seguridad - Infraestructura Cloud',
    client: 'CloudServices Inc',
    type: 'forensic_audit',
    status: 'pending',
    createdAt: '2024-12-23T11:00:00Z',
    priority: 'high',
    wordCount: 0,
    estimatedReadTime: 0
  },
  {
    id: '5',
    title: 'Consultoría Estratégica - Plan 2025',
    client: 'StartupTech',
    type: 'consultancy',
    status: 'completed',
    createdAt: '2024-12-19T14:00:00Z',
    completedAt: '2024-12-23T10:00:00Z',
    priority: 'medium',
    wordCount: 4200,
    estimatedReadTime: 21
  }
];

/**
 * GET /api/reports/stats/dashboard
 * Obtiene estadísticas para el dashboard
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id para evitar conflictos
 */
router.get('/stats/dashboard', (req, res) => {
  try {
    logger.info('Dashboard stats requested');
    
    const stats = {
      totalReports: reportsDatabase.length,
      
      byStatus: {
        completed: reportsDatabase.filter(r => r.status === 'completed').length,
        in_progress: reportsDatabase.filter(r => r.status === 'in_progress').length,
        pending: reportsDatabase.filter(r => r.status === 'pending').length
      },
      
      byType: {
        forensic_audit: reportsDatabase.filter(r => r.type === 'forensic_audit').length,
        consultancy: reportsDatabase.filter(r => r.type === 'consultancy').length,
        report: reportsDatabase.filter(r => r.type === 'report').length
      },
      
      byPriority: {
        high: reportsDatabase.filter(r => r.priority === 'high').length,
        medium: reportsDatabase.filter(r => r.priority === 'medium').length,
        low: reportsDatabase.filter(r => r.priority === 'low').length
      },
      
      recentActivity: reportsDatabase
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(report => ({
          id: report.id,
          title: report.title,
          client: report.client,
          type: report.type,
          status: report.status,
          createdAt: report.createdAt
        })),
      
      productivity: {
        averageWordCount: Math.round(
          reportsDatabase.reduce((sum, r) => sum + (r.wordCount || 0), 0) / reportsDatabase.length
        ),
        averageReadTime: Math.round(
          reportsDatabase.reduce((sum, r) => sum + (r.estimatedReadTime || 0), 0) / reportsDatabase.length
        ),
        completionRate: Math.round(
          (reportsDatabase.filter(r => r.status === 'completed').length / reportsDatabase.length) * 100
        )
      }
    };

    res.json({
      success: true,
      data: stats,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/reports
 * Obtiene lista de reportes con filtros opcionales
 */
router.get('/', (req, res) => {
  try {
    const { 
      type, 
      status, 
      client, 
      priority, 
      limit = 10, 
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filteredReports = [...reportsDatabase];

    // Aplicar filtros
    if (type) {
      filteredReports = filteredReports.filter(report => report.type === type);
    }
    if (status) {
      filteredReports = filteredReports.filter(report => report.status === status);
    }
    if (client) {
      filteredReports = filteredReports.filter(report => 
        report.client.toLowerCase().includes(client.toLowerCase())
      );
    }
    if (priority) {
      filteredReports = filteredReports.filter(report => report.priority === priority);
    }

    // Ordenar
    filteredReports.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Paginación
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedReports,
      pagination: {
        total: filteredReports.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < filteredReports.length
      },
      filters: { type, status, client, priority },
      sorting: { sortBy, sortOrder }
    });

  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/:id
 * Obtiene un reporte específico por ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const report = reportsDatabase.find(r => r.id === id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: `No report found with ID: ${id}`
      });
    }

    // Simular contenido completo del reporte
    const fullReport = {
      ...report,
      content: `Este es el contenido completo del reporte "${report.title}" para ${report.client}. 
      
      En una implementación real, este contenido vendría de la base de datos y contendría 
      el análisis completo generado por la IA.
      
      Tipo: ${report.type}
      Estado: ${report.status}
      Prioridad: ${report.priority}
      
      [Aquí iría el contenido completo del reporte...]`,
      
      metadata: {
        lastModified: report.completedAt || report.createdAt,
        version: '1.0',
        generatedBy: 'MACAPA AI System',
        aiModel: 'gemini-2.5-flash'
      }
    };

    res.json({
      success: true,
      data: fullReport
    });

  } catch (error) {
    logger.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report',
      message: error.message
    });
  }
});

/**
 * POST /api/reports
 * Crea un nuevo reporte manualmente
 */
router.post('/', (req, res) => {
  try {
    const newReport = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    reportsDatabase.push(newReport);

    logger.info('New report created:', { id: newReport.id, title: newReport.title });

    res.status(201).json({
      success: true,
      data: newReport,
      message: 'Report created successfully'
    });

  } catch (error) {
    logger.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
      message: error.message
    });
  }
});

/**
 * PUT /api/reports/:id
 * Actualiza un reporte existente
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reportIndex = reportsDatabase.findIndex(r => r.id === id);

    if (reportIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: `No report found with ID: ${id}`
      });
    }

    const updatedReport = {
      ...reportsDatabase[reportIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    reportsDatabase[reportIndex] = updatedReport;

    logger.info('Report updated:', { id, title: updatedReport.title });

    res.json({
      success: true,
      data: updatedReport,
      message: 'Report updated successfully'
    });

  } catch (error) {
    logger.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report',
      message: error.message
    });
  }
});

/**
 * DELETE /api/reports/:id
 * Elimina un reporte
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reportIndex = reportsDatabase.findIndex(r => r.id === id);

    if (reportIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: `No report found with ID: ${id}`
      });
    }

    const deletedReport = reportsDatabase.splice(reportIndex, 1)[0];

    logger.info('Report deleted:', { id, title: deletedReport.title });

    res.json({
      success: true,
      message: 'Report deleted successfully',
      data: { id: deletedReport.id }
    });

  } catch (error) {
    logger.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
      message: error.message
    });
  }
});

module.exports = router;
