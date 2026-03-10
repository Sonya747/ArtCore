# ARTCore

<h2>AIGC 图像生成与团队协作管理系统</h2>

## 项目介绍

本项目是一个 **面向游戏美术团队的 AIGC 图像生成与创作任务管理系统**。

系统底层图像生成能力基于 **ComfyUI 工作流**，并在 **ComfyICU 平台**进行部署，通过 API 调用工作流实现图像生成能力的服务化。

---

## 功能模块

系统核心逻辑：

1. 用户在 Web 界面创建生成任务

2. 后端调用 ComfyUI 工作流接口

3. AI 生成图片

4. 系统保存生成记录

5. 用户选择生成结果并管理为团队素材

### 1. 图像生成模块（Image Generation）

- 创建图像生成任务
- 配置生成参数
- 调用 ComfyUI 工作流进行生成

### 2. AIGC 任务管理模块（AIGC Task Management）

- 每个任务可关联多个 **图像生成记录**
- 支持 **任务 → 生成 → 成品** 的完整链路管理

---

### 3. 成品管理模块（Asset Management）

成品管理模块用于管理 AI 生成后的最终素材。
- 浏览团队素材库
- 成品分类管理
- 成品与任务关联

---

### 4. 团队成员管理模块（Team Management）

- 成员列表管理
- 成员角色管理
    - 管理员
    - 美术成员
    - 项目负责人
- 团队权限控制



## 📋 环境要求

- **[Bun](https://bun.sh/)** >= 1.0.0 **（强烈推荐）**
- 或 Node.js >= 18.0.0
- **现代浏览器**（Chrome、Firefox、Safari、Edge 最新版本）

## 系统架构
系统采用 Fullstack Web 应用架构，前端界面、后端接口与业务逻辑运行在同一项目中，通过服务端 API 与 AI 工作流平台进行通信。

整体架构如下：

```
Browser
   │
   │ HTTP
   ▼
Web Application (Next.js)
   │
   ├── API / Server Actions
   │
   ├── Database ORM
   │
   ├── 云端数据库（待定）
   │
   └── ComfyUI Workflow API (ComfyICU)
```


### 技术选型

#### 核心框架

* Next.js - 作为全栈 Web 框架，统一实现前端页面、后端接口以及服务端逻辑。

* React - 用于构建用户界面。

* TypeScript - 类型安全的 JavaScript 超集

---

#### UI 组件库
- **[Ant Design 6](https://ant.design/)** - 企业级 UI 设计语言和 React 组件库
- **[Ant Design X](https://x.ant.design/)** - AI 交互组件库
- **[Ant Design Icons](https://ant.design/components/icon/)** - 图标组件
- **[Tailwind CSS 4](https://tailwindcss.com/)** - 原子化 CSS 框架


#### 状态管理与工具
- **[Zustand](https://zustand-demo.pmnd.rs/)** - 轻量级状态管理
- **[ahooks](https://ahooks.js.org/)** - 高质量可靠的 React Hooks 库
- **[Axios](https://axios-http.com/)** - HTTP 客户端


用于管理前端全局状态

#### 数据库访问层 //TODO待定

* Drizzle ORM

Drizzle 是一个轻量级 TypeScript ORM
* 学习成本低
* 与 TypeScript 集成良好


---


#### 云端数据库

**云端数据库服务：待定**

### comfyUI工作流

* ComfyICU

系统通过 HTTP API 调用已部署的 ComfyUI 工作流
生成结果返回后，由系统记录生成信息并保存图片地址。

