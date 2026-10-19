# UA-BL-05｜LiteLLM 动态模型发现、同步与可用性治理

| 字段 | 值 |
| --- | --- |
| 类型 | 后续功能 |
| 优先级 | Backlog / 排期待定 |
| 状态 | Backlog：现有静态名单不满足目标 |
| 关联 | [Claude Code × LiteLLM Adapter](./claude-code-litellm-adapter.md) |

## 背景
此前在部署 UseAgent 接入 `litellm-dev.jusda.int` 时，观察到可选模型列表偏少，需要手工修改 Compose 的模型白名单并重启。用户明确提出：**LiteLLM 应能动态读取、刷新和同步模型**，而不是让运维每次手工写入。

## 已确定的方案方向
- **模型目录发现与执行策略分离**：动态发现（LiteLLM 可提供什么）不等于自动授权（UseAgent 允许某 Engine/用户实际运行什么）。
- 优先使用 LiteLLM 的实际模型清单接口与可用性信息；按授权身份/Provider Profile 过滤，不把所有返回值直接暴露给所有用户。
- Engine、模型协议及能力分层映射：Claude Code 需要 Anthropic Messages 可用性；Codex 的现有 Responses API 链路保持不变；OpenCode 保持原有 Provider/模型选择。
- 动态缓存 + 显式/定时刷新 + 失效标记；下线、改名或鉴权失败必须在 UI 说明，不能仍创建不可运行 Run。
- 模型启用策略仍由平台授权/策略决定；支持默认模型和 allowlist/denylist 管理，**请求入口与 Worker 共用 fail-closed 校验**。

## 范围内
1. LiteLLM Model Provider Adapter 的模型发现/缓存/刷新和去重、失败回退到有过期标记的目录快照。
2. 前端可见、可选、可运行三个状态分离；缓存刷新显示同步时间/错误/降级。
3. 按 Engine 支持的协议、组织/用户权限、模型功能和默认模型策略过滤。
4. 后端创建/续聊以及真正模型请求均按同一绑定和策略再次校验；不让前端缓存成为安全依据。
5. 计费、额度、审计的模型真实身份准确，避免 `claude` 显示名实际调用另一模型。

## 不在范围
- 自动把发现到的所有第三方模型开放给任何用户。
- 修改 Codex/OpenCode 原有协议、网关鉴权、原生 Agent Loop。
- 将 LiteLLM 的 `/v1/models` 返回值视为完整的 Tool Use/Thinking/Token 兼容性认证。
- 本需求不包含通用模型市场或全平台模型调度重构。

## 注意点
- 现有 `CODEX_ALLOWED_MODELS` 是显式策略；改动态目录时需做到**兼容旧配置，不静默开放更多模型**。
- LiteLLM 可调用不意味着 CC 能稳定使用其 Agent 工具；与 [CC 专项](./claude-code-litellm-adapter.md) 的 Messages/Tool Use 验证联合。
- 缓存过期、模型被移除、用户授权撤销、正在运行的原生 Session 的持久绑定应采用清晰策略；不能让已创建 Run 的模型未经授权变更。
- 同一模型 id 在不同 Adapter/上游可能含义不同；UI 与审计必须保留 Profile 与真实上游身份。

## 验收标准
- [ ] 可从 LiteLLM 实时同步模型并受控更新目录，无需改核心代码添加新模型。
- [ ] 新增模型仅对有权限且协议/模型能力满足的 Engine/用户可选；下线模型不能创建新 Run。
- [ ] 异常时目录显式 stale/disabled，不泄露无权模型，不跳过模型授权。
- [ ] 默认模型切换、真实模型 ID、额度/计费、审计均正确。
- [ ] 使用当前环境的 Codex/OpenCode 模型作改造前后同一套真实回归，零行为变化。

> 待定：刷新 TTL、配置管理形式、租户级 Model Profile 和持久会话遇模型下线时的具体产品提示语。
