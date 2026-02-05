import api from '../../utils/api'

const state = {
  isLogin: false,
  userInfo: null,
  token: localStorage.getItem('token') || null
}

const mutations = {
  SET_LOGIN_STATUS(state, status) {
    state.isLogin = status
  },
  
  SET_USER_INFO(state, userInfo) {
    state.userInfo = userInfo
  },
  
  SET_TOKEN(state, token) {
    state.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  },
  
  LOGOUT(state) {
    state.isLogin = false
    state.userInfo = null
    state.token = null
    localStorage.removeItem('token')
  }
}

const actions = {
  // 检查登录状态
  async checkLoginStatus({ commit, state }) {
    if (state.token) {
      try {
        const response = await api.get('/user/profile')
        if (response.code === 200) {
          commit('SET_LOGIN_STATUS', true)
          commit('SET_USER_INFO', response.data)
        } else {
          commit('LOGOUT')
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
        commit('LOGOUT')
      }
    }
  },
  
  // 微信登录
  async wechatLogin({ commit }, { openid, nickname, avatar }) {
    try {
      const response = await api.post('/user/wechat-login', {
        openid,
        nickname,
        avatar
      })
      
      if (response.code === 200) {
        const { token, userInfo } = response.data
        commit('SET_TOKEN', token)
        commit('SET_USER_INFO', userInfo)
        commit('SET_LOGIN_STATUS', true)
        return { success: true }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      return { success: false, message: error.message }
    }
  },
  
  // 退出登录
  logout({ commit }) {
    commit('LOGOUT')
  },
  
  // 更新用户信息
  async updateProfile({ commit }, profileData) {
    try {
      const response = await api.put('/user/profile', profileData)
      if (response.code === 200) {
        commit('SET_USER_INFO', response.data)
        return { success: true }
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { success: false, message: error.message }
    }
  }
}

const getters = {
  isLogin: state => state.isLogin,
  userInfo: state => state.userInfo,
  token: state => state.token
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}