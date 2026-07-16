#!/usr/bin/env node
/**
 * Table Dependency Analyzer (Node.js 版)
 * 从外键约束构建表依赖关系图：拓扑层级、循环依赖检测、影响链分析、可视化HTML。
 * 用法: node table-dependency.js --db mydb --output deps.html
 */
const fs = require("fs");
const { execSync } = require("child_process");
const { MySQLQuery } = require("./database-query.js");
const path = require("path");

function buildGraph(relations) {
  const graph = {}, reverse = {}, tables = new Set();
  relations.forEach(r => {
    const p = r.parentTable, c = r.childTable;
    if (p && c) {
      if (!graph[c]) graph[c] = new Set();
      if (!reverse[p]) reverse[p] = new Set();
      graph[c].add(p); reverse[p].add(c);
      tables.add(p); tables.add(c);
    }
  });
  return { graph, reverse, tables };
}

function topologicalLevels(graph, reverse, tables) {
  const inDegree = {}, levels = {};
  tables.forEach(t => inDegree[t] = (graph[t] || new Set()).size);
  const queue = [...tables].filter(t => inDegree[t] === 0);
  let level = 0;
  while (queue.length > 0) {
    let len = queue.length;
    for (let i = 0; i < len; i++) {
      const t = queue.shift();
      levels[t] = level;
      (reverse[t] || new Set()).forEach(dep => {
        inDegree[dep]--;
        if (inDegree[dep] === 0) queue.push(dep);
      });
    }
    level++;
  }
  tables.forEach(t => { if (!(t in levels)) levels[t] = -1; });
  return levels;
}

function detectCycles(graph, tables) {
  const color = {}, path = [], cycles = [];
  tables.forEach(t => color[t] = 0);
  function dfs(node) {
    color[node] = 1; path.push(node);
    (graph[node] || new Set()).forEach(dep => {
      if (color[dep] === 1) {
        const idx = path.indexOf(dep);
        cycles.push([...path.slice(idx), dep]);
      } else if (color[dep] === 0) dfs(dep);
    });
    path.pop(); color[node] = 2;
  }
  tables.forEach(t => { if (color[t] === 0) dfs(t); });
  return cycles;
}

function generateHtml(dbName, graph, reverse, levels, cycles, relations) {
  const tables = new Set(); Object.keys(levels).forEach(t => tables.add(t));
  const cycleTables = new Set();
  cycles.forEach(c => c.forEach(t => cycleTables.add(t)));

  const mermaidLines = ["graph TD"];
  tables.forEach(t => {
    const safe = t.replace(/-/g, "_");
    mermaidLines.push(`  ${safe}["${cycleTables.has(t) ? "⚠️ " : ""}${t}"]`);
  });
  Object.keys(graph).forEach(child => {
    graph[child].forEach(parent => {
      mermaidLines.push(`  ${child.replace(/-/g, "_")} --> ${parent.replace(/-/g, "_")}`);
    });
  });

  const maxLevel = Math.max(...Object.values(levels), 0);
  const levelDist = {}; Object.values(levels).forEach(l => levelDist[l] = (levelDist[l] || 0) + 1);

  let depRows = "", impactRows = "";
  Object.keys(levels).sort((a,b) => (levels[a]||0) - (levels[b]||0) || a.localeCompare(b)).forEach(t => {
    const l = levels[t] || 0;
    const parents = graph[t] || new Set();
    const children = reverse[t] || new Set();
    const downstream = new Set();
    const stack = [...children];
    while (stack.length > 0) { const n = stack.pop(); if (!downstream.has(n)) { downstream.add(n); (reverse[n]||new Set()).forEach(x => stack.push(x)); } }
    const lvlStr = l >= 0 ? `L${l}` : "CYCLE";
    const rowCls = l < 0 ? "circular" : `level-${Math.min(l,3)}`;
    const chain = parents.size > 0 ? [...parents].join(" &rarr; ") : "孤立表";
    depRows += `<tr class="${rowCls}"><td>${l < 0 ? "⚠️ " : ""}${t}</td><td>${lvlStr}</td><td>${parents.size}</td><td>${children.size}</td><td>${downstream.size}张表</td><td><code>${chain}</code></td></tr>`;
    const imp = downstream.size > 0 ? [...downstream].join(" &rarr; ") : "无下游依赖";
    impactRows += `<tr class="${rowCls}"><td>${l < 0 ? "⚠️ " : ""}${t}</td><td>${lvlStr}</td><td><code>${imp}</code></td></tr>`;
  });

  const cycleHtml = cycles.length > 0 ? cycles.map(c => `<p class="circular">⚠️ 环形依赖: ${c.join(" → ")}</p>`).join("\n") : '<p>✅ 未检测到环形依赖</p>';

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>表依赖关系图 - ${dbName}</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:1200px;margin:2em auto;padding:0 1em;color:#1a1a2e;background:#f8f9fa}
h1{color:#0d6efd;border-bottom:2px solid #0d6efd}h2{color:#198754;margin-top:1.5em}
.mermaid{background:#fff;padding:1em;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);overflow:auto}
table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #dee2e6;padding:.5em;text-align:left}
th{background:#e9ecef}tr:nth-child(even){background:#f2f2f2}
code{background:#e9ecef;padding:.2em .4em;border-radius:3px}
.stats{background:#e9ecef;padding:1em;border-radius:8px}
.level-0{background:#d4edda}.level-1{background:#fff3cd}.level-2{background:#f8d7da}.level-3{background:#cce5ff}
.circular{color:#dc3545;font-weight:700}
.summary-card{display:inline-block;padding:.5em 1em;margin:.3em;border-radius:6px;font-size:.85em}
</style></head><body>
<h1>&#x1f517; 表依赖关系图 - ${dbName}</h1>
<p><strong>表总数:</strong> ${Object.keys(levels).length} | <strong>外键约束:</strong> ${relations.length} | <strong>拓扑层级:</strong> ${maxLevel + 1}层 | <strong>环形依赖:</strong> ${cycles.length > 0 ? "⚠️ " + cycles.length + "处" : "✅ 无"}</p>
<div class="summary-card level-0">Leaf层(0): ${levelDist[0] || 0}表</div>
<div class="summary-card level-1">中间层(1): ${levelDist[1] || 0}表</div>
<h2>依赖关系图 (DAG)</h2><div class="mermaid">${mermaidLines.join("\n")}</div>
<h2>表依赖明细</h2><table><thead><tr><th>表名</th><th>层级</th><th>依赖父表数</th><th>被依赖子表数</th><th>影响范围</th><th>依赖链</th></tr></thead><tbody>${depRows}</tbody></table>
<h2>环形依赖检测</h2>${cycleHtml}
<h2>影响分析</h2><table><thead><tr><th>表名</th><th>层级</th><th>修改影响</th></tr></thead><tbody>${impactRows}</tbody></table>
<div class="stats"><p>生成时间: ${new Date().toISOString()} | 分析引擎: TableDependency</p></div>
<script>mermaid.initialize({startOnLoad:true,theme:"default",flowchart:{useMaxWidth:true}})</script></body></html>`;
}

function parseArgs() {
  const a = process.argv.slice(2);
  const opts = { host: "localhost", port: "3306", user: "root", ssl: "false", output: "table_deps.html" };
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
  if (!opts.input && !opts.db) { console.log("用法: --db mydb | --input relations.json --output deps.html"); return; }
  
  let raw, dbName, relations;
  if (opts.input) {
    raw = JSON.parse(fs.readFileSync(opts.input, "utf-8"));
    dbName = raw.database || opts.db || "unknown";
    relations = raw.relations || (Array.isArray(raw) ? raw : []);
  } else {
    const cmd = `python database_query.py --host ${opts.host} --port ${opts.port} --db ${opts.db} --user ${opts.user}${opts.password ? " --password " + opts.password : ""} --ssl ${opts.ssl} --get-relations`;
    const out = execSync(cmd, { timeout: 60000, shell: true }).toString();
    raw = JSON.parse(out);
    dbName = opts.db;
    relations = raw.relations || [];
  }

  const { graph, reverse, tables } = buildGraph(relations);
  const levels = topologicalLevels(graph, reverse, tables);
  const cycles = detectCycles(graph, tables);
  const html = generateHtml(dbName, graph, reverse, levels, cycles, relations);
  fs.writeFileSync(opts.output, html, "utf-8");
  console.log(JSON.stringify({ status: "success", output: opts.output, tables: Object.keys(levels).length, fks: relations.length, cycles: cycles.length }));
}
run();
