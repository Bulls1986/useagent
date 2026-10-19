# UA-BL-06｜CubeSandbox Provider 原生兼容、模板和生命周期验收

| 字段 | 值 |
| --- | --- |
| 类型 | 后续 Provider 兼容与真实验证 |
| 优先级 | Backlog / 不是本地当前部署主线 |
| 状态 | Backlog：需要具备合适的真实 Cube 宿主条件 |
| 关联 | [UA-BL-01 Hooks](./sandbox-lifecycle-hooks.md)、[UA-BL-02 Session](./native-claude-session-continuity.md)、[UA-BUG-02 Local](./local-docker-runner-lifecycle.md) |

## 背景
曾在 Windows/WSL、Mac/ARM 相关环境讨论 KVM/PVM 与 Cube 的硬件/内核要求，当前不应以不符合条件的虚拟化环境判定 Cube 不可用。UseAgent 已存在 Cube Provider 接入，但尚需**合适 Linux/KVM 宿主上的真实 E2E 和生命周期证明**。

## 已确定的约束与方向
- **CubeSandbox 模板透传 Cube 原生定义**，不增加 UseAgent 自创的镜像/Template DSL；UseAgent 管理模板引用、权限、沙箱挂载和执行命令。
- 一个任务/会话托管完整原生 Agent Runtime 于独立沙箱；线程级隔离交给 Sandbox，不以共享线程强行切换其他用户文件系统。
- 生命周期按 Provider 真实支持能力声明：Create/Attach/Detach/Destroy 可核对，Pause/Resume/Checkpoint/Snapshot 不得假设 Cube、Box、Local、Daytona 都等价。
- 先完成当前 **Local Docker Runner** 实际部署与回归；Cube 是后续 Provider 验证/能力补充，不改变本地默认路径。
- 已讨论过约 10 分钟闲置暂停、按需恢复、过期清理等 **候选运营策略**；需要实测资源/配额/恢复行为后再冻结正式默认值。**暂停与释放调度名额不能等同**。

## 范围内
1. 合规宿主条件（KVM/内核/资源）和部署环境清单，注明 ARM/Mac 虚拟化差异而不凭空承诺兼容。
2. Cube 原生模板选择/引用、实例创建、命令执行、Session 绑定、文件工作区、失败回收。
3. 停止、暂停、恢复、删除的 Provider 状态、计费/资源占用、原生 Session 恢复行为和错误语义。
4. Hooks（如后续完成 UA-BL-01）可通过 UseAgent 编排接入，但应明确哪些是平台 Hook 而不是 Cube 原生 Hook。
5. 与现有 Local Docker Runner 作行为差异和支持矩阵，不修改公共 Agent Driver。

## 不在范围
- 此阶段强制部署新 Cube 机器、切换生产默认 Sandbox、改造完整 Agent Runtime。
- 伪装不支持的 Pause/Snapshot 或在无 KVM 宿主条件下宣称验证通过。
- 为 Cube 重做通用 Sandbox Template、管理后台或存储系统。

## 注意点
- Mac/ARM、WSL 与真正 Linux/KVM 宿主不等价；测试记录必须注明实际平台/内核和 Cube 版本。
- 生命周期 Hook 与 Sandbox Provider 原生命令/事件应区分，异常回收不可误删未交付文件。
- “一个 Template 启动 N 个 Sandbox”意味着实例级资源计量与配额；不能把模板数量当作实例容量。
- 尽量不改变其他 Provider 配置；出现 Provider 不支持时清楚拒绝，不静默 fallback。

## 验收标准
- [ ] 在符合要求的 Cube 宿主上完成模板→实例→原生 Agent→命令/文件→停止→恢复/删除真实闭环。
- [ ] 可证明模板内容原生透传，变动不会污染其他 Session。
- [ ] 精确记录各生命周期状态的资源、并发额度与恢复结果。
- [ ] 失败/超时/取消/租户隔离/清理经真实测试。
- [ ] Local、Box 等既有 Provider 及 Codex/OpenCode/CC Driver 无回归。

> 待确认：最终 Cube 版本/宿主资源及暂停能力、默认空闲/过期清理策略。
