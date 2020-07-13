/// <reference path="../../../typings/index.d.ts" />

const app: IMyApp = getApp()

Page({
  data: {
    logged_in: false,
    share_score: true,
    show_exam: true,
    show_courses: true,
    switches: {},
    messages: undefined,
    open_status: undefined,
    status_messages: undefined,

    showActionsheet: false,
    groups: [],
    actionSheetTitle: undefined,
    is_no_password: false,
    finished: false,
  },

  onLoad: function(options) {
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 6000,
    })
    wx.$request({
      path: 'more',
      actions: false,
      methods: 'GET',
      type: 'any',
      success: (result: any) => {
        this.setData({
          messages: result.more_messages,
          footer: result.footer_messages,
          open_status: result.open_status,
          status_messages: result.status_messages,
          finished: true,
        })
        wx.hideToast()
      },
      failed: () => {
        wx.navigateBack()
      },
    })
    if (options.logged_in) {
      this.setData({logged_in: true})
    } else {
      this.setData({logged_in: false})
    }
  },

  onShow: function() {
    if (
      app.globalData.scoreData && typeof app.globalData.scoreData.result !== 'undefined' && wx.$validateType(app.globalData.scoreData.result, 'term')
    ) {
      this.setData({
        share_score: app.globalData.scoreData.result.share_score,
        switches: app.globalData.scoreData.result.switches,
        is_no_password: app.globalData.scoreData.result.is_no_password,
      })
    }
    this.setData({
      show_exam: app.globalData.show_exam,
      show_courses: app.globalData.show_courses,
    })
  },

  bindtapHandeler: function(e) {
    switch (e.currentTarget.dataset.from) {
      case 'CET':
        wx.navigateTo({
          url: '/pages/CET/CET',
        })
        break

      case 'exam':
        wx.switchTab({
          url: '/pages/exam/exam',
        })
        break

      case 'entireClass':
        wx.switchTab({
          url: '/pages/entireClass/entireClass',
        })
        break

      default:
        break
    }
  },

  cancel: function() {
    this.setData({
      showActionsheet: true,
      actionSheetTitle: '此操作会删除本地所有数据，但不会撤销授权。你将需要重新登录',
      groups: [
        { text: '确认退出登录', type: 'warn', value: 1 },
      ],
    })
  },

  demo: function() {
    app.globalData.student_id = this.data.status_messages.demo.id
    app.globalData.authorization = this.data.status_messages.demo.authentication
    wx.setBackgroundFetchToken({ token: '0' })
    wx.clearStorageSync()
    wx.switchTab({
      url: '/pages/overAllPage/overAllPage',
    })
  },

  close: function() {
    this.setData({
      showActionsheet: false,
    })
  },

  btnClick: function(e) {
    switch (e.detail.value) {
      case 1:
        wx.clearStorageSync()
        wx.setBackgroundFetchToken({
          token: '0',
        })
        app.globalData = {
          sceneId: app.globalData.sceneId,
          url_logo: app.globalData.url_logo,
          url_api: app.globalData.url_api,
          background: undefined, schedule: undefined,
          scoreData: undefined, authorization: null,
          student_id: null, unread: {},
          show_exam: false, show_courses: false,
          refreshCourses: false, map: {},
          exam_tab: 2, courses_tab: 3,
          backgroundFetchTimestamp: 0,
          redirect: {},
        }
        wx.reLaunch({
          url: '/pages/login/login',
        })
        break
      case 2:
        wx.showToast({
          title: '取消中',
          icon: 'loading',
          duration: 6000,
        })
        wx.$request({
          path: 'share_score',
          actions: false,
          methods: 'DELETE',
          type: 'any',
          success: (resp: null, messages) => {
            this.onLoad()
            let title = '已经取消共享'
            let content = '你的分数已经被删除，分数订阅已经取消'
            if (messages.length > 0) {
              title = messages[0]
            }
            if (messages.length > 1) {
              content = messages[1]
            }
            wx.showModal({
              title: title,
              content: content,
              showCancel: false,
              success: () => {
                if (
                  typeof app.globalData.scoreData !== 'undefined' && typeof app.globalData.scoreData.result !== 'undefined' &&
                  typeof app.globalData.scoreData.result.share_score !== 'undefined'
                ) {
                  app.globalData.scoreData.result.share_score = false
                }
                wx.setStorageSync('share_score', false)
                this.setData({share_score: false})
                app.globalData.refreshCourses = true
                wx.pageScrollTo({
                  scrollTop: 0,
                  duration: 0,
                })
                wx.hideToast()
              },
            })
          },
        })
        break
      case 3:
        wx.showToast({
          title: '重置中',
          icon: 'loading',
          duration: 6000,
        })
        wx.cloud.callFunction({
          name: 'common',
          data: {
            action: 'subscribe',
            courseId: 'RESET',
            userId: app.globalData.student_id,
            auth: app.globalData.authorization,
          },
          success: (obj: any) => {
            const res = {data: obj.result}
            if (res.data.success) {
              wx.showToast({
                title: '重置成功',
                icon: 'success',
                duration: 500,
              })
              this.onLoad()
              app.globalData.scoreData.result.has_open = true
              wx.pageScrollTo({
                scrollTop: 0,
                duration: 0,
              })
            } else {
              wx.hideToast()
              wx.showModal({
                title: '重置失败',
                content: res.data.errors.join('\n'),
                showCancel: false,
              })
            }
          },
          fail: function() {
            wx.showModal({
              title: '无法连接到服务器，请检查网络',
              showCancel: false,
            })
          },
        })
        break
      default:
    }
    this.close()
  },

  optIn: function() {
    wx.navigateTo({
      url: '/pages/scoreDetailPage/scoreDetailPage?id=0007929',
    })
  },

  optOut: function() {
    this.setData({
      showActionsheet: true,
      actionSheetTitle: '此操作会删除你的分数和微信绑定。毕业后教务账号会被学校回收，撤销将导致毕业后再也无法使用此程序',
      groups: [
        { text: '确认撤销授权', type: 'warn', value: 2 },
      ],
    })
  },

  resetSubscribe: function() {
    this.setData({
      showActionsheet: true,
      actionSheetTitle: '此操作会重置所有订阅并重新绑定微信号',
      groups: [
        { text: '确认重置订阅', type: 'warn', value: 3 },
      ],
    })
  },
  connectAccount: function() {
    this.btnClick({
      detail: {
        value: 3,
      },
    })
  },
  cancelNoWarning: function() {
    this.btnClick({
      detail: {
        value: 1,
      },
    })
  },
})

export {}
