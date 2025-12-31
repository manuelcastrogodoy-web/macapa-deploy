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
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Api as ApiIcon,
  CheckCircle as CheckIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const Settings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
    },
    preferences: {
      language: 'es',
      timezone: 'America/Santiago',
      dateFormat: 'DD/MM/YYYY',
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleNotificationChange = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleSecurityChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simular guardado (en producción conectaría con el backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      enqueueSnackbar('Configuración guardada exitosamente', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al guardar configuración', { variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const systemInfo = [
    { label: 'Versión del Sistema', value: '1.0.0' },
    { label: 'Entorno', value: process.env.NODE_ENV || 'production' },
    { label: 'API URL', value: API_CONFIG.apiUrl },
    { label: 'Última actualización', value: new Date().toLocaleDateString('es-CL') },
  ];

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Configuración
      </Typography>

      <Grid container spacing={3}>
        {/* Notificaciones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Notificaciones
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={() => handleNotificationChange('email')}
                    color="primary"
                  />
                }
                label="Notificaciones por Email"
              />
              <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 6, mb: 2 }}>
                Recibe alertas de nuevos reportes y actualizaciones
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.push}
                    onChange={() => handleNotificationChange('push')}
                    color="primary"
                  />
                }
                label="Notificaciones Push"
              />
              <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 6, mb: 2 }}>
                Notificaciones en tiempo real en el navegador
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.sms}
                    onChange={() => handleNotificationChange('sms')}
                    color="primary"
                  />
                }
                label="Notificaciones SMS"
              />
              <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 6 }}>
                Alertas críticas por mensaje de texto
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Seguridad */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Seguridad
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.twoFactor}
                    onChange={() => handleSecurityChange('twoFactor', !settings.security.twoFactor)}
                    color="primary"
                  />
                }
                label="Autenticación de dos factores"
              />
              <Typography variant="caption" color="textSecondary" display="block" sx={{ ml: 6, mb: 3 }}>
                Añade una capa extra de seguridad a tu cuenta
              </Typography>

              <TextField
                label="Tiempo de sesión (minutos)"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                size="small"
                fullWidth
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                Tiempo de inactividad antes de cerrar sesión automáticamente
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Información del Sistema */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Información del Sistema
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <List dense>
                {systemInfo.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.label}
                      secondary={item.value}
                      primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                    />
                  </ListItem>
                ))}
              </List>

              <Box mt={2}>
                <Chip
                  icon={<CheckIcon />}
                  label="Sistema Operativo"
                  color="success"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  icon={<ApiIcon />}
                  label="API Conectada"
                  color="primary"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Preferencias */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Preferencias
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <TextField
                select
                label="Idioma"
                value={settings.preferences.language}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, language: e.target.value }
                }))}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </TextField>

              <TextField
                select
                label="Zona Horaria"
                value={settings.preferences.timezone}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, timezone: e.target.value }
                }))}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              >
                <option value="America/Santiago">Chile (Santiago)</option>
                <option value="America/Buenos_Aires">Argentina (Buenos Aires)</option>
                <option value="America/Lima">Perú (Lima)</option>
                <option value="America/Mexico_City">México (Ciudad de México)</option>
              </TextField>

              <TextField
                select
                label="Formato de Fecha"
                value={settings.preferences.dateFormat}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, dateFormat: e.target.value }
                }))}
                fullWidth
                size="small"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </TextField>
            </CardContent>
          </Card>
        </Grid>

        {/* Botón Guardar */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              disabled={isSaving}
              size="large"
            >
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
