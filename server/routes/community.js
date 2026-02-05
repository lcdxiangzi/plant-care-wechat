const express = require('express');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const db = require('../utils/database');

const router = express.Router();

// 发布社区动态
router.post('/post', auth, async (req, res) => {
  try {
    const {
      plantId,
      content,
      images,
      location,
      topicTags
    } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: '动态内容不能为空'
      });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({
        code: 400,
        message: '动态内容不能超过2000字符'
      });
    }
    
    const postId = uuidv4();
    
    // 插入动态记录
    await db.query(`
      INSERT INTO T_COMMUNITY_POST (
        POST_ID, OPENID, PLANT_ID, CONTENT, IMAGES,
        LOCATION, TOPIC_TAGS, CREATE_TIME, LAST_MODIFY_TIME
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [postId, req.user.openid, plantId, content, images, location, topicTags]);
    
    // 获取完整的动态信息
    const post = await db.query(`
      SELECT cp.*, wu.NICKNAME as USER_NICKNAME, wu.HEAD_IMG_URL as USER_AVATAR,
             up.PLANT_NAME, up.PLANT_TYPE
      FROM T_COMMUNITY_POST cp
      LEFT JOIN T_WECHAT_USER wu ON cp.OPENID = wu.OPENID
      LEFT JOIN T_USER_PLANT up ON cp.PLANT_ID = up.PLANT_ID
      WHERE cp.POST_ID = ?
    `, [postId]);
    
    res.json({
      code: 200,
      message: '动态发布成功',
      data: {
        postId,
        post: post[0]
      }
    });
    
  } catch (error) {
    console.error('发布动态失败:', error);
    res.status(500).json({
      code: 500,
      message: '发布动态失败'
    });
  }
});

// 获取社区动态列表
router.get('/posts', async (req, res) => {
  try {
    const {
      page = 1,
      size = 10,
      type = 'latest',
      plantType,
      topicTag
    } = req.query;
    
    const offset = (page - 1) * size;
    
    let whereClause = 'WHERE cp.STATUS = "PUBLISHED"';
    let params = [];
    let orderBy = 'ORDER BY cp.CREATE_TIME DESC';
    
    // 根据类型调整排序
    switch (type) {
      case 'hot':
        orderBy = 'ORDER BY (cp.LIKE_COUNT * 2 + cp.COMMENT_COUNT) DESC, cp.CREATE_TIME DESC';
        break;
      case 'featured':
        whereClause += ' AND cp.IS_FEATURED = TRUE';
        break;
    }
    
    // 植物类型筛选
    if (plantType) {
      whereClause += ' AND up.PLANT_TYPE = ?';
      params.push(plantType);
    }
    
    // 话题标签筛选
    if (topicTag) {
      whereClause += ' AND cp.TOPIC_TAGS LIKE ?';
      params.push(`%${topicTag}%`);
    }
    
    // 获取动态列表
    const posts = await db.query(`
      SELECT cp.*, wu.NICKNAME as USER_NICKNAME, wu.HEAD_IMG_URL as USER_AVATAR,
             up.PLANT_NAME, up.PLANT_TYPE
      FROM T_COMMUNITY_POST cp
      LEFT JOIN T_WECHAT_USER wu ON cp.OPENID = wu.OPENID
      LEFT JOIN T_USER_PLANT up ON cp.PLANT_ID = up.PLANT_ID
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(size), offset]);
    
    // 获取总数
    const totalResult = await db.query(`
      SELECT COUNT(*) as total 
      FROM T_COMMUNITY_POST cp
      LEFT JOIN T_USER_PLANT up ON cp.PLANT_ID = up.PLANT_ID
      ${whereClause}
    `, params);
    
    const total = totalResult[0].total;
    
    res.json({
      code: 200,
      data: {
        posts,
        total,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(total / size)
      }
    });
    
  } catch (error) {
    console.error('获取动态列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取动态列表失败'
    });
  }
});

// 获取动态详情
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // 获取动态详情
    const post = await db.query(`
      SELECT cp.*, wu.NICKNAME as USER_NICKNAME, wu.HEAD_IMG_URL as USER_AVATAR,
             up.PLANT_NAME, up.PLANT_TYPE
      FROM T_COMMUNITY_POST cp
      LEFT JOIN T_WECHAT_USER wu ON cp.OPENID = wu.OPENID
      LEFT JOIN T_USER_PLANT up ON cp.PLANT_ID = up.PLANT_ID
      WHERE cp.POST_ID = ? AND cp.STATUS = "PUBLISHED"
    `, [postId]);
    
    if (post.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '动态不存在'
      });
    }
    
    // 增加浏览次数
    await db.query(`
      UPDATE T_COMMUNITY_POST 
      SET VIEW_COUNT = VIEW_COUNT + 1 
      WHERE POST_ID = ?
    `, [postId]);
    
    // 获取评论列表（最新10条）
    const comments = await db.query(`
      SELECT pi.*, wu.NICKNAME as USER_NICKNAME, wu.HEAD_IMG_URL as USER_AVATAR
      FROM T_POST_INTERACTION pi
      LEFT JOIN T_WECHAT_USER wu ON pi.OPENID = wu.OPENID
      WHERE pi.POST_ID = ? AND pi.INTERACTION_TYPE = "COMMENT"
      ORDER BY pi.CREATE_TIME DESC
      LIMIT 10
    `, [postId]);
    
    res.json({
      code: 200,
      data: {
        post: post[0],
        comments
      }
    });
    
  } catch (error) {
    console.error('获取动态详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取动态详情失败'
    });
  }
});

// 动态互动（点赞/评论）
router.post('/interact', auth, async (req, res) => {
  try {
    const {
      postId,
      interactionType,
      content,
      replyTo
    } = req.body;
    
    if (!postId || !interactionType) {
      return res.status(400).json({
        code: 400,
        message: '动态ID和互动类型不能为空'
      });
    }
    
    if (!['LIKE', 'COMMENT'].includes(interactionType)) {
      return res.status(400).json({
        code: 400,
        message: '无效的互动类型'
      });
    }
    
    if (interactionType === 'COMMENT' && (!content || content.trim().length === 0)) {
      return res.status(400).json({
        code: 400,
        message: '评论内容不能为空'
      });
    }
    
    // 检查动态是否存在
    const post = await db.query(`
      SELECT * FROM T_COMMUNITY_POST 
      WHERE POST_ID = ? AND STATUS = "PUBLISHED"
    `, [postId]);
    
    if (post.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '动态不存在'
      });
    }
    
    const interactionId = uuidv4();
    
    if (interactionType === 'LIKE') {
      // 检查是否已经点赞
      const existingLike = await db.query(`
        SELECT * FROM T_POST_INTERACTION 
        WHERE POST_ID = ? AND OPENID = ? AND INTERACTION_TYPE = "LIKE"
      `, [postId, req.user.openid]);
      
      if (existingLike.length > 0) {
        // 取消点赞
        await db.query(`
          DELETE FROM T_POST_INTERACTION 
          WHERE POST_ID = ? AND OPENID = ? AND INTERACTION_TYPE = "LIKE"
        `, [postId, req.user.openid]);
        
        // 更新点赞数
        await db.query(`
          UPDATE T_COMMUNITY_POST 
          SET LIKE_COUNT = LIKE_COUNT - 1 
          WHERE POST_ID = ?
        `, [postId]);
        
        return res.json({
          code: 200,
          message: '取消点赞成功',
          data: { action: 'unlike' }
        });
      } else {
        // 添加点赞
        await db.query(`
          INSERT INTO T_POST_INTERACTION (
            INTERACTION_ID, POST_ID, OPENID, INTERACTION_TYPE, CREATE_TIME
          ) VALUES (?, ?, ?, ?, NOW())
        `, [interactionId, postId, req.user.openid, interactionType]);
        
        // 更新点赞数
        await db.query(`
          UPDATE T_COMMUNITY_POST 
          SET LIKE_COUNT = LIKE_COUNT + 1 
          WHERE POST_ID = ?
        `, [postId]);
        
        return res.json({
          code: 200,
          message: '点赞成功',
          data: { action: 'like', interactionId }
        });
      }
    } else if (interactionType === 'COMMENT') {
      // 添加评论
      await db.query(`
        INSERT INTO T_POST_INTERACTION (
          INTERACTION_ID, POST_ID, OPENID, INTERACTION_TYPE, 
          CONTENT, REPLY_TO, CREATE_TIME
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [interactionId, postId, req.user.openid, interactionType, content, replyTo]);
      
      // 更新评论数
      await db.query(`
        UPDATE T_COMMUNITY_POST 
        SET COMMENT_COUNT = COMMENT_COUNT + 1 
        WHERE POST_ID = ?
      `, [postId]);
      
      // 获取完整的评论信息
      const comment = await db.query(`
        SELECT pi.*, wu.NICKNAME as USER_NICKNAME, wu.HEAD_IMG_URL as USER_AVATAR
        FROM T_POST_INTERACTION pi
        LEFT JOIN T_WECHAT_USER wu ON pi.OPENID = wu.OPENID
        WHERE pi.INTERACTION_ID = ?
      `, [interactionId]);
      
      res.json({
        code: 200,
        message: '评论成功',
        data: {
          action: 'comment',
          interactionId,
          comment: comment[0]
        }
      });
    }
    
  } catch (error) {
    console.error('动态互动失败:', error);
    res.status(500).json({
      code: 500,
      message: '操作失败'
    });
  }
});

// 获取用户发布的动态
router.get('/my-posts', auth, async (req, res) => {
  try {
    const { page = 1, size = 10 } = req.query;
    const offset = (page - 1) * size;
    
    // 获取用户动态
    const posts = await db.query(`
      SELECT cp.*, up.PLANT_NAME, up.PLANT_TYPE
      FROM T_COMMUNITY_POST cp
      LEFT JOIN T_USER_PLANT up ON cp.PLANT_ID = up.PLANT_ID
      WHERE cp.OPENID = ? AND cp.STATUS = "PUBLISHED"
      ORDER BY cp.CREATE_TIME DESC
      LIMIT ? OFFSET ?
    `, [req.user.openid, parseInt(size), offset]);
    
    // 获取总数
    const totalResult = await db.query(`
      SELECT COUNT(*) as total FROM T_COMMUNITY_POST 
      WHERE OPENID = ? AND STATUS = "PUBLISHED"
    `, [req.user.openid]);
    
    const total = totalResult[0].total;
    
    res.json({
      code: 200,
      data: {
        posts,
        total,
        page: parseInt(page),
        size: parseInt(size),
        totalPages: Math.ceil(total / size)
      }
    });
    
  } catch (error) {
    console.error('获取用户动态失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户动态失败'
    });
  }
});

// 删除动态
router.delete('/post/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // 检查动态是否存在且属于当前用户
    const post = await db.query(`
      SELECT * FROM T_COMMUNITY_POST 
      WHERE POST_ID = ? AND OPENID = ?
    `, [postId, req.user.openid]);
    
    if (post.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '动态不存在'
      });
    }
    
    // 软删除动态
    await db.query(`
      UPDATE T_COMMUNITY_POST 
      SET STATUS = "DELETED", LAST_MODIFY_TIME = NOW()
      WHERE POST_ID = ?
    `, [postId]);
    
    res.json({
      code: 200,
      message: '动态删除成功'
    });
    
  } catch (error) {
    console.error('删除动态失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除动态失败'
    });
  }
});

module.exports = router;