const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.isAvailable = false;
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not configured - AI features will be limited');
      return;
    }
    
    this.isAvailable = true;
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
  }

  /**
   * Genera una auditoría forense completa usando Gemini 2.5 Flash
   */
  async generateForensicAudit(data, requestId) {
    try {
      logger.info(`[${requestId}] Generating forensic audit for ${data.clientName}`);

      const prompt = this.buildForensicAuditPrompt(data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const auditContent = response.text();

      const structuredAudit = this.parseAuditContent(auditContent, data);

      logger.info(`[${requestId}] Forensic audit generated successfully`);
      return structuredAudit;

    } catch (error) {
      logger.error(`[${requestId}] Failed to generate forensic audit:`, error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Genera consultoría especializada
   */
  async generateConsultancy(data, requestId) {
    try {
      logger.info(`[${requestId}] Generating consultancy for ${data.clientName}`);

      const prompt = this.buildConsultancyPrompt(data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const consultancyContent = response.text();

      const structuredConsultancy = this.parseConsultancyContent(consultancyContent, data);

      logger.info(`[${requestId}] Consultancy generated successfully`);
      return structuredConsultancy;

    } catch (error) {
      logger.error(`[${requestId}] Failed to generate consultancy:`, error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Genera reportes automáticos
   */
  async generateReport(data, requestId) {
    try {
      logger.info(`[${requestId}] Generating report for ${data.clientName}`);

      const prompt = this.buildReportPrompt(data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const reportContent = response.text();

      const structuredReport = this.parseReportContent(reportContent, data);

      logger.info(`[${requestId}] Report generated successfully`);
      return structuredReport;

    } catch (error) {
      logger.error(`[${requestId}] Failed to generate report:`, error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Construye el prompt para auditoría forense
   */
  buildForensicAuditPrompt(data) {
    return `
Eres un experto auditor forense especializado en ${data.auditType || 'auditorías digitales'}. 
Genera una auditoría forense completa y profesional basada en los siguientes datos:

**INFORMACIÓN DEL CLIENTE:**
- Cliente: ${data.clientName}
- Proyecto: ${data.projectName}
- Descripción: ${data.description}
- Tipo de Auditoría: ${data.auditType || 'General'}
- Nivel de Riesgo: ${data.riskLevel || 'medium'}
- Prioridad: ${data.priority}
- Marco de Cumplimiento: ${data.complianceFramework || 'Estándares generales'}

**DATOS DE ANÁLISIS:**
${JSON.stringify(data.analysisData, null, 2)}

**ARCHIVOS DE EVIDENCIA:**
${data.evidenceFiles?.length ? data.evidenceFiles.join(', ') : 'No se proporcionaron archivos específicos'}

**INSTRUCCIONES:**
1. Crea un informe de auditoría forense estructurado y profesional
2. Incluye hallazgos específicos basados en los datos proporcionados
3. Proporciona recomendaciones accionables
4. Evalúa riesgos y controles
5. Sugiere medidas correctivas
6. Incluye un resumen ejecutivo
7. Mantén un tono profesional y técnico

**ESTRUCTURA REQUERIDA:**
- Resumen Ejecutivo
- Alcance y Metodología
- Hallazgos Principales
- Análisis de Riesgos
- Recomendaciones
- Plan de Acción
- Conclusiones

Genera el contenido en español, con formato profesional y detallado.
`;
  }

  /**
   * Construye el prompt para consultoría
   */
  buildConsultancyPrompt(data) {
    return `
Eres un consultor senior especializado en ${data.type} con amplia experiencia en el sector.
Genera una consultoría profesional basada en los siguientes datos:

**INFORMACIÓN DEL CLIENTE:**
- Cliente: ${data.clientName}
- Proyecto: ${data.projectName}
- Descripción: ${data.description}
- Prioridad: ${data.priority}

**DATOS DE ANÁLISIS:**
${JSON.stringify(data.analysisData, null, 2)}

**INSTRUCCIONES:**
1. Proporciona análisis estratégico profundo
2. Identifica oportunidades de mejora
3. Sugiere soluciones innovadoras
4. Incluye análisis de viabilidad
5. Proporciona roadmap de implementación
6. Considera factores de riesgo y mitigación

**ESTRUCTURA REQUERIDA:**
- Análisis de Situación Actual
- Identificación de Oportunidades
- Propuesta de Soluciones
- Plan de Implementación
- Análisis de ROI
- Gestión de Riesgos
- Próximos Pasos

Genera contenido estratégico, accionable y orientado a resultados en español.
`;
  }

  /**
   * Construye el prompt para reportes
   */
  buildReportPrompt(data) {
    return `
Genera un reporte profesional y detallado basado en los siguientes datos:

**INFORMACIÓN DEL PROYECTO:**
- Cliente: ${data.clientName}
- Proyecto: ${data.projectName}
- Descripción: ${data.description}
- Prioridad: ${data.priority}

**DATOS PARA ANÁLISIS:**
${JSON.stringify(data.analysisData, null, 2)}

**INSTRUCCIONES:**
1. Crea un reporte estructurado y profesional
2. Incluye análisis de datos relevantes
3. Proporciona insights accionables
4. Incluye visualizaciones conceptuales (descritas en texto)
5. Sugiere métricas de seguimiento
6. Mantén claridad y precisión

**ESTRUCTURA REQUERIDA:**
- Resumen Ejecutivo
- Metodología
- Análisis de Datos
- Hallazgos Clave
- Insights y Tendencias
- Recomendaciones
- Métricas de Seguimiento
- Conclusiones

Genera un reporte completo, profesional y orientado a la toma de decisiones en español.
`;
  }

  /**
   * Parsea y estructura el contenido de auditoría
   */
  parseAuditContent(content, originalData) {
    return {
      type: 'forensic_audit',
      title: `Auditoría Forense - ${originalData.projectName}`,
      client: originalData.clientName,
      generatedAt: new Date().toISOString(),
      content: content,
      metadata: {
        auditType: originalData.auditType,
        riskLevel: originalData.riskLevel,
        priority: originalData.priority,
        complianceFramework: originalData.complianceFramework,
        evidenceFiles: originalData.evidenceFiles || []
      },
      status: 'completed',
      wordCount: content.split(' ').length,
      estimatedReadTime: Math.ceil(content.split(' ').length / 200) // 200 words per minute
    };
  }

  /**
   * Parsea y estructura el contenido de consultoría
   */
  parseConsultancyContent(content, originalData) {
    return {
      type: 'consultancy',
      title: `Consultoría - ${originalData.projectName}`,
      client: originalData.clientName,
      generatedAt: new Date().toISOString(),
      content: content,
      metadata: {
        priority: originalData.priority,
        analysisScope: Object.keys(originalData.analysisData || {}).length
      },
      status: 'completed',
      wordCount: content.split(' ').length,
      estimatedReadTime: Math.ceil(content.split(' ').length / 200)
    };
  }

  /**
   * Parsea y estructura el contenido de reporte
   */
  parseReportContent(content, originalData) {
    return {
      type: 'report',
      title: `Reporte - ${originalData.projectName}`,
      client: originalData.clientName,
      generatedAt: new Date().toISOString(),
      content: content,
      metadata: {
        priority: originalData.priority,
        dataPoints: Object.keys(originalData.analysisData || {}).length
      },
      status: 'completed',
      wordCount: content.split(' ').length,
      estimatedReadTime: Math.ceil(content.split(' ').length / 200)
    };
  }
}

module.exports = new AIService();