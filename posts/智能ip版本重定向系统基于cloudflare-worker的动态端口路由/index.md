---
title: 智能IP版本重定向系统：基于Cloudflare Worker的动态端口路由
slug: 智能ip版本重定向系统基于cloudflare-worker的动态端口路由
published: 2026-02-26
description: >-
  本文介绍了使用Cloudflare
  Worker实现智能IP版本重定向系统。该系统根据客户端的IP版本自动选择对应的目标域名，并根据请求的子域名动态分配不同的端口。实现了双栈网络服务、游戏服务器接入、P2P应用和实时通信等场景的精细流量路由。通过定义端口映射表、提取子域名前缀和根据前缀选择端口，实现了IPv6子域名到端口的动态映射。该方案具有零运维、低延迟和灵活扩展的优势。
image: "./cover.png"
tags: ["Cloudflare Worker", "IPv4", "IPv6", "重定向"]
category: 教程
draft: false
createdAt: '2026-02-26T04:58:54.000Z'
updatedAt: '2026-02-26T05:03:49.000Z'
readTimeInMinutes: 7
---
# 智能IP版本重定向系统：基于Cloudflare Worker的动态端口路由

## 概述

在现代网络环境中，IPv4 和 IPv6 共存，不同协议版本的客户端可能需要访问不同的后端服务或端口。本教程介绍如何使用 Cloudflare Worker 实现一个智能重定向系统，它能够：

- 根据客户端的 IP 版本（IPv4 或 IPv6）自动选择对应的目标域名。
- 对于 IPv6 客户端，进一步根据请求的子域名动态分配不同的端口，实现多服务复用同一个域名。

该系统非常适合用于双栈网络服务、游戏服务器接入、P2P 应用、实时通信等需要精细流量路由的场景。

---

## 原始代码分析

首先，我们分析一个基础的 Cloudflare Worker 脚本，它实现了根据 IP 版本重定向到不同域名和端口的功能。

### 原始代码

```javascript
const CONFIG = {
  sourceDomain: 'domain.com',
  ipv4TargetDomain: 'stun.domain.com', // IPv4 STUN穿透域名
  ipv6TargetDomain: 'v6.domain.com',   // IPv6固定端口域名
  ipv4Port: '#{port}',                  // IPv4动态端口（占位符）
  ipv6Port: '4443'                       // IPv6固定端口
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;

  // 仅处理匹配源域名的请求
  if (!hostname.includes(CONFIG.sourceDomain)) {
    return new Response('Not Found', { status: 404 });
  }

  // 获取客户端真实IP（Cloudflare提供）
  const clientIP = request.headers.get('CF-Connecting-IP');
  const isIPv6 = clientIP && clientIP.includes(':'); // IPv6地址包含冒号

  let targetDomain, targetPort;

  if (isIPv6) {
    // IPv6客户端 -> 使用IPv6固定端口
    targetDomain = CONFIG.ipv6TargetDomain;
    targetPort = CONFIG.ipv6Port;
  } else {
    // IPv4客户端 -> 使用STUN穿透域名和动态端口
    targetDomain = CONFIG.ipv4TargetDomain;
    targetPort = CONFIG.ipv4Port;
  }

  // 构建新URL：将源域名替换为目标域名，并添加对应端口
  const newHost = hostname.replace(CONFIG.sourceDomain, targetDomain);
  const targetUrl = `https://${newHost}:${targetPort}${url.pathname}${url.search}`;

  // 返回302重定向
  return Response.redirect(targetUrl, 302);
}

```

### 工作原理

1. **IP版本检测**  
通过 `CF-Connecting-IP`​ 请求头获取客户端真实 IP（Cloudflare 会自动添加此头）。若 IP 字符串中包含冒号 `:`，则判定为 IPv6，否则为 IPv4。
2. **路由选择**
  - **IPv4 客户端**：重定向到 `ipv4TargetDomain`，并使用配置的 IPv4 端口（动态占位符，实际部署需替换为具体端口）。
  - **IPv6 客户端**：重定向到 `ipv6TargetDomain`​，并使用固定的 IPv6 端口 `4443`。
3. **域名替换**  
将原始主机名中的 `sourceDomain`​ 部分替换为目标域名，保留子域前缀（如 `alist.domin.com`→ `alist.v6.domin.com`）。同时附加原路径和查询参数。
4. **302重定向**  
浏览器或客户端收到重定向后，会向新 URL 发起请求，从而实现透明的流量导向。

### 局限性

原始方案中，所有 IPv6 流量都使用同一个固定端口（`4443`）。如果同一个域名下托管了多个服务（如 Alist、qBittorrent、Migu），它们无法通过端口区分，导致服务冲突。

---

## 需求扩展：根据子域名动态分配 IPv6 端口

我们希望修改脚本，使得当 IPv6 客户端访问不同的子域名时，能够自动使用对应的端口。例如：

| 子域名 | 期望 IPv6 端口 |
| --- | --- |
| alist.[domain.com](http://domain.com) | 5425 |
| ql.domain.com | 5700 |
| migu.domain.com | 13000 |
| 其他子域名或根域名 | 4443（默认） |

---

## 修改方案详解

### 1. 定义端口映射表

创建一个对象 `IPV6_PORT_MAP`​，将子域名前缀（如 `alist`）映射到对应的端口号。

```javascript
const IPV6_PORT_MAP = {
  'alist': '5425',
  'ql': '5700',
  'migu': '13000'
  // 可继续添加更多映射
};

```

### 2. 提取子域名前缀

我们需要从请求的 `hostname`​ 中提取出子域前缀（即源域名前面的部分）。由于源域名是 domain.com，我们可以通过字符串操作获取前缀。

```javascript
function getSubdomainPrefix(hostname, baseDomain) {
  // 如果主机名就是基域名本身，则没有前缀
  if (hostname === baseDomain) return '';
  
  // 去掉基域名（包括前面的点）得到前缀部分
  const prefix = hostname.replace('.' + baseDomain, '');
  
  // 如果前缀包含多个点（如 a.b.domain.com），只取第一个子域
  if (prefix.includes('.')) {
    return prefix.split('.')[0];
  }
  return prefix;
}

```

### 3. 根据前缀选择端口

遍历端口映射表，如果前缀匹配（即主机名以 `prefix + '.' + baseDomain` 结尾），则返回对应端口；否则返回默认端口。

```javascript
function getIPv6PortByHostname(hostname) {
  for (const [prefix, port] of Object.entries(IPV6_PORT_MAP)) {
    if (hostname.includes(prefix + '.' + CONFIG.sourceDomain)) {
      return port;
    }
  }
  return CONFIG.ipv6Port; // 默认端口
}

```

### 4. 集成到主逻辑

在 IPv6 分支中，调用 `getIPv6PortByHostname(hostname)` 动态获取端口，替代原来的固定端口。

```javascript
if (isIPv6) {
  targetDomain = CONFIG.ipv6TargetDomain;
  targetPort = getIPv6PortByHostname(hostname);
} else {
  targetDomain = CONFIG.ipv4TargetDomain;
  targetPort = CONFIG.ipv4Port;
}

```

---

## 完整修改后的代码

```javascript
const CONFIG = {
  sourceDomain: 'domain.com',
  ipv4TargetDomain: 'stun.domain.com',
  ipv6TargetDomain: 'v6.domain.com',
  ipv4Port: '#{port}',   // 需替换为实际IPv4端口
  ipv6Port: '4443'        // 默认IPv6端口
};

// 子域名前缀 -> IPv6端口映射
const IPV6_PORT_MAP = {
  'alist': '5425',
  'ql': '5700',
  'migu': '13000'
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;

  // 检查是否匹配源域名
  if (!hostname.includes(CONFIG.sourceDomain)) {
    return new Response('Not Found', { status: 404 });
  }

  // 检测客户端IP版本
  const clientIP = request.headers.get('CF-Connecting-IP');
  const isIPv6 = clientIP && clientIP.includes(':');

  let targetDomain, targetPort;

  if (isIPv6) {
    targetDomain = CONFIG.ipv6TargetDomain;
    targetPort = getIPv6PortByHostname(hostname);
  } else {
    targetDomain = CONFIG.ipv4TargetDomain;
    targetPort = CONFIG.ipv4Port;
  }

  // 替换域名并构建新URL
  const newHost = hostname.replace(CONFIG.sourceDomain, targetDomain);
  const targetUrl = `https://${newHost}:${targetPort}${url.pathname}${url.search}`;

  return Response.redirect(targetUrl, 302);
}

/**
 * 根据请求主机名动态获取IPv6端口
 * @param {string} hostname - 请求的主机名
 * @returns {string} 端口号
 */
function getIPv6PortByHostname(hostname) {
  for (const [prefix, port] of Object.entries(IPV6_PORT_MAP)) {
    if (hostname.includes(prefix + '.' + CONFIG.sourceDomain)) {
      return port;
    }
  }
  return CONFIG.ipv6Port;
}

```

---

## 部署和使用说明

1. **注册/登录 Cloudflare**  
进入 Cloudflare Dashboard，在左侧菜单选择 **Workers & Pages**。
2. **创建新的 Worker**  
点击 **创建应用程序** → **创建 Worker**，给 Worker 命名（例如 `ip-version-router`）。
3. **粘贴代码**  
将上述完整代码粘贴到 Worker 编辑器中，并根据实际需要修改：
  - 将 `CONFIG` 中的域名替换为你自己的域名。
  - 将 `#{port}` 替换为 IPv4 服务的实际端口（如果动态端口由其他系统提供，可保留占位符并在部署时替换）。
  - 根据需要增删 `IPV6_PORT_MAP` 中的映射项。
4. **保存并部署**  
点击 **保存并部署**，Worker 即生效。
5. **配置域名路由**  
在 Worker 的 **触发器** 选项卡中，添加路由规则，例如 `*.`domain.com`/*`，将子域名流量指向该 Worker。
6. **验证**  
使用不同 IP 版本的客户端访问不同的子域名，检查是否被正确重定向到预期的端口。

---

## 扩展与自定义

- **添加更多子域名映射**：只需在 `IPV6_PORT_MAP` 对象中添加新的键值对即可。
- **IPv4 动态端口支持**：如果 IPv4 也需要根据子域名动态分配端口，可类似地创建 `IPV4_PORT_MAP` 并在 IPv4 分支中调用相应函数。
- **路径保留**：脚本保留了原始路径和查询参数，可以方便地用于 API 或 Web 服务。
- **协议选择**：目前重定向使用 HTTPS，如需支持 HTTP，可修改 `targetUrl` 中的协议。

---

## 总结

通过 Cloudflare Worker 的轻量级边缘计算能力，我们实现了一个智能的 IP 版本重定向系统，并扩展了 IPv6 子域名到端口的动态映射。这种方案具有以下优势：

- **零运维**：无需管理服务器，全托管于 Cloudflare 全球网络。
- **低延迟**：在边缘节点执行，减少客户端与服务端的交互次数。
- **灵活扩展**：通过简单的配置即可支持任意数量的子域名和端口。

无论是个人开发者还是企业团队，都可以利用此方案高效地管理多服务、多协议的网络入口。
