# UseAgent Backlog｜全部待办总表

> **维护入口：本 README 是全部待办的唯一总表**。每项的已确定方案、范围、注意点、验收门禁放在各自的独立 Markdown 文档中；历史汇总仅保留讨论快照，不再作为维护入口。  
> 最后整理：**2026-10-21**；仓库：`Bulls1986/useagent`。  
> **本次只记录规划**：不修改业务代码、不调整运行配置、不启动开发。以下状态以当前讨论记录为基础，并非对最新部署的正式复验。

## 待办全量清单（22 项）

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
| **UA-BL-09** | Skills UX | [Skill / Playbook 统一入口与管理操作收口](./skill-playbook-unified-experience.md) | **P1** | Backlog | 保留底层 kind，合并用户概念、统一编辑/删除/选择入口 |
| **UA-BL-10** | Learning 正确性 | [候选识别、成功证据与操作步骤提取质量](./learning-evidence-quality.md) | **P1** | Backlog | 审核真实验证证据、Step/Artifact 判定与失败/裁剪边界 |
| **UA-BL-11** | Learning 发现 | [多语言相似任务聚类与中文技能匹配](./learning-multilingual-clustering.md) | **P1** | Backlog | 中文/混合语义匹配基线，降低误合并与漏召回 |
| **UA-BL-12** | Learning 审核发布 | [提案组装、双级审核、产物追溯与可靠发布](./learning-proposal-publish-traceability.md) | **P1** | Backlog | 提升提案质量，修复丢失回执、失败补偿和来源追溯 |
| **UA-BL-13** | 企业 AI 门户 / Work | [LibreChat Chat + UseAgent Work/Cowork 增量集成主线](./enterprise-portal-work-mode-integration.md) | **产品主线 / 待排期** | Backlog | 先验证 Work 单独闭环及两侧身份集成边界，分阶段接入门户 |
| **UA-BL-14** | MCP / Runtime | [MCP Management V1：Streamable HTTP、stdio 与 Session 绑定](./mcp-management-v1.md) | **P0 / Must-have** | Backlog | 原生 Runtime 配置适配、网络/预装 stdio E2E；无中央工具代理 |
| **UA-BL-15** | Sandbox Operations | [Cube 资源观测、实例管理与安全 Force Kill（OPS-01）](./sandbox-operations-console.md) | **P0** | Backlog | Cube 实例归属与容量口径、正常 Release/Force Kill 一致性 |
| **UA-BL-16** | Sandbox Templates | [模板在线定义、构建、验证、发布与回滚（OPS-02）](./sandbox-template-lifecycle.md) | **P0** | Backlog | 复用 Cube 原生 Template/OCI，Session 持久化真实模板 ID |
| **UA-BL-17** | Sandbox Policies | [按组织、Group/角色、用户分配模板与配额（OPS-03）](./template-assignment-policy.md) | **P0** | Backlog | 确定权限/默认决议与历史 Session 固定绑定，不复用登录角色冒充业务角色 |
| **UA-BL-18** | Sandbox Capacity | [多模板 Warm Pool 和容量管理（OPS-04）](./multi-template-warm-pool.md) | **P1** | Backlog | 以独立模板/规格分池，不阻塞 P0 管理台与 MCP |
| **UA-BUG-01** | 性能 / MCP | [`workpiece_create` 失败频繁、重试拖慢任务](./workpiece-create-failures.md) | 待按复现评估 | **Open investigation** | 当前版本重放日志、复现分类与最小修复 |
| **UA-BUG-02** | Local Runner | [Docker Runner 闲置停止/恢复/删除/磁盘释放及真实执行闭环](./local-docker-runner-lifecycle.md) | 真实 E2E 优先 | **待复验** | 复测回收与历史 bwrap/Shell 问题，再定 GC/TTL |
| **UA-BUG-03** | Run / Repository | [GitHub URL 错误提升为持久仓库，失败 Run 阻塞会话恢复](./github-repo-url-promotion-run-recovery.md) | **P0** | **Open investigation** | 排查隐式 URL→repos 持久化路径，修正 Admission 与失败后新消息交付 |
| **UA-BUG-04** | Run 启动性能 | [每次 Run 前置准备耗时偏长：先诊断，后定方案](./run-preparation-performance-diagnosis.md) | 待数据评估 | **Open investigation / 待数据** | 收集同一 Session 连续 Run 的 timing 与日志，定位可复现的主要耗时环节；不预设优化方案 |

**汇总**：18 项功能/能力与安全验收（UA-BL-01～18）+ 4 项待排查/复验的缺陷（UA-BUG-01～04）。全数均尚未在这份 Backlog 中标记完成；**不等于代码当前必然未实现**。实施前需用最新 Head、测试和部署证据重新判定。

## 产品集成主线（2026-10-19）

**[UA-BL-13：企业 AI 门户增量 Work / Cowork 模式](./enterprise-portal-work-mode-integration.md)**：已有 **LibreChat 继续承担 Chat**，**UseAgent 原生 CLI Runtime 作为 Work 执行底座**。先让 UseAgent Work 单独可用，逐步实现统一身份/入口、Chat → Work 显式任务交接，再考虑进度/成果回流与 UI 融合。以低改造量、原生 Agent Session/沙箱隔离和企业权限治理为边界；内部能力缺口复用 UA-BL-01～12 与 UA-BUG-01～03，不另造相同待办。本轮只登记目标和实施阶段，不启动代码开发。

## MCP 与 Sandbox Operations 主线（2026-10-19）

- **[UA-BL-14 MCP Management V1](./mcp-management-v1.md)**：组织/用户注册与授权，Session 选择和配置绑定；支持远程 Streamable HTTP 和模板**预装**的 stdio，Runtime（Claude/Codex/OpenCode）原生执行，首期不做用户任意命令动态安装或中央 MCP Client。
- **[UA-BL-15 OPS-01](./sandbox-operations-console.md)**：运维实时识别 Cube 状态、节点容量、实例归属、预热池与排队；支持 Pause/Resume、正常 Release、受控 Force Kill，并与 Thread/Run/lease 事务和审计协调。实例配置 CPU/内存、可分配额度、预留资源与实时使用量必须区别显示。
- **[UA-BL-16 OPS-02](./sandbox-template-lifecycle.md)**：Infrastructure 在线模板目录、Draft/Build/Validate/Publish/Rollback；实际构建委托 Cube 原生模板/OCI 能力；发布版本固定真实 Template ID，Alias 更新只作用于新建实例。
- **[UA-BL-17 OPS-03](./template-assignment-policy.md)**：组织/Group/业务角色/用户的模板目录授权、默认选择与资源档位；不把账号 owner/admin/member 直接当业务角色；Session 固定所选模板与版本。
- **[UA-BL-18 OPS-04](./multi-template-warm-pool.md)**：不同模板/版本的预热池和容量调度，定为 **P1 后续**，不作为 P0 MCP 和运维闭环的前置条件。
- **与旧项关系**：UA-BL-06 专注 Cube Provider 的真实兼容 E2E 与生命周期语义，UA-BL-01 管 Hooks，UA-BL-07 管跨用户/组织安全隔离；本系列管理功能**关联复用**旧项，而不是重造它们。仅登记规划，不修改现有 Local/Daytona/Cube 部署或开始开发。

## 本轮新增系列任务（2026-10-19）

UA-BL-09～12 为同一系列的分项待办：用户侧统一 Skill/Playbook → 学习候选/证据正确性 → 中文及混合语义匹配 → 技能提案组装/两级人工审核/发布可追溯。**完整 Skill 包管理与原生 Runtime 下发继续由既有 UA-BL-04 负责**，不得重复实施。各项可分开验收，实施顺序与排期在启动前依据最新代码和真实测试确认。本次只记录 Backlog，不启动开发。

## 已冻结的共同决策

- **企业门户定位**：LibreChat = Chat，UseAgent = Work/Cowork 增量执行模式；统一入口与企业身份，保留双方自身会话/执行边界，不强制重建门户。
- **原生 Agent Runtime**：每任务/会话在独立 Sandbox 运行完整 CLI Runtime；UseAgent 管理输入输出、调度、权限、事件、会话映射与生命周期；**不重写 Agent Loop**。
- **Local vs Cube**：Windows Local Docker Runner 是现阶段本地验证路线；CubeSandbox 是后续在适合宿主环境的真实兼容目标。不能静默回退 Daytona 或擅自切换当前沙箱。
- **沙箱运维治理**：Cube 执行资源调度、虚拟机与原生模板；UseAgent Operations 负责身份/实例归属、资源口径、安全处置、模板版本发布与 Session 授权策略；强制终止必须维护运行/会话/lease/审计一致性。
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
