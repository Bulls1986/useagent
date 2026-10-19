# UseAgent Backlog

本目录存放已经讨论确认、但**暂不开发**的未来能力和未收口问题。这里的条目是规划与验收约束，不代表当前版本已经实现或测试通过。

| 文档 | 内容 | 当前状态 |
| --- | --- | --- |
| [历史待办汇总（2026-10）](./useagent-prior-open-items-2026-10.md) | 沙箱 Hooks、原生 CC Session 连续性、文件/制品与 S3/MinIO、Skills 完整包、LiteLLM 动态模型目录、CubeSandbox 兼容、用户隔离、Workpiece 失败、Local Runner 回收 | Backlog；缺陷项待复验 |
| [Claude Code × LiteLLM Adapter](./claude-code-litellm-adapter.md) | CC 使用 GLM 等非 Anthropic 模型；模型 Provider 插件化；确保 OpenCode/Codex 零回归 | **Must-have** / Backlog |

## 维护规则

- 仅录入明确确认的未来需求与已知待排查缺陷；不要把备选方案、尚未验真的猜测当作事实。
- 每项实施前以当前最新代码和真实部署复核；已实现的条目有证据即可标记完成，避免重复开发。
- 扩展必须优先基于已有插件/适配器接口，禁止霰弹式修改核心模块。
- OpenCode、Codex 的既有模型、路由、认证、工具调用、Streaming 和 Session 必须保持无回归。
- 不应将此目录视作立即执行计划；版本、负责人、里程碑在单独规划后确定。
