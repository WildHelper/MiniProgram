/// <reference path="../../../typings/index.d.ts" />

const app: IMyApp = getApp()

Page({
  data: {
    term: [],
    time: null,
    unread: false,
    share_score: false,
  },

  onLoad: function() {
    if (
      typeof app.globalData.scoreData === 'undefined' || !app.globalData.scoreData ||
      !wx.$validateType(app.globalData.scoreData.result, 'term')
    ) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
      return
    }

    const t = []
    this.setData({time: wx.$formatDate(app.globalData.scoreData.result.time)})
    for (const year in app.globalData.scoreData.result.terms) {
      for (const term in app.globalData.scoreData.result.terms[year]) {
        // 计算通过率与总学分
        const courses = app.globalData.scoreData.result.terms[year][term]
        const {unreadCount, ungraded, unsubscribed} = wx.$forCourses(courses.courses, app.globalData.unread)
        const {credits, passCredits, gradedCredits} = wx.$forCourses(courses.courses, app.globalData.unread, false, false)


        const passRate = passCredits / gradedCredits * 100

        t.push({
          name: year + ' 第 ' + term + ' 学期',
          detail: {
            gpa: app.globalData.scoreData.result.terms[year][term].average_GPA_term,
            score: app.globalData.scoreData.result.terms[year][term].average_score_term,
            count: app.globalData.scoreData.result.terms[year][term].term_lesson_count,
            passRate,
            passCredits,
            totalCredit: credits,
          },
          unread: unreadCount,
          ungraded,
          unsubscribed,
          year,
          term,
        })
      }
    }
    this.setData({
      term: t,
      unread: this.data.unread,
      share_score: app.globalData.scoreData.result.share_score,
      first_semester: app.globalData.scoreData.result.first_semester,
    })
  },

  onShow: function() {
    this.onLoad()
  },

  bindtapHandeler: function(e) {
    const {year, term} = e.currentTarget.dataset
    wx.navigateTo({
      url: '/pages/scoreList/scoreList?year=' + year + '&term=' + term,
    })
  },
})

export {}
