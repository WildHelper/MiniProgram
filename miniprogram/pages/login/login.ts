/// <reference path="../../../typings/index.d.ts" />

const app: IMyApp = getApp()

Page({
  data: {
    count: '',
    password: '',
    showClearBtn: false,
    isWaring: false,
    isLoggedIn: true,
    url_logo: app.globalData.url_logo,
    message: '',
  },

  // 登陆表单数据处理-用户名输入框变更
  onInputCount(evt) {
    const count = evt.detail.value
    this.data.count = count
    this.setData({
      showClearBtnCount: !!count.length,
      isWaring: false,
    })

  },
  // 登陆表单数据处理-密码输入框变更
  onInputPassword(evt) {
    const password = evt.detail.value
    this.data.password = password
    this.setData({
      showClearBtnPassword: !!password.length,
      isWaring: false,
    })

  },
  // 登陆表单数据处理-用户名输入框清空
  onClearCount() {
    this.setData({
      count: '',
      showClearBtnCount: false,
      isWaring: false,
    })
  },
  // 登陆表单数据处理-密码输入框清空
  onClearPassword() {
    this.setData({
      password: '',
      showClearBtnPassword: false,
      isWaring: false,
    })
  },

  // 确定按钮处理
  onConfirm() {
    // 用户名格式不正确时，warning效果的判定
    if (this.data.count.length !== 8) {
      this.setData({
        isWaring: true,
      })
    }

    wx.showLoading({
      title: '登录中',
    })
    wx.login({
      success: (res) => {
        wx.$request<any>({
          actions: false,
          methods: 'POST',
          data: {
            'no': this.data.count,
            'pass': this.data.password,
            'code': res.code,
          },
          path: 'login',
          success: wx.$loginSuccess,
          type: 'any',
        })
      },
    })
  },

  onLoad: function(options) {
    if (typeof options !== 'undefined' && options.year && options.term && options.courseId) {
      app.globalData.redirect = {
        year: options.year,
        term: options.term,
        courseId: options.courseId,
      }
    }

    if (!app.globalData.authorization || !app.globalData.open || !app.globalData.student_id) {
      app.globalData.authorization = ''
      app.globalData.open = ''
      app.globalData.student_id = ''
    }

    let version = '-1'
    if (options.version) {
      version = options.version
      wx.setStorageSync('version', version)
    } else {
      const getVersion = wx.getStorageSync('version')
      if (getVersion) {
        version = getVersion
      }
    }

    wx.$request<any>({
      actions: false,
      methods: 'GET',
      path: 'endpoint/' + version,
      type: 'any',
      success: (resp) => {
        app.globalData.url_api = resp.default.url
        const complete = () => {
          this.setData({message: resp.default.message})
          if (app.globalData.student_id && app.globalData.authorization && app.globalData.open) {
            wx.getBackgroundFetchToken({
              complete: (res: any) => {
                if (res.errMsg !== 'getBackgroundFetchToken:ok' || res.token !== app.globalData.authorization) {
                  wx.setBackgroundFetchToken({
                    token: app.globalData.authorization,
                    complete: () => {
                      wx.switchTab({
                        url: '/pages/overAllPage/overAllPage',
                      })
                    },
                  })
                } else {
                  wx.switchTab({
                    url: '/pages/overAllPage/overAllPage',
                  })
                }
              },
            })
          } else {
            app.globalData.authorization = ''
            app.globalData.open = ''
            app.globalData.student_id = ''
            this.setData( { isLoggedIn: false } )
          }
        }
        if (resp.default.trusted) {
          wx.setEnableDebug({
            enableDebug: false,
            complete,
          })
        } else {
          wx.setEnableDebug({
            enableDebug: true,
            complete,
          })
        }
      },
    })
  },

  onShareAppMessage: function() {
    return {
      title: '快来查分啦',
      path: '/pages/login/login',
    }
  },

  morePage: function() {
    wx.navigateTo({
      url: '/pages/more/more',
    })
  },
})

export {}
