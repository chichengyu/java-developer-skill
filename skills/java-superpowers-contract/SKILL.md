---
name: java-superpowers-contract
description: Java 项目全场景硬隔离、最小改动与无感强制审计研发现控契约。当 Codex 需要处理 Java 项目的需求分析、架构改造、Bug 修复、代码重构或日常技术咨询时使用，提供 Superpowers 全技能链强制激活、两阶段工作流（分析→编码）、Git 环境物理硬隔离、SQL 精准交付、方法级锚定与全时审计汇报等完整研发现控流程。
---

# 🚀 Java + Superpowers 终极研发现控契约 (全场景硬隔离、最小改动与无感强制审计一体化版)

## 🎯 终极核心死锁指令
你当前已加载【Java + Superpowers 终极研发现控契约】。本技能一旦触发或加载，以下所有条款升级为系统底层不可凌驾的硬性铁律，必须无条件、完整强制执行，严禁简化或跳步。

## 一、最高语言原则 (Language Rule)
- **100% 纯中文交会**：不论用户使用何种语言提问，不论 Codebase 中的代码、注释、日志、类名、异常定义是何种语言，AI 的所有分析、架构设计、代码解释、修改说明及提示语，**必须完全使用中文**进行输出。

## 二、Superpowers 全时无感唤醒与任务全自动拆解机制
- **零门槛全时激活**：**无需用户提供任何特定关键词或"暗号"**。只要用户发起任何需求对话（无论是新功能、代码重构、Bug 修复还是日常咨询），AI 必须在底层**自动、无条件地唤醒** Superpowers 的 14 个高阶开发技能进行全套开发分析、方案整理输出与测试规划。
- **必须无感强制严格执行**：针对用户提出的任何任务，AI **必须强制、严格、完整地执行 Superpowers 的每一个分析与设计流程**，绝不允许有任何跳步、简化、敷衍或选择性忽略。Superpowers 的全套标准工作流（全链分析、副作用核验、按需 SQL 生成、单步阻塞确认、执行审计）被确立为系统底层不可凌驾的**硬性铁律**。
- **任务全自动拆解流**：拒绝等待用户细化步骤，AI 必须**主动、深度**地将用户的粗粒度想法或生产现象，自动拆解为具体、细粒度、研发视角可直接落地的**原子级任务流水线**，直接在方案中输出。
- **Git 与环境安全边界**：[🔒 当前窗口分支锁定 | 🛃 绝对硬隔离生效：仅允许读写 application-dev.yml，其余配置物理屏蔽]
- **极限交付红线校验**：[⚙️ 最小改动原则已就绪，严禁破坏原有核心业务链路与逻辑]
- **Superpowers 强制流程校验**：[✅ Superpowers 每一项原子级流程均已强制激活，严格执行中]
- **Superpowers 自动拆解目标**：[将输入的任意诉求全自动、结构化拆解出的核心交付目标]

## 三、软件工程交付红线：保持原有逻辑不变与最小改动原则 (Minimum Change Principle)
### 3.1 保护既有资产
- 在进行任何功能扩展、架构改造或缺陷修复时，**必须以保持系统原有核心业务逻辑、边界以及历史行为为绝对稳定为第一前提**。
- **禁止**：大面积重命名、重构变量、格式化代码、移动文件等非功能性变更。
- **禁止**：修改已有方法的入参/出参签名，除非该修改是需求强制的核心变化。
- **允许**：在方法末尾追加逻辑、新增独立切面、新增重载方法。
### 3.2 极限最小改动
- 严格遵循**最小改动（Least Intrusion）原则**。严禁进行大面积无意义的重构、改写或侵入式破坏。
- **能通过新增方法解决的，绝不修改已有方法体。**
- **能通过新增切面（AOP）解决的，绝不侵入业务代码。**
- **能通过新增独立配置项解决的，绝不修改默认行为。**
- 能通过新增方法、新增独立切面、或者在已有方法尾部动态扩展解决的，绝不修改已有核心链路的核心代码。修改每一行代码都必须有明确的、不可替代的工程理由。
- **每个修改的文件都必须附上修改理由，格式：文件 [已有] -> 原因：具体工程理由**
### 3.3 回归兜底
- 每次改动后，必须评估是否影响现有单元测试（JUnit / Mockito）。
- 每次改动后，必须确保核心业务流程的集成测试不受破坏。
- 必须明确标注改动的**影响范围**（Controller / Service / Repository / Mapper 各层）。

## 四、Git 分支隔离与环境配置物理硬隔离红线 (Environment Hard-Isolation)
### 4.1 基于当前分支创建
- 当执行或规划涉及创建工作树（Worktree）或新特性分支的操作时，**必须且仅能基于当前窗口所在的 Git 分支（Current Branch）进行衍生**，严禁擅自切换或基于其他无关分支拉取。
### 4.2 合并到当前分支
- 在开发完成、执行分支收尾或代码合并（Merge）时，**所有的代码变更必须且只能合并到当前窗口所在的 Git 分支**。严禁擅自操作、污染、修改或合并到任何其他非当前窗口的分支（如主线分支或旁路生产分支）。
### 4.3 工作树（Worktree）物理硬隔离
- 当需要并行开发时，必须使用 git worktree add 创建独立工作目录，确保多个任务之间的文件系统层面完全隔离。
- 工作树名称必须包含功能标识和日期，格式：<分支名>-<功能名>-<YYYYMMDD>
- 工作树使用完毕后必须通知用户清理：git worktree remove <路径>
### 4.4 全生命周期环境配置死锁（有且仅有唯一配置文件）
- **绝对限定读取与操作**：在后续整个对话流中，无论是进行**功能设计、业务规划、方案梳理、代码编写、逻辑调试、甚至自动化测试分析**，AI 有且仅能读取并修改**pplication-dev.yml [已有]**。AI 的上下文检索、文件关联与分析边界将被彻底死锁在此单份文件中。
- **全场景屏蔽**：**绝对禁止**以任何形式、在任何阶段去触碰、读取、参考或建立对其他环境配置文件（如pplication-prod.yml、pplication-test.yml 等）的依赖，其余配置文件在 AI 的分析、推理和知识库中**一律强制视为不可读且不存在**。
- **物理级稀疏隐藏**：在创建工作树或运行环境中，AI 必须通过 Git 稀疏检出（sparse-checkout）在物理层面上**仅下载并留下 pplication-dev.yml [已有]**，直接隐藏并排除其他所有环境配置。
- **稀疏检出命令参考**：
  `ash
  git sparse-checkout init --cone
  git sparse-checkout set src/main/resources/application-dev.yml
  `
### 4.5 Git 提交规范红线
- 提交信息必须遵循结构化格式：<类型>(<范围>): <描述>
- 允许的类型：eat / ix / efactor / 	est / docs / chore
- 提交信息必须为中文描述，严禁使用无意义提交信息。
- 每个提交必须原子化：一个提交只做一件事。

## 五、智能 SQL 交付红线 (Database & SQL Rules)
### 5.1 按需精准 SQL 交付
- 只要需求涉及数据库变更，AI 必须在改造步骤的最初始阶段直接给出可直接运行的 SQL 语句。交付形式严格遵循以下差异化分类：
  - **新表场景**：必须给出**完整、可直接独立运行的建表语句（CREATE TABLE）**。
  - **已有表场景（新增或修改字段）**：**禁止**输出整张表的建表语句，**必须且仅能输出新增或修改对应字段的增量语句（如 ALTER TABLE ... ADD COLUMN 或 MODIFY COLUMN）**。
- **规范性约束**：无论是新表还是增量字段语句，必须明确指定字段类型、长度、默认值、是否为空、主键/索引，并**强制包含清晰完整的 COMMENT（注释）**。
### 5.2 密码含特殊字符的引号包裹方法
- 当 MySQL 连接密码包含特殊字符（!@#$%^&*() 等）时，必须在 PowerShell / shell 中正确引号包裹：
  - **PowerShell 环境**：使用双引号包裹，内部特殊字符（$、`  `、"）需转义：
    `powershell
    java -cp .;mysql-connector.jar scripts.DatabaseQuery --password "myP@ssw0rd!" --get-schema
    `
    当密码含 $ 时，PowerShell 会将其解释为变量，必须使用**单引号**：
    `powershell
    java -cp .;mysql-connector.jar scripts.DatabaseQuery --password 'myP!2024' --get-schema
    `
  - **环境变量法（推荐）**：最安全的方式是通过 DB_PASSWORD 环境变量传入，避免 shell 解释：
    `powershell
    $env:DB_PASSWORD = "fT85{6M6mx!+ro(r1_Nw9qU.1q1(#Dny"
    java -cp .;mysql-connector.jar scripts.DatabaseQuery --get-schema
    `
  - **配置文件法（最安全）**：首次运行成功后，密码被安全保存在 ~/.java-mysql-query-config.json，后续无需再传入密码。
### 5.3 SHOW DATABASES 快速列举所有库
- 使用以下命令快速浏览服务器上所有数据库：
  `sql
  SHOW DATABASES;
  `
- 通过 DatabaseQuery 工具执行：
  `ash
  java -cp <skill目录>;<mysql-connector.jar> scripts.DatabaseQuery "SHOW DATABASES"
  `
- 典型输出包括：information_schema、mysql、performance_schema、sys 及所有业务数据库。
- 在列举后可快速切换目标数据库：USE <数据库名>;
- 适用场景：多租户环境探索、数据库盘点、迁移前摸底。
### 5.4 --analyze-table 数据质量三指标深度分析
- --analyze-table <表名> 在每个字段的分析中新增**数据质量三指标**（在原 NULL 率等统计基础上补充）：

  **① NULL 率（NULL Ratio）**
  - 计算方式：SUM(CASE WHEN col IS NULL THEN 1 ELSE 0 END) / COUNT(*)
  - 判断标准：
    - NULL 率 > 80%：**潜在冗余字段**（考虑废弃或迁移）
    - NULL 率 20%~80%：**建议补充默认值或业务约束**
    - NULL 率 < 5% 且字段定义 NOT NULL：**正常**

  **② 空字符串率（Empty String Ratio）**
  - 计算方式：SUM(CASE WHEN col = '' THEN 1 ELSE 0 END) / COUNT(*)
  - 适用字段：CHAR、VARCHAR、TEXT 等字符串类型
  - 判断标准：
    - 空字符串率 > 30%：**字段设计可能存在问题**（NULL 与空字符串混用）
    - 空字符串与 NULL 同时大量存在：**业务逻辑可能存在判断歧义**
    - 建议统一业务层空值策略：要么全用 NULL，要么全用空字符串

  **③ 哨兵值异常率（Sentinel Value Ratio）**
  - 哨兵值列表： 、-1、1900-01-01、1970-01-01、9999-12-31、-9999、''（空字符串）
  - 计算方式：SUM(CASE WHEN col IN (哨兵值列表) THEN 1 ELSE 0 END) / COUNT(*)
  - 判断标准：
    - 哨兵值率 > 10%：**业务层可能使用了哨兵值替代 NULL 语义**
    - 常见问题：「0 代表无意义」「-1 代表无限」「1900-01-01 代表空日期」
    - **修复建议**：统一使用 NULL 替代哨兵值，并在应用层做空值判断

- **执行命令**：
  `ash
  java -cp <skill目录>;<mysql-connector.jar> scripts.DatabaseQuery --analyze-table user
  `
### 5.5 配置持久化与管理
- **DatabaseQuery 配置存储路径**：~/.java-mysql-query-config.json
- **自动保存**：首次成功连接后自动保存配置，后续免输入
- **手动管理命令**：
  | 命令 | 作用 |
  |------|------|
  | --save-config | 手动保存当前连接参数到本地 |
  | --clear-config | 清除已保存的配置文件 |
- **环境变量优先级**：CLI 参数 > 配置文件 > 环境变量 > 默认值
- **安全注意事项**：
  - 配置文件存储明文密码，确保文件权限仅当前用户可读
  - 重要环境建议使用环境变量 $env:DB_PASSWORD 代替密码参数
  - 生产环境密码禁止写入任何配置文件
- **多数据库配置管理**：
  - 可通过 --db <库名> 动态切换数据库，无需修改配置
  - 通过 SHOW DATABASES 列举后，用 --db 参数快速切换目标库
  - 示例：java -cp ... scripts.DatabaseQuery --db my_other_db --get-schema

## 六、核心工作流与中断机制 (Two-Stage Workflow)
- **阶段一：严禁编码，只做分析**
  - **只做规划与影响范围评估**：当接收到新需求或唤醒规划时， AI 只能对系统进行全链路影响范围分析、风险评估并拆解步骤。
  - **环境与边界硬化**：在此阶段必须严格核对当前工作树与对话分析上下文中是否已完全屏蔽非 dev 环境文件，确认只锁定了pplication-dev.yml。
  - **严禁擅自写实现代码**：在未得到用户明确发出**"开始编码"、执行步骤 X"**的指令前，回复中**绝对不能包含任何具体业务逻辑的实现代码**。
- **阶段二：单步编码，必须确认**
  - **严格一事一议**：一次只能执行一个拆解后的步骤，**单次回复只允许修改或新增一个文件**（或执行单段增量/完整 SQL 落地）。
  - **展示并等待确认**：编写完当前步骤的代码或 SQL 后，必须将其完整或片段展示在当前面板中，并在回复最末尾**强制附带的阻塞话术**，随后停止输出，静默等待：
    > "**当前步骤代码已编写完毕，请确认是否正确。确认没错后，请帮我保存或指示我落地，再继续执行后面的步骤。**"
  - **未得授权，禁止落地**：在收到用户明确的保存或落地指令（如"落地"、"写入"、"保存"）前，AI 必须保持中断等待状态，**严禁擅自调用任何写文件工具**。

## 七、严禁凭空捏造与方法级锚定原则 (Grounding & Verification)
- **拒绝幻觉文件与方法**：在方案中提到的所有类、接口、方法、XML 映射、配置文件和数据库表，必须明确、严谨地还原项目真实状况，拒绝捏造。
- **强制编注后缀**：方案和步骤中出现的每一个文件、类名、甚至**方法名**后，必须显式加上状态编注，格式严格限制为：
  - 名称 [已有]：表示该内容在当前项目中真实存在。
  - 名称 [新增]：表示该内容是本次需求中新建的。
- **虚构方法防范约束**：如果调用标记为 [已有] 文件的某个方法，该方法必须真实存在于当前项目的代码上下文中，**严禁凭空捏造一个已有类里不存在的方法**。如果需要引入新逻辑，必须明确将该方法标记为 [新增]。
- **新增内容透明化**：对于任何声明为 [新增] 的方法或全新文件，**必须在改造步骤中直接给出具体的方法级代码片段或完整文件内容**，不能只给一个空名字而不说明具体实现。

## 八、Java 专属分析协议 (Java-Specific Analysis Protocol)
针对 Java 技术栈， AI 必须按照以下**规范层级**进行全 codebase 的穿透式扫描、追踪并标注 [已有] / [新增]：
1. **入口层 (Controller / Endpoint Layer)**：检查 @RestController, @Controller, @RequestMapping 等注解，明确接口定义变更、统一返回对象（如 Result）或入参对象（DTO）的结构变动。
2. **业务与切面层 (Service & AOP Layer)**：核心分析 @Service 和 @Component 类。重点排查 @Transactional 事务边界、自定义 @Aspect、Spring Interceptor 及 @Validated 校验规则的变更。
3. **数据访问与持久层 (Repository / Mapper Layer)**：检查 MyBatis / MyBatis-Plus 的 @Mapper 接口及 XML，或 Spring Data JPA 的 Repository。**在此层级必须率先输出新增/修改字段或新表的精准 SQL 语句**，再列出实体类（Entity）变动。
4. **解耦与异步链路 (Event & Message Layer)**：特别注意排查并追踪 @EventListener 以及各大消息中间件监听器（如 @RabbitListener, @KafkaListener, @RocketMQMessageListener）等异步旁路逻辑。

## 九、全时执行审计汇报与审计报告生成器 (Execution Auditing Redline)
### 9.1 强制每句汇报
- **本项为强制死命令。AI 在每一次回复完用户的任务/需求后，必须无条件在当前输出内容的最末尾（包括阶段一和阶段二），附加一个固定的【执行审计】模块**。
### 9.2 审计与统计内容
- 该模块必须精准、真实地列出：
  1. 本次对话中 AI 实际调用并加载的本地 MCP 插件（或具体工具）及 Superpowers 技能（Skill）名称。
  2. 本次对话中 AI 实际读取或搜索过的本地关键文件路径（必须标明 [已有] 状态）。
### 9.3 审计报告生成器（自动化审计报告工具）
- **概述**：提供自动化的审计报告生成工具链，支持 Python / Node.js / Java 三种语言实现。配置优先级：**Python > Node.js > Java**，优先使用 Python 版本。
- **审计报告生成器能力**：
  - 读取 JSON 格式的审计数据（从 stdin 或文件传入）
  - 生成三大格式报告：**JSON**（原始数据）、**Markdown**（可读摘要）、**HTML**（格式化页面）
  - 支持自定义输出路径和报告标题
  - 支持追加审计条目到历史审计日志
  - 自动计算审计时间戳和统计摘要
- **配置优先级**：
  1. **Python 引擎**（首选）：python scripts/audit_report_generator.py
  2. **Node.js 引擎**（次选）：
ode scripts/audit-report-generator.js
  3. **Java 引擎**（备选）：java -cp . scripts.AuditReportGenerator
- **审计数据 JSON 格式**：
  `json
  {
    "sessionId": "对话会话唯一标识",
    "timestamp": "2026-07-15T21:00:00+08:00",
    "skills": ["skill名称1 [已有]", "skill名称2 [已有]"],
    "tools": ["工具名称1", "工具名称2"],
    "filesRead": [
      {"path": "src/main/resources/application-dev.yml", "status": "[已有]"},
      {"path": "src/main/java/com/example/XxxService.java", "status": "[已有]"}
    ],
    "filesModified": [
      {"path": "src/main/java/com/example/XxxController.java", "change": "新增校验逻辑"}
    ],
    "sqlExecuted": [
      {"sql": "ALTER TABLE user ADD COLUMN ...", "type": "DDL"}
    ],
    "summary": {
      "totalSkills": 2,
      "totalTools": 2,
      "totalFilesRead": 2,
      "totalFilesModified": 1,
      "totalSqlExecuted": 1
    }
  }
  `
- **使用示例**：
  `ash
  # Python（首选）
  python scripts/audit_report_generator.py --input audit_data.json --format markdown --output audit_report.md

  # Node.js（次选）
  node scripts/audit-report-generator.js --input audit_data.json --format html --output audit_report.html

  # Java（备选）
  java -cp . scripts.AuditReportGenerator --input audit_data.json --format json --output audit_report.json
  `
### 9.4 与 java-mysql-query 联合审计
- 当同时使用 DatabaseQuery 工具执行数据库分析时，自动将以下信息纳入审计报告：
  - 执行的每个 DatabaseQuery 命令（--get-schema、--analyze-all、--analyze-table 等）
  - 通过 --analyze-table 发现的数据质量三指标异常（高 NULL 率、高空字符串率、高哨兵值率）
  - 数据库 Schema 变更记录
  - 配置管理操作（--save-config / --clear-config）

## 十、数据库变更回滚红线 (Database Rollback Strategy)
### 10.1 强制回滚方案
- **每条 DDL 必须附带回滚语句**。AI 在输出任何 ALTER TABLE、CREATE TABLE、DROP TABLE 语句时，必须在紧邻的注释中提供 `-- rollback` 逆操作。
- **正向/回滚配对示例**：
  ```sql
  -- forward: 新增年龄字段
  ALTER TABLE user ADD COLUMN age INT DEFAULT 0 COMMENT '年龄';
  -- rollback: ALTER TABLE user DROP COLUMN age;

  -- forward: 创建索引
  CREATE INDEX idx_email ON user(email);
  -- rollback: DROP INDEX idx_email ON user;
  ```
- **禁止无回滚的单向迁移**：所有 DDL 变更必须成对提供，严禁输出没有对应 rollback 的单向 DDL。
- **数据迁移类 DML 的回滚**：对于 UPDATE/INSERT/DELETE 类型的变更，必须提供对应的数据快照或逆向 SQL。
### 10.2 变更时序控制
- **DDL 优先于 DML**：必须先执行表结构变更，再执行数据迁移。严禁先写数据再改结构。
- **批量变更分批执行**：超过 3 张表的批量变更必须拆分为独立步骤，每步执行后确认无锁等待再继续。
- **生产变更窗口**：AI 必须标注影响评估（锁表类型、预估耗时、是否 ONLINE DDL）。
### 10.3 锁表风险评估
- 输出每条 DDL 时，必须评估锁表风险：
  - **INSTANT**（MySQL 8.0.12+，仅需修改元数据）：安全
  - **INPLACE**（允许并发读写，但需重建表）：需评估窗口
  - **COPY**（锁表阻塞读写）：禁止在生产窗口无审核执行
- 锁表类型评估示例：`ALTER TABLE user ADD COLUMN age INT` -> COPY（MySQL < 8.0.12）/ INSTANT（MySQL 8.0.12+）

## 十一、代码审查与安全检查清单 (Code Review Checklist)
### 11.1 Spring 框架审查项
- **@Transactional 边界检查**：事务不能跨越 RPC/HTTP 调用；事务内不能有 try-catch 吞异常；`@Transactional` 的 propagation 和 rollbackFor 是否显式指定？
- **@Async 线程池检查**：异步方法是否导致线程池过载？默认 `SimpleAsyncTaskExecutor` 是否已改为 `ThreadPoolTaskExecutor`？ThreadLocal 上下文是否在异步中丢失？
- **依赖注入检查**：是否使用 `@Autowired` 字段注入代替构造器注入？是否存在循环依赖？
- **AOP 切面检查**：切面是否匹配了比预期更广的 join point？`@Around` 是否正确调用了 `proceed()`？
### 11.2 数据安全审查项
- **SQL 注入检查**：MyBatis XML 中是否使用了 `${}` 而非 `#{}`？是否存在字符串拼接 SQL？
- **敏感字段脱敏**：返回 JSON 中的手机号、身份证、银行卡号是否已经脱敏？日志中是否打印了密码/Token？
- **密钥硬编码检测**：代码中是否存在 `password = "xxx"`、`secret = "xxx"`、`apiKey = "xxx"` 等硬编码凭据？
- **权限校验检查**：新增接口是否有 `@PreAuthorize` 或 `@Secured` 注解？内部接口是否被错误对外开放？
### 11.3 异常处理审查项
- **吞异常检查**：catch 块内是否只有空日志或空 return？是否使用了 `e.printStackTrace()` 代替日志框架？
- **事务回滚检查**：`@Transactional` 方法内是否 try-catch 导致 `rollbackFor` 失效？是否捕获了 `Exception` 但未重新抛出标记回滚的异常？
- **前端信息泄露**：异常信息是否直接暴露了 SQL、栈轨迹或内部路径给前端？
### 11.4 最小改动合规审查
- 修改文件中是否存在无关联的 import 变更、空格调整、注释删除？
- 是否修改了超过需求范围的方法签名或类结构？
- 新增代码是否遵循了项目现有编码风格（命名、包结构、设计模式）？

## 十二、秘密管理体系 (Secret Management)
### 12.1 环境隔离策略
- **dev 环境**：允许在 application-dev.yml 中填写明文密码（仅限本地开发），文件必须加入 `.gitignore`。
- **staging 环境**：使用环境变量 `DB_PASSWORD` 注入，禁止写入配置文件。
- **production 环境**：强制使用密钥管理服务（Vault / AWS Secrets Manager / Azure Key Vault），代码中仅保留占位符。
### 12.2 Git 防泄露红线
- **禁止提交**含密码、密钥、Token 的文件到 Git。必须配置 `.gitignore` 排除所有 `application-*.yml` 中的 secrets。
- **git-secrets 钩子**：建议安装 `git-secrets` 扫描工具并在 pre-commit hook 中启用：
  ```bash
  git secrets --install
  git secrets --register-aws
  git secrets --add 'password\s*=\s*.+'
  git secrets --add 'secret\s*=\s*.+'
  ```
- **凭证清理**：如果误提交了秘密，必须立即轮换凭据（仅删除提交历史不够，因为秘密已经暴露）。
### 12.3 数据库密码传递方法优先级
- **最高安全**：密钥管理服务（HashiCorp Vault / AWS Secrets Manager）-> Java 代码运行时拉取
- **推荐**：环境变量（`DB_PASSWORD`）-> 应用启动时读取
- **可用**：CLI 参数（`--password`）-> 仅限交互式命令行
- **禁止**：配置文件明文密码 -> 禁止提交到版本控制
### 12.4 密钥轮换流程
- staging/prod 数据库密码必须每 90 天轮换一次。
- 轮换步骤：生成新密码 -> 更新数据库用户 -> 更新密钥存储 -> 重启应用 -> 验证连接 -> 删除旧密码。

## 十三、API 兼容性红线 (API Compatibility)
### 13.1 禁止破坏性变更
- **禁止直接修改已有接口的请求/响应字段含义**。例如将 `status` 从 `int` 改为 `String` 是破坏性变更。
- **禁止删除已有接口的请求/响应字段**。如果字段不再使用，标记为 `@Deprecated` 并保留至少 2 个版本。
- **禁止修改已有接口的 HTTP 方法或 URL 路径**。如果必须修改，创建新端点并在文档中废弃旧端点。
### 13.2 新增字段规范
- 新增请求/响应字段必须设置合理的默认值或标记为 `optional`，确保不影响已有调用方。
- 使用 `@JsonProperty(access = Access.READ_ONLY)` 或 `@Schema(accessMode = READ_ONLY)` 标记只读字段。
- 对于 Feign/OpenFeign 接口，新增字段必须添加 `@JsonProperty(defaultValue = "...")`。
### 13.3 版本化策略
- **推荐策略**：URL 路径版本化 `/api/v1/orders` -> `/api/v2/orders`
- **备选策略**：Header 版本化 `Accept: application/vnd.company.v1+json`
- **版本兼容窗口**：每个 API 版本至少保持 6 个月的双版本兼容期。
### 13.4 接口文档要求
- 新增/修改接口必须在代码中标注 swagger `@Operation` 注解，明确描述参数变化。
- 废弃接口必须使用 `@Deprecated` 注解并在 swagger 描述中注明替代方案和废弃时间。

---
## 十四、工具链集成总览 (Toolchain Integration)
### 14.1 多语言脚本工具清单
所有工具支持三种语言实现，配置优先级：**Python > Node.js > Java**。

| 工具 | 文件 (py/node/java) | 功能 | 对应契约章节 |
|------|---------------------|------|-------------|
| 审计报告生成器 | `audit_report_generator.py` / `audit-report-generator.js` / `AuditReportGenerator.java` | 生成JSON/Markdown/HTML审计报告 | 第9节 |
| 查询计划分析器 | `sql_explain_analyzer.py` / `sql-explain-analyzer.js` / `SqlExplainAnalyzer.java` | 分析SQL执行计划，识别性能瓶颈 | 第5节/第10节 |
| CSV导出器 | `csv_exporter.py` / `csv-exporter.js` / `CsvExporter.java` | 导出查询结果为CSV文件 | 第5节 |
| CI/CD集成助手 | `cicd_helper.py` / `cicd-helper.js` / `CicdHelper.java` | Git提交校验、pre-commit钩子、自动化审计 | 第4节/第9节 |
| Skill桥接器 | `skill_bridge.py` / `skill-bridge.js` / `SkillBridge.java` | 连接DatabaseQuery与审计报告生成器 | 第9.4节 |
### 14.2 端到端自动化流程
```
# Step 1: 数据质量分析（任意语言）
python scripts/skill_bridge.py --db mydb --tables user order --audit-format html --output quality_report

# Step 2: 生成审计报告（自动桥接）
# Skill Bridge 会自动调用 DatabaseQuery --analyze-table，
# 将结果（含三指标）转换为审计数据，再调用 Audit Report Generator 生成报告

# Step 3: CI/CD 集成
python scripts/cicd_helper.py --check-commit-msg "feat(user): 新增年龄字段"
python scripts/cicd_helper.py --pre-commit-install

# Step 4: SQL 优化
python scripts/sql_explain_analyzer.py --db mydb "SELECT * FROM user WHERE email='test@test.com'"

# Step 5: 数据导出
python scripts/csv_exporter.py --db mydb "SELECT id, name FROM user" --output users.csv
```
### 14.3 三种语言引擎对比
| 维度 | Python | Node.js | Java |
|------|--------|---------|------|
| 启动速度 | 快 | 快 | 慢（需编译） |
| JSON处理 | 原生(json模块) | 原生(JSON.parse) | 需手动解析 |
| Shell调用 | subprocess | child_process | ProcessBuilder |
| 配置优先级 | 1（首选） | 2（次选） | 3（备选） |
| 适用场景 | 本地快速分析 | Web前端集成 | 生产环境嵌入 |

---
## 十五、需求深度分析框架 (Requirements Deep Analysis)
### 15.1 需求自动拆解与影响分析
- **四层穿透式分析**：AI 收到任何需求时，必须自动从以下4个架构层穿透分析影响范围：
  1. **入口层 (Controller/Endpoint)**：接口定义变更、入参校验、统一返回对象
  2. **业务层 (Service/AOP)**：@Transactional 事务边界、@Async 异步、业务逻辑变更
  3. **数据层 (Repository/Mapper)**：实体变更、SQL 增量、索引策略
  4. **异步层 (Event/Message)**：事件监听、消息发送、异步旁路逻辑
- **需求影响面评分**：根据需求文本自动评估影响度（高/中/低）和风险等级。
- **SQL 变更预生成**：根据需求关键词自动生成对应的 ALTER TABLE 语句 + rollback。
### 15.2 ReqAnalyzer 需求深度分析工具
- **概述**：自动化需求深度分析工具链，支持 Python / Node.js / Java 三种语言。
- **用法**：python scripts/req_analyzer.py "需求描述" --format html --output analysis.html
- **输出格式**：JSON / Markdown / HTML

---
---

## 🛡️ Java Impact Output Format (阶段一输出标准模板)
在阶段一输出影响分析时，必须严格执行以下 Markdown 结构：
## 1. 业务逻辑与调用链路分析
## 2. 潜在副作用与风险评估
- **线程池与异步**：是否会触发 @Async 异步线程池过载、拒绝策略触发或上下文（如 ThreadLocal）丢失？
- **单元测试**：是否会破坏现有的单元测试（JUnit / Mockito 基类或 Mock 行为与测试覆盖率）？
- **事务传播机制**：是否存在因内部调用导致 @Transactional 失效，或长事务导致数据库连接池枯竭的风险？
## 3. 详细文件级改造步骤 (File-Level Implementation Steps)
- **步骤 1**：【数据层变动】：数据库/实体类 [新增/已有] -> 【改动】：新增/修改字段或新表，**精准 SQL 如下**：
`sql
-- 如果是新表，此处给出完整 CREATE TABLE 语句
-- 如果是修改/新增字段，此处必须仅给增量 ALTER TABLE 语句（含清晰 COMMENT）
`
- **步骤 2**：【文件】：XxxController.java [已有] -> 【改动】：修改 createOrder [已有] 方法，遵循最小改动原则增加入参校验...
- **步骤 3**：【文件】：XxxService.java [已有] -> 【改动】：在此类中【新增】方法 public void checkLimit() [新增]

🔄【执行审计】
- 实际调用的 Skill / MCP 插件：[例如：Brainstorming & Planning / fetch_codebase_ctx]
- 读取的关键本地文件：
  -- [已有] src/main/resources/application-dev.yml
  -- [已有] src/main/java/com/example/XxxService.java

