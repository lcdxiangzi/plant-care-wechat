const cloudinary = require('cloudinary').v2;

class UploadService {
  constructor() {
    // 配置Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
  
  // 上传图片到Cloudinary
  async uploadImage(imageData, options = {}) {
    try {
      const defaultOptions = {
        folder: 'plant-care',
        resource_type: 'image',
        format: 'jpg',
        quality: 'auto:good',
        fetch_format: 'auto'
      };
      
      const uploadOptions = { ...defaultOptions, ...options };
      
      // 如果是base64数据
      if (typeof imageData === 'string' && imageData.startsWith('data:')) {
        const result = await cloudinary.uploader.upload(imageData, uploadOptions);
        return result;
      }
      
      // 如果是URL
      if (typeof imageData === 'string' && (imageData.startsWith('http') || imageData.startsWith('https'))) {
        const result = await cloudinary.uploader.upload(imageData, uploadOptions);
        return result;
      }
      
      // 如果是文件buffer
      if (Buffer.isBuffer(imageData)) {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(imageData);
        });
      }
      
      throw new Error('不支持的图片数据格式');
      
    } catch (error) {
      console.error('图片上传失败:', error);
      throw error;
    }
  }
  
  // 删除图片
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('图片删除失败:', error);
      throw error;
    }
  }
  
  // 生成缩略图URL
  generateThumbnailUrl(publicId, options = {}) {
    const defaultOptions = {
      width: 200,
      height: 200,
      crop: 'fill',
      quality: 'auto:good',
      fetch_format: 'auto'
    };
    
    const transformOptions = { ...defaultOptions, ...options };
    
    return cloudinary.url(publicId, transformOptions);
  }
  
  // 批量上传图片
  async uploadMultipleImages(imageDataArray, options = {}) {
    try {
      const uploadPromises = imageDataArray.map((imageData, index) => {
        const imageOptions = {
          ...options,
          public_id: options.public_id ? `${options.public_id}_${index}` : undefined
        };
        return this.uploadImage(imageData, imageOptions);
      });
      
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('批量上传失败:', error);
      throw error;
    }
  }
  
  // 图片处理和优化
  async processImage(publicId, transformations = {}) {
    try {
      const defaultTransformations = {
        quality: 'auto:good',
        fetch_format: 'auto'
      };
      
      const finalTransformations = { ...defaultTransformations, ...transformations };
      
      return cloudinary.url(publicId, finalTransformations);
    } catch (error) {
      console.error('图片处理失败:', error);
      throw error;
    }
  }
  
  // 获取图片信息
  async getImageInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error('获取图片信息失败:', error);
      throw error;
    }
  }
}

module.exports = new UploadService();