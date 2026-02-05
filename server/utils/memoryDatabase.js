// 内存数据库 - 用于演示和快速部署
class MemoryDatabase {
  constructor() {
    this.users = new Map();
    this.plants = new Map();
    this.careRecords = new Map();
    this.consultations = new Map();
    this.posts = new Map();
    this.systemParams = new Map();
    
    this.initSystemParams();
  }
  
  // 初始化系统参数
  initSystemParams() {
    this.systemParams.set('AI_MODEL_TYPE', {
      PARA_INDEX: 'AI_MODEL_TYPE',
      PARA_NAME: 'AI模型类型',
      PARA_CONTENT: 'baidu',
      PARA_TYPE: 'STRING',
      PARA_REMARK: '当前使用的AI模型',
      IS_ACTIVE: true,
      LAST_MODIFY_TIME: new Date()
    });
    
    this.systemParams.set('MAX_PLANT_PER_USER', {
      PARA_INDEX: 'MAX_PLANT_PER_USER',
      PARA_NAME: '用户最大植物数',
      PARA_CONTENT: '50',
      PARA_TYPE: 'INTEGER',
      PARA_REMARK: '单个用户最多可添加的植物数量',
      IS_ACTIVE: true,
      LAST_MODIFY_TIME: new Date()
    });
  }
  
  // 模拟SQL查询
  async query(sql, params = []) {
    try {
      const sqlUpper = sql.toUpperCase().trim();
      
      // 用户相关查询
      if (sqlUpper.includes('T_WECHAT_USER')) {
        return this.handleUserQuery(sql, params);
      }
      
      // 植物相关查询
      if (sqlUpper.includes('T_USER_PLANT')) {
        return this.handlePlantQuery(sql, params);
      }
      
      // 养护记录相关查询
      if (sqlUpper.includes('T_CARE_RECORD')) {
        return this.handleCareQuery(sql, params);
      }
      
      // AI咨询相关查询
      if (sqlUpper.includes('T_AI_CONSULTATION')) {
        return this.handleConsultationQuery(sql, params);
      }
      
      // 社区动态相关查询
      if (sqlUpper.includes('T_COMMUNITY_POST')) {
        return this.handlePostQuery(sql, params);
      }
      
      // 系统参数相关查询
      if (sqlUpper.includes('T_SYSTEM_PARAMETER')) {
        return this.handleSystemParamQuery(sql, params);
      }
      
      // 创建表语句 - 忽略
      if (sqlUpper.includes('CREATE TABLE')) {
        return [];
      }
      
      // 插入忽略语句
      if (sqlUpper.includes('INSERT IGNORE')) {
        return [];
      }
      
      console.log('未处理的SQL:', sql);
      return [];
      
    } catch (error) {
      console.error('内存数据库查询错误:', error);
      throw error;
    }
  }
  
  // 处理用户查询
  handleUserQuery(sql, params) {
    const sqlUpper = sql.toUpperCase();
    
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('WHERE OPENID')) {
      const openid = params[0];
      const user = this.users.get(openid);
      return user ? [user] : [];
    }
    
    if (sqlUpper.includes('INSERT INTO T_WECHAT_USER')) {
      const [openid, nickname, avatar, subscribe] = params;
      const user = {
        OPENID: openid,
        NICKNAME: nickname,
        HEAD_IMG_URL: avatar,
        SUBSCRIBE: subscribe,
        PLANT_COUNT: 0,
        TOTAL_CARE_DAYS: 0,
        SUBSCRIBE_TIME: new Date(),
        CREATE_TIME: new Date(),
        LAST_MODIFY_TIME: new Date(),
        LAST_ACTIVE_TIME: new Date()
      };
      this.users.set(openid, user);
      return [];
    }
    
    if (sqlUpper.includes('UPDATE T_WECHAT_USER')) {
      const openid = params[params.length - 1];
      const user = this.users.get(openid);
      if (user) {
        if (sqlUpper.includes('NICKNAME')) {
          user.NICKNAME = params[0];
          user.HEAD_IMG_URL = params[1];
        }
        if (sqlUpper.includes('PLANT_COUNT')) {
          user.PLANT_COUNT = (user.PLANT_COUNT || 0) + 1;
        }
        user.LAST_MODIFY_TIME = new Date();
        this.users.set(openid, user);
      }
      return [];
    }
    
    return [];
  }
  
  // 处理植物查询
  handlePlantQuery(sql, params) {
    const sqlUpper = sql.toUpperCase();
    
    if (sqlUpper.includes('INSERT INTO T_USER_PLANT')) {
      const [plantId, openid, plantName, plantType, plantSpecies, mainImage, location, getMethod, getDate, description, careDifficulty] = params;
      const plant = {
        PLANT_ID: plantId,
        OPENID: openid,
        PLANT_NAME: plantName,
        PLANT_TYPE: plantType,
        PLANT_SPECIES: plantSpecies,
        MAIN_IMAGE: mainImage,
        LOCATION: location,
        GET_METHOD: getMethod,
        GET_DATE: getDate,
        DESCRIPTION: description,
        CARE_DIFFICULTY: careDifficulty,
        IS_HEALTHY: true,
        CARE_COUNT: 0,
        STATUS: 'ACTIVE',
        CREATE_TIME: new Date(),
        LAST_MODIFY_TIME: new Date()
      };
      this.plants.set(plantId, plant);
      return [];
    }
    
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('WHERE PLANT_ID')) {
      const plantId = params[0];
      const plant = this.plants.get(plantId);
      return plant ? [plant] : [];
    }
    
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('WHERE OPENID') && sqlUpper.includes('ORDER BY')) {
      const [openid, status, limit, offset] = params;
      const userPlants = Array.from(this.plants.values())
        .filter(plant => plant.OPENID === openid && plant.STATUS === status)
        .sort((a, b) => new Date(b.CREATE_TIME) - new Date(a.CREATE_TIME))
        .slice(offset, offset + limit);
      return userPlants;
    }
    
    if (sqlUpper.includes('COUNT(*)') && sqlUpper.includes('WHERE OPENID')) {
      const [openid, status] = params;
      const count = Array.from(this.plants.values())
        .filter(plant => plant.OPENID === openid && plant.STATUS === status).length;
      return [{ total: count }];
    }
    
    return [];
  }
  
  // 处理养护记录查询
  handleCareQuery(sql, params) {
    const sqlUpper = sql.toUpperCase();
    
    if (sqlUpper.includes('INSERT INTO T_CARE_RECORD')) {
      const [recordId, plantId, openid, careType, careNote, images, weather, plantStatus, nextCareDate] = params;
      const record = {
        RECORD_ID: recordId,
        PLANT_ID: plantId,
        OPENID: openid,
        CARE_TYPE: careType,
        CARE_NOTE: careNote,
        IMAGES: images,
        WEATHER: weather,
        PLANT_STATUS: plantStatus,
        NEXT_CARE_DATE: nextCareDate,
        CREATE_TIME: new Date()
      };
      this.careRecords.set(recordId, record);
      return [];
    }
    
    if (sqlUpper.includes('SELECT') && sqlUpper.includes('WHERE PLANT_ID')) {
      const plantId = params[0];
      const records = Array.from(this.careRecords.values())
        .filter(record => record.PLANT_ID === plantId)
        .sort((a, b) => new Date(b.CREATE_TIME) - new Date(a.CREATE_TIME))
        .slice(0, 10);
      return records;
    }
    
    if (sqlUpper.includes('COUNT(*)') && sqlUpper.includes('WHERE OPENID')) {
      const openid = params[0];
      const count = Array.from(this.careRecords.values())
        .filter(record => record.OPENID === openid).length;
      return [{ count }];
    }
    
    return [];
  }
  
  // 处理AI咨询查询
  handleConsultationQuery(sql, params) {
    const sqlUpper = sql.toUpperCase();
    
    if (sqlUpper.includes('INSERT INTO T_AI_CONSULTATION')) {
      const [consultationId, openid, plantId, questionType, questionText, questionImages, aiResponse, responseTime] = params;
      const consultation = {
        CONSULTATION_ID: consultationId,
        OPENID: openid,
        PLANT_ID: plantId,
        QUESTION_TYPE: questionType,
        QUESTION_TEXT: questionText,
        QUESTION_IMAGES: questionImages,
        AI_RESPONSE: aiResponse,
        RESPONSE_TIME: responseTime,
        CREATE_TIME: new Date()
      };
      this.consultations.set(consultationId, consultation);
      return [];
    }
    
    if (sqlUpper.includes('COUNT(*)') && sqlUpper.includes('WHERE OPENID')) {
      const openid = params[0];
      const count = Array.from(this.consultations.values())
        .filter(consultation => consultation.OPENID === openid).length;
      return [{ count }];
    }
    
    return [];
  }
  
  // 处理社区动态查询
  handlePostQuery(sql, params) {
    const sqlUpper = sql.toUpperCase();
    
    if (sqlUpper.includes('COUNT(*)') && sqlUpper.includes('WHERE OPENID')) {
      const openid = params[0];
      const count = Array.from(this.posts.values())
        .filter(post => post.OPENID === openid && post.STATUS === 'PUBLISHED').length;
      return [{ count }];
    }
    
    return [];
  }
  
  // 处理系统参数查询
  handleSystemParamQuery(sql, params) {
    return [];
  }
  
  // 关闭连接（空实现）
  async close() {
    console.log('内存数据库连接已关闭');
  }
}

module.exports = new MemoryDatabase();