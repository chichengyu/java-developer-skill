package scripts;
import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

/**
 * Table Dependency Analyzer (Java 版)
 * 从外键约束构建表依赖关系图：拓扑层级、循环依赖检测、影响链分析、可视化HTML。
 * 编译: javac -encoding utf8 scripts/TableDependency.java
 * 运行: java -cp .;mysql-connector.jar scripts.TableDependency --db mydb
 *       java -cp . scripts.TableDependency --input relations.json
 */
public class TableDependency {
    private static String dbHost = "localhost", dbPort = "3306", dbName, dbUser = "root", dbPassword = "", dbSsl = "false";

    public static void main(String[] args) throws Exception {
        String inputFile = null, outputFile = "table_deps.html";
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
        if (inputFile == null && dbName == null) { System.out.println("用法: --db mydb | --input relations.json --output deps.html"); return; }
        String jsonData;
        if (inputFile != null) jsonData = new String(Files.readAllBytes(Paths.get(inputFile)), "UTF-8");
        else jsonData = fetchRelations();
        String html = generateHtml(jsonData);
        Files.write(Paths.get(outputFile), html.getBytes("UTF-8"));
        System.out.println("{\"status\":\"success\",\"output\":\"" + outputFile + "\"}");
    }

    private static String fetchRelations() throws Exception {
        String url = "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName
                   + "?useSSL=" + dbSsl + "&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8";
        try (Connection conn = DriverManager.getConnection(url, dbUser, dbPassword)) {
            DatabaseMetaData meta = conn.getMetaData();
            String catalog = conn.getCatalog();
            StringBuilder sb = new StringBuilder("{\"database\":\"" + esc(catalog) + "\",\"relations\":[");
            boolean first = true;
            try (ResultSet tables = meta.getTables(catalog, null, "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    String tbl = tables.getString("TABLE_NAME");
                    try (ResultSet fk = meta.getImportedKeys(catalog, null, tbl)) {
                        while (fk.next()) {
                            if (!first) sb.append(",");
                            first = false;
                            sb.append("{\"parentTable\":\"").append(esc(fk.getString("PKTABLE_NAME"))).append("\"");
                            sb.append(",\"parentColumn\":\"").append(esc(fk.getString("PKCOLUMN_NAME"))).append("\"");
                            sb.append(",\"childTable\":\"").append(esc(fk.getString("FKTABLE_NAME"))).append("\"");
                            sb.append(",\"childColumn\":\"").append(esc(fk.getString("FKCOLUMN_NAME"))).append("\"}");
                        }
                    }
                }
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    private static String generateHtml(String jsonData) {
        // Parse relations from JSON (simplified)
        List<Map<String,String>> rels = parseRelations(jsonData);
        Map<String,Set<String>> graph = new HashMap<>(), reverse = new HashMap<>();
        Set<String> allTables = new TreeSet<>();
        for (Map<String,String> r : rels) {
            String p = r.get("parentTable"), c = r.get("childTable");
            if (p != null && c != null) {
                graph.computeIfAbsent(c, k -> new HashSet<>()).add(p);
                reverse.computeIfAbsent(p, k -> new HashSet<>()).add(c);
                allTables.add(p); allTables.add(c);
            }
        }

        // Topological levels
        Map<String,Integer> inDegree = new HashMap<>();
        for (String t : allTables) inDegree.put(t, graph.getOrDefault(t, new HashSet<>()).size());
        Queue<String> queue = new LinkedList<>();
        for (String t : allTables) if (inDegree.get(t) == 0) queue.add(t);
        Map<String,Integer> levels = new HashMap<>();
        int level = 0;
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                String t = queue.poll();
                levels.put(t, level);
                for (String dep : reverse.getOrDefault(t, new HashSet<>())) {
                    inDegree.put(dep, inDegree.get(dep) - 1);
                    if (inDegree.get(dep) == 0) queue.add(dep);
                }
            }
            level++;
        }
        for (String t : allTables) levels.putIfAbsent(t, -1);

        // Cycle detection
        Set<String> cycleTables = new HashSet<>();
        detectCycles(graph, allTables, cycleTables);

        // Build HTML
        int maxLevel = levels.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"><title>表依赖关系图</title>");
        html.append("<script src=\"https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js\"></script>");
        html.append("<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:2em auto;padding:0 1em}");
        html.append("h1{color:#0d6efd;border-bottom:2px solid #0d6efd}.mermaid{background:#fff;padding:1em;border-radius:8px;overflow:auto}");
        html.append("table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #dee2e6;padding:.5em;text-align:left}th{background:#e9ecef}");
        html.append("tr:nth-child(even){background:#f2f2f2}code{background:#e9ecef;padding:.2em .4em;border-radius:3px}");
        html.append(".level-0{background:#d4edda}.level-1{background:#fff3cd}.level-2{background:#f8d7da}.circular{color:#dc3545;font-weight:700}");
        html.append("</style></head><body>");
        html.append("<h1>&#x1f517; 表依赖关系图</h1><p><strong>表总数:</strong> ").append(allTables.size());
        html.append(" | <strong>外键约束:</strong> ").append(rels.size());
        html.append(" | <strong>拓扑层级:</strong> ").append(maxLevel+1).append("层</p>");

        // Mermaid DAG
        html.append("<h2>依赖关系图</h2><div class=\"mermaid\">graph TD\n");
        for (String t : allTables) {
            html.append("  ").append(t.replace("-", "_")).append("[\"");
            if (cycleTables.contains(t)) html.append("&#x26a0;&#xfe0f; ");
            html.append(t).append("\"]\n");
        }
        for (Map.Entry<String,Set<String>> e : graph.entrySet()) {
            for (String p : e.getValue()) {
                html.append("  ").append(e.getKey().replace("-", "_")).append(" --> ").append(p.replace("-", "_")).append("\n");
            }
        }
        html.append("</div>");

        // Detail table
        html.append("<h2>表依赖明细</h2><table><tr><th>表名</th><th>层级</th><th>父表数</th><th>子表数</th></tr>");
        for (String t : allTables) {
            int l = levels.getOrDefault(t, 0);
            String cls = l < 0 ? "circular" : "level-" + Math.min(l, 2);
            html.append("<tr class=\"").append(cls).append("\"><td>").append(cycleTables.contains(t) ? "&#x26a0; " : "").append(t).append("</td>");
            html.append("<td>").append(l < 0 ? "CYCLE" : "L"+l).append("</td>");
            html.append("<td>").append(graph.getOrDefault(t, new HashSet<>()).size()).append("</td>");
            html.append("<td>").append(reverse.getOrDefault(t, new HashSet<>()).size()).append("</td></tr>");
        }
        html.append("</table>");
        html.append("<p>生成时间: ").append(java.time.LocalDateTime.now().toString()).append("</p>");
        html.append("<script>mermaid.initialize({startOnLoad:true,theme:\"default\"})</script></body></html>");
        return html.toString();
    }

    private static void detectCycles(Map<String,Set<String>> graph, Set<String> allTables, Set<String> cycleTables) {
        Map<String,Integer> color = new HashMap<>();
        List<String> path = new ArrayList<>();
        for (String t : allTables) color.put(t, 0);
        for (String t : allTables) if (color.get(t) == 0) dfsCycle(t, graph, color, path, cycleTables);
    }

    private static void dfsCycle(String node, Map<String,Set<String>> graph, Map<String,Integer> color, List<String> path, Set<String> cycleTables) {
        color.put(node, 1);
        path.add(node);
        for (String dep : graph.getOrDefault(node, new HashSet<>())) {
            int c = color.getOrDefault(dep, 0);
            if (c == 1) {
                int idx = path.indexOf(dep);
                for (int i = idx; i < path.size(); i++) cycleTables.add(path.get(i));
            } else if (c == 0) dfsCycle(dep, graph, color, path, cycleTables);
        }
        path.remove(path.size() - 1);
        color.put(node, 2);
    }

    private static List<Map<String,String>> parseRelations(String json) {
        List<Map<String,String>> list = new ArrayList<>();
        int idx = json.indexOf("\"relations\":[");
        if (idx < 0) return list;
        int start = json.indexOf('[', idx);
        int end = json.lastIndexOf(']');
        if (start < 0 || end < 0) return list;
        String arr = json.substring(start, end + 1);
        int depth = 0, objStart = -1;
        for (int i = 0; i < arr.length(); i++) {
            char c = arr.charAt(i);
            if (c == '{') { depth++; if (depth == 1) objStart = i; }
            else if (c == '}') { depth--; if (depth == 0 && objStart >= 0) {
                String obj = arr.substring(objStart, i + 1);
                Map<String,String> m = new HashMap<>();
                m.put("parentTable", extract(obj, "parentTable"));
                m.put("parentColumn", extract(obj, "parentColumn"));
                m.put("childTable", extract(obj, "childTable"));
                m.put("childColumn", extract(obj, "childColumn"));
                list.add(m);
                objStart = -1;
            }}
        }
        return list;
    }

    private static String extract(String json, String key) {
        String search = "\"" + key + "\":\"";
        int s = json.indexOf(search);
        if (s < 0) return "";
        s += search.length();
        StringBuilder v = new StringBuilder();
        for (int i = s; i < json.length() && json.charAt(i) != '"'; i++) v.append(json.charAt(i));
        return v.toString();
    }

    private static String esc(String s) { return s == null ? "" : s.replace("\"", "\\\""); }
}
