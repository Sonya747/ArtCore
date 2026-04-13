# 面向游戏美术团队的图像生成管理系统设计与实现

系统面向游戏美术团队，提供图像生成与资产、成员管理能力
---

系统包含四个主要模块：

* **图像生成模块**：接收用户输入，结合资产信息构建Prompt，调用nanobanana生图api生成图像
* **资产管理模块**：管理素材及其标签（风格、主体等），为生成提供数据支持
* **任务管理模块**：记录生成任务的提交prompt、参数和结果等
* **成员模块**：管理团队成员和权限
核心流程为：用户输入 → 结合资产 → 构建Prompt → 创建任务 → 调用AI生成 → 返回并记录结果

---
核心技术为 **Prompt Engineering**：
* 用户输入生成描述后，系统对输入进行结构化解析，提取角色、武器和场景等要素
* 在资产库中分别检索对应素材
* 优化提示词，生成包含风格、视觉特征和场景描述的 Prompt，并将相关资产图片作为参考图输入模型
* 调用接口生成最终图像

---
技术架构 : next.js + postbreSQL

系统的完整链路是：

```
用户输入 prompt
   ↓
记录 raw_prompt
   ↓
LLM① 提取关键词 → prompt_records (extract)
   ↓
检索 assets（简单匹配即可）
   ↓
LLM② 生成最终 prompt → prompt_records (final)
   ↓
写入 generation_tasks.final_prompt
   ↓
调用 ComfyUI
   ↓
生成图片 → generated_images
```
