# UA-BL-07｜多用户、会话、Sandbox 与 Artifact 端到端隔离

| 字段 | 值 |
| --- | --- |
| 类型 | Must-have 安全与企业化验收 |
| 优先级 | Must-have |
| 状态 | Backlog：需完整真实多用户验证，缺口定位后小范围修复 |
| 关联 | [UA-BL-03 Artifact](./artifact-storage-s3-minio.md)、[UA-BL-04 Skills](./skills-package-management.md)、[UA-BL-02 Session](./native-claude-session-continuity.md) |

## 目标与已定边界
企业多人使用同一个 Web UseAgent，各自可以配置 Agent/模型并运行真实 CLI，同时必须保证：**不同员工、不同项目、不同会话之间的文件、工作区、执行环境、事件、凭证不可串用或越权读取**。即使组织内员工属于同一 Org，也不自动意味着互有访问权限。

架构已冻结为“每任务/会话独立完整原生 Agent Runtime + 独立 Sandbox”，不恢复“一个共享 Harness 进程里按线程切换文件系统”的早期设想。

## 方案范围
- 身份：User/Org/Project/Thread/Run/Sandbox 的明确授权映射；任何查询与控制动作以服务端身份核验。
- Sandbox：独立工作空间与进程隔离，限制文件、命令、网络和宿主资源访问；本地 Runner 也必须按权限绑定实例。
- 输入/输出：上传附件、原生工作区、Workpiece、Artifact、下载链接、签名 URL 的归属与访问控制。
- 实时：SSE/WebSocket、工具回执、日志、模型 Provider Token、Agent Session resume/steer/cancel 的权限。
- Skills：按用户/组织权限安装完整 Skill 包；跨租户不可读取其他人的 scripts/assets 和私有版本。
- 认证/计费：用户 BYO Key、组织密钥、Gateway Run/Thread Token 绑定及审计/额度归属必须一致。

## 不在范围
- 因“4000 员工”背景直接承诺 4000 并发 Agent 沙箱、重构多 Backend/全平台调度；容量需要独立性能验收计划。
- 新设计跨部门/项目 ACL 体系而不评估既有授权能力；不能先于证据宣称现有权限全部缺失。
- 替换目前原生 CLI 为自建 Agent Loop。

## 风险与注意
- **同 Org 的不同用户**是重点负例，不仅仅测试两个组织之间互相拒绝。
- 不只校验 UI：直接 API、猜 ID、URL 回放、错误 Token、Socket/SSE 重连都要测试。
- Sandbox 运行同一个 Template/镜像不意味着其工作目录或凭证可以共享。
- 错误日志、Skill 文件、模型上下文及下载重定向也可能泄露隐私或密钥。
- 强制隔离不应破坏明确授权的用户项目共享流程；如果涉及共享，需要单独权限定义。

## 验收标准
- [ ] 建立至少 A/B 两用户、同 Org/异 Org、不同 Project/Thread 的负例访问矩阵。
- [ ] Run/Session 控制、Sandbox 命令和工作区文件均不能跨用户/项目访问。
- [ ] Artifact、Workpiece、Skills、上传、SSE/WebSocket 日志与下载均不能越权。
- [ ] BYO/Org Provider Key 不泄露、不互借，审计和额度归属正确。
- [ ] 使用 CC/OpenCode/Codex 各完成至少一条真实用户隔离 E2E。
- [ ] 新授权检查不会破坏原有用户可用流程，性能与失败行为可诊断。

> 实施前先制作当前 API/资源授权矩阵：已具备的保持，缺少的只补边界，不做整平台权限重写。
