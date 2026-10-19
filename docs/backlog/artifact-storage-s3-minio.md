# UA-BL-03｜文件/制品端到端传输与 S3/MinIO 存储适配

| 字段 | 值 |
| --- | --- |
| 类型 | 功能扩展 + E2E 验收 |
| 优先级 | 必须纳入企业化交付计划；具体排期未定 |
| 状态 | Backlog |
| 关联 | [UA-BL-07 多用户隔离](./multi-user-isolation.md)、[UA-BUG-01 Workpiece](./workpiece-create-failures.md) |

## 背景
用户明确询问：文件怎样从 UseAgent 传入 Sandbox，Agent 的文件与成品怎样输出并回到 UI；当前后端 Local-only 的持久化方案不满足未来正式部署，需扩展**兼容 MinIO 的 S3 存储**。

## 已确定的方案
- **保留现有 ArtifactStorage 抽象**，新增 S3-compatible/MinIO 实现，采用配置切换；不在上传、Workpiece、下载路由里散写 S3 分支。
- 文件传输与制品存储分两条边界：输入上传→会话隔离工作区；运行产物→后端 ArtifactStore→授权访问链接/预览/下载。
- 保留当前 Local 实现作为默认/兼容方案，未来迁移**不强制破坏旧引用**。
- 实施时需要同时考虑 **Range 读取、SHA 校验**、大文件传输/完整性，避免以一次性内存缓冲替代对象存储。

## 范围内
1. 输入附件：上传、类型/大小校验、所属用户/组织、沙箱获取、临时路径和失败清理。
2. 输出：文件/图片/文档/代码制品发现、元数据、内容摘要、上传/导出、前端可访问地址、权限检查。
3. 实现 Local 与 S3/MinIO 两种 Storage Provider；统一存取、删除、Range、校验与重试契约。
4. 配置选择、Endpoint/桶/前缀/凭证安全引用、历史 Artifact 兼容及必要迁移策略。
5. Workpiece 使用 Artifact 引用时的签名 URL 过期、引用稳定性及文件归属校验。

## 不在范围
- 新建通用文件协同/文件系统服务、重做聊天消息或 Runtime 工具协议。
- 默认公开 S3 桶、把 MinIO 凭证提供给模型或共享在所有沙箱内。
- 尚未确认的数据迁移时强制删除 Local 旧资产。

## 注意点
- 对象 Key 是内部存储标识，不应直接当成未经授权的下载地址；预签名 URL 要有 TTL 和范围约束。
- 大文件与 Range、重试幂等、哈希一致性、孤儿对象清理、跨用户访问必须 E2E。
- Local 与 S3 两类实现的删除/复制/预览语义要统一，不改变 Workpiece 和已发布产物的可用性。
- Sandbox 销毁时临时文件可被清理，**已交付 Artifact 必须按持久化保留策略处理**。

## 验收标准
- [ ] 真实上传→Sandbox Agent 读取→文件产出→ArtifactStore→前端下载的闭环通过。
- [ ] Local 与 MinIO Provider 对同一套契约和权限测试全部通过。
- [ ] 多用户不可越权下载，预签名 URL 过期和错误处理正确。
- [ ] Range/SHA/重试/大文件和数据清理经过实测。
- [ ] 原有 Local Artifact 引用、CC/Codex/OpenCode 工作区行为无回归。

> 待冻结：Storage 抽象的最终接口、迁移/回填的触发策略、对象生命周期 TTL。
