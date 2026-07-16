#!/usr/bin/env node
/**
 * DatabaseQuery Node.js Wrapper
 * 包装 DatabaseQuery.java 的全部 CLI 接口，提供 Node.js 原生调用体验。
 * 用法：
 *   node database-query.js --db mydb --get-schema
 *   node database-query.js --db mydb "SELECT * FROM user"
 *   node database-query.js --db mydb --analyze-table user
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function buildJavaCmd(args, extraArgs) {
  const cp = process.env.DBQUERY_CP || ".;mysql-connector-j-8.3.0.jar";
  const cmd = ["java", "-cp", cp, "scripts.DatabaseQuery",
    "--host", args.host, "--port", String(args.port),
    "--db", args.db, "--user", args.user];
  const pwd = args.password || process.env.DB_PASSWORD || "";
  if (pwd) cmd.push("--password", pwd);
  if (args.ssl) cmd.push("--ssl", args.ssl);
  if (extraArgs) cmd.push(...extraArgs);
  return cmd;
}

function parseArgs() {
  const a = process.argv.slice(2);
  const opts = { host: "localhost", port: 3306, db: process.env.DB_NAME || "glo-trade-test_copy",
                 user: "root", password: "", ssl: "false", timeout: 120, format: "json" };
  let sql = [], extra = [];
  for (let i = 0; i < a.length; i++) {
    switch (a[i]) {
      case "--host": opts.host = a[++i]; break;
      case "--port": opts.port = parseInt(a[++i]); break;
      case "--db": opts.db = a[++i]; break;
      case "--user": opts.user = a[++i]; break;
      case "--password": opts.password = a[++i]; break;
      case "--ssl": opts.ssl = a[++i]; break;
      case "--format": opts.format = a[++i]; break;
      case "--output": case "-o": opts.output = a[++i]; break;
      case "--get-schema": extra.push("--get-schema"); break;
      case "--analyze-all": extra.push("--analyze-all"); break;
      case "--analyze-table": extra.push("--analyze-table", a[++i]); break;
      case "--get-relations": extra.push("--get-relations"); break;
      case "--explain": extra.push("--explain", a[++i]); break;
      case "--export-csv": extra.push("--export-csv", a[++i]); break;
      case "--save-config": extra.push("--save-config"); break;
      case "--clear-config": extra.push("--clear-config"); break;
      default: sql.push(a[i]);
    }
  }
  if (sql.length > 0) extra.push(sql.join(" "));
  opts.extra = extra;
  return opts;
}

function run() {
  const opts = parseArgs();
  if (opts.extra.length === 0) { console.log("用法: --get-schema | --analyze-table <表名> | <SQL语句> | ..."); return; }
  const cmd = buildJavaCmd(opts, opts.extra);
  try {
    const out = execSync(cmd.join(" "), { timeout: opts.timeout * 1000, shell: true, stdio: ["pipe", "pipe", "pipe"] }).toString();
    if (opts.output) {
      fs.writeFileSync(opts.output, out);
      console.log("结果已保存到 " + opts.output);
    } else {
      console.log(out.trim());
    }
  } catch (e) {
    console.error(JSON.stringify({ status: "error", message: e.message }));
  }
}
run();
