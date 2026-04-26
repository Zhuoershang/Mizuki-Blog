---
title: '[转载]最快的访问！使用Cloudflare+CDN节点优选+Workers重定向lucky的IPv4-STUN穿透HTTP请求'
slug: 转载最快的访问使用cloudflarecdn节点优选workers重定向lucky的ipv4-stun穿透http请求
published: 2026-03-05
description: >-
  为了实现内网IPv4的完美访问，之前的方案存在请求/重定向时间长和页面规则过少的痛点问题。新的方案采用Cloudflare的Workers和CDN优选，利用JavaScript脚本实现多个通配符匹配，优化首次请求的响应速度。方案包括配置Cloudflare、腾讯云DNS和lucky三个部分，通过Worker脚本和WebHook实现端口的动态更新，适用于支持302重定向的客户端。
image: "./cover.png"
tags: ["Cloudflare Worker", "IPv4", "重定向", "转载"]
category: 教程
draft: false
createdAt: '2026-02-26T05:17:08.000Z'
updatedAt: '2026-03-22T05:29:05.000Z'
readTimeInMinutes: 8
---
## 前言

之前我发过几篇文章，都是围绕lucky打通内网IPv4如何达到完美访问的。最后一篇是将域名托管到Cloudflare（以下简称CF）上使用"页面规则"来实现HTTP重定向，并添加上STUN的端口号实现完美HTTP访问。

但是这样其实还不够完美，存在几个痛点问题。

## 原有方案的痛点

### 1. 请求/重定向时间长

将域名托管到CF后，每次DNS请求都会发往CF进行解析。由于众所周知的原因，CF的DNS服务器在国内解析速度非常慢，与国内DNS厂商（腾讯、百度、阿里等）相比有一个数量级的差别。更糟的是，因为是重定向的缘故，每次首次请求获取实际带STUN端口的地址，都要进行两次CF的IP地址请求：第一次请求是获取端口号，第二次请求是获取实际访问的IP地址。对于多次跳转不同域名的等待时间，显然是不能接受的。

### 2. 页面规则过少且功能受限

免费账户只能创建3个页面规则，其中至少一个要用来匹配*.[example.com](http://example.com)​。但这有个弊端——不能附带路径。比如*.example.com/web/index.html​最后会被重定向成*.stun.example.com:6666​，访问路径部分因为通配符只能匹配一处的缘故被丢弃了。

虽然可以再创建一个页面规则为特定域名做路径匹配（b.example.com/*​变成b.stun.example.com:6666/*​），但一个账号最多只能创建2个路径匹配的页面规则，对于有多个需要携带路径附带的请求就无能为力了。

## 新方案：Workers + CDN优选

在研究CF的CDN节点IP优选时，我发现CF的Workers可以编写JavaScript脚本。于是可以利用其来实现多个通配符匹配，实现域名和路径全匹配。并且这个方案使用了CF的CDN-IP优选，还可以优化首次请求的响应速度，减少DNS请求的等待时间。

> ⚠️ 注意：本方法只适用于浏览器HTTP的访问（准确来说应该是支持302重定向的方式）。不支持例如Jellyfin、Emby、Home Assistant等APP，但其网页端是可以支持使用的。因为该功能需要依赖APP支持服务器地址重定向请求，目前测试MT Photos和飞牛OS是支持重定向的。

## 一、前提条件

- 一个主域名托管到Cloudflare（[本文用a.com](http://本文用a.com)​演示）
- 第二个副域名托管到国内DNS服务商（[本文用b.net](http://本文用b.net)​演示，托管到腾讯云DNS）
- 会使用lucky的STUN功能
- 会使用lucky的WebHook功能

> 💡 如果你是第一次使用lucky的STUN穿透和WebHook的小白，建议先看详细的基础教程，原理上都是和本教程一致的。本教程省略了一些基础步骤和方法，适合已经有lucky的STUN基础的读者。

## 二、方案原理与流程

下图清晰地展示了整个访问流程：

1. [用户想要访问www.a.com/index.html​网页。因为a.com​托管在CF，首先会向CF请求www.a.com​的IP地址。由于我们进行了CDN-IP优选，请求会发往最近的CDN节点。](http://用户想要访问www.a.com/index.html​网页。因为a.com​托管在CF，首先会向CF请求www.a.com​的IP地址。由于我们进行了CDN-IP优选，请求会发往最近的CDN节点。)
2. CDN收到DNS请求后，流经CF的Workers.js进行处理，[重定向后返回带端口号和路径的副域名www.b.net:6666/index.html​，同时保留了二级域名和路径。](http://重定向后返回带端口号和路径的副域名www.b.net:6666/index.html​，同时保留了二级域名和路径。)
3. [因为b.net](http://因为b.net)​托管在国内DNS，就近进行DNS查询并返回真实IP地址，最终完成HTTP页面请求。

## 三、配置Cloudflare

### 1. 添加CNAME记录到IP优选域名

CF的IP优选就是在访问网站之前先进行自适应连接最近的CDN，以加快后续访问。这通常需要接入一个CNAME的CDN优选域名来帮助做CDN筛选。

操作步骤：

- 登录Cloudflare控制台，进入你的主域名（[a.com](http://a.com)​）管理页面
- 在DNS解析记录中添加一条CNAME记录：
  - 类型：CNAME
  - 名称：*​（泛域名）
  - 目标：[cf.090227.xyz](http://cf.090227.xyz)​（或其他优选域名）
  - 代理状态：仅DNS（关闭小黄云）

> 📚 关于域名优选的详细分析和优化方法，博主有专门的文章深入讲解，感兴趣的可以点我了解。

### 2. 创建Worker

步骤：

1. 在Cloudflare左侧菜单栏，点击 "Workers 和 Pages"
2. 点击 "创建应用程序" → "创建Worker"
3. 名称填写 redirect​，点击 "部署"
4. 部署完成后点击 "编辑代码"

编写Worker脚本：  
将以下JavaScript代码粘贴到编辑器中，并根据你的实际情况修改配置参数：

```javascript
// 配置参数
const CONFIG = {
    // 需要重定向的源域名
    sourceDomain: 'a.com',
    // 重定向后的目标域名
    targetDomain: 'b.net',
    // 目标端口号
    targetPort: '4443'  // 这里可以先填写一个默认端口，后面会被lucky自动更新
};

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 只要hostname中包含sourceDomain，就进行重定向
    if (hostname.includes(CONFIG.sourceDomain)) {
        const newHost = hostname.replace(CONFIG.sourceDomain, CONFIG.targetDomain);
        const targetUrl = `https://${newHost}:${CONFIG.targetPort}${url.pathname}${url.search}`;

        // 返回302临时重定向
        return Response.redirect(targetUrl, 302);
    }

    // 如果不是目标域名，则返回404
    return new Response('Not Found', { status: 404 });
}

```

修改完成后，点击右上角的 "部署" 按钮保存。

### 3. 添加Worker路由

为了让特定域名的请求能够触发这个Worker，需要添加路由：

1. 在Worker详情页，点击 "设置" 选项卡
2. 找到 "域和路由" 部分，点击 "添加路由"
3. 配置路由：
  - 路由：*.a.com/*​
  - 区域：选择你的主域名（[a.com](http://a.com)​）
4. 点击 "添加路由" 保存

完成后，所有对*.a.com/*​的请求都会被这个Worker处理。

> 💡 可以选择将这个Worker页面隐藏，也可以保留作为调试。预览URL不要开启。

### 4. 获取Worker编辑API密钥

为了让lucky能够自动更新Worker脚本中的端口号，需要创建一个API令牌：

1. 点击右上角个人资料图标，选择 "我的个人资料"
2. 进入 "API令牌" 选项卡，点击 "创建令牌"
3. 选择 "创建自定义令牌"
4. 配置令牌：
  - 令牌名称：workers-token​
  - 权限：账户​ → Workers脚本​ → 编辑
5. 点击 "继续以摘要"，然后 "创建令牌"
6. 立即保存生成的API密钥（后面配置lucky时需要）

## 四、配置腾讯云DNS

这里主要是将副域名（[b.net](http://b.net)​）托管到腾讯云DNS，并获取API密钥用于DDNS。

1. [在腾讯云DNS解析中添加b.net](http://在腾讯云DNS解析中添加b.net)​域名的解析记录（可以先添加一条测试记录）
2. 获取腾讯云API密钥（SecretId和SecretKey），后续在lucky的DDNS配置中需要

## 五、配置lucky

### 1. 添加DDNS解析记录

在lucky的"动态域名"中添加一个DDNS任务，用于将副域名的泛域名解析到当前的公网IP：

- 服务商：选择"腾讯云DNS"
- 域名：[b.net](http://b.net)​
- 记录类型：A记录
- 主机记录：*​（泛域名）
- API密钥：填写从腾讯云获取的SecretId和SecretKey
- 获取IP方式：选择适合你网络环境的方式（如"通过接口获取公网IP"）

> 📝 详细配置步骤可以参考之前的基础教程。

### 2. 添加STUN穿透

在lucky的"STUN穿透"中创建一个穿透任务，并配置WebHook来自动更新Worker中的端口号。

WebHook配置参数：

- 接口地址：[https://api.cloudflare.com/client/v4/accounts/你的账户ID/workers/scripts/redirect​](https://api.cloudflare.com/client/v4/accounts/你的账户ID/workers/scripts/redirect​)
- 请求方法：PUT​
- 请求头：
  - ​Authorization: Bearer 你的Worker API密钥​
  - ​Content-Type: application/javascript​
- 接口调用成功包含的字符串："success": true​

> 📌 账户ID可以在Cloudflare控制台右侧栏找到。

请求体（注意targetPort​字段使用了#{port}​变量，lucky会自动替换为STUN获取的公网端口）：

```javascript
// 配置参数
const CONFIG = {
    // 需要重定向的域名
    sourceDomain: 'a.com',
    // 重定向后的域名
    targetDomain: 'b.net',
    // 目标端口号 - #{port}会被lucky自动替换为STUN获取的公网端口
    targetPort: '#{port}'
};

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // 只要hostname中包含sourceDomain，就将sourceDomain替换为targetDomain，并指定port
    if (hostname.includes(CONFIG.sourceDomain)) {
        const newHost = hostname.replace(CONFIG.sourceDomain, CONFIG.targetDomain);
        const targetUrl = `https://${newHost}:${CONFIG.targetPort}${url.pathname}${url.search}`;

        // 返回302临时重定向
        return Response.redirect(targetUrl, 302);
    }
    // 如果不是目标域名，则返回404
    return new Response('Not Found', { status: 404 });
}

```

配置完成后，每当STUN穿透获取到新的公网端口，lucky会自动调用WebHook更新Worker脚本中的端口号，实现端口的动态更新。

## 测试与效果

在[itdog](https://www.itdog.cn/http/)网站测试，可以看到连接都是通过多个CDN节点接入，大大加快了解析和访问速度。

## 常见问题

### Q1：如果有多个穿透端口需要设置怎么办？

目前我只有一个端口重定向的需求，因为在后台搭配反向代理的话，只用一个端口就可以实现多个Web服务的映射，通过域名来做区分，不需要开放多个端口。如果确实需要多个端口重定向，可以在Worker的JS代码中修改成多个域名匹配。

### Q2：这个方法适用于哪些客户端？

适用于支持302重定向的客户端。目前测试MT Photos和飞牛OS是支持的。Jellyfin、Emby、Home Assistant等APP的网页端可以使用，但客户端可能不支持重定向。

### Q3：如果有公网IP，还需要用这个方法吗？

如果有公网IP可以直接使用域名访问，不需要做STUN。但关键是现在大部分家庭网络都回收了公网IPv4，并且即使有公网IP也无法访问80/443端口，依旧需要重定向到别的端口来访问。

---

> 📌 本文由 FishBoss_Tca 原创，转载请注明作者和原文链接。
> 
> 原文链接：[https://www.ytca.top/guidance/1708/](https://www.ytca.top/guidance/1708/)
> 
> 标签：[STUN](https://www.ytca.top/tag/stun/) [网站](https://www.ytca.top/tag/%e7%bd%91%e7%ab%99/) [网络](https://www.ytca.top/tag/%e7%bd%91%e7%bb%9c/)
