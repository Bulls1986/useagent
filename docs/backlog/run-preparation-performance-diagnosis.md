# UA-BUG-04｜每次 Run 前置准备耗时偏长（先收集诊断数据）

- **类别**：Run 启动性能 / Sandbox / 原生 Agent Runtime
- **优先级**：待数据评估（不预设 P0/P1）
- **状态**：Open investigation — 待诊断数据；**未确定优化方案**
- **首次记录**：2026-10-21
- **关联**：UA-BUG-03（Repository Admission 与重复准备）、UA-BL-02（原生 Session 连续性）、UA-BL-06（Cube）、UA-BL-15/18（Sandbox Operations/Warm Pool）

## 问题与边界

用户反馈：在 UseAgent 同一会话中，每次发起 Run 之前等待明显，体感慢。当前尚未取得部署现场的完整分阶段耗时数据，**不能将 Git、Sandbox、Provider Bridge、Runtime 或 LiteLLM 任一环节直接判定为瓶颈或根因**。

2026-10-21 对工作区源码的初步只读核对显示，Run 启动路径包含 Run 接受/Worker Context、Sandbox 获取与验证、Workspace/Secrets、仓库/附件、Provider Bridge、Runtime 就绪与原生 Session 恢复、Prompt Dispatch。部分步骤已有复用、跳过与并行机制；`prepareRepos()` 会在后续携带 `repos` 的 Run 再进入校验，但已有仓库不必然每次 clone。**以上只作诊断线索，不代表最新部署已复测或存在特定性能缺陷。**

## 待收集的证据

- [ ] 取**同一 Thread / 同一 Session 的至少三次连续 Run**，同时包含首次启动与后续复用；记录 Run ID、时间、引擎、模型、Sandbox ID/状态、是否复用、所选仓库/附件/Skill 的存在性及是否变更（不记录敏感内容）。
- [ ] 读取现有 `GET /api/runs/{runId}/timings`，采集 Run 关键时序，包括 `worker.*`、`sandbox.retained` / `sandbox.warm_pool` / `sandbox.create`、`repo.prep`、`t3.prepare.*`、`provider.session_resume` / `provider.session_start`、`t3.shell`、`dispatch` 到 `first_visible_delta`；以实际返回字段为准。
- [ ] 使用必要的脱敏 Backend / Cube / Runtime 日志，将 timing 与原生 Runtime 收到 Prompt、Provider 第一事件、首 Token 对齐，区分沙箱准备、Session 恢复、模型响应、异常等待/重试。
- [ ] 核实每次 Run 实际是否触发 Git clone/fetch、Provider 配置变更、Runtime 重启/就绪屏障、失败重试、Sandbox 冷启动/唤醒，并确认是否有重复操作及其耗时。
- [ ] 明确时段重叠关系、冷热路径与正常/异常样本；**嵌套/并行阶段不可简单相加**。找出占主导的可复现延迟及其触发条件。

## 本阶段范围与不做的事

- **本阶段只采集、复核和归因诊断数据，不预设实现方案，不排期开发，不修改配置与运行时代码。**
- 不预先决定跳过初始化/健康校验、调整 Sandbox 生命周期或 TTL、缓存认证、减少 Repo 准备、重构 Provider Bridge、改变 Session 机制；这些都必须在证据充分后另行评审。
- 不将 UA-BUG-03 的 Repository Admission 缺陷简单等同于所有 Run 性能问题，也不以单次慢 Run 推断常态。
- 保持 Tenant/User/Thread/Sandbox 隔离、密钥边界、原生 CLI Session 连续性及失败可观测性；不得仅为提速牺牲正确性。
- 不修改仓库根 `README.md`。

## 阶段性验收与后续决策

- [ ] 至少一组三次连续 Run 的端到端阶段耗时、时序及冷热复用信息可核对。
- [ ] 有足够证据区分 Run 创建、沙箱准备、Provider/Runtime、模型首响应，标明缺失数据与不确定性。
- [ ] 用可复现数据对主要慢阶段排序，并说明正常与异常路径的差异。
- [ ] **待以上数据到位后再单独评审方案、范围、风险、优先级及验收目标；本文件不冻结优化路线。**
