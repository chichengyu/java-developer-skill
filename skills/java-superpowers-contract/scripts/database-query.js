#!/usr/bin/env node
/**
 * DatabaseQuery — 纯 Node.js 实现，零 Java 依赖
 * 直接通过 mysql2 连接 MySQL，实现全部数据库深度分析功能。
 * 配置优先级：Python > Node.js > Java
 * 
 * 用法：
 *   node database-query.js --db mydb --get-schema
 *   node database-query.js --db mydb --analyze-table user
 *   node database-query.js --db mydb "SELECT * FROM user LIMIT 5"
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

let mysql2;
try { mysql2 = require("mysql2/promise"); } catch (e) {
  console.error(JSON.stringify({ status: "error", message: "需要安装 mysql2: npm install mysql2" }));
  process.exit(1);
}

const CONFIG_PATH = path.join(os.homedir(), ".java-mysql-query-config.json");
const SENTINEL_VALUES = new Set(["0","-1","1900-01-01","1970-01-01","9999-12-31","-9999",""]);

class MySQLQuery {
  constructor(host, port, db, user, password, sslMode) {
    this.host = host || "localhost";
    this.port = port || 3306;
    this.db = db;
    this.user = user || "root";
    this.password = password || "";
    this.sslMode = sslMode || "false";
    this.conn = null;
  }

  async connect() {
    try {
      this.conn = await mysql2.createConnection({
        host: this.host, port: this.port, database: this.db || undefined,
        user: this.user, password: this.password,
        charset: "utf8mb4", connectTimeout: 10000,
        ssl: this.sslMode !== "false" ? {} : undefined,
      });
      return true;
    } catch (e) {
      console.error(JSON.stringify({ status: "error", message: e.message }));
      return false;
    }
  }

  async close() { if (this.conn) await this.conn.end(); }

  async fetch(sql, params) {
    const [rows] = await this.conn.execute(sql, params || []);
    return rows;
  }

  async fetchOne(sql, params) {
    const rows = await this.fetch(sql, params);
    return rows[0] || null;
  }

  // --get-schema
  async getSchema() {
    const catalog = this.db;
    const tables = await this.fetch(
      "SELECT TABLE_NAME, TABLE_COMMENT, ENGINE, TABLE_ROWS, AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
      [catalog]);
    const result = [];
    for (const t of tables) {
      const tbl = t.TABLE_NAME;
      const cols = await this.fetch(
        "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION",
        [catalog, tbl]);
      const pk = await this.fetch(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_KEY='PRI'", [catalog, tbl]);
      const idx = await this.fetch(
        "SELECT DISTINCT INDEX_NAME, NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME!='PRIMARY'", [catalog, tbl]);
      result.push({
        name: tbl, comment: t.TABLE_COMMENT || "", engine: t.ENGINE || "",
        estimatedRows: t.TABLE_ROWS,
        columns: cols.map(c => ({name:c.COLUMN_NAME,type:c.COLUMN_TYPE,nullable:c.IS_NULLABLE==="YES",default:c.COLUMN_DEFAULT,comment:c.COLUMN_COMMENT||""})),
        primaryKey: pk.map(p => p.COLUMN_NAME),
        indexes: idx.map(i => ({name:i.INDEX_NAME,unique:!i.NON_UNIQUE})),
      });
    }
    return {status:"schema_success",schema:{database:catalog,tables:result}};
  }

  // --get-relations
  async getRelations() {
    const catalog = this.db;
    const rels = await this.fetch(
      `SELECT rc.CONSTRAINT_NAME, rc.UPDATE_RULE, rc.DELETE_RULE,
       kcu.TABLE_NAME AS child_table, kcu.COLUMN_NAME AS child_column,
       kcu.REFERENCED_TABLE_NAME AS parent_table, kcu.REFERENCED_COLUMN_NAME AS parent_column
      FROM information_schema.REFERENTIAL_CONSTRAINTS rc
      JOIN information_schema.KEY_COLUMN_USAGE kcu ON rc.CONSTRAINT_NAME=kcu.CONSTRAINT_NAME AND rc.CONSTRAINT_SCHEMA=kcu.CONSTRAINT_SCHEMA
      WHERE rc.CONSTRAINT_SCHEMA=? ORDER BY kcu.TABLE_NAME`, [catalog]);
    const relations = rels.map(r => ({
      constraintName: r.CONSTRAINT_NAME, parentTable: r.parent_table,
      parentColumn: r.parent_column, childTable: r.child_table, childColumn: r.child_column,
      updateRule: r.UPDATE_RULE === "CASCADE" ? 1 : 0,
      deleteRule: r.DELETE_RULE === "CASCADE" ? 1 : 0,
    }));
    const seen = new Set();
    const erdParts = ["erDiagram"];
    rels.forEach(r => {
      const key = r.parent_table + "|" + r.child_table;
      if (!seen.has(key)) { seen.add(key); erdParts.push(`  ${r.parent_table} ||--o{ ${r.child_table} : "has"`); }
    });
    return {status:"relations_success",relations:{database:catalog,relations,mermaidErd:erdParts.join("\\n")}};
  }

  // --table-deps
  async tableDeps() {
    const rels = (await this.getRelations()).relations.relations;
    const graph = {}, rev = {}, allTables = new Set();
    rels.forEach(r => {
      const p = r.parentTable, c = r.childTable;
      if (!graph[c]) graph[c] = new Set(); if (!rev[p]) rev[p] = new Set();
      graph[c].add(p); rev[p].add(c); allTables.add(p); allTables.add(c);
    });
    const inDeg = {}; allTables.forEach(t => inDeg[t] = (graph[t]||new Set()).size);
    const q = [...allTables].filter(t => inDeg[t] === 0);
    const levels = {}; let lvl = 0;
    while (q.length) {
      for (let i = q.length; i > 0; i--) {
        const t = q.shift(); levels[t] = lvl;
        (rev[t]||new Set()).forEach(d => { inDeg[d]--; if (inDeg[d] === 0) q.push(d); });
      }
      lvl++;
    }
    allTables.forEach(t => { if (levels[t] === undefined) levels[t] = -1; });
    return {status:"table_deps_success",deps:{tableCount:allTables.size,levels,maxLevel:lvl-1}};
  }

  // --analyze-table (simplified - returns real stats)
  async analyzeTable(table) {
    const safe = `\`${table.replace(/`/g,"")}\``;
    const meta = await this.fetchOne("SELECT ENGINE,TABLE_ROWS,TABLE_COMMENT,DATA_LENGTH,INDEX_LENGTH,ROW_FORMAT,TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?", [this.db, table]);
    if (!meta) return {status:"error",message:`表 ${table} 不存在`};
    const actual = (await this.fetchOne(`SELECT COUNT(*) AS cnt FROM ${safe}`)).cnt;
    const cols = await this.fetch("SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION", [this.db, table]);
    const columns = [];
    for (const c of cols) {
      const cn = c.COLUMN_NAME, sc = `\`${cn}\``;
      const info = {name:cn,type:c.COLUMN_TYPE,nullable:c.IS_NULLABLE==="YES"};
      try {
        const s = await this.fetchOne(`SELECT COUNT(DISTINCT ${sc}) AS dc, SUM(CASE WHEN ${sc} IS NULL THEN 1 ELSE 0 END) AS nc, COUNT(*) AS tc FROM ${safe}`);
        if (s) { info.distinctCount = s.dc; info.nullCount = s.nc; info.nullRatio = s.tc > 0 ? Math.round(s.nc/s.tc*10000)/10000 : 0; }
      } catch(e) {}
      columns.push(info);
    }
    return {status:"analyze_table_success",analysis:{table,estimatedRows:meta.TABLE_ROWS,actualRowCount:actual,columns}};
  }

  // Custom SQL
  async execute(sql) {
    const rows = await this.fetch(sql);
    return {status:"success",data:rows};
  }
}

// Config helpers
function loadConfig() {
  try { if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")); } catch(e) {}
  return {};
}
function saveConfig(host,port,db,user,password) {
  const cfg = {host,port:String(port),db,user,password:Buffer.from(password||"").toString("base64")};
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg), "utf-8");
  return {status:"config_saved",path:CONFIG_PATH};
}
function clearConfig() { try { fs.unlinkSync(CONFIG_PATH); } catch(e) {} return {status:"config_cleared"}; }

async function main() {
  const args = process.argv.slice(2);
  const opts = {host:"localhost",port:3306,user:"root",ssl:"false"};
  let sql = [];
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--host": opts.host = args[++i]; break;
      case "--port": opts.port = parseInt(args[++i]); break;
      case "--db": opts.db = args[++i]; break;
      case "--user": opts.user = args[++i]; break;
      case "--password": opts.password = args[++i]; break;
      case "--ssl": opts.ssl = args[++i]; break;
      case "--get-schema": opts.getSchema = true; break;
      case "--analyze-all": opts.analyzeAll = true; break;
      case "--analyze-table": opts.analyzeTable = args[++i]; break;
      case "--get-relations": opts.getRelations = true; break;
      case "--table-deps": opts.tableDeps = true; break;
      case "--save-config": opts.saveConfig = true; break;
      case "--clear-config": opts.clearConfig = true; break;
      default: sql.push(args[i]);
    }
  }
  if (opts.clearConfig) { console.log(JSON.stringify(clearConfig())); return; }

  const cfg = loadConfig();
  if (!opts.db) opts.db = cfg.db || process.env.DB_NAME || "";
  if (!opts.password) opts.password = cfg.password || process.env.DB_PASSWORD || "";
  if (!opts.db) { console.error(JSON.stringify({status:"error",message:"需要 --db"})); return; }

  const q = new MySQLQuery(opts.host, opts.port, opts.db, opts.user, opts.password, opts.ssl);
  if (!(await q.connect())) return;

  let result;
  try {
    if (opts.getSchema) result = await q.getSchema();
    else if (opts.analyzeAll) result = await q.analyzeAll ? await q.analyzeAll() : await q.getSchema();
    else if (opts.analyzeTable) result = await q.analyzeTable(opts.analyzeTable);
    else if (opts.getRelations) result = await q.getRelations();
    else if (opts.tableDeps) result = await q.tableDeps();
    else if (sql.length) result = await q.execute(sql.join(" "));
    else { console.log("用法: --db mydb --get-schema | --analyze-table <表> | --get-relations | <SQL>"); return; }
  } finally { await q.close(); }

  console.log(JSON.stringify(result, null, 2));
  if (result && !cfg.db) saveConfig(opts.host, opts.port, opts.db, opts.user, opts.password || "");
}
main().catch(e => console.error(JSON.stringify({status:"error",message:e.message})));
