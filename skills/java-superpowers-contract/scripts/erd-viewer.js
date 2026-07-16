#!/usr/bin/env node
/**
 * ERD Viewer (Node.js 版)
 * 从 DatabaseQuery --get-relations 输出生成可视化关系图 HTML。
 * 用法: node erd-viewer.js --db mydb
 *       node erd-viewer.js --input relations.json --output erd.html
 */
const fs = require("fs");
const { execSync } = require("child_process");
const { MySQLQuery } = require("./database-query.js");
const path = require("path");

const RULE_MAP = { 0: "RESTRICT", 1: "CASCADE", 2: "SET NULL", 3: "NO ACTION", 4: "SET DEFAULT" };

function fetchRelations(host, port, db, user, password) {
  const cmd = `python database_query.py --host ${host} --port ${port} --db ${db} --user ${user}${password ? " --password " + password : ""} --get-relations`;
  const out = execSync(cmd, { timeout: 60000, shell: true }).toString();
  return JSON.parse(out);
}

function generateHtml(relationsData, dbName) {
  const rels = relationsData.relations || [];
  let mermaidErd = relationsData.mermaidErd || "erDiagram\n  %% No relationships";
  mermaidErd = mermaidErd.replace(/\\n/g, "\n").replace(/\\"/g, '"');

  const tables = new Set();
  const rows = rels.map(r => {
    tables.add(r.parentTable || ""); tables.add(r.childTable || "");
    const up = RULE_MAP[r.updateRule] || r.updateRule || "";
    const de = RULE_MAP[r.deleteRule] || r.deleteRule || "";
    return `<tr><td><code>${r.constraintName || ""}</code></td><td>${r.parentTable || ""}</td><td><code>${r.parentColumn || ""}</code></td><td>${r.childTable || ""}</td><td><code>${r.childColumn || ""}</code></td><td>${up}</td><td>${de}</td></tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>数据库关系图 - ${dbName}</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:1200px;margin:2em auto;padding:0 1em;color:#1a1a2e;background:#f8f9fa}
h1{color:#0d6efd;border-bottom:2px solid #0d6efd;padding-bottom:.3em}
h2{color:#198754;margin-top:1.5em}
.mermaid{background:#fff;padding:1em;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
table{border-collapse:collapse;width:100%;margin:1em 0}
th,td{border:1px solid #dee2e6;padding:.5em;text-align:left}
th{background:#e9ecef}tr:nth-child(even){background:#f2f2f2}
code{background:#e9ecef;padding:.2em .4em;border-radius:3px}
.stats{background:#e9ecef;padding:1em;border-radius:8px;margin:1em 0}
</style></head><body>
<h1>&#x1f517; 数据库关系图 - ${dbName}</h1>
<p><strong>关系数:</strong> ${rels.length} | <strong>表数:</strong> ${tables.size} | <strong>生成时间:</strong> ${new Date().toISOString()}</p>
<h2>ER 图</h2><div class="mermaid">${mermaidErd}</div>
<h2>外键关系明细</h2>
<table><thead><tr><th>外键名</th><th>父表</th><th>父列</th><th>子表</th><th>子列</th><th>更新规则</th><th>删除规则</th></tr></thead><tbody>${rows}</tbody></table>
<div class="stats"><p><strong>表总数:</strong> ${tables.size} | <strong>外键约束数:</strong> ${rels.length}</p></div>
<script>mermaid.initialize({startOnLoad:true,theme:"default"})</script>
</body></html>`;
}

function parseArgs() {
  const a = process.argv.slice(2);
  const opts = { host: "localhost", port: "3306", user: "root", ssl: "false", output: "erd_view.html" };
  for (let i = 0; i < a.length; i++) {
    switch (a[i]) {
      case "--host": opts.host = a[++i]; break;
      case "--port": opts.port = a[++i]; break;
      case "--db": opts.db = a[++i]; break;
      case "--user": opts.user = a[++i]; break;
      case "--password": opts.password = a[++i]; break;
      case "--ssl": opts.ssl = a[++i]; break;
      case "--input": opts.input = a[++i]; break;
      case "--output": case "-o": opts.output = a[++i]; break;
    }
  }
  return opts;
}

function run() {
  const opts = parseArgs();
  if (opts.input) {
    const raw = fs.readFileSync(opts.input, "utf-8");
    const data = JSON.parse(raw);
    const rd = data.relations || data;
    const dbName = rd.database || "unknown";
    const html = generateHtml(rd, dbName);
    fs.writeFileSync(opts.output, html, "utf-8");
    console.log(JSON.stringify({ status: "success", output: opts.output, relations: (rd.relations || []).length }));
  } else if (opts.db) {
    const result = fetchRelations(opts.host, opts.port, opts.db, opts.user, opts.password);
    const rd = result.relations || result;
    const html = generateHtml(rd, opts.db);
    fs.writeFileSync(opts.output, html, "utf-8");
    console.log(JSON.stringify({ status: "success", output: opts.output, relations: (rd.relations || []).length }));
  } else {
    console.log("用法: node erd-viewer.js --db mydb [--output erd.html]");
  }
}
run();
