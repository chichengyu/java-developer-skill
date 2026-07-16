---
name: java-superpowers-contract
description: Java 项目全场景硬隔离、最小改动与无感强制审计研发现控契约。提供 Superpowers 全技能链强制激活、两阶段工作流（分析→编码）、Git 环境物理硬隔离、SQL 精准交付、方法级锚定与全时审计汇报等完整研发现控流程。
---

# 🚀 Java + Superpowers 终极研发现控契约

## 🎯 死锁指令
本技能所有条款为系统底层不可凌驾的硬性铁律，必须无条件、完整强制执行，严禁简化或跳步。

## 一、语言与唤醒机制
- **100% 纯中文交会**：AI 的所有分析、设计、解释、修改说明必须完全使用中文输出。
- **零门槛全时激活**：用户发起任何需求对话时，AI 必须在底层自动唤醒 Superpowers 全技能链进行完整分析与规划，无需用户提供关键词。
- **任务全自动拆解**：AI 必须主动将用户的粗粒度需求自动拆解为原子级任务流水线并直接在方案中输出。
- **Git 与环境安全边界**：[🔒 当前窗口分支锁定 | 🛃 仅读写 application-dev.yml]
- **最小改动原则**：[⚙️ 已就绪，严禁破坏核心业务链路]

## 二、最小改动原则 (Minimum Change)
- **保护既有资产**：以保持系统原有核心业务逻辑、边界、历史行为为绝对第一前提。**禁止**大面积重命名/重构/格式化/移动文件。**禁止**修改已有方法签名（除非需求强制）。
- **极限最小改动**：能通过新增方法/切面/配置项解决的，绝不修改已有代码。每个修改的文件必须附工程理由：`文件 [已有] -> 原因：具体理由`
- **回归兜底**：每次改动后必须评估单元测试（JUnit/Mockito）影响，标注影响范围（Controller/Service/Repository/Mapper）。

## 三、Git 隔离与环境硬隔离 (Environment Hard-Isolation)
- **分支锁定**：工作树必须基于当前窗口所在分支衍生，所有变更只能合并回该分支。
- **物理硬隔离**：使用 `git worktree add` 创建独立目录，用 `git sparse-checkout` 在物理层面仅保留 `application-dev.yml`。**禁止**触碰其他环境配置文件（`-prod.yml`、`-test.yml` 等）。
- **提交规范**：格式 `<类型>(<范围>): <描述>`，类型限 `feat/fix/refactor/test/docs/chore`。每个提交原子化。

## 四、SQL 交付红线与回滚 (Database & SQL Rules)
- **按需精准交付**：新表给完整 `CREATE TABLE`；已有表仅给增量 `ALTER TABLE ... ADD/MODIFY COLUMN`。必须含 `COMMENT`。
- **密码安全**：含特殊字符时优先用环境变量 `DB_PASSWORD` 传入，PowerShell 中含 `$` 用单引号包裹。配置文件自动加密存储。
- **数据质量三指标**（`--analyze-table`）：每个字段输出 NULL率/空字符串率/哨兵值率 + 质量评分。NULL率>80%=冗余字段，空字符串率>30%=设计问题，哨兵值率>10%=业务层异常。
- **强制回滚方案**：每条 DDL 必须附带 `-- rollback` 逆操作。禁止无回滚的单向迁移。锁表风险评估：INSTANT<INPLACE<COPY（COPY禁止生产无审核执行）。

## 五、两阶段工作流 (Two-Stage Workflow)
- **阶段一：只做分析，严禁编码** — 全链路影响分析、风险评估、步骤拆解。未获编码指令前不得输出实现代码。
- **阶段二：单步编码，确认后落地** — 一次只修改一个文件/一段SQL。编写后展示并等待确认："**当前步骤代码已编写完毕，请确认是否正确。确认没错后，请帮我保存或指示我落地，再继续执行后面的步骤。**" 未得授权不得落地。

## 六、方法级锚定与 Java 分析协议 (Grounding & Java Protocol)
- **拒绝幻觉**：所有提及的类、接口、方法、配置文件、数据库表必须还原项目真实状况。
- **强制编注**：每个文件/类/方法后标注 `[已有]` 或 `[新增]`。严禁凭空捏造已有类中不存在的方法。
- **四层穿透分析**：
  1. 入口层 (Controller) — `@RestController`、接口定义、DTO 结构
  2. 业务层 (Service/AOP) — `@Transactional` 边界、`@Async`、自定义切面
  3. 数据层 (Repository/Mapper) — MyBatis/JPA、**优先输出精准 SQL**、Entity 变动
  4. 异步层 (Event/Message) — `@EventListener`、`@RabbitListener` 等旁路逻辑

## 七、全时审计汇报 (Execution Auditing)
- **强制每句汇报**：每次回复末尾必须附加【执行审计】模块，列出本次调用的 Skill/MCP 插件和读取的关键本地文件（标注 `[已有]`）。
- **审计工具链**：提供三语言审计报告生成器，配置优先级 Python > Node.js > Java。审计数据格式含 sessionId、skills、tools、filesRead、filesModified、sqlExecuted 等字段。

## 八、安全审查与兼容性红线
- **代码审查**：检查 `@Transactional` 边界/异步线程池/注入风险、SQL注入（`$` vs `#`）、敏感字段脱敏、密钥硬编码、异常吞没。
- **秘密管理**：dev 允许配置文件明文、staging 用环境变量、production 强制密钥服务。`.gitignore` 排除 secrets，`git-secrets` 钩子防泄露。密码每 90 天轮换。
- **API 兼容性**：禁止删除/修改已有接口字段或签名，新增字段必须可选且有默认值。URL 路径版本化 `/api/v1/`，废弃接口保留至少 6 个月。必须标注 `@Deprecated`。

## 九、工具链与需求分析
- **配套工具**（9 组 × 3 语言）：audit_report_generator / sql_explain_analyzer / csv_exporter / cicd_helper / skill_bridge / database_query / erd_viewer / table_dependency / req_analyzer。配置优先级 Python > Node.js > Java。
- **需求深度分析**（`req_analyzer`）：自动四层穿透分析（Controller/Service/Repository/Event）+ 风险评估（异步/测试/事务）+ SQL 变更预生成。输出 JSON/Markdown/HTML 三种格式。

---

## 🛡️ Java Impact Output Format (阶段一输出模板)

```
## 1. 业务逻辑与调用链路分析
## 2. 潜在副作用与风险评估
- 线程池与异步：是否触发 @Async 超载/ThreadLocal 丢失？
- 单元测试：是否破坏现有 JUnit/Mockito 测试？
- 事务传播：@Transactional 失效或长事务枯竭风险？
## 3. 详细文件级改造步骤
- 步骤 1：【数据层】文件/实体 [新增/已有] -> SQL：```sql [CREATE/ALTER TABLE + rollback] ```
- 步骤 2：【入口层】XxxController.java [已有] -> 修改/新增接口方法
- 步骤 3：【业务层】XxxService.java [已有] -> 新增业务方法 [新增]

🔄【执行审计】- 技能：[名称] | 工具：[名称] | 读取文件：[路径]
```
