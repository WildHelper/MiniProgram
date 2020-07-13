/// <reference path="../../../typings/index.d.ts" />

// index.js
// 获取应用实例
const app: IMyApp = getApp()

Page({
  time: 0,
  share_title: '快查查北工大最新的课表',
  theme: 'light',
  originalData: {
    // curWeek: 15,
    finished: true,

    classes: {
      '1,2节':   ['1 2节',  '', '', '', '', '', '', ''],
      '3,4节':   ['3 4节',  '', '', '', '', '', '', ''],
      '5,6节':   ['5 6节',  '', '', '', '', '', '', ''],
      '7,8节':   ['7 8节',  '', '', '', '', '', '', ''],
      '9,10节':  ['9 10节', '', '', '', '', '', '', ''],
      '11,12节': ['11 12节', '', '', '', '', '', '', ''],
    },

    backgroundColor: 'transparent',
    optionalColorList: ['#fbcd9e', '#e4b0f5', '#9ef2e0', '#fb93ab', '#b1b1dc', '#b4cfc2', '#ead3c7', '#ffba71', '#ffccff', '#a1afc9', '#a4e2c6', '#eedeb0', '#96ce54', '#c2ccd0' ],

    color: {
      '1,2节':  ['var(--weui-BG-0);', '', '', '', '', '', '', ''],
      '3,4节':  ['var(--weui-BG-0);', '', '', '', '', '', '', ''],
      '5,6节':  ['var(--weui-BG-0);', '', '', '', '', '', '', ''],
      '7,8节':  ['var(--weui-BG-0);', '', '', '', '', '', '', ''],
      '9,10节': ['var(--weui-BG-0);', '', '', '', '', '', '', ''],
      '11,12节': ['var(--weui-BG-0);', '', '', '', '', '', '', ''],
    },

    marker: {
      '1,2节':  [0, 0, 0, 0, 0, 0, 0, 0],
      '3,4节':  [0, 0, 0, 0, 0, 0, 0, 0],
      '5,6节':  [0, 0, 0, 0, 0, 0, 0, 0],
      '7,8节':  [0, 0, 0, 0, 0, 0, 0, 0],
      '9,10节': [0, 0, 0, 0, 0, 0, 0, 0],
      '11,12节': [0, 0, 0, 0, 0, 0, 0, 0],
    },

    comment: '',
    message: '',
    messages: [],
    semester: '最新学期',
    semesters: ['最新学期'],
    sceneId: app.globalData.sceneId,
  },

  data: {
    noTime: [],
    allClasses: 0,
  },
  shared: {
    title: '分享错误，请重试',
  },
  isShared: false,
  semester: '0/0',
  semesters: ['最新学期'],

  onLoad: function(options) {
    wx.setNavigationBarTitle({
      title: '我的课表',
    }).then(() => {})
    this.theme = wx.getSystemInfoSync().theme
    if ( typeof wx.onThemeChange === 'function') {
      wx.onThemeChange(() => {
        this.onShow()
      })
    }
    this.setData({finished: false})
    const score: IApi<ITerms> = wx.getStorageSync('score')
    if (score && wx.$validateType(score.result, 'term') && !score.result.is_no_password) {
      app.globalData.scoreData = score
    }

    if (app.globalData.sceneId === 1155) {
      options = {}
    }

    if (options && options.shared && options.id && options.semester) {
      app.globalData.authorization = options.shared
      app.globalData.student_id = options.id
      app.globalData.open = ''
      this.semester = options.semester
      if (app.globalData.sceneId === 1154) {
        this.originalData.comment = '点击 “前往小程序” 查看自己的课表'
      } else {
        this.originalData.comment = '下拉刷新以查看自己的课表'
      }
      this.fetch(false, true)
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
      this.semester = '0/0'
    } else {
      this.originalData.comment = ''
      const schedule: ISchedule = wx.getStorageSync('schedule')
      if (schedule && wx.$validateType(schedule, 'schedule')) {
        app.globalData.schedule = schedule
        this.time = schedule.updated_time
        this.initSchedule(schedule)
      }
      if (this.time + 21600 < +new Date() / 1000) {
        this.fetch()
      } else if (app.globalData.scoreData && app.globalData.scoreData.result && app.globalData.scoreData.result.share_score === true) {
        this.fetch(false, false)
      }
    }
  },

  fetch: function(actions: boolean = true, shared: boolean = false) {
    this.time = +new Date() / 1000
    wx.showToast({
      title: '更新课表中',
      icon: 'loading',
      duration: 6000,
    })
    wx.$request<ISchedule>({
      path: 'courses/term/' + this.semester,
      actions,
      methods: 'GET',
      type: 'schedule',
      success: (result, messages, errors) => {
        this.originalData.messages = messages
        app.globalData.schedule = result
        if (result.list.length > 0) {
          if (actions) {
            wx.setStorageSync('schedule', result)
          }
          this.initSchedule(result)
        }
        if (!errors || errors.length === 0) {
          if (actions) {
            wx.showToast({
              title: '更新成功',
              icon: 'success',
              duration: 500,
            })
          } else {
            wx.hideToast()
          }
        } else {
          wx.showToast({
            title: errors.map((elem) => {
              return elem.message
            }).join(' '),
            icon: 'none',
            duration: 3000,
          })
        }
      },
      complete: () => {
        wx.stopPullDownRefresh()
        this.isShared = shared
      },
    })
  },

  initSchedule: function(res: ISchedule) {
    this.originalData.semester = res.year + '/' + res.term

    if (res.semesters) {
      this.semesters = res.semesters
      if (this.originalData.semester > res.semesters[res.semesters.length - 1]) {
        this.originalData.semester = '最新学期'
      }
      this.originalData.semesters = JSON.parse(JSON.stringify(res.semesters))
      this.originalData.semesters.unshift('最新学期')
    }

    this.setData(JSON.parse(JSON.stringify(this.originalData)))
    const classList = res.list
    const week = res.week
    const term = res.term
    const year = res.year
    // 初始化color列表背景颜色
    const color = this.data.color
    for (const key in color) {
      for (const index in color[key]) {
        // @ts-ignore
        // tslint:disable-next-line:triple-equals
        if (index != 0) {
          color[key][index] = this.data.backgroundColor
        }
      }
    }
    this.setData({color: color})

    const classes = this.data.classes
    const marker = this.data.marker
    const dateTable = {'周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7}
    // 课程解析并填入
    this.data.noTime = []
    let credits = 0
    for (const i in classList) {
      if (classList[i].type !== '第二课堂' && classList[i].belong !== '第二课堂') {
        credits += parseFloat(classList[i].credit)
      }
      if (classList[i].time === '') {
        this.data.noTime.push(classList[i])
        continue
      }

      const timeList = classList[i].time.split(';')

      // 解决‘9,10,11,12节‘这种情况
      // 只能解决四节连续的问题，‘7,8,9,10,11,12节‘不支持
      for (const j in timeList) {
        const time = timeList[j].slice(3).split('节')[0].split(',')
        if (time.length > 2) {
          const time0 = time.slice(0, 2)
          const time1 = time.slice(2)
          timeList[j] = timeList[j].slice(0, 3) + time0 + '节' + timeList[j].split('节')[1]
          timeList.push(timeList[j].slice(0, 3) + time1 + '节' + timeList[j].split('节')[1])
          if (classList[i].room && classList[i].room !== ' ') {
            classList[i].room = classList[i].room + ';' + classList[i].room
          }
        }
      }
      // console.log(timeList);
      
      for (const j in timeList) {
        const date = dateTable[timeList[j].slice(0, 2)]
        let time = timeList[j].slice(3).split('{')[0]
        let appendDate = ''

        switch (time.split(',').length) {
          case 1:
            const timeNum = parseInt(time.split('节')[0], 10)
            appendDate = '(仅第' + timeNum + '节)'
            let set
            if (timeNum % 2 === 1) {
              time = timeNum + ',' + (timeNum + 1) + '节'
              set = 1
            } else {
              time = timeNum - 1 + ',' + timeNum + '节'
              set = 2
            }
            if (typeof marker[time] !== 'undefined' && typeof marker[time][date] !== 'undefined') {
              marker[time][date] = set
            } else {
              continue
            }
            break
          case 2:
            break
          default:
            continue
        }

        if (typeof color === 'undefined' || typeof color[time] === 'undefined' || typeof color[time][date] === 'undefined') {
          console.log({color, time, date})
          continue
        }
        // @ts-ignore
        let newColor = this.data.optionalColorList[Math.abs(classList[i].instructor.hashCode()) % this.data.optionalColorList.length]
        if (this.theme === 'dark') {
          newColor = '#' + newColor.substring(1) + '80'
        }
        console.log(color[time][date])
        if (color[time][date] === 'transparent') {
          color[time][date] = newColor
        }
        // console.log(classList[i].name+" "+this.data.optionalColorList[i]+" "+i)
        const weekRange = timeList[j].split('{')[1].split('}')[0]
        let prev = ''
        if (typeof classes[time][date].text !== 'undefined') {
          prev = classes[time][date].text + '\n\n'
        } else {
          classes[time][date] = {}
        }
        if (classList[i].room && classList[i].room !== ' ' && classList[i].room.split(';')[j]) {
          classes[time][date].text = prev + classList[i].room.split(';')[j] + '\n' + classList[i].name + '-' + classList[i].instructor + '\n' + weekRange + appendDate
        } else {
          classes[time][date].text = prev + classList[i].name + '-' + classList[i].instructor + '\n' + weekRange + appendDate
        }
        const weekNoStart = weekRange.indexOf('第')
        const weekNoEnd = weekRange.indexOf('周')
        if (weekNoStart !== -1 && weekNoEnd !== -1) {
          const weekNo = weekRange.substr(weekNoStart + 1, weekNoStart + weekNoEnd - 1).split('-')
          if (weekNo.length === 2) {
            // @ts-ignore
            let currentWeek = new Date().getWeek()
            if (typeof week[year] !== 'undefined' && typeof week[year][term] === 'number') {
              currentWeek += 1 - week[year][term]
              if (currentWeek <= 0 || currentWeek > 24) {
                currentWeek = 1
              }
              const test = (currentWeek > weekNo[1] || currentWeek < weekNo[0])
              if (typeof classes[time][date].opacity === 'undefined' && test) {
                classes[time][date].opacity = 'true'
              } else {
                if (classes[time][date].opacity === 'true') { // 新 append 到最后额课程是目前在上的课程
                  classes[time][date].text = classes[time][date].text.split('\n\n').reverse().join('\n\n')
                  color[time][date] = newColor
                }
                if (test) {
                  continue
                }
                if (classes[time][date].opacity !== 'false') {
                  if (weekRange.indexOf('单周') !== -1) {
                    if (currentWeek % 2 !== 1) {
                      classes[time][date].opacity = 'true'
                    } else {
                      classes[time][date].opacity = 'false'
                    }
                  } else if (weekRange.indexOf('双周') !== -1) {
                    if (currentWeek % 2 !== 0) {
                      classes[time][date].opacity = 'true'
                    } else {
                      classes[time][date].opacity = 'false'
                    }
                  } else {
                    classes[time][date].opacity = 'false'
                  }
                }
              }
            }
          }
        }
      }
    }

    if (
      typeof res.major === 'string' && res.major && res.name && res.shared && res.id
    ) {
      this.share_title = res.name + '的' +
        res.year.substring(2, 4) + '-' + res.year.substring(7, 9) + '第' + res.term + '学期有' +
        res.list.length + '门课, 共' + credits + '学分, 快来围观'
      if (res.shared) {
        this.shared = {
          title: this.share_title,
          query: 'shared=' + res.shared + '&semester=' + res.year + '/' + res.term + '&id=' + res.id,
        }
      }
      if (this.data.comment) {
        this.data.comment = '这是' + res.major + ' – ' + res.name + '的课表\n' + this.data.comment
        wx.setNavigationBarTitle({
          title: res.name + '的课表',
        })
      } else {
        wx.setNavigationBarTitle({
          title: '我的课表',
        })
      }
    } else {
      this.share_title = '快查查' + res.year.substring(2, 4) + '-' + res.year.substring(7, 9) + '第' + res.term + '学期的课表!'
    }

    let title
    if (res.list.length > 0) {
      const {week, year, term} = res
      // @ts-ignore
      let currentWeek = new Date().getWeek()
      if (typeof week[year] !== 'undefined' && typeof week[year][term] === 'number') {
        currentWeek += 1 - week[year][term]
        if (this.data.noTime.length >= classList.length) {
          title = '您的' + res.year.substring(2, 4) + '-' + res.year.substring(7, 9) + '第' + res.term + '学期没有其他课程'
        } else {
          title = '正在显示' + res.year.substring(2, 4) + '-' + res.year.substring(7, 9) + '第' + res.term + '学期第' + (currentWeek > 0 ? currentWeek : 1) + '周课程'
        }
        if (currentWeek < 0) {
          title += '；距离开学还有' + (1 - currentWeek) + '周'
        } else if (currentWeek === 0) {
          title += '；下周就开学了，做好准备吧！'
        } else if (currentWeek > 24) {
          title = '正在显示' + res.year.substring(2, 4) + '-' + res.year.substring(7, 9) + '第' + res.term + '学期第1周课程'
        }
      } else {
        title = '正在显示' + res.year.substring(2, 4) + '-' + res.year.substring(7, 9) + '第' + res.term + '学期课程'
      }
    } else {
      title = res.year + '学年第' + res.term + '学期的课表为空'
    }
    this.setData({classes, color, height: marker, noTime: this.data.noTime, allClasses: classList.length, message: title, comment: this.data.comment})
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      wx.$initTab(this.getTabBar())
      this.getTabBar().setData({
        selected: 1,
      })
    }
    // @ts-ignore
    const theme = wx.getSystemInfoSync().theme
    if (typeof theme === 'string' && theme !== this.theme) {
      this.theme = theme
      this.initSchedule(app.globalData.schedule)
    } else if (typeof app.globalData.schedule !== 'undefined') {
      this.initSchedule(app.globalData.schedule)
    }
  },

  onPullDownRefresh: function() {
    if (app.globalData.sceneId === 1154) {
      wx.showToast({title: '请点击页面底部的 “前往小程序” 查看自己的课表', icon: 'none', duration: 3000})
      wx.stopPullDownRefresh()
      return
    }
    if (!app.globalData.authorization || !app.globalData.student_id || !app.globalData.open) {
      wx.stopPullDownRefresh()
    }
    if (this.isShared) {
      this.originalData.comment = ''
      this.isShared = false
      if (app.globalData.scoreData && app.globalData.scoreData.result && typeof app.globalData.scoreData.result.share_score === 'boolean') {
        this.fetch(!app.globalData.scoreData.result.share_score, false)
      } else {
        this.fetch()
      }
      return
    } else if (this.time + 10 > +new Date() / 1000) {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '手速太快了，等一会儿再刷新试试吧',
        icon: 'none',
        duration: 3000,
      })
      return
    }
    this.fetch()
  },

  onShareAppMessage: function() {
    if (this.shared.query) {
      return {
        title: this.share_title,
        path: '/pages/index/index?' + this.shared.query,
      }
    } else {
      return {
        title: this.share_title,
        path: '/pages/login/login',
      }
    }
  },

  onShareTimeline: function() {
    return this.shared
  },

  bindSemesterChange: function(e) {
    console.log(e)
    const value = parseInt(e.detail.value, 10) - 1
    if (value < 0) {
      this.semester = '0/0'
      this.setData({semester: '最新学期'})
      this.fetch()
    } else if (this.semesters[value]) {
      this.semester = this.semesters[value]
      this.setData({semester: this.semester})
      if (app.globalData.scoreData && app.globalData.scoreData.result && app.globalData.scoreData.result.share_score === true) {
        this.fetch(false, false)
      } else {
        this.fetch()
      }
    }
  },
})

export {}
