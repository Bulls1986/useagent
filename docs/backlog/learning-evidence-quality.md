# UA-BL-10｜Learning 候选识别、成功证据与步骤提取正确性

| 字段 | 值 |
| --- | --- |
| 类型 | Learning 正确性 / 可靠性 |
| 优先级 | P1 |
| 状态 | Backlog（先复核与验收，未启动开发） |
| 关联 | [UA-BL-11 多语言聚类](./learning-multilingual-clustering.md)、[UA-BL-12 提案发布闭环](./learning-proposal-publish-traceability.md) |

## 目标与背景
- 确保“任务 completed → 学习意图 → 可信 Knowledge Draft”之间的门禁基于可核验结果，避免把不可靠的执行轨迹包装成成功 SOP。
- 保留现有 `finalizeRun` 事务内 Learning Outbox、Worker 重试、人工审核和审计证据链，不重建一套学习引擎。

## 当前源码基线（2026-10-19）
- `backend/src/runs/finalize.ts`：非内部、已完成的 Run 才在同一事务写 `learning_outbox`。
- `backend/src/learning/learning-outbox.ts`：默认 15s Tick、批量 20、最大 6 次尝试、指数退避、重启修复 stranded processing；`done` 也可能表示正常跳过。
- `backend/src/learning/salience.ts`：`artifactCount >= 1` 或 `stepCount >= 10 && distinctStepKinds >= 2`；当前计数包含全部步骤类型，Artifact 查询未细分发布状态。
- `backend/src/learning/classify.ts`：验证依赖 Artifact、识别到验证步骤或用户接受信号；实际 `drafts.ts` 调用处 `userAccepted: false`；分类为 `playbook_proposal` 仍先落普通 Knowledge Draft。
- `backend/src/learning/procedure-v2.ts`：从 step `codeJson` 推导工具/操作；缺显式失败标记常默认成功；`hasVerificationStep` 靠命令关键词；最多保留开头 60 个非 done 步骤，尾部验收证据可能被截掉。

## 已明确的改造方向
- **证据门禁**：区分 Run 停止、真实完成、验证通过；检查 Artifact 可用/完成状态和真正的测试结果/终态，不将工具名包含 `test|verify|publish` 直接等同业务成功。缺可靠证据时保守待审核或不生成。
- **步骤提取**：校验真实成功/失败/撤销/未知状态；保留重复顺序、必要的最终验证/发布/清理步骤和其来源事件，已失败或撤回步骤作为 Advice，而非可执行主流程。
- **候选语义**：澄清 `personal_memory`、`knowledge_draft`、`playbook_proposal` 分类在实际代码中如何落地；如暂不分流则以准确展示标记与后续处理规则为目标，不伪称直接生成 Skill。
- **调试证据**：每个入队 Run 可说明“触发/跳过原因、使用的证据、重试或 dead 原因”，让 `done without draft` 可解释。

## 范围外
- 不在这里更换中文聚类/检索（UA-BL-11）；不改变人工 Accept 为自动发布；不替换完整 Agent Runtime。
- 不默认引入 LLM 为每一次 Run 做评价，避免额外成本/延迟和新的不可解释性；如需模型评价须另行比选与验收。

## 必须注意
- 不可因增加验证而让已完成业务 Run 失败；学习路径仍异步、可重试、与主任务结果解耦。
- 需对旧 `knowledge_drafts.evidence` JSON 字段兼容，避免已有审批记录或步骤丢失。
- 所有自动认定的 verified / passed 状态应有可追溯的执行事件与测试断言，不依赖模型臆断。

## 验收清单
- [ ] 任务失败、取消、internal Run 不生成学习意图；成功非内部 Run 的 Outbox 与终态提交具备原子性和幂等性。
- [ ] 有/无 Artifact、失败测试、成功测试、仅包含关键词、纯长对话、真实发布等边界样本按预期生成或跳过，原因可诊断。
- [ ] 真实执行轨迹中失败和撤销步骤不会混入可执行 SOP，尾部 Verify/Publish 证据不被静默裁剪。
- [ ] 提取与分类可解释且按中文/英文指令及 OpenCode/Codex/Claude 事件样本回归验证。
- [ ] Outbox 重试、dead letter、boot recovery 与多实例安全无回归。

> 待确认：各 Native Runtime 稳定可用的验证证据字段、Artifact 的“已发布/可用”权威口径与后续人工验收信号接口。
