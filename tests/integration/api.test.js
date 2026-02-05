const request = require('supertest');
const app = require('../../server/index');

describe('API Integration Tests', () => {
  let authToken;
  let testPlantId;

  beforeAll(async () => {
    // 设置测试环境
    process.env.NODE_ENV = 'test';
    process.env.USE_MEMORY_DB = 'true';
    process.env.JWT_SECRET = 'test_jwt_secret';
  });

  describe('健康检查', () => {
    test('GET /api/health 应该返回200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('用户认证', () => {
    test('POST /api/user/wechat-login 应该成功登录', async () => {
      const loginData = {
        openid: 'test_openid_123',
        nickname: '测试用户',
        avatar: 'http://test-avatar.jpg'
      };

      const response = await request(app)
        .post('/api/user/wechat-login')
        .send(loginData)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.userInfo.openid).toBe(loginData.openid);

      // 保存token用于后续测试
      authToken = response.body.data.token;
    });

    test('POST /api/user/wechat-login 缺少openid应该返回400', async () => {
      const response = await request(app)
        .post('/api/user/wechat-login')
        .send({ nickname: '测试用户' })
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('openid');
    });

    test('GET /api/user/profile 应该返回用户信息', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.openid).toBe('test_openid_123');
    });

    test('GET /api/user/profile 无token应该返回401', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .expect(401);

      expect(response.body.code).toBe(401);
    });
  });

  describe('植物管理', () => {
    test('POST /api/plant/add 应该成功添加植物', async () => {
      const plantData = {
        plantName: '测试绿萝',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        location: '客厅',
        getMethod: '购买',
        getDate: '2024-01-01',
        description: '测试植物描述'
      };

      const response = await request(app)
        .post('/api/plant/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(plantData)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.plantId).toBeDefined();
      expect(response.body.data.plantInfo.PLANT_NAME).toBe(plantData.plantName);

      // 保存植物ID用于后续测试
      testPlantId = response.body.data.plantId;
    });

    test('POST /api/plant/add 缺少必需字段应该返回400', async () => {
      const response = await request(app)
        .post('/api/plant/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plantName: '测试植物' }) // 缺少image
        .expect(400);

      expect(response.body.code).toBe(400);
    });

    test('GET /api/plant/list 应该返回植物列表', async () => {
      const response = await request(app)
        .get('/api/plant/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.plants).toBeDefined();
      expect(response.body.data.total).toBeGreaterThan(0);
    });

    test('GET /api/plant/:plantId 应该返回植物详情', async () => {
      const response = await request(app)
        .get(`/api/plant/${testPlantId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.plantInfo.PLANT_ID).toBe(testPlantId);
    });
  });

  describe('养护记录', () => {
    test('POST /api/care/add 应该成功添加养护记录', async () => {
      const careData = {
        plantId: testPlantId,
        careType: 'WATER',
        careNote: '今天给植物浇水了',
        weather: '晴天',
        plantStatus: '健康'
      };

      const response = await request(app)
        .post('/api/care/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(careData)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.recordId).toBeDefined();
    });

    test('GET /api/care/list 应该返回养护记录', async () => {
      const response = await request(app)
        .get('/api/care/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.records).toBeDefined();
    });

    test('GET /api/care/statistics/summary 应该返回统计信息', async () => {
      const response = await request(app)
        .get('/api/care/statistics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.totalCareCount).toBeDefined();
      expect(response.body.data.careTypeDistribution).toBeDefined();
    });
  });

  describe('AI服务', () => {
    test('POST /api/ai/identify 应该处理植物识别请求', async () => {
      const identifyData = {
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      };

      const response = await request(app)
        .post('/api/ai/identify')
        .set('Authorization', `Bearer ${authToken}`)
        .send(identifyData)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.consultationId).toBeDefined();
    });

    test('POST /api/ai/consult 应该处理AI咨询请求', async () => {
      const consultData = {
        questionText: '绿萝叶子发黄怎么办？',
        questionType: 'CARE'
      };

      const response = await request(app)
        .post('/api/ai/consult')
        .set('Authorization', `Bearer ${authToken}`)
        .send(consultData)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.consultationId).toBeDefined();
    });

    test('GET /api/ai/history 应该返回咨询历史', async () => {
      const response = await request(app)
        .get('/api/ai/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.consultations).toBeDefined();
    });
  });

  describe('社区功能', () => {
    test('POST /api/community/post 应该成功发布动态', async () => {
      const postData = {
        content: '我的绿萝长得很好！',
        plantId: testPlantId,
        images: 'http://test-image.jpg',
        topicTags: '绿萝,养护心得'
      };

      const response = await request(app)
        .post('/api/community/post')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.postId).toBeDefined();
    });

    test('GET /api/community/posts 应该返回动态列表', async () => {
      const response = await request(app)
        .get('/api/community/posts')
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.posts).toBeDefined();
    });
  });

  describe('错误处理', () => {
    test('访问不存在的接口应该返回404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.code).toBe(404);
    });

    test('无效的token应该返回401', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.code).toBe(401);
    });
  });
});