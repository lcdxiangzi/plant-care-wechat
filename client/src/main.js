import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Vant UI组件库
import Vant from 'vant'
import 'vant/lib/index.css'

// 移动端适配
import '@vant/touch-emulator'

// 全局样式
import './styles/global.scss'

// 微信JS-SDK
import wx from 'weixin-js-sdk'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(Vant)

// 全局配置微信JS-SDK
app.config.globalProperties.$wx = wx

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info)
}

app.mount('#app')

// 微信环境检测和初始化
if (typeof window !== 'undefined') {
  // 检测是否在微信环境
  const isWechat = /micromessenger/i.test(navigator.userAgent)
  
  if (isWechat) {
    // 初始化微信JS-SDK
    import('./utils/wechat').then(({ initWechatSDK }) => {
      initWechatSDK()
    })
  }
  
  // 禁用页面缩放
  document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
      event.preventDefault()
    }
  })
  
  let lastTouchEnd = 0
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, false)
}