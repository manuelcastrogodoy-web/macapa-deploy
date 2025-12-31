import React from 'react';
import { useQuery } from 'react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  Security,
  Speed,
  Visibility,
  MoreVert,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import axios from 'axios';
import { API_CONFIG, ENDPOINTS } from '../config/api';

// API functions
const fetchDashboardStats = async () => {
  const response = await axios.get(`${API_CONFIG.apiUrl}${ENDPOINTS.REPORTS_STATS}`);
  return response.data.data;
};

// Color schemes
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const STATUS_COLORS = {
  completed: '#4caf50',
  in_progress: '#ff9800',
  pending: '#f44336',
};

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery(
    'dashboardStats',
    fetchDashboardStats,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

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
        Error al cargar las estadísticas del dashboard: {error.message}
      </Alert>
    );
  }

  // Prepare chart data
  const statusData = Object.entries(stats.byStatus).map(([key, value]) => ({
    name: key === 'completed' ? 'Completados' : 
          key === 'in_progress' ? 'En Progreso' : 'Pendientes',
    value,
    color: STATUS_COLORS[key],
  }));

  const typeData = Object.entries(stats.byType).map(([key, value]) => ({
    name: key === 'forensic_audit' ? 'Auditorías' : 
          key === 'consultancy' ? 'Consultorías' : 'Reportes',
    value,
  }));

  const priorityData = Object.entries(stats.byPriority).map(([key, value]) => ({
    name: key === 'high' ? 'Alta' : key === 'medium' ? 'Media' : 'Baja',
    value,
  }));

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard de Reportes
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Reportes
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stats.totalReports}
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Tasa de Completado
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stats.productivity.completionRate}%
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Promedio Palabras
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stats.productivity.averageWordCount.toLocaleString()}
                  </Typography>
                </Box>
                <Speed sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Tiempo Lectura Prom.
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stats.productivity.averageReadTime} min
                  </Typography>
                </Box>
                <Security sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Status Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Estado de Reportes
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Type Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Tipos de Reportes
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Distribución por Prioridad
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#dc004e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Actividad Reciente
              </Typography>
              <List>
                {stats.recentActivity.map((activity, index) => (
                  <ListItem 
                    key={activity.id}
                    divider={index < stats.recentActivity.length - 1}
                    secondaryAction={
                      <IconButton edge="end">
                        <Visibility />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <Assignment color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Cliente: {activity.client}
                          </Typography>
                          <Box display="flex" gap={1} mt={1}>
                            <Chip 
                              label={activity.type === 'forensic_audit' ? 'Auditoría' : 
                                    activity.type === 'consultancy' ? 'Consultoría' : 'Reporte'} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                            <Chip 
                              label={activity.status === 'completed' ? 'Completado' : 
                                    activity.status === 'in_progress' ? 'En Progreso' : 'Pendiente'} 
                              size="small" 
                              color={activity.status === 'completed' ? 'success' : 
                                    activity.status === 'in_progress' ? 'warning' : 'error'}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Métricas de Productividad
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Promedio de palabras por reporte
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {stats.productivity.averageWordCount.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Tiempo promedio de lectura
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {stats.productivity.averageReadTime} min
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    Tasa de completado
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {stats.productivity.completionRate}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;