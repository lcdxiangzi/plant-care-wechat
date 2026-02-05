const db = require('./database');
const aiService = require('../services/aiService');

class HealthChecker {
  constructor() {
    this.checks = {
      database: this.checkDatabase.bind(this),
      aiService: this.checkAIService.bind(this),
      memory: this.checkMemory.bind(this),
      diskSpace: this.checkDiskSpace.bind(this)
    };
  }

  async runAllChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    for (const [name, checkFn] of Object.entries(this.checks)) {
      try {
        const checkResult = await checkFn();
        results.checks[name] = {
          status: checkResult.healthy ? 'pass' : 'fail',
          message: checkResult.message,
          details: checkResult.details,
          responseTime: checkResult.responseTime
        };
        
        results.summary.total++;
        if (checkResult.healthy) {
          results.summary.passed++;
        } else {
          results.summary.failed++;
          results.status = 'unhealthy';
        }
      } catch (error) {
        results.checks[name] = {
          status: 'error',
          message: error.message,
          responseTime: 0
        };
        results.summary.total++;
        results.summary.failed++;
        results.status = 'unhealthy';
      }
    }

    return results;
  }

  async checkDatabase() {
    const startTime = Date.now();
    
    try {
      // 简单的数据库连接测试
      await db.query('SELECT 1 as test');
      
      return {
        healthy: true,
        message: '数据库连接正常',
        details: {
          type: process.env.USE_MEMORY_DB === 'true' ? 'memory' : 'mysql',
          connectionPool: 'active'
        },
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: '数据库连接失败',
        details: { error: error.message },
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkAIService() {
    const startTime = Date.now();
    
    try {
      // 检查百度AI服务配置
      if (!process.env.BAIDU_API_KEY || !process.env.BAIDU_SECRET_KEY) {
        return {
          healthy: false,
          message: 'AI服务配置缺失',
          details: { 
            apiKey: !!process.env.BAIDU_API_KEY,
            secretKey: !!process.env.BAIDU_SECRET_KEY
          },
          responseTime: Date.now() - startTime
        };
      }

      // 尝试获取访问令牌
      await aiService.getBaiduAccessToken();
      
      return {
        healthy: true,
        message: 'AI服务连接正常',
        details: {
          provider: 'baidu',
          services: ['plant_identification', 'text_generation']
        },
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: 'AI服务连接失败',
        details: { error: error.message },
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkMemory() {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMB = Math.round(memUsage.rss / 1024 / 1024);
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      // 内存使用超过500MB时警告
      const isHealthy = totalMB < 500;
      
      return {
        healthy: isHealthy,
        message: isHealthy ? '内存使用正常' : '内存使用过高',
        details: {
          rss: `${totalMB}MB`,
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        },
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: '内存检查失败',
        details: { error: error.message },
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkDiskSpace() {
    const startTime = Date.now();
    
    try {
      // 在serverless环境中，磁盘空间检查可能不适用
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
        return {
          healthy: true,
          message: 'Serverless环境，无需检查磁盘空间',
          details: { environment: 'serverless' },
          responseTime: Date.now() - startTime
        };
      }

      // 简单的磁盘空间检查（仅在本地环境）
      const fs = require('fs');
      const stats = fs.statSync('.');
      
      return {
        healthy: true,
        message: '磁盘空间检查完成',
        details: {
          available: 'unknown',
          note: '详细磁盘信息需要额外依赖'
        },
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        message: '磁盘空间检查失败',
        details: { error: error.message },
        responseTime: Date.now() - startTime
      };
    }
  }

  // 快速健康检查（仅检查关键服务）
  async quickCheck() {
    const startTime = Date.now();
    
    try {
      // 检查数据库
      await db.query('SELECT 1');
      
      // 检查AI服务配置
      const hasAIConfig = !!(process.env.BAIDU_API_KEY && process.env.BAIDU_SECRET_KEY);
      
      return {
        status: 'healthy',
        message: '系统运行正常',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        services: {
          database: 'ok',
          aiService: hasAIConfig ? 'ok' : 'config_missing'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: '系统异常',
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }
}

module.exports = new HealthChecker();