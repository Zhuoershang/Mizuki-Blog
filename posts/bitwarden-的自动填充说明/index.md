---
title: Bitwarden 的自动填充说明
slug: bitwarden-的自动填充说明
published: 2026-02-26
description: >-
  Bitwarden 的自动填充功能通过将当前访问页面的网址与保存在密码库中的每一条登录条目的 URI
  进行比对来实现。该功能支持六种核心匹配方式：基础域名、主机、开头匹配、精确匹配、正则表达式和永不。每种匹配方式都有其特定的应用场景，例如基础域名适合公司旗下有多个子服务的场景，而主机匹配适合自托管服务或内网应用。用户可以根据需要选择合适的匹配方式来控制自动填充的建议范围。此外，Bitwarden
  还支持多条 URI 的逻辑和等价域名的全局规则，进一步增强了其自动填充功能的灵活性和实用性。
image: "./cover.png"
tags: ["Bitwarden", "自动填充"]
category: 教程
draft: false
createdAt: '2026-02-26T04:32:00.000Z'
updatedAt: '2026-02-26T07:15:50.000Z'
readTimeInMinutes: 3
---
# Bitwarden 的自动填充说明

Bitwarden 的自动填充建议，本质上是将你当前访问页面的网址，与你保存在密码库中每一条登录条目的 URI（统一资源标识符）进行比对。这个比对规则非常灵活，你可以为每一条 URI 单独设置匹配方式，从而精确控制自动填充的建议范围。

下面这个表格详细解释了 Bitwarden 支持的六种核心匹配方式的运行原理和典型示例。

### 🔍 匹配方式详解

| 匹配方式 | 核心原理 | 示例 | 适用场景 |
| --- | --- | --- | --- |
| **基础域名 (Base Domain)** | 仅匹配网站的**主域名**（二级域名 + 顶级域名），忽略所有子域名、路径和协议 。这是**默认选项**。 | 保存的 URI 为 `https://google.com`​，则 `https://accounts.google.com`​、`http://google.com`​ 都能匹配，但 `https://google.net` 不行 。 | 适合一家公司旗下有多个子服务（如 `mail.google.com`​, `drive.google.com`）但共用一个账号的场景。 |
| **主机 (Host)** | 匹配完整的**主机名**（包含子域名）和**端口号** 。 | 保存的 URI 为 `https://sub.domain.com:4000`​，则 `https://sub.domain.com:4000/page.html`​ 能匹配，但 `https://sub.domain.com`​（端口不同）或 `https://domain.com`（子域名不同）不行 。 | 适合自托管服务、内网应用或对安全性要求高，希望严格限定自动填充网站范围的场景 。 |
| **开头匹配 (Starts With)** | 只要当前网址**以**保存的 URI 字符串开头，即匹配成功 。 | 保存的 URI 为 `https://sub.domain.com/path/`​，则 `https://sub.domain.com/path/page.html`​ 能匹配，但 `https://sub.domain.com`（路径不匹配）不行 。 | 适合网站的登录页面总在一个固定路径下（如 `/login`），但其后的查询参数会动态变化的场景 。 |
| **精确匹配 (Exact)** | 要求当前网址与保存的 URI **完全一致**，包括协议、主机名、端口、路径等 。 | 保存的 URI 为 `https://www.google.com/page.html`​，只有完全相同的地址能匹配，`http://...` 或带查询参数的都不行 。 | 适合银行、支付等安全级别要求极高的网站，或用于锁定某个特定页面。 |
| **正则表达式 (Regular Expression)** | 使用自定义的**正则表达式**规则来判断网址是否匹配 。 | 使用正则 `^https://[a-z]+\.wikipedia\.org/w/index\.php`​，可以匹配 `en.wikipedia.org/w/index.php`​ 和 `pl.wikipedia.org/w/index.php` 等页面 。 | 适合有复杂匹配需求的用户，可以精确排除某些路径或灵活匹配多种网址格式 。 |
| **永不 (Never)** | **停用**该条 URI 的自动填充功能 。 | - | 适合希望将某条网址保存在条目中作为记录，但不希望它触发任何自动填充建议的情况。 |

### 💡 进阶匹配机制

除了上述基础规则，Bitwarden 的匹配逻辑还包含两个重要的进阶特性：

- **多条 URI 的逻辑**：一个登录条目可以保存多个 URI，这些 URI 之间是 **“或 (OR)”** 的关系。只要当前网址匹配其中任意一条 URI 的规则，该条目就会出现在自动填充建议中 。如果匹配到的条目有多个，通常会按**最近使用**的顺序排列 。
- **等价域名 (Equivalent Domains)** ：这是一个全局规则，你可以把它理解为一个内置的“别名”列表。例如，Bitwarden 预定义了 `google.com`​、`youtube.com`​、`gmail.com`​ 为等价域名 。这意味着，即使你的登录条目保存的是 `google.com`​，当你在 `youtube.com` 的页面上需要登录时，该条目也会被作为建议项提供，无需额外设置 。你可以查看并修改这个列表（账户设置 → 域名规则）。

希望这份详细的原理说明能帮助你更好地掌握 Bitwarden 的自动填充逻辑。如果你在配置具体网站时遇到问题，可以随时再问我。
