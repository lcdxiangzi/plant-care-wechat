const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const uploadService = require('../services/uploadService');

const router = express.Router();

// 配置multer用于处理文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// 单张图片上传
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的图片'
      });
    }
    
    const { type = 'general' } = req.body;
    
    // 根据类型设置上传选项
    const uploadOptions = {
      folder: `plant-care/${type}`,
      public_id: `${type}_${req.user.openid}_${Date.now()}`,
      transformation: [
        { width: 1024, height: 1024, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };
    
    // 上传到Cloudinary
    const result = await uploadService.uploadImage(req.file.buffer, uploadOptions);
    
    // 生成缩略图URL
    const thumbnailUrl = uploadService.generateThumbnailUrl(result.public_id, {
      width: 200,
      height: 200,
      crop: 'fill'
    });
    
    res.json({
      code: 200,
      message: '图片上传成功',
      data: {
        imageUrl: result.secure_url,
        thumbnailUrl: thumbnailUrl,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });
    
  } catch (error) {
    console.error('图片上传失败:', error);
    
    if (error.message === '只允许上传图片文件') {
      return res.status(400).json({
        code: 400,
        message: error.message
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '图片上传失败'
    });
  }
});

// 多张图片上传
router.post('/images', auth, upload.array('images', 9), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的图片'
      });
    }
    
    const { type = 'general' } = req.body;
    
    const uploadPromises = req.files.map((file, index) => {
      const uploadOptions = {
        folder: `plant-care/${type}`,
        public_id: `${type}_${req.user.openid}_${Date.now()}_${index}`,
        transformation: [
          { width: 1024, height: 1024, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      };
      
      return uploadService.uploadImage(file.buffer, uploadOptions);
    });
    
    const results = await Promise.all(uploadPromises);
    
    const imageData = results.map(result => ({
      imageUrl: result.secure_url,
      thumbnailUrl: uploadService.generateThumbnailUrl(result.public_id, {
        width: 200,
        height: 200,
        crop: 'fill'
      }),
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    }));
    
    res.json({
      code: 200,
      message: '图片上传成功',
      data: {
        images: imageData,
        count: imageData.length
      }
    });
    
  } catch (error) {
    console.error('批量图片上传失败:', error);
    res.status(500).json({
      code: 500,
      message: '图片上传失败'
    });
  }
});

// Base64图片上传
router.post('/base64', auth, async (req, res) => {
  try {
    const { imageData, type = 'general' } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        code: 400,
        message: '图片数据不能为空'
      });
    }
    
    // 验证base64格式
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({
        code: 400,
        message: '无效的图片数据格式'
      });
    }
    
    const uploadOptions = {
      folder: `plant-care/${type}`,
      public_id: `${type}_${req.user.openid}_${Date.now()}`,
      transformation: [
        { width: 1024, height: 1024, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };
    
    const result = await uploadService.uploadImage(imageData, uploadOptions);
    
    const thumbnailUrl = uploadService.generateThumbnailUrl(result.public_id, {
      width: 200,
      height: 200,
      crop: 'fill'
    });
    
    res.json({
      code: 200,
      message: '图片上传成功',
      data: {
        imageUrl: result.secure_url,
        thumbnailUrl: thumbnailUrl,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });
    
  } catch (error) {
    console.error('Base64图片上传失败:', error);
    res.status(500).json({
      code: 500,
      message: '图片上传失败'
    });
  }
});

// 删除图片
router.delete('/image/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // 验证publicId格式，确保只能删除用户自己的图片
    if (!publicId.includes(req.user.openid)) {
      return res.status(403).json({
        code: 403,
        message: '无权删除此图片'
      });
    }
    
    const result = await uploadService.deleteImage(publicId);
    
    res.json({
      code: 200,
      message: '图片删除成功',
      data: result
    });
    
  } catch (error) {
    console.error('图片删除失败:', error);
    res.status(500).json({
      code: 500,
      message: '图片删除失败'
    });
  }
});

// 获取图片信息
router.get('/image/:publicId/info', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const imageInfo = await uploadService.getImageInfo(publicId);
    
    res.json({
      code: 200,
      data: {
        publicId: imageInfo.public_id,
        url: imageInfo.secure_url,
        width: imageInfo.width,
        height: imageInfo.height,
        format: imageInfo.format,
        size: imageInfo.bytes,
        createdAt: imageInfo.created_at
      }
    });
    
  } catch (error) {
    console.error('获取图片信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取图片信息失败'
    });
  }
});

module.exports = router;