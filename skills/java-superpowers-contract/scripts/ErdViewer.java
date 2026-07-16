package scripts;
import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

/**
 * ERD Viewer (Java 版)
 * 从 DatabaseQuery --get-relations 输出生成可视化关系图 HTML。
 * 用法: javac -encoding utf8 scripts/ErdViewer.java
 *       java -cp . scripts.ErdViewer --db mydb
 *       java -cp . scripts.ErdViewer --input relations.json --output erd.html
 */
public class ErdViewer {
    private static String dbHost = "localhost", dbPort = "3306", dbName, dbUser = "root", dbPassword = "", dbSsl = "false";

    public static void main(String[] args) throws Exception {
        String inputFile = null, outputFile = "erd_view.html";
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--host": dbHost = args[++i]; break;
                case "--port": dbPort = args[++i]; break;
                case "--db": dbName = args[++i]; break;
                case "--user": dbUser = args[++i]; break;
                case "--password": dbPassword = args[++i]; break;
                case "--ssl": dbSsl = args[++i]; break;
                case "--input": inputFile = args[++i]; break;
                case "--output": case "-o": outputFile = args[++i]; break;
            }
        }
        if (inputFile == null && dbName == null) {
            System.out.println("用法: --db mydb | --input relations.json --output erd.html");
            return;
        }
        String jsonData;
        if (inputFile != null) {
            jsonData = new String(Files.readAllBytes(Paths.get(inputFile)), "UTF-8");
        } else {
            jsonData = fetchRelations();
        }
        String html = convertToHtml(jsonData);
        Files.write(Paths.get(outputFile), html.getBytes("UTF-8"));
        System.out.println("{\"status\":\"success\",\"output\":\"" + outputFile + "\"}");
    }

    private static String fetchRelations() throws Exception {
        String url = "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName
                   + "?useSSL=" + dbSsl + "&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8";
        try (Connection conn = DriverManager.getConnection(url, dbUser, dbPassword)) {
            DatabaseMetaData meta = conn.getMetaData();
            String catalog = conn.getCatalog();
            StringBuilder sb = new StringBuilder("{\"database\":\"" + escapeJson(catalog) + "\",\"relations\":[");
            boolean firstRel = true;
            try (ResultSet tables = meta.getTables(catalog, null, "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    String tbl = tables.getString("TABLE_NAME");
                    try (ResultSet fk = meta.getImportedKeys(catalog, null, tbl)) {
                        while (fk.next()) {
                            if (!firstRel) sb.append(",");
                            firstRel = false;
                            sb.append("{\"constraintName\":\"").append(escapeJson(nullToStr(fk.getString("FK_NAME")))).append("\"");
                            sb.append(",\"parentTable\":\"").append(escapeJson(fk.getString("PKTABLE_NAME"))).append("\"");
                            sb.append(",\"parentColumn\":\"").append(escapeJson(fk.getString("PKCOLUMN_NAME"))).append("\"");
                            sb.append(",\"childTable\":\"").append(escapeJson(fk.getString("FKTABLE_NAME"))).append("\"");
                            sb.append(",\"childColumn\":\"").append(escapeJson(fk.getString("FKCOLUMN_NAME"))).append("\"");
                            sb.append(",\"updateRule\":").append(fk.getShort("UPDATE_RULE"));
                            sb.append(",\"deleteRule\":").append(fk.getShort("DELETE_RULE"));
                            sb.append("}");
                        }
                    }
                }
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    private static String convertToHtml(String jsonData) {
        String dbName = extractJsonValue(jsonData, "database");
        String mermaidErd = extractJsonValue(jsonData, "mermaidErd");
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"><title>数据库关系图 - ").append(dbName).append("</title>");
        html.append("<script src=\"https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js\"></script>");
        html.append("<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:2em auto;padding:0 1em}h1{color:#0d6efd;border-bottom:2px solid #0d6efd}.mermaid{background:#fff;padding:1em;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #dee2e6;padding:.5em;text-align:left}th{background:#e9ecef}tr:nth-child(even){background:#f2f2f2}</style></head><body>");
        html.append("<h1>&#x1f517; 数据库关系图 - ").append(dbName).append("</h1>");
        html.append("<h2>ER 图</h2><div class=\"mermaid\">").append(mermaidErd.replace("\\n","\n").replace("\\\"","\"")).append("</div>");
        html.append("<h2>外键关系明细</h2><table><thead><tr><th>外键名</th><th>父表</th><th>父列</th><th>子表</th><th>子列</th><th>更新规则</th><th>删除规则</th></tr></thead><tbody>");

        int idx = jsonData.indexOf("\"relations\":[");
        if (idx > 0) {
            int start = jsonData.indexOf('[', idx);
            int end = jsonData.lastIndexOf(']');
            if (start > 0 && end > start) {
                String relsArray = jsonData.substring(start, end + 1);
                int depth = 0, objStart = -1;
                for (int i = 0; i < relsArray.length(); i++) {
                    char c = relsArray.charAt(i);
                    if (c == '{') { if (depth == 0) objStart = i; depth++; }
                    else if (c == '}') { depth--; if (depth == 0 && objStart >= 0) {
                        String obj = relsArray.substring(objStart, i + 1);
                        html.append("<tr><td><code>").append(escHtml(extractJsonValue(obj,"constraintName"))).append("</code></td>");
                        html.append("<td>").append(escHtml(extractJsonValue(obj,"parentTable"))).append("</td>");
                        html.append("<td><code>").append(escHtml(extractJsonValue(obj,"parentColumn"))).append("</code></td>");
                        html.append("<td>").append(escHtml(extractJsonValue(obj,"childTable"))).append("</td>");
                        html.append("<td><code>").append(escHtml(extractJsonValue(obj,"childColumn"))).append("</code></td>");
                        html.append("<td>").append(mapRule(extractJsonValue(obj,"updateRule"))).append("</td>");
                        html.append("<td>").append(mapRule(extractJsonValue(obj,"deleteRule"))).append("</td></tr>");
                        objStart = -1;
                    }}
                }
            }
        }
        html.append("</tbody></table><p>生成时间: ").append(java.time.LocalDateTime.now().toString()).append("</p>");
        html.append("<script>mermaid.initialize({startOnLoad:true,theme:\"default\"})</script></body></html>");
        return html.toString();
    }

    private static String extractJsonValue(String json, String key) {
        String search = "\"" + key + "\":\"";
        int s = json.indexOf(search);
        if (s >= 0) {
            s += search.length();
            StringBuilder v = new StringBuilder();
            for (int i = s; i < json.length(); i++) {
                char c = json.charAt(i);
                if (c == '\\' && i + 1 < json.length()) { v.append(json.charAt(i + 1)); i++; }
                else if (c == '"') break;
                else v.append(c);
            }
            return v.toString();
        }
        search = "\"" + key + "\":";
        s = json.indexOf(search);
        if (s >= 0) {
            s += search.length();
            StringBuilder v = new StringBuilder();
            for (int i = s; i < json.length(); i++) {
                char c = json.charAt(i);
                if (c == ',' || c == '}' || Character.isWhitespace(c)) break;
                v.append(c);
            }
            return v.toString().trim();
        }
        return "";
    }

    private static String mapRule(String rule) {
        try {
            int r = Integer.parseInt(rule);
            return new String[]{"RESTRICT","CASCADE","SET NULL","NO ACTION","SET DEFAULT"}[r];
        } catch (Exception e) { return rule; }
    }

    private static String escapeJson(String s) { return s == null ? "" : s.replace("\"","\\\""); }
    private static String escHtml(String s) { return s == null ? "" : s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"); }
    private static String nullToStr(String s) { return s == null ? "" : s; }
}
