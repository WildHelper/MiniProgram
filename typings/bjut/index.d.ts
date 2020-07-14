import GeneralCallbackResult = WechatMiniprogram.GeneralCallbackResult
type ApiMethods = 'GET'|'POST'|'DELETE'
type ApiRespTypes = 'term'|'schedule'|'exams'|'overview'|'detail'|'cets'|'any'

interface IExtendedWx extends WechatMiniprogram.Wx {
  $formatDate(arg0: any),
  $base64(arg0: any),
  $initTab(arg0: any),
  $waterMark(arg0: any),
  $forCourses(c: ICourse[], unread: { [courseId: string]: ICourse }, minor?: boolean, all?: boolean): {unreadCount, credits, pass, ungraded, unsubscribed, passCredits, gradedCredits, nums},
  $request<T>(options: {
    success: (resp: T, messages: string[], errors?: IApiError[]) => void,
    noneData?: () => void,
    failed?: (res?) => void,
    complete?: (res?) => void,
    actions: boolean,
    path: string,
    methods: ApiMethods,
    type: ApiRespTypes,
    data?: object,
  }),
  $validateType(arg: any, type: ApiRespTypes): boolean,
  $getTypeOrder(arg: string): number,
  $validateTypeResp<T>(arg: IApi<T>, type: ApiRespTypes, callbacks?: {noneData?: () => void, failed?: (res?) => void, success: (resp: T, messages: string[]) => void}): boolean,
  $loginSuccess(resp: any): void,
  $createVideoAd(arg: any): void,
  $loadVideoAd(): void,
  $logout(): void,
}

// tslint:disable-next-line:interface-name
interface Wx extends WechatMiniprogram.Wx {
  [functionName: string]: any
}

// @ts-ignore
declare const wx: IExtendedWx

interface IMyApp {
  // @ts-ignore
  getCurrentPage(): wx.Page,
  globalData: IGlobalData
}

interface IGlobalData {
  unread?: {
    [courseId: string]: ICourse,
  },
  scoreData?: IApi<ITerms>,
  student_id?: string,
  authorization?: string,
  show_exam?: boolean,
  show_courses?: boolean,
  refreshCourses?: boolean,
  map?: {
    [courseId: string]: boolean,
  },
  exam_tab?: number,
  courses_tab?: number,
  background?: string,
  schedule: ISchedule,
  backgroundFetchTimestamp: number,
  redirect?: {
    year?: string,
    term?: string,
    courseId?: string,
  },
  open?: string,
  videoAd?: WechatMiniprogram.RewardedVideoAd,
  sceneId: number,
  url_api: string,
  url_logo: string,
}

interface IResp<T> {
  /** 回调函数返回的内容 */
  data: T,
  /** 开发者服务器返回的 HTTP 状态码 */
  statusCode: number,
  /** 开发者服务器返回的 HTTP Response Header */
  header: object,
}

interface IApi<T> {
  errors: IApiError[],
  messages: string[],
  result: T,
  success: boolean,
  result_info?: {
    count: number,
    page: number,
    per_page: number,
    total_count: number,
  }
}

interface IApiError {
  code: number,
  message: string,
}

interface IRespWithTime {
  time: number,
  updated_time?: number
}

interface IRespWithList<T> {
  list: T[]
}

interface ITerms extends IRespWithTime {
  ad_messages: string[],           // TODO: 解释每个string的含义
  ad_times: number,
  current_year_term: string,
  exam_week: {
    [current_year_term: string]: [number, number], // [0] 为开始周，[1] 为结束周，[1] 可能大于 [0]
  },
  registration_week: {
    [current_year_term: string]: [number, number],
  },
  share_message: {
    imageUrl: string,
    imageUrlId: string,
    title: string,
  },
  switches: {
    cet: boolean,
  },
  share_score: boolean,
  has_open: boolean,
  is_no_password: boolean,
  course_time: number, // 课表更新时间
  subscribe_ids: string[],      // 订阅成绩的模版 id 列表，至少一个
  first_semester?: string,      // 入学时间
  average_GPA_minor?: number,   // 辅修 GPA
  average_GPA_term?: number,    // 在校期间总 GPA
  average_score_minor?: number, // 辅修加权
  average_score_term?: number,  // 总加权
  term_lesson_count?: number,   // 已出分的课程数
  term_lesson_minor?: number,   // 辅修课程数
  sid?: string,       // 学号
  class?: string,     // 班级号
  institute?: string, // 学院
  major?: string,
  name?: string,
  terms?: {
    [year: string]: {
      [term: string]: ITerm,
    },
  },
  shared?: string,
  ad_id?: string,
}

interface ITerm {
  course_time?: number,
  average_GPA_minor: number,
  average_GPA_term: number,
  average_score_minor: number,
  average_score_term: number,
  term_lesson_count: number,
  courses: (IGradedCourse|IUngradedCourse)[]
}

interface ICourse {
  academy: string,
  belong: string,
  comment: string,
  credit: string,
  gpa: string|number,
  id: string,
  makeup_score: string,
  minor_maker: string,
  name: string,
  retake_maker: string,
  retake_score: string,
  score: string|number,
  type: string,
  unread?: boolean,
  term: string,
  year: string,
}

interface IGradedCourse extends ICourse {
  gpa: string,
  score: string,
}

interface IUngradedCourse extends ICourse {
  courseSelectId: string,
  gpa: number,
  score: number,
  hours: string,
  instructor: string,
  room: string,
  selected: boolean, // 选修课
  textbook: boolean, // 需要教材
  time: string,      // 上课时间
}

interface IFetchCallback extends GeneralCallbackResult {
  fetchedData: string,
  timeStamp: number,
}

interface IOverview {
  A: number,
  B: number,
  C: number,
  F: number,
  academy: string,
  academy_full: string[],
  avg: number,
  belong: string,
  count: number,
  credit: string,
  id: string,
  id_full: string[],
  max: number,
  name: string,
  std: number,
  type: string,
  type_full: string[],
  majors?: string[],
  is_elective?: boolean
}

interface IDetail extends IOverview, IRespWithTime {
  year_term?: {
    [name: string]: {
      score: number,
      gpa: number,
      count: number,
    },
  },
  instructors?: {
    [name: string]: {
      score: number,
      gpa: number,
      count: number,
    },
  },
  scores?: {
    [score: string]: number,
  },
}

interface ISchedule extends IRespWithTime, IRespWithList<IUngradedCourse> {
  term: string,
  week: {
    [year: string]: {
      1: number,
      2: number,
    },
  },
  year: string,
  shared?: string,
  major?: string,
  name?: string,
  id?: string,
  semesters?: string[],
}

interface IExam {
  campus: string,
  courseName: string,
  id: string,
  name: string,
  room: string,
  seat: string,
  time: string,
  type: string,
}

interface IExams extends IRespWithTime, IRespWithList<IExam> {}

interface ICet {
  comprehensive: string,
  date: string,
  id: string,
  listening: string,
  name: string,
  reading: string,
  term: string,
  total: string,
  year: string,
}

interface ICets extends IRespWithTime {
  results: ICet[],
}
