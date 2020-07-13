/// <reference path="../../../typings/index.d.ts" />

Page({
  data: {
    exams: [],
    time: null,
    timestamp: null,
  },

  onLoad: function() {
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 6000,
    })
    wx.$request({
      path: 'scores/cet',
      actions: true,
      methods: 'GET',
      type: 'cets',
      success: (result: ICets, messages) => {
        const exams = []
        for (const i in result.results) {
          const exam = result.results[i]
          let PorF = '未通过'
          if (parseFloat(exam.total) >= 425) {
            PorF = '已通过'
          }
          const date =  exam.year + ' 第' + exam.term + '学期'
          const e = {
            name: exam.name,
            PorF: PorF,
            date: date,
            total: exam.total,
            listening: exam.listening,
            reading: exam.reading,
            comprehensive: exam.comprehensive,
          }
          exams.push(e)
        }
        this.setData({
          exams: exams,
          messages: messages,
          time: wx.$formatDate(result.time),
          timestamp: result.time,
        })
        wx.showToast({
          title: '加载成功',
          icon: 'success',
          duration: 500,
        })
      },
      failed: () => {
        wx.navigateBack()
      },
    })
  },

  onShow: function() {
    this.setData({time: wx.$formatDate(this.data.timestamp)})
  },

  onPullDownRefresh: function() {
    wx.stopPullDownRefresh()
    this.onLoad()
  },
})

export {}
