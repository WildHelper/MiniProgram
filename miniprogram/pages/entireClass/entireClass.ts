/// <reference path="../../../typings/index.d.ts" />

const app: IMyApp = getApp()

Page({
  defaultData: {
    // 全部课程数
    count: undefined,
    // 当前页显示的课程
    classes_show: [],
    // 当前显示页
    curPage: 0,
    // 显示起始项与显示终止项序号
    startIndex: undefined,
    endIndex: undefined,
    // 页面号
    pages: [],
    // 每页显示内容
    perpage: 10,
    // 课程种类
    types: [],
    curType: '全部课程类型',
    academys: [],
    major: undefined,
    curAcademy: '全部学院',
    // 搜索框输入内容
    searchKey: '',
    showClearBtn: false,
    messages: [],
    checked: false,
    checkedElective: false,
    // 当前排序方式 true为降序
    sortD: {
      'avg': true,
      'count': true,
      'excellentRate': true,
      'passRate': true,
      'gpa': true,
    },
  },
  data: {},
  // 全部课程
  resDate: [],
  classes: [],
  classesRaw: [],
  classesNew: [],
  searchKey: '',
  time: 0,
  onInput(evt) {
    this.searchKey = evt.detail.value
    this.setData({
        showClearBtn: !!this.searchKey.length,
    })
    this.search(this.searchKey)
  },
  onClearCount() {
    this.search('')
  },
  search: function(searchKey) {
    if (searchKey === '') {
      this.setData({
        searchKey: '',
        showClearBtn: false,
      })
    }
    const classes: IOverview[] = this.classesRaw
    // 筛选全部课程列表 更新总页数 总课程数 
    const classesNew = []
    for (const i in classes) {
      // tslint:disable-next-line:triple-equals
      if ((classes[i].name.toLowerCase() + ' / ' + classes[i].id_full.join(' / ')).indexOf(searchKey.toLowerCase()) != -1) {
        classesNew.push(classes[i])
      }
    }
    const totalPageNumber = parseInt(String((classesNew.length - 1) / this.data.perpage + 1), 10)
    const pages = []
    for (let i = 1; i <= totalPageNumber; i += 1) { pages.push(i) }
    this.classesNew = classesNew
    this.setData({
      count: classesNew.length,
      pages: pages,
    })
    // 重置各数据
    this.changeShow(0)
  },

  // 根据页数，更改显示内容、显示起始项、显示终止项序号
  changeShow: function(curPage) {
    if (typeof this.classesNew === 'undefined' || !this.classesNew || typeof this.classesNew.slice !== 'function') {
      return
    }
    const classes_show: IOverview[] = this.classesNew.slice(curPage * this.data.perpage, curPage * this.data.perpage + this.data.perpage)
    let endIndex: number
    if ((curPage + 1) * this.data.perpage < this.data.count) { endIndex = (curPage + 1) * this.data.perpage } else { endIndex = this.data.count}
    this.setData({
      curPage: curPage,
      classes_show: classes_show,
      startIndex: curPage * this.data.perpage + 1,
      endIndex: endIndex,
    })
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 0,
    })
  },

  bindPageChange: function(e) {
    const curPage = parseInt(e.detail.value, 10)
    this.changeShow(curPage)
  },

  bindTypeChange: function(e) {
    const curType = this.data.types[parseInt(e.detail.value, 10)]
    this.setData({curType: curType})
    this.filter()
  },

  bindAcademyChange: function(e) {
    const curAcademy = this.data.academys[parseInt(e.detail.value, 10)]
    this.setData({curAcademy: curAcademy})
    this.filter()
  },

  filter: function() {
    const classesNew: IOverview[] = []
    const {curType, curAcademy} = this.data
    // 筛选type与academy
    for (const i in this.resDate) {
      const curClass: IOverview = this.resDate[i]
      if ((curType === '全部课程类型' || curClass.type_full.indexOf(this.data.curType) !== -1) && (curAcademy === '全部学院' || curClass.academy_full.indexOf(this.data.curAcademy) !== -1)) {
        if (typeof this.data.major === 'undefined') {
          classesNew.push(curClass)
        } else if (this.data.major === '仅公选课' && curClass.is_elective) {
          classesNew.push(curClass)
        } else if (curClass.majors.indexOf(this.data.major) !== -1) {
          classesNew.push(curClass)
        }
      }
    }

    this.classesRaw = classesNew
    this.classes = classesNew
    this.setData({
      count: classesNew.length,
    })
    this.search('')
    this.changeShow(0)
  },

  setTypesAndAcademies: function(classesRaw: IOverview[]) {
    const typeSet: any = {}
    const academySet: any = {}
    for (const i of classesRaw) {
      for (const j of i.type_full) {
        if (typeof typeSet[j] === 'undefined') {
          typeSet[j] = 1
        } else {
          ++typeSet[j]
        }
      }
      for (const j of i.academy_full) {
        if (typeof academySet[j] === 'undefined') {
          academySet[j] = 1
        } else {
          ++academySet[j]
        }
      }
    }

    if (typeof academySet.体育教学部 !== 'undefined') {
      academySet.体育教学部 = Number.MAX_SAFE_INTEGER - 100
    }

    const types = []
    for (const i in typeSet) {
      if (typeSet[i] >= 10 || wx.$getTypeOrder(i) <= 100) {
        types.push(i)
      }
    }
    const academy = []
    for (const i in academySet) {
      academy.push(i)
    }
    if (!types || typeof types.sort !== 'function') {
      return
    }
    types.sort((a: string, b: string) => {
      let l = wx.$getTypeOrder(a)
      let r = wx.$getTypeOrder(b)
      if (l >= Number.MAX_SAFE_INTEGER - 100) {
        l -= typeSet[a]
      }
      if (r === Number.MAX_SAFE_INTEGER - 100) {
        r -= typeSet[b]
      }
      return l - r
    })
    if (!academy || typeof academy.sort !== 'function') {
      return
    }
    academy.sort((a: string, b: string) => {
      return academySet[b] - academySet[a]
    })
    types.unshift('全部课程类型')
    academy.unshift('全部学院')
    this.setData({types: types, academys: academy})
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
    this.setData(JSON.parse(JSON.stringify(this.defaultData)))
    this.time = +new Date() / 1000
    // 获取全部成绩列表
    wx.showLoading({
      title: '加载中',
    })
    wx.$request({
      path: 'overview/scores',
      actions: false,
      methods: 'GET',
      type: 'overview',
      success: (result: IOverview[], messages) => {
        this.resDate = result
        this.classes = result
        this.classesRaw = result
        this.classesNew = result
        this.setData({
          count: result.length,
          messages: messages,
        })
        if (typeof this.classes === 'undefined' || !this.classes || typeof this.classes.slice !== 'function') {
          return
        }
        // 默认显示第一页
        const classes_show: IOverview[] = this.classes.slice(this.data.curPage, this.data.curPage + this.data.perpage)
        let endIndex
        if (this.data.perpage < this.classes.length) { endIndex = this.data.perpage } else { endIndex = this.classes.length}
        this.setData({
          classes_show: classes_show,
          startIndex: 1,
          endIndex: endIndex,
        })

        // 遍历所有课程 总结课程种类信息
        this.setTypesAndAcademies(this.classesRaw)

        // 计算总页数
        const totalPageNumber = parseInt(String((this.classes.length - 1) / this.data.perpage + 1), 10)
        const pages = []
        for (let i = 1; i <= totalPageNumber; i += 1) { pages.push(i) }
        this.setData({pages: pages})
        wx.showToast({
          title: '加载成功',
          icon: 'success',
          duration: 500,
        })
        wx.$waterMark(this)
      },
      failed: () => {
        wx.hideLoading()
      },
      complete: () => {
        wx.stopPullDownRefresh()
      },
    })
  },

  pagingHandeler: function(e) {
    let curPage = this.data.curPage
    if (e.currentTarget.dataset.d === 'up') {
      // 上翻页
      if (curPage > 0) {
        curPage -= 1
      } else {
        // 弹窗 已到首页
        wx.showToast({
          title: '已到首页',
          icon: 'none',
          duration: 1500,
        })
      }
    } else {
      // 下翻页
      if (curPage < this.data.pages.length - 1) {
        curPage += 1
      } else {
        // 弹窗 已到末页
        wx.showToast({
          title: '已到末页',
          icon: 'none',
          duration: 1500,
        })
      }
    }

    this.changeShow(curPage)
  },

  JumpHandeler: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../scoreDetailPage/scoreDetailPage?id=' + id + '&gpa=' + 'NotAScore' + '&score=' + 'NotAScore',
    })
  },

  sort: function(event) {
    this.setData({
      classes_show: [],
    })
    const classesNew: IOverview[] = this.classesNew
    const poperty = event.currentTarget.dataset.poperty
    const sortD = this.data.sortD
    const d = true
    this.setData({
      sortD: sortD,
    })
    if (!classesNew || typeof classesNew.sort !== 'function') {
      return
    }
    classesNew.sort(function(a, b) {
      let score0
      let score1
      switch (poperty) {
        case 'avg':
          score0 = a.avg
          score1 = b.avg
          break
        case 'count':
          score0 = a.count
          score1 = b.count
          break
        case 'excellentRate':
          score0 = a.A / a.count
          score1 = b.A / b.count
          break
        case 'passRate':
          score0 = (a.A + a.B + a.C) / a.count
          score1 = (b.A + b.B + b.C) / b.count
          break
        case 'gpa':
          score0 = (a.A * 4 + a.B * 3 + a.C * 2) / a.count
          score1 = (b.A * 4 + b.B * 3 + b.C * 2) / b.count
          break
        default:
          return 0
      }
      if (typeof score0 !== 'number' || isNaN(score0)) {
        score0 = -1
      }
      if (typeof score1 !== 'number' || isNaN(score1)) {
        score1 = -1
      }
      // 默认降序，再次点击后升序
      if (d) {
        return score1 - score0
      } else {
        return score0 - score1
      }
    })
    this.classes = classesNew
    this.changeShow(0)
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      wx.$initTab(this.getTabBar())
      this.getTabBar().setData({
        selected: app.globalData.courses_tab,
      })
    }
    if (app.globalData.refreshCourses) {
      this.onLoad()
      app.globalData.refreshCourses = false
    }
  },

  onPullDownRefresh: function() {
    if (this.time + 6 > +new Date() / 1000) {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '手速太快了，等一会儿再刷新试试吧',
        icon: 'none',
        duration: 3000,
      })
      return
    }
    this.onLoad()
  },

  bindMajor: function(e) {
    if (e.detail.value.length === 2) {
      if (this.data.major === '仅公选课') {
        e.detail.value = ['majorOnly']
      } else {
        e.detail.value = ['elective']
      }
    }
    if (e.detail.value[0] === 'majorOnly') {
      this.data.major = app.globalData.scoreData.result.major
      this.setData({checkedElective: false})
    } else if (e.detail.value[0] === 'elective') {
      this.data.major = '仅公选课'
      this.setData({checked: false})
    } else {
      this.data.major = undefined
      this.setData({checked: false, checkedElective: false})
    }
    this.setData({curAcademy: '全部学院', curType: '全部课程类型'})
    this.filter()
    this.setTypesAndAcademies(this.classesNew)
    if (this.data.major === '仅公选课') {
      this.setData({types: ['全部课程类型', '体育课', '通识教育选修课', '外语选修课', '通识教育任意选修', '经济管理选修课',
          '数学与自然科学选修课', '校选修课', '经管文法艺术类选修课', '工程自然类选修课']})
    }
  },
})

export {}
