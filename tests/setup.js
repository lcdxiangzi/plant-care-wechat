// Jest测试环境设置
process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.BAIDU_API_KEY = 'test_baidu_api_key';
process.env.BAIDU_SECRET_KEY = 'test_baidu_secret_key';

// 模拟console.log以减少测试输出噪音
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// 全局测试超时设置
jest.setTimeout(30000);