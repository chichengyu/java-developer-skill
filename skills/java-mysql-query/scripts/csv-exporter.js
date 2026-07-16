#!/usr/bin/env node
/**
 * CSV Exporter (Node.js 版)
 * 将 SQL 查询结果导出为 CSV 文件。
 * 用法: node csv-exporter.js --db mydb "SELECT * FROM user" --output users.csv
 */
const fs = require("fs");
const { execSync } = require("child_process");
const { MySQLQuery } = require("./database-query.js");
const path = require("path");

function toCsv(data) {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const lines = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",")];
  data.forEach(row => {
    lines.push(headers.map(h => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { host: "localhost", port: "3306", user: "root", output: "export.csv", ssl: "false" };
  let sql = "";
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--host": opts.host = args[++i]; break;
      case "--port": opts.port = args[++i]; break;
      case "--db": opts.db = args[++i]; break;
      case "--user": opts.user = args[++i]; break;
      case "--password": opts.password = args[++i]; break;
      case "--ssl": opts.ssl = args[++i]; break;
      case "--output": case "-o": opts.output = args[++i]; break;
      case "--input": opts.input = args[++i]; break;
      default: sql = (sql ? sql + " " : "") + args[i];
    }
  }
  opts.sql = sql;
  return opts;
}

function run(opts) {
  if (opts.input) {
    const raw = fs.readFileSync(opts.input, "utf-8");
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : (data.data || [data]);
    const csv = toCsv(arr);
    fs.writeFileSync(opts.output, "\ufeff" + csv, "utf-8");
    console.log(JSON.stringify({ status: "success", output: opts.output, rows: arr.length }));
  } else if (opts.sql) {
    const cmd = `python database_query.py --host ${opts.host} --port ${opts.port} --db ${opts.db} --user ${opts.user}${opts.password ? " --password " + opts.password : ""} --ssl ${opts.ssl} --export-csv "${opts.sql.replace(/"/g, '\\"')}" --output "${opts.output}"`;
    try {
      const out = execSync(cmd, { timeout: 60000, shell: true }).toString();
      console.log(out.trim());
    } catch (e) { console.error(JSON.stringify({ status: "error", message: e.message })); }
  } else {
    console.log("用法: node csv-exporter.js --db mydb [--output file.csv] \"SELECT * FROM table\"");
  }
}
run(parseArgs());
