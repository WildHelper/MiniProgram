# 野生工大助手小程序

2020中国高校计算机大赛 微信小程序应用开发赛 决赛入围后被淘汰的垃圾之作

本程序在 [GNU Affero GPL v3.0](LICENSE) 下开源。若修改本程序并在网络上提供服务，必须使用相同协议公开修改后的完整源代码。

Copyright (C) 2020 郭泽宇 <ze3kr@icloud.com>, 文一涵

[版本更新日志](CHANGELOG.md)

![小程序码](https://user-images.githubusercontent.com/6601455/87315927-a5a37100-c557-11ea-88a6-bc897e460752.jpg)

体验账户用户名: `bjutdemo` 密码: (留空即可)

## 安装

开发时使用了 TypeScript，需要将其将其编译成 JavaScript 才可使用

先运行 `npm install`；然后进入微信开发者工具，选择 `工具 - 构建 npm`

下载 `echart.js` 到 `./miniprogram/ec-canvas` 目录中

该项目有意将 `.idea` 提交。使用 WebStorm/PhpStorm 编辑文件时会原地将 TypeScript 文件编译为 JavaScript。

## 配置

修改 `./miniprogram/app.ts` 中 `App()` 函数的 `globalData.url_api` 和 `globalData.url_logo` 以自定义 API 地址和首页图标。

## 截图

<img src="https://user-images.githubusercontent.com/6601455/87389305-18a0fc00-c5d9-11ea-8329-028038f6668d.PNG" width="200" /> <img src="https://user-images.githubusercontent.com/6601455/87389413-48500400-c5d9-11ea-84f5-24d8fb8480af.PNG" width="200" /> <img src="https://user-images.githubusercontent.com/6601455/87389498-6c134a00-c5d9-11ea-88cc-5c378fe2b105.PNG" width="200" /> <img src="https://user-images.githubusercontent.com/6601455/87389508-6fa6d100-c5d9-11ea-9d65-1a8d2a772a64.PNG" width="200" /> <img src="https://user-images.githubusercontent.com/6601455/87389513-71709480-c5d9-11ea-8869-ec8adcb31124.PNG" width="200" /> <img src="https://user-images.githubusercontent.com/6601455/87389522-733a5800-c5d9-11ea-99a8-2681f5afa489.PNG" width="200" /> <img src="https://user-images.githubusercontent.com/6601455/87389527-76354880-c5d9-11ea-8f70-244c7809faf8.PNG" width="200" /> <img src="https://user-images.githubusercontent.com/6601455/87389532-77ff0c00-c5d9-11ea-96cf-df8c1cc257b0.PNG" width="200" />

## 核心技术

### 后期运维

#### 新浪云 SAE – 国内领先 PaaS

+ 免运维、按使用量付费，无最低消费
+ 数据库使用云KVDB/Redis/Memcached，**每秒万次请求**
+ 自动扩容、负载均衡、数据冗余存储

#### 腾讯云 SCF (云函数)

+ 小程序直接适配自动鉴权，作为部分功能的中间件

### 后期维护

+ 使用模块化开发，**半个月从零到上线**，开发效率高
+ **前后端完全分离**，后端使用负载均衡，根据业务类型使用GoLang、Node.js、PHP，面向对象编程，**极易扩展**，通用 RESTful API
+ **异步任务队列**实现出分推送群发功能
+ 前端强类型 TypeScript 开发，**方便重构**

### 其他功能

+ 使用**原生**小程序开发，支持微信数据**预加载**、**周期性**更新，每月为用户节省1200小时
+ **爬虫**与学校官方对接实现数据**实时自动获取**；登录使用 OpenID 鉴权，其他小程序无法盗用 API
+ 第四版开始支持**校友认证**，学校网关账户绑定微信OpenID实现认证，毕业后可使用免密OpenID授权，100%保证用户真实，比学信网更简单易用；由于个人服务类目受限没有开发此功能
+ 用户直方图使用**Canvas2D**自动绘制，性能极强
+ 灰度功能**开关**；错误日志**自动上报**、微信群预警，方便紧急维护；用户反馈按钮随时接入客服
+ 使用了**端到端加密 (AES-256-GCM)**，中间人（包括微信）不可拿到任何用户数据；非选课周用户只能看到自己选择的课程；服务器**永不存储用户密码**；**撤销授权机制**，不想用了可以彻底删除所有用户数据，保证用户安全
+ 在企业微信、Mac微信、Windows微信等特殊客户端测试
+ DDOS防火墙、异地多活、WAF防火墙限频、等等……

## 开软软件使用

### GNU Affero GPL v3.0

+ [ZE3kr/BjutHelper-MiniProgram](https://github.com/ZE3kr/BjutHelper-MiniProgram)
+ [ZE3kr/BjutHelper-PHP](https://github.com/ZE3kr/BjutHelper-PHP)

### MIT License

+ [leoleoasd/zf_spider](https://github.com/leoleoasd/zf_spider)
+ [slimphp/Slim](https://github.com/slimphp/Slim)
+ [slimphp/Slim-Psr7](https://github.com/slimphp/Slim-Psr7)
+ [Tencent/weui](https://github.com/Tencent/weui)
+ [brix/crypto-js](https://github.com/brix/crypto-js)
+ [nodeca/pako](https://github.com/nodeca/pako)

### Apache License v2.0

+ [apache/incubator-echarts](https://github.com/apache/incubator-echarts)

### BSD 3-Clause License

+ [ecomfe/echarts-for-weixin](https://github.com/ecomfe/echarts-for-weixin)
