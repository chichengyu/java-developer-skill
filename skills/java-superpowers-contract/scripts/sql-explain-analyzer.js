#!/usr/bin/env node
/**
 * SQL Explain Analyzer (Node.js 版)
 * 分析 MySQL 查询执行计划，识别性能瓶颈。
 * 用法: node sql-explain-analyzer.js --db mydb "SELECT * FROM user"
 */
const fs = require("fs");
const { execSync } = require("child_process");
const { MySQLQuery } = require("./database-query.js");

function analyzeExplain(explainData) {
  const issues = [];
  if (explainData && typeof explainData === "object") {
    if (explainData.type === "ALL") issues.push("全表扫描 (type=ALL): 需要添加索引");
    const extra = (explainData.Extra || "").toString();
    if (extra.includes("Using temporary")) issues.push("使用了临时表: 考虑优化GROUP/ORDER BY");
    if (extra.includes("Using filesort")) issues.push("使用了文件排序: 需要添加排序索引");
    if (!explainData.key && explainData.possible_keys) issues.push(`存在可能索引但未使用: ${explainData.possible_keys}`);
  }
  return issues;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { host: "localhost", port: "3306", user: "root", ssl: "false" };
  let sql = "";
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--host": opts.host = args[++i]; break;
      case "--port": opts.port = args[++i]; break;
      case "--db": opts.db = args[++i]; break;
      case "--user": opts.user = args[++i]; break;
      case "--password": opts.password = args[++i]; break;
      case "--ssl": opts.ssl = args[++i]; break;
      case "--input": opts.input = args[++i]; break;
      default: sql = (sql ? sql + " " : "") + args[i];
    }
  }
  opts.sql = sql;
  return opts;
}

function run(opts) {
  if (opts.input) {
    const content = fs.readFileSync(opts.input, "utf-8");
    content.split("\n").forEach(line => {
      if (/(SELECT|INSERT|UPDATE|DELETE)\s/i.test(line)) {
        console.log(`分析: ${line.trim().slice(0, 80)}...`);
      }
    });
    return;
  }
  if (opts.sql) {
    const cmd = `python database_query.py --host ${opts.host} --port ${opts.port} --db ${opts.db} --user ${opts.user}${opts.password ? " --password " + opts.password : ""} --ssl ${opts.ssl} --explain "${opts.sql.replace(/"/g, '\\"')}"`;
    try {
      const out = execSync(cmd, { timeout: 30000, shell: true }).toString();
      console.log(JSON.stringify(JSON.parse(out), null, 2));
    } catch (e) { console.error("执行失败:", e.message); }
  } else {
    console.log("用法: node sql-explain-analyzer.js --db mydb [--host localhost] [--port 3306] \"SELECT * FROM table\"");
  }
}

run(parseArgs());
