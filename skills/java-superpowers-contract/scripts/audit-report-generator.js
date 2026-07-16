#!/usr/bin/env node
/**
 * Java + Superpowers 审计报告生成器 (Node.js 版)
 * ============================================
 * 配置优先级：Python > Node.js > Java
 * 对应契约第9节 - 全时执行审计汇报
 *
 * 能力：
 *   - 读取 JSON 审计数据（stdin 或文件）
 *   - 生成三大格式报告：JSON / Markdown / HTML
 *   - 自定义输出路径和报告标题
 *   - 追加审计条目到历史审计日志
 *   - 数据质量三指标分析（NULL率/空字符串率/哨兵值率）
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// ========== 配置管理 ==========
const CONFIG_DIR = path.join(os.homedir(), ".java-superpowers-audit");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const HISTORY_FILE = path.join(CONFIG_DIR, "audit_history.jsonl");

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch (e) {}
  return { default_format: "markdown", output_dir: process.cwd() };
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

function appendHistory(auditData) {
  ensureConfigDir();
  const record = { timestamp: new Date().toISOString(), sessionId: auditData.sessionId || "", summary: auditData.summary || {} };
  fs.appendFileSync(HISTORY_FILE, JSON.stringify(record) + "\n", "utf-8");
}

function readHistory(limit) {
  limit = limit || 50;
  const records = [];
  if (fs.existsSync(HISTORY_FILE)) {
    const lines = fs.readFileSync(HISTORY_FILE, "utf-8").split("\n").filter(Boolean);
    for (const line of lines.slice(-limit)) {
      try { records.push(JSON.parse(line)); } catch (e) {}
    }
  }
  return records;
}

// ========== 数据质量三指标 ==========
const SENTINEL_VALUES = new Set(["0", "-1", "1900-01-01", "1970-01-01", "9999-12-31", "-9999", ""]);

function analyzeDataQuality(nullCount, totalCount, emptyStringCount, topValues) {
  emptyStringCount = emptyStringCount || 0;
  topValues = topValues || [];
  if (totalCount === 0) return { nullRatio: 0, emptyStringRatio: 0, sentinelValueRatio: 0, qualityScore: 1, warning: "空表" };

  const nullRatio = nullCount / totalCount;
  const emptyStringRatio = emptyStringCount / totalCount;

  let sentinelCount = 0;
  for (const tv of topValues) {
    if (SENTINEL_VALUES.has(String(tv.value || ""))) sentinelCount += (tv.count || 0);
  }
  const sentinelValueRatio = sentinelCount / totalCount;

  let qualityScore = 1.0 - (nullRatio * 0.4 + emptyStringRatio * 0.3 + sentinelValueRatio * 0.3);
  qualityScore = Math.max(0, Math.min(1, qualityScore));

  const warnings = [];
  if (nullRatio > 0.8) warnings.push("NULL率过高: 潜在冗余字段");
  else if (nullRatio > 0.2) warnings.push("NULL率偏高: 建议补充默认值");
  if (emptyStringRatio > 0.3) warnings.push("空字符串率过高: 字段设计可能存在问题");
  if (sentinelValueRatio > 0.1) warnings.push("哨兵值率异常: 业务层可能使用了哨兵值替代NULL");

  return {
    nullRatio: Math.round(nullRatio * 10000) / 10000,
    emptyStringRatio: Math.round(emptyStringRatio * 10000) / 10000,
    sentinelValueRatio: Math.round(sentinelValueRatio * 10000) / 10000,
    qualityScore: Math.round(qualityScore * 10000) / 10000,
    warning: warnings.length > 0 ? warnings.join("; ") : "正常",
  };
}

// ========== 示例数据 ==========
function generateSampleAuditData() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const ts = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "_" + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  return {
    sessionId: "session_" + ts,
    timestamp: now.toISOString(),
    title: "示例审计报告",
    skills: ["java-superpowers-contract [已有]", "java-mysql-query [已有]", "Brainstorming & Planning [已有]"],
    tools: ["fetch_codebase_ctx", "analyze_dependencies", "DatabaseQuery"],
    filesRead: [
      { path: "src/main/resources/application-dev.yml", status: "[已有]" },
      { path: "src/main/java/com/example/UserService.java", status: "[已有]" },
    ],
    filesModified: [{ path: "src/main/java/com/example/UserController.java", change: "新增校验逻辑 [新增]" }],
    sqlExecuted: [{ sql: "ALTER TABLE user ADD COLUMN age INT DEFAULT 0 COMMENT '年龄'", type: "DDL" }],
    dataQualityIssues: [
      { table: "user", column: "email", nullRatio: 0.0234, emptyStringRatio: 0.0156, sentinelValueRatio: 0, qualityScore: 0.98, warning: "正常" },
    ],
    summary: { totalSkills: 3, totalTools: 3, totalFilesRead: 2, totalFilesModified: 1, totalSqlExecuted: 1, totalQualityIssues: 1 },
  };
}

// ========== 报告生成 ==========
function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateJsonReport(auditData) {
  const report = { reportType: "execution_audit", generatedAt: new Date().toISOString(), auditData: auditData, qualityAnalysis: {} };
  const issues = auditData.dataQualityIssues || [];
  if (issues.length > 0) {
    report.qualityAnalysis = {
      totalIssues: issues.length,
      criticalIssues: issues.filter(q => (q.qualityScore || 1) < 0.6),
      warnings: issues.filter(q => (q.qualityScore || 1) >= 0.6 && (q.qualityScore || 1) < 0.9),
      details: issues,
    };
  }
  return JSON.stringify(report, null, 2);
}

function generateMarkdownReport(auditData) {
  const title = auditData.title || "执行审计报告";
  const ts = auditData.timestamp || new Date().toISOString();
  const lines = [
    "# 执行审计报告: " + title, "",
    "- **会话ID**: " + (auditData.sessionId || "N/A"),
    "- **时间戳**: " + ts,
    "- **生成时间**: " + new Date().toISOString(), "",
    "## 1. 技能与工具调用", "",
    "### 加载的技能 (Skills)",
  ];
  (auditData.skills || []).forEach(sk => lines.push("- " + sk));
  lines.push("", "### 调用的工具 (Tools)");
  (auditData.tools || []).forEach(t => lines.push("- `" + t + "`"));
  lines.push("", "## 2. 文件访问记录", "", "### 读取的文件");
  (auditData.filesRead || []).forEach(fr => lines.push("- " + (fr.status || "[已有]") + " `" + fr.path + "`"));
  lines.push("", "### 修改的文件");
  (auditData.filesModified || []).forEach(fm => lines.push("- `" + fm.path + "` -> " + (fm.change || "")));
  lines.push("", "## 3. SQL 执行记录");
  (auditData.sqlExecuted || []).forEach(sq => lines.push("- **[" + (sq.type || "SQL") + "]** `" + sq.sql + "`"));
  const issues = auditData.dataQualityIssues || [];
  if (issues.length > 0) {
    lines.push("", "## 4. 数据质量三指标分析", "");
    lines.push("| 表名 | 字段 | NULL率 | 空字符串率 | 哨兵值率 | 质量分 | 警告 |");
    lines.push("|------|------|--------|-----------|----------|--------|------|");
    issues.forEach(qi => lines.push("| " + qi.table + " | " + qi.column + " | " + ((qi.nullRatio||0)*100).toFixed(1) + "% | " + ((qi.emptyStringRatio||0)*100).toFixed(1) + "% | " + ((qi.sentinelValueRatio||0)*100).toFixed(1) + "% | " + (qi.qualityScore||1).toFixed(2) + " | " + (qi.warning||"正常") + " |"));
  }
  const s = auditData.summary || {};
  lines.push("", "## 5. 统计摘要", "");
  lines.push("- **技能数**: " + (s.totalSkills || 0));
  lines.push("- **工具数**: " + (s.totalTools || 0));
  lines.push("- **读取文件**: " + (s.totalFilesRead || 0));
  lines.push("- **修改文件**: " + (s.totalFilesModified || 0));
  lines.push("- **SQL执行**: " + (s.totalSqlExecuted || 0));
  lines.push("- **质量异常**: " + (s.totalQualityIssues || 0));
  return lines.join("\n");
}

function generateHtmlReport(auditData) {
  const title = escHtml(auditData.title || "执行审计报告");
  const s = auditData.summary || {};
  let h = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>' + title + '</title><style>';
  h += 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:960px;margin:2em auto;padding:0 1em;color:#1a1a2e;background:#f8f9fa;line-height:1.7}';
  h += 'h1{color:#0d6efd;border-bottom:2px solid #0d6efd;padding-bottom:.3em}';
  h += 'h2{color:#198754;margin-top:1.5em}';
  h += 'table{border-collapse:collapse;width:100%;margin:1em 0}';
  h += 'th,td{border:1px solid #dee2e6;padding:.5em;text-align:left}th{background:#e9ecef}';
  h += 'tr:nth-child(even){background:#f2f2f2}code{background:#e9ecef;padding:.2em .4em;border-radius:3px}';
  h += '.warning{color:#dc3545;font-weight:700}.normal{color:#198754}';
  h += '.summary{background:#e9ecef;padding:1em;border-radius:8px;margin:1em 0}';
  h += '</style></head><body>';
  h += '<h1>&#x1f504; ' + title + '</h1>';
  h += '<p><strong>会话ID:</strong> ' + escHtml(auditData.sessionId || "N/A") + '</p>';
  h += '<p><strong>时间戳:</strong> ' + escHtml(auditData.timestamp || "") + '</p>';
  h += '<p><strong>生成时间:</strong> ' + new Date().toISOString() + '</p>';
  h += '<h2>1. 技能与工具调用</h2><h3>加载的技能</h3><ul>';
  (auditData.skills || []).forEach(sk => { h += "<li>" + escHtml(sk) + "</li>"; });
  h += '</ul><h3>调用的工具</h3><ul>';
  (auditData.tools || []).forEach(t => { h += "<li><code>" + escHtml(t) + "</code></li>"; });
  h += '</ul><h2>2. 文件访问记录</h2><h3>读取的文件</h3><ul>';
  (auditData.filesRead || []).forEach(fr => { h += "<li>" + escHtml(fr.status || "[已有]") + " <code>" + escHtml(fr.path) + "</code></li>"; });
  h += '</ul><h3>修改的文件</h3><ul>';
  (auditData.filesModified || []).forEach(fm => { h += "<li><code>" + escHtml(fm.path) + "</code> &rarr; " + escHtml(fm.change || "") + "</li>"; });
  h += '</ul><h2>3. SQL执行记录</h2><ul>';
  (auditData.sqlExecuted || []).forEach(sq => { h += "<li><strong>[" + escHtml(sq.type || "SQL") + "]</strong> <code>" + escHtml(sq.sql) + "</code></li>"; });
  h += "</ul>";
  const issues = auditData.dataQualityIssues || [];
  if (issues.length > 0) {
    h += '<h2>4. 数据质量三指标分析</h2><table><tr><th>表名</th><th>字段</th><th>NULL率</th><th>空字符串率</th><th>哨兵值率</th><th>质量分</th><th>警告</th></tr>';
    issues.forEach(function(qi) {
      const wc = (qi.warning || "正常") !== "正常" ? "warning" : "normal";
      h += "<tr><td>" + escHtml(qi.table) + "</td><td>" + escHtml(qi.column) + "</td>";
      h += "<td>" + ((qi.nullRatio||0)*100).toFixed(1) + "%</td>";
      h += "<td>" + ((qi.emptyStringRatio||0)*100).toFixed(1) + "%</td>";
      h += "<td>" + ((qi.sentinelValueRatio||0)*100).toFixed(1) + "%</td>";
      h += "<td>" + (qi.qualityScore||1).toFixed(2) + "</td>";
      h += '<td class="' + wc + '">' + escHtml(qi.warning || "正常") + "</td></tr>";
    });
    h += "</table>";
  }
  h += '<h2>5. 统计摘要</h2><div class="summary">';
  h += "<p><strong>技能数:</strong> " + (s.totalSkills || 0) + "</p>";
  h += "<p><strong>工具数:</strong> " + (s.totalTools || 0) + "</p>";
  h += "<p><strong>读取文件:</strong> " + (s.totalFilesRead || 0) + "</p>";
  h += "<p><strong>修改文件:</strong> " + (s.totalFilesModified || 0) + "</p>";
  h += "<p><strong>SQL执行:</strong> " + (s.totalSqlExecuted || 0) + "</p>";
  h += "<p><strong>质量异常:</strong> " + (s.totalQualityIssues || 0) + "</p>";
  h += "</div></body></html>";
  return h;
}

// ========== 密码引号包裹与SHOW DATABASES指南 ==========
function passwordQuotingGuide() {
  return JSON.stringify({
    title: "MySQL密码含特殊字符的引号包裹方法",
    methods: [
      { method: "PowerShell单引号", desc: "密码含$时使用单引号避免变量解析", example: "java -cp .;mysql-connector.jar scripts.DatabaseQuery --password 'myP@ssw0rd!' --get-schema" },
      { method: "PowerShell双引号", desc: "无特殊PS变量符号时可用双引号", example: 'java -cp .;mysql-connector.jar scripts.DatabaseQuery --password "myP@ssw0rd!" --get-schema' },
      { method: "环境变量法(推荐)", desc: "通过环境变量传入避免shell解释", example: '$env:DB_PASSWORD = "fT85{6M6mx!+ro(r1_Nw9qU.1q1(#Dny"\njava -cp .;mysql-connector.jar scripts.DatabaseQuery --get-schema' },
      { method: "配置文件法(最安全)", desc: "密码保存在~/.java-mysql-query-config.json", example: "后续无需再传入密码参数" },
    ],
  }, null, 2);
}

function showDatabasesGuide() {
  return JSON.stringify({
    title: "SHOW DATABASES 快速列举所有库",
    commands: [
      { desc: "列出所有数据库", sql: "SHOW DATABASES;" },
      { desc: "切换目标数据库", sql: "USE <数据库名>;" },
      { desc: "通过DatabaseQuery执行", command: 'java -cp <skill目录>;<mysql-connector.jar> scripts.DatabaseQuery "SHOW DATABASES"' },
    ],
    useCases: ["多租户环境探索", "数据库盘点", "迁移前摸底"],
  }, null, 2);
}

// ========== 主入口 ==========
function main() {
  var args = process.argv.slice(2);
  var opts = {};
  for (var i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input": case "-i": opts.input = args[++i]; break;
      case "--stdin": opts.stdin = true; break;
      case "--format": case "-f": opts.format = args[++i]; break;
      case "--output": case "-o": opts.output = args[++i]; break;
      case "--title": case "-t": opts.title = args[++i]; break;
      case "--sample": opts.sample = true; break;
      case "--history": opts.history = true; break;
      case "--password-guide": opts.passwordGuide = true; break;
      case "--show-databases-guide": opts.showDatabasesGuide = true; break;
      case "--save-config": opts.saveConfig = args[++i]; break;
      case "--clear-config": opts.clearConfig = true; break;
      case "--help": case "-h":
        console.log("用法: node audit-report-generator.js [选项]");
        console.log("--input,-i <文件>    审计数据JSON文件");
        console.log("--stdin             从stdin读取审计数据");
        console.log("--format,-f <格式>  报告格式: json|markdown|html");
        console.log("--output,-o <文件>  输出文件路径");
        console.log("--title,-t <标题>   报告标题");
        console.log("--sample            生成示例审计报告");
        console.log("--history           查看历史审计记录");
        console.log("--password-guide    输出密码引号包裹指南");
        console.log("--show-databases-guide 输出SHOW DATABASES指南");
        console.log("--save-config       保存配置");
        console.log("--clear-config      清除配置");
        return;
    }
  }

  if (opts.saveConfig) {
    var cfg = {};
    opts.saveConfig.split(",").forEach(function(p) {
      var eq = p.indexOf("=");
      if (eq > 0) cfg[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
    });
    var config = loadConfig();
    Object.assign(config, cfg);
    saveConfig(config);
    console.log(JSON.stringify({ status: "config_saved", config: config }));
    return;
  }
  if (opts.clearConfig) {
    if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
    console.log(JSON.stringify({ status: "config_cleared" }));
    return;
  }
  if (opts.passwordGuide) { console.log(passwordQuotingGuide()); return; }
  if (opts.showDatabasesGuide) { console.log(showDatabasesGuide()); return; }
  if (opts.history) { console.log(JSON.stringify(readHistory(), null, 2)); return; }

  if (opts.stdin) {
    var chunks = [];
    process.stdin.on("data", function(c) { chunks.push(c); });
    process.stdin.on("end", function() {
      var raw = Buffer.concat(chunks).toString("utf-8").trim();
      if (!raw) { console.error("错误: stdin输入为空"); process.exit(1); }
      processAudit(JSON.parse(raw), opts);
    });
    return;
  }

  var auditData;
  if (opts.sample) auditData = generateSampleAuditData();
  else if (opts.input) auditData = JSON.parse(fs.readFileSync(opts.input, "utf-8"));
  else auditData = generateSampleAuditData();
  processAudit(auditData, opts);
}

function processAudit(auditData, opts) {
  auditData.title = auditData.title || opts.title || "执行审计报告";
  appendHistory(auditData);
  var fmt = opts.format || "markdown";
  var content;
  if (fmt === "json") content = generateJsonReport(auditData);
  else if (fmt === "html") content = generateHtmlReport(auditData);
  else content = generateMarkdownReport(auditData);
  if (opts.output) {
    fs.writeFileSync(opts.output, content, "utf-8");
    console.log(JSON.stringify({ status: "success", format: fmt, output: opts.output }));
  } else {
    console.log(content);
  }
}

if (require.main === module) main();

module.exports = {
  generateJsonReport, generateMarkdownReport, generateHtmlReport,
  analyzeDataQuality, generateSampleAuditData,
  passwordQuotingGuide, showDatabasesGuide,
  loadConfig, saveConfig,
};
