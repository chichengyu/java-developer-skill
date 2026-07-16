#!/usr/bin/env node
/**
 * CI/CD 集成助手 (Node.js 版)
 * 自动化审计：校验Git提交信息，运行数据质量检查，生成审计报告。
 * 用法: node cicd-helper.js --check-commit-msg "feat(user): 新增接口"
 *       node cicd-helper.js --pre-commit-install
 */
const fs = require("fs");
const { MySQLQuery } = require("./database-query.js");
const path = require("path");

function checkCommitMessage(msg) {
  const errors = [];
  const pattern = /^(feat|fix|refactor|test|docs|chore|perf|style|ci)(\([\w-]+\))?: .+/;
  if (!msg) errors.push("提交信息为空");
  else if (!pattern.test(msg)) errors.push("格式不符: <类型>(<范围>): <描述>");
  if (msg.length > 100) errors.push("提交信息超过100字符");
  return errors.length > 0 ? errors : ["提交信息格式正确"];
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--check-commit-msg": opts.checkCommitMsg = args[++i]; break;
      case "--pre-commit-install": opts.preCommitInstall = true; break;
      case "--audit": opts.audit = args[++i]; break;
      case "--output-dir": opts.outputDir = args[++i]; break;
    }
  }
  return opts;
}

function run(opts) {
  if (opts.checkCommitMsg) {
    const result = checkCommitMessage(opts.checkCommitMsg);
    console.log(JSON.stringify({ status: result[0].includes("正确") ? "ok" : "error", messages: result }));
  } else if (opts.preCommitInstall) {
    const hookDir = path.join(".git", "hooks");
    if (!fs.existsSync(hookDir)) fs.mkdirSync(hookDir, { recursive: true });
    const hookPath = path.join(hookDir, "pre-commit");
    fs.writeFileSync(hookPath, '#!/bin/sh\nnode scripts/cicd-helper.js --check-commit-msg "$(git log -1 --pretty=%B)"\n', { mode: 0o755 });
    console.log(JSON.stringify({ status: "installed", hook: hookPath }));
  } else if (opts.audit) {
    const outDir = opts.outputDir || "./reports";
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "audit_report.md");
    execSync(`node scripts/audit-report-generator.js --input "${opts.audit}" --format markdown --output "${outPath}"`, { shell: true });
    console.log(JSON.stringify({ status: "success", output: outPath }));
  } else {
    console.log("用法: --check-commit-msg <msg> | --pre-commit-install | --audit <file> --output-dir <dir>");
  }
}
run(parseArgs());
