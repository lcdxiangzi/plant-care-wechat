const aiService = require('../../server/services/aiService');

describe('AI Service Tests', () => {
  // 模拟百度API响应
  const mockBaiduResponse = {
    result: [{
      name: '绿萝',
      score: 0.95,
      baike_info: {
        description: '绿萝是常见的室内观叶植物'
      }
    }]
  };

  beforeEach(() => {
    // 重置环境变量
    process.env.BAIDU_API_KEY = 'test_api_key';
    process.env.BAIDU_SECRET_KEY = 'test_secret_key';
  });

  describe('植物识别功能', () => {
    test('应该成功识别植物', async () => {
      // Mock axios请求
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { access_token: 'mock_token', expires_in: 3600 }
      });
      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: Buffer.from('mock_image_data')
      });
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockBaiduResponse
      });

      const result = await aiService.identifyPlant('http://example.com/plant.jpg');
      
      expect(result.success).toBe(true);
      expect(result.data.plantType).toBe('绿萝');
      expect(result.data.confidence).toBe(0.95);
    });

    test('应该处理识别失败的情况', async () => {
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('API Error'));

      const result = await aiService.identifyPlant('invalid_image');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('植物识别服务异常');
    });
  });

  describe('AI咨询功能', () => {
    test('应该成功回答用户问题', async () => {
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { access_token: 'mock_token' }
      });
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { result: '建议每3-4天浇水一次，保持土壤湿润但不积水。' }
      });

      const result = await aiService.consultQuestion('绿萝多久浇水一次？');
      
      expect(result.success).toBe(true);
      expect(result.data.response).toContain('浇水');
    });

    test('应该处理咨询失败的情况', async () => {
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Network Error'));

      const result = await aiService.consultQuestion('测试问题');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('AI咨询服务暂时不可用');
    });
  });

  describe('获取访问令牌', () => {
    test('应该成功获取百度访问令牌', async () => {
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { access_token: 'test_token', expires_in: 3600 }
      });

      const token = await aiService.getBaiduAccessToken();
      
      expect(token).toBe('test_token');
    });

    test('应该缓存访问令牌', async () => {
      const axios = require('axios');
      const mockPost = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { access_token: 'cached_token', expires_in: 3600 }
      });

      // 第一次调用
      await aiService.getBaiduAccessToken();
      // 第二次调用应该使用缓存
      await aiService.getBaiduAccessToken();

      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });
});

// 清理模拟
afterEach(() => {
  jest.restoreAllMocks();
});