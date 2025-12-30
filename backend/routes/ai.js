const express = require('express');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/ai/test
 * Endpoint para probar la conexión con Gemini AI
 */
router.post('/test', async (req, res) => {
  try {
    const testData = {
      clientName: 'Cliente de Prueba',
      projectName: 'Proyecto de Prueba',
      description: 'Esta es una prueba de conectividad con Gemini AI',
      type: 'report',
      priority: 'low',
      analysisData: {
        testField: 'Datos de prueba'
      }
    };

    const result = await aiService.generateReport(testData, 'test-request');

    res.json({
      success: true,
      message: 'AI service is working correctly',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI test failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI service test failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/generate
 * Endpoint genérico para generar contenido con IA
 */
router.post('/generate', async (req, res) => {
  try {
    const { type, ...data } = req.body;

    if (!type || !['audit', 'consultancy', 'report'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type',
        message: 'Type must be one of: audit, consultancy, report'
      });
    }

    let result;
    const requestId = `manual-${Date.now()}`;

    switch (type) {
      case 'audit':
        result = await aiService.generateForensicAudit(data, requestId);
        break;
      case 'consultancy':
        result = await aiService.generateConsultancy(data, requestId);
        break;
      case 'report':
        result = await aiService.generateReport(data, requestId);
        break;
    }

    res.json({
      success: true,
      data: result,
      requestId,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI generation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/models
 * Información sobre los modelos de IA disponibles
 */
router.get('/models', (req, res) => {
  res.json({
    success: true,
    data: {
      primary: {
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        capabilities: [
          'Text generation',
          'Multimodal analysis',
          'Code generation',
          'Document analysis'
        ],
        maxTokens: 8192,
        temperature: 0.7
      },
      supported_types: [
        {
          type: 'audit',
          description: 'Forensic audit generation',
          specializations: ['financial', 'digital', 'compliance', 'security']
        },
        {
          type: 'consultancy',
          description: 'Strategic consultancy reports',
          specializations: ['digital_transformation', 'process_optimization', 'risk_management']
        },
        {
          type: 'report',
          description: 'General analytical reports',
          specializations: ['data_analysis', 'performance_review', 'compliance_check']
        }
      ]
    }
  });
});

/**
 * POST /api/ai/analyze
 * Análisis de contenido existente
 */
router.post('/analyze', async (req, res) => {
  try {
    const { content, analysisType = 'general' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
        message: 'Please provide content to analyze'
      });
    }

    // Análisis básico del contenido
    const analysis = {
      wordCount: content.split(' ').length,
      characterCount: content.length,
      estimatedReadTime: Math.ceil(content.split(' ').length / 200),
      sentiment: 'neutral', // En implementación real, usar análisis de sentimientos
      complexity: content.split(' ').length > 1000 ? 'high' : 'medium',
      topics: extractTopics(content),
      readabilityScore: calculateReadability(content)
    };

    res.json({
      success: true,
      data: analysis,
      analysisType,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Content analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Content analysis failed',
      message: error.message
    });
  }
});

/**
 * Extrae temas principales del contenido (implementación simplificada)
 */
function extractTopics(content) {
  const commonWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las'];
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !commonWords.includes(word));

  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({ word, frequency: count }));
}

/**
 * Calcula puntuación de legibilidad (implementación simplificada)
 */
function calculateReadability(content) {
  const sentences = content.split(/[.!?]+/).length;
  const words = content.split(' ').length;
  const avgWordsPerSentence = words / sentences;

  if (avgWordsPerSentence < 15) return 'easy';
  if (avgWordsPerSentence < 25) return 'medium';
  return 'difficult';
}

module.exports = router;