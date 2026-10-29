# DailyMirror iPhone 签名与打包

默认目标：把 DailyMirror 安装到自己登记的 iPhone，使用 Ad Hoc 描述文件和 Xcode 的 `release-testing` 导出方式。IPA 仅能安装到描述文件列出的设备。不能把 IPA 当成 APK 点击后直接安装。

当前仓库已经具备工程和打包入口；Windows 不运行 Xcode，也不能本机生成 IPA。可以使用 Mac 本地构建，或 GitHub Actions 的 macOS 构建机。首次实际构建仍需要自己的 Apple 签名材料。

## 1. 在 Apple 开发者账号中准备

Ad Hoc 需要有效的 Apple Developer Program 会员。请在自己的 Apple 账号中完成以下操作，不要在聊天或 Git 仓库中提供密码、私钥、证书密码或描述文件。

| 项目                        | DailyMirror 配置                                   |
| --------------------------- | -------------------------------------------------- |
| 主应用 App ID / Bundle ID   | `com.dailymirror.app`                              |
| 分享扩展 App ID / Bundle ID | `com.dailymirror.app.ShareExtension`               |
| App Group                   | `group.com.dailymirror.app`                        |
| 签名证书                    | Apple Distribution，导出为带私钥且有密码的 `.p12`  |
| 主应用描述文件              | Ad Hoc，选择主应用 App ID、上述证书及自己的 iPhone |
| 分享扩展描述文件            | Ad Hoc，选择扩展 App ID、同一证书及相同设备        |

操作顺序：

1. 在 Apple Developer → Membership details 查看自己的 10 位 Team ID。
2. 在 Certificates, Identifiers & Profiles → Identifiers 注册两个明确的 App ID。若标识已被占用，先解决账号归属或统一修改工程、验证脚本和两个描述文件的标识。
3. 注册 App Group，并给主应用和分享扩展都启用 App Groups 能力、关联同一组。不要启用本项目未使用的 Push Notifications、Associated Domains 等能力。
4. 在 Devices 登记 iPhone 的 UDID。可以在 Mac 的 Finder/Xcode 中查看；Windows 的 Apple Devices 应用也可用于查看设备标识。UDID 不等于序列号或 IMEI。
5. 在 Mac 钥匙串访问中创建 CSR，向 Apple 申请 Apple Distribution 证书；证书与对应私钥一起导出为有密码的 `.p12`。单独的 `.cer` 不包含私钥，不能替代 `.p12`。如果当前没有 Mac，需要先在可用的 Mac 上完成这一步或通过受信任的证书管理方式生成自己的签名身份。
6. 创建上述两个 Ad Hoc 描述文件，均选择这张分发证书和要安装的设备，下载 `.mobileprovision`。添加设备、变更 App Group 或更新证书后，需要重新生成并替换两个描述文件。

官方说明：[登记设备](https://developer.apple.com/help/account/devices/register-a-single-device/)、[创建 Ad Hoc 描述文件](https://developer.apple.com/help/account/provisioning-profiles/create-an-ad-hoc-provisioning-profile/)、[为两个 target 配置 App Groups](https://developer.apple.com/documentation/xcode/configuring-app-groups)、[向登记设备分发](https://developer.apple.com/documentation/xcode/distributing-your-app-to-registered-devices)。

免费 Apple 账号配合 Mac/Xcode 的 Personal Team 可以用于某些个人开发测试，但本流程包含 App Group 和分享扩展，不能假设免费账号支持完整功能。这份 Ad Hoc 打包流程以付费会员为前提。

## 2. Mac 本地打包

环境：Xcode（工程最低 iOS 16，Capacitor 8 使用兼容的 Xcode 26+）、已接受 Xcode 许可和安装 iOS SDK，Node.js 22、npm、Python 3、CocoaPods。Pillow 只在重新生成图标时需要；日常打包使用仓库内已生成的图标。

在仓库 `source` 目录执行：

```bash
npm ci
mkdir -p .ios-signing
```

将两个描述文件放入 `.ios-signing/app.mobileprovision` 和 `.ios-signing/share.mobileprovision`。双击自己的 `.p12` 导入登录钥匙串，输入证书密码。创建 `.ios-signing/config.sh`：

```bash
export DAILYMIRROR_APPLE_TEAM_ID='替换为自己的10位TeamID'
export DAILYMIRROR_IOS_APP_PROFILE="$PWD/.ios-signing/app.mobileprovision"
export DAILYMIRROR_IOS_SHARE_PROFILE="$PWD/.ios-signing/share.mobileprovision"
export DAILYMIRROR_IOS_EXPORT_METHOD='release-testing'
```

这些文件已加入 Git 忽略规则。Team ID 示例不是可用配置，须自行替换。

```bash
source .ios-signing/config.sh
npm run dist:ios:dailymirror
```

也可以先执行 `chmod +x tools/package-dailymirror-ios.command`，之后双击这个 Mac 启动文件。终端和启动文件都会先切换到 `source`，因此配置中的 `$PWD` 指向正确目录。

输出：`DailyMirror/releases/ios/DailyMirror-<版本号>-ios.ipa`，以及同目录的 SHA-256 校验文件。营销版本来自 `package.json`，构建号默认按 UTC 日期和时间生成。同一分钟重复导出时，如需不同构建号，可设置 `DAILYMIRROR_IOS_BUILD_NUMBER`，使用 Xcode 支持的递增数字版本格式。

脚本在前端构建前检查：Team ID、两个精确 App ID、App Group、有效期、分发类型、设备范围和钥匙串中可用的同一签名身份。主应用、扩展会使用相同营销版本和构建号。前端资源直接来自 `productionWeb` 的 `dist/browser`，并附带原项目许可证及构建生成的第三方声明。

## 3. Windows 用户通过 GitHub 构建

需要先把这次工程和工作流修改提交并推送至自己的仓库。只有默认分支包含工作流后，Actions 页面才会显示可手动触发的入口。

1. 在仓库 Settings → Environments 创建 `dailymirror-ios`。
2. 在该环境的 Secrets 中配置下列 5 项：

| Secret 名称                              | 内容                                      |
| ---------------------------------------- | ----------------------------------------- |
| `DAILYMIRROR_APPLE_TEAM_ID`              | 自己的 10 位 Team ID                      |
| `DAILYMIRROR_IOS_CERTIFICATE_P12_BASE64` | 自己的分发证书及私钥 `.p12` 的单行 Base64 |
| `DAILYMIRROR_IOS_CERTIFICATE_PASSWORD`   | 导出 `.p12` 时设置的密码                  |
| `DAILYMIRROR_IOS_APP_PROFILE_BASE64`     | 主应用描述文件的单行 Base64               |
| `DAILYMIRROR_IOS_SHARE_PROFILE_BASE64`   | 分享扩展描述文件的单行 Base64             |

3. 在本地生成 Base64 并粘贴进对应 Secret。PowerShell 示例将内容写入剪贴板，避免把证书内容打印到终端日志：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('你的证书完整路径.p12')) | Set-Clipboard
```

对两个 `.mobileprovision` 文件分别执行相同操作。粘贴完成后清空剪贴板；不要提交 Base64 内容。

4. Actions → **DailyMirror iPhone IPA** → Run workflow，选择已配置的分支，`export_method` 选 **release-testing**。
5. 构建成功后，在该次运行的 Artifacts 下载 `DailyMirror-iOS-运行编号`，解压得到 IPA 和校验文件。构建产物保存 7 天，请及时下载。

工作流只在手动运行时打包，不会自动提交 App Store 审核或公开发布到 GitHub Releases。证书导入临时钥匙串，结束后清理；描述文件不作为下载产物上传。仓库原来的上游自动 App Store 发布工作流已限制只在上游仓库运行。

若之后需要 App Store 导出，将两个描述文件改为各自的 App Store Connect 类型，再选择 `app-store-connect`。该选项只导出 IPA；上传 TestFlight、建立 App Store Connect 应用记录及审核需另行配置。

## 4. 安装到登记的 iPhone

在 Mac 上连接并信任 iPhone，用 Xcode → Window → Devices and Simulators，选择设备，把 IPA 拖入 Installed Apps，或使用 Apple Configurator 安装。只能安装到两个 Ad Hoc 描述文件都包含的设备。单纯在 GitHub 下载 IPA 不会绕过 Apple 的设备签名限制。

首次安装后核对名称、图标、任务创建与重启保存、通知、分享扩展和手动配置的同步。后续覆盖升级需要继续使用同一 Bundle ID 和有效签名体系。

## 5. 当前验证范围

在 Windows 上可以检查工程配置、描述文件检查逻辑和工作流结构。真实的 Xcode 编译、签名导出和 iPhone 安装必须在配置自己的证书及描述文件后完成。当前没有为用户创建 Apple 账号、证书或描述文件，也没有生成可安装 IPA。

DailyMirror 的新 URL scheme 用于主屏幕快捷操作；原 `com.super-productivity.app` scheme 仍注册，供既有第三方 OAuth 回调兼容。这不表示使用上游应用的 Bundle ID 或签名。
