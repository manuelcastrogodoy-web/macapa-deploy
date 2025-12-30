const express = require('express');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Joi = require('joi');
const aiService = require('../services/aiService');
const zapierService = require('../services/zapierService');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schema for Zapier webhook payload
const zapierPayloadSchema = Joi.object({
  recordId: Joi.string().required(),
  type: Joi.string().valid('audit', 'consultancy', 'report').required(),
  clientName: Joi.string().required(),
  projectName: Joi.string().required(),
  description: Joi.string().required(),
  priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
  analysisData: Joi.object().default({}),
  timestamp: Joi.string().isoDate().default(() => new Date().toISOString()),
  // Campos específicos para auditorías forenses
  auditType: Joi.string().when('type', {
    is: 'audit',
    then: Joi.valid('financial', 'digital', 'compliance', 'security').required(),
    otherwise: Joi.optional()
  }),
  evidenceFiles: Joi.array().items(Joi.string()).default([]),
  complianceFramework: Joi.string().optional(),
  riskLevel: Joi.string().valid('critical', 'high', 'medium', 'low').default('medium')
});

/**
 * POST /api/webhooks/zapier/agent-activity
 * Endpoint principal para recibir datos de Zapier
 */
router.post('/zapier/agent-activity', async (req, res) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    logger.info(`[${requestId}] Webhook received from Zapier`, {
      body: req.body,
      headers: req.headers,
      ip: req.ip
    });

    // Validar payload
    const { error, value: validatedData } = zapierPayloadSchema.validate(req.body);
    if (error) {
      logger.warn(`[${requestId}] Validation error:`, error.details);
      return res.status(400).json({
        success: false,
        error: 'Invalid payload',
        details: error.details.map(d => d.message),
        requestId
      });
    }

    // Verificar autenticación de Zapier (opcional)
    const zapierSignature = req.headers['x-zapier-signature'];
    if (process.env.ZAPIER_WEBHOOK_SECRET && !zapierService.verifySignature(req.body, zapierSignature)) {
      logger.warn(`[${requestId}] Invalid Zapier signature`);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        requestId
      });
    }

    // Procesar con IA según el tipo
    let aiResult;
    switch (validatedData.type) {
      case 'audit':
        aiResult = await aiService.generateForensicAudit(validatedData, requestId);
        break;
      case 'consultancy':
        aiResult = await aiService.generateConsultancy(validatedData, requestId);
        break;
      case 'report':
        aiResult = await aiService.generateReport(validatedData, requestId);
        break;
      default:
        throw new Error(`Unsupported type: ${validatedData.type}`);
    }

    // Preparar respuesta para Zapier
    const response = {
      success: true,
      requestId,
      processingTime: Date.now() - startTime,
      data: {
        originalRequest: validatedData,
        aiGenerated: aiResult,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingDuration: `${Date.now() - startTime}ms`,
          aiModel: 'gemini-2.5-flash',
          version: '1.0.0'
        }
      }
    };

    // Enviar respuesta de vuelta a Zapier (si está configurado)
    if (process.env.ZAPIER_RESPONSE_URL) {
      zapierService.sendResponse(process.env.ZAPIER_RESPONSE_URL, response)
        .catch(err => logger.error(`[${requestId}] Failed to send response to Zapier:`, err));
    }

    logger.info(`[${requestId}] Webhook processed successfully in ${Date.now() - startTime}ms`);
    
    res.status(200).json(response);

  } catch (error) {
    logger.error(`[${requestId}] Webhook processing failed:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: error.message,
      requestId,
      processingTime: Date.now() - startTime
    });
  }
});

/**
 * GET /api/webhooks/zapier/test
 * Endpoint de prueba para verificar conectividad
 */
router.get('/zapier/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MACAPA Zapier webhook endpoint is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      main: '/api/webhooks/zapier/agent-activity',
      test: '/api/webhooks/zapier/test'
    }
  });
});

/**
 * POST /api/webhooks/zapier/validate
 * Endpoint para validar estructura de payload sin procesamiento
 */
router.post('/zapier/validate', (req, res) => {
  const { error, value } = zapierPayloadSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      valid: false,
      errors: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
        value: d.context?.value
      }))
    });
  }

  res.status(200).json({
    valid: true,
    message: 'Payload structure is valid',
    validatedData: value
  });
});

module.exports = router;