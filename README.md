# java-developer-skill

Codex Java 工具技能包。三个纯指令 Codex skill，即装即用：

| 技能 | 一句话 |
|------|--------|
| `java-mysql-query` | 自然语言查 MySQL，自动输出表依赖图/ERD/数据质量报告 |
| `java-superpowers-contract` | Java 研发现控契约：最小改动 → 两阶段工作流 → 审计回滚 |
| `token-economizer` | 无感压缩 Codex 输出，按任务类型强制精简，最大化省 Token |

三者可独立安装。`java-mysql-query` 和 `java-superpowers-contract` 共享 9 套三语言工具（Python/Node.js/Java），`token-economizer` 为纯指令契约零依赖，在输出端对前两者叠加压缩。

---

## 安装（复制即可）

```cmd
:: 安装全部三个技能
xcopy /E /I /Y C:\a\java-developer-skill\skills\java-mysql-query %USERPROFILE%\.codex\skills\java-mysql-query
xcopy /E /I /Y C:\a\java-developer-skill\skills\java-superpowers-contract %USERPROFILE%\.codex\skills\java-superpowers-contract
xcopy /E /I /Y C:\a\java-developer-skill\skills\token-economizer %USERPROFILE%\.codex\skills\token-economizer
```

安装 Python 依赖：`pip install pymysql`

重启 Codex，输入 `"帮我连接到本地 MySQL"` 验证。

---

## 技能简述

**java-mysql-query** — 核心入口 `database_query.py`，支持 schema 查看、单表深度分析（数据质量三指标）、全表分析、表依赖拓扑、ERD 关系图、EXPLAIN 计划分析、CSV 导出、Java 实体对比、PR 报告生成。密码支持环境变量/加密配置/CLI 三种方式。

**java-superpowers-contract** — 全自动激活的 15 节契约。核心管控：最小改动原则、Git worktree 物理隔离、四层分析（Controller/Service/Repository/Event）、方法级锚定 `[已有]/[新增]`、DDL 强制 rollback、安全审查（SQL 注入/敏感字段/密钥硬编码）、API 兼容性红线、每次回复附带【执行审计】。

**token-economizer v3** — 9 层 18 条铁律。零废话、预算裁剪（单文件 0 行叙述/教学最多 10 行）、超限熔断标注 `[裁:X行]`、Java 特化压缩（注解直引/签名压缩/异常缩写）、技能间集成（输出端叠加/审计块豁免）、质量门禁自检。[详情](skills/token-economizer/SKILL.md)

完整命令参考、契约章节、层规则说明见各技能 SKILL.md：[java-mysql-query](skills/java-mysql-query/SKILL.md) / [java-superpowers-contract](skills/java-superpowers-contract/SKILL.md) / [token-economizer](skills/token-economizer/SKILL.md)

---

## 配套工具（9 组 × 3 语言）

DatabaseQuery（MySQL 查分析）/ SQL Explain（EXPLAIN 计划）/ CSV Export（SQL→CSV）/ ERD Viewer（FK→Mermaid HTML）/ Table Deps（拓扑依赖）/ Req Analyzer（需求穿透分析）/ Skill Bridge（查询→审计转换）/ Audit Report（审计报告生成）/ CI/CD Helper（提交校验 & pre-commit）

---

## 常见问题

**Q: 必须装 Java？** A: 不用。Python（pymysql）和 Node.js（mysql2）直连 MySQL 零 Java 依赖，Java 仅备选。
**Q: 三个必须一起装？** A: 不必，可单独任装。token-economizer 纯指令零安装成本。
