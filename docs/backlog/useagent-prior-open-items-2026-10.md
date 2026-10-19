# UseAgent 历史待办汇总（2026-10）

> 记录日期：2026-10-19  
> 状态：**Backlog / Deferred（本次只登记，不开发、不部署）**  
> 适用项目：`Bulls1986/useagent` Fork  
> 原则：只记录此前已讨论的真实缺口、明确后续能力或已知待验证风险；本文件不代表代码已修复、功能已验收或排期已确认。实施前必须以最新代码、部署与实测重新核对状态。

## 0. 范围及决策（已明确，不应再发散）

- **架构**：一个任务/会话托管一套完整的**原生 Agent Runtime**，隔离在独立沙箱；平台负责输入输出、资源连接、会话映射、创建/恢复/释放和治理，**不重写 Agent 内部 Loop、规划或工具调度**。
- **沙箱选型**：当前本地验证以 **UseAgent 自带 Local Docker Runner** 为主；**CubeSandbox 是后续需完成兼容/验证的提供者**，保留其原生 Template 定义，不重新发明 Cube Schema；**不再以 Daytona 替换当前本地方案**。
- **扩展原则**：尽量模块化/插件化，在能力所属层建立少量稳定扩展点；不得为了一个缺口对核心 Engine/Provider/Sandbox/Session 模块做霰弹式修改。禁止顺便重构或引入未讨论的通用插件市场。
- **当前不执行**：不启动开发、不修改镜像、不重启 Docker/生产服务、不调整运行中的模型与密钥。
- 已单独登记：**[Claude Code × LiteLLM 插件式模型适配（Must-have，OpenCode/Codex 零回归）](./claude-code-litellm-adapter.md)**。本文件只引用，不重复开第二项。

## 1. 已确认的后续功能（必须纳入未来规划）

### UA-BL-01：Sandbox 生命周期脚本 / Hook
**状态：Backlog｜分类：功能缺口**

用户需要能在 **创建、启动/恢复、会话挂载及执行前** 插入明确的操作（例如 Git 拉取最新代码、初始化环境、准备项目文件），而不是为每个场景硬编码特殊逻辑。

**边界与要求**
- 优先复用 Sandbox Provider 的现有创建/命令执行能力，不侵入 Agent Loop；
- 明确区分 Template **构建**、实例 **创建**、实例 **恢复**、Session **挂载**、Turn **开始**的时机，以及每个阶段是否支持注入；
- 配置执行身份、超时、失败策略、幂等/重复执行语义、事件日志和权限；
- 支持 Local Docker Runner，并逐步验证 CubeSandbox 原生执行与生命周期事件；**Cube 的 Template 透传原生声明**；
- 不应将 `onCreate/onResume/beforeRun` 这些候选名称误认为已存在的正式 API；最终字段应以现有接口设计为准。

**验收**：用户为指定 Template/Session 配置启动或挂载时运行的命令，能正确触发、失败有诊断、恢复与重复运行符合定义，其他沙箱行为不受影响。

### UA-BL-02：原生 Claude Code Session 的真实连续性与恢复
**状态：Backlog｜分类：P0 验证 + 缺口修复（验证先行）**

UseAgent 的 Thread/T3 会话连续 **不等于** Claude Code 原生 Session 连续。需要验证 Runtime 在同一 Sandbox 的连续多轮、空闲停止与恢复、Backend 重启之后能否保持原生会话 ID、上下文和工具状态；沙箱真正销毁后不能假装原生续会话可用。

**验收**：留存原生 Session identity 与恢复证据；同一沙箱多轮上下文正确；恢复路径明确可恢复条件/不可恢复错误；不能把平台事件重放误当成原生会话恢复。

### UA-BL-03：文件输入、产物输出与持久化存储 Provider
**状态：Backlog｜分类：功能扩展 + 端到端验证**

- 核查用户文件如何从前端/Backend 传入隔离 Sandbox；任务结束时文件、产物与元数据如何导出、下载、回传。
- 现阶段识别的 `ArtifactStorage` 仅有 Local 适配；未来应按既有 Storage 抽象扩展 **S3/MinIO Provider**，支持配置切换，不将具体存储实现散落至业务调用处。
- 包含组织/用户访问权限、签名 URL 生命周期、失败重试、大小/格式限制、数据清理与引用稳定性；保留本地存储默认行为，不强制迁移旧产物。

**验收**：Local 与 S3/MinIO 的同一制品流程一致；完成上传→沙箱使用→导出→用户访问→权限校验的真实 E2E，异常与清理有依据。

### UA-BL-04：完整 Skills 包管理与下发到原生 Agent
**状态：Backlog｜分类：Must-have 功能缺口**

现有简化 Markdown 注入不足以代表完整 Skill。后续应支持完整 Skill 目录与资源：`SKILL.md`、`scripts/`、`references/`、`assets/`（可按规范扩展）。

**要求**：导入、编辑、删除、版本/引用、权限；按 Session 授权将完整包下发到 Sandbox，校验内容哈希与隔离；验证原生 Runtime 可以真正发现和加载（至少先覆盖当前使用的 OpenCode、Claude Code，并核验 Codex/Pi 支持情况）。**分发不意味着自动执行 Skill 脚本**。

**验收**：在平台编辑/选择某个含脚本和资源的 Skill，独立用户的 Agent 只能访问授权版本并能原生调用；删除/升级行为可追踪，旧会话状态有明确处理。

### UA-BL-05：LiteLLM 动态模型发现、同步与可用性治理
**状态：Backlog｜分类：功能扩展**

现有 LiteLLM 模型曾按静态白名单/Compose 配置进行导入，用户要求未来从 LiteLLM **动态读取可用模型**，而不是每新增一个型号就修改静态列表、重启后端。

**要求**：模型发现、缓存/刷新、按 Engine 能力与协议匹配、可用性/权限过滤、默认模型策略、原生 Run 模型授权、额度/审计；对模型上下线有清晰状态。**不要绕过现有 fail-closed 模型门禁**。

**依赖**：与独立的 [Claude Code × LiteLLM Adapter](./claude-code-litellm-adapter.md) 共享模型目录能力，但不因此替换 OpenCode/Codex 现有执行链路。

**验收**：LiteLLM 新增/撤下模型后列表能受控更新；不可用或未授权模型不能创建 Run；OpenCode/Codex 当前模型配置与请求行为保持兼容。

### UA-BL-06：CubeSandbox 真实兼容与模板/会话能力核验
**状态：Backlog｜分类：Provider 兼容与能力验证**

当前本地环境无法代表标准 Linux/KVM 等 Cube 部署条件；后续在合适宿主环境验证已有 CubeSandbox Provider 的真实行为：创建、实例资源、模板透传、Session 绑定、命令执行、停止/恢复/销毁与错误回报。

**约束**：使用 CubeSandbox **原生 Template 定义**及生命周期语义；UseAgent 只负责必要的输入输出与映射，不创造另一套模板 DSL；不因某 Provider 的差异修改通用原生 Agent Loop。

**验收**：真实 Cube 端到端路径与对应差异清单，明确哪些能力可用、哪些应不支持/拒绝；若 Hooks 接入，联合验证 UA-BL-01。

### UA-BL-07：多用户资源访问与租户隔离验证
**状态：Backlog｜分类：Must-have 安全/权限验收**

针对多人通过同一 UseAgent 部署使用不同项目和 Agent，会话、沙箱、文件、Artifact、事件流、凭证及 Skill 需要按用户/组织边界隔离，不因内部同一个组织就允许互相读取。

**验收**：跨用户/组织访问失败；用户不能通过任务 ID、共享 Runner、Artifact URL、WebSocket/SSE、Provider Gateway Token 或 Skill 路径越权；必须以真实并发用户测试。曾讨论的“大量用户/4000 人”属于容量评估背景，**不在本项内承诺具体并发规模或开展新架构重构**。

## 2. 已知缺陷 / 待定位（先复核现状，不预设修复结论）

### UA-BUG-01：`workpiece_create` / `create_workpiece` 失败及任务耗时
**状态：Open investigation｜分类：功能故障/诊断**

此前观测到任务较慢且多次 `workpiece_create` 失败；历史抽样曾出现约 2 个任务合计 76 分钟、约 45 次失败，**该数字是当时分析线索，不代表已经逐条归因**。

已确认 `workpiece_create` 不是传给沙箱的文件：Agent 在 Run 中通过 UseAgent MCP `tools/list` 发现工具，调用时由 Gateway/Backend 执行；其结构化 Workpiece、版本、事件和 Finished Work 具有后续用途，**不能因失败就直接移除或绕过**。

**后续最小工作**
- 分类型收集真实 MCP 工具参数、字段验证错误、日志与请求耗时（脱敏），定位主导的失败/重试链路；
- 对齐 MCP 暴露的 Tool Schema 与服务端实际校验和文档；给出可执行的字段级诊断；
- 验证图片 Artifact 引用、URL/签名/导出契约；核实重试的耗时占比；
- 避免在没有证据的情况下将问题归咎于 Local 存储、Sandbox 或 Finished Work 开关。

**验收**：可复现样例、真实根因证据、最小修复与前后耗时/失败数对比，并保持 Workpiece 既有业务行为。

### UA-BUG-02：Local Docker Runner 回收闭环与资源积累
**状态：待复验｜分类：部署可靠性**

历史检查显示 Local Runner 有空闲停止与保留磁盘状态，但**个人 Local Runner 的停止后自动删除/磁盘清理链路可能缺失**；因此存在长期占用磁盘与沙箱达到并发上限的风险。历史设置出现过 Limit 1 与其他上限，不应将某次观测作为永久默认值。

**后续最小工作**
- 在**当前实际版本和部署**检查活跃/空闲判定、stop/restore/delete、定时 GC、并发上限、磁盘用量；
- 区分“停止保留数据”和“删除不可恢复”，避免因为粗暴清理丢失用户工作区；
- 完成真实资源释放/回收 E2E 与可观测性；需改变默认策略时单独确定保留期限与用户提示。

**验收**：创建→执行→闲置停止→恢复/显式删除→磁盘释放端到端有证据；不会错误删除正在使用的原生 Session。

## 3. 计划与实施的共同门禁

1. **先验现状**：功能、缺陷均需在当前 Fork 最新 Head 和部署中验证；如已实现，应标注证据并关闭待办，不重复开发。
2. **最小改动**：按所属 Provider/Adapter/Storage/Skills 等模块实现插件式扩展；不得在无关核心模块散弹修改。
3. **非回归**：对 OpenCode、Codex、Claude Code 原生路径建立改造前基线，回归原有模型、会话、Streaming、Tool Use、文件、权限和 Gateway。
4. **明确拆分**：功能需求与问题定位不可混写为一个“必须重构”；排期、负责人、版本均待后续规划。
5. **不擅自扩大**：不做通用插件市场、不重新选型 Agent Harness、不把本清单延伸成其他产品（例如 PDLC）的开发任务。

## 4. 目录索引

- [UA-FEAT：Claude Code × LiteLLM 插件式 Model Provider Adapter](./claude-code-litellm-adapter.md)
- 本文：Sandbox Hooks / Native Session / ArtifactStorage / Skills / Dynamic Models / Cube / 隔离与缺陷调查。

> 本清单是对此前明确讨论过的项目事项的**需求留档**；后续实施顺序应依据复验结果与现有里程碑确定，避免把历史判断误当作当前版本事实。
