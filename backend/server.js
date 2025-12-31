const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
require('dotenv').config();

const webhookRoutes = require('./routes/webhooks');
const reportsRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');
const superagentRoutes = require('./routes/superagent');
const clickupRoutes = require('./routes/clickup');
const zapierRoutes = require('./routes/zapier');
const orchestratorRoutes = require('./routes/orchestrator');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', '*'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      superAgent: 'active',
      ai: 'active',
      webhooks: 'active'
    }
  });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'MACAPA API',
    version: '2.0.0',
    description: 'Sistema de Auditoría Forense con Super Agente Inteligente',
    endpoints: {
      health: '/health',
      superagent: {
        process: 'POST /api/superagent/process',
        alpha: 'POST /api/superagent/alpha',
        omega: 'POST /api/superagent/omega',
        audit: 'POST /api/superagent/audit',
        task: 'POST /api/superagent/task',
        report: 'POST /api/superagent/report',
        status: 'GET /api/superagent/status',
        stats: 'GET /api/superagent/stats',
        mode: 'PUT /api/superagent/mode',
        analyze: 'POST /api/superagent/analyze',
        webhook: 'POST /api/superagent/webhook'
      },
      ai: {
        generate: 'POST /api/ai/generate',
        audit: 'POST /api/ai/audit'
      },
      webhooks: {
        zapier: 'POST /api/webhooks/zapier',
        clickup: 'POST /api/webhooks/clickup'
      },
      reports: {
        create: 'POST /api/reports',
        list: 'GET /api/reports'
      }
    },
    documentation: 'https://github.com/manuelcastrogodoy-web/macapa-deploy'
  });
});

// API Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/superagent', superagentRoutes);
app.use('/api/clickup', clickupRoutes);
app.use('/api/zapier', zapierRoutes);
app.use('/api/orchestrator', orchestratorRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      '/health',
      '/api/superagent/*',
      '/api/ai/*',
      '/api/webhooks/*',
      '/api/reports/*'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`🚀 MACAPA Backend Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🤖 SuperAgent: Active`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/`);
});

module.exports = app;
