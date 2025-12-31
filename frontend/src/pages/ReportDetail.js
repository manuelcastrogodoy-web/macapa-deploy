import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';

// API function
const API_URL = process.env.REACT_APP_API_URL || 'https://manu-macapa-api-gmi6.onrender.com';

const fetchReport = async (id) => {
  const response = await axios.get(`${API_URL}/api/reports/${id}`);
  return response.data.data;
};

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: report, isLoading, error } = useQuery(
    ['report', id],
    () => fetchReport(id),
    {
      enabled: !!id,
    }
  );

  const handleBack = () => {
    navigate('/reports');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'forensic_audit': return 'Auditoría Forense';
      case 'consultancy': return 'Consultoría';
      case 'report': return 'Reporte';
      default: return type;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error al cargar el reporte: {error.message}
      </Alert>
    );
  }

  if (!report) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Reporte no encontrado
      </Alert>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
        >
          Dashboard
        </Link>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => { e.preventDefault(); navigate('/reports'); }}
        >
          Reportes
        </Link>
        <Typography color="text.primary">Detalle del Reporte</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Volver a Reportes
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {report.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Cliente: {report.client}
          </Typography>
        </Box>
        
        <Box display="flex" gap={1}>
          <IconButton color="primary">
            <ShareIcon />
          </IconButton>
          <IconButton color="primary">
            <PrintIcon />
          </IconButton>
          <IconButton color="primary">
            <EditIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Descargar
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Contenido del Reporte
              </Typography>
              
              <Paper 
                sx={{ 
                  p: 3, 
                  backgroundColor: 'grey.50',
                  minHeight: 400,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.6
                }}
              >
                {report.content}
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Report Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Información del Reporte
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Tipo
                </Typography>
                <Chip 
                  label={getTypeLabel(report.type)} 
                  color="primary" 
                  variant="outlined"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Estado
                </Typography>
                <Chip 
                  label={report.status === 'completed' ? 'Completado' : 
                        report.status === 'in_progress' ? 'En Progreso' : 'Pendiente'} 
                  color={getStatusColor(report.status)}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Prioridad
                </Typography>
                <Chip 
                  label={`Prioridad ${report.priority === 'high' ? 'Alta' : 
                         report.priority === 'medium' ? 'Media' : 'Baja'}`} 
                  color={getPriorityColor(report.priority)}
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Fecha de Creación
                </Typography>
                <Typography variant="body1">
                  {moment(report.createdAt).format('DD/MM/YYYY HH:mm')}
                </Typography>
              </Box>

              {report.completedAt && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Fecha de Completado
                  </Typography>
                  <Typography variant="body1">
                    {moment(report.completedAt).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                </Box>
              )}

              {report.wordCount && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Estadísticas
                  </Typography>
                  <Typography variant="body1">
                    {report.wordCount.toLocaleString()} palabras
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tiempo estimado de lectura: {report.estimatedReadTime} minutos
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          {report.metadata && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Metadatos
                </Typography>
                
                {report.metadata.lastModified && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Última Modificación
                    </Typography>
                    <Typography variant="body1">
                      {moment(report.metadata.lastModified).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </Box>
                )}

                {report.metadata.version && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Versión
                    </Typography>
                    <Typography variant="body1">
                      {report.metadata.version}
                    </Typography>
                  </Box>
                )}

                {report.metadata.generatedBy && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Generado por
                    </Typography>
                    <Typography variant="body1">
                      {report.metadata.generatedBy}
                    </Typography>
                  </Box>
                )}

                {report.metadata.aiModel && (
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Modelo de IA
                    </Typography>
                    <Chip 
                      label={report.metadata.aiModel} 
                      size="small" 
                      color="info"
                      variant="outlined"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportDetail;