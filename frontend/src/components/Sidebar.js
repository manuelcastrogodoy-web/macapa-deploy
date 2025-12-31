import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as ReportsIcon,
  Settings as SettingsIcon,
  Psychology as AIIcon,
  IntegrationInstructions as ZapierIcon,
  Analytics as AnalyticsIcon,
  CloudSync as ClickUpIcon,
} from '@mui/icons-material';

const drawerWidth = 240;
const collapsedWidth = 60;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    text: 'Reportes',
    icon: <ReportsIcon />,
    path: '/reports',
  },
  {
    text: 'Análisis IA',
    icon: <AIIcon />,
    path: '/ai-test',
  },
  {
    text: 'Zapier Config',
    icon: <ZapierIcon />,
    path: '/zapier',
  },
  {
    text: 'ClickUp',
    icon: <ClickUpIcon />,
    path: '/clickup',
  },
];

const Sidebar = ({ open, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const SidebarContent = () => (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      <List sx={{ pt: 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding>
              <Tooltip 
                title={!open ? item.text : ''} 
                placement="right"
                arrow
              >
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? 'primary.dark' 
                        : 'action.hover',
                    },
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? 'white' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      '& .MuiListItemText-primary': {
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 400,
                      }
                    }} 
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      
      <Divider sx={{ mx: 2 }} />
      
      {/* Additional sections */}
      <List>
        <ListItem disablePadding>
          <Tooltip 
            title={!open ? 'Configuración' : ''} 
            placement="right"
            arrow
          >
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: 1,
                mx: 1,
                my: 0.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Configuración" 
                sx={{ 
                  opacity: open ? 1 : 0,
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                  }
                }} 
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          mt: 8, // Account for navbar height
        },
      }}
    >
      <SidebarContent />
    </Drawer>
  );
};

export default Sidebar;