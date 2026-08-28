# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/)。

## [1.0.0] - 2026-08-28

首个公开发布版本。

### 核心
- 虚拟办公室场景：角色工位、人物走动（过道寻路）、左上角对话气泡（贴边自动翻转）
- 工位详情抽屉：状态 / 任务进度 / 流水线链路 / 交接消息时间线 / 文件工作台（输入·产出·引用）
- 文件详情：版本时间线 + 代码 diff / 文档渲染 / 设计稿线框对比 / 日志视图
- 消息 ↔ 文件双向追溯（点消息高亮附件，点文件回溯触发消息）
- 人工介入：暂停后以「👔 主管」身份 @ 角色下指令，角色气泡确认并记入时间线
- 播放控制：暂停/继续（按钮 + 空格）、1x/2x/4x 倍速、重播
- 项目数据驱动：一个项目一个文件夹，角色数 2~10 自动布局；数据热重载
- 嵌入插件：`Desk.mount()` + postMessage API（loadProject / sendEvent / intervene / on）

### 安全
- postMessage 双向 origin 校验（宿主白名单 + 定向回执，握手协议）
- 项目数据渲染全量 HTML 转义，颜色值白名单校验（防 XSS / CSS 注入）
- index.html 启用 CSP；iframe 支持可选 sandbox 与 no-referrer
