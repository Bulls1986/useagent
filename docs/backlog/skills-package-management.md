# UA-BL-04｜完整 Skills 包管理、编辑与 Sandbox 下发

| 字段 | 值 |
| --- | --- |
| 类型 | Must-have 功能 |
| 优先级 | Must-have |
| 状态 | Backlog；历史上存在部分管理/注入能力，尚未满足完整 Skill |
| 关联 | [UA-BL-07 隔离](./multi-user-isolation.md)、[UA-BL-03 Artifact](./artifact-storage-s3-minio.md) |

## 背景
此前反馈：UseAgent Skills 缺少完整的编辑和删除 UI，当前“Skill”偏向结构化 Markdown 文本注入，而不是标准的完整 Skill 包；仅将几段描述传给 Agent 并不能支持 `scripts`、`references` 或 `assets`。**关键在于真正下发给原生 Agent 工具并被原生发现。**

## 已讨论并冻结的责任分工
- **UseAgent = Skill Registry**：负责完整包存储、导入/编辑/删除、版本、权限、审计及会话授权。
- **Sandbox = 隔离承载**：在工作区内放置特定版本的完整 Skill 目录，校验文件与 SHA；不能向其他用户/Session 泄露。
- **原生 Runtime = 加载与执行**：允许原生 CC/OpenCode/Codex/Pi 按自身规则发现/执行 Skill；平台不自造 Skills 解释器，不在安装/上传阶段自动运行脚本。
- 扩展现有文件上传与 Session 初始化/挂载链路，而非改写 Agent 的内循环。

## 交付范围（分阶段验收，但不预设排期）
- **M1 Registry**：完整原始目录（`SKILL.md`、frontmatter、`scripts/`、`references/`、`assets/` 等）导入、查看、编辑、删除、版本化与引用稳定、权限/审计。明确删除是禁用新引用还是回收已被会话引用的版本。
- **M2 Sandbox Distribution**：按会话选择/授权打包下发、保留目录和权限、hash 校验、变更/撤销、重启与恢复时重装配。
- **M3 Native Discovery**：真实 CC/OpenCode 原生发现、读取 references 和运行已授权脚本；核对 Codex/Pi 的实际原生机制（历史 Pi 曾出现 `--no-skills` 的限制，需复验），按支持矩阵处理差异。

## 范围外
- 另建 Skill 语言、自动执行未知脚本、把 Skill 文本直接塞进系统 Prompt 当作完整安装。
- 动态跨租户共享无授权目录；无审核直接执行上传的代码。
- 顺便重构模型目录、Agent Runtime 或插件市场。

## 注意点
- Skill 包可能包含可执行脚本：安装阶段只复制和索引；执行阶段受沙箱权限与审批控制。
- 编辑版本应是新版本/可回滚变更；旧会话已有固定引用不能被静默替换。
- 目录遍历、软链接、执行位、非法路径和包大小需做边界检查。
- 删除能力需要前端/后端/版本引用联动；先确认当前 API 已支持什么，避免重复写删除后端。
- UI 展示“已下发”和原生 Runtime 的“已加载”必须分别反馈，不能只因上传成功就显示可执行。

## 验收标准
- [ ] 完整 Skill 目录导入、编辑、删除、版本、审计链路可用。
- [ ] 不同 Session 仅收到被授权版本，目录结构/资源/哈希一致。
- [ ] CC/OpenCode 真实读取 reference 并在沙箱中执行脚本，Codex/Pi 结果给出实际能力矩阵。
- [ ] 版本更新/撤销后新旧会话行为可预测，未授权和恶意目录拒绝。
- [ ] 仅文本 Skills 的历史行为与原生模型/Agent 工具不受回归。

> 尚待确认：标准 Skill 规范版本、各 Runtime 目标安装路径及热更新/重启支持矩阵。
