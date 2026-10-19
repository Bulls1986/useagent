# UA-BL-13｜企业 AI 门户 Work / Cowork 模式增量集成（LibreChat + UseAgent）

| 字段 | 值 |
| --- | --- |
| 类型 | **产品集成主线**（独立于 UseAgent 内部功能待办） |
| 优先级 | 核心产品方向；正式排期/负责人与版本待规划 |
| 状态 | Backlog（仅冻结目标与分阶段边界，不代表已启动开发） |
| 产品定位 | LibreChat = Chat；UseAgent = Work，作为企业 AI 门户的**增量能力** |
| 关联 | [UA-BL-02 原生 CC Session](./native-claude-session-continuity.md)、[UA-BL-03 文件与制品](./artifact-storage-s3-minio.md)、[UA-BL-04 技能包](./skills-package-management.md)、[UA-BL-05 模型目录](./litellm-dynamic-model-catalog.md)、[UA-BL-07 用户/组织隔离](./multi-user-isolation.md)、[UA-BL-08 CC LiteLLM](./claude-code-litellm-adapter.md)、[UA-BL-09 技能 UI](./skill-playbook-unified-experience.md)、[UA-BUG-01 Workpiece 错误](./workpiece-create-failures.md)、[UA-BUG-02 Runner 生命周期](./local-docker-runner-lifecycle.md) |

## 一、业务目标（已讨论确定）

- 现有企业 AI 门户继续使用 **LibreChat 提供日常 Chat**（问答、推理/分析、文件理解、企业知识库/助理等），**不以 UseAgent 替换 LibreChat**。
- 为门户**增量提供 Work / Cowork 工作模式**：利用 UseAgent 托管的原生 CLI Runtime（例如 OpenCode / Codex / Claude Code）执行可持续、有文件与制品结果的任务。
- 面向最终员工只呈现“对话”和“工作”两种用户意图；不要求理解 CLI / Agent Harness / Sandbox / Playbook。Work 不局限于编程，也可以扩展文档、研究、数据分析与报告交付；真实场景可用性必须逐类验证。
- **UseAgent 保留自己的 Session / Thread / Run / Sandbox / 运行事件 / 制品生命周期**，企业门户只负责入口、身份和授权、任务交接及必要的聚合展示；不重写 CLI Agent Loop 或模型/工具调度。
- 最小开发量与可逐步落地优先：**先把两个产品连起来，再逐步融合体验**，不要一开始重做整套 Chat 前端或把 Work 硬塞进模型兼容聊天协议。

## 二、边界与架构原则

| 领域 | LibreChat / 门户 | UseAgent（Work） | 集成边界 |
| --- | --- | --- | --- |
| 核心交互 | Chat 会话、普通 AI 助理与知识问答 | 原生 Agent Work 任务、长时间执行、恢复 | 统一导航/权限，允许显式 Chat → Work |
| 身份 | 现有企业身份认证和门户访问控制 | Work 侧 user/org/session/resource 授权 | 同一可信企业身份源或受控 token exchange；服务端验证，不信任前端 userId |
| 模型 | 沿用企业 LiteLLM 治理 | 各原生 CLI 经受控 Provider Adapter / LiteLLM 调用 | 模型可用清单、认证、授权、额度、审计口径协调，不能假定协议完全相同 |
| 执行 | 不承担 CLI 长任务内部生命周期 | Run + 独立 Sandbox + Native Runtime、事件、恢复与配额 | 不把 UseAgent 包装成只会发文本的普通 Custom Endpoint |
| 文件/制品 | 用户显式选择要交给 Work 的附件 | 沙箱内使用、持久产物与回传 | 权限校验、版本/引用、大小/类型限制、安全扫描和存储接口 |
| 进度/交付 | Work 模式入口及结果跳转/聚合展示 | 权威任务状态、事件、审核与产物 | API/事件适配边界保持薄，先复用既有 Work UI |

**约束**：Chat / Work 不共享或复制内部数据库表、Cookie/Session、原生 Agent 内存状态；依靠明确的企业用户标识映射、授权检查、标准化任务交接和回调/状态 API 通信。不得在浏览器中透传 LiteLLM 私钥或沙箱特权凭据。

## 三、分阶段交付范围（里程碑仅表示依赖顺序，不代表已排期）

### M1｜Work 单独可用（UseAgent 侧能力验收）

- 以一个真实员工和真实企业模型完成“创建 Work → 原生 CLI 执行 → 多轮继续同一 Session → 沙箱文件操作 → 制品回传 → 恢复/终结”的 E2E。
- 优先确认现有 Work UI / API 可直接复用的能力，不重造独立工作台。验证 OpenCode / Codex 的稳定性，以及 Claude Code 接入范围；失败/成本/等待状态准确呈现。
- 依据已有待办校验：UA-BL-02（会话连续）、03（附件制品）、07（隔离）、08（Claude LiteLLM），按实际缺口处理。**UA-BL-04/09/10～12 全部完工不是 M1 的默认前置**，缺口按具体 Work 场景评估。
- 初始范围可以只覆盖少量已验证的工作任务和沙箱提供方；不能宣称覆盖所有员工与所有 Runtime。

### M2｜门户统一入口 + 身份/权限

- 在现有企业门户显式提供 Chat / Work 导航，允许用户无须再进行独立账号注册/逐人手工配置即可进入授权的 Work（实现机制待身份系统审查）。
- 冻结可信身份映射（企业员工 ID → UseAgent 用户/Org/角色）、组织/项目工作空间绑定、首次开户/回收、授权与审计、登出/失效和跨租户安全。
- 明确在门户侧和 Work 侧的模型权限、Work 配额、任务并发、沙箱生命周期和费用归属；不能仅仅共用 LiteLLM URL 就视为治理统一。
- 第一版可以独立页面/同域导航跳转；同屏双模式属于后续增强，而非首版前提。

### M3｜Chat → Work 显式交接

- 用户主动从 Chat 将讨论结果“转为 Work”：由 Chat 侧形成**任务交接包**，包含目标、业务背景、输入材料引用、约束、交付清单、验收条件及原始对话来源标识；由用户确认后创建 Work Run。
- **不默认无差别复制全部 Chat 历史**；仅透传经选择和权限校验的文本摘要/附件，避免 token 浪费、隐私/权限越界、Prompt 注入与不必要的数据重复。
- 交接结果记录门户对话来源、UseAgent Thread/Run ID；返回 Work 深链。Work 后续对话由自身原生 Session 管理，不依赖 LibreChat 对话历史承载完整状态。
- 由服务端保证幂等创建与失败回执；重复点击、超时重试不得无提示地产生多个昂贵 Work/Sandbox。

### M4｜统一 Work 体验、进度与制品回流

- 在门户查看 Work 运行状态、关键事件、人工确认请求和执行输出；逐步提供任务列表、恢复/中止、成果预览/下载，优先复用 UseAgent 已有页面/API。
- 将完成的工作成果**按用户显式操作**回传/关联到原 Chat 或知识库；不自动把沙箱内容发布为组织知识/技能。
- 逐步加入多任务排队、资源用量和体验指标；有需要再评估将原生 Work UI 嵌入门户，而非一开始整体迁移。
- 审计、预算、生命周期、跨组织/跨用户权限和取消/恢复等在集成链路中必须一致。

## 四、明确不做

- 不替换现有 LibreChat Chat、知识库、用户习惯和模型入口。
- 不将 Work 简单封装为 OpenAI Chat Completions / Custom Endpoint，以为这样就天然支持持续执行、沙箱、多轮恢复和文件回传。
- 不在门户侧重建 Native CLI Agent Loop、工具执行或全套 UseAgent Backend。
- 不以一开始完成全站前端融合、统一数据库或完整 Workflow/DAG 引擎为条件。
- 不随本任务扩大到知识库重构、全量 Skills 包、Learning 自动提案改善、原生模型协议大改；均由对应 Backlog 独立收口。

## 五、重点风险/注意事项

- 企业实际目标可能涉及大量员工；应设计组织级开户/授权和并发/容量治理，先灰度，不以手工给每人配置模型与沙箱作为长期方案。
- 使用同一 IdP **不等于**双产品自动 SSO。需明确 LibreChat 的认证流程、UseAgent Session 机制、后端 token exchange、跨域 Cookie/CSRF 与撤权事件，以真实部署验证。
- 原生 CLI 不同模型协议能力不同；LiteLLM 可见模型列表与能否被特定 Native Runtime 正确调用是两个问题，不能用“静态同步模型清单”替代端到端测试。
- Sandbox 进程生命周期/回收/工作目录与 Native Session 恢复一致性是 Work 真正有用的基础；不可因页面完成就认定工作模式就绪。
- 权限隔离同时覆盖 Portal Conversation、交接的文件引用、UseAgent Run、Sandbox、Artifacts、Skills 和费用归属；不可共享可被其他用户猜测访问的 URL。
- Work 用户体验应包含失败、排队、取消、人工介入、输出不满足验收等非成功路径，并保留错误和事件证据。
- 当前仅是目标和阶段边界。实现前以 LibreChat 当前部署、UseAgent Fork 最新 Head、LiteLLM 配置和实际企业身份源做兼容性审查；未知环节保留待确认，不编造现成 API。

## 六、验收门禁

- [ ] 门户保留原 LibreChat Chat 能力，Work 有清晰独立入口，切换不丢失原会话。
- [ ] Work 可完成真实 E2E，Native Runtime 原生 Session 连续、沙箱隔离、文件和制品可恢复，状态与结果真实。
- [ ] 多个员工首次进入 Work 无需人工逐个配置；同 Org 不同员工/不同 Org 的权限、模型、文件、运行和制品严格隔离。
- [ ] Portal → UseAgent 创建任务、身份绑定、权限校验、幂等与错误回执有真实集成测试。
- [ ] Chat → Work 交接用户可见、可确认、可追溯；内容只包含有权转交的摘要/文件，任务恢复不依赖持续复制旧聊天。
- [ ] Work 成果与状态可被已授权用户查看，拒绝无权限链接/文件/操作；中止、失败、恢复、人工介入路径通过验证。
- [ ] 模型授权、额度、成本、日志和审计可归属到员工/Org/Work 任务；OpenCode/Codex/Claude 原生执行通路不回归。
- [ ] 阶段验收分别留可追溯的部署、测试、版本和安全证据；不把独立待办未完成一概作为本主线的阻塞。

## 七、待确定（本次不擅自冻结）

- 门户 UI 承载方式（独立子路径/反向代理/嵌入页面）与域名、跨域 Cookie、安全 CSP。
- 现有 LibreChat 企业身份源、UseAgent 登录扩展点与 token exchange 方式。
- Portal ↔ UseAgent 的最小任务创建/状态读取/上传/制品接口契约，以及由谁负责交接摘要。
- 首个生产试点人群/具体任务类型、并发/沙箱池容量及预算上限。
- 先提供哪些 Runtime 与模型，是否由管理员允许用户选择运行引擎，以及审批和人工介入的门户展示方式。
- 责任人、排期、发布版本、M1～M4 实际实施顺序可随实际能力评估调整。

> **追踪原则**：UA-BL-13 是产品集成主线；UseAgent 内部缺口沿用现有 UA-BL-01～12 / UA-BUG-01～02 追踪，不复制需求或重开同类改造。
