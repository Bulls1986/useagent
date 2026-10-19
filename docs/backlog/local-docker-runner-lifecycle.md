# UA-BUG-02｜Local Docker Runner 空闲回收、磁盘资源与真实执行闭环

| 字段 | 值 |
| --- | --- |
| 类型 | 历史部署可靠性与回收缺口；P0/P1 项目验收待复验 |
| 优先级 | 真实 E2E 门禁优先；默认清理策略待冻结 |
| 状态 | Backlog：历史现象需以最新部署重新核验 |
| 关联 | [UA-BL-01 Hooks](./sandbox-lifecycle-hooks.md)、[UA-BL-02 Native Session](./native-claude-session-continuity.md) |

## 背景与历史发现
已采用 Windows 上的 **Local Docker Runner** 作为当前实际部署路线，不切换 Cube/Daytona；曾完成 Runner online、镜像地址+SHA256 digest 注册和真实 Docker Sandbox 创建，但此前发生过 Codex 的 **bwrap/namespace Shell 执行失败**，以及容器停止后仍保留资源/磁盘。**这些是历史验收证据，不能假定当前 Head 仍有相同故障**。

关于生命周期，历史代码/对话曾确认：**大约 30 分钟空闲停止、每 60 秒检查**，停止保留数据并可按需恢复；个人 Local Runner 的进一步自动删除/GC 与空间回收不完善。讨论过**72 小时删除**与空间水位清理，属于改造候选，**不是已冻结的产品默认值**。

还讨论过 2 分钟空闲停止的影响：可以作为用户可配置的停止阈值讨论，但**不能将 Stop 等同于 Delete**；必须防止长时间命令或工具调用被误判无活动。

## 已冻结的方案/使用边界
- 当前实际验收必须走 **UseAgent API → Local Runner → Docker Sandbox → 原生 Agent/Shell → 输出/制品 → 停止/恢复/删除** 的真实闭环，而不是只看 `docker ps`、容器健康检查或 Runner online。
- 本机执行路径维持 **Local-only 选择策略**，云端无权限/不可用时应明确失败（历史上讨论过 Cloud 409），不能静默回退 Daytona。
- Runner 镜像用固定 Ref + SHA256 digest 校验；并发配额从实际部署配置和监控读取，不把一次出现的“Limit 1”视为产品默认值（历史讨论也提及过默认最多 4 个运行沙箱）。
- 启动/挂载/执行中命令、终端、Active Run 必须算活动；不能由于输入输出暂时安静而停止仍在执行的长任务。

## 范围内
1. 核验生命周期：创建→执行→idle stop→保留数据→恢复→显式删除/过期 GC→真实磁盘释放。
2. 活动判定：运行中 Agent、Bash、长任务、终端会话、流式执行不能被误停；判定信息可观测。
3. 并发与配额：当前配置上限、运行槽位释放、Stop/Resume 重新占用额度，以及“运行名额”和“磁盘用量”的差异。
4. 个人 Runner 的已停止实例如何在后续删除/释放，清理安全策略（时间/容量水位/是否保护 Session）的评估。
5. **历史 bwrap/namespace 和 Shell** 失败需在当前版本重新测真；存在则作为同一 Local E2E 门禁的独立失败点最小修复。
6. 停止/恢复/删除与原生 CC/Codex/OpenCode Session、工作区及 Artifact 持久性分别验证。

## 不在范围
- 默认删除所有停止容器或空闲 2 分钟直接销毁文件系统。
- 换掉 Local Runner/重写 Sandbox 架构，立刻部署 Cube/KVM。
- 将历史 bwrap/并发限制、30 分钟/60 秒参数不经复核就称为当前真实值。

## 注意点
- **Stop 可释放运行资源但可能不释放磁盘**；Delete 可能造成原生 Session 丢失，这个破坏性动作需要明确策略。
- GC 不能扫描删除其他用户工作区/已完成 Artifact/仍有运行任务的 Session。
- 需要区分镜像缓存、容器可写层、保留工作区与 volume 的空间来源。
- 并发容量既受 Runner 配额，又受宿主实际内存/CPU/磁盘限制。

## 验收标准
- [ ] 当前版本实测真实 Agent+Shell、文件修改和制品回传链路，历史 bwrap 故障明确复现或证实已解决。
- [ ] 多轮、长任务与空闲情况下的活动判定正确，没有执行中误停。
- [ ] stop/restore/delete/磁盘回收端到端可量化，能够保护未完成工作区。
- [ ] 当前并发上限、槽位释放/重用与资源占用有可复核数据。
- [ ] 默认 GC/TTL 冻结后实现相应测试，且 CC/Codex/OpenCode 无回归。

> 各项历史参数是**既有讨论/当时观察**，实施前先确认最新代码和实际 Docker Compose 环境，避免重复修复。
