import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  AutoAwesome as AIIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://manu-macapa-api-gmi6.onrender.com';

const steps = ['Información Básica', 'Detalles del Proyecto', 'Generación con IA', 'Revisión y Guardar'];

const NewReport = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    type: '',
    priority: 'media',
    description: '',
    projectDetails: '',
    analysisData: '',
    generatedContent: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const generateWithAI = async () => {
    setAiLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/api/ai/generate`, {
        contentType: formData.type || 'reporte',
        client: formData.client,
        project: formData.title,
        description: formData.description,
        priority: formData.priority,
        analysisData: formData.analysisData || formData.projectDetails
      });
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          generatedContent: response.data.content
        }));
        setSuccess('Contenido generado exitosamente con IA');
      }
    } catch (err) {
      setError('Error al generar contenido con IA: ' + (err.response?.data?.error || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const reportData = {
        title: formData.title,
        client: formData.client,
        type: formData.type,
        priority: formData.priority,
        description: formData.description,
        content: formData.generatedContent || formData.projectDetails,
        status: 'pendiente',
        createdAt: new Date().toISOString()
      };
      
      const response = await axios.post(`${API_URL}/api/reports`, reportData);
      
      if (response.data.success) {
        setSuccess('Reporte creado exitosamente');
        setTimeout(() => navigate('/reports'), 1500);
      }
    } catch (err) {
      setError('Error al crear el reporte: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título del Reporte"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ej: Auditoría de Seguridad - Sistema Cloud"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cliente"
                name="client"
                value={formData.client}
                onChange={handleChange}
                required
                placeholder="Nombre del cliente"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Reporte</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  label="Tipo de Reporte"
                >
                  <MenuItem value="auditoria">Auditoría Forense</MenuItem>
                  <MenuItem value="consultoria">Consultoría</MenuItem>
                  <MenuItem value="reporte">Reporte General</MenuItem>
                  <MenuItem value="analisis">Análisis de Datos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Prioridad"
                >
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="baja">Baja</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descripción del Proyecto"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe el objetivo y alcance del proyecto..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Detalles del Proyecto / Hallazgos"
                name="projectDetails"
                value={formData.projectDetails}
                onChange={handleChange}
                placeholder="Incluye detalles técnicos, hallazgos preliminares, datos relevantes..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Datos de Análisis (JSON opcional)"
                name="analysisData"
                value={formData.analysisData}
                onChange={handleChange}
                placeholder='{"metricas": {...}, "hallazgos": [...], "recomendaciones": [...]}'
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'primary.light', color: 'white', mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <AIIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Generación con Inteligencia Artificial
                  </Typography>
                  <Typography variant="body2">
                    Utiliza Google Gemini 2.5 Flash para generar contenido profesional 
                    basado en la información proporcionada.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={generateWithAI}
                disabled={aiLoading || !formData.title || !formData.client}
                startIcon={aiLoading ? <CircularProgress size={20} color="inherit" /> : <AIIcon />}
                fullWidth
                sx={{ py: 2 }}
              >
                {aiLoading ? 'Generando contenido...' : 'Generar Contenido con IA'}
              </Button>
            </Grid>
            {formData.generatedContent && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Contenido Generado:
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    name="generatedContent"
                    value={formData.generatedContent}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Paper>
              </Grid>
            )}
          </Grid>
        );
      
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Resumen del Reporte</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Título</Typography>
              <Typography variant="body1" gutterBottom>{formData.title || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Cliente</Typography>
              <Typography variant="body1" gutterBottom>{formData.client || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Tipo</Typography>
              <Chip 
                label={formData.type || 'No especificado'} 
                color="primary" 
                size="small" 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Prioridad</Typography>
              <Chip 
                label={formData.priority} 
                color={formData.priority === 'alta' ? 'error' : formData.priority === 'media' ? 'warning' : 'success'}
                size="small" 
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">Descripción</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {formData.description || '-'}
              </Typography>
            </Grid>
            {formData.generatedContent && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Contenido Generado</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {formData.generatedContent}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/reports')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          Nuevo Reporte
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Anterior
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !formData.title || !formData.client}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {loading ? 'Guardando...' : 'Guardar Reporte'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
            >
              Siguiente
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default NewReport;
