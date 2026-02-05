const axios = require('axios');

class LoadTester {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      errors: []
    };
  }

  async runTest(testConfig) {
    console.log(`🚀 开始负载测试: ${testConfig.name}`);
    console.log(`📊 并发数: ${testConfig.concurrent}, 总请求数: ${testConfig.totalRequests}`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < testConfig.concurrent; i++) {
      promises.push(this.runConcurrentRequests(testConfig));
    }
    
    await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    this.results.avgResponseTime = this.results.avgResponseTime / this.results.total;
    
    console.log('\n📈 测试结果:');
    console.log(`总请求数: ${this.results.total}`);
    console.log(`成功请求: ${this.results.success}`);
    console.log(`失败请求: ${this.results.failed}`);
    console.log(`成功率: ${((this.results.success / this.results.total) * 100).toFixed(2)}%`);
    console.log(`平均响应时间: ${this.results.avgResponseTime.toFixed(2)}ms`);
    console.log(`最大响应时间: ${this.results.maxResponseTime}ms`);
    console.log(`最小响应时间: ${this.results.minResponseTime}ms`);
    console.log(`总耗时: ${totalTime}ms`);
    console.log(`QPS: ${(this.results.total / (totalTime / 1000)).toFixed(2)}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ 错误统计:');
      const errorStats = {};
      this.results.errors.forEach(error => {
        errorStats[error] = (errorStats[error] || 0) + 1;
      });
      Object.entries(errorStats).forEach(([error, count]) => {
        console.log(`${error}: ${count}次`);
      });
    }
    
    return this.results;
  }

  async runConcurrentRequests(testConfig) {
    const requestsPerThread = Math.floor(testConfig.totalRequests / testConfig.concurrent);
    
    for (let i = 0; i < requestsPerThread; i++) {
      await this.makeRequest(testConfig);
      
      // 添加延迟避免过于密集的请求
      if (testConfig.delay) {
        await new Promise(resolve => setTimeout(resolve, testConfig.delay));
      }
    }
  }

  async makeRequest(testConfig) {
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: testConfig.method || 'GET',
        url: `${this.baseURL}${testConfig.endpoint}`,
        data: testConfig.data,
        headers: testConfig.headers,
        timeout: 30000
      });
      
      const responseTime = Date.now() - startTime;
      
      this.results.total++;
      this.results.success++;
      this.results.avgResponseTime += responseTime;
      this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);
      this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
      
      // 验证响应
      if (testConfig.validate && !testConfig.validate(response)) {
        throw new Error('Response validation failed');
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.results.total++;
      this.results.failed++;
      this.results.avgResponseTime += responseTime;
      this.results.errors.push(error.message);
    }
  }
}

// 测试配置
const testConfigs = [
  {
    name: '健康检查接口',
    endpoint: '/api/health',
    method: 'GET',
    concurrent: 10,
    totalRequests: 100,
    delay: 10,
    validate: (response) => response.data.status === 'ok'
  },
  {
    name: '用户登录接口',
    endpoint: '/api/user/wechat-login',
    method: 'POST',
    data: {
      openid: 'load_test_user',
      nickname: '负载测试用户',
      avatar: 'http://test-avatar.jpg'
    },
    concurrent: 5,
    totalRequests: 50,
    delay: 50,
    validate: (response) => response.data.code === 200 && response.data.data.token
  },
  {
    name: '植物列表接口',
    endpoint: '/api/plant/list',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test_token'
    },
    concurrent: 8,
    totalRequests: 80,
    delay: 20,
    validate: (response) => response.data.code === 200 || response.data.code === 401 // 401也是正常的（未认证）
  }
];

// 运行负载测试
async function runLoadTests() {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  console.log(`🎯 测试目标: ${baseURL}`);
  
  for (const config of testConfigs) {
    const tester = new LoadTester(baseURL);
    await tester.runTest(config);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ 所有负载测试完成');
}

// 如果直接运行此文件
if (require.main === module) {
  runLoadTests().catch(console.error);
}

module.exports = { LoadTester, testConfigs };