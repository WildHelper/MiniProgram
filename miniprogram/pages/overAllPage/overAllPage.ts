/// <reference path="../../../typings/index.d.ts" />

const app: IMyApp = getApp()

Page({
  data: {
    name: null,       // 姓名
    institute: null,  // 学院
    sid: null,        // 学号
    major: null,      // 专业
    first_semester: '9999-9999-9',

    totalGPA: null,          // 总成绩-GPA
    totalScore: null,        // 总成绩-加权平均分
    totalNums: null,         // 总成绩-已出课程数
    passRate_total: null,    // 总成绩-通过率
    totalCredit_total: null, // 总成绩-总学分
    passCredit_total: null,  // 总成绩-通过学分
    totalUnread: 0,          // 总成绩-未读
    totalUngraded: 0,        // 总成绩-未出分

    minorGPA: null,
    minorScore: null,
    minorNums: null,
    minorUngraded: null,
    passRate_minor: null,
    totalCredit_minor: null,
    passCredit_minor: null,

    term: [],
    termNums: 0,

    success: 0,
    fail: false,
    messages: [],
    time: null,
    share_score: false,
    has_open: false,
    is_no_password: false,
    sceneId: app.globalData.sceneId,
  },
  time: 0,
  request: undefined,
  timeoutId: undefined,

  onLoad: function() {
    if (app.globalData.sceneId === 1154) {
      this.setData( { success: 3 } )
      return
    }
    wx.setNavigationBarTitle({
      title: '成绩总览',
    })
    if (app.globalData.sceneId === 1155) {
      const authorization = wx.getStorageSync('authorization3')
      const student_id = wx.getStorageSync('student_id')
      const open = wx.getStorageSync('open')
      if (authorization && student_id && open) {
        app.globalData.authorization = authorization
        app.globalData.student_id = student_id
        app.globalData.open = open
      } else {
        wx.reLaunch({
          url: '/pages/login/login',
        })
        return
      }
    }

    // 通过api获取分数信息
    this.setData( { success: 0 } )

    wx.showToast({
      title: '更新成绩中',
      icon: 'loading',
      duration: 6000,
    })
    if (typeof app.globalData.redirect !== 'undefined' && typeof app.globalData.redirect.term !== 'undefined' && typeof app.globalData.redirect.year !== 'undefined') {
      this.fetchData()
    } else {
      const score: IApi<ITerms> = wx.getStorageSync('score')
      if (score && wx.$validateType(score.result, 'term') && !score.result.is_no_password) {
        this.time = score.result.updated_time
        app.globalData.scoreData = score
        this.setData({messages: score.messages, time: wx.$formatDate(score.result.time), course_time: wx.$formatDate(app.globalData.scoreData.result.course_time)})
        this.scoreSparser(score.result)
        // 不是基础库 2.12.0，直接再发一次请求
        if (!wx.canIUse('updateWeChatApp')) {
          this.time = +new Date() / 1000
          this.fetchData()
        } else {
          wx.showToast({
            title: '等待预拉取中',
            icon: 'loading',
            duration: 3000,
          })
          this.timeoutId = setTimeout(() => {
            if (typeof this.request === 'undefined') {
              wx.showToast({
                title: '重试中',
                icon: 'loading',
                duration: 6000,
              })
              this.fetchData()
            }
          }, 3000)
        }
        this.setBackgroundFetch()
      } else {
        this.time = +new Date() / 1000
        this.fetchData()
      }
    }

    // @ts-ignore
    // TODO: Typings 错误
    wx.onBackgroundFetchData((res) => {
      console.log('onBackgroundFetchData接收到数据')
      this.parseFetchData(res)
    })
  },

  setBackgroundFetch: function() {
    wx.getBackgroundFetchData({
      fetchType: 'pre',
      success: this.parseFetchData,
      fail: () => {
        this.fetchData()
      },
    })
  },

  parseFetchData: function(res: IFetchCallback) {
    if (res && (res.errMsg === 'getBackgroundFetchData:ok' || res.errMsg === 'onBackgroundFetchData:ok')) {
      const {fetchedData} = res
      let parsedData: IApi<{score: ITerms}>
      if (fetchedData) {
        parsedData = JSON.parse(fetchedData)
      }
      if (
          wx.$validateTypeResp(parsedData, 'any') && typeof parsedData.result.score !== 'undefined'
          && parsedData.result.score && wx.$validateType(parsedData.result.score, 'term')
      ) {
        app.globalData.scoreData = {
          success: parsedData.success,
          result: parsedData.result.score,
          messages: parsedData.messages,
          errors: parsedData.errors,
        }
        this.setData({messages: parsedData.messages, time: wx.$formatDate(parsedData.result.score.time), course_time: wx.$formatDate(app.globalData.scoreData.result.course_time)})
        this.scoreSparser(parsedData.result.score)
        if (this.time < parsedData.result.score.updated_time) {
          // 预拉取到的是新数据
          this.time = parsedData.result.score.updated_time
          wx.setStorageSync('score', app.globalData.scoreData)
          wx.showToast({
            title: '预拉取成功',
            icon: 'success',
            duration: 500,
          })
          console.log('预拉取成功', parsedData.result.score.updated_time)
          if (typeof this.request !== 'undefined' && typeof this.request.abort === 'function') {
            this.request.abort()
          }
          this.request = {}
          if (typeof this.timeoutId !== 'undefined') {
            clearTimeout(this.timeoutId)
            this.timeoutId = undefined
          }
        }
      } else if (typeof this.request === 'undefined') {
        wx.showToast({
          title: '重试中',
          icon: 'loading',
          duration: 6000,
        })
        this.fetchData()
      }
    }
  },

  fetchData: function() {
    if (typeof this.request !== 'undefined') {
      return
    }
    this.time = +new Date() / 1000
    this.request = wx.$request<ITerms>({
      path: 'scores/term',
      actions: true,
      methods: 'GET',
      type: 'term',
      success: (result, messages, errors) => {
        if (errors && errors.length > 0) {
          wx.hideToast()
          wx.showModal({
            content: errors.map((elem) => {
              return elem.message
            }).join(' '),
            showCancel: false,
          })
        } else {
          wx.showToast({
            title: '更新成功',
            icon: 'success',
            duration: 500,
          })
        }
        app.globalData.scoreData = {
          result,
          messages,
          success: true,
          errors: [],
        }
        if (result.term_lesson_count > 0) {
          wx.setStorageSync('score', app.globalData.scoreData)
          this.setData({messages, time: wx.$formatDate(result.time), course_time: wx.$formatDate(app.globalData.scoreData.result.course_time)})
        } else {
          this.setData( { success: 2 } )
        }
        this.scoreSparser(result)

        if (typeof app.globalData.redirect !== 'undefined') {
          const {year, term, courseId} = app.globalData.redirect
          app.globalData.redirect = undefined
          if (typeof year !== 'undefined' && typeof term !== 'undefined' && typeof courseId !== 'undefined') {
            const unreadKey = year + '-' + term + '-' + courseId
            if (typeof app.globalData.unread[unreadKey] !== 'undefined') {
              app.globalData.unread[unreadKey].unread = false
              wx.navigateTo({
                url: '/pages/scoreDetailPage/scoreDetailPage?year=' + year + '&term=' + term + '&id=' + courseId +
                    '&instructor=' + encodeURIComponent((app.globalData.unread[unreadKey] as IUngradedCourse).instructor),
              })
            }
          }
        }
      },
      noneData: () => {
        this.setData({success: 2})
      },
      complete: () => {
        if (typeof this.timeoutId !== 'undefined') {
          clearTimeout(this.timeoutId)
          this.timeoutId = undefined
        }
        wx.stopPullDownRefresh()
      },
    })
  },

  scoreSparser: function(result: ITerms) {
    if (typeof this.getTabBar === 'function') {
      wx.$initTab(this.getTabBar())
    }
    const unread: {
      [courseId: string]: ICourse,
    } = {}
    if (result == null) {
      this.setData({success: 2})
      return
    }
    if (typeof result.terms === 'undefined' || !result.terms) {
      this.setData({success: 2})
      return
    }
    this.setData({success: 1})
    // 解析得到最新学期的成绩 总成绩 通过率与总学分
    let lastYear = Object.keys(result.terms)[Object.keys(result.terms).length - 1]
    let lastTerm = Object.keys(result.terms[lastYear])[Object.keys(result.terms[lastYear]).length - 1]
    for (const year in result.terms) {
      for (const term in result.terms[year]) {
        if (result.terms[year][term].term_lesson_count > 0) {
          lastYear = year
          lastTerm = term
        }
      }
    }
    const t = []
    this.setData({
      name: result.name,
      institute: result.institute,
      sid: result.sid,
      major: result.major,

      totalGPA: result.average_GPA_term,
      totalScore: result.average_score_term,
      totalNums: result.term_lesson_count,
      share_score: result.share_score,
      has_open: result.has_open,
      is_no_password: result.is_no_password,
      minorGPA: result.average_GPA_minor,
      minorScore: result.average_score_minor,
      minorNums: result.term_lesson_minor,
      first_semester: result.first_semester,
    })

    let passCredit_total = 0
    let passGraded_total = 0
    let totalCredit_total = 0
    let totalUnread = 0
    let totalUngraded = 0
    let termNums = 0
    let minorUngraded = 0
    let passCredit_minor = 0
    let totalCredit_minor = 0

    for (const year in result.terms) {
      for (const term in result.terms[year]) {
        if (result.terms[year][term].term_lesson_count > 0) {
          ++termNums
        }
        const {unreadCount, ungraded, unsubscribed} = wx.$forCourses(result.terms[year][term].courses, unread)
        const {credits, passCredits, gradedCredits, ungraded: ungradedTotal} = wx.$forCourses(result.terms[year][term].courses, unread, false, false)

        if (
          year + '-' + term >= app.globalData.scoreData.result.current_year_term ||
          (year === lastYear && term === lastTerm) ||
          unreadCount > 0 || ungraded > 0
        ) {
          t.push({
            year,
            term,
            detail: {
              gpa: result.terms[year][term].average_GPA_term,
              score: result.terms[year][term].average_score_term,
              count: result.terms[year][term].term_lesson_count,
              passRate: passCredits / gradedCredits * 100,
              totalCredit: credits,
              passCredits,
            },
            unread: unreadCount,
            ungraded,
            unsubscribed,
            course_time: wx.$formatDate(result.terms[year][term].course_time),
          })
        }
        passCredit_total += passCredits
        passGraded_total += gradedCredits
        totalCredit_total += credits
        totalUnread += unreadCount
        totalUngraded += ungradedTotal
        const minor = wx.$forCourses(result.terms[year][term].courses, {}, true)
        passCredit_minor += minor.passCredits
        totalCredit_minor += minor.credits
        minorUngraded += minor.ungraded
      }
    }
    let passRate_total = 0
    if (result.term_lesson_count > 0) {
      passRate_total = passCredit_total / passGraded_total * 100
    }

    this.setData({
      passRate_total,
      totalCredit_total,
      passCredit_total,
      termNums,
      totalUnread,
      totalUngraded,
      term: t,
      passRate_minor: passCredit_minor / totalCredit_minor * 100,
      totalCredit_minor,
      passCredit_minor,
      minorUngraded,
    })
    app.globalData.unread = unread
  },

  bindtapHandeler: function(e) {
    switch (e.currentTarget.dataset.from) {
      case 'total':
        wx.navigateTo({
          url: '/pages/scoreList/scoreList?id=total',
        })
        break
      case 'minor':
        wx.navigateTo({
          url: '/pages/scoreList/scoreList?id=minor',
        })
        break
      case 'term':
        const {year, term} = e.currentTarget.dataset
        wx.navigateTo({
          url: '/pages/scoreList/scoreList?year=' + year + '&term=' + term,
        })
        break
      case 'history':
        wx.navigateTo({
          url: '/pages/previousScore/previousScore',
        })
        break
      case 'more':
        wx.navigateTo({
          url: '/pages/more/more?logged_in=1',
        })
        break
      case 'reload':
        wx.showToast({
          title: '刷新中',
          icon: 'loading',
          duration: 6000,
        })
        this.request = undefined
        this.fetchData()
        break

      default:
        break
    }
  },

  onShareAppMessage: function() {
    if (typeof app.globalData.scoreData !== 'undefined' && wx.$validateType(app.globalData.scoreData.result, 'term')) {
      return {
        title: app.globalData.scoreData.result.share_message.title,
        imageUrlId: app.globalData.scoreData.result.share_message.imageUrlId,
        imageUrl: app.globalData.scoreData.result.share_message.imageUrl,
        path: '/pages/login/login',
      }
    }
    return {
      title: '快来查分啦',
      path: '/pages/login/login',
    }
  },

  onShareTimeline: function() {
    if (typeof app.globalData.scoreData !== 'undefined' && wx.$validateType(app.globalData.scoreData.result, 'term')) {
      return {
        title: app.globalData.scoreData.result.share_message.title,
        query: '',
      }
    }
    return {
      title: '快来查分啦',
      query: '',
    }
  },

  onPullDownRefresh: function() {
    if (app.globalData.sceneId === 1154) {
      wx.showToast({title: '请点击页面底部的 “前往小程序” 登录', icon: 'none', duration: 3000})
      wx.stopPullDownRefresh()
      return
    }
    if (this.time + 10 > +new Date() / 1000) {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '手速太快了，等一会儿再刷新试试吧',
        icon: 'none',
        duration: 3000,
      })
      return
    }
    wx.showToast({
      title: '更新成绩中',
      icon: 'loading',
      duration: 6000,
    })
    this.request = undefined
    this.fetchData()
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      wx.$initTab(this.getTabBar())
      this.getTabBar().setData({
        selected: 0,
      })
    }

    if (typeof app.globalData.scoreData !== 'undefined' && app.globalData.scoreData &&
      typeof app.globalData.scoreData.result !== 'undefined'
      && wx.$validateType(app.globalData.scoreData.result, 'term')) {
      this.setData({
        time: wx.$formatDate(app.globalData.scoreData.result.time),
        course_time: wx.$formatDate(app.globalData.scoreData.result.course_time),
      })
      this.scoreSparser(app.globalData.scoreData.result)
    }

    if (this.data.fail) {
      this.setData({success: 2})
      wx.showModal({
        title: '无法连接到服务器，请检查网络',
        showCancel: false,
      })
    }

    this.setData({fail: false})
  },
})

export {}
