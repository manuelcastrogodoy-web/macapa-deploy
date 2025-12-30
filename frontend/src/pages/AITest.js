import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Psychology as AIIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import moment from 'moment';

const AITest = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    type: 'report',
    clientName: 'Cliente de Prueba',
    projectName: 'Proyecto de Prueba IA',
    description: 'Esta es una prueba del sistema de generación automática con IA',
    priority: 'medium',
    auditType: 'digital',
    riskLevel: 'medium',
    complianceFramework: 'ISO 27001',
    analysisData: JSON.stringify({
      testField: 'Datos de prueba',
      metrics: {
        performance: 85,
        security: 92,
        compliance: 78
      },
      findings: [
        'Hallazgo de prueba 1',
        'Hallazgo de prueba 2'
      ]
    }, null, 2)
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestConnection = async () => {
    setIsGenerating(true);
    try {
      const response = await axios.post('/api/ai/test');
      setConnectionStatus({
        success: true,
        data: response.data
      });
      enqueueSnackbar('Conexión con IA exitosa', { variant: 'success' });
    } catch (error) {
      setConnectionStatus({
        success: false,
        error: error.response?.data || error.message
      });
      enqueueSnackbar('Error en conexión con IA', { variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      // Parse analysisData if it's a string
      let analysisData = {};
      try {
        analysisData = JSON.parse(formData.analysisData);
      } catch (e) {
        analysisData = { rawData: formData.analysisData };
      }

      const payload = {
        ...formData,
        analysisData,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post('/api/ai/generate', payload);
      
      setResult({
        success: true,
        data: response.data.data,
        requestId: response.data.requestId,
        generatedAt: response.data.generatedAt
      });
      
      enqueueSnackbar('Contenido generado exitosamente', { variant: 'success' });
    } catch (error) {
      setResult({
        success: false,
        error: error.response?.data || error.message
      });
      enqueueSnackbar('Error al generar contenido', { variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'audit': return 'Auditoría Forense';
      case 'consultancy': return 'Consultoría';
      case 'report': return 'Reporte';
      default: return type;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Pruebas de IA - Gemini 2.5 Flash
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Configuración de Prueba
              </Typography>

              {/* Connection Test */}
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<AIIcon />}
                  onClick={handleTestConnection}
                  disabled={isGenerating}
                  fullWidth
                >
                  Probar Conexión con IA
                </Button>
                
                {connectionStatus && (
                  <Alert 
                    severity={connectionStatus.success ? 'success' : 'error'} 
                    sx={{ mt: 2 }}
                  >
                    {connectionStatus.success 
                      ? 'Conexión exitosa con Gemini 2.5 Flash' 
                      : `Error: ${connectionStatus.error.message || 'Error de conexión'}`}
                  </Alert>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Form Fields */}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Tipo de Contenido"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <MenuItem value="audit">Auditoría Forense</MenuItem>
                    <MenuItem value="consultancy">Consultoría</MenuItem>
                    <MenuItem value="report">Reporte</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre del Cliente"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre del Proyecto"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Descripción"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Prioridad"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    <MenuItem value="high">Alta</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="low">Baja</MenuItem>
                  </TextField>
                </Grid>

                {formData.type === 'audit' && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        select
                        label="Tipo de Auditoría"
                        value={formData.auditType}
                        onChange={(e) => handleInputChange('auditType', e.target.value)}
                      >
                        <MenuItem value="financial">Financiera</MenuItem>
                        <MenuItem value="digital">Digital</MenuItem>
                        <MenuItem value="compliance">Cumplimiento</MenuItem>
                        <MenuItem value="security">Seguridad</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        select
                        label="Nivel de Riesgo"
                        value={formData.riskLevel}
                        onChange={(e) => handleInputChange('riskLevel', e.target.value)}
                      >
                        <MenuItem value="critical">Crítico</MenuItem>
                        <MenuItem value="high">Alto</MenuItem>
                        <MenuItem value="medium">Medio</MenuItem>
                        <MenuItem value="low">Bajo</MenuItem>
                      </TextField>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Datos de Análisis (JSON)"
                    value={formData.analysisData}
                    onChange={(e) => handleInputChange('analysisData', e.target.value)}
                    helperText="Formato JSON con los datos para el análisis"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={isGenerating ? <CircularProgress size={20} /> : <PlayIcon />}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  fullWidth
                  size="large"
                >
                  {isGenerating ? 'Generando...' : 'Generar Contenido'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Resultado de la Generación
              </Typography>

              {!result && (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  minHeight={300}
                  color="text.secondary"
                >
                  <AIIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="body1">
                    Configura los parámetros y genera contenido con IA
                  </Typography>
                </Box>
              )}

              {result && (
                <Box>
                  <Alert 
                    severity={result.success ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                    icon={result.success ? <CheckIcon /> : <ErrorIcon />}
                  >
                    {result.success 
                      ? 'Contenido generado exitosamente' 
                      : 'Error en la generación'}
                  </Alert>

                  {result.success && (
                    <Box>
                      {/* Metadata */}
                      <Box sx={{ mb: 2 }}>
                        <Grid container spacing={1}>
                          <Grid item>
                            <Chip 
                              label={getTypeLabel(result.data.type)} 
                              color="primary" 
                              size="small"
                            />
                          </Grid>
                          <Grid item>
                            <Chip 
                              label={`${result.data.wordCount} palabras`} 
                              color="info" 
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item>
                            <Chip 
                              label={`${result.data.estimatedReadTime} min lectura`} 
                              color="secondary" 
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Content Preview */}
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {result.data.title}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Paper 
                            sx={{ 
                              p: 2, 
                              backgroundColor: 'grey.50',
                              maxHeight: 400,
                              overflow: 'auto',
                              whiteSpace: 'pre-wrap',
                              fontSize: '0.875rem',
                              lineHeight: 1.5
                            }}
                          >
                            {result.data.content}
                          </Paper>
                        </AccordionDetails>
                      </Accordion>

                      {/* Technical Details */}
                      <Accordion sx={{ mt: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle2">
                            Detalles Técnicos
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Request ID: {result.requestId}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Generado: {moment(result.generatedAt).format('DD/MM/YYYY HH:mm:ss')}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Cliente: {result.data.client}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Estado: {result.data.status}
                            </Typography>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  )}

                  {!result.success && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          Detalles del Error
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box component="pre" sx={{ 
                          fontSize: '0.75rem', 
                          backgroundColor: 'grey.100', 
                          p: 2, 
                          borderRadius: 1,
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(result.error, null, 2)}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* AI Model Info */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Información del Modelo
              </Typography>
              
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Google Gemini 2.5 Flash
                </Typography>
              </Box>

              <Typography variant="body2" color="textSecondary" paragraph>
                Modelo de IA multimodal de última generación optimizado para generación de texto, 
                análisis de documentos y procesamiento de datos complejos.
              </Typography>

              <Box>
                <Typography variant="body2" color="textSecondary">
                  • Máximo 8,192 tokens de salida
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Temperatura: 0.7 (balance creatividad/precisión)
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Especializado en auditorías forenses y consultorías
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AITest;