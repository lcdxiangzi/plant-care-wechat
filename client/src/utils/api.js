import axios from 'axios'
import { Toast } from 'vant'
import store from '../store'
import router from '../router'

// 创建axios实例
const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 显示加载状态
    store.dispatch('setLoading', true)
    
    // 添加token
    const token = store.state.user.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    store.dispatch('setLoading', false)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    store.dispatch('setLoading', false)
    
    const { code, message, data } = response.data
    
    // 成功响应
    if (code === 200) {
      return { code, message, data }
    }
    
    // 业务错误
    if (code === 401) {
      // 未授权，清除登录状态
      store.dispatch('user/logout')
      router.push('/login')
      Toast.fail('登录已过期，请重新登录')
    } else {
      Toast.fail(message || '请求失败')
    }
    
    return Promise.reject(new Error(message || '请求失败'))
  },
  error => {
    store.dispatch('setLoading', false)
    
    let message = '网络错误'
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          message = data.message || '请求参数错误'
          break
        case 401:
          message = '未授权访问'
          store.dispatch('user/logout')
          router.push('/login')
          break
        case 403:
          message = '禁止访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = data.message || `请求失败 (${status})`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    } else if (error.message === 'Network Error') {
      message = '网络连接失败'
    }
    
    Toast.fail(message)
    return Promise.reject(error)
  }
)

export default api