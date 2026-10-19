# UA-BL-16｜Sandbox Template 在线定义、构建、发布和回滚

| 字段 | 值 |
| --- | --- |
| 类型 | 运维模板管理，OPS-02 |
| 优先级 | P0，排期待定 |
| 状态 | Backlog（已讨论设计，尚未实施） |
| 关联 | [UA-BL-06 Cube 原生模板兼容](./cubesandbox-compatibility.md)、[UA-BL-15 沙箱运维](./sandbox-operations-console.md)、[UA-BL-17 角色模板策略](./template-assignment-policy.md)、[UA-BL-14 MCP](./mcp-management-v1.md) |

## 目标和架构决策
让运维在 Infrastructure → Sandbox Templates 在线登记、编辑模板定义、发起构建、查看日志、运行兼容验证、发布或回滚；不再把修改 `CUBE_TEMPLATE_ID` / 登录宿主机手工构建作为长期唯一手段。

**Cube 负责模板/OCI 真实构建和实例执行；UseAgent 负责模板目录、来源引用、草稿/发布状态、授权、版本绑定和 Runtime/MCP 合规验证**。沿用 Cube 原生 Template/Template Alias、ID、构建/版本语义，不引入 UseAgent 自造的镜像 DSL；页面承载原生配置或 OCI 来源，并逐项验证 Cube 当前部署支持的 API，不臆造可调用接口。

当前 `packages/sandbox-cube/src/plugin.ts` 读取 `CUBE_TEMPLATE_ID`；`backend/src/sandboxes/provider.ts` 与 `backend/src/sandboxes/binding.ts` 解析平台或用户 Snapshot；`backend/src/engines/sandbox-provision.ts` 验证模板并创建实例；`backend/src/sandboxes/native-image.ts` 已具备构建原生环境镜像的配方。这些可复用，但还没有模板目录/在线发布产品链路。

## 交付范围
1. 模板目录：按 Provider 同步/登记原生模板 ID 与 Alias、版本、状态、构建来源、架构/Runtime 标签、默认选择、停用状态；不在 UseAgent 复制每个底层模板内部对象。
2. 在线编辑：**Draft → Build → Validate → Publish → Retire/Rollback**；Draft 包含受控 OCI 镜像来源、需要的 CLI Runtime、依赖、安装/初始化声明、MCP 能力要求与受控环境变量。V1 先以 Cube 已支持的原生构建能力与审查过的镜像源为界。
3. 构建任务：异步构建作业由 Cube/既有镜像 CI 实际执行，UseAgent 跟踪任务 ID、状态、日志与失败原因；不得在 Web 请求里同步等待整个镜像构建。
4. 验证：发布前在新模板启动测试沙箱，检查 Sandbox Provider layout、身份、必要二进制版本、原生 Claude/Codex/OpenCode/Pi 的受支持组合、stdio MCP 依赖、工作区、启动时长、基本工具与恢复能力；保留可追溯结果。
5. 发布和回滚：仅验证通过的不可变真实 Template ID 才可发布；更新稳定 Alias/default 指针只影响**新创建**实例。保留历史版本以恢复已有 Session；禁止在用户不知情时删改仍被绑定的真实模板。
6. 模板映射：被授权角色或用户的默认模板由 UA-BL-17 独立策略解析；模板自身不内嵌业务角色 ACL。
7. 兼容范围：初期优先 Cube；Daytona/Box/Local 的 template 能力单独做支持矩阵，不为了统一 UI 假装所有 Provider 都支持在线构建/快照。

## 非范围
- 不在 UseAgent 自建完整 Docker 镜像构建、镜像仓库、虚拟化调度或私有 Template DSL。
- 不每次开启 MCP 时自动重建模板、不为每种 MCP 选择组合新建模板。
- 不在本任务同时开发多模板预热池与自动容量调度（UA-BL-18）。

## 安全与连续性
- Template ID 与 Alias 分别记录：Session 创建时持久化**解析后的真实 Template ID + 版本/代际**，不能只保存可变 Alias。
- 已启动 Session 继续复用绑定的运行沙箱；丢失沙箱时优先按固定真实 ID 恢复；版本已退役时需显式处理/迁移，不能静默改用默认版本。
- 构建和初始化声明属于高权限代码；限制可信镜像源、安装脚本审批、Secret 只读引用、构建日志脱敏、构建试验沙箱资源限额和超时。
- 当前宿主正在进行的 Local 运行、Cube KVM 支持性与现存原生 Session 均不得受模板发布操作影响。

## 验收
- [ ] 管理员从界面导入、查看 Cube 现有模板，并创建 Draft、构建、查看状态/日志、验证、发布、回滚。
- [ ] 失败构建/失败验证不可发布；有审计、失败重试及清晰原因，模板状态与 Cube 实况一致。
- [ ] 已有 Session 的真实模板绑定和工作区不随 Alias 指针改变；新 Session 使用发布版本。
- [ ] stdio MCP 可执行程序及版本探针校验；不存在依赖时明确报错，不运行任意动态安装。
- [ ] 各 Runtime 的原生会话连续性和 Local/Box/Daytona 现有配置不回归。

## 待确定
- 当前部署 Cube Template API/OCI 构建能力与认证版本；在线编辑声明允许的安装语法、构建源和发布审批；默认模板与历史引用的保留期限。
