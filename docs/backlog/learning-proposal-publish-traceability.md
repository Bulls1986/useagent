# UA-BL-12｜Learning 提案组装、两级审核发布与成果追溯闭环

| 字段 | 值 |
| --- | --- |
| 类型 | Learning 产物质量 / 审核体验 / 可靠性 |
| 优先级 | P1 |
| 状态 | Backlog（未启动开发） |
| 关联 | [UA-BL-10 证据](./learning-evidence-quality.md)、[UA-BL-11 聚类](./learning-multilingual-clustering.md)、[UA-BL-09 技能统一入口](./skill-playbook-unified-experience.md)、[UA-BL-04 完整原生 Skill 包](./skills-package-management.md) |

## 目标与现有流程
- 保留现有两级人工审核：Run → Knowledge Draft → 管理员 Accept 后落 `knowledge_records` (`kind=learning`) → 达到重复已接受记录条件时形成 `skill_revision_proposals` → 管理员第二次 Accept 才创建 Playbook v1 或更新已有 Skill Revision。
- 用户能明确看到每次 Accept 生成了什么、在哪里、来源于哪些任务，能够确认异常/失败与版本变更。

## 当前代码已确认的差距（2026-10-19）
- `frontend/app/(library)/learnings/learnings-api.ts` 的 `post()` 在 HTTP 2xx 时直接 `return`，丢弃后端返回的 `record_id`、`proposal_id`、`skill_id`、`version`；Learnings 卡片无法直达产物。
- `learning/proposals.ts` 接受知识后调用 `maybeProposeSkillRevision` 是 best-effort：失败只打日志，已 Accepted 的草稿不会自动回滚，可能遗失生成 Skill Proposal 的机会。
- `learning/similarity.ts` 的 `assembleSkillProposal()` 依赖步骤序列的多数对齐；无有效公共步骤则生成“搜索组织知识”的泛化兜底步骤；这不应被误认为已验证可执行 Skill。
- 仅对 `proposed` 状态的 `(org, name)` 去重；已接受同类历史提案可能再次出现，需审核合理的变更和重复建议。
- `frontend/app/(library)/knowledge/knowledge-data.ts` 的 `RecordKind` / `kindChipColor` 只列 `qa/reference/policy/definition/decision/outcome`，未列后端写入的 `learning`，需要确认知识列表展示与容错。

## 分阶段实施范围
- **M1 审核发布回执**：Knowledge Draft Accept 后展示“已保存到知识库”及记录链接；Skill Proposal Accept 后展示“已创建技能 v1 / 已更新技能 vN”及统一 Skills 详情链接；历史 Accepted 卡片根据已存 `accepted_record_id`、`resolved_skill_id`、`resolved_version` 能跳转。
- **M2 提案内容可信度**：从相似任务的标准化执行轨迹生成主干，保留重复步骤、必要验证/错误处理、来源 Run 与草稿引用；区分公共流程和仅单次出现的建议。无可靠主干的候选降级成待完善草稿或不推荐发布，而非冒充可执行 SOP。是否引入可选 LLM 提炼须单独评估/仍受人工审核。
- **M3 发布可靠性与审计**：将知识 Accept 后的聚类生成失败转为可观察、可重试的持久事件或等效机制；处理重复提交、并发 Accept 和生成技能写入后回执失败的部分提交；保持幂等、组织权限和来源证据；审核时显示变更 Diff/目标 Skill 版本。
- **M4 知识展示适配**：正式支持 `kind=learning` 的显示、过滤与检索，历史知识记录不丢失；统一 Skills UI 仅由 UA-BL-09 负责。

## 范围外
- 不取消两次管理员 Accept、不自动将学习内容发布为可执行技能。
- 不在本项实现 `scripts/`/`references/`/`assets/` 的安装、包管理或 Agent Native Discovery（归 UA-BL-04）。
- 不修改 Agent Loop、替换现有 Learning Outbox 或构建复杂通用 Workflow。

## 重要注意点
- 现有 `kind=playbook` 只是在统一 skills substrate 的分类；若命中同名现有 Skill，接受后只更新原种类的 Revision（参见 `applyProposal`）。
- 审核页面信息应区分“知识草稿已发布”和“技能提案已发布”，避免用户误以为第一层 Accept 就生成 Playbook。
- 学习提案未完成的错误不能被一个已接受状态掩盖；异常恢复须保留完整 Audit 和安全边界。

## 验收清单
- [ ] 接受单个知识草稿后可定位实际 `knowledge_records` 条目，清楚显示仍未生成 Skill Proposal 或新建提案链接。
- [ ] 连续三条相似已接受草稿会生成可解释的 Skill Proposal；中文相似匹配依赖 UA-BL-11；不够相似不误生成。
- [ ] Skill Proposal 第二次 Accept 返回可点击的目标 Skill/版本；既有同名技能更新与新增 Playbook 路径均可核对。
- [ ] 验证公共步骤对齐、无步骤兜底、不完整证据与历史 Trace 兼容；低质量 SOP 不被误标为直接可用。
- [ ] 失败可重试、回执一致、重复/并发/恢复幂等，且多 Org / 非管理员不得发布。
- [ ] `/knowledge` 页面能安全展示 `kind=learning`；历史接受记录和来源 Run 可追溯。

> 待确认：Review UI 对低质量提案的状态模型、发布后变更 Diff 展示方式、聚类失败补偿的具体事务/Outbox 设计。
