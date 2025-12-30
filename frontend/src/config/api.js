// API Configuration for different environments
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://manu-macapa-api.onrender.com',
  }
};

const environment = process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development';

export const API_CONFIG = config[environment];

// API endpoints
export const ENDPOINTS = {
  // Health
  HEALTH: '/health',
  
  // Reports
  REPORTS: '/api/reports',
  REPORTS_STATS: '/api/reports/stats/dashboard',
  
  // Webhooks
  WEBHOOK_TEST: '/api/webhooks/zapier/test',
  WEBHOOK_MAIN: '/api/webhooks/zapier/agent-activity',
  WEBHOOK_VALIDATE: '/api/webhooks/zapier/validate',
  
  // AI
  AI_TEST: '/api/ai/test',
  AI_GENERATE: '/api/ai/generate',
  AI_MODELS: '/api/ai/models',
  AI_ANALYZE: '/api/ai/analyze',
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.apiUrl}${endpoint}`;
};

export default API_CONFIG;