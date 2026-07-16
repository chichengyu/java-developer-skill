#!/usr/bin/env node
/**
 * ReqAnalyzer — 需求深度分析器 (Node.js 版)
 * 对应契约第6节（两阶段工作流）+ 需求深度分析框架。
 * 用法: node req-analyzer.js "新增用户年龄字段，支持按年龄分组统计"
 *       node req-analyzer.js --input requirement.txt --format html --output analysis.html
 */
const fs = require("fs");
const path = require("path");

const LAYER_NAMES = ["入口层(Controller)", "业务层(Service/AOP)", "数据层(Repository/Mapper)", "异步层(Event/Message)"];

class ReqAnalyzer {
  constructor(requirement, title) {
    this.req = requirement;
    this.title = title || (requirement.length > 60 ? requirement.slice(0, 60) + "..." : requirement);
    this.impactLayers = this.analyzeLayers();
    this.risk = this.assessRisk();
    this.steps = this.generateSteps();
    this.sql = this.generateSql();
  }

  analyzeLayers() {
    const r = this.req.toLowerCase();
    const hits = [];
    if (/接口|api|端点|请求|响应|rest|controller|路由/.test(r)) hits.push(0);
    if (/业务|service|逻辑|计算|校验|验证/.test(r)) hits.push(1);
    if (/数据|查询|sql|存储|表|字段|数据库|索引|实体|增|删|改|查|写|读/.test(r)) hits.push(2);
    if (/异步|消息|事件|队列|kafka|rabbit|mq|通知|邮件/.test(r)) hits.push(3);
    return hits.length > 0 ? hits : [1];
  }

  assessRisk() {
    const r = this.req.toLowerCase();
    const level = (h, m, l) => r.match(h) ? "高" : r.match(m) ? "中" : "低";
    return {
      async: { level: level(/异步|队列|kafka|并发/, /事务|批量|大量/, /./), detail: "异步处理超时/线程池耗尽" },
      test: { level: level(/重构|改|重写|替换/, /新增|拓展|增加/, /./), detail: "现有测试需全部重新验证" },
      tx: { level: level(/事务|跨库|分布式|回滚/, /更新|修改|写/, /./), detail: "长事务导致连接池枯竭" },
    };
  }

  generateSteps() {
    const steps = [];
    if (this.impactLayers.includes(2)) steps.push({ step: 1, layer: "数据层", file: "数据库/实体类 [新增]", change: "新增/修改字段", sql: this.sql });
    if (this.impactLayers.includes(0)) steps.push({ step: steps.length + 1, layer: "入口层", file: "XxxController.java [已有]", change: "新增/修改接口", sql: "" });
    if (this.impactLayers.includes(1)) steps.push({ step: steps.length + 1, layer: "业务层", file: "XxxService.java [已有]", change: "新增业务方法", sql: "" });
    if (this.impactLayers.includes(3)) steps.push({ step: steps.length + 1, layer: "异步层", file: "XxxEventListener.java [已有]", change: "新增事件监听", sql: "" });
    if (steps.length === 0) steps.push({ step: 1, layer: "综合", file: "[分析结论]", change: "无需代码变更", sql: "" });
    return steps;
  }

  generateSql() {
    const r = this.req.toLowerCase();
    const lines = [`-- 需求分析生成的SQL变更`, `-- 需求: ${this.title}`, ""];
    if (/年龄|age/.test(r)) { lines.push("ALTER TABLE user ADD COLUMN age INT DEFAULT NULL COMMENT '年龄';"); lines.push("-- rollback: ALTER TABLE user DROP COLUMN age;"); }
    if (/手机|phone|mobile/.test(r)) { lines.push("ALTER TABLE user ADD COLUMN phone VARCHAR(20) DEFAULT NULL COMMENT '手机号';"); lines.push("-- rollback: ALTER TABLE user DROP COLUMN phone;"); }
    if (/邮箱|email/.test(r)) { lines.push("ALTER TABLE user ADD COLUMN email VARCHAR(100) DEFAULT NULL COMMENT '邮箱';"); lines.push("-- rollback: ALTER TABLE user DROP COLUMN email;"); }
    if (lines.length <= 2) { lines.push("-- 本次需求不涉及SQL变更"); }
    return lines.join("\n");
  }

  toJson() { return JSON.stringify(this.toDict(), null, 2); }

  toDict() {
    return {
      title: this.title, requirement: this.req,
      timestamp: new Date().toISOString(),
      impactLayers: this.impactLayers.map(i => LAYER_NAMES[i]),
      layersAffected: this.impactLayers.length,
      riskAssessment: this.risk,
      steps: this.steps, sql: this.sql,
    };
  }

  toMarkdown() {
    const a = this.toDict();
    const clsLevel = (l) => l;
    return `# 需求影响分析报告: ${a.title}

**需求原文:** ${a.requirement}

**影响层级 (${a.layersAffected}层):** ${a.impactLayers.join(", ")}

## 1. 业务逻辑与调用链路分析
本次需求影响 ${a.layersAffected} 个架构层：${a.impactLayers.map(l => `\n- **${l}**`).join("")}

## 2. 潜在副作用与风险评估

| 维度 | 风险 | 说明 |
|------|------|------|
| 线程池与异步 | **${a.risk.async.level}** | ${a.risk.async.detail} |
| 单元测试 | **${a.risk.test.level}** | ${a.risk.test.detail} |
| 事务传播机制 | **${a.risk.tx.level}** | ${a.risk.tx.detail} |

## 3. 详细文件级改造步骤
| 步骤 | 层级 | 文件 | 改动内容 |
|------|------|------|----------|
${a.steps.map(s => `| ${s.step} | ${s.layer} | \`${s.file}\` | ${s.change} |`).join("\n")}

### SQL 变更
\`\`\`sql
${a.sql}
\`\`\`

🔄【执行审计】- 技能: java-superpowers-contract [已有], ReqAnalyzer [新增] | ${a.timestamp}`;
  }

  toHtml() {
    const a = this.toDict();
    const cls = (l) => l === "高" ? "risk-high" : l === "中" ? "risk-mid" : "risk-low";
    const stepsRows = a.steps.map(s => `<tr><td>${s.step}</td><td>${s.layer}</td><td><code>${s.file}</code></td><td>${s.change}</td></tr>`).join("\n");

    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>需求影响分析报告 - ${a.title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:960px;margin:2em auto;padding:0 1em}
h1{color:#0d6efd;border-bottom:2px solid #0d6efd}h2{color:#198754;margin-top:1.5em}
table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #dee2e6;padding:.5em;text-align:left}
th{background:#e9ecef}tr:nth-child(even){background:#f2f2f2}
code{background:#e9ecef;padding:.2em .4em;border-radius:3px}
.risk-high{color:#dc3545;font-weight:700}.risk-mid{color:#d97706}.risk-low{color:#198754}
.summary{background:#e9ecef;padding:1em;border-radius:8px;margin:1em 0}
pre{background:#1a1a2e;color:#f8f9fa;padding:1em;border-radius:6px;overflow-x:auto}</style></head><body>
<h1>&#x1f50d; 需求影响分析报告: ${a.title}</h1>
<div class="summary"><strong>需求:</strong> ${a.requirement}<br><strong>生成时间:</strong> ${a.timestamp}<br><strong>影响层级:</strong> ${a.layersAffected}层 | <strong>建议步骤:</strong> ${a.steps.length}步</div>
<h2>1. 业务逻辑与调用链路分析</h2><p>影响架构层: ${a.impactLayers.map(l => `<strong>${l}</strong>`).join(", ")}</p>
<h2>2. 潜在副作用与风险评估</h2>
<table><tr><th>维度</th><th>风险</th><th>说明</th></tr>
<tr><td>线程池与异步</td><td class="${cls(a.risk.async.level)}">${a.risk.async.level}</td><td>${a.risk.async.detail}</td></tr>
<tr><td>单元测试</td><td class="${cls(a.risk.test.level)}">${a.risk.test.level}</td><td>${a.risk.test.detail}</td></tr>
<tr><td>事务传播机制</td><td class="${cls(a.risk.tx.level)}">${a.risk.tx.level}</td><td>${a.risk.tx.detail}</td></tr></table>
<h2>3. 详细文件级改造步骤</h2>
<table><thead><tr><th>步骤</th><th>层级</th><th>文件</th><th>改动内容</th></tr></thead><tbody>${stepsRows}</tbody></table>
<h2>SQL 变更</h2><pre><code>${a.sql}</code></pre>
<div class="summary">&#x1f504;【执行审计】- 技能: java-superpowers-contract [已有], ReqAnalyzer [新增]</div></body></html>`;
  }
}

function parseArgs() {
  const a = process.argv.slice(2);
  const opts = { format: "markdown" };
  for (let i = 0; i < a.length; i++) {
    switch (a[i]) {
      case "--input": case "-i": opts.input = a[++i]; break;
      case "--format": case "-f": opts.format = a[++i]; break;
      case "--output": case "-o": opts.output = a[++i]; break;
      default: opts.req = (opts.req || "") + " " + a[i];
    }
  }
  return opts;
}

function main() {
  const opts = parseArgs();
  let req = "";
  if (opts.input) {
    req = fs.readFileSync(opts.input, "utf-8").trim();
  } else if (opts.req) {
    req = opts.req.trim();
  }
  if (!req) { console.log("用法: node req-analyzer.js '需求描述' | --input file.txt --format html --output analysis.html"); return; }

  const analyzer = new ReqAnalyzer(req);
  let content;
  if (opts.format === "json") content = analyzer.toJson();
  else if (opts.format === "html") content = analyzer.toHtml();
  else content = analyzer.toMarkdown();

  if (opts.output) {
    fs.writeFileSync(opts.output, content, "utf-8");
    console.log(JSON.stringify({ status: "success", output: opts.output, format: opts.format, layers: analyzer.impactLayers.length, steps: analyzer.steps.length }));
  } else {
    console.log(content);
  }
}
if (require.main === module) main();
module.exports = ReqAnalyzer;
