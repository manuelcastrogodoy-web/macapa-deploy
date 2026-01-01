/**
 * MACAPA Keep-Alive Script for Render FREE Tier
 * Prevents service from sleeping after 15 minutes of inactivity
 * Optimized for minimal resource usage
 */

const https = require('https');
const http = require('http');

class MacapaKeepAlive {
  constructor(options = {}) {
    this.url = options.url || process.env.RENDER_EXTERNAL_URL || 'https://macapa-platform.onrender.com';
    this.interval = options.interval || 14 * 60 * 1000; // 14 minutes (before 15min sleep)
    this.endpoint = options.endpoint || '/health';
    this.enabled = process.env.ENABLE_KEEP_ALIVE === 'true' || process.env.NODE_ENV === 'production';
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 10000; // 10 seconds
    
    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      lastPing: null,
      lastSuccess: null,
      uptime: Date.now()
    };
    
    this.intervalId = null;
    
    if (this.enabled) {
      this.start();
    }
  }

  /**
   * Make HTTP request with timeout
   */
  makeRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'GET',
        timeout: timeout,
        headers: {
          'User-Agent': 'MACAPA-KeepAlive/1.0',
          'Accept': 'application/json',
          'Connection': 'close'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  /**
   * Ping the health endpoint
   */
  async ping() {
    const pingUrl = `${this.url}${this.endpoint}`;
    this.stats.totalPings++;
    this.stats.lastPing = new Date().toISOString();
    
    try {
      console.log(`🏓 Keep-alive ping #${this.stats.totalPings}: ${pingUrl}`);
      
      const response = await this.makeRequest(pingUrl, this.timeout);
      
      if (response.statusCode === 200) {
        this.stats.successfulPings++;
        this.stats.lastSuccess = new Date().toISOString();
        
        // Parse response if JSON
        let healthData = {};
        try {
          healthData = JSON.parse(response.body);
        } catch (e) {
          healthData = { status: 'unknown' };
        }
        
        console.log(`✅ Keep-alive successful - Status: ${healthData.status || 'OK'}`);
        
        // Log memory usage if available
        if (healthData.memory) {
          console.log(`📊 Memory: ${healthData.memory}MB used`);
        }
        
        return true;
      } else {
        throw new Error(`HTTP ${response.statusCode}`);
      }
    } catch (error) {
      this.stats.failedPings++;
      console.error(`❌ Keep-alive failed: ${error.message}`);
      
      // Try alternative endpoints on failure
      if (this.endpoint === '/health') {
        try {
          console.log('🔄 Trying alternative endpoint...');
          const altResponse = await this.makeRequest(`${this.url}/`, this.timeout);
          if (altResponse.statusCode === 200) {
            console.log('✅ Alternative endpoint successful');
            return true;
          }
        } catch (altError) {
          console.error(`❌ Alternative endpoint also failed: ${altError.message}`);
        }
      }
      
      return false;
    }
  }

  /**
   * Start keep-alive service
   */
  start() {
    if (this.intervalId) {
      console.log('⚠️ Keep-alive already running');
      return;
    }
    
    console.log(`🚀 Starting MACAPA Keep-Alive service`);
    console.log(`📍 Target URL: ${this.url}${this.endpoint}`);
    console.log(`⏰ Interval: ${this.interval / 1000 / 60} minutes`);
    console.log(`🔄 Max retries: ${this.maxRetries}`);
    
    // Initial ping
    setTimeout(() => {
      this.ping();
    }, 5000); // Wait 5 seconds after startup
    
    // Set up interval
    this.intervalId = setInterval(async () => {
      let success = false;
      let retries = 0;
      
      while (!success && retries < this.maxRetries) {
        success = await this.ping();
        
        if (!success) {
          retries++;
          if (retries < this.maxRetries) {
            console.log(`🔄 Retrying in 30 seconds... (${retries}/${this.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 30000));
          }
        }
      }
      
      if (!success) {
        console.error(`🚨 All ${this.maxRetries} keep-alive attempts failed!`);
      }
    }, this.interval);
    
    console.log('✅ Keep-alive service started successfully');
  }

  /**
   * Stop keep-alive service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Keep-alive service stopped');
    }
  }

  /**
   * Get keep-alive statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.uptime;
    const successRate = this.stats.totalPings > 0 
      ? ((this.stats.successfulPings / this.stats.totalPings) * 100).toFixed(1)
      : 0;
    
    return {
      ...this.stats,
      uptime: Math.floor(uptime / 1000), // seconds
      successRate: `${successRate}%`,
      nextPing: this.intervalId ? new Date(Date.now() + this.interval).toISOString() : null
    };
  }

  /**
   * Health check endpoint for keep-alive service itself
   */
  healthCheck() {
    const stats = this.getStats();
    const isHealthy = stats.successRate === '0%' ? 
      stats.totalPings === 0 : // Just started
      parseFloat(stats.successRate) > 50; // At least 50% success rate
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'MACAPA Keep-Alive',
      enabled: this.enabled,
      ...stats
    };
  }
}

// Create global instance
const keepAlive = new MacapaKeepAlive({
  url: process.env.RENDER_EXTERNAL_URL || 'https://macapa-platform.onrender.com',
  interval: parseInt(process.env.KEEP_ALIVE_INTERVAL) || 14 * 60 * 1000, // 14 minutes
  endpoint: process.env.KEEP_ALIVE_ENDPOINT || '/health',
  maxRetries: parseInt(process.env.KEEP_ALIVE_RETRIES) || 3,
  timeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 10000
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received, stopping keep-alive service...');
  keepAlive.stop();
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT received, stopping keep-alive service...');
  keepAlive.stop();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception in keep-alive:', error);
  // Don't stop keep-alive on errors
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled rejection in keep-alive:', reason);
  // Don't stop keep-alive on errors
});

// Export for use in main application
module.exports = {
  MacapaKeepAlive,
  keepAlive,
  
  // Express middleware to add keep-alive stats to health endpoint
  healthMiddleware: (req, res, next) => {
    if (req.path === '/health' || req.path === '/api/health') {
      const originalJson = res.json;
      res.json = function(data) {
        if (typeof data === 'object' && data !== null) {
          data.keepAlive = keepAlive.healthCheck();
        }
        return originalJson.call(this, data);
      };
    }
    next();
  },
  
  // Express route for keep-alive stats
  statsRoute: (req, res) => {
    res.json({
      service: 'MACAPA Keep-Alive Statistics',
      ...keepAlive.getStats(),
      configuration: {
        url: keepAlive.url,
        endpoint: keepAlive.endpoint,
        interval: `${keepAlive.interval / 1000 / 60} minutes`,
        enabled: keepAlive.enabled,
        maxRetries: keepAlive.maxRetries,
        timeout: `${keepAlive.timeout / 1000} seconds`
      }
    });
  }
};

// Auto-start message
if (keepAlive.enabled) {
  console.log('🎯 MACAPA Keep-Alive initialized for FREE tier optimization');
  console.log('💡 This prevents Render FREE tier from sleeping after 15 minutes');
  console.log('💰 Cost: $0 - No additional charges for keep-alive pings');
} else {
  console.log('⏸️ Keep-alive disabled (not in production or ENABLE_KEEP_ALIVE=false)');
}