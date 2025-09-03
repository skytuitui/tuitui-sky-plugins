# Legs-Sky 国际服任务插件

## 简介
本插件适用于 TRSS-Yunzai 云崽机器人，自动获取国际服每日任务攻略图片。

## 功能
- 命令“国际服任务”获取国际服最新每日任务图片。
- 自动处理图片下载与发送，失败时有错误提示。

## 使用方法

1. 将整个插件文件夹放入 TRSS-Yunzai 的 `plugins` 目录下（如 `plugins/LegsSky-plugins/Legs-Sky/`）。
2. 确保 `sky-utils` 工具库与本插件同目录。
3. 安装依赖：  
   ```
   npm install
   ```
4. 在 QQ 群聊中输入 `国际服任务`，机器人会自动回复最新任务图片。

## 依赖
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- [oicq](https://github.com/takayama-lily/oicq)

## 配置
如需更改 API 密钥或接口地址，请编辑 `sky-utils/config.js` 文件。

## 反馈与支持
如有问题或建议，请在仓库提交 Issue 或联系作者。

---

版权所有 © TgLegs
