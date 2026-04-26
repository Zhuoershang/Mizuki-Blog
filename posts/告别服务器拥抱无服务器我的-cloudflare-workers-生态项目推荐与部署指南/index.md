---
title: 告别服务器，拥抱无服务器：我的 Cloudflare Workers 生态项目推荐与部署指南
published: 2026-02-27
description: "本文介绍了基于Cloudflare Workers和Pages的开源项目，包括NodeWarden、Rin Blog、CloudFlare-ImgBed、Cloudflare-Clist、flare-stack-blog和edgetunnel。这些项目提供了密码管理、博客、图床、代理和网络加速等功能，且全部开源且可一键部署。通过这些项目，开发者可以轻松构建自己的应用程序，享受Cloudflare全球边缘网络带来的高性能和低延迟。"
image: "./cover.png"
tags: ["Bitwarden", "Cloudflare Worker", "BLOG"]
category: 教程
draft: false
slug: 告别服务器拥抱无服务器我的-cloudflare-workers-生态项目推荐与部署指南
createdAt: '2026-02-27T13:57:43.000Z'
updatedAt: '2026-03-22T02:16:02.000Z'
readTimeInMinutes: 9
---
如果你和我一样，是个不想操心服务器运维、不希望备案、还希望服务在全球都有不错访问速度的开发者，那么 **Cloudflare Workers** 这片“免费乐土”绝对值得深耕。

Workers 不仅免费额度相当慷慨（每天 10 万请求），而且依托 Cloudflare 的全球边缘网络，冷启动极快。今天，我就来整理一份我正在使用或关注的、基于 Cloudflare Workers/Pages 生态的开源项目清单。它们涵盖了**密码管理**、**图床**、**博客**以及**网络加速**，全部开源且可一键部署。

## 目录

1. [NodeWarden：在 Workers 上跑 Bitwarden 服务器](#1-nodewarden%E5%9C%A8-workers-%E4%B8%8A%E8%B7%91-bitwarden-%E6%9C%8D%E5%8A%A1%E5%99%A8)
2. [Rin Blog：现代化无服务器博客](#2-rin-blog%E7%8E%B0%E4%BB%A3%E5%8C%96%E6%97%A0%E6%9C%8D%E5%8A%A1%E5%99%A8%E5%8D%9A%E5%AE%A2)
3. [CloudFlare-ImgBed：多功能开源图床](#3-cloudflare-imgbed%E5%A4%9A%E5%8A%9F%E8%83%BD%E5%BC%80%E6%BA%90%E5%9B%BE%E5%BA%8A)
4. [Cloudflare-Clist：聚合订阅转换与代理](#4-cloudflare-clist%E8%81%9A%E5%90%88%E8%AE%A2%E9%98%85%E8%BD%AC%E6%8D%A2%E4%B8%8E%E4%BB%A3%E7%90%86)
5. [flare-stack-blog & edgetunnel](#5-flare-stack-blog--edgetunnel-%E5%8F%8A%E5%85%B6%E4%BB%96)

---

## 1. NodeWarden：在 Workers 上跑 Bitwarden 服务器

### 项目简介

​`NodeWarden` 是一个兼容 Bitwarden 协议的服务端实现，但它不是运行在 VPS 上，而是完全跑在 Cloudflare Workers 上，结合了 D1（数据库）和 R2（附件存储）。

### 推荐理由

- **极致省钱**：无需购买 VPS，利用 Cloudflare 的免费额度即可运行密码管理器后端 。
- **客户端兼容**：可以直接使用官方的 Bitwarden 客户端（浏览器扩展/手机 App），登录时选择自托管地址即可 。
- **功能强大**：支持 TOTP 二次验证（官方原本是付费功能），支持附件上传 。
- **数据自主**：密码数据完全由自己掌控，存在 Cloudflare 的 D1 数据库里。

### 开源地址

- **GitHub 仓库**：[https://github.com/quexten/NodeWarden](https://github.com/quexten/NodeWarden)

### 部署教程

根据 Appinn 社区的讨论和官方文档，部署流程如下 ：

1. **准备工作**：你需要有一个 Cloudflare 账号（且绑定了一张信用卡，用于激活 R2 和 D1，但免费额度足够）、一个 GitHub 账号。
2. **Fork 仓库**：将 NodeWarden 项目 Fork 到你的 GitHub。
3. **一键部署**：
  - 登录 Cloudflare Dashboard，进入 Workers 和 Pages。
  - 选择创建 Pages 应用，并连接你的 GitHub。
  - 选择你 Fork 的 NodeWarden 仓库，点击“开始设置”。
  - 系统会根据项目中的配置向导，自动提示你创建 D1 数据库和 R2 存储桶并绑定。
4. **初始设置**：
  - 部署成功后，访问 Cloudflare 分配的 `.workers.dev` 域名（建议绑定自定义域名）。
  - 按照页面提示，设置 `JWT_SECRET`（用于登录凭证加密）、管理员邮箱和密码。
  - 可选设置 TOTP 二次验证。
5. **使用客户端登录**：
  - 打开 Bitwarden 官方 App，点击左下角设置，选择“自托管”。
  - 输入你的域名（如 `https://pass.yourdomain.com`），然后输入刚才设置的管理员账号密码即可登录 。

---

## 2. Rin Blog：现代化无服务器博客

### 项目简介

​`Rin`​ 是一个基于 **Cloudflare Pages + Workers + D1 + R2** 全家桶的博客系统。它拥有友好的后台界面，支持在线写作，彻底告别 Hexo 等静态博客“写完需编译部署”的繁琐流程 。

### 推荐理由

- **真正的动态博客**：相比于静态站点生成器，Rin 提供了后台，可以随时随地在线写文章、修改文章 。
- **数据本地化**：文章存于 D1，图片存于 R2，利用 Cloudflare 网络全球加速 。
- **功能现代**：支持 GitHub OAuth 登录、标签系统、友链检测、评论通知 Webhook、夜间模式等 。
- **无需备案**：域名只要托管在 Cloudflare 即可，无需国内备案 。

### 开源地址

- **GitHub 仓库**：[https://github.com/openRin/Rin](https://github.com/openRin/Rin)

### 部署教程

项目提供了详细的部署文档 ：

1. **前置条件**：一个域名托管在 Cloudflare，GitHub 账号。
2. **Fork 并部署 Pages**：
  - Fork 仓库 。
  - 在 Cloudflare Pages 中，连接你的 GitHub 并导入 `Rin` 项目。
  - 构建命令通常为 `npm install && npm run build`​，输出目录为 `dist`。
3. **创建 D1 数据库**：
  - 在 Cloudflare Dashboard 的 D1 中创建一个数据库（例如 `rin-db`）。
  - 进入 Pages 项目设置 > 绑定 > 添加 D1 数据库，变量名需参考项目文档（通常为 `DB`）。
4. **创建 R2 存储桶**：
  - 在 R2 中创建存储桶（例如 `rin-images`）。
  - 同样在 Pages 绑定中添加 R2 桶，变量名参考文档。
5. **配置 Workers 路由**：
  - Rin 的后端 API 通常是一个 Worker，需要根据文档在 Pages 项目或单独的 Worker 中配置环境变量和路由。
  - 第一个登录的用户自动成为管理员 。
6. **绑定域名**：在 Pages 自定义域中绑定你的博客域名，大功告成。

---

## 3. CloudFlare-ImgBed：多功能开源图床

### 项目简介

​`CloudFlare-ImgBed`​ 是一个基于 Cloudflare Pages 和 R2 的**文件托管解决方案**，不仅支持图片，也可以作为文件床。它支持多种存储渠道，甚至可以将文件转存到 Telegram 或 HuggingFace 。

### 推荐理由

- **存储灵活**：支持 R2、S3、Telegram Bot、HuggingFace 等多种 Backend 。
- **功能丰富**：提供 API 接口、目录管理、图片审查、随机图 API、防滥用 IP 黑名单等高级功能 。
- **超大文件支持**：结合 HuggingFace 的 LFS，支持超过 20MB 的大文件分片上传 。
- **WebDAV 支持**：可以像操作本地磁盘一样管理文件 。

### 开源地址

- **GitHub 仓库**：[https://github.com/MarSeventh/CloudFlare-ImgBed](https://github.com/MarSeventh/CloudFlare-ImgBed)

### 部署教程

有两种主流部署方式，这里介绍最简单的 Cloudflare Pages 方式 ：

1. **Fork 项目**：将 `CloudFlare-ImgBed` Fork 到你的 GitHub。
2. **部署到 Pages**：
  - 在 Cloudflare Pages 中，导入 Fork 的项目。
  - 项目名称随意，**构建命令**填 `npm install`，然后保存并部署 。
3. **配置 KV 命名空间**：
  - 在 Cloudflare 的“存储和数据库”中，新建一个 KV 命名空间（如 `imgbed_kv`）。
  - 进入 Pages 项目 > 设置 > 绑定 > 添加 KV 命名空间。
  - **变量名**填写 `img_url`，选择刚才创建的 KV 命名空间 。
4. **配置 R2 或 HuggingFace（可选）** ：
  - **R2 方式**：在项目设置中添加环境变量 `R2_ACCESS_KEY_ID`​、`R2_SECRET_ACCESS_KEY`​、`R2_BUCKET_NAME` 等 。
  - **HuggingFace 方式（推荐大文件）** ：部署后访问 `/dashboard`，在后台系统设置中添加 HF 渠道，填入 Token 和仓库名 。
5. **访问后台**：部署完成后，通过 `你的域名/dashboard` 进入管理界面进行详细设置。

---

## 4. Cloudflare-Clist：轻量级云存储管理面板

### 项目简介

基于 Cloudflare Workers + D1 数据库的轻量级云存储管理面板，支持多存储后端统一管理、文件列表、搜索、预览，适合做个人轻量网盘。

### 推荐理由

- 极其轻量化、无冗余功能，适合只想简单管理文件、不想折腾复杂面板的极简主义者。
- 免费额度下运行流畅，几乎零维护。

### 开源地址

[https://github.com/ooyyh/Cloudflare-Clist](https://github.com/ooyyh/Cloudflare-Clist)

### 部署教程

详见作者开源仓库。

---

## 5. flare-stack-blog：极简风无服务器博客

### 项目简介

​`flare-stack-blog`​ 是一个极简风格的博客系统，正如其名，它完全构建在 Cloudflare 全家桶（Workers、Pages、D1 等）之上。与功能丰富的 `Rin` 相比，这个项目可能更注重于极致的轻量和简洁，非常适合那些只想专注于写作、不需要复杂后台管理的用户。

### 推荐理由

- **极简主义**：舍弃了繁杂的后台管理界面，可能通过 Markdown 文件直传或简单的 API 来管理文章，让写作回归本质。
- **性能极致**：基于 Cloudflare 的边缘网络，页面加载速度极快。由于功能简单，代码体积小，Worker 的执行时间也更短。
- **学习范例**：对于想要学习如何用 Cloudflare Workers 构建一个完整但简洁的 Web 应用的人来说，这是一个非常不错的入门参考项目。
- **组合灵活**：你可能会发现它与其他 `flare-*`​ 系列工具（如用于图片的 `CloudFlare-ImgBed`）有很好的联动性，轻松构建个人的极简数字花园。

### 开源地址

[https://github.com/du2333/flare-stack-blog](https://github.com/du2333/flare-stack-blog)

### 部署教程

部署逻辑与其他 Pages 项目类似，但具体细节需参考其仓库的 README。通用的流程如下：

1. **Fork 项目**：将 `flare-stack-blog` 项目 Fork 到你的 GitHub 账号下。
2. **创建 Pages 应用**：在 Cloudflare Dashboard 中，进入 Workers 和 Pages，创建新的 Pages 应用并连接你的 GitHub，选择你 Fork 的项目。
3. **配置构建命令**：根据项目文档，设置正确的构建命令（例如 `npm run build`​）和输出目录（例如 `dist`​ 或 `public`）。
4. **绑定 D1 数据库**：如果项目需要数据库来存储文章元数据，你需要在 Cloudflare 中创建一个 D1 数据库，并在 Pages 项目的“设置”->“绑定”中添加该数据库，变量名需严格参照项目文档（通常是 `DB`）。
5. **设置环境变量**：如果项目需要，配置相应的环境变量，例如管理员密码或 JWT 密钥等。
6. **部署与访问**：保存并部署后，通过 Pages 提供的域名或你绑定的自定义域名即可访问你的极简博客。

---

## 6. edgetunnel：边缘网络隧道工具

### 项目简介

​Cloudflare 边缘隧道方案。

### 推荐理由

- 内置网页管理面板
- 自动生成客户端订阅链接
- 支持自定义 UUID、ProxyIP
- 稳定、抗干扰、易维护。

### 开源地址

[https://github.com/cmliu/edgetunnel](https://github.com/cmliu/edgetunnel)

### 部署教程

这类工具通常以单个 `_worker.js` 文件的形式存在，部署最为简单。

1. **创建新的 Worker**：登录 Cloudflare Dashboard，进入 Workers 和 Pages 页面，点击“创建应用程序” -> “创建 Worker”。
2. **编辑代码**：将你在 GitHub 上找到的 `edgetunnel`​ 项目的核心代码（通常是一个 `_worker.js` 文件）全部复制，粘贴到 Cloudflare 的在线代码编辑器中，覆盖默认代码。
3. **配置变量**：仔细阅读项目文档，在代码开头的部分找到需要配置的变量，例如你想代理的目标域名 `PROXY_TARGET_DOMAIN`​、端口 `PORT`​，或者用于访问权限控制的 `TOKEN`​ 或 `UUID`。直接在代码中修改这些变量的值。
4. **保存并部署**：点击“保存并部署”。你可以立即使用 Cloudflare 分配的 `.workers.dev` 子域名进行测试。
5. **绑定自定义域名（推荐）** ：为了让访问更稳定、更正式，建议在 Worker 的“触发器”选项卡中，添加并绑定你自己的域名。

## 总结

Cloudflare 的 Workers 生态已经强大到足以支撑起一个小型创业公司的全部后端需求。以上项目分别解决了**数据存储（密码管理）** 、**内容输出（博客）** 、**资源分发（图床）** 和**网络接入（代理类）** 的问题。

如果你也部署了这些项目，欢迎交流心得！如果你有更好玩的 Cloudflare 开源项目，也欢迎在评论区分享。
