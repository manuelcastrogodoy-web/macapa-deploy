import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';
import { API_CONFIG, ENDPOINTS } from '../config/api';

// API function
const fetchReports = async (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  const response = await axios.get(`${API_CONFIG.apiUrl}${ENDPOINTS.REPORTS}?${params.toString()}`);
  return response.data;
};

const Reports = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: '',
    client: '',
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading, error, refetch } = useQuery(
    ['reports', filters],
    () => fetchReports(filters),
    {
      keepPreviousData: true,
    }
  );

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      offset: 0, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (event, page) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * prev.limit,
    }));
  };

  const handleViewReport = (reportId) => {
    navigate(`/reports/${reportId}`);
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

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error al cargar los reportes: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Gestión de Reportes
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/reports/new')}
          >
            Nuevo Reporte
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Buscar cliente"
                value={filters.client}
                onChange={(e) => handleFilterChange('client', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Tipo"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="forensic_audit">Auditoría Forense</MenuItem>
                <MenuItem value="consultancy">Consultoría</MenuItem>
                <MenuItem value="report">Reporte</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Estado"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="completed">Completado</MenuItem>
                <MenuItem value="in_progress">En Progreso</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Prioridad"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="low">Baja</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Ordenar por"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="createdAt">Fecha de creación</MenuItem>
                <MenuItem value="title">Título</MenuItem>
                <MenuItem value="client">Cliente</MenuItem>
                <MenuItem value="priority">Prioridad</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={1}>
              <TextField
                fullWidth
                select
                label="Orden"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reports List */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {data?.data?.map((report) => (
              <Grid item xs={12} md={6} lg={4} key={report.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {report.title}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={() => handleViewReport(report.id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Box>

                    {/* Client */}
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Cliente: {report.client}
                    </Typography>

                    {/* Chips */}
                    <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                      <Chip 
                        label={getTypeLabel(report.type)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Chip 
                        label={report.status === 'completed' ? 'Completado' : 
                              report.status === 'in_progress' ? 'En Progreso' : 'Pendiente'} 
                        size="small" 
                        color={getStatusColor(report.status)}
                      />
                      <Chip 
                        label={`Prioridad ${report.priority === 'high' ? 'Alta' : 
                               report.priority === 'medium' ? 'Media' : 'Baja'}`} 
                        size="small" 
                        color={getPriorityColor(report.priority)}
                        variant="outlined"
                      />
                    </Box>

                    {/* Metadata */}
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Creado: {moment(report.createdAt).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                      {report.completedAt && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Completado: {moment(report.completedAt).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                      )}
                      {report.wordCount && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {report.wordCount.toLocaleString()} palabras • {report.estimatedReadTime} min lectura
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  {/* Actions */}
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewReport(report.id)}
                      >
                        Ver Detalles
                      </Button>
                      <IconButton 
                        size="small"
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {data?.pagination && (
            <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
              <Pagination
                count={Math.ceil(data.pagination.total / data.pagination.limit)}
                page={Math.floor(data.pagination.offset / data.pagination.limit) + 1}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}

          {/* Results Info */}
          {data?.pagination && (
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
              Mostrando {data.pagination.offset + 1} - {Math.min(data.pagination.offset + data.pagination.limit, data.pagination.total)} de {data.pagination.total} reportes
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default Reports;