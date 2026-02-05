const Database = require('../../server/utils/database');

describe('Database Tests', () => {
  let db;

  beforeEach(() => {
    // 使用内存数据库进行测试
    process.env.USE_MEMORY_DB = 'true';
    db = new (require('../../server/utils/database').constructor)();
  });

  describe('用户数据操作', () => {
    test('应该成功插入用户', async () => {
      const result = await db.query(`
        INSERT INTO T_WECHAT_USER (OPENID, NICKNAME, HEAD_IMG_URL, SUBSCRIBE) 
        VALUES (?, ?, ?, ?)
      `, ['test_openid', '测试用户', 'http://avatar.jpg', true]);

      expect(result).toBeDefined();
    });

    test('应该成功查询用户', async () => {
      // 先插入用户
      await db.query(`
        INSERT INTO T_WECHAT_USER (OPENID, NICKNAME, HEAD_IMG_URL, SUBSCRIBE) 
        VALUES (?, ?, ?, ?)
      `, ['test_openid', '测试用户', 'http://avatar.jpg', true]);

      // 查询用户
      const users = await db.query(
        'SELECT * FROM T_WECHAT_USER WHERE OPENID = ?',
        ['test_openid']
      );

      expect(users).toHaveLength(1);
      expect(users[0].OPENID).toBe('test_openid');
      expect(users[0].NICKNAME).toBe('测试用户');
    });

    test('应该成功更新用户信息', async () => {
      // 先插入用户
      await db.query(`
        INSERT INTO T_WECHAT_USER (OPENID, NICKNAME, HEAD_IMG_URL, SUBSCRIBE) 
        VALUES (?, ?, ?, ?)
      `, ['test_openid', '测试用户', 'http://avatar.jpg', true]);

      // 更新用户
      await db.query(`
        UPDATE T_WECHAT_USER 
        SET NICKNAME = ?, HEAD_IMG_URL = ?
        WHERE OPENID = ?
      `, ['新昵称', 'http://new-avatar.jpg', 'test_openid']);

      // 验证更新
      const users = await db.query(
        'SELECT * FROM T_WECHAT_USER WHERE OPENID = ?',
        ['test_openid']
      );

      expect(users[0].NICKNAME).toBe('新昵称');
      expect(users[0].HEAD_IMG_URL).toBe('http://new-avatar.jpg');
    });
  });

  describe('植物数据操作', () => {
    beforeEach(async () => {
      // 先创建用户
      await db.query(`
        INSERT INTO T_WECHAT_USER (OPENID, NICKNAME, HEAD_IMG_URL, SUBSCRIBE) 
        VALUES (?, ?, ?, ?)
      `, ['test_openid', '测试用户', 'http://avatar.jpg', true]);
    });

    test('应该成功插入植物', async () => {
      const result = await db.query(`
        INSERT INTO T_USER_PLANT (
          PLANT_ID, OPENID, PLANT_NAME, PLANT_TYPE, MAIN_IMAGE, CARE_DIFFICULTY
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, ['plant_001', 'test_openid', '我的绿萝', '绿萝', 'http://plant.jpg', 'EASY']);

      expect(result).toBeDefined();
    });

    test('应该成功查询用户植物', async () => {
      // 先插入植物
      await db.query(`
        INSERT INTO T_USER_PLANT (
          PLANT_ID, OPENID, PLANT_NAME, PLANT_TYPE, MAIN_IMAGE, CARE_DIFFICULTY
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, ['plant_001', 'test_openid', '我的绿萝', '绿萝', 'http://plant.jpg', 'EASY']);

      // 查询植物
      const plants = await db.query(`
        SELECT * FROM T_USER_PLANT 
        WHERE OPENID = ? AND STATUS = ?
        ORDER BY CREATE_TIME DESC
        LIMIT ? OFFSET ?
      `, ['test_openid', 'ACTIVE', 10, 0]);

      expect(plants).toHaveLength(1);
      expect(plants[0].PLANT_NAME).toBe('我的绿萝');
    });

    test('应该正确统计植物数量', async () => {
      // 插入多个植物
      await db.query(`
        INSERT INTO T_USER_PLANT (
          PLANT_ID, OPENID, PLANT_NAME, PLANT_TYPE, MAIN_IMAGE, CARE_DIFFICULTY
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, ['plant_001', 'test_openid', '绿萝1', '绿萝', 'http://plant1.jpg', 'EASY']);

      await db.query(`
        INSERT INTO T_USER_PLANT (
          PLANT_ID, OPENID, PLANT_NAME, PLANT_TYPE, MAIN_IMAGE, CARE_DIFFICULTY
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, ['plant_002', 'test_openid', '绿萝2', '绿萝', 'http://plant2.jpg', 'EASY']);

      // 统计数量
      const countResult = await db.query(`
        SELECT COUNT(*) as total FROM T_USER_PLANT 
        WHERE OPENID = ? AND STATUS = ?
      `, ['test_openid', 'ACTIVE']);

      expect(countResult[0].total).toBe(2);
    });
  });

  describe('养护记录操作', () => {
    beforeEach(async () => {
      // 创建用户和植物
      await db.query(`
        INSERT INTO T_WECHAT_USER (OPENID, NICKNAME, HEAD_IMG_URL, SUBSCRIBE) 
        VALUES (?, ?, ?, ?)
      `, ['test_openid', '测试用户', 'http://avatar.jpg', true]);

      await db.query(`
        INSERT INTO T_USER_PLANT (
          PLANT_ID, OPENID, PLANT_NAME, PLANT_TYPE, MAIN_IMAGE, CARE_DIFFICULTY
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, ['plant_001', 'test_openid', '我的绿萝', '绿萝', 'http://plant.jpg', 'EASY']);
    });

    test('应该成功插入养护记录', async () => {
      const result = await db.query(`
        INSERT INTO T_CARE_RECORD (
          RECORD_ID, PLANT_ID, OPENID, CARE_TYPE, CARE_NOTE
        ) VALUES (?, ?, ?, ?, ?)
      `, ['record_001', 'plant_001', 'test_openid', 'WATER', '今天浇水了']);

      expect(result).toBeDefined();
    });

    test('应该成功查询养护记录', async () => {
      // 插入养护记录
      await db.query(`
        INSERT INTO T_CARE_RECORD (
          RECORD_ID, PLANT_ID, OPENID, CARE_TYPE, CARE_NOTE
        ) VALUES (?, ?, ?, ?, ?)
      `, ['record_001', 'plant_001', 'test_openid', 'WATER', '今天浇水了']);

      // 查询记录
      const records = await db.query(`
        SELECT * FROM T_CARE_RECORD 
        WHERE PLANT_ID = ?
        ORDER BY CREATE_TIME DESC
        LIMIT 10
      `, ['plant_001']);

      expect(records).toHaveLength(1);
      expect(records[0].CARE_TYPE).toBe('WATER');
    });
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
  });
});