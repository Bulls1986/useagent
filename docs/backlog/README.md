# UseAgent Backlog｜全部待办总表

> **维护入口：本 README 是全部待办的唯一总表**。每项的已确定方案、范围、注意点、验收门禁放在各自的独立 Markdown 文档中；历史汇总仅保留讨论快照，不再作为维护入口。  
> 最后整理：**2026-10-19**；仓库：`Bulls1986/useagent`。  
> **本次只记录规划**：不修改业务代码、不调整运行配置、不启动开发。以下状态以当前讨论记录为基础，并非对最新部署的正式复验。

## 待办全量清单（10 项）

| ID | 类别 | 待办事项 / 详情文档 | 优先级 | 状态 | 当前下一步 |
| --- | --- | --- | --- | --- | --- |
| **UA-BL-01** | Sandbox | [Sandbox 生命周期 Hooks、启动/挂载/执行脚本](./sandbox-lifecycle-hooks.md) | 待排期 | Backlog | 冻结 Hook 接口与阶段，按 Local 先验证、Cube 后验证 |
| **UA-BL-02** | Native Runtime | [Claude Code 原生 Session 连续性与恢复](./native-claude-session-continuity.md) | **P0 验证** | 待端到端验证 | 实测 Thread→Sandbox→T3→CC 原生 Session 映射 |
| **UA-BL-03** | 文件 / Storage | [附件传入、制品导出及 S3/MinIO ArtifactStorage](./artifact-storage-s3-minio.md) | 企业化必需 / 待排期 | Backlog | 确认现有存储接口，完成 Local→S3/MinIO E2E |
| **UA-BL-04** | Skills | [完整 Skills 包管理、编辑/删除/版本及原生下发](./skills-package-management.md) | **Must-have** | Backlog | Registry→Sandbox 下发→Runtime 发现，分阶段收口 |
| **UA-BL-05** | Model | [LiteLLM 动态模型发现、同步与权限治理](./litellm-dynamic-model-catalog.md) | 待排期 | Backlog | 模型目录发现与执行授权解耦、模型更新可配置 |
| **UA-BL-06** | Sandbox Provider | [CubeSandbox 原生模板、实例生命周期与真实兼容验证](./cubesandbox-compatibility.md) | 后续兼容 | Backlog | 条件符合的 Linux/KVM 环境下验证；不影响当前 Local |
| **UA-BL-07** | 多用户安全 | [User/Org/Session/Sandbox/Artifact/Skill 隔离](./multi-user-isolation.md) | **Must-have** | 待安全 E2E | 构造同 Org/跨 Org 多用户越权验证矩阵 |
| **UA-BL-08** | Native Model Adapter | [Claude Code 通过 LiteLLM Anthropic Messages 使用 GLM 等模型](./claude-code-litellm-adapter.md) | **Must-have** | Backlog | 插件式 Model Provider Adapter，Codex/OpenCode 零回归 |
| **UA-BUG-01** | 性能 / MCP | [`workpiece_create` 失败频繁、重试拖慢任务](./workpiece-create-failures.md) | 待按复现评估 | **Open investigation** | 当前版本重放日志、复现分类与最小修复 |
| **UA-BUG-02** | Local Runner | [Docker Runner 闲置停止/恢复/删除/磁盘释放及真实执行闭环](./local-docker-runner-lifecycle.md) | 真实 E2E 优先 | **待复验** | 复测回收与历史 bwrap/Shell 问题，再定 GC/TTL |

**汇总**：8 项功能/能力与安全验收（UA-BL-01～08）+ 2 项待排查/复验的历史缺陷（UA-BUG-01～02）。全数均尚未在这份 Backlog 中标记完成；**不等于代码当前必然未实现**。实施前需用最新 Head、测试和部署证据重新判定。

## 已冻结的共同决策

- **原生 Agent Runtime**：每任务/会话在独立 Sandbox 运行完整 CLI Runtime；UseAgent 管理输入输出、调度、权限、事件、会话映射与生命周期；**不重写 Agent Loop**。
- **Local vs Cube**：Windows Local Docker Runner 是现阶段本地验证路线；CubeSandbox 是后续在适合宿主环境的真实兼容目标。不能静默回退 Daytona 或擅自切换当前沙箱。
- **插件化**：能用 Provider/Adapter/Storage/Skill Registry 扩展的，不做多处硬编码特判；不为了一个功能搭建通用插件市场。
- **非回归 P0**：OpenCode 和 Codex 的现有模型、上游路由、认证、Streaming、Tool Use 和 Session 必须保持稳定；CC 原生路径亦然。
- **安全与数据**：Tenant/User/Run/Thread/Sandbox 权限绑定、密钥保护、模型授权、Workpiece 与 Artifact 持久性不能降低。
- **明确的责任**：每份文档分别写“已确定方案 / 实施范围 / 排除项 / 注意点 / 验收”；**尚待确认**不是已冻结方案。未确定排期、负责人、版本时一律留空待规划。

## 状态与维护规则

| 状态 | 含义 |
| --- | --- |
| `Backlog` | 已记录的未来事项；不是已开发，也不意味着当前 Head 一定缺实现 |
| `待端到端验证` / `待安全 E2E` | 先收集当前真实链路证据；发现缺口才最小修复 |
| `Open investigation` / `待复验` | 存在历史报告，不承诺根因尚存；先复现/查证 |
| `In progress` | 后续明确启动实施后才调整 |
| `Done` | 完成代码/配置验收，有具体可追溯测试与部署证据才调整 |

1. **所有新增未收口事项先更新本表**，分配稳定 ID，随后新建一个同名详情 Markdown；不要只写到讨论快照或聊天。
2. 详情文档至少维护：目标与背景、已讨论的解决方案、范围与不做的事、重要注意点、验收清单、待确定内容和关联事项。
3. 开工前先确认最新状态与是否已有实现，保留基线测试；已实现就补证据而不是重新开发。
4. 每项独立验收，不能因为改动共享模块就顺带扩大范围；多功能依赖写在文档中，排期另议。
5. 任一功能影响 OpenCode/Codex 或不同用户权限时，必须有明确的真实链路非回归验证。

## 历史讨论参考（非维护入口）

- [2026-10 历史待办汇总（归档快照）](./useagent-prior-open-items-2026-10.md)：保留当时汇总表述以供追溯；请以上方独立详情文档为准。
