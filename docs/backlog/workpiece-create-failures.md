# UA-BUG-01｜`workpiece_create` 频繁失败及任务耗时

| 字段 | 值 |
| --- | --- |
| 类型 | 历史异常：排障与最小修复 |
| 优先级 | 影响真实任务效率，待按复现情况评估 |
| 状态 | Open investigation；未确认为当前 Head 仍然发生 |
| 关联 | [UA-BL-03 Artifact](./artifact-storage-s3-minio.md) |

## 发生过的问题
部分真实 UseAgent 任务里出现大量 `workpiece_create`/ `create_workpiece` 错误，拉长运行时间；历史分析中曾抽样描述“两任务约 76 分钟、约 45 次失败”，**仅作为线索，不是经过逐条日志归因的最终统计**。必须重新以最新代码及实际 Run 数据核对。

## 已确认的业务用途
- `workpiece_create` 是运行时向 Agent 暴露的 **UseAgent MCP 工具**，不是进入沙箱的一个文件；Agent 在工具发现后主动调用，Gateway/Backend 进行校验与存储。
- Workpiece 承担结构化可编辑成果、版本、事件、导出与 Finished Work 等后续作用，**不得为了降低错误量直接删除或绕过此能力**。
- “哪个阶段传给沙箱”应区分 **工具 schema 在 Runtime/Session 可用时暴露**，和 **真正的 create 操作由 Agent 发起时才调用**，并记录可复核的时序。

## 已讨论的排查和改进方案
1. 按 Run 和 MCP 工具名收集脱敏日志，分类为 schema/必填字段/类型、payload 体积、引用/URL/图片 Artifact、状态版本冲突、超时/上游失败。
2. 对比 MCP `tools/list` 暴露的 schema、实际工具参数与后端校验，避免 Agent 反复尝试但错误无法自修。
3. 核实历史曾触及的 **1 MiB / 1,000,000 byte 限制**（两个阈值单位不可混写）、State/Payload 限制和图像引用协议；不要未经当前代码检验便写成唯一根因。
4. 形成**字段级、可操作的校验反馈**，并检查一次失败重试带来的延迟占比。
5. 最小范围修改 MCP Schema/校验反馈/图片 Artifact 导出契约，保留 Workpiece 结构、版本、Finished Work 消费链路。
6. 对已有公共上游仓库相同 Issue/实现可作背景对照，但不能直接推断本地 Fork 错误根因。

## 范围外
- 为排障禁用全局 `workpiece_create`、删除 Workpiece 或 Finished Work 概念。
- 未有证据就责怪 Local 存储、Docker Sandbox 或模型本身。
- 重构全部 MCP、Artifact、Agent 工具集合。

## 注意点
- 每个失败必须关联**真实 Run、调用、参数摘要、HTTP/MCP 状态和实际耗时**，脱敏不能泄漏用户文件和密钥。
- 不将“减少失败次数”视为充分验收：需证实成果仍可编辑、持久化与导出。
- 测试应包含图片、文本、较大状态内容、参数缺失、版本冲突和重复提交。

## 验收标准
- [ ] 最新版本可复现的失败样本，按主因归类且能够量化每类重试时间。
- [ ] 具备正确 schema/限额/引用契约，并返回 Agent 可依据修正的字段级错误。
- [ ] 正常 Workpiece 创建、更新、版本事件、导出和 Finished Work 无回归。
- [ ] 以修复前后同一任务/压力样例对比失败数、重试次数与总耗时。
- [ ] 明确当前未复现的历史子问题，并保留证据而不凭猜测关单。

> 当前为**待复验/后续处理的缺陷调查**，不是已经证明的根因或已完成修复。
