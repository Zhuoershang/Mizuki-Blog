---
title: Steam 手机令牌第三方验证器配置教程
slug: steam-手机令牌第三方验证器配置教程
published: 2026-03-25
description: >-
  本教程指导如何使用 steamguard-cli 将 Steam 令牌迁移至 Bitwarden。首先需下载工具并移除官方验证器，在 PowerShell
  中运行 setup 初始化并记录撤销代码；接着通过 QR 或文件提取 URI；最后导入 Bitwarden。注意：若 Bitwarden 显示 6
  位数字，需将 URI 格式修改为 `steam://` 开头以兼容 Steam 的 5 位字母验证码。
image: "./cover.png"
tags: ["Bitwarden", "TOTP", "steam"]
category: 教程
draft: false
createdAt: '2026-03-22T07:44:38.000Z'
updatedAt: '2026-03-25T14:08:41.000Z'
readTimeInMinutes: 4
---
本教程将指导你使用 `steamguard-cli` 工具将 Steam 令牌导出，并导入到 **Bitwarden** 等第三方验证器中使用。适用于无法直接使用官方 Steam 应用或希望集中管理验证码的场景。

---

## **准备工作**

1. **下载 steamguard-cli**  
访问项目地址：[https://github.com/dyc3/steamguard-cli](https://github.com/dyc3/steamguard-cli)  
下载最新版本的 `steamguard.exe`（Windows 版）。
2. **确保已移除原有 Steam 验证器**  
在操作前，请先登录 Steam 官网（或客户端）进入 **账户详情 → 管理 Steam 令牌**，**移除当前已绑定的手机验证器**。

> ⚠️ 如果不移除，后续操作会失败。

---

## **第一步：使用 PowerShell 初始化 Steam 验证器**

1. **打开 PowerShell**  
右键点击“开始”按钮，选择 **Windows PowerShell**。
2. **切换到桌面目录**
powershell
```shell
cd C:\验证器所在目录       // 进入steamguard.exe所在目录
```

> 请将路径中的  验证器所在目录 替换为你的实际目录。
3. **运行 setup 命令**
powershell
```shell
./steamguard setup
```
  - 按提示依次输入 **Steam 账户名**、**密码** 以及 **邮箱验证码**（输入时不会显示）。
  - 若账户已开启 Steam 令牌，需要先输入当前令牌（6 位数字）才能继续。
  - 最后会提示：
text
```shell
Authenticator has been finalized. Please actually write down your revocation code:
```
请务必 **抄下 revocation code**（用于后续撤销验证器），并妥善保存。
---

## **第二步：获取二维码或 URI**

有两种方式可以获取用于第三方验证器的密钥信息：

### **方式一：直接生成二维码（推荐）**

在 PowerShell 中继续执行：

powershell

```shell
./steamguard qr
```

程序会在终端显示一个二维码，你可以直接使用第三方验证器扫描。

> 如果终端无法正常显示二维码或扫描失败，请使用方式二。

### **方式二：从 maFiles 文件中提取 URI**

1. 打开路径：
text
```
C:\Users\用户名\AppData\Roaming\steamguard-cli/maFiles
```
2. 找到该目录下的 `.maFile` 文件（通常以你的账户名命名），用记事本打开。
3. 搜索 `"uri"`，找到类似以下内容：
json
```
"uri": "otpauth://totp/Steam:你的账户名?secret=XXXXXX&issuer=Steam"
```
4. 复制 `"uri"` 后面引号内的完整字符串。

---

## **第三步：导入到 Bitwarden 验证器**

### **标准导入（适用于 5 位字母验证码）**

- **使用 Bitwarden 应用**：  
打开 Bitwarden → 进入 **验证器** 选项卡 → 点击 **添加** 或扫描二维码。
- **手动输入**：  
如果通过 URI 导入，Bitwarden 通常能自动识别 `otpauth://` 格式。

---

## **第四步：兼容处理（如果验证码变成 6 位数字）**

Steam 的令牌格式是 **5 位字母**（如 `ABCDE`），但某些第三方验证器（如 Bitwarden）默认生成 **6 位数字** 的 TOTP 码。  
如果导入后显示的验证码是 6 位数字，需要手动修改 URI 格式，将其改为 Steam 专用的 `steam://` 协议。

### **修改方法**

1. 复制你在第二步中得到的 `otpauth://` URI，例如：
text
```
otpauth://totp/Steam:你的账户名?secret=SECRET_KEY&issuer=Steam
```
2. 提取 `secret=SECRET_KEY` 中的 `SECRET_KEY`。
3. 构造新的 URI：
text
```
steam://SECRET_KEY
```
例如：若 `SECRET_KEY` 为 `ABCDEF123456`，则新 URI 为 `steam://ABCDEF123456`。4. 在 Bitwarden 中 **编辑** 已有的验证器条目：
  - 找到“密钥”字段，将原密钥替换为 `steam://` 开头的完整字符串。
  - 或者删除原条目，重新添加时直接输入上述 `steam://` URI。

> 部分版本可能不支持直接编辑 URI，可以手动删除后重新添加。

---

## **验证**

添加完成后，Bitwarden 将显示 **5 位字母** 的 Steam 令牌，与官方应用生成的令牌一致，即可正常登录。

---

## **注意事项**

- **撤销代码**（revocation code）务必妥善保存，用于在丢失设备时撤销验证器。
- 如果使用其他第三方验证器（如 **Authenticator Pro**、**Aegis**），它们通常能直接支持 `otpauth://` 格式并生成正确的 5 位字母验证码。
- Microsoft Authenticator 和 Google Authenticator 无法直接用于 Steam，因为 Steam 使用非标准 TOTP 实现。

---

## **参考来源**

- [steamguard-cli GitHub 仓库](https://github.com/dyc3/steamguard-cli)

---

现在，你可以将 Steam 验证器安全地集成到 Bitwarden 中，实现统一管理。
