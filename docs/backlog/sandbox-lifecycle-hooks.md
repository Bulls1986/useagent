# UA-BL-01｜Sandbox 生命周期脚本与 Hooks

| 字段 | 值 |
| --- | --- |
| 类型 | 后续功能 |
| 优先级 | 待排期（重要） |
| 状态 | Backlog：方案方向已讨论，接口设计待冻结 |
| 关联 | [UA-BL-06 Cube](./cubesandbox-compatibility.md)、[UA-BUG-02 Local 回收](./local-docker-runner-lifecycle.md) |

## 背景与需求
需要在模板实例化与真实 Session 运行时执行初始化动作，例如拉取 Git 最新代码、配置环境、准备目录/依赖。模板镜像不应该固化所有随项目或会话变化的内容。

## 已确定的方案
- **模板定义归 Sandbox Provider**。CubeSandbox 的原生 Template 原样透传，不自创第二套 Cube 模板 DSL；Local Docker Runner 使用自身适用的构建/运行定义。
- **运行时 Hooks 归 UseAgent 的沙箱生命周期层**，统一管理何时执行命令，复用 Provider 的执行能力而不是更改 Claude Code/Codex/OpenCode Agent Loop。
- 至少区分：镜像/Template 构建、实例创建后（post-create）、会话挂载后（post-attach）、每次 Turn 执行前（before-run）、运行结束后（after-run）；实例恢复单独检查是否需要再次执行。
- 历史上讨论过 `postCreate/postAttach/beforeRun/afterRun` 等名称，仅为**候选语义**；以实施时的现有 Provider 接口为准，不假设这些字段已经存在。
- 跨 Provider Hook 能力采用**显式支持/不支持**声明；不能假定 Cube 原生支持暂停/快照类 Hook（例如 prePause/postResume）。

## 范围内
1. 配置声明：针对 Template/Session/Run 的命令、阶段、工作目录、执行用户、环境变量引用、超时、允许失败与否。
2. 创建/恢复/挂载/执行的幂等与重复执行约定（比如 Git 更新只在实际挂载阶段运行，不盲目对每条消息完整初始化）。
3. 失败阻断/恢复策略、错误输出、审计事件和可诊断性；生命周期取消与并发冲突处理。
4. 首期优先现有 Local Docker Runner；随后与 CubeSandbox 真实环境做相同语义验收。

## 不在范围
- 重建 Agent 内部工具调度、任意 webhook/插件市场、额外的模板描述语言。
- 直接暴露平台特权命令或静默提升执行权限。
- 未经测试即承诺所有 Provider 的 pause/resume/snapshot Hook 一致。

## 注意点与风险
- Git pull 可能破坏未提交文件：不能对已有用户工作区无条件执行强制覆盖或 reset。
- 失败不应被当成成功；超时、取消、重试必须与 Session/Run 状态一致。
- 重建沙箱、同一 Session 多轮对话和新 Session 挂载是不同场景，明确哪些 Hook 应当执行一次/每次。
- Hook 的运行用户、命令和环境变量隔离必须受权限限制；敏感凭证只通过安全引用注入。
- 和 [原生会话连续性](./native-claude-session-continuity.md) 关联：恢复 Hook 不能误删/覆盖原生 Session 状态。

## 验收标准
- [ ] 一份配置覆盖“新建→挂载→执行→停止→恢复”链路，Hook 顺序正确。
- [ ] 能在挂载阶段受控执行 Git 更新并报告结果；不覆盖未提交文件。
- [ ] 失败、取消、超时、并发均有明确状态和日志；重复调用幂等。
- [ ] Local 通过实际 E2E，Cube 在可用真实环境完成能力差异验证。
- [ ] 移除 Hook 配置即回到原有行为；Codex/OpenCode/CC 原生逻辑零回归。

> 尚待确认：最终 Hook 名称、版本化配置格式、各 Provider 对具体阶段的支持矩阵。
