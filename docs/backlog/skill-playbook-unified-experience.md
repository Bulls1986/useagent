# UA-BL-09｜Skill / Playbook 用户概念统一与管理入口收口

| 字段 | 值 |
| --- | --- |
| 类型 | 产品体验与现有能力整合 |
| 优先级 | P1 |
| 状态 | Backlog（未启动开发） |
| 关联 | [UA-BL-04 完整 Skill 包管理](./skills-package-management.md)、[UA-BL-12 学习发布追溯](./learning-proposal-publish-traceability.md)、[UA-BL-07 隔离](./multi-user-isolation.md) |

## 目标与背景
- 对普通用户统一为一个“技能（Skills）”概念。当前 `kind=skill|playbook` 只是同一数据模型上的内容分类，管理字段、版本、`skills_list` / `skill_activate`、执行注入链路一致，不足以要求用户选择两种产品。
- 消除 `/skills` 与 `/playbooks` 分散管理造成的认知成本，同时补齐已有后台支持、前端却缺失的编辑/删除入口。

## 已确定的最小方案
- **只统一用户概念与界面，不立即删除底层 `kind`**。数据库、API、旧的 Revision、运行 Pin、Learning 提案兼容原值，历史 Playbook 无需数据迁移。
- `/skills` 的管理列表统一读取所有 `kind`（当前 `GET /api/skills?view=library` 不带 `kind` 可返回所有类型），列表/搜索/详情/创建、编辑、删除与版本展示走一套组件。可显示“来源/用途”但不迫使普通用户分类。
- 新建任务的 Skill 选择器统一显示为“技能（默认自动匹配，可手动指定）”，不按 Skill 与 Playbook 分组；旧 `/playbooks` URL 要有可预测的重定向或兼容落点，不破坏外部收藏链接。
- UI 编辑复用 `PATCH /api/skills/:id`，删除复用 `DELETE /api/skills/:id`；删除前确认对历史引用、正在运行与导入同步的影响，默认不得破坏正在使用的固定版本。
- 保留当前 Agent 发现/激活机制，改造重点是用户层；不因为界面合并就声称中文自动匹配已可靠（见 UA-BL-11）。

## 源码验证基线（2026-10-19，Fork 当前代码静态检查）
- `backend/src/db/schema/skills.ts`：共同表 `skills`/`skill_revisions` 和分类字段 `kind`。
- `backend/src/skills/routes.ts`、`backend/src/knowledge/gateway/skill-tools.ts`：共用 CRUD 和激活。
- `frontend/app/(library)/skills/skills-view.tsx`：现在只取 `kind=skill`；Playbooks 独立页面只取 `kind=playbook`。
- `frontend/app/(library)/skills/skill-detail-dialog.tsx`、`frontend/app/(library)/playbooks/playbook-detail.tsx`：管理操作入口不一致；已有后台删除 API，但缺用户入口。

## 不做的事
- 不重构 Agent Loop、沙箱调度、模型路由；不把 Playbook 变成 DAG / Workflow。
- 不在本项实现完整 `scripts/`、`references/`、`assets/` 包能力或原生 Runtime 下发（归 UA-BL-04）。
- 不移除 `kind`、不修改历史运行版本引用或已接受学习提案的记录。

## 风险与注意点
- 区分“现有文本型 Skill 编辑”与“完整原生 Skill 包编辑”；若来源 GitHub，需明确覆盖/Resync 冲突行为。
- 删除历史行可能级联 `skill_revisions`，必须先复核现有 Pin、运行回放与审计契约，避免仅加按钮导致引用损坏。
- `kind` 在 `learning/proposals.ts` 中还会被用来创建新的 `playbook`，因此不能简单删除枚举字段。

## 验收清单
- [ ] Skill 和 Playbook 历史记录在单一 Skills 列表完整出现；搜索、过滤、详情、创建、编辑、删除、版本和运行入口一致。
- [ ] 任务选择器不再要求用户理解两类概念；默认匹配和手动 Pin 均兼容旧数据。
- [ ] 旧 `/playbooks` 链接可用；旧 API/数据/运行记录及当前 Session 不回归。
- [ ] 编辑/删除对跨 Org、非授权用户、历史 Pin 和 GitHub 导入的安全/一致性测试通过。
- [ ] OpenCode / Codex / Claude 原生通路对选中技能的激活行为无回归。

> 待确认：导入来源编辑/删除的交互规则与历史 Revision 删除保护范围；排期、负责人、版本尚未指定。
