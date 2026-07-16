# java-developer-skill

 Codex Java 工具技能包 — 涵盖 **MySQL 数据库深度分析**、**Java 研发现控契约** 和 **Token 精约器 v3** 三大技能。
所有工具支持 **Python / Node.js / Java** 三种语言，配置优先级 **Python > Node.js > Java**。

<p align="center">
  <img src="https://img.shields.io/badge/Java-17%2B-orange?logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-green?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Codex-Skill-blueviolet" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## 技能总览

| 技能 | 一句话 |
|------|--------|
| `java-mysql-query` | 说话查 MySQL，自动输出表依赖图/ERD/深度分析报告（9 工具 × 3 语言）|
| `java-superpowers-contract` | 需求分析→编码→审计与回滚，全流程研发现控（15 节契约 + 9 工具）|
| `token-economizer` | 自动无感压缩 Codex 输出，最大化减少 Token 消耗（纯指令，零依赖）|

三者可独立或配合安装。`java-mysql-query` 和 `java-superpowers-contract` 共享 9 套工具组件，`token-economizer` 在输出端对二者叠加压缩。

---

## 快速安装

> Codex 只在 `~/.codex/skills/` 的一级子文件夹下识别技能。

```cmd
:: 安装全部三个技能
xcopy /E /I /Y C:\a\java-developer-skill\skills\java-mysql-query %USERPROFILE%\.codex\skills\java-mysql-query
xcopy /E /I /Y C:\a\java-developer-skill\skills\java-superpowers-contract %USERPROFILE%\.codex\skills\java-superpowers-contract
xcopy /E /I /Y C:\a\java-developer-skill\skills\token-economizer %USERPROFILE%\.codex\skills\token-economizer
```

安装 Python 依赖（仅首次）：`pip install pymysql`

重启 Codex，输入 `"帮我连接到本地 MySQL"` 验证。

### 配置优先级

| 运行时 | 优先级 | 依赖 |
|--------|--------|------|
| **Python 3.8+** | 首选（零 Java） | `pip install pymysql` |
| **Node.js 18+** | 次选 | `npm install mysql2` |
| **Java 17+** | 备选（需编译） | JDBC 驱动 + javac |

---

## 1. java-mysql-query — MySQL 深度分析

核心入口 `database_query.py`（Python）/ `database-query.js`（Node）/ `DatabaseQuery.java`（Java）：

| 命令 | 说明 |
|------|------|
| `--get-schema` | 所有库表结构（引擎/列/主键/索引/注释）|
| `--analyze-table <表>` | 单表深度分析 + 数据质量三指标 |
| `--analyze-deep <表>` | 标准差/直方图/索引/分布桶 |
| `--table-deps` | 拓扑层级 + 环形依赖 + 影响链图 |
| `--get-relations` | 外键关系 + Mermaid ERD |
| `--explain <SQL>` | EXPLAIN FORMAT=JSON 查询计划 |
| `--export-csv <SQL>` | 标准 CSV 导出 |
| `--compare-entities` | Java 实体 vs 数据库表对比 |
| `--pr-report [表...]` | PR 报告生成 |

```bash
python database_query.py --db mydb --analyze-table user
python table_dependency.py --db mydb --output deps.html
python erd_viewer.py --db mydb --output erd.html
```

**密码安全**（优先级）：`$env:DB_PASSWORD` > 加密配置文件 > CLI 参数

---

## 2. java-superpowers-contract — Java 研发现控

全自动激活的两阶段契约（分析→编码），15 节核心管控：

**代码红线**：最小改动原则、Git worktree 物理隔离、四层分析协议（Controller/Service/Repository/Event）、方法级锚定 `[已有]/[新增]`  
**数据红线**：DDL 必带 `-- rollback`、密码环境变量注入、SQL 注入（`$` vs `#`）检查  
**安全红线**：禁止破坏性 API 变更、`@Deprecated` 保留 6 个月、密钥 90 天轮换、`git-secrets` 防泄露  
**审计**：每次回复末尾附加【执行审计】块，三语言审计报告生成器可选

```bash
# 审计报告生成（Python 首选）
python scripts/audit_report_generator.py --sample --format html --output audit.html
```

---

## 3. token-economizer v3 — Token 精约器

纯指令契约（零依赖），自动在每次 Codex 响应前加载，对输出施加强制压缩。

**9 层 18 条铁律概览**：

| 层 | 规则 | 要点 |
|----|------|------|
| 输出层 | R1-R3 | 零废话 / 极致压缩 / 直接输出 |
| 操作层 | R4-R6b | 批量并行 / 上下文压缩 / 零前置叙事 + 错误透明 |
| 预算层 | R7-R8a | 类型级输出上限 + 超限熔断 `[裁:X行]` |
| 上下文层 | R9-R10a | 多轮去重 / 工具链自省压缩 |
| 压缩技法 | R11-R12a | 渐进展开 / 格式优化 / 响应结构模板 |
| Java 特化 | R13-R14 | 注解直引 / 签名压缩 / 异常缩写 / Maven 坐标 |
| 技能集成 | I1-I4 | 输出端叠加压缩 / 审计块豁免 / 工具桥接 |
| 质量门禁 | R15-R16 | 自检清单 / 压缩率报告 |
| 上下文衰减 | R17-R18 | `...` 截断锚点 / 多轮上下文压缩 |

**8 种任务类型输出上限**（仅叙述文字，不含代码/diff）：单文件 0 行 / 多文件 1 行 / Bug 修复 1 行 / 代码审查 3 行 / 分析报告 5 行 / 架构建议 3 行 / 文档 8 行 / 教学 10 行

详情参见 [skills/token-economizer/SKILL.md](skills/token-economizer/SKILL.md) 及 [压缩模式参考](skills/token-economizer/references/compression-patterns.md)。

---

## 配套工具一览（9 组 × 3 语言）

| 工具 | Python | Node.js | Java | 用途 |
|------|--------|---------|------|------|
| DatabaseQuery | `database_query.py` | `database-query.js` | `DatabaseQuery.java` | MySQL 查询 & 分析 |
| SQL Analyze | `sql_explain_analyzer.py` | `sql-explain-analyzer.js` | `SqlExplainAnalyzer.java` | EXPLAIN 性能分析 |
| CSV Export | `csv_exporter.py` | `csv-exporter.js` | `CsvExporter.java` | SQL → CSV |
| ERD Viewer | `erd_viewer.py` | `erd-viewer.js` | `ErdViewer.java` | FK → Mermaid HTML |
| Table Deps | `table_dependency.py` | `table-dependency.js` | `TableDependency.java` | 拓扑 + 环形依赖 |
| Req Analyzer | `req_analyzer.py` | `req-analyzer.js` | `ReqAnalyzer.java` | 需求四层影响分析 |
| Skill Bridge | `skill_bridge.py` | `skill-bridge.js` | `SkillBridge.java` | 查询→审计自动转换 |
| Audit Report | `audit_report_generator.py` | `audit-report-generator.js` | `AuditReportGenerator.java` | 审计报告生成 |
| CI/CD Helper | `cicd_helper.py` | `cicd-helper.js` | `CicdHelper.java` | 提交校验 & pre-commit |

---

## 目录结构

```
C:\a\java-developer-skill\
├── README.md
└── skills\
    ├── java-mysql-query\           # MySQL 深度分析 + 配套工具
    │   ├── SKILL.md / agents\ / scripts\ (27 files) / references\
    ├── java-superpowers-contract\  # 研发现控契约 + 配套工具
    │   ├── SKILL.md / agents\ / scripts\ (27 files) / references\
    └── token-economizer\           # Token 精约器 v3（纯指令）
        ├── SKILL.md                # 9 层 18 条铁律（11KB）
        ├── agents\openai.yaml      # 接口定义 + 触发条件 + 示例
        └── references\compression-patterns.md  # 8 种场景对比 + 反模式对照
```

---

## 常见问题

**Q: 需要安装 Java 吗？**  
A: 不需要。Python（`pymysql`）和 Node.js（`mysql2`）均直连 MySQL，零 Java 依赖。Java 仅作为备选引擎。

**Q: 每次都要输密码？**  
A: 首次 `--password` 连接后自动加密保存，后续免输。

**Q: 三个技能必须一起装？**  
A: 不必，可单独安装任一技能。`token-economizer` 零安装成本。
