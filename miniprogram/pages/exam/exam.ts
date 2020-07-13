/// <reference path="../../../typings/index.d.ts" />

const app: IMyApp = getApp()

Page({
  data: {
    examList: [],
    isNull: null,
    isOver: [],
    messages: [],
  },
  time: 0,

  onLoad: function() {
    const exam: IExams = wx.getStorageSync('exam2')
    if (exam && wx.$validateType(exam, 'exams')) {
      this.time = exam.updated_time
      this.setData({
        examList: exam.list,
        isNull: false,
      })
      this.parseTime()
    }
    if (this.time + 21600 < +new Date() / 1000) {
      this.fetch()
    }
  },

  fetch: function() {
    this.time = +new Date() / 1000
    wx.showToast({
      title: '更新考试时间中',
      icon: 'loading',
      duration: 6000,
    })
    wx.$request({
      path: 'courses/exams',
      actions: true,
      methods: 'GET',
      type: 'exams',
      success: (result: IExams, messages) => {
        this.setData({messages: messages})
        const isNull = false
        if (result.list.length === 0) {
          if (this.data.isNull === null) {
            this.setData({
              examList: [],
              isNull: true,
            })
          }
          wx.showToast({
            title: '考试为空',
            icon: 'none',
            duration: 500,
          })
        } else {
          wx.setStorageSync('exam2', result)
          this.setData({
            examList: result.list,
            isNull: isNull,
          })
          this.parseTime()
          wx.showToast({
            title: '更新成功',
            icon: 'success',
            duration: 500,
          })
        }
      },
      complete: () => {
        wx.stopPullDownRefresh()
      },
    })
  },

  parseTime: function() {
    // TODO: undefined is not an object (evaluating 's.split("年")[1].split')
    // const isOver = []
    // for (const i in this.data.examList) {
    //   let examEndTime = this.data.examList[i].time
    //   if (typeof this.data.examList[i].time.split === 'function') {
    //     examEndTime = examEndTime.split('年')[0] + '-' + examEndTime.split('年')[1].split('月')[0] + '-' + examEndTime.split('月')[1].split('日')[0] + ' ' + examEndTime.split('-')[1].split(')')[0]
    //   }
    //   const date = new Date()
    //   const curTime = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes()
    //   if (examEndTime > curTime) {
    //     isOver.push(true)
    //   } else {
    //     isOver.push(false)
    //   }
    // }
    //
    // this.setData({isOver: isOver})
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        wx.$initTab(this.getTabBar())
        this.getTabBar().setData({
          selected: app.globalData.exam_tab,
        })
      }
  },

  onPullDownRefresh: function() {
    if (this.time + 60 > +new Date() / 1000) {
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
})

export {}
