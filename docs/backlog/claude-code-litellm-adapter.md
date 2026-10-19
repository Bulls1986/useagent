# UA-BL-08｜Must-have Backlog：Claude Code × LiteLLM 模型适配（插件化，OpenCode/Codex 零回归）

> 状态：**Backlog / Deferred（暂不开发）**  
> 级别：**Must-have（后续必须实现）**  
> 登记日期：2026-10-19  
> 实施版本／排期／负责人：待后续规划  
> 本文档是需求与验收约束，不代表功能已实现或验证通过。

> 关联：[全部待办](./README.md) · [LiteLLM 动态模型目录](./litellm-dynamic-model-catalog.md) · [原生 Session 连续性](./native-claude-session-continuity.md)

## 目标

让 UseAgent 托管的**原生 Claude Code（CC）Runtime** 能通过 LiteLLM 的 **Anthropic Messages API** 使用第三方模型（首期基于现有 LiteLLM 模型目录验证 `glm-5.3-flash`；其他模型须经实际可用性确认），同时完整保留 Claude Code 原生 Agent Loop、工具调用、Skills、CLAUDE.md、工作区以及 Session Resume。

实现后，后续增加兼容模型应**主要靠配置**，而不是不断修改核心代码。

## 必须遵守的架构原则

1. **插件化而非霰弹式修改**：实现一个边界清晰的 `LiteLLM Model Provider Adapter`（或复用现有同级扩展机制），集中管理模型目录、模型映射、上游路由、凭证引用和兼容能力声明。不允许在多个核心模块散落 `if (model === "glm…")` 类的特判。
2. **Runtime 与模型提供商分离**：LiteLLM 是 Model Provider，不是新 Agent Runtime；不改写 Claude Code 的原生循环或协议驱动，不为 GLM 创建新的 Agent Engine。
3. **精确路由**：只对明确配置的 **Engine + Model + Adapter Profile** 启用新适配器。特别禁止通过全局修改 `ANTHROPIC_UPSTREAM_BASE_URL` 影响共享 Anthropic Provider 的其他引擎。
4. **关闭即无影响**：未配置或关闭新 Adapter 时，原有全部调用和可用模型保持不变。
5. **Fail closed**：模型、接口或凭证不兼容时应明确报错；不得静默切换上游或替换成另一个模型。
6. **安全不降级**：保留 User/Org/Thread/Run 绑定、沙箱隔离、模型授权与校验、租户密钥保护、计费归属和审计。密钥不得明文下发给沙箱。
7. **禁止过度设计**：本需求不要求插件商店、运行时动态加载器、全平台架构重构。

## P0：OpenCode 与 Codex 零回归

| 引擎 | 不得改变的现有行为 |
| --- | --- |
| **OpenCode** | 原有 Provider Gateway、模型目录及选择、上游、认证、Streaming、工具调用、Session Resume |
| **Codex** | 原有 LiteLLM/OpenAI Responses 通道、现有 GPT/Qwen 等模型配置、鉴权、Streaming、工具调用、Session Resume |
| **Claude Code 原生路径** | 未选择 LiteLLM Profile 时的 Anthropic 模型和认证行为 |
| **公共平台** | Sandbox/Session/Workspace 生命周期、授权与审计 |

**实施前先留存 OpenCode、Codex 的真实链路回归基线；实施后必须对照验证零回归。**

## 现有代码参考（实施时重新核查）

- `backend/src/engines/index.ts`：已有原生 Engine Registry，不能误把模型适配器放进 Runtime 注册表。
- `backend/src/runs/model-policy.ts`：目前 Claude 可用模型/默认模型硬编码；需要小范围的配置／Adapter 扩展点。
- `backend/src/provider-gateway/routes.ts`：已有 Anthropic Messages 路由及受控上游地址配置；需避免全局覆盖。
- `.tools/litellm-relay/relay.ts`：现有 allowlist 缺少 `/v1/messages`（以及可能的 `/v1/messages/count_tokens`）。
- `.tools/litellm-relay.compose.yaml`：当前部署配置未在 `ENABLED_ENGINES` 中启用 `claude`。
- 保持 `runtime-provider-bridge.ts` 和原生 T3 Claude Driver 的职责与会话生命周期不变。

## 验收标准（全部通过才能收口）

- [ ] CC 通过可配置的 LiteLLM Adapter 真实调用 `glm-5.3-flash`；UI 展示真实模型名，而不是把 GLM 伪装成 Claude。
- [ ] 验证 Anthropic Messages 的基本请求、SSE Streaming、Tool Use、多轮工具调用、Bash/文件编辑、Skills/CLAUDE.md。
- [ ] 验证 Session Resume 与沙箱持续性；正确恢复同一原生会话。
- [ ] 核实 Thinking、token counting、上下文窗口、取消和错误事件的兼容性，不具备的能力必须清楚暴露。
- [ ] 新 Adapter 只对显式授权的 CC 模型生效；OpenCode/Codex 的目的地、密钥、模型列表、模型行为不变。
- [ ] 多用户/租户隔离、Provider Gateway Token/Run 绑定、模型白名单及配额/计费归属通过回归检查。
- [ ] 插件关闭、无配置及上游失败均可验证旧行为不变或正确 fail closed。
- [ ] 增加第二个兼容模型主要通过配置完成，不再做新的核心代码特判。
- [ ] 相关单测、集成测试、OpenCode/Codex 原链路 E2E 回归全部通过。

## 范围明确排除

不重构全部 Agent Engine；不修改 Codex/OpenCode 的现有执行路径；不创建新的 Sandbox Provider；不重做 Session/Workspace；不扩展到通用插件管理平台。

**记录目的：未来必做，当前只做需求登记，不启动实现。**
