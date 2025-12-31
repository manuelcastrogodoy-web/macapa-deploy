const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Datos de ejemplo para el dashboard
const mockStats = {
  totalReports: 156,
  pendingReports: 23,
  completedReports: 133,
  totalAgents: 12,
  activeAgents: 8,
  totalClients: 45,
  recentActivity: [
    {
      id: 1,
      type: 'report_created',
      description: 'Nuevo reporte de auditoría creado',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      agent: 'Manuel Castro'
    },
    {
      id: 2,
      type: 'report_completed',
      description: 'Reporte de consultoría completado',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      agent: 'Ana García'
    },
    {
      id: 3,
      type: 'client_added',
      description: 'Nuevo cliente registrado',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      agent: 'Carlos López'
    }
  ],
  weeklyStats: {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    reports: [12, 19, 15, 22, 18, 8, 5],
    consultations: [8, 12, 10, 15, 14, 5, 3]
  },
  performanceMetrics: {
    averageCompletionTime: '2.5 días',
    clientSatisfaction: 4.8,
    reportAccuracy: 98.5
  }
};

// GET /api/dashboard/stats - Obtener estadísticas del dashboard
router.get('/stats', async (req, res) => {
  try {
    logger.info('Dashboard stats requested');
    
    // En producción, aquí se consultaría la base de datos
    res.json({
      success: true,
      data: mockStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del dashboard',
      message: error.message
    });
  }
});

// GET /api/dashboard/activity - Obtener actividad reciente
router.get('/activity', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    logger.info(`Dashboard activity requested, limit: ${limit}`);
    
    res.json({
      success: true,
      data: mockStats.recentActivity.slice(0, parseInt(limit)),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching dashboard activity:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener actividad del dashboard',
      message: error.message
    });
  }
});

// GET /api/dashboard/metrics - Obtener métricas de rendimiento
router.get('/metrics', async (req, res) => {
  try {
    logger.info('Dashboard metrics requested');
    
    res.json({
      success: true,
      data: {
        performance: mockStats.performanceMetrics,
        weekly: mockStats.weeklyStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener métricas del dashboard',
      message: error.message
    });
  }
});

module.exports = router;
