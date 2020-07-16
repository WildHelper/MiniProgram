/// <reference path="../../../typings/index.d.ts" />

const app: IMyApp = getApp()

Page({
  data: {
    typeRaw: {},
    typeOrdered: [],

    title: '加载中',      // 卡片名称
    termGPA: undefined,    // 学期成绩-GPA
    termScore: undefined,  // 学期成绩-加权平均分
    termNums: undefined,   // 学期成绩-已出课程数
    passRate: 100,    // 总成绩-通过率
    totalCredit: undefined, // 总成绩-总学分
    passCredit: undefined, // 总成绩-通过学分
    ungraded: 0,

    sortD: 'decending',

    map: app.globalData.map,
    share_score: false,
    is_no_password: false,
    time: '从未',

    halfScreen: {
      show: false,
      title: '加载中',
      subtitle: undefined,
      desc: '',
      tips: '',
    },
    buttons: [{
      type: 'primary',
      text: '接受',
    }, {
      type: 'default',
      className: '',
      text: '拒绝',
    }],
    comment: '',
    adMessage: undefined,
    showAd: false,
  },

  searchKey: '',
  year: undefined,
  term: undefined,
  time: 0,
  options: undefined,

  onInput(evt) {
    this.searchKey = evt.detail.value
    this.setData({
        showClearBtn: !!this.searchKey.length,
    })  
    this.search(this.searchKey)
  },
  onClearCount() {
    this.setData({
      searchKey: '',
      showClearBtn: false,
    })
    this.search('')
  },
  search: function(searchKey) {
    const type = this.data.typeRaw
    const typeNew: {[type: string]: (IGradedCourse|IUngradedCourse)[]} = {}
    for (const i in type) {
      for (const j in type[i]) {
        if (type[i][j].name.toLowerCase().indexOf(searchKey.toLowerCase()) !== -1) {
          if (typeof typeNew[type[i][j].type] === 'undefined') {
            typeNew[type[i][j].type] = [type[i][j]]
          } else {
            typeNew[type[i][j].type].push(type[i][j])
          }   
        }
      }
    }
    this.data.typeOrdered = []
    for (const i in typeNew) {
      let credits = 0
      for (const j of typeNew[i]) {
        credits += Number(j.credit)
      }
      this.data.typeOrdered.push({
        type: i,
        list: typeNew[i],
        credits,
      })
    }
    this.data.typeOrdered.sort((a, b) => {
      return wx.$getTypeOrder(a.type) - wx.$getTypeOrder(b.type)
    })
    this.setData({typeOrdered: this.data.typeOrdered})
  },

  onLoad: function(options) {
    if (app.globalData.sceneId !== 1154) {
      wx.setNavigationBarTitle({
        title: '成绩详情',
      })
    }
    this.options = options
    const {id, year, term} = options
    const pageLoaded = () => {
      // 从全局数据中读物当前查询学期的数据
      if (
        typeof app.globalData.scoreData === 'undefined' || !app.globalData.scoreData ||
        !wx.$validateType(app.globalData.scoreData.result, 'term')
      ) {
        wx.reLaunch({
          url: '/pages/login/login',
        })
        return
      }
      const allInfo = app.globalData.scoreData.result
      this.options.uid = app.globalData.scoreData.result.sid
      this.options.shared = app.globalData.scoreData.result.shared

      this.setData({share_score: app.globalData.scoreData.result.share_score, is_no_password: app.globalData.scoreData.result.is_no_password, time: wx.$formatDate(app.globalData.scoreData.result.time), comment: this.data.comment})

      // 总成绩
      if (id === 'total' || id === 'minor') {
        if (id === 'total') {
          this.setData({
            title: allInfo.term_lesson_minor > 0 ? '第一学位成绩' : '总成绩',
            termGPA: allInfo.average_GPA_term,      // 学期成绩-GPA
            termScore: allInfo.average_score_term,  // 学期成绩-加权平均分
            termNums: allInfo.term_lesson_count,    // 学期成绩-已出课程数
          })
        }

        let minorNums = 0

        const classList: (IGradedCourse|IUngradedCourse)[] = []
        for (const year in allInfo.terms) {
          for (const term in allInfo.terms[year]) {
            for (const i of allInfo.terms[year][term].courses) {
              if (id === 'total') {
                if (i.minor_maker !== '1' && i.minor_maker !== '2') {
                  classList.push(i)
                }
              } else if (i.minor_maker === '1' || i.minor_maker === '2') {
                ++minorNums
                classList.push(i)
              }
            }
          }
        }
        if (id === 'minor') {
          this.setData({
            title: '辅修/双学位成绩',
            termGPA: allInfo.average_GPA_minor,      // 学期成绩-GPA
            termScore: allInfo.average_score_minor,  // 学期成绩-加权平均分
            termNums: allInfo.term_lesson_minor,    // 学期成绩-已出课程数
          })
        }
        this.scoreSparser(classList, this.data.termNums, id)
      } else if (typeof year !== 'undefined' && typeof term !== 'undefined') {
        this.year = year
        this.term = term
        this.setData({
          title: year + ' 第 ' + term + ' 学期',
          year: year,
          term: term,
          first_semester: app.globalData.scoreData.result.first_semester,
          termGPA: allInfo.terms[year][term].average_GPA_term,      // 学期成绩-GPA
          termScore: allInfo.terms[year][term].average_score_term,  // 学期成绩-加权平均分
          termNums: allInfo.terms[year][term].term_lesson_count,    // 学期成绩-已出课程数
        })
        this.setData({course_time: wx.$formatDate(allInfo.terms[year][term].course_time)})
        this.scoreSparser(allInfo.terms[year][term].courses, allInfo.terms[year][term].term_lesson_count, id)
      }
      wx.$createVideoAd(this)
    }

    if (options && options.shared && options.uid) {
      wx.showToast({
        title: '加载成绩中',
        icon: 'loading',
        duration: 6000,
      })
      if (app.globalData.sceneId === 1154) {
        this.data.comment = '点击 “前往小程序” 使用完整服务'
      } else {
        this.data.comment = '下拉刷新以查看自己的成绩'
      }
      app.globalData.authorization = options.shared
      app.globalData.student_id = options.uid
      app.globalData.open = ''
      wx.$request<ITerms>({
        path: 'scores/term',
        actions: false,
        methods: 'GET',
        type: 'term',
        success: (result, messages) => {
          app.globalData.scoreData = {
            result,
            messages,
            success: true,
            errors: [],
          }
          if (this.data.comment) {
            this.data.comment = '这是' + result.major + ' – ' + result.name + '的成绩\n' + this.data.comment
            if (app.globalData.sceneId !== 1154) {
              wx.setNavigationBarTitle({
                title: result.name + '的成绩',
              })
            }
          }
          for (const y in result.terms) {
            for (const t in result.terms[y]) {
              for (const i of result.terms[y][t].courses) {
                app.globalData.unread[i.year + '-' + i.term + '-' + i.id] = i
              }
            }
          }
          pageLoaded()
          wx.hideToast()
        },
      })
      const authorization = wx.getStorageSync('authorization3')
      const student_id = wx.getStorageSync('student_id')
      const open = wx.getStorageSync('open')
      if (authorization && student_id && open) {
        app.globalData.authorization = authorization
        app.globalData.student_id = student_id
        app.globalData.open = open
      } else {
        app.globalData.authorization = ''
        app.globalData.student_id = ''
        app.globalData.open = ''
      }
    } else {
      pageLoaded()
    }
  },

  onShow: function() {
    if (
      typeof app.globalData.scoreData === 'undefined' || !app.globalData.scoreData ||
      !wx.$validateType(app.globalData.scoreData.result, 'term')
    ) {
      return
    }
    this.setData({map: app.globalData.map, time: wx.$formatDate(app.globalData.scoreData.result.time), share_score: app.globalData.scoreData.result.share_score})

    if (typeof this.options.year !== 'undefined' && typeof this.options.term !== 'undefined') {
      this.setData({course_time: wx.$formatDate(app.globalData.scoreData.result.terms[this.options.year][this.options.term].course_time)})
    }

    if (this.data.fail) {
      wx.showToast({
        title: '无法连接到服务器，请检查网络',
        icon: 'none',
        duration: 4500,
      })
    }

    if (
      typeof app.globalData.scoreData !== 'undefined' && typeof app.globalData.scoreData.result !== 'undefined' &&
      typeof app.globalData.scoreData.result.share_score !== 'undefined'
    ) {
      this.setData({
        share_score: app.globalData.scoreData.result.share_score,
      })
    }

    this.setData({fail: false})
  },

  updateType: function(classes: (IGradedCourse|IUngradedCourse)[]): {[type: string]: (IGradedCourse|IUngradedCourse)[]} {
    const types = {}
    for (const i in classes) {
      if (typeof types[classes[i].type] === 'undefined') {
        types[classes[i].type] = []
      }
      types[classes[i].type].push(classes[i])
    }
    return types
  },

  // 解析成绩列表
  // 默认按照降序排序
  scoreSparser: function(classes: (IGradedCourse|IUngradedCourse)[], term_lesson_count: number, id: string) {
    // console.log(classes);
    const types: {[type: string]: (IGradedCourse|IUngradedCourse)[]} = this.updateType(classes)
    let passCredit = 0
    let passGraded = 0
    let totalCredit = 0
    let ungraded = 0
    for (const i of classes) {
      if (i.score < 0 && i.score !== -3) {
        ++ungraded
      }
      if (id !== 'minor' && (i.minor_maker === '1' || i.minor_maker === '2')) {
        continue
      }
      if (i.type !== '第二课堂') {
        if (i.score === '通过' || parseFloat(String(i.score)) >= 60) {
          passCredit += parseFloat(i.credit)
          passGraded += parseFloat(i.credit)
        } else if (i.score === '不通过' || parseFloat(String(i.score)) >= 0) {
          passGraded += parseFloat(i.credit)
        }
        totalCredit += parseFloat(i.credit)
      }
    }
    let passRate = 0
    if (term_lesson_count > 0) {
      passRate = passCredit / passGraded * 100
    }
    this.data.typeOrdered = []
    for (const i in types) {
      let credits = 0
      for (const j of types[i]) {
        credits += Number(j.credit)
      }
      this.data.typeOrdered.push({
        credits,
        type: i,
        list: types[i],
      })
    }
    this.data.typeOrdered.sort((a, b) => {
      return wx.$getTypeOrder(a.type) - wx.$getTypeOrder(b.type)
    })
    this.setData({
      typeOrdered: this.data.typeOrdered,
      typeRaw: types,
      totalCredit,
      ungraded,
      passRate,
      passCredit,
      classes: JSON.parse(JSON.stringify(classes)),
    })
  },


  sortCourses: function(d) {
    const classes: (IGradedCourse|IUngradedCourse)[] = this.data.classes
    for (const i in classes) {
      if (classes[i].score > 0) {
        classes[i].type = '已出分课程'
      }
    }

    const type = this.updateType(classes)
    for (const t in type) {
      type[t].sort(function(a, b) {
        let score0
        let score1
        score0 = parseFloat(a.score)
        score1 = parseFloat(b.score)
        if (d === 'decending') {
          return score0 - score1
        } else if (d === 'ascending') {
          return score1 - score0
        }
      })
    }

    this.data.typeOrdered = []
    for (const i in type) {
      let credits = 0
      for (const j of type[i]) {
        credits += Number(j.credit)
      }
      this.data.typeOrdered.push({
        type: i,
        list: type[i],
        credits,
      })
    }
    this.data.typeOrdered.sort((a, b) => {
      return wx.$getTypeOrder(a.type) - wx.$getTypeOrder(b.type)
    })
    this.setData({typeOrdered: this.data.typeOrdered})
  },


  // 更改课程排序顺序
  changeSort: function() {
    if (this.data.sortD === 'decending') {
      this.setData({sortD: 'ascending'})
      this.sortCourses('ascending')
    } else if (this.data.sortD === 'ascending') {
      this.setData({sortD: 'decending'})
      this.sortCourses('decending')
    }
  },

  mySubscribe: function(url, ScribeId) {
    // console.log(ScribeId)
    wx.requestSubscribeMessage({
      tmplIds: app.globalData.scoreData.result.subscribe_ids,
      success: (res) => {
        if (res[app.globalData.scoreData.result.subscribe_ids[0]] === 'accept') {
          wx.showToast({
            title: '订阅中',
            icon: 'loading',
            duration: 6000,
          })
          const success = () => {
            app.globalData.map[ScribeId] = true
            this.setData( {subscribed: true, map: app.globalData.map} )
            const timeRemains = wx.getStorageSync('ad_times')
            wx.setStorageSync('ad_times', timeRemains - 1)
            wx.showToast({
              title: '订阅成功',
              icon: 'success',
              duration: 500,
            })
          }
          wx.$request({
            actions: false,
            path: 'subscribe/' + ScribeId,
            success,
            noneData: success,
            type: 'any',
            methods: 'POST',
          })
        } else if (typeof url === 'string') {
          wx.navigateTo({
            url: url,
          })
        }
      },
      fail() {
        wx.navigateTo({
          url: url,
        })
      },
    })
  },

  // 点击课程处理
  bindtapHandeler: function(e) {
    const {id, year, term, subscribed, select, instructor} = e.currentTarget.dataset
    const url = '../scoreDetailPage/scoreDetailPage?id=' + id + '&year=' + year + '&term=' + term + '&instructor=' + encodeURIComponent(instructor)
    const unreadKey = year + '-' + term + '-' + id
    if (app.globalData.unread && app.globalData.unread[unreadKey] && app.globalData.unread[unreadKey].unread) {
      app.globalData.unread[unreadKey].unread = false
      this.setData({typeOrdered: this.data.typeOrdered})
    }
    if (!subscribed && app.globalData.scoreData.result.share_score && app.globalData.videoAd) {
      if (app.globalData.scoreData.result.ad_messages.length > 2) {
        let timeRemains = wx.getStorageSync('ad_times')
        if (typeof timeRemains === 'number' && timeRemains > 0) {
          this.mySubscribe(url, select)
        } else {
          timeRemains = 0
          this.setData ({
            halfScreen: {
              show: true,
              title: app.globalData.scoreData.result.ad_messages[0],
              desc: app.globalData.scoreData.result.ad_messages[1],
              tips: app.globalData.scoreData.result.ad_messages[2],
              subtitle: '当前剩余 ' + timeRemains + ' 次订阅机会',
            },
          })
        }
      } else {
        this.mySubscribe(url, select)
      }
    } else {
      wx.navigateTo({
        url: url,
      })
    }

  },

  bindHalf: function(e) {
    this.setData ({
      halfScreen: {show: false},
    })
    switch (e.detail.index) {
      case 0:
        wx.showToast({
          title: '加载广告中',
          icon: 'loading',
          duration: 3000,
        })
        wx.$loadVideoAd()
        break
      case 1:
        break
    }
  },

  onShareTimeline: function() {
    const serialize = function(obj): string {
      const str = []
      for (const p in obj) {
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
        }
      }
      return str.join('&')
    }
    let title = '我'
    if (typeof app.globalData.scoreData.result.name !== 'undefined') {
      title = app.globalData.scoreData.result.name
    }
    if (this.options.id === 'total') {
      title += '的大学总'
    } else if (this.options.id === 'minor') {
      title += '的辅修/双学位'
    } else if (typeof this.year === 'string' && typeof this.term === 'string') {
      title += '的' + this.year.substring(2, 4) + '-' + this.year.substring(7, 9) + '第' + this.term + '学期'
    } else {
      title += '的' + this.data.title
    }
    if (this.data.termNums > 0) {
      title += '加权是' + this.data.termScore.toFixed(2) + ', 快来围观'
    } else {
      title += '有' + this.data.ungraded + '门课, 共' + this.data.totalCredit + '学分, 快来围观'
    }
    return {
      title: title,
      query: serialize(this.options),
    }
  },

  onShareAppMessage: function() {
    const share = this.onShareTimeline()
    return {
      title: share.title,
      path: '/pages/scoreList/scoreList?' + share.query,
    }
  },

  onPullDownRefresh: function() {
    if (app.globalData.sceneId === 1154) {
      wx.showToast({title: '请点击页面底部的 “前往小程序” 使用完整服务', icon: 'none', duration: 3000})
      wx.stopPullDownRefresh()
      return
    }
    if (this.data.comment) {
      if (app.globalData.authorization && app.globalData.student_id && app.globalData.open) {
        wx.switchTab({
          url: '/pages/overAllPage/overAllPage',
        })
      } else {
        wx.reLaunch({
          url: '/pages/login/login',
        })
      }
      return
    }
    if (this.time + 30 > +new Date() / 1000) {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '手速太快了，等一会儿再刷新试试吧',
        icon: 'none',
        duration: 3000,
      })
      return
    }
    this.time = +new Date() / 1000
    wx.showToast({
      title: '更新成绩中',
      icon: 'loading',
      duration: 6000,
    })
    const success = (result, messages) => {
      wx.showToast({
        title: '更新成功',
        icon: 'success',
        duration: 500,
      })
      app.globalData.scoreData = {
        result,
        messages,
        success: true,
        errors: [],
      }
      if (result.term_lesson_count > 0) {
        wx.setStorageSync('score', app.globalData.scoreData)
      }
      const {id, year, term} = this.options
      this.onLoad({id, year, term})
    }
    let path = 'scores/term'
    if (typeof this.year !== 'undefined' && typeof this.term !== 'undefined') {
      path += '/' + this.year + '/' + this.term
    }
    wx.$request<ITerms>({
      path,
      actions: true,
      methods: 'GET',
      type: 'term',
      success: success,
      complete: () => {
        wx.stopPullDownRefresh()
      },
    })
  },
})

export {}
