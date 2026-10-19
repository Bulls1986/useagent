# UA-BL-17｜组织/角色/用户模板分配与授权策略

| 字段 | 值 |
| --- | --- |
| 类型 | Sandbox 策略与权限，OPS-03 |
| 优先级 | P0，排期待定 |
| 状态 | Backlog（设计约束已讨论，尚未开发） |
| 关联 | [UA-BL-16 模板发布](./sandbox-template-lifecycle.md)、[UA-BL-15 运维](./sandbox-operations-console.md)、[UA-BL-07 隔离](./multi-user-isolation.md)、[UA-BL-13 企业 Work](./enterprise-portal-work-mode-integration.md) |

## 目标与当前约束
不同组织、业务角色/Group、用户、项目或会话可以采用不同的 Sandbox Template 和资源档位；管理员统一定义默认模板与允许模板集合，用户在明确授权范围内创建 Session。

目前 `backend/src/auth/routes.ts` 的内置组织成员角色主要为 owner/admin/member；`backend/src/operator/access.ts` 的部署运维权限通过 `OPERATOR_ACCOUNTS` 管理；`backend/src/sandboxes/preference-routes.ts` 当前只维护沙箱 **Provider 偏好**，并非业务模板策略。这些概念必须分开，不能直接用 admin/member 代替研发、测试、数据分析等业务角色。

## 已讨论方案
1. 独立 `TemplateAssignmentPolicy`，至少包括 `subjectType`（organization/group/role/user；项目范围视 Work 集成的可信 projectId 决定）、`subjectId`、`allowedTemplates`、`defaultTemplate`、`resourceLimits`、`priority`、`enabled`、有效期/版本/审计元数据。Provider 能力边界单独标识。
2. 默认模板解析顺序：**保留会话的固定真实模板 ID 优先**；新建 Session 有权显式选择时优先选取；否则按已批准的项目/角色/用户策略解析；最后组织默认。角色多重命中必须有确定冲突规则，不依赖随机列表顺序。
3. **权限校验与默认选择分离**：即使选出默认模板，仍需满足用户/组允许清单、模板发布状态、Native Runtime 兼容、资源档位、配额和可调度容量；不允许修改请求字段绕过认证或获得管理员镜像。
4. Session 在创建/首次绑定时记录具体 Provider、真实 Template ID、模板配置版本、资源规格与授权策略版本；恢复时不因后来默认模板/角色修改而静默替换沙箱。
5. 角色/Group 信息来自已验证的企业身份数据/管理员配置；未来支持与企业 AD/组同步，不能盲目信任浏览器传来的 UserId、Group 名称。变更应遵循撤权与运行会话的明确策略。
6. 与 UA-BL-14 MCP 联动：Session 所选 stdio MCP 必须被所绑定模板验证为可用；角色允许模板不同，不代表自动授予该模板内所有 MCP 或 Secret 的调用权。

## 本期范围和非范围
- **包含**：组织/Group/角色/用户模板分配记录和管理 UI、默认模板决议、显式选择的权限校验、Session 固定模板引用、资源上限、策略变更审计；至少以真实多用户权限矩阵验收。
- **不包含**：另造企业 IdP、无条件支持任意 LDAP/AD 结构、模板任意自动迁移、项目权限模型重构、工作流/DAG、复杂成本计费；后续按企业门户身份边界接入。
- **能力门槛**：当前身份源不提供可靠业务角色/Group 时，首期可以从组织和用户策略落地，但数据模型与接口必须保留扩展点，不应伪造业务组授权。

## 注意点
- 模板包含代码/凭据/工具链；**模板权限**不能代替 MCP 授权、Secret 授权或 Sandbox 内文件隔离。
- 共享默认模板不等于共享沙箱；一个 Session 仍对应独立沙箱与原生 Runtime，完全隔离用户文件和原生 Session。
- 容量准入继续通过 `backend/src/fleet/admission.ts` 与 capacity policy；不能因角色提高模板规格就绕过全局和组织限额。
- “Session 恢复保留历史模板”与“严重安全撤权”存在冲突时，提供显式暂停、阻止后续运行或审计迁移，不静默重放高风险版本。

## 验收
- [ ] 组织默认、角色/Group 默认、用户显式选择和多角色冲突均可重现，且说明命中原因。
- [ ] 不同用户/组织看不到和无法创建未授权模板；管理员更改策略有审计。
- [ ] Session 多轮继续与沙箱恢复保留真实模板绑定；模板 Alias 更新不改变运行中的 Session。
- [ ] 对超配额/不兼容 Runtime/模板未发布/MCP 依赖缺失均给出确定失败。
- [ ] 原有 owner/admin/member 权限、部署操作员权限、Provider Preference 不发生越权回归。

## 待确定
- 企业业务角色/Group 的权威来源、与组织成员的映射方式、优先级及 deny 规则、项目维度权威标识、管理员审批流程、旧会话撤权策略。
