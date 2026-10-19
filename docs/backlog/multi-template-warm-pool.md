# UA-BL-18｜多模板 Warm Pool 与高级容量调度

| 字段 | 值 |
| --- | --- |
| 类型 | Sandbox 运维扩展，OPS-04 |
| 优先级 | P1，后续优化 |
| 状态 | Backlog（不阻塞 P0 运维/MCP） |
| 关联 | [UA-BL-15 运维监控](./sandbox-operations-console.md)、[UA-BL-16 模板](./sandbox-template-lifecycle.md)、[UA-BL-17 分配策略](./template-assignment-policy.md)、[UA-BL-06 Cube 兼容](./cubesandbox-compatibility.md) |

## 背景与目标
当前 `backend/src/sandboxes/cube-warm-pool.ts` 使用 `CUBE_T3_WARM_POOL_SIZE` 和单池默认目标（未配时 3），提供 ready/creating/failures 和自动 refill；`backend/src/fleet/capacity-policy.ts` 已按持久化 lease 与 host/Provider 可分配额度做准入，但尚未以多模板资源池为运维调度产品。

在角色/项目选择不同 Template 后，仍要保持较低的冷启动延迟和可预测容量：按模板 ID/版本分池，可由运维动态调整目标，并且不会因热池耗尽导致重复占用或误删已绑定 Session。

## 方案与范围
1. Warm Pool key 至少包括 Provider + 不可变真实 Template ID + 必要 Runtime 代际/资源档位；Alias 发布新版本后，新池渐进预热，老池排空但不能删除绑定会话。
2. 运维设置每池 min/target/max、开关/排空/回收策略，并显示 ready、creating、claimed、paused、failed、refilling、estimated warmup cost。
3. 池实例与 Thread/Run 绑定采用原子占用/回收语义；受保护的 `durablyBoundSandboxIds()` 及 lifecycle lock 不得被旁路。
4. 可调度判断继续由统一 capacity admission 负责，包含单节点能否容纳**整份**模板请求；预热池占用与 leased/retained 容量须清晰计入/排除且可审计，不能超卖。
5. 实例人工 Kill 时，如是池实例，应显示自动回填预期并允许先调整目标；真正释放容量先停 refill 再回收。
6. 可观测启动成功率、模板切换时延、Idle/Paused/Retained 各态资源回收效果；策略限于已验证的 Cube 版本和宿主容量能力。

## 不做
- V1 不做预测性扩缩、跨集群智能路由、复杂账单结算、实时动态迁移原生 CLI Session。
- 不强迫 Local、Box、Daytona 支持 Cube 才有的 Warm Pool 生命周期。

## 验收
- [ ] 多模板并存、各自认领、耗尽与补充、Alias 切换、后续回收都有真实 Cube E2E。
- [ ] Kill/超时/失败后的计数、持久化绑定、隔离与审计一致，不能误删已占用沙箱。
- [ ] 资源超限安全排队，不因为多个 Pool 独立判定而超卖。
- [ ] P0 的模板选择、MCP 注入与原生会话连续性零回归。

## 待确定
- 池级资源成本指标、默认最大池数量、静态或自动调整目标的运营策略、不同宿主节点的调度偏好及启停阈值。
