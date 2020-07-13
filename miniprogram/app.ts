/// <reference path="../typings/index.d.ts" />

// app.js
App({
  // 全局变量
  globalData: {
    url_api: 'https://bjuthelper.applinzi.com/v2/',
    url_logo: 'https://bjuthelper.applinzi.com/assets/logo.svg',
    authorization: wx.getStorageSync('authorization3'),  // 用户唯一标识字段
    open: wx.getStorageSync('open'),
    student_id: wx.getStorageSync('student_id'),     // 学号
    unread: {},
    show_exam: false,
    show_courses: false,
    refreshCourses: false,
    map: {},
    exam_tab: 2,
    courses_tab: 3,
    backgroundFetchTimestamp: 0,
    redirect: {},
    sceneId: 0,
  } as IGlobalData,

  // 当小程序初始化完成（全局只触发一次）
  onLaunch: function(options) {
    const updateManager = wx.getUpdateManager()

    if (!this.globalData.authorization || !this.globalData.open || !this.globalData.student_id) {
      this.globalData.authorization = ''
      this.globalData.open = ''
      this.globalData.student_id = ''
    }

    if (updateManager && typeof updateManager.onUpdateReady === 'function') {
      updateManager.onUpdateReady(function() {
        setTimeout(updateManager.applyUpdate, 3000)
      })
    }

    wx.cloud.init({
      env: 'release-070996',
    })

    this.globalData.sceneId = options.scene

    wx.onUserCaptureScreen(() => {
      const pages = getCurrentPages()
      if (
        pages[pages.length - 1].route !== 'pages/entireClass/entireClass' &&
        pages[pages.length - 1].route !== 'pages/scoreDetailPage/scoreDetailPage'
      ) {
        return
      }
      console.warn('用户截屏了')
      wx.$request<any>({
        actions: false,
        success: (result) => {
          wx.showModal({
            title: result.title,
            content: result.content,
            showCancel: false,
            success: () => {
              wx.reLaunch({
                url: '/pages/login/login',
              })
            },
          })
        },
        path: 'screenshot',
        methods: 'POST',
        type: 'any',
      })
    })
  },
  // 当小程序启动/从后台进入前台显示
  onShow: function(options) {
    this.globalData.sceneId = options.scene
  },

  // 当小程序从前台进入后台
  onHide: function() {

  },

  // 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
  onError: function() {

  },
})

// @ts-ignore
Date.prototype.getWeek = function() {
  const firstDay = new Date(this.getFullYear(), 0, 1)
  return Math.ceil((((this - +firstDay) / 86400000) + firstDay.getDay() - 1) / 7)
}

Object.defineProperty(String.prototype, 'hashCode', {
  value: function() {
    let hash = 0
    for (let i = 0; i < this.length; i++) {
      const chr   = this.charCodeAt(i)
      hash  = ((hash << 5) - hash) + chr
      hash |= 0 // Convert to 32bit integer
    }
    return hash
  },
})

wx.$validateType = (data, type): boolean => {
  try {
    if (type === 'any') {
      return true
    }
    if (type !== 'overview' && typeof (data as IRespWithTime).time === 'undefined') {
      return false
    }
    if (!data) {
      return false
    }
    switch (type) {
      case 'overview':
        return Array.isArray( data ) && ((data as IOverview[]).length === 0 || typeof (data as IOverview[])[0].count === 'number')
      case 'term':
        return typeof (data as ITerms).current_year_term === 'string'
      case 'schedule':
        return Array.isArray( (data as ISchedule).list ) && ((data as ISchedule).list.length === 0 || typeof (data as ISchedule).list[0].courseSelectId === 'string')
      case 'exams':
        return Array.isArray( (data as IExams).list ) && ((data as IExams).list.length === 0 || typeof (data as IExams).list[0].name === 'string')
      case 'detail':
        return typeof (data as IDetail).count === 'number'
      case 'cets':
        return Array.isArray( (data as ICets).results ) && ((data as ICets).results.length === 0 || typeof (data as ICets).results[0].total === 'string')
      default:
        return false
    }
  } catch (e) {
    return false
  }
}

const logout = () => {
  wx.clearStorageSync()
  wx.setBackgroundFetchToken({
    token: '',
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
}

const error = (errors?: IApiError[], callback?: () => void) => {
  wx.hideLoading()
  if (typeof errors === 'undefined' || errors.length === 0 ) {
    wx.showModal({
      title: '无法连接到服务器，请检查网络',
      success: callback,
    })
  } else {
    wx.hideToast()
    for (const i of errors) {
      if (i.code === 1004 || i.code === 1005 || i.code === 1100) {
        logout()
        return
      }
    }
    wx.showModal({
      title: '错误' + errors.map((elem) => {
        return elem.code
      }).join('/'),
      content: errors.map((elem) => {
        return elem.message
      }).join(' '),
      showCancel: false,
      success: () => {
        for (const i of errors) {
          if (i.code >= 1000 && i.code < 2000) {
            logout()
            return
          } else if (i.code >= 500 && i.code < 600) {
            console.log('实时日志上报', i)
            console.error('后端服务器错误: ' + i.code)
          }
          const log = JSON.stringify({student_id: app.globalData.student_id, ...i})
          wx.getRealtimeLogManager().warn(log)
          wx.getLogManager({level: 0}).warn(log)
        }
        if (typeof callback === 'function') {
          callback()
        }
      },
    })
  }
}

wx.$validateTypeResp = <T>(resp, type, options): boolean => {
  let noneData
  let success
  let failed

  if (options && typeof options !== 'undefined' && options) {
    noneData = options.noneData
    success = options.success
    failed = options.failed
  }

  const message = (messages: string[]) => {
    if (messages.length === 0) {
      messages = ['暂时还没有数据，请过段时间再试']
    }
    wx.showToast({
      title: messages.join(' '),
      icon: 'none',
      duration: 3000,
    })
  }
  if (typeof resp === 'undefined' || !resp || typeof resp.success === 'undefined') {
    const log = JSON.stringify({student_id: app.globalData.student_id, type, resp})
    wx.getRealtimeLogManager().error('网络或接口错误', log)
    wx.getLogManager({level: 0}).warn('网络或接口错误', log)
    wx.showToast({
      title: '网络或接口错误',
      icon: 'none',
      duration: 3000,
    })
    return false
  }
  if (resp.success === true) {
    if (resp.errors.length > 0) {
      if (wx.$validateType(resp.result, type)) {
        success(resp.result, resp.messages, resp.errors)
        return true
      } else {
        error(resp.errors)
        return false
      }
    } else if (resp.result == null) {
      if (typeof noneData === 'function') {
        noneData()
      } else {
        message(resp.messages)
      }
    } else if (wx.$validateType(resp.result, type)) {
      if (typeof success === 'function') {
        success(resp.result, resp.messages)
      }
      return true
    } else {
      const log = JSON.stringify({student_id: app.globalData.student_id, type, resp})
      wx.getRealtimeLogManager().error('后端数据格式错误', log)
      wx.getLogManager({level: 0}).warn('后端数据格式错误', log)
      message(['后端数据格式错误'])
    }
  } else {
    error(resp.errors, () => {
      if (typeof failed === 'function') {
        failed(resp)
      }
    })
  }
  return false
}

wx.$request = <T>({actions, success, methods, noneData, failed, complete, path, type, data}) => {
  const url = app.globalData.url_api + (actions ? 'actions' : 'settings') + '/' + path + '?wechat_version=' + encodeURIComponent(JSON.stringify(wx.getAccountInfoSync()))

  return wx.request({
    url: url,
    method: methods,
    data,
    header: {
      Authorization: app.globalData.authorization,
      'X-Bjut-User': app.globalData.student_id,
      'X-Bjut-Open': app.globalData.open,
    },
    // @ts-ignore
    success: (res: IResp<IApi<T>>) => {
      if (res.statusCode === 609) {
        wx.showToast({
          title: '访问频率过快，请过段时间再试',
          icon: 'none',
          duration: 6000,
        })
      } else {
        // success 记录返回结果
        wx.$validateTypeResp(res.data, type, {noneData, failed, success})
      }
    },
    fail: (res) => {
      if (res.errMsg !== 'request:fail abort') {
        const log = JSON.stringify({student_id: app.globalData.student_id, ...res})
        wx.getRealtimeLogManager().warn(log)
        wx.getLogManager({level: 0}).warn(log)
        error([], () => {
          if (typeof failed === 'function') {
            failed(res)
          }
        })
      }
    },
    complete(res) {
      if (typeof complete === 'function') {
        complete(res)
      }
    },
  })
}

const addZero = function(value) {
  const s = value.toString()
  switch (s.length) {
    case 0:
      return '00'
    case 1:
      return '0' + s
    default:
      return s
  }
}

wx.$formatDate = function(time): string {
  if (typeof time === 'number') {
    if (time <= 0 || isNaN(time)) {
      return '从未'
    }
    const date = new Date(time * 1000)
    const seconds = (+new Date()) / 1000 - time
    if ( seconds <= 60 ) {
      return '一分钟内'
    } else if (seconds <= 3600) {
      return (seconds / 60).toFixed(0) + ' 分钟前'
    }
    const hh = addZero(date.getHours())
    const mm = addZero(date.getMinutes())
    if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
      return '今天 ' + hh + ':' + mm
    }
    const y = date.getFullYear().toString()
    const m = (date.getMonth() + 1).toString()
    const d = date.getDate().toString()
    if (y === new Date().getFullYear().toString()) {
      if (time + 604800 < +new Date() / 1000) {
        return m + '月' + d + '日'
      } else {
        return m + '月' + d + '日 ' + hh + ':' + mm
      }
    }
    return y + '年' + m + '月' + d + '日 '
  }
  return '从未'
}

wx.$base64 = function({
  url,
  type = 'png',
}) {
  return new Promise( (resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: url, // 选择图片返回的相对路径
      encoding: 'base64', // 编码格式
      success: res => {
        resolve('data:image/' + type.toLocaleLowerCase() + ';base64,' + res.data)
      },
      fail: res => reject(res.errMsg),
    })
  })
}

const app: IMyApp = getApp()

wx.$waterMark = function(/* that */) {
  // if (typeof app.globalData.background !== 'undefined' ) {
  //   that.setData({backgroundImg: app.globalData.background})
  //   return
  // }
  // let drawTitle = '未知用户'
  // let score
  // if (typeof app.globalData.scoreData !== 'undefined') {
  //   score = app.globalData.scoreData
  // } else {
  //   return
  // }
  // if (score && typeof score.result !== 'undefined' && typeof score.result.sid !== 'undefined') {
  //   drawTitle = score.result.sid + ' ' + score.result.name
  // }
  // console.log(drawTitle)
  // // 获取画布
  // const ctx = wx.createCanvasContext('waterMarkCanvas')
  // // 设置倾斜角度
  // ctx.rotate(-26 * Math.PI / 180)
  // // 设置水印字体字号
  // ctx.setFontSize(22)
  // // 设置色值，注意最后的透明度参数
  // ctx.setFillStyle('rgba(188, 188, 188, 0.25)')
  // // 绘制文字，注意左边和上面margin留一点，不然由于旋转会被遮挡
  // ctx.fillText(drawTitle, -24, 96)
  // ctx.draw()
  // console.log('延迟保存水印')
  // setTimeout(() => {
  //   wx.canvasToTempFilePath({
  //     x: 0,
  //     y: 0,
  //     width: 400,
  //     height: 100,
  //     // destWidth: 160,
  //     // destHeight: 160,
  //     quality: 0.7,
  //     canvasId: 'waterMarkCanvas',
  //     success: async (res) => {
  //       try {
  //         const backgroundImg = await wx.$base64({
  //           url: res.tempFilePath,
  //         })
  //         app.globalData.background = backgroundImg
  //         that.setData({backgroundImg: backgroundImg})
  //       } catch (error) {
  //         console.log(error)
  //       }
  //     },
  //   })
  // }, 0)
}

wx.$initTab = function(_this) {
  const tab_bar_grade = {
    'iconPath': '/icon/check-grade.png',
    'selectedIconPath': '/icon/check-grade-selected.png',
    'pagePath': '/pages/overAllPage/overAllPage',
    'text': '成绩',
  }

  const tab_bar_schedule = {
    'iconPath': '/icon/check-schedule.png',
    'selectedIconPath': '/icon/check-schedule-selected.png',
    'pagePath': '/pages/index/index',
    'text': '课表',
  }

  const tab_bar_exam = {
    'iconPath': '/icon/check-exam.png',
    'selectedIconPath': '/icon/check-exam-selected.png',
    'pagePath': '/pages/exam/exam',
    'text': '考试时间',
  }

  const tab_bar_courses = {
    'iconPath': '/icon/check-courses.png',
    'selectedIconPath': '/icon/check-courses-selected.png',
    'pagePath': '/pages/entireClass/entireClass',
    'text': '选课指导',
  }

  const tab_bar_list = [tab_bar_grade, tab_bar_schedule]
  app.globalData.show_exam = false
  app.globalData.show_courses = false
  app.globalData.exam_tab = 2
  app.globalData.courses_tab = 3

  let tab_bar_score: any = false
  if (
    typeof app.globalData !== 'undefined' && typeof app.globalData.scoreData !== 'undefined' &&
    typeof app.globalData.scoreData.result !== 'undefined' && typeof app.globalData.scoreData.result.current_year_term !== 'undefined'
  ) {
    if (app.globalData.scoreData.result.is_no_password) {
      if (typeof _this === 'undefined') {
        return tab_bar_list
      }
      _this.setData({list: tab_bar_list})
      return
    } else {
      tab_bar_score = app.globalData.scoreData.result
    }
  }
  if (!tab_bar_score) {
    const tab_bar = wx.getStorageSync('tab_bar')
    if (tab_bar) {
      const {show_exam, show_courses, exam_tab, courses_tab, list} = tab_bar
      if (typeof _this === 'undefined') {
        return list
      }
      _this.setData({list})
      app.globalData.show_exam = show_exam
      app.globalData.show_courses = show_courses
      app.globalData.exam_tab = exam_tab
      app.globalData.courses_tab = courses_tab
    } else {
      if (typeof _this === 'undefined') {
        return tab_bar_list
      }
      _this.setData({list: tab_bar_list})
    }
    return
  }

  if (
    typeof tab_bar_score.exam_week !== 'undefined'
    && typeof tab_bar_score.exam_week[tab_bar_score.current_year_term] !== 'undefined'
  ) {
    const week = tab_bar_score.exam_week[tab_bar_score.current_year_term]
    // @ts-ignore
    const currentWeek = new Date().getWeek()
    if (week[0] <= week[1]) {
      if (currentWeek >= week[0] && currentWeek <= week[1]) {
        tab_bar_list.push(tab_bar_exam)
        app.globalData.show_exam = true
      }
    } else {
      if (currentWeek >= week[0] || currentWeek <= week[1]) {
        tab_bar_list.push(tab_bar_exam)
        app.globalData.show_exam = true
      }
    }
  }

  if (
    typeof tab_bar_score.registration_week !== 'undefined'
    && typeof tab_bar_score.registration_week[tab_bar_score.current_year_term] !== 'undefined'
  ) {
    const week = tab_bar_score.registration_week[tab_bar_score.current_year_term]
    // @ts-ignore
    const currentWeek = new Date().getWeek()
    if (week[0] <= week[1]) {
      if (currentWeek >= week[0] && currentWeek <= week[1]) {
        tab_bar_list.push(tab_bar_courses)
        app.globalData.show_courses = true
      }
    } else {
      if (currentWeek >= week[0] || currentWeek <= week[1]) {
        tab_bar_list.push(tab_bar_courses)
        app.globalData.show_exam = true
        app.globalData.show_courses = true
      }
    }
  }
  if (!app.globalData.show_exam) {
    app.globalData.courses_tab = 2
    if (app.globalData.show_courses) {
      app.globalData.exam_tab = 3
    } else {
      app.globalData.exam_tab = 2
    }
  }

  if (typeof _this === 'undefined') {
    return tab_bar_list
  }
  _this.setData({list: tab_bar_list})
  wx.setStorageSync('tab_bar', {
    show_exam: app.globalData.show_exam,
    show_courses: app.globalData.show_courses,
    exam_tab: app.globalData.exam_tab,
    courses_tab: app.globalData.courses_tab,
    list: tab_bar_list,
  })
}

wx.$forCourses = (c: (IUngradedCourse|IGradedCourse)[], unread: { [courseId: string]: ICourse }, minor: boolean = false, all: boolean = true) => {
  let unreadCount = 0
  let credits = 0
  let pass = 0
  let passCredits = 0
  let gradedCredits = 0
  let ungraded = 0
  let unsubscribed = 0
  let nums = 0

  for (const i of c) {
    if (minor) {
      if (i.minor_maker !== '1' && i.minor_maker !== '2') {
        continue
      }
    } else if (!all) {
      if (i.minor_maker === '1' || i.minor_maker === '2') {
        continue
      }
    }
    nums++
    if (i.unread) {
      ++unreadCount
    }
    unread[i.year + '-' + i.term + '-' + i.id] = i

    if (i.type !== '第二课堂') {
      credits += parseFloat(i.credit)
      if ( i.score === '通过' || parseFloat(String(i.score)) >= 60 ) {
        ++pass
        passCredits += parseFloat(i.credit)
        gradedCredits += parseFloat(i.credit)
      } else if ( i.score === '不通过' || parseFloat(String(i.score)) >= 0 ) {
        gradedCredits += parseFloat(i.credit)
      }
    }
    if (i.score < 0 && i.score !== -3) {
      ++ungraded
    }
    if (i.score === -1 && typeof app.globalData.map['courseSelectId' in i ? i.courseSelectId : 'undefined'] === 'undefined') {
      ++unsubscribed
    }
  }
  return {unreadCount, credits, pass, ungraded, unsubscribed, passCredits, gradedCredits, nums}
}

wx.$getTypeOrder = (type: string): number => {
  const types = {
    '近期出分课程': -1,
    '已出分课程': 0,
    '未订阅课程': 1,
    '已订阅课程': 2,
    '未出分课程': 2,
    '公共基础必修课': 3,
    '学科基础必修课': 4,
    '实践环节必修课': 5,
    '学科基础选修课': 6,
    '专业任选课': 7,
    '专业限选课': 8,
    '实践环节选修课': 9,
    '通识教育选修课': 10,
    '体育课': 11,
    '外语选修课': 50,
    '通识教育任意选修': 51,
    '经济管理选修课': 52,
    '数学与自然科学选修课': 53,
    '经管文法艺术类选修课': 54,
    '工程自然类选修课': 55,
    '校选修课': 60,
    '实践环节（辅）': Number.MAX_SAFE_INTEGER - 98,
    '学科基础必修课（辅）': Number.MAX_SAFE_INTEGER - 97,
    '专业必修课（辅）': Number.MAX_SAFE_INTEGER - 96,
    '新生研讨课': Number.MAX_SAFE_INTEGER - 1,
    '第二课堂': Number.MAX_SAFE_INTEGER,
  }
  if (typeof type === 'undefined' || typeof types[type] === 'undefined') {
    return Number.MAX_SAFE_INTEGER - 100
  }
  return types[type]
}
export {}
