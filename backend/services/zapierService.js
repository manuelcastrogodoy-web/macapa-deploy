const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class ZapierService {
  /**
   * Verifica la firma de Zapier para autenticación
   */
  verifySignature(payload, signature) {
    if (!process.env.ZAPIER_WEBHOOK_SECRET || !signature) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.ZAPIER_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying Zapier signature:', error);
      return false;
    }
  }

  /**
   * Envía respuesta de vuelta a Zapier
   */
  async sendResponse(webhookUrl, data) {
    try {
      const response = await axios.post(webhookUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MACAPA-Webhook-Client/1.0'
        },
        timeout: 10000
      });

      logger.info('Response sent to Zapier successfully', {
        status: response.status,
        responseTime: response.headers['x-response-time']
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send response to Zapier:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Formatea datos para Google Docs (Path del Zap)
   */
  formatForGoogleDocs(aiResult) {
    return {
      title: aiResult.title,
      content: aiResult.content,
      metadata: {
        generatedAt: aiResult.generatedAt,
        client: aiResult.client,
        type: aiResult.type,
        wordCount: aiResult.wordCount,
        estimatedReadTime: aiResult.estimatedReadTime
      },
      // Formato específico para Google Docs
      documentStructure: {
        heading1: aiResult.title,
        body: aiResult.content,
        footer: `Generado automáticamente por MACAPA el ${new Date(aiResult.generatedAt).toLocaleDateString('es-ES')}`
      }
    };
  }

  /**
   * Determina el path del Zap basado en el contenido
   */
  determineZapPath(aiResult, originalData) {
    // Path A: Auditorías Complejas
    if (aiResult.type === 'forensic_audit' && 
        (originalData.riskLevel === 'critical' || originalData.riskLevel === 'high')) {
      return {
        path: 'A',
        name: 'Auditorías Complejas',
        requiresReview: true,
        escalation: true
      };
    }

    // Path B: Duplicados (verificar si ya existe contenido similar)
    if (this.isDuplicateContent(aiResult, originalData)) {
      return {
        path: 'B',
        name: 'Duplicados',
        requiresReview: true,
        action: 'merge_or_update'
      };
    }

    // Path C: General (flujo estándar)
    return {
      path: 'C',
      name: 'General',
      requiresReview: false,
      autoProcess: true
    };
  }

  /**
   * Verifica si el contenido es duplicado (lógica simplificada)
   */
  isDuplicateContent(aiResult, originalData) {
    // En una implementación real, esto verificaría contra una base de datos
    // Por ahora, usamos una lógica simple basada en el nombre del proyecto
    const projectKeywords = originalData.projectName.toLowerCase().split(' ');
    const contentWords = aiResult.content.toLowerCase();
    
    let matchCount = 0;
    projectKeywords.forEach(keyword => {
      if (contentWords.includes(keyword)) {
        matchCount++;
      }
    });

    // Si más del 70% de las palabras clave coinciden, consideramos duplicado
    return (matchCount / projectKeywords.length) > 0.7;
  }

  /**
   * Prepara payload completo para continuar el Zap
   */
  prepareZapContinuation(aiResult, originalData) {
    const zapPath = this.determineZapPath(aiResult, originalData);
    const googleDocsData = this.formatForGoogleDocs(aiResult);

    return {
      // Datos originales de Zapier Tables
      originalRecord: originalData,
      
      // Resultado procesado por IA
      aiGenerated: aiResult,
      
      // Datos formateados para Google Docs
      documentData: googleDocsData,
      
      // Información del path
      zapPath: zapPath,
      
      // Metadatos para el flujo
      flowMetadata: {
        processedAt: new Date().toISOString(),
        processingDuration: Date.now() - (originalData.startTime || Date.now()),
        aiModel: 'gemini-2.5-flash',
        version: '1.0.0',
        nextAction: zapPath.autoProcess ? 'create_document' : 'require_review'
      },

      // Datos específicos para cada path
      pathSpecificData: this.getPathSpecificData(zapPath, aiResult, originalData)
    };
  }

  /**
   * Obtiene datos específicos según el path del Zap
   */
  getPathSpecificData(zapPath, aiResult, originalData) {
    switch (zapPath.path) {
      case 'A': // Auditorías Complejas
        return {
          escalationRequired: true,
          reviewers: ['senior_auditor', 'compliance_manager'],
          urgency: 'high',
          additionalChecks: ['legal_review', 'technical_validation'],
          estimatedReviewTime: '2-4 hours'
        };

      case 'B': // Duplicados
        return {
          duplicateAction: 'merge_or_update',
          similarProjects: [], // En implementación real, buscaría proyectos similares
          mergeStrategy: 'append_new_findings',
          requiresClientNotification: true
        };

      case 'C': // General
      default:
        return {
          autoApproved: true,
          standardProcessing: true,
          deliveryMethod: 'email_and_portal',
          followUpRequired: false
        };
    }
  }
}

module.exports = new ZapierService();