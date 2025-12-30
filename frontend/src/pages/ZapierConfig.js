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
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Link as LinkIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const ZapierConfig = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Configuración del webhook
  const baseWebhookUrl = `${window.location.origin}/api/webhooks/zapier/agent-activity`;
  const testWebhookUrl = `${window.location.origin}/api/webhooks/zapier/test`;

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    enqueueSnackbar('URL copiada al portapapeles', { variant: 'success' });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await axios.get('/api/webhooks/zapier/test');
      setTestResult({
        success: true,
        data: response.data,
      });
      enqueueSnackbar('Conexión exitosa', { variant: 'success' });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data || error.message,
      });
      enqueueSnackbar('Error en la conexión', { variant: 'error' });
    } finally {
      setIsTestingConnection(false);
      setTestDialogOpen(true);
    }
  };

  const handleTestWebhook = async () => {
    const testPayload = {
      recordId: "test-record-123",
      type: "audit",
      clientName: "Cliente de Prueba",
      projectName: "Proyecto de Prueba Zapier",
      description: "Esta es una prueba de integración con Zapier",
      priority: "medium",
      auditType: "digital",
      riskLevel: "medium",
      analysisData: {
        testField: "Datos de prueba",
        timestamp: new Date().toISOString()
      },
      evidenceFiles: ["test-file-1.pdf", "test-file-2.xlsx"],
      complianceFramework: "ISO 27001"
    };

    setIsTestingConnection(true);
    try {
      const response = await axios.post('/api/webhooks/zapier/agent-activity', testPayload);
      setTestResult({
        success: true,
        data: response.data,
        payload: testPayload,
      });
      enqueueSnackbar('Webhook probado exitosamente', { variant: 'success' });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data || error.message,
        payload: testPayload,
      });
      enqueueSnackbar('Error al probar webhook', { variant: 'error' });
    } finally {
      setIsTestingConnection(false);
      setTestDialogOpen(true);
    }
  };

  // Datos de ejemplo para el flujo de Zapier
  const zapFlowSteps = [
    {
      step: 1,
      name: "Zapier Tables - New or Updated Record",
      description: "Trigger cuando se crea o actualiza un registro en la tabla de auditorías",
      status: "configured"
    },
    {
      step: 2,
      name: "Manus - Create Task",
      description: "Crea una tarea en Manus con los datos del registro",
      status: "configured"
    },
    {
      step: 3,
      name: "Webhooks by Zapier - POST",
      description: "Envía datos a MACAPA para procesamiento con IA",
      url: baseWebhookUrl,
      status: "active"
    },
    {
      step: 4,
      name: "Google Docs - Create Document",
      description: "Genera documento con los resultados procesados",
      status: "configured"
    },
    {
      step: 5,
      name: "Paths - Split into 3 paths",
      description: "Divide el flujo según el tipo de contenido",
      paths: ["Auditorías Complejas", "Duplicados", "General"],
      status: "configured"
    }
  ];

  const payloadExample = {
    recordId: "string",
    type: "audit|consultancy|report",
    clientName: "string",
    projectName: "string", 
    description: "string",
    priority: "high|medium|low",
    analysisData: {},
    timestamp: "ISO8601",
    auditType: "financial|digital|compliance|security",
    evidenceFiles: ["array", "of", "strings"],
    complianceFramework: "string",
    riskLevel: "critical|high|medium|low"
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Configuración de Zapier
      </Typography>

      {/* Connection Status */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Configura la integración con Zapier para automatizar la generación de auditorías forenses y reportes.
        </Typography>
      </Alert>

      {/* Webhook Configuration */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Configuración del Webhook
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  URL del Webhook Principal
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    value={baseWebhookUrl}
                    InputProps={{
                      readOnly: true,
                    }}
                    size="small"
                  />
                  <IconButton onClick={() => handleCopyUrl(baseWebhookUrl)}>
                    <CopyIcon />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Usa esta URL en el paso "Webhooks by Zapier - POST" de tu Zap
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  URL de Prueba
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    value={testWebhookUrl}
                    InputProps={{
                      readOnly: true,
                    }}
                    size="small"
                  />
                  <IconButton onClick={() => handleCopyUrl(testWebhookUrl)}>
                    <CopyIcon />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Endpoint para verificar conectividad
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  Probar Conexión
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={handleTestWebhook}
                  disabled={isTestingConnection}
                >
                  Probar Webhook Completo
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Zap Flow Visualization */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Flujo del Zap (ID: 339995837)
              </Typography>
              
              <List>
                {zapFlowSteps.map((step, index) => (
                  <ListItem key={index} divider={index < zapFlowSteps.length - 1}>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: step.status === 'active' ? 'primary.main' : 'grey.300',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                        }}
                      >
                        {step.step}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={step.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {step.description}
                          </Typography>
                          {step.url && (
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', mt: 1, display: 'block' }}>
                              URL: {step.url}
                            </Typography>
                          )}
                          {step.paths && (
                            <Box sx={{ mt: 1 }}>
                              {step.paths.map((path, idx) => (
                                <Chip key={idx} label={path} size="small" sx={{ mr: 1, mb: 0.5 }} />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <Chip 
                      label={step.status} 
                      size="small" 
                      color={step.status === 'active' ? 'primary' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Payload Structure */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Estructura del Payload
              </Typography>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Campos Requeridos</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="pre" sx={{ 
                    fontSize: '0.75rem', 
                    backgroundColor: 'grey.100', 
                    p: 2, 
                    borderRadius: 1,
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(payloadExample, null, 2)}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tipos Soportados
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Chip label="audit - Auditorías Forenses" size="small" color="primary" />
                  <Chip label="consultancy - Consultorías" size="small" color="secondary" />
                  <Chip label="report - Reportes Generales" size="small" color="info" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Estado de Integración
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Endpoint Webhook"
                    secondary="Activo y funcionando"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Gemini AI"
                    secondary="Conectado y operativo"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Zapier Zap"
                    secondary="Pendiente de configuración"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Results Dialog */}
      <Dialog 
        open={testDialogOpen} 
        onClose={() => setTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Resultado de la Prueba
          {testResult?.success ? (
            <CheckIcon color="success" sx={{ ml: 1 }} />
          ) : (
            <ErrorIcon color="error" sx={{ ml: 1 }} />
          )}
        </DialogTitle>
        <DialogContent>
          {testResult && (
            <Box>
              <Alert 
                severity={testResult.success ? 'success' : 'error'} 
                sx={{ mb: 2 }}
              >
                {testResult.success 
                  ? 'La prueba se ejecutó correctamente' 
                  : 'La prueba falló'}
              </Alert>
              
              {testResult.payload && (
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Payload Enviado</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box component="pre" sx={{ 
                      fontSize: '0.75rem', 
                      backgroundColor: 'grey.100', 
                      p: 2, 
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 200
                    }}>
                      {JSON.stringify(testResult.payload, null, 2)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    {testResult.success ? 'Respuesta del Servidor' : 'Error Details'}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="pre" sx={{ 
                    fontSize: '0.75rem', 
                    backgroundColor: 'grey.100', 
                    p: 2, 
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 300
                  }}>
                    {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ZapierConfig;