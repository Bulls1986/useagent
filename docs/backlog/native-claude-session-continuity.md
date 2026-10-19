# UA-BL-02｜Claude Code 原生 Session 连续性与恢复

| 字段 | 值 |
| --- | --- |
| 类型 | P0 端到端验证；发现问题再修复 |
| 优先级 | P0 验证门禁 |
| 状态 | Backlog：验证未形成完整闭环 |
| 关联 | [UA-BL-01 Hooks](./sandbox-lifecycle-hooks.md)、[UA-BUG-02 回收](./local-docker-runner-lifecycle.md)、[CC × LiteLLM](./claude-code-litellm-adapter.md) |

## 背景
用户担心 UseAgent 把上下文一次性传给 Claude Code，或者只保存 UI/Thread 历史，造成 CC 内部 **native Session** 不连续。UseAgent Thread、T3 Provider Session 和 Claude Code 原生 Session 是不同身份，不能混为一谈。

## 已确定的方向
- **原生 Session 优先**：一个会话的完整原生 Agent Runtime 运行在隔离 Sandbox 内，平台仅维护 Thread→Sandbox→Runtime→原生 Session 的持久映射和生命周期。
- 持续 Session 的同一 Runtime 应沿用原生 Session identity/上下文，通过 native resume/续聊机制交付新的用户输入；不把平台事件重放伪装成原生状态恢复。
- 保存 Provider、协议身份、runtime generation、auth epoch、sandbox/workspace 绑定等恢复校验信息；身份不匹配时安全拒绝或走明确的新会话路径，不能静默拼接。
- **沙箱已删除** 时，原生磁盘状态可能不可用，必须按实际恢复能力拒绝“完整恢复”的承诺。

## 范围内
1. 验证首次 Turn 创建的真实 native Session ID、后续 Turn 的关联和上下文连续。
2. 在同一 Session 内连续多轮工具调用、文件编辑，确认无需重复传全部历史才能正确理解上下文。
3. 验证 idle stop→resume、Backend 重启、网络瞬断后的恢复语义；分别观察工作区和原生 Session 状态。
4. 区分“沙箱还在”“数据卷保留但进程重启”“沙箱及数据已销毁”三种情况。
5. 验证不兼容的运行时更新、凭证变化、会话绑定变化应 fail closed。

## 不在范围
- 重新实现 CC 的记忆、上下文压缩、内部 Agent Loop。
- 把聊天数据库和 Artifact 重放等同于恢复原生 CLI 上下文。
- 擅自改变现有 Sandbox 回收期限或 Session 存储协议。

## 风险与注意
- 会话恢复正确性是 **Sandbox、Runtime 与 Provider Session** 的联动问题，不应先假设某一层有 Bug。
- 重新创建新容器不等于恢复旧 Runtime；保留文件系统也不必然保留所有进程内状态。
- 多用户隔离与身份/凭证升级必须优先于强行恢复。

## 验收标准
- [ ] 记录 Thread、Sandbox、T3 和 CC native Session 各自标识及映射证据。
- [ ] 同一沙箱至少连续多轮真实调用且保持原生 Session 身份和上下文。
- [ ] idle stop 后恢复、Backend 重启后续聊各有端到端证据。
- [ ] Session 身份/凭证不匹配与沙箱销毁时可正确失败，不静默跨 Session 恢复。
- [ ] Codex、OpenCode 各自原生 Session 行为不受影响。

> 后续先做证据收集与验证；只有定位到缺口，才进行最小范围修复。
