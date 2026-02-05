const qiniu = require('qiniu');

class QiniuService {
  constructor() {
    this.accessKey = process.env.QINIU_ACCESS_KEY;
    this.secretKey = process.env.QINIU_SECRET_KEY;
    this.bucket = process.env.QINIU_BUCKET || 'plant-care';
    this.domain = process.env.QINIU_DOMAIN; // 你的七牛云域名
    
    if (this.accessKey && this.secretKey) {
      this.mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey);
      this.config = new qiniu.conf.Config();
      this.config.zone = qiniu.zone.Zone_z0; // 华东区域
      this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
      this.formUploader = new qiniu.form_up.FormUploader(this.config);
    }
  }
  
  // 生成上传token
  generateUploadToken(key = null) {
    if (!this.mac) {
      throw new Error('七牛云配置未完成');
    }
    
    const options = {
      scope: key ? `${this.bucket}:${key}` : this.bucket,
      expires: 3600, // 1小时过期
      returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}'
    };
    
    const putPolicy = new qiniu.rs.PutPolicy(options);
    return putPolicy.uploadToken(this.mac);
  }
  
  // 上传图片
  async uploadImage(imageBuffer, key) {
    return new Promise((resolve, reject) => {
      if (!this.formUploader) {
        reject(new Error('七牛云配置未完成'));
        return;
      }
      
      const token = this.generateUploadToken(key);
      const putExtra = new qiniu.form_up.PutExtra();
      
      this.formUploader.put(token, key, imageBuffer, putExtra, (err, body, info) => {
        if (err) {
          reject(err);
        } else if (info.statusCode === 200) {
          resolve({
            key: body.key,
            hash: body.hash,
            size: body.fsize,
            url: this.getPublicUrl(body.key)
          });
        } else {
          reject(new Error(`上传失败: ${info.statusCode}`));
        }
      });
    });
  }
  
  // 上传Base64图片
  async uploadBase64(base64Data, key) {
    return new Promise((resolve, reject) => {
      if (!this.formUploader) {
        reject(new Error('七牛云配置未完成'));
        return;
      }
      
      // 移除base64前缀
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      
      this.uploadImage(buffer, key)
        .then(resolve)
        .catch(reject);
    });
  }
  
  // 获取公开访问URL
  getPublicUrl(key) {
    if (!this.domain) {
      return `http://${this.bucket}.qiniudn.com/${key}`;
    }
    return `http://${this.domain}/${key}`;
  }
  
  // 获取私有访问URL
  getPrivateUrl(key, expires = 3600) {
    if (!this.mac || !this.domain) {
      throw new Error('七牛云配置未完成');
    }
    
    const baseUrl = `http://${this.domain}/${key}`;
    return qiniu.util.privateDownloadUrl(this.mac, baseUrl, expires);
  }
  
  // 删除文件
  async deleteFile(key) {
    return new Promise((resolve, reject) => {
      if (!this.bucketManager) {
        reject(new Error('七牛云配置未完成'));
        return;
      }
      
      this.bucketManager.delete(this.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else if (respInfo.statusCode === 200) {
          resolve({ success: true });
        } else {
          reject(new Error(`删除失败: ${respInfo.statusCode}`));
        }
      });
    });
  }
  
  // 获取文件信息
  async getFileInfo(key) {
    return new Promise((resolve, reject) => {
      if (!this.bucketManager) {
        reject(new Error('七牛云配置未完成'));
        return;
      }
      
      this.bucketManager.stat(this.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
        } else if (respInfo.statusCode === 200) {
          resolve(respBody);
        } else {
          reject(new Error(`获取文件信息失败: ${respInfo.statusCode}`));
        }
      });
    });
  }
  
  // 生成缩略图URL
  generateThumbnailUrl(key, width = 200, height = 200) {
    const baseUrl = this.getPublicUrl(key);
    return `${baseUrl}?imageView2/1/w/${width}/h/${height}/q/85`;
  }
  
  // 图片处理
  generateProcessedUrl(key, operations) {
    const baseUrl = this.getPublicUrl(key);
    return `${baseUrl}?${operations}`;
  }
}

module.exports = new QiniuService();