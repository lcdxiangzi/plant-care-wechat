const mysql = require('mysql2/promise');

class Database {
  constructor() {
    this.pool = null;
    this.useMemoryDB = process.env.USE_MEMORY_DB === 'true';
    
    if (this.useMemoryDB) {
      console.log('🧠 使用内存数据库模式');
      this.memoryDB = require('./memoryDatabase');
    } else {
      this.init();
    }
  }
  
  async init() {
    try {
      // 优先使用DATABASE_URL（适配Railway/Heroku等）
      if (process.env.DATABASE_URL) {
        this.pool = mysql.createPool({
          uri: process.env.DATABASE_URL,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          acquireTimeout: 60000,
          timeout: 60000,
          reconnect: true,
          charset: 'utf8mb4'
        });
      } else {
        // 本地开发环境
        this.pool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'plant_care',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          acquireTimeout: 60000,
          timeout: 60000,
          reconnect: true,
          charset: 'utf8mb4'
        });
      }
      
      // 测试连接
      const connection = await this.pool.getConnection();
      console.log('✅ 数据库连接成功');
      connection.release();
      
      // 初始化数据库表
      await this.initTables();
      
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      
      // 如果是生产环境，尝试使用DATABASE_URL
      if (process.env.DATABASE_URL) {
        try {
          this.pool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
          });
          
          const connection = await this.pool.getConnection();
          console.log('✅ 使用DATABASE_URL连接成功');
          connection.release();
          
          await this.initTables();
        } catch (urlError) {
          console.error('❌ DATABASE_URL连接也失败:', urlError);
        }
      }
    }
  }
  
  async query(sql, params = []) {
    try {
      // 如果使用内存数据库
      if (this.useMemoryDB) {
        return await this.memoryDB.query(sql, params);
      }
      
      if (!this.pool) {
        throw new Error('数据库连接未初始化');
      }
      
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  }
  
  async initTables() {
    try {
      // 创建用户表
      await this.query(`
        CREATE TABLE IF NOT EXISTS T_WECHAT_USER (
          OPENID VARCHAR(128) PRIMARY KEY COMMENT '微信用户唯一标识',
          SUBSCRIBE BOOLEAN DEFAULT TRUE COMMENT '是否关注公众号',
          NICKNAME VARCHAR(1024) COMMENT '用户昵称',
          GENDER VARCHAR(32) COMMENT '性别',
          COUNTRY VARCHAR(128) COMMENT '国家',
          PROVINCE VARCHAR(128) COMMENT '省份',
          CITY VARCHAR(128) COMMENT '城市',
          LANGUAGE VARCHAR(32) COMMENT '语言',
          HEAD_IMG_URL VARCHAR(1024) COMMENT '头像URL',
          SUBSCRIBE_TIME DATETIME COMMENT '关注时间',
          UNIONID VARCHAR(128) COMMENT '联合标识',
          REMARK VARCHAR(1024) COMMENT '备注',
          GROUPID VARCHAR(128) COMMENT '用户分组',
          TAG_LIST VARCHAR(1024) COMMENT '标签列表',
          SUBSCRIBE_SCENE VARCHAR(128) COMMENT '关注场景',
          PLANT_COUNT INT DEFAULT 0 COMMENT '植物数量',
          TOTAL_CARE_DAYS INT DEFAULT 0 COMMENT '累计养护天数',
          LAST_ACTIVE_TIME DATETIME COMMENT '最后活跃时间',
          CREATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP,
          LAST_MODIFY_TIME DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          TIMESTAMP TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // 创建植物表
      await this.query(`
        CREATE TABLE IF NOT EXISTS T_USER_PLANT (
          PLANT_ID VARCHAR(32) PRIMARY KEY COMMENT '植物ID',
          OPENID VARCHAR(128) NOT NULL COMMENT '用户ID',
          PLANT_NAME VARCHAR(128) NOT NULL COMMENT '植物名称（用户命名）',
          PLANT_TYPE VARCHAR(64) COMMENT 'AI识别的植物类型',
          PLANT_SPECIES VARCHAR(128) COMMENT '具体品种',
          MAIN_IMAGE VARCHAR(512) COMMENT '主要照片',
          LOCATION VARCHAR(256) COMMENT '植物位置（用户填写）',
          GET_METHOD VARCHAR(64) COMMENT '获得方式（购买/赠送/自种等）',
          GET_DATE DATE COMMENT '获得日期',
          DESCRIPTION VARCHAR(1024) COMMENT '植物描述',
          IS_HEALTHY BOOLEAN DEFAULT TRUE COMMENT '是否健康',
          CARE_DIFFICULTY VARCHAR(32) COMMENT '养护难度（AI评估）',
          LAST_CARE_DATE DATE COMMENT '最后养护日期',
          CARE_COUNT INT DEFAULT 0 COMMENT '养护次数',
          STATUS VARCHAR(32) DEFAULT 'ACTIVE' COMMENT '状态（ACTIVE/DORMANT/DEAD）',
          CREATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP,
          LAST_MODIFY_TIME DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_user_plant(OPENID),
          INDEX idx_plant_type(PLANT_TYPE),
          FOREIGN KEY (OPENID) REFERENCES T_WECHAT_USER(OPENID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // 创建养护记录表
      await this.query(`
        CREATE TABLE IF NOT EXISTS T_CARE_RECORD (
          RECORD_ID VARCHAR(32) PRIMARY KEY COMMENT '记录ID',
          PLANT_ID VARCHAR(32) NOT NULL COMMENT '植物ID',
          OPENID VARCHAR(128) NOT NULL COMMENT '用户ID',
          CARE_TYPE VARCHAR(32) NOT NULL COMMENT '养护类型（WATER/FERTILIZE/PRUNE/OBSERVE/REPOT）',
          CARE_NOTE VARCHAR(1024) COMMENT '养护备注',
          IMAGES VARCHAR(2048) COMMENT '照片记录（多张图片URL，逗号分隔）',
          WEATHER VARCHAR(32) COMMENT '天气情况',
          PLANT_STATUS VARCHAR(32) COMMENT '植物状态记录',
          NEXT_CARE_DATE DATE COMMENT '下次养护建议日期',
          CREATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_plant_care(PLANT_ID, CREATE_TIME),
          INDEX idx_user_care(OPENID, CREATE_TIME),
          FOREIGN KEY (PLANT_ID) REFERENCES T_USER_PLANT(PLANT_ID),
          FOREIGN KEY (OPENID) REFERENCES T_WECHAT_USER(OPENID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // 创建AI咨询表
      await this.query(`
        CREATE TABLE IF NOT EXISTS T_AI_CONSULTATION (
          CONSULTATION_ID VARCHAR(32) PRIMARY KEY COMMENT '咨询ID',
          OPENID VARCHAR(128) NOT NULL COMMENT '用户ID',
          PLANT_ID VARCHAR(32) COMMENT '相关植物ID（可选）',
          QUESTION_TYPE VARCHAR(32) NOT NULL COMMENT '问题类型（CARE/DISEASE/IDENTIFY/GENERAL）',
          QUESTION_TEXT VARCHAR(2048) COMMENT '问题文本',
          QUESTION_IMAGES VARCHAR(1024) COMMENT '问题图片',
          AI_RESPONSE TEXT COMMENT 'AI回复内容',
          RESPONSE_TIME INT COMMENT '响应时间（毫秒）',
          USER_RATING INT COMMENT '用户评分（1-5）',
          IS_HELPFUL BOOLEAN COMMENT '是否有帮助',
          CREATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          INDEX idx_user_consultation(OPENID, CREATE_TIME),
          INDEX idx_plant_consultation(PLANT_ID),
          FOREIGN KEY (OPENID) REFERENCES T_WECHAT_USER(OPENID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // 创建社区动态表
      await this.query(`
        CREATE TABLE IF NOT EXISTS T_COMMUNITY_POST (
          POST_ID VARCHAR(32) PRIMARY KEY COMMENT '动态ID',
          OPENID VARCHAR(128) NOT NULL COMMENT '发布用户ID',
          PLANT_ID VARCHAR(32) COMMENT '相关植物ID',
          CONTENT VARCHAR(2048) NOT NULL COMMENT '动态内容',
          IMAGES VARCHAR(2048) COMMENT '图片列表',
          LOCATION VARCHAR(256) COMMENT '位置信息',
          TOPIC_TAGS VARCHAR(512) COMMENT '话题标签',
          VIEW_COUNT INT DEFAULT 0 COMMENT '浏览次数',
          LIKE_COUNT INT DEFAULT 0 COMMENT '点赞次数',
          COMMENT_COUNT INT DEFAULT 0 COMMENT '评论次数',
          IS_FEATURED BOOLEAN DEFAULT FALSE COMMENT '是否精选',
          STATUS VARCHAR(32) DEFAULT 'PUBLISHED' COMMENT '状态（PUBLISHED/HIDDEN/DELETED）',
          CREATE_TIME DATETIME DEFAULT CURRENT_TIMESTAMP,
          LAST_MODIFY_TIME DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_user_post(OPENID, CREATE_TIME),
          INDEX idx_plant_post(PLANT_ID),
          INDEX idx_featured_post(IS_FEATURED, CREATE_TIME),
          FOREIGN KEY (OPENID) REFERENCES T_WECHAT_USER(OPENID)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // 创建系统参数表
      await this.query(`
        CREATE TABLE IF NOT EXISTS T_SYSTEM_PARAMETER (
          PARA_INDEX VARCHAR(32) PRIMARY KEY COMMENT '参数索引',
          PARA_NAME VARCHAR(64) COMMENT '参数名称',
          PARA_CONTENT VARCHAR(2048) COMMENT '参数内容',
          PARA_TYPE VARCHAR(32) DEFAULT 'STRING' COMMENT '参数类型',
          PARA_REMARK VARCHAR(1024) COMMENT '参数备注',
          IS_ACTIVE BOOLEAN DEFAULT TRUE COMMENT '是否启用',
          LAST_MODIFY_TIME DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ 数据库表初始化完成');
      
      // 插入基础系统参数
      await this.insertSystemParameters();
      
    } catch (error) {
      console.error('❌ 数据库表初始化失败:', error);
    }
  }
  
  async insertSystemParameters() {
    try {
      const params = [
        ['AI_MODEL_TYPE', 'AI模型类型', 'baidu', 'STRING', '当前使用的AI模型', true],
        ['PLANT_IDENTIFY_API', '植物识别API', 'baidu', 'STRING', '植物识别服务提供商', true],
        ['MAX_PLANT_PER_USER', '用户最大植物数', '50', 'INTEGER', '单个用户最多可添加的植物数量', true],
        ['IMAGE_MAX_SIZE', '图片最大尺寸', '2048', 'INTEGER', '上传图片最大像素', true],
        ['CARE_REMIND_DAYS', '养护提醒天数', '3', 'INTEGER', '超过多少天未养护时提醒', true]
      ];
      
      for (let param of params) {
        await this.query(`
          INSERT IGNORE INTO T_SYSTEM_PARAMETER 
          (PARA_INDEX, PARA_NAME, PARA_CONTENT, PARA_TYPE, PARA_REMARK, IS_ACTIVE, LAST_MODIFY_TIME) 
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, param);
      }
      
      console.log('✅ 系统参数初始化完成');
    } catch (error) {
      console.error('❌ 系统参数初始化失败:', error);
    }
  }
  
  async close() {
    if (this.useMemoryDB) {
      await this.memoryDB.close();
    } else if (this.pool) {
      await this.pool.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 创建单例实例
const db = new Database();

module.exports = db;