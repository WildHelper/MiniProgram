/// <reference path="../../../typings/index.d.ts" />

// 获取应用实例
// @ts-ignore
import * as echarts from '../../ec-canvas/echarts'

const app: IMyApp = getApp()
let chart = null

// 全校成绩分布
const scoreDistribute = [0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

let chartNext = function() {}
let init = false

// 分布图初始化（先不画出来）
function initChart(canvas, width, height, dpr) {
  try {
    chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr, // new
    })
    canvas.setChart(chart)
    chart.setOption({})
    init = true
    chartNext()
    return chart
  } catch (e) {
    console.log(e)
  }
}

Page({

  data: {
    option: {},

    // 服务器返回信息
    class: null,

    // 课程基本信息
    className: '加载中',
    classID: undefined,
    credit: undefined,
    classType: undefined,
    academy: undefined,

    // 你的成绩
    yourScore: undefined,
    yourGPA: undefined,
    predict: undefined,

    // 全校平均成绩
    averScore: null,
    averGPA: null,
    stdDev: null,
    GPAdistribution_ABC_Rate: null,
    GPAdistribution_A_Rate: null,
    higestScoree: null,
    GPAdistribution_A: null,
    GPAdistribution_B: null,
    GPAdistribution_C: null,
    GPAdistribution_D: null,

    // 更新时间与样本量
    count: 0,

    // 是否显示成绩分布直方图
    ifDistribution: true,

    ec: {
      onInit: initChart,
    },
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
    demo: false,
    hidePersonal: false,
    share_score: false,
    messages: [],
    my_time: null,
    time: null,
    timestamp: 0,
  },

  redirected: false,

  onLoad: function(option) {
    if (
      typeof app.globalData.scoreData === 'undefined' || !app.globalData.scoreData ||
      !wx.$validateType(app.globalData.scoreData.result, 'term') ||
      !app.globalData.authorization || !app.globalData.student_id
    ) {
      wx.reLaunch({
        url: '/pages/login/login',
      })
      return
    }
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 6000,
    })
    const classID = option.id
    if (
      typeof option.year !== 'undefined' && typeof option.term !== 'undefined' &&
      typeof app.globalData.unread[option.year + '-' + option.term + '-' + classID] !== 'undefined'
    ) {
      const classDetail = app.globalData.unread[option.year + '-' + option.term + '-' + classID]
      option.score = String(classDetail.score)
      option.gpa = String(classDetail.gpa)
      option.name = classDetail.name
    }
    this.setData({
      yourScore: option.score,
      yourGPA: option.gpa,
      classID: classID,
      share_score: app.globalData.scoreData.result.share_score,
      my_time: wx.$formatDate(app.globalData.scoreData.result.time),
      option,
    })
    if (typeof option.name !== 'undefined' && option.name) {
      this.setData({ className: option.name })
    }
    if (option.score === 'NotAScore' || option.gpa === 'NotAScore') {
      // 此时为全校成绩页导航至此，不显示个人成绩卡片
      this.setData({ hidePersonal: true })
    }

    // 通过api获取课程详情成绩信息
    wx.$request({
      path: 'overview/scores/' + classID,
      actions: false,
      methods: 'GET',
      type: 'detail',
      failed: () => {
        wx.navigateBack()
      },
      success: (result: IDetail, messages) => {
        this.setData({messages: [], time: wx.$formatDate(result.time), timestamp: result.time})
        if (messages.length > 2) {
          const data: any = {
            show: true,
            title: messages[0],
            desc: messages[1],
            tips: messages[2],
          }
          if (messages.length > 3) {
            data.subtitle = messages[3]
          } else {
            data.subtitle = undefined
          }
          this.initDate(result, option.score)
          wx.hideToast()
          this.setData ({
            halfScreen: data,
            demo: true,
          })
        } else {
          this.setData({messages: messages})
          this.initDate(result, option.score)
          wx.hideToast()
        }
        wx.$waterMark(this)
      },
    })
  },

  onShow: function() {
    this.setData({timestamp: this.data.timestamp, time: wx.$formatDate(this.data.timestamp), my_time: wx.$formatDate(app.globalData.scoreData.result.time)})
  },

  shareScore: function() {
    wx.showToast({
      title: '授权中',
      icon: 'loading',
      duration: 6000,
    })
    wx.$request({
      path: 'share_score',
      actions: true,
      methods: 'POST',
      type: 'any',
      success: () => {
        app.globalData.scoreData.result.share_score = true
        this.setData({share_score: true, halfScreen: {show: false}})
        wx.setStorageSync('share_score', true)
        wx.showModal({
          title: '共享分数成功',
          content: '请重新进入该课程详情页面',
          showCancel: false,
          success() {
            app.globalData.refreshCourses = true
            wx.navigateBack({delta: 1})
          },
        })
      },
      failed: () => {
        wx.navigateBack()
      },
    })
  },

  bindHalf: function(e) {
    switch (e.detail.index) {
      case 0:
        this.shareScore()
        break
      case 1:
        this.setData ({
          halfScreen: {show: false},
        })
        break
    }
  },


  initDate: function(data: IDetail, yourScore) {
    let predict = null
    if (data.scores !== null) {
      predict = data.count
      for (let i = 100; i > yourScore; i--) {
        predict -= data.scores[i]
      }
      predict = (predict / data.count * 100).toFixed(0) + '%'
    }
    this.setData({
      className: data.name,
      credit: data.credit,
      classType: data.type,
      academy: data.academy,
      type_full: data.type_full,
      academy_full: data.academy_full,
      majors: data.majors,
      id_full: data.id_full,
      // 全校平均成绩
      averScore: data.avg,
      averGPA: (4.0 * data.A + 3.0 * data.B + 2.0 * data.C) / (data.A + data.B + data.C + data.F),
      stdDev: data.std,
      higestScoree: data.max,
      GPAdistribution_A: data.A,
      GPAdistribution_B: data.B,
      GPAdistribution_C: data.C,
      GPAdistribution_D: data.F,
      GPAdistribution_A_Rate: data.A / data.count * 100,
      GPAdistribution_ABC_Rate: (data.A + data.B + data.C) / data.count * 100,
      // 时间与样本量
      count: data.count,
      predict: predict,
      instructors: data.instructors,
      year_term: data.year_term,
    })

    if (data.scores === null) {
      this.setData({ifDistribution: false})
      return
    }

    for (let i = 60; i <= 100; i++) {
      scoreDistribute[i - 60] = data.scores[i]
    }

    chartNext = function() {
      // 画出分布图
      chart.setOption({
        color: ['#5e5e5e'],

        grid: {
          left: 10,
          right: 40,
          bottom: 20,
          top: 40,
          containLabel: true,
        },
        xAxis: [
          {
            type: 'value',
            name: '人数',
            axisLine: {
              lineStyle: {
                color: '#999',
              },
            },
            axisLabel: {
              color: '#666',
            },

          },
        ],
        yAxis: [
          {
            type: 'category',
            name: '成绩/分',
            axisTick: { show: false },
            data: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
              81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
            axisLine: {
              lineStyle: {
                color: '#999',
              },
            },
            axisLabel: {
              color: '#666',
            },
          },
        ],
        series: [
          {
            name: '人数',
            type: 'bar',
            label: {
              normal: {
                show: true,
                position: 'right',
              },
            },
            data: scoreDistribute,
            itemStyle: {
              // emphasis: {
              //   color: '#37a2da'
              // }
            },
          },
        ],
      })
    }

    if (init) {
      chartNext()
    }
  },
})

export {}
