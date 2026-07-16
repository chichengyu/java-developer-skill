#!/usr/bin/env node
/**
 * Skill Bridge (Node.js 版)
 * 连接 java-mysql-query 与 java-superpowers-contract 的桥接工具。
 * 用法: node skill-bridge.js --db mydb --tables user order --output report.md
 */
const fs = require("fs");
const { execSync } = require("child_process");
const { MySQLQuery } = require("./database-query.js");
const path = require("path");

const QUALITY_WARN = { nullRatio: 0.2, emptyStringRatio: 0.3, sentinelValueRatio: 0.1 };

function convertAnalyzeToAudit(analyzeData, sessionId) {
  const analysis = analyzeData.analysis || analyzeData;
  const columns = analysis.columns || [];
  const tableName = analysis.table || "unknown";
  const qualityIssues = [];

  columns.forEach(col => {
    const warnings = [];
    const nr = parseFloat(col.nullRatio) || 0;
    const esr = parseFloat(col.emptyStringRatio) || 0;
    const svr = parseFloat(col.sentinelValueRatio) || 0;
    if (nr > QUALITY_WARN.nullRatio) warnings.push(`NULL率(${(nr*100).toFixed(1)}%)偏高`);
    if (esr > QUALITY_WARN.emptyStringRatio) warnings.push(`空字符串率(${(esr*100).toFixed(1)}%)过高`);
    if (svr > QUALITY_WARN.sentinelValueRatio) warnings.push(`哨兵值率(${(svr*100).toFixed(1)}%)异常`);
    const qs = Math.max(0, 1 - Math.min(nr*0.4,0.4) - Math.min(esr*0.3,0.3) - Math.min(svr*0.3,0.3));
    qualityIssues.push({
      table: tableName, column: col.name || "unknown",
      nullRatio: Math.round(nr*10000)/10000,
      emptyStringRatio: Math.round(esr*10000)/10000,
      sentinelValueRatio: Math.round(svr*10000)/10000,
      qualityScore: Math.round(qs*10000)/10000,
      warning: warnings.length > 0 ? warnings.join("; ") : "正常"
    });
  });

  return {
    sessionId: sessionId || `bridge_${Date.now()}`,
    timestamp: new Date().toISOString(),
    title: `数据质量审计 - ${tableName}`,
    skills: ["java-mysql-query [已有]", "java-superpowers-contract [已有]"],
    tools: ["DatabaseQuery", "SkillBridge"],
    filesRead: [], filesModified: [], sqlExecuted: [],
    dataQualityIssues: qualityIssues,
    summary: {
      totalSkills: 2, totalTools: 2, totalFilesRead: 0,
      totalFilesModified: 0, totalSqlExecuted: 0,
      totalQualityIssues: qualityIssues.filter(q => q.warning !== "正常").length
    }
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { host: "localhost", port: "3306", user: "root", auditFormat: "markdown", output: "combined_report" };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--analyze-result": opts.analyzeResult = args[++i]; break;
      case "--db": opts.db = args[++i]; break;
      case "--tables": opts.tables = []; while (i+1 < args.length && !args[i+1].startsWith("--")) opts.tables.push(args[++i]); break;
      case "--audit-output": opts.auditOutput = args[++i]; break;
      case "--audit-format": opts.auditFormat = args[++i]; break;
      case "--output": opts.output = args[++i]; break;
      case "--host": opts.host = args[++i]; break;
      case "--port": opts.port = args[++i]; break;
      case "--user": opts.user = args[++i]; break;
      case "--password": opts.password = args[++i]; break;
    }
  }
  return opts;
}

function run(opts) {
  if (opts.analyzeResult) {
    const raw = fs.readFileSync(opts.analyzeResult, "utf-8");
    const analyzeData = JSON.parse(raw);
    const auditData = convertAnalyzeToAudit(analyzeData);
    const auditPath = opts.auditOutput || "audit_input.json";
    fs.writeFileSync(auditPath, JSON.stringify(auditData, null, 2));
    const reportPath = `${opts.output}.${opts.auditFormat}`;
    execSync(`node scripts/audit-report-generator.js --input "${auditPath}" --format ${opts.auditFormat} --output "${reportPath}"`, { shell: true });
    console.log(JSON.stringify({ status: "success", auditData: auditPath, report: reportPath }));
  } else if (opts.db && opts.tables) {
    const allIssues = [];
    opts.tables.forEach(table => {
      const cmd = `python database_query.py --host ${opts.host} --port ${opts.port} --db ${opts.db} --user ${opts.user}${opts.password ? " --password " + opts.password : ""} --analyze-table ${table}`;
      const out = execSync(cmd, { timeout: 120000, shell: true }).toString();
      const data = JSON.parse(out);
      const audit = convertAnalyzeToAudit(data, `bridge_${table}`);
      allIssues.push(...audit.dataQualityIssues);
    });
    const combined = {
      sessionId: `bridge_${Date.now()}`, timestamp: new Date().toISOString(),
      title: `数据质量审计 - ${opts.tables.join(", ")}`,
      skills: ["java-mysql-query [已有]", "java-superpowers-contract [已有]"],
      tools: ["DatabaseQuery", "SkillBridge"], filesRead: [], filesModified: [], sqlExecuted: [],
      dataQualityIssues: allIssues,
      summary: { totalSkills: 2, totalTools: 2, totalFilesRead: 0, totalFilesModified: 0,
                 totalSqlExecuted: 0, totalQualityIssues: allIssues.filter(q => q.warning !== "正常").length }
    };
    const auditPath = opts.auditOutput || "audit_input.json";
    fs.writeFileSync(auditPath, JSON.stringify(combined, null, 2));
    const reportPath = `${opts.output}.${opts.auditFormat}`;
    execSync(`node scripts/audit-report-generator.js --input "${auditPath}" --format ${opts.auditFormat} --output "${reportPath}"`, { shell: true });
    console.log(JSON.stringify({ status: "success", tables: opts.tables, issues: allIssues.length, report: reportPath }));
  } else {
    console.log("用法: --analyze-result <file> | --db <name> --tables <t1> [t2 ...]");
  }
}
run(parseArgs());
