const express = require('express');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const db = require('../utils/database');

const router = express.Router();

// 添加养护记录
router.post('/add', auth, async (req, res) => {
  try {
    const {
      plantId,
      careType,
      careNote,
      images,
      weather,
      plantStatus,
      nextCareDate
    } = req.body;
    
    if (!plantId || !careType) {
      return res.status(400).json({
        code: 400,
        message: '植物ID和养护类型不能为空'
      });
    }
    
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
    
    const recordId = uuidv4();
    
    // 插入养护记录
    await db.query(`
      INSERT INTO T_CARE_RECORD (
        RECORD_ID, PLANT_ID, OPENID, CARE_TYPE, CARE_NOTE,
        IMAGES, WEATHER, PLANT_STATUS, NEXT_CARE_DATE, CREATE_TIME
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      recordId, plantId, req.user.openid, careType, careNote,
      images, weather, plantStatus, nextCareDate
    ]);
    
    // 更新植物的最后养护日期和养护次数
    await db.query(`
      UPDATE T_USER_PLANT 
      SET LAST_CARE_DATE = CURDATE(), CARE_COUNT = CARE_COUNT + 1, LAST_MODIFY_TIME = NOW()
      WHERE PLANT_ID = ?
    `, [plantId]);
    
    // 获取完整的养护记录
    const careRecord = await db.query(
      'SELECT * FROM T_CARE_RECORD WHERE RECORD_ID = ?',
      [recordId]
    );
    
    res.json({
      code: 200,
      message: '养护记录添加成功',
      data: {
        recordId,
        careRecord: careRecord[0],
        nextCareDate
      }
    });
    
  } catch (error) {
    console.error('添加养护记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加养护记录失败'
    });
  }
});

// 获取养护记录列表
router.get('/list', auth, async (req, res) => {
  try {
    const { plantId, page = 1, size = 10, careType } = req.query;
    const offset = (page - 1) * size;
    
    let whereClause = 'WHERE OPENID = ?';
    let params = [req.user.openid];
    
    if (plantId) {
      whereClause += ' AND PLANT_ID = ?';
      params.push(plantId);
    }
    
    if (careType) {
      whereClause += ' AND CARE_TYPE = ?';
      params.push(careType);
    }
    
    // 获取养护记录
    const records = await db.query(`
      SELECT cr.*, up.PLANT_NAME, up.MAIN_IMAGE as PLANT_IMAGE
      FROM T_CARE_RECORD cr
      LEFT JOIN T_USER_PLANT up ON cr.PLANT_ID = up.PLANT_ID
      ${whereClause}
      ORDER BY cr.CREATE_TIME DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(size), offset]);
    
    // 获取总数
    const totalResult = await db.query(`
      SELECT COUNT(*) as total FROM T_CARE_RECORD ${whereClause}
    `, params);
    
    const total = totalResult[0].total;
    
    res.json({
      code: 200,
      data: {
        records,
        total,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(total / size)
      }
    });
    
  } catch (error) {
    console.error('获取养护记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取养护记录失败'
    });
  }
});

// 获取养护记录详情
router.get('/:recordId', auth, async (req, res) => {
  try {
    const { recordId } = req.params;
    
    const record = await db.query(`
      SELECT cr.*, up.PLANT_NAME, up.PLANT_TYPE, up.MAIN_IMAGE as PLANT_IMAGE
      FROM T_CARE_RECORD cr
      LEFT JOIN T_USER_PLANT up ON cr.PLANT_ID = up.PLANT_ID
      WHERE cr.RECORD_ID = ? AND cr.OPENID = ?
    `, [recordId, req.user.openid]);
    
    if (record.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '养护记录不存在'
      });
    }
    
    res.json({
      code: 200,
      data: record[0]
    });
    
  } catch (error) {
    console.error('获取养护记录详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取养护记录详情失败'
    });
  }
});

// 更新养护记录
router.put('/:recordId', auth, async (req, res) => {
  try {
    const { recordId } = req.params;
    const {
      careNote,
      images,
      weather,
      plantStatus
    } = req.body;
    
    // 检查记录是否存在且属于当前用户
    const record = await db.query(`
      SELECT * FROM T_CARE_RECORD 
      WHERE RECORD_ID = ? AND OPENID = ?
    `, [recordId, req.user.openid]);
    
    if (record.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '养护记录不存在'
      });
    }
    
    // 更新养护记录
    await db.query(`
      UPDATE T_CARE_RECORD 
      SET CARE_NOTE = ?, IMAGES = ?, WEATHER = ?, PLANT_STATUS = ?
      WHERE RECORD_ID = ?
    `, [careNote, images, weather, plantStatus, recordId]);
    
    // 获取更新后的记录
    const updatedRecord = await db.query(
      'SELECT * FROM T_CARE_RECORD WHERE RECORD_ID = ?',
      [recordId]
    );
    
    res.json({
      code: 200,
      message: '养护记录更新成功',
      data: updatedRecord[0]
    });
    
  } catch (error) {
    console.error('更新养护记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新养护记录失败'
    });
  }
});

// 删除养护记录
router.delete('/:recordId', auth, async (req, res) => {
  try {
    const { recordId } = req.params;
    
    // 检查记录是否存在且属于当前用户
    const record = await db.query(`
      SELECT * FROM T_CARE_RECORD 
      WHERE RECORD_ID = ? AND OPENID = ?
    `, [recordId, req.user.openid]);
    
    if (record.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '养护记录不存在'
      });
    }
    
    // 删除养护记录
    await db.query('DELETE FROM T_CARE_RECORD WHERE RECORD_ID = ?', [recordId]);
    
    // 更新植物的养护次数
    await db.query(`
      UPDATE T_USER_PLANT 
      SET CARE_COUNT = CARE_COUNT - 1, LAST_MODIFY_TIME = NOW()
      WHERE PLANT_ID = ?
    `, [record[0].PLANT_ID]);
    
    res.json({
      code: 200,
      message: '养护记录删除成功'
    });
    
  } catch (error) {
    console.error('删除养护记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除养护记录失败'
    });
  }
});

// 获取养护统计
router.get('/statistics/summary', auth, async (req, res) => {
  try {
    const { period = 'MONTH', plantId } = req.query;
    
    let dateCondition = '';
    switch (period) {
      case 'WEEK':
        dateCondition = 'AND CREATE_TIME >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'MONTH':
        dateCondition = 'AND CREATE_TIME >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'YEAR':
        dateCondition = 'AND CREATE_TIME >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
        break;
    }
    
    let whereClause = `WHERE OPENID = ? ${dateCondition}`;
    let params = [req.user.openid];
    
    if (plantId) {
      whereClause += ' AND PLANT_ID = ?';
      params.push(plantId);
    }
    
    // 总养护次数
    const totalCareResult = await db.query(`
      SELECT COUNT(*) as totalCareCount FROM T_CARE_RECORD ${whereClause}
    `, params);
    
    // 按养护类型统计
    const careTypeStats = await db.query(`
      SELECT CARE_TYPE, COUNT(*) as count 
      FROM T_CARE_RECORD ${whereClause}
      GROUP BY CARE_TYPE
      ORDER BY count DESC
    `, params);
    
    // 按日期统计（最近7天）
    const dailyStats = await db.query(`
      SELECT DATE(CREATE_TIME) as date, COUNT(*) as count
      FROM T_CARE_RECORD 
      WHERE OPENID = ? AND CREATE_TIME >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ${plantId ? 'AND PLANT_ID = ?' : ''}
      GROUP BY DATE(CREATE_TIME)
      ORDER BY date DESC
    `, plantId ? [req.user.openid, plantId] : [req.user.openid]);
    
    // 计算连续养护天数
    const consecutiveDays = await calculateConsecutiveDays(req.user.openid, plantId);
    
    res.json({
      code: 200,
      data: {
        totalCareCount: totalCareResult[0].totalCareCount,
        careTypeDistribution: careTypeStats,
        dailyStats,
        consecutiveDays,
        period
      }
    });
    
  } catch (error) {
    console.error('获取养护统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取养护统计失败'
    });
  }
});

// 计算连续养护天数
async function calculateConsecutiveDays(openid, plantId = null) {
  try {
    let whereClause = 'WHERE OPENID = ?';
    let params = [openid];
    
    if (plantId) {
      whereClause += ' AND PLANT_ID = ?';
      params.push(plantId);
    }
    
    const records = await db.query(`
      SELECT DATE(CREATE_TIME) as care_date 
      FROM T_CARE_RECORD 
      ${whereClause}
      GROUP BY DATE(CREATE_TIME) 
      ORDER BY care_date DESC
    `, params);
    
    if (records.length === 0) return 0;
    
    let consecutiveDays = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let record of records) {
      const careDate = new Date(record.care_date);
      careDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate - careDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === consecutiveDays) {
        consecutiveDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return consecutiveDays;
  } catch (error) {
    console.error('计算连续天数失败:', error);
    return 0;
  }
}

module.exports = router;