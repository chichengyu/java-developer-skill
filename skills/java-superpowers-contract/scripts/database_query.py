#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DatabaseQuery Python Wrapper
包装 DatabaseQuery.java 的全部 CLI 接口，提供 Python 原生调用体验。
用法：
  python database_query.py --db mydb --get-schema
  python database_query.py --db mydb "SELECT * FROM user"
  python database_query.py --db mydb --analyze-table user --format html --output report.html
"""
import json, sys, os, subprocess, argparse, tempfile

DEVNULL = open(os.devnull, 'w')

def build_java_cmd(args, extra_args):
    cp = os.environ.get("DBQUERY_CP", ".;mysql-connector-j-8.3.0.jar")
    cmd = ["java", "-cp", cp, "scripts.DatabaseQuery",
           "--host", args.host, "--port", str(args.port),
           "--db", args.db, "--user", args.user]
    pwd = args.password or os.environ.get("DB_PASSWORD", "")
    if pwd: cmd.extend(["--password", pwd])
    if args.ssl: cmd.extend(["--ssl", args.ssl])
    if extra_args: cmd.extend(extra_args)
    return cmd

def run_query(args, extra_args=None):
    cmd = build_java_cmd(args, extra_args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=args.timeout)
        return result.stdout
    except subprocess.TimeoutExpired:
        return json.dumps({"status":"error","message":"执行超时"})
    except Exception as e:
        return json.dumps({"status":"error","message":str(e)})

def main():
    parser = argparse.ArgumentParser(description="DatabaseQuery Python Wrapper")
    parser.add_argument("--host", default="localhost"); parser.add_argument("--port", type=int, default=3306)
    parser.add_argument("--db", default=os.environ.get("DB_NAME","glo-trade-test_copy"))
    parser.add_argument("--user", default="root"); parser.add_argument("--password", default="")
    parser.add_argument("--ssl", default="false"); parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--format", choices=["json","markdown","html"], default="json", help="输出格式")
    parser.add_argument("--output", "-o", help="输出文件路径")
    parser.add_argument("--get-schema", action="store_true"); parser.add_argument("--analyze-all", action="store_true")
    parser.add_argument("--analyze-table", nargs="?")
    parser.add_argument("--get-relations", action="store_true"); parser.add_argument("--explain", nargs="?")
    parser.add_argument("--export-csv", nargs="?")
    parser.add_argument("--save-config", action="store_true"); parser.add_argument("--clear-config", action="store_true")
    parser.add_argument("sql", nargs="*", help="SQL语句")
    args = parser.parse_args()

    extra = []
    if args.get_schema: extra.append("--get-schema")
    elif args.analyze_all: extra.append("--analyze-all")
    elif args.analyze_table: extra.extend(["--analyze-table", args.analyze_table])
    elif args.get_relations: extra.append("--get-relations")
    elif args.explain: extra.extend(["--explain", args.explain])
    elif args.export_csv: extra.extend(["--export-csv", args.export_csv])
    elif args.sql: extra.append(" ".join(args.sql))
    else: parser.print_help(); return

    result = run_query(args, extra)
    data = json.loads(result) if result else {}

    if args.output:
        if args.format == "json": pass  # already JSON from Java
        elif args.format == "markdown":
            import audit_report_generator as arg
            audit = {"status":"success","data":data,"title":"DatabaseQuery结果"}
            result = arg.generate_markdown_report(audit)
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"结果已保存到 {args.output}")
    else:
        print(result)

if __name__ == "__main__": main()
