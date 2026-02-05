const express = require('express');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const db = require('../utils/database');
const aiService = require('../services/aiService');
const uploadService = require('../services/uploadService');

const router = express.Router();

// 添加植物
router.post('/add', auth, async (req, res) => {
  try {
    const {
      plantName,
      image,
      location,
      getMethod,
      getDate,
      description
    } = req.body;
    
    if (!plantName || !image) {
      return res.status(400).json({
        code: 400,
        message: '植物名称和照片不能为空'
      });
    }
    
    const plantId = uuidv4();
    
    // 上传图片到Cloudinary
    let mainImage = '';
    try {
      const uploadResult = await uploadService.uploadImage(image, {
        folder: 'plants',
        public_id: `plant_${plantId}`
      });
      mainImage = uploadResult.secure_url;
    } catch (uploadError) {
      console.error('图片上传失败:', uploadError);
      return res.status(500).json({
        code: 500,
        message: '图片上传失败'
      });
    }
    
    // AI识别植物类型
    let plantType = '';
    let plantSpecies = '';
    let careDifficulty = 'MEDIUM';
    
    try {
      const identifyResult = await aiService.identifyPlant(mainImage);
      if (identifyResult.success) {
        plantType = identifyResult.data.plantType;
        plantSpecies = identifyResult.data.species;
        careDifficulty = identifyResult.data.difficulty || 'MEDIUM';
      }
    } catch (aiError) {
      console.error('AI识别失败:', aiError);
      // AI识别失败不影响植物添加
    }
    
    // 插入植物记录
    await db.query(`
      INSERT INTO T_USER_PLANT (
        PLANT_ID, OPENID, PLANT_NAME, PLANT_TYPE, PLANT_SPECIES,
        MAIN_IMAGE, LOCATION, GET_METHOD, GET_DATE, DESCRIPTION,
        CARE_DIFFICULTY, CREATE_TIME, LAST_MODIFY_TIME
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      plantId, req.user.openid, plantName, plantType, plantSpecies,
      mainImage, location, getMethod, getDate, description, careDifficulty
    ]);
    
    // 更新用户植物数量
    await db.query(`
      UPDATE T_WECHAT_USER 
      SET PLANT_COUNT = PLANT_COUNT + 1, LAST_MODIFY_TIME = NOW()
      WHERE OPENID = ?
    `, [req.user.openid]);
    
    // 获取完整的植物信息
    const plant = await db.query(
      'SELECT * FROM T_USER_PLANT WHERE PLANT_ID = ?',
      [plantId]
    );
    
    res.json({
      code: 200,
      message: '植物添加成功',
      data: {
        plantId,
        plantInfo: plant[0],
        aiIdentifyResult: {
          plantType,
          species: plantSpecies,
          difficulty: careDifficulty
        }
      }
    });
    
  } catch (error) {
    console.error('添加植物失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加植物失败'
    });
  }
});

// 获取用户植物列表
router.get('/list', auth, async (req, res) => {
  try {
    const { page = 1, size = 10, status = 'ACTIVE' } = req.query;
    const offset = (page - 1) * size;
    
    // 获取植物列表
    const plants = await db.query(`
      SELECT * FROM T_USER_PLANT 
      WHERE OPENID = ? AND STATUS = ?
      ORDER BY CREATE_TIME DESC
      LIMIT ? OFFSET ?
    `, [req.user.openid, status, parseInt(size), offset]);
    
    // 获取总数
    const totalResult = await db.query(`
      SELECT COUNT(*) as total FROM T_USER_PLANT 
      WHERE OPENID = ? AND STATUS = ?
    `, [req.user.openid, status]);
    
    const total = totalResult[0].total;
    
    res.json({
      code: 200,
      data: {
        plants,
        total,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(total / size)
      }
    });
    
  } catch (error) {
    console.error('获取植物列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取植物列表失败'
    });
  }
});

// 获取植物详情
router.get('/:plantId', auth, async (req, res) => {
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
    
    // 获取最近的养护记录
    const recentCareRecords = await db.query(`
      SELECT * FROM T_CARE_RECORD 
      WHERE PLANT_ID = ? 
      ORDER BY CREATE_TIME DESC 
      LIMIT 10
    `, [plantId]);
    
    // 获取AI养护建议
    let aiSuggestions = [];
    try {
      if (plant[0].PLANT_TYPE) {
        const suggestions = await aiService.getCareAdvice(plant[0].PLANT_TYPE, {
          season: getCurrentSeason(),
          lastCareDate: plant[0].LAST_CARE_DATE
        });
        aiSuggestions = suggestions.data || [];
      }
    } catch (aiError) {
      console.error('获取AI建议失败:', aiError);
    }
    
    res.json({
      code: 200,
      data: {
        plantInfo: plant[0],
        recentCareRecords,
        aiSuggestions
      }
    });
    
  } catch (error) {
    console.error('获取植物详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取植物详情失败'
    });
  }
});

// 更新植物信息
router.put('/:plantId', auth, async (req, res) => {
  try {
    const { plantId } = req.params;
    const {
      plantName,
      location,
      description,
      status
    } = req.body;
    
    // 检查植物是否存在且属于当前用户
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
    
    // 更新植物信息
    await db.query(`
      UPDATE T_USER_PLANT 
      SET PLANT_NAME = ?, LOCATION = ?, DESCRIPTION = ?, STATUS = ?, LAST_MODIFY_TIME = NOW()
      WHERE PLANT_ID = ?
    `, [plantName, location, description, status, plantId]);
    
    // 获取更新后的植物信息
    const updatedPlant = await db.query(
      'SELECT * FROM T_USER_PLANT WHERE PLANT_ID = ?',
      [plantId]
    );
    
    res.json({
      code: 200,
      message: '植物信息更新成功',
      data: updatedPlant[0]
    });
    
  } catch (error) {
    console.error('更新植物信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新植物信息失败'
    });
  }
});

// 删除植物
router.delete('/:plantId', auth, async (req, res) => {
  try {
    const { plantId } = req.params;
    
    // 检查植物是否存在且属于当前用户
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
    
    // 软删除植物（更新状态为DELETED）
    await db.query(`
      UPDATE T_USER_PLANT 
      SET STATUS = 'DELETED', LAST_MODIFY_TIME = NOW()
      WHERE PLANT_ID = ?
    `, [plantId]);
    
    // 更新用户植物数量
    await db.query(`
      UPDATE T_WECHAT_USER 
      SET PLANT_COUNT = PLANT_COUNT - 1, LAST_MODIFY_TIME = NOW()
      WHERE OPENID = ?
    `, [req.user.openid]);
    
    res.json({
      code: 200,
      message: '植物删除成功'
    });
    
  } catch (error) {
    console.error('删除植物失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除植物失败'
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