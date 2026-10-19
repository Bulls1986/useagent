# UA-BL-14｜MCP Management V1：HTTP / stdio 与按会话下发

| 字段 | 值 |
| --- | --- |
| 类型 | 原生 Runtime 外部工具接入 |
| 优先级 | P0 / Must-have，排期待定 |
| 状态 | Backlog（方案记录，尚未开发或真实 E2E 验收） |
| 关联 | [UA-BL-16 模板在线发布](./sandbox-template-lifecycle.md)、[UA-BL-17 模板授权](./template-assignment-policy.md)、[UA-BL-02 原生 Session](./native-claude-session-continuity.md)、[UA-BL-07 多用户隔离](./multi-user-isolation.md) |

## 目标与现状
- 在 Plugins 下提供 MCP Servers 管理；组织管理员登记、授权，用户从可用清单中为 **Session** 选择 MCP。后端记录不可变的有效配置版本，运行前下发对应沙箱。
- UseAgent 已有内置 Knowledge MCP Gateway、CLI stdio MCP Server，以及 OpenCode/Codex/Claude 的受控原生配置注入链路；这些**不等于**支持用户自行登记第三方 MCP。
- 现有 `frontend/app/(library)/agent/plugins/plugins-panel.tsx` 仅显示连接状态与 Secrets；不具备 MCP Server CRUD/授权/工具浏览。
- 原生 Agent Runtime 自己承担 MCP Client、tools/list 和 tools/call；**不重建 Agent Loop、不在 UseAgent 中重复实现第三方 MCP 工具执行器**。

## 已确定方案
1. **网络型**：V1 支持 Streamable HTTP(S)；平台保存 Server URL、传输类型、Header Secret 引用、可见范围、启用状态；运行时下发授权后的原生配置。旧式 HTTP+SSE 根据锁定版本的真实兼容验证决定是否兼容，不宣称天然等价。
2. **stdio 型**：V1 支持**运维批准、模板预装**的可执行程序；登记可执行路径、固定版本/依赖契约、参数、工作目录、环境变量名及 Secret 引用。会话下发启动配置，由 **沙箱内原生 Runtime** 启动子进程；UseAgent 不直接代理 stdio 协议。
3. **层级**：组织目录/权限 → 用户默认选择 → Session 有效 MCP 清单；Session 固定 server ID + 版本 + resolved config revision；每个新 Run 可刷新短期授权凭证，不无声修改已运行会话。
4. **Runtime 适配**：集中定义 MCP 配置 resolver，再分别转换 Claude Code、Codex（含订阅/本地登录路径）、OpenCode，以及经验证支持的 Pi 原生配置。保持 UseAgent 内置 Gateway 条目和原生 Session ID，不允许第三方 Server 同名覆盖受信任工具。
5. **模板依赖**：stdio MCP 的版本与二进制兼容性通过 UA-BL-16 的模板检验确认；同一模板可以预装多个 Server，不因 Session 所选组合生成指数级模板。
6. **连接检测**：登记时检测 URL/命令及 Runtime 可识别性；区分「配置已写入」「进程可启动」「原生 Runtime 完成连接与工具发现」，不把静态单测当 E2E。

## 本期范围与明确不做
- **包含**：Server CRUD、可见性/组织和用户权限、启用/禁用、受控 Secret 引用、HTTP/stdio、绑定与恢复、连接测试和工具清单、原生 Runtime 配置兼容门禁。
- **不包含**：任意 `npx -y` / `uvx` 在任务启动时下载、任意 shell 命令授权、通用插件市场、中心化第三方 MCP 工具执行代理；MCP OAuth 登录与令牌刷新列为后续扩展，V1 仅允许已批准的凭证/服务连接方式。

## 风险与注意点
- 防止 SSRF、内网横向访问、恶意 stdio 程序、运行环境变量泄露、Secret 出现在模型上下文或日志；长期凭证原则上保留可信侧，确需交给第三方 MCP 进程时必须按连接信任级别显式批准并限制权限。
- OpenCode 当前配置合并逻辑在 `backend/src/engines/opencode-sandbox-config.ts`；需要按实际锁定版本验证 `mcp` 的配置结构，不能只依据文档/单测假设成功。
- Claude/Codex 多路径存在重写原生配置的代码；扩展必须保留内置 Gateway、模型认证、用户已有受支持的设置与 Session 连续性。
- 已有会话配置变化的生效策略必须显式可见；不支持热加载时，不得静默重启原生 Agent 或删除保留沙箱。

## 验收标准
- [ ] 管理员能注册 HTTP 与预装 stdio Server、编辑/禁用、设置组织授权；普通用户只能选择有权使用的 Server。
- [ ] Claude Code、OpenCode、Codex 逐项实测 HTTP 和 stdio `tools/list`/`tools/call`；Pi 按明确支持矩阵验收，不将未经验证项判通过。
- [ ] 不同 Session 的选择相互隔离；同 Session 多轮继续与沙箱恢复时保持配置、原生 Session 与工作区连续性。
- [ ] 不可用、缺依赖、授权被撤回、远端超时均有确定错误；拒绝越权、重名覆盖与 Secret 泄露。
- [ ] 内置 UseAgent MCP、现有 Codex/OpenCode/Claude 模型与认证、工具事件与会话恢复零回归。

## 待确定
- 精确存储表与权限 API、原生客户端版本兼容矩阵、网络准入白名单/代理规则、个人 OAuth 扩展时机、配置热更新边界。
