# UA-BL-15｜Sandbox Operations：Cube 状态、资源与实例运维

| 字段 | 值 |
| --- | --- |
| 类型 | 运营/运维控制台，OPS-01 |
| 优先级 | P0，排期待定 |
| 状态 | Backlog（仅方案，未开发） |
| 关联 | [UA-BL-06 Cube Provider 验证](./cubesandbox-compatibility.md)、[UA-BL-07 多用户隔离](./multi-user-isolation.md)、[UA-BL-16 模板发布](./sandbox-template-lifecycle.md)、[UA-BL-18 多模板预热池](./multi-template-warm-pool.md) |

## 目标与已有底座
提供 Infrastructure → Sandbox Operations（Overview / Sandboxes）运维视角：**Cube 是否可用、节点可调度资源、沙箱实例列表与归属、可安全人工 Pause/Resume/Release/Kill**。

当前源码具备 `packages/sandbox-cube/src/provider.ts` 的 `list()` / `get()` / `pause()` / `delete()`、实例 cpu/memory **规格**、`inventory()` 的 CubeOps node allocatable 数据（需 `CUBE_OPS_ACCESS_TOKEN`）；`backend/src/fleet/inventory.ts` 结合持久化 lease 的资源预留并缓存 Provider inventory；`backend/src/sandboxes/cube-warm-pool.ts` 有 ready/creating/failures/target；`backend/src/runs/sandbox-release.ts` 已有拒绝释放活跃线程的安全释放逻辑。以上均不是完整运维 API 或 UI。

## 本期功能
1. **Overview**：Cube API/CubeOps 健康状态、节点 Ready/不可调度、CPU/内存总量/可分配/已预留、按模板规格估算新建容量；实例状态数量、使用中的会话数、排队及拒绝原因、预热池状态、最近同步时间/错误。不得把 allocation、reservation、实际使用率混成一个数；实际 CPU/RAM 使用量需要独立指标采集通道与数据来源。
2. **Sandboxes**：Provider 实例 ID、状态、创建/最近活动时间（仅提供方可获取时展示）、模板真实 ID/别名、CPU/内存规格、绑定组织/用户/Thread/Run、是否 warm pool、lease/会话状态、实例所在节点（如果 Cube API 支持）。
3. **差异识别**：Cube 真实实例集合与 UseAgent DB lease/retained thread/warm pool 交叉匹配，明确「托管」「预热池」「疑似孤儿」「外部 Cube 实例」「未知」，不得自动把所有非 DB 实例当成可删除垃圾。
4. **动作**：Pause/Resume、正常 Release、受控 Force Kill；操作前重新查询实时状态并验证实例身份、归属与权限。对活跃 Run 需要明确影响提示与二次确认。
5. **Force Kill 安全链路**：对受 UseAgent 管理的实例，先冻结新任务进入/检查并发与生命周期锁，处理活跃 Run 终态或取消，执行 Cube Kill，再对齐持久化绑定、lease、运行错误、预热池占用及审计记录；若部分失败进入 reconcile，而非仅直接 `sandbox.delete()`。
6. **权限与审计**：观察权限/操作权限/强制终止权限分离；操作员身份来自可信登录，记录执行人、操作对象、请求原因、幂等请求标识、开始/完成与错误；不同组织只读隔离，跨组织运维必须显式特权。

## 不做
- 不新建另一套 Cube 资源调度器、虚拟化控制平面，不替换 Cube 原生监控/metrics。
- 不把宿主机总闲置资源当成可立即创建实例数量；仅提供明确假设、可调度节点及资源档位下的估算。
- 不在当前任务中实现多模板自动扩缩、复杂计费、跨 Provider 全功能同质化（见 UA-BL-18）。
- 不将 Cube 的 Preview、节点管理、宿主机 root 权限暴露给普通用户。

## 关键源码与风险
- `backend/src/operator/access.ts` 目前是基于 `OPERATOR_ACCOUNTS` 的操作员白名单；产品化需要明确只读/运维/高危操作授权，不等同于业务角色。
- `backend/src/fleet/capacity-policy.ts` 按声明的 host budget、持久 lease 和可选 Provider Node snapshot 准入；运维状态应复用而非维护另一套计数口径。
- 目前 Cube timeout 配置含 `onTimeout:"pause"` 和 `autoResume:true`；Pause 不一定等于释放所有容量。Kill 预热池实例可能触发立即补充，应提供预热池目标变更或标注自动补充行为。
- `CubeProvider.inventory()` 在未配置 Ops Token 时返回空对象；UI 不能将缺测绘制为 0。指标新鲜度、失败原因及 Cube 版本需要可见。

## 验收
- [ ] 实际 Cube 集群联通、未联通、无 CubeOps Token、部分节点不可用时状态准确；有时间戳、数据来源、Unknown 状态。
- [ ] 实例列表能够与 Thread/Run/lease/warm pool 交叉定位，无越权跨组织展示。
- [ ] 安全 Release 正常完成；活跃 Run 释放被阻止；Force Kill 有二次确认、审计、并发互斥、DB/Provider reconcile 与失败重试。
- [ ] 用户/运维并发处理下不误删其他组织或复用中的实例，工作区/制品损失明确提示。
- [ ] 实际 CPU/RAM 使用与配额预留不误标；观测链路与现有准入调度、Local/Box/Daytona 不互相破坏。

## 待确定
- 对接当前 CubeOps 指标口径和 Prometheus 的可行性，实例级 CPU/RAM 实时指标来源、更新频率、历史保留；高风险 Force Kill 的权限门禁与运营审计保存期。
