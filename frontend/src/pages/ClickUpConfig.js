import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  List as ListIcon,
  Webhook as WebhookIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PlayArrow as TestIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://manu-macapa-api-gmi6.onrender.com';

const ClickUpConfig = () => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [folders, setFolders] = useState([]);
  const [lists, setLists] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  
  const [config, setConfig] = useState({
    selectedWorkspace: '',
    selectedSpace: '',
    selectedFolder: '',
    selectedList: ''
  });

  // Test ClickUp connection
  const testConnection = async () => {
    setTestLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.get(`${API_URL}/api/clickup/test`);
      if (response.data.success) {
        setConnectionStatus({
          connected: true,
          user: response.data.user
        });
        setSuccess('Conexión exitosa con ClickUp');
        fetchWorkspaces();
      } else {
        setConnectionStatus({ connected: false, error: response.data.error });
        setError(response.data.message || 'Error de conexión');
      }
    } catch (err) {
      setConnectionStatus({ connected: false, error: err.message });
      setError('Error al conectar con ClickUp: ' + (err.response?.data?.error || err.message));
    } finally {
      setTestLoading(false);
    }
  };

  // Fetch workspaces
  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clickup/workspaces`);
      if (response.data.success) {
        setWorkspaces(response.data.workspaces);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  // Fetch spaces for selected workspace
  const fetchSpaces = async (teamId) => {
    try {
      const response = await axios.get(`${API_URL}/api/clickup/workspaces/${teamId}/spaces`);
      if (response.data.success) {
        setSpaces(response.data.spaces);
      }
    } catch (err) {
      console.error('Error fetching spaces:', err);
    }
  };

  // Fetch folders for selected space
  const fetchFolders = async (spaceId) => {
    try {
      const response = await axios.get(`${API_URL}/api/clickup/spaces/${spaceId}/folders`);
      if (response.data.success) {
        setFolders(response.data.folders);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  // Fetch lists for selected folder
  const fetchLists = async (folderId) => {
    try {
      const response = await axios.get(`${API_URL}/api/clickup/folders/${folderId}/lists`);
      if (response.data.success) {
        setLists(response.data.lists);
      }
    } catch (err) {
      console.error('Error fetching lists:', err);
    }
  };

  // Fetch webhooks
  const fetchWebhooks = async () => {
    if (!config.selectedWorkspace) return;
    try {
      const response = await axios.get(`${API_URL}/api/clickup/webhooks?teamId=${config.selectedWorkspace}`);
      if (response.data.success) {
        setWebhooks(response.data.webhooks || []);
      }
    } catch (err) {
      console.error('Error fetching webhooks:', err);
    }
  };

  // Create webhook
  const createWebhook = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/clickup/webhooks/create`, {
        teamId: config.selectedWorkspace
      });
      if (response.data.success) {
        setSuccess('Webhook creado exitosamente');
        fetchWebhooks();
      }
    } catch (err) {
      setError('Error al crear webhook: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete webhook
  const deleteWebhook = async (webhookId) => {
    try {
      await axios.delete(`${API_URL}/api/clickup/webhooks/${webhookId}`);
      setSuccess('Webhook eliminado');
      fetchWebhooks();
    } catch (err) {
      setError('Error al eliminar webhook');
    }
  };

  // Handle workspace selection
  const handleWorkspaceChange = (e) => {
    const teamId = e.target.value;
    setConfig(prev => ({ ...prev, selectedWorkspace: teamId, selectedSpace: '', selectedFolder: '', selectedList: '' }));
    setSpaces([]);
    setFolders([]);
    setLists([]);
    if (teamId) {
      fetchSpaces(teamId);
    }
  };

  // Handle space selection
  const handleSpaceChange = (e) => {
    const spaceId = e.target.value;
    setConfig(prev => ({ ...prev, selectedSpace: spaceId, selectedFolder: '', selectedList: '' }));
    setFolders([]);
    setLists([]);
    if (spaceId) {
      fetchFolders(spaceId);
    }
  };

  // Handle folder selection
  const handleFolderChange = (e) => {
    const folderId = e.target.value;
    setConfig(prev => ({ ...prev, selectedFolder: folderId, selectedList: '' }));
    setLists([]);
    if (folderId) {
      fetchLists(folderId);
    }
  };

  // Handle list selection
  const handleListChange = (e) => {
    setConfig(prev => ({ ...prev, selectedList: e.target.value }));
  };

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    if (config.selectedWorkspace) {
      fetchWebhooks();
    }
  }, [config.selectedWorkspace]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        Configuración de ClickUp
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Conecta MACAPA con ClickUp para sincronizar proyectos, tareas y reportes automáticamente.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Connection Status Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Estado de Conexión</Typography>
              <Divider sx={{ mb: 2 }} />
              
              {connectionStatus === null ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography>Verificando conexión...</Typography>
                </Box>
              ) : connectionStatus.connected ? (
                <Box>
                  <Chip 
                    icon={<CheckIcon />} 
                    label="Conectado" 
                    color="success" 
                    sx={{ mb: 2 }}
                  />
                  {connectionStatus.user && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Usuario:</Typography>
                      <Typography variant="body1">{connectionStatus.user.username}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Email:</Typography>
                      <Typography variant="body1">{connectionStatus.user.email}</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  <Chip 
                    icon={<ErrorIcon />} 
                    label="No Conectado" 
                    color="error" 
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="error">
                    {connectionStatus.error || 'Configure el token de API en las variables de entorno del backend'}
                  </Typography>
                </Box>
              )}

              <Button
                variant="outlined"
                startIcon={testLoading ? <CircularProgress size={16} /> : <SyncIcon />}
                onClick={testConnection}
                disabled={testLoading}
                fullWidth
                sx={{ mt: 2 }}
              >
                {testLoading ? 'Verificando...' : 'Probar Conexión'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Workspace Selection Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Configuración de Workspace</Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!connectionStatus?.connected}>
                    <InputLabel>Workspace</InputLabel>
                    <Select
                      value={config.selectedWorkspace}
                      onChange={handleWorkspaceChange}
                      label="Workspace"
                    >
                      {workspaces.map(ws => (
                        <MenuItem key={ws.id} value={ws.id}>{ws.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!config.selectedWorkspace}>
                    <InputLabel>Space</InputLabel>
                    <Select
                      value={config.selectedSpace}
                      onChange={handleSpaceChange}
                      label="Space"
                    >
                      {spaces.map(space => (
                        <MenuItem key={space.id} value={space.id}>{space.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!config.selectedSpace}>
                    <InputLabel>Folder</InputLabel>
                    <Select
                      value={config.selectedFolder}
                      onChange={handleFolderChange}
                      label="Folder"
                    >
                      {folders.map(folder => (
                        <MenuItem key={folder.id} value={folder.id}>{folder.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!config.selectedFolder}>
                    <InputLabel>Lista para Sincronización</InputLabel>
                    <Select
                      value={config.selectedList}
                      onChange={handleListChange}
                      label="Lista para Sincronización"
                    >
                      {lists.map(list => (
                        <MenuItem key={list.id} value={list.id}>{list.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {config.selectedList && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Los reportes de MACAPA se sincronizarán con la lista seleccionada en ClickUp.
                  <br />
                  <strong>List ID:</strong> {config.selectedList}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Webhooks Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <WebhookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Webhooks de ClickUp
                </Typography>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                  onClick={createWebhook}
                  disabled={loading || !config.selectedWorkspace}
                >
                  Crear Webhook
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {webhooks.length === 0 ? (
                <Typography color="textSecondary">
                  No hay webhooks configurados. Crea uno para recibir eventos de ClickUp en MACAPA.
                </Typography>
              ) : (
                <List>
                  {webhooks.map(webhook => (
                    <ListItem
                      key={webhook.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => deleteWebhook(webhook.id)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <WebhookIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={webhook.endpoint}
                        secondary={`ID: ${webhook.id} | Eventos: ${webhook.events?.join(', ') || 'Todos'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Info */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Información de Integración</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Endpoint de Webhook MACAPA
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <code>{API_URL}/api/clickup/webhook</code>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Eventos Soportados
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="taskCreated" size="small" />
                    <Chip label="taskUpdated" size="small" />
                    <Chip label="taskDeleted" size="small" />
                    <Chip label="taskStatusUpdated" size="small" />
                    <Chip label="taskCommentPosted" size="small" />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Funcionalidades de Integración
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText primary="Sincronización bidireccional de tareas/reportes" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText primary="Creación automática de tareas en ClickUp desde MACAPA" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText primary="Actualización de estado de reportes cuando cambia en ClickUp" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText primary="Integración con Function Alpha/Omega del Orquestador" />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClickUpConfig;
