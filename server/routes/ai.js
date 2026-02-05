const express = require('express');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const db = require('../utils/database');
const aiService = require('../services/aiService');

const router = express.Router();

// AI植物识别
router.post('/identify', auth, async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({
        code: 400,
        message: '请提供植物图片'
      });
    }
    
    const consultationId = uuidv4();
    const startTime = Date.now();
    
    // 调用AI识别服务
    const identifyResult = await aiService.identifyPlant(image);
    const responseTime = Date.now() - startTime;
    
    // 保存咨询记录
    await db.query(`
      INSERT INTO T_AI_CONSULTATION (
        CONSULTATION_ID, OPENID, QUESTION_TYPE, QUESTION_TEXT, 
        QUESTION_IMAGES, AI_RESPONSE, RESPONSE_TIME, CREATE_TIME
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      consultationId,
      req.user.openid,
      'IDENTIFY',
      '植物识别',
      image,
      JSON.stringify(identifyResult),
      responseTime
    ]);
    
    if (identifyResult.success) {
      res.json({
        code: 200,
        message: '识别成功',
        data: {
          consultationId,
          ...identifyResult.data,
          responseTime
        }
      });
    } else {
      res.json({
        code: 200,
        message: '识别失败',
        data: {
          consultationId,
          error: identifyResult.message,
          responseTime
        }
      });
    }
    
  } catch (error) {
    console.error('AI识别失败:', error);
    res.status(500).json({
      code: 500,
      message: 'AI识别服务异常'
    });
  }
});

// AI咨询问答
router.post('/consult', auth, async (req, res) => {
  try {
    const {
      plantId,
      questionType = 'GENERAL',
      questionText,
      questionImages
    } = req.body;
    
    if (!questionText) {
      return res.status(400).json({
        code: 400,
        message: '请输入问题内容'
      });
    }
    
    const consultationId = uuidv4();
    const startTime = Date.now();
    
    // 构建上下文信息
    let context = {};
    if (plantId) {
      const plant = await db.query(
        'SELECT * FROM T_USER_PLANT WHERE PLANT_ID = ? AND OPENID = ?',
        [plantId, req.user.openid]
      );
      
      if (plant.length > 0) {
        context = {
          plantType: plant[0].PLANT_TYPE,
          plantName: plant[0].PLANT_NAME,
          location: plant[0].LOCATION,
          plantAge: plant[0].GET_DATE ? 
            Math.floor((Date.now() - new Date(plant[0].GET_DATE)) / (1000 * 60 * 60 * 24)) : null
        };
      }
    }
    
    // 调用AI咨询服务
    const consultResult = await aiService.consultQuestion(questionText, context);
    const responseTime = Date.now() - startTime;
    
    // 保存咨询记录
    await db.query(`
      INSERT INTO T_AI_CONSULTATION (
        CONSULTATION_ID, OPENID, PLANT_ID, QUESTION_TYPE, 
        QUESTION_TEXT, QUESTION_IMAGES, AI_RESPONSE, RESPONSE_TIME, CREATE_TIME
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      consultationId,
      req.user.openid,
      plantId,
      questionType,
      questionText,
      questionImages,
      consultResult.success ? consultResult.data.response : consultResult.message,
      responseTime
    ]);
    
    if (consultResult.success) {
      res.json({
        code: 200,
        message: '咨询成功',
        data: {
          consultationId,
          response: consultResult.data.response,
          suggestions: consultResult.data.suggestions,
          responseTime
        }
      });
    } else {
      res.json({
        code: 200,
        message: '咨询失败',
        data: {
          consultationId,
          error: consultResult.message,
          responseTime
        }
      });
    }
    
  } catch (error) {
    console.error('AI咨询失败:', error);
    res.status(500).json({
      code: 500,
      message: 'AI咨询服务异常'
    });
  }
});

// 获取咨询历史
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, size = 10, questionType } = req.query;
    const offset = (page - 1) * size;
    
    let whereClause = 'WHERE OPENID = ?';
    let params = [req.user.openid];
    
    if (questionType) {
      whereClause += ' AND QUESTION_TYPE = ?';
      params.push(questionType);
    }
    
    // 获取咨询历史
    const consultations = await db.query(`
      SELECT * FROM T_AI_CONSULTATION 
      ${whereClause}
      ORDER BY CREATE_TIME DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(size), offset]);
    
    // 获取总数
    const totalResult = await db.query(`
      SELECT COUNT(*) as total FROM T_AI_CONSULTATION ${whereClause}
    `, params);
    
    const total = totalResult[0].total;
    
    res.json({
      code: 200,
      data: {
        consultations,
        total,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(total / size)
      }
    });
    
  } catch (error) {
    console.error('获取咨询历史失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取咨询历史失败'
    });
  }
});

// 获取咨询详情
router.get('/consultation/:consultationId', auth, async (req, res) => {
  try {
    const { consultationId } = req.params;
    
    const consultation = await db.query(`
      SELECT * FROM T_AI_CONSULTATION 
      WHERE CONSULTATION_ID = ? AND OPENID = ?
    `, [consultationId, req.user.openid]);
    
    if (consultation.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '咨询记录不存在'
      });
    }
    
    res.json({
      code: 200,
      data: consultation[0]
    });
    
  } catch (error) {
    console.error('获取咨询详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取咨询详情失败'
    });
  }
});

// 用户反馈咨询质量
router.post('/consultation/:consultationId/feedback', auth, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { rating, isHelpful } = req.body;
    
    // 检查咨询记录是否存在
    const consultation = await db.query(`
      SELECT * FROM T_AI_CONSULTATION 
      WHERE CONSULTATION_ID = ? AND OPENID = ?
    `, [consultationId, req.user.openid]);
    
    if (consultation.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '咨询记录不存在'
      });
    }
    
    // 更新反馈信息
    await db.query(`
      UPDATE T_AI_CONSULTATION 
      SET USER_RATING = ?, IS_HELPFUL = ?
      WHERE CONSULTATION_ID = ?
    `, [rating, isHelpful, consultationId]);
    
    res.json({
      code: 200,
      message: '反馈提交成功'
    });
    
  } catch (error) {
    console.error('提交反馈失败:', error);
    res.status(500).json({
      code: 500,
      message: '提交反馈失败'
    });
  }
});

// 获取植物养护建议
router.get('/care-advice/:plantId', auth, async (req, res) => {
  try {
    const { plantId } = req.params;
    
    // 获取植物信息
    const plant = await db.query(`
      SELECT * FROM T_USER_PLANT 
      WHERE PLANT_ID = ? AND OPENID = ?
    `, [plantId, req.user.openid]);
    
    if (plant.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '植物不存在'
      });
    }
    
    const plantInfo = plant[0];
    
    // 获取AI养护建议
    const adviceResult = await aiService.getCareAdvice(plantInfo.PLANT_TYPE, {
      season: getCurrentSeason(),
      lastCareDate: plantInfo.LAST_CARE_DATE
    });
    
    if (adviceResult.success) {
      res.json({
        code: 200,
        data: {
          plantInfo: {
            plantId: plantInfo.PLANT_ID,
            plantName: plantInfo.PLANT_NAME,
            plantType: plantInfo.PLANT_TYPE
          },
          advice: adviceResult.data
        }
      });
    } else {
      res.json({
        code: 200,
        message: '获取建议失败',
        data: {
          error: adviceResult.message
        }
      });
    }
    
  } catch (error) {
    console.error('获取养护建议失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取养护建议失败'
    });
  }
});

// 获取当前季节
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'SPRING';
  if (month >= 6 && month <= 8) return 'SUMMER';
  if (month >= 9 && month <= 11) return 'AUTUMN';
  return 'WINTER';
}

module.exports = router;