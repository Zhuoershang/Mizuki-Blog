---
title: 使用批处理脚本一键切换 Windows 系统代理并设置例外网址
slug: 使用批处理脚本一键切换-windows-系统代理并设置例外网址
published: 2026-04-20
description: >-
  本文提供一段批处理脚本，实现 Windows
  系统代理的一键切换与例外设置。脚本支持自动检测状态、切换代理并配置服务器地址及排除列表（支持通配符）。使用时需修改脚本配置并以管理员身份运行。该工具无需打开繁杂的
  Internet 选项，能有效提升网络调试效率。
image: "./cover.png"
tags: ["代理"]
category: 教程
draft: false
createdAt: '2026-04-20T17:17:07.000Z'
updatedAt: '2026-04-20T17:22:52.000Z'
readTimeInMinutes: 5
---
在日常开发或网络调试中，我们经常需要快速开启或关闭 Windows 系统的 HTTP/HTTPS 代理，同时希望某些内网地址或特定域名**不走代理**（即代理例外）。手动修改注册表或 Internet 选项比较繁琐，本文提供一段批处理脚本，实现：

- 一键检测当前代理状态（开启/关闭）
- 自动切换代理状态（开启 → 关闭，关闭 → 开启）
- 开启代理时**自动写入代理服务器地址和例外网址列表**
- 关闭代理时可选择保留或清空例外列表

---

## **准备工作**

### **1. 获取你的代理服务器地址**

例如：

- `127.0.0.1:7890`（Clash / v2rayN 等本地代理客户端）
- `192.168.1.100:8080`（企业代理）

### **2. 确定需要排除（不走代理）的网址**

支持通配符 `*`，多个地址用分号 `;` 隔开。常见排除示例：

text

```
localhost;127.0.0.1;<local>;*.example.com;10.*.*.*
```

- `<local>` 表示所有内网地址（系统保留关键字）
- `*.example.com` 匹配该域名下所有子域名

---

## **完整脚本代码**

将以下内容保存为 `toggle_proxy.bat`，**以 ANSI 编码**保存（否则中文可能乱码）。

batch

```shell
@echo off
setlocal enabledelayedexpansion

:: ========== 请在这里修改你的配置 ==========
set "ProxyServerAddr=127.0.0.1:7890"
set "excludeSites=localhost;127.0.0.1;<local>;*.example.com"
:: =========================================

for /f "tokens=1,2,* " %%i in ('REG QUERY "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable ^| find /i "ProxyEnable"') do (set /A ProxyEnableValue=%%k)

if %ProxyEnableValue% equ 0 (
    echo 系统代理目前处于关闭状态，正在开启代理，请稍候...
    echo=
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f >nul 2>nul
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer /d "%ProxyServerAddr%" /f >nul 2>nul
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyOverride /d "%excludeSites%" /f >nul 2>nul
    echo 系统代理已开启，代理地址：%ProxyServerAddr%
    echo 例外网址：%excludeSites%
    echo 请按任意键关闭本窗口...
) else if %ProxyEnableValue% equ 1 (
    echo 系统代理目前处于开启状态，正在关闭代理，请稍候...
    echo=
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f >nul 2>nul
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer /d "" /f >nul 2>nul
    :: 下方命令可选：关闭代理时是否清空例外列表（默认不清空，如需清空请取消注释）
    :: reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyOverride /d "" /f >nul 2>nul
    echo 系统代理已关闭
    echo 请按任意键退出本窗口...
)

pause >nul
```

---

## **使用方法**

### **1. 修改配置**

用记事本打开 `toggle_proxy.bat`，找到这两行并修改为你的实际值：

batch

```shell
set "ProxyServerAddr=127.0.0.1:7890"
set "excludeSites=localhost;127.0.0.1;<local>;*.example.com"
```

### **2. 以管理员身份运行（重要）**

右键点击 `toggle_proxy.bat` → **以管理员身份运行**。

> 因为脚本修改了 `HKCU` 下的注册表，虽然属于当前用户配置，但某些安全策略仍要求管理员权限。

### **3. 观察输出**

- 若当前代理关闭 → 脚本会开启代理，并显示设置的代理地址和例外列表。
- 若当前代理开启 → 脚本会关闭代理。

### **4. 验证**

打开 **Internet 选项** → **连接** → **局域网设置**，查看代理是否按预期修改。

---

## **进阶自定义**

### **1. 关闭代理时同时清空例外列表**

找到脚本中 `else if %ProxyEnableValue% equ 1` 分支，取消注释下面这行：

batch

```shell
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyOverride /d "" /f >nul 2>nul
```

### **2. 添加多个代理地址（不支持，Windows 原生只支持单一 HTTP 代理）**

若需要 PAC 脚本或更复杂规则，建议修改 `ProxyServer` 为 PAC 文件路径，或使用第三方工具。

### **3. 静默运行（不显示窗口）**

可将脚本扩展名改为 `.vbs` 并调用，或使用 `start /min` 运行 bat，但会失去交互反馈。

---

## **常见问题**

### **Q1：运行后提示“find /i “ProxyEnable””不是内部或外部命令？**

A：请检查是否在 Windows 环境下运行，不要使用 Linux/Mac 的终端。确保 `find.exe` 存在于 `C:\Windows\System32`。

### **Q2：代理开启成功，但浏览器无法上网？**

A：

- 确认代理客户端（如 Clash）正在运行且监听地址与 `ProxyServerAddr` 一致。
- 检查例外列表中是否意外包含了目标网站（例如 `*.google.com` 被排除）。
- 尝试清空 DNS 缓存：`ipconfig /flushdns`

### **Q3：排除网址中的 **`<local>`** 是什么？**

A：Windows 系统保留关键字，代表“所有绕过代理的 Intranet 地址”。通常包括 `localhost`、`127.0.0.1` 以及 `file://` 等。

### **Q4：修改注册表后需要重启应用吗？**

A：大多数程序（如 Chrome、Edge、系统 API）会监听注册表变化，**立即生效**。部分老旧程序可能需要重启。

### **Q5：如何查看当前代理设置而不运行脚本？**

A：命令行执行：

batch

```shell
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyOverride
```

---

## **总结**

通过这个简单的批处理脚本，你可以：

- ✅ 快速切换 Windows 系统代理状态
- ✅ 开启代理时自动配置服务器地址和例外列表
- ✅ 关闭代理时恢复干净网络环境
- ✅ 无需打开繁杂的 Internet 选项界面

将脚本放在桌面或任务栏，双击即可切换，极大提升工作效率。

---

**许可证**：本文脚本遵循 MIT 协议，可自由修改和分发。  
**反馈**：如有问题，欢迎在评论区留言讨论。
