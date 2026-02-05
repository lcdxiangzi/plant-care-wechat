import wx from 'weixin-js-sdk'
import api from './api'

// 微信JS-SDK配置
export async function initWechatSDK() {
  try {
    // 获取微信JS-SDK配置
    const response = await api.get('/wechat/js-config', {
      params: {
        url: window.location.href.split('#')[0]
      }
    })
    
    if (response.code === 200) {
      const config = response.data
      
      wx.config({
        debug: false, // 生产环境设为false
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: [
          'chooseImage',
          'previewImage',
          'uploadImage',
          'downloadImage',
          'getLocation',
          'openLocation',
          'scanQRCode',
          'chooseWXPay',
          'updateAppMessageShareData',
          'updateTimelineShareData'
        ]
      })
      
      wx.ready(() => {
        console.log('微信JS-SDK初始化成功')
        
        // 设置分享信息
        setShareInfo()
      })
      
      wx.error((res) => {
        console.error('微信JS-SDK初始化失败:', res)
      })
    }
  } catch (error) {
    console.error('获取微信JS-SDK配置失败:', error)
  }
}

// 设置分享信息
function setShareInfo() {
  const shareData = {
    title: '植物养护助手',
    desc: '用AI帮你识别植物，记录养护过程，与植友分享经验',
    link: window.location.origin,
    imgUrl: `${window.location.origin}/logo.png`
  }
  
  // 分享给朋友
  wx.updateAppMessageShareData(shareData)
  
  // 分享到朋友圈
  wx.updateTimelineShareData(shareData)
}

// 选择图片
export function chooseImage(options = {}) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: options.count || 1,
      sizeType: options.sizeType || ['original', 'compressed'],
      sourceType: options.sourceType || ['album', 'camera'],
      success: (res) => {
        resolve(res.localIds)
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}

// 预览图片
export function previewImage(current, urls) {
  wx.previewImage({
    current: current,
    urls: urls
  })
}

// 上传图片
export function uploadImage(localId) {
  return new Promise((resolve, reject) => {
    wx.uploadImage({
      localId: localId,
      isShowProgressTips: 1,
      success: (res) => {
        resolve(res.serverId)
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}

// 获取地理位置
export function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          speed: res.speed,
          accuracy: res.accuracy
        })
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}

// 扫描二维码
export function scanQRCode() {
  return new Promise((resolve, reject) => {
    wx.scanQRCode({
      needResult: 1,
      scanType: ["qrCode", "barCode"],
      success: (res) => {
        resolve(res.resultStr)
      },
      fail: (error) => {
        reject(error)
      }
    })
  })
}

// 检查是否在微信环境
export function isWechatEnv() {
  return /micromessenger/i.test(navigator.userAgent)
}

// 微信授权登录
export function wechatLogin() {
  if (!isWechatEnv()) {
    throw new Error('请在微信中打开')
  }
  
  // 跳转到微信授权页面
  window.location.href = '/api/wechat/oauth/authorize'
}