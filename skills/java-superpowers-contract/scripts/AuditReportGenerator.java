package scripts;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.*;

/**
 * Java + Superpowers 审计报告生成器 (Java 版)
 * ==========================================
 * 配置优先级：Python > Node.js > Java
 * 对应契约第9节 — 全时执行审计汇报
 *
 * 能力：
 *   - 读取 JSON 审计数据（文件或stdin模拟）
 *   - 生成三大格式报告：JSON / Markdown / HTML
 *   - 自定义输出路径和报告标题
 *   - 数据质量三指标分析（NULL率/空字符串率/哨兵值率）
 *
 * 用法：
 *   javac -encoding utf8 scripts/AuditReportGenerator.java
 *   java -cp . scripts.AuditReportGenerator --input audit.json --format markdown --output report.md
 *   java -cp . scripts.AuditReportGenerator --sample --format html --output report.html
 */
public class AuditReportGenerator {

    private static final String CONFIG_DIR = System.getProperty("user.home") + "/.java-superpowers-audit";
    private static final String CONFIG_FILE = CONFIG_DIR + "/config.json";
    private static final String HISTORY_FILE = CONFIG_DIR + "/audit_history.jsonl";
    private static final Set<String> SENTINEL_VALUES = new HashSet<>(Arrays.asList(
        "0", "-1", "1900-01-01", "1970-01-01", "9999-12-31", "-9999", ""
    ));
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private String inputPath;
    private boolean useStdin;
    private String format = "markdown";
    private String outputPath;
    private String title = "执行审计报告";
    private boolean sample;
    private boolean history;
    private boolean passwordGuide;
    private boolean showDatabasesGuide;
    private String saveConfig;
    private boolean clearConfig;

    public static void main(String[] args) throws Exception {
        AuditReportGenerator gen = new AuditReportGenerator();
        gen.parseArgs(args);
        gen.run();
    }

    private void parseArgs(String[] args) {
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--input": case "-i": inputPath = args[++i]; break;
                case "--format": case "-f": format = args[++i]; break;
                case "--output": case "-o": outputPath = args[++i]; break;
                case "--title": case "-t": title = args[++i]; break;
                case "--sample": sample = true; break;
                case "--history": history = true; break;
                case "--password-guide": passwordGuide = true; break;
                case "--show-databases-guide": showDatabasesGuide = true; break;
                case "--save-config": saveConfig = args[++i]; break;
                case "--clear-config": clearConfig = true; break;
                case "--help": case "-h": printHelp(); System.exit(0);
            }
        }
    }

    private void run() throws Exception {
        if (saveConfig != null) { handleSaveConfig(); return; }
        if (clearConfig) { handleClearConfig(); return; }
        if (passwordGuide) { System.out.println(passwordQuotingGuide()); return; }
        if (showDatabasesGuide) { System.out.println(showDatabasesGuide()); return; }
        if (history) { printHistory(); return; }

        Map<String, Object> auditData;
        if (sample) {
            auditData = generateSampleAuditData();
        } else if (inputPath != null) {
            String json = new String(Files.readAllBytes(Paths.get(inputPath)), "UTF-8");
            auditData = parseJsonObject(json);
        } else {
            auditData = generateSampleAuditData();
        }

        auditData.putIfAbsent("title", title);
        appendHistory(auditData);

        String content;
        switch (format) {
            case "json": content = generateJsonReport(auditData); break;
            case "html": content = generateHtmlReport(auditData); break;
            default: content = generateMarkdownReport(auditData); break;
        }

        if (outputPath != null) {
            Files.write(Paths.get(outputPath), content.getBytes("UTF-8"));
            System.out.println("{\"status\":\"success\",\"format\":\"" + format + "\",\"output\":\"" + escapeJson(outputPath) + "\"}");
        } else {
            System.out.println(content);
        }
    }

    // ========== 配置管理 ==========
    private void handleSaveConfig() throws IOException {
        Files.createDirectories(Paths.get(CONFIG_DIR));
        Map<String, Object> config = loadConfigMap();
        for (String part : saveConfig.split(",")) {
            int eq = part.indexOf('=');
            if (eq > 0) config.put(part.substring(0, eq).trim(), part.substring(eq + 1).trim());
        }
        String json = mapToJson(config);
        Files.write(Paths.get(CONFIG_FILE), json.getBytes("UTF-8"));
        System.out.println("{\"status\":\"config_saved\",\"config\":" + json + "}");
    }

    private void handleClearConfig() throws IOException {
        Files.deleteIfExists(Paths.get(CONFIG_FILE));
        System.out.println("{\"status\":\"config_cleared\"}");
    }

    private Map<String, Object> loadConfigMap() {
        Map<String, Object> cfg = new HashMap<>();
        cfg.put("default_format", "markdown");
        try {
            Path p = Paths.get(CONFIG_FILE);
            if (Files.exists(p)) {
                String json = new String(Files.readAllBytes(p), "UTF-8");
                return parseJsonObject(json);
            }
        } catch (Exception e) { /* ignore */ }
        return cfg;
    }

    private void appendHistory(Map<String, Object> auditData) {
        try {
            Files.createDirectories(Paths.get(CONFIG_DIR));
            Map<String, Object> record = new HashMap<>();
            record.put("timestamp", LocalDateTime.now().format(DTF));
            record.put("sessionId", auditData.getOrDefault("sessionId", ""));
            record.put("summary", auditData.getOrDefault("summary", new HashMap<>()));
            String line = mapToJson(record);
            Files.write(Paths.get(HISTORY_FILE), (line + "\n").getBytes("UTF-8"), StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception e) { /* silent */ }
    }

    private void printHistory() throws IOException {
        Path p = Paths.get(HISTORY_FILE);
        if (Files.exists(p)) {
            List<String> lines = Files.readAllLines(p, java.nio.charset.StandardCharsets.UTF_8);
            int start = Math.max(0, lines.size() - 50);
            List<String> slice = lines.subList(start, lines.size());
            System.out.println("[" + String.join(",", slice) + "]");
        } else {
            System.out.println("[]");
        }
    }

    // ========== 数据质量三指标 ==========
    static class QualityResult {
        double nullRatio, emptyStringRatio, sentinelValueRatio, qualityScore;
        String warning;
        QualityResult(double nr, double er, double sr, double qs, String w) {
            this.nullRatio = nr; this.emptyStringRatio = er;
            this.sentinelValueRatio = sr; this.qualityScore = qs; this.warning = w;
        }
    }

    private QualityResult analyzeDataQuality(long nullCount, long totalCount, long emptyStringCount, List<Map<String, Object>> topValues) {
        if (totalCount == 0) return new QualityResult(0, 0, 0, 1, "空表");
        double nr = (double) nullCount / totalCount;
        double er = (double) emptyStringCount / totalCount;
        long sentinelCount = 0;
        if (topValues != null) {
            for (Map<String, Object> tv : topValues) {
                Object val = tv.get("value");
                Number cnt = (Number) tv.get("count");
                if (val != null && SENTINEL_VALUES.contains(val.toString())) {
                    sentinelCount += cnt != null ? cnt.longValue() : 0;
                }
            }
        }
        double sr = (double) sentinelCount / totalCount;
        double qs = Math.max(0, Math.min(1, 1.0 - (nr * 0.4 + er * 0.3 + sr * 0.3)));
        List<String> warns = new ArrayList<>();
        if (nr > 0.8) warns.add("NULL率过高: 潜在冗余字段");
        else if (nr > 0.2) warns.add("NULL率偏高: 建议补充默认值");
        if (er > 0.3) warns.add("空字符串率过高: 字段设计可能存在问题");
        if (sr > 0.1) warns.add("哨兵值率异常: 业务层可能使用了哨兵值替代NULL");
        String w = warns.isEmpty() ? "正常" : String.join("; ", warns);
        return new QualityResult(
            Math.round(nr * 10000.0) / 10000.0,
            Math.round(er * 10000.0) / 10000.0,
            Math.round(sr * 10000.0) / 10000.0,
            Math.round(qs * 10000.0) / 10000.0, w);
    }

    // ========== 示例数据 ==========
    @SuppressWarnings("unchecked")
    private Map<String, Object> generateSampleAuditData() {
        String ts = LocalDateTime.now().format(DTF);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("sessionId", "session_" + ts.replaceAll("[:T-]", ""));
        data.put("timestamp", ts);
        data.put("title", "示例审计报告");
        data.put("skills", Arrays.asList("java-superpowers-contract [已有]", "java-mysql-query [已有]", "Brainstorming & Planning [已有]"));
        data.put("tools", Arrays.asList("fetch_codebase_ctx", "analyze_dependencies", "DatabaseQuery"));
        List<Map<String, String>> filesRead = new ArrayList<>();
        filesRead.add(mapOf("path", "src/main/resources/application-dev.yml", "status", "[已有]"));
        filesRead.add(mapOf("path", "src/main/java/com/example/UserService.java", "status", "[已有]"));
        data.put("filesRead", filesRead);
        List<Map<String, String>> filesModified = new ArrayList<>();
        filesModified.add(mapOf("path", "src/main/java/com/example/UserController.java", "change", "新增校验逻辑 [新增]"));
        data.put("filesModified", filesModified);
        List<Map<String, String>> sqlExecuted = new ArrayList<>();
        sqlExecuted.add(mapOf("sql", "ALTER TABLE user ADD COLUMN age INT DEFAULT 0 COMMENT '年龄'", "type", "DDL"));
        data.put("sqlExecuted", sqlExecuted);
        List<Map<String, Object>> qualityIssues = new ArrayList<>();
        Map<String, Object> qi1 = new LinkedHashMap<>();
        qi1.put("table", "user"); qi1.put("column", "email");
        qi1.put("nullRatio", 0.0234); qi1.put("emptyStringRatio", 0.0156);
        qi1.put("sentinelValueRatio", 0.0); qi1.put("qualityScore", 0.98);
        qi1.put("warning", "正常");
        qualityIssues.add(qi1);
        data.put("dataQualityIssues", qualityIssues);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalSkills", 3); summary.put("totalTools", 3);
        summary.put("totalFilesRead", 2); summary.put("totalFilesModified", 1);
        summary.put("totalSqlExecuted", 1); summary.put("totalQualityIssues", 1);
        data.put("summary", summary);
        return data;
    }

    private Map<String, String> mapOf(String k1, String v1, String k2, String v2) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put(k1, v1); m.put(k2, v2); return m;
    }

    // ========== 报告生成 ==========
    @SuppressWarnings("unchecked")
    private String generateJsonReport(Map<String, Object> auditData) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("reportType", "execution_audit");
        report.put("generatedAt", LocalDateTime.now().format(DTF));
        report.put("auditData", auditData);
        List<Map<String, Object>> issues = (List<Map<String, Object>>) auditData.getOrDefault("dataQualityIssues", new ArrayList<>());
        if (!issues.isEmpty()) {
            Map<String, Object> qa = new LinkedHashMap<>();
            qa.put("totalIssues", issues.size());
            List<Map<String, Object>> critical = issues.stream().filter(q -> ((Number)q.getOrDefault("qualityScore", 1)).doubleValue() < 0.6).collect(Collectors.toList());
            List<Map<String, Object>> warns = issues.stream().filter(q -> {
                double s = ((Number)q.getOrDefault("qualityScore", 1)).doubleValue();
                return s >= 0.6 && s < 0.9;
            }).collect(Collectors.toList());
            qa.put("criticalIssues", critical);
            qa.put("warnings", warns);
            qa.put("details", issues);
            report.put("qualityAnalysis", qa);
        }
        return mapToJson(report);
    }

    @SuppressWarnings("unchecked")
    private String generateMarkdownReport(Map<String, Object> auditData) {
        StringBuilder sb = new StringBuilder();
        String title = (String) auditData.getOrDefault("title", "执行审计报告");
        String ts = (String) auditData.getOrDefault("timestamp", LocalDateTime.now().format(DTF));
        sb.append("# 执行审计报告: ").append(title).append("\n\n");
        sb.append("- **会话ID**: ").append(auditData.getOrDefault("sessionId", "N/A")).append("\n");
        sb.append("- **时间戳**: ").append(ts).append("\n");
        sb.append("- **生成时间**: ").append(LocalDateTime.now().format(DTF)).append("\n\n");
        sb.append("## 1. 技能与工具调用\n\n### 加载的技能 (Skills)\n");
        for (String sk : (List<String>) auditData.getOrDefault("skills", new ArrayList<>())) {
            sb.append("- ").append(sk).append("\n");
        }
        sb.append("\n### 调用的工具 (Tools)\n");
        for (String t : (List<String>) auditData.getOrDefault("tools", new ArrayList<>())) {
            sb.append("- `").append(t).append("`\n");
        }
        sb.append("\n## 2. 文件访问记录\n\n### 读取的文件\n");
        for (Map<String, String> fr : (List<Map<String, String>>) auditData.getOrDefault("filesRead", new ArrayList<>())) {
            sb.append("- ").append(fr.getOrDefault("status", "[已有]")).append(" `").append(fr.get("path")).append("`\n");
        }
        sb.append("\n### 修改的文件\n");
        for (Map<String, String> fm : (List<Map<String, String>>) auditData.getOrDefault("filesModified", new ArrayList<>())) {
            sb.append("- `").append(fm.get("path")).append("` -> ").append(fm.getOrDefault("change", "")).append("\n");
        }
        sb.append("\n## 3. SQL 执行记录\n");
        for (Map<String, String> sq : (List<Map<String, String>>) auditData.getOrDefault("sqlExecuted", new ArrayList<>())) {
            sb.append("- **[").append(sq.getOrDefault("type", "SQL")).append("]** `").append(sq.get("sql")).append("`\n");
        }
        List<Map<String, Object>> issues = (List<Map<String, Object>>) auditData.getOrDefault("dataQualityIssues", new ArrayList<>());
        if (!issues.isEmpty()) {
            sb.append("\n## 4. 数据质量三指标分析\n\n");
            sb.append("| 表名 | 字段 | NULL率 | 空字符串率 | 哨兵值率 | 质量分 | 警告 |\n");
            sb.append("|------|------|--------|-----------|----------|--------|------|\n");
            for (Map<String, Object> qi : issues) {
                sb.append("| ").append(qi.get("table")).append(" | ").append(qi.get("column")).append(" | ");
                sb.append(String.format("%.1f%%", ((Number)qi.getOrDefault("nullRatio", 0)).doubleValue() * 100)).append(" | ");
                sb.append(String.format("%.1f%%", ((Number)qi.getOrDefault("emptyStringRatio", 0)).doubleValue() * 100)).append(" | ");
                sb.append(String.format("%.1f%%", ((Number)qi.getOrDefault("sentinelValueRatio", 0)).doubleValue() * 100)).append(" | ");
                sb.append(String.format("%.2f", ((Number)qi.getOrDefault("qualityScore", 1)).doubleValue())).append(" | ");
                sb.append(qi.getOrDefault("warning", "正常")).append(" |\n");
            }
        }
        Map<String, Object> summary = (Map<String, Object>) auditData.getOrDefault("summary", new HashMap<>());
        sb.append("\n## 5. 统计摘要\n\n");
        sb.append("- **技能数**: ").append(summary.getOrDefault("totalSkills", 0)).append("\n");
        sb.append("- **工具数**: ").append(summary.getOrDefault("totalTools", 0)).append("\n");
        sb.append("- **读取文件**: ").append(summary.getOrDefault("totalFilesRead", 0)).append("\n");
        sb.append("- **修改文件**: ").append(summary.getOrDefault("totalFilesModified", 0)).append("\n");
        sb.append("- **SQL执行**: ").append(summary.getOrDefault("totalSqlExecuted", 0)).append("\n");
        sb.append("- **质量异常**: ").append(summary.getOrDefault("totalQualityIssues", 0)).append("\n");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String generateHtmlReport(Map<String, Object> auditData) {
        String title = escHtml((String) auditData.getOrDefault("title", "执行审计报告"));
        Map<String, Object> summary = (Map<String, Object>) auditData.getOrDefault("summary", new HashMap<>());
        StringBuilder h = new StringBuilder();
        h.append("<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"><title>").append(title).append("</title><style>");
        h.append("body{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;max-width:960px;margin:2em auto;padding:0 1em;color:#1a1a2e;background:#f8f9fa;line-height:1.7}");
        h.append("h1{color:#0d6efd;border-bottom:2px solid #0d6efd;padding-bottom:.3em}");
        h.append("h2{color:#198754;margin-top:1.5em}");
        h.append("table{border-collapse:collapse;width:100%;margin:1em 0}");
        h.append("th,td{border:1px solid #dee2e6;padding:.5em;text-align:left}th{background:#e9ecef}");
        h.append("tr:nth-child(even){background:#f2f2f2}");
        h.append("code{background:#e9ecef;padding:.2em .4em;border-radius:3px}");
        h.append(".warning{color:#dc3545;font-weight:700}.normal{color:#198754}");
        h.append(".summary{background:#e9ecef;padding:1em;border-radius:8px;margin:1em 0}");
        h.append("</style></head><body>");
        h.append("<h1>&#x1f504; ").append(title).append("</h1>");
        h.append("<p><strong>会话ID:</strong> ").append(escHtml((String)auditData.getOrDefault("sessionId", "N/A"))).append("</p>");
        h.append("<p><strong>时间戳:</strong> ").append(escHtml((String)auditData.getOrDefault("timestamp", ""))).append("</p>");
        h.append("<p><strong>生成时间:</strong> ").append(LocalDateTime.now().format(DTF)).append("</p>");
        h.append("<h2>1. 技能与工具调用</h2><h3>加载的技能</h3><ul>");
        for (String sk : (List<String>) auditData.getOrDefault("skills", new ArrayList<>())) {
            h.append("<li>").append(escHtml(sk)).append("</li>");
        }
        h.append("</ul><h3>调用的工具</h3><ul>");
        for (String t : (List<String>) auditData.getOrDefault("tools", new ArrayList<>())) {
            h.append("<li><code>").append(escHtml(t)).append("</code></li>");
        }
        h.append("</ul><h2>2. 文件访问记录</h2><h3>读取的文件</h3><ul>");
        for (Map<String, String> fr : (List<Map<String, String>>) auditData.getOrDefault("filesRead", new ArrayList<>())) {
            h.append("<li>").append(escHtml(fr.getOrDefault("status", "[已有]"))).append(" <code>").append(escHtml(fr.get("path"))).append("</code></li>");
        }
        h.append("</ul><h3>修改的文件</h3><ul>");
        for (Map<String, String> fm : (List<Map<String, String>>) auditData.getOrDefault("filesModified", new ArrayList<>())) {
            h.append("<li><code>").append(escHtml(fm.get("path"))).append("</code> &rarr; ").append(escHtml(fm.getOrDefault("change", ""))).append("</li>");
        }
        h.append("</ul><h2>3. SQL执行记录</h2><ul>");
        for (Map<String, String> sq : (List<Map<String, String>>) auditData.getOrDefault("sqlExecuted", new ArrayList<>())) {
            h.append("<li><strong>[").append(escHtml(sq.getOrDefault("type", "SQL"))).append("]</strong> <code>").append(escHtml(sq.get("sql"))).append("</code></li>");
        }
        h.append("</ul>");
        List<Map<String, Object>> issues = (List<Map<String, Object>>) auditData.getOrDefault("dataQualityIssues", new ArrayList<>());
        if (!issues.isEmpty()) {
            h.append("<h2>4. 数据质量三指标分析</h2><table><tr><th>表名</th><th>字段</th><th>NULL率</th><th>空字符串率</th><th>哨兵值率</th><th>质量分</th><th>警告</th></tr>");
            for (Map<String, Object> qi : issues) {
                String wc = "正常".equals(qi.getOrDefault("warning", "正常")) ? "normal" : "warning";
                h.append("<tr><td>").append(escHtml(qi.get("table"))).append("</td><td>").append(escHtml(qi.get("column"))).append("</td>");
                h.append("<td>").append(String.format("%.1f%%", ((Number)qi.getOrDefault("nullRatio", 0)).doubleValue()*100)).append("</td>");
                h.append("<td>").append(String.format("%.1f%%", ((Number)qi.getOrDefault("emptyStringRatio", 0)).doubleValue()*100)).append("</td>");
                h.append("<td>").append(String.format("%.1f%%", ((Number)qi.getOrDefault("sentinelValueRatio", 0)).doubleValue()*100)).append("</td>");
                h.append("<td>").append(String.format("%.2f", ((Number)qi.getOrDefault("qualityScore", 1)).doubleValue())).append("</td>");
                h.append("<td class=\"").append(wc).append("\">").append(escHtml(qi.getOrDefault("warning", "正常"))).append("</td></tr>");
            }
            h.append("</table>");
        }
        h.append("<h2>5. 统计摘要</h2><div class=\"summary\">");
        h.append("<p><strong>技能数:</strong> ").append(summary.getOrDefault("totalSkills", 0)).append("</p>");
        h.append("<p><strong>工具数:</strong> ").append(summary.getOrDefault("totalTools", 0)).append("</p>");
        h.append("<p><strong>读取文件:</strong> ").append(summary.getOrDefault("totalFilesRead", 0)).append("</p>");
        h.append("<p><strong>修改文件:</strong> ").append(summary.getOrDefault("totalFilesModified", 0)).append("</p>");
        h.append("<p><strong>SQL执行:</strong> ").append(summary.getOrDefault("totalSqlExecuted", 0)).append("</p>");
        h.append("<p><strong>质量异常:</strong> ").append(summary.getOrDefault("totalQualityIssues", 0)).append("</p>");
        h.append("</div></body></html>");
        return h.toString();
    }

    // ========== 密码引号包裹与SHOW DATABASES指南 ==========
    private String passwordQuotingGuide() {
        return "{\"title\":\"MySQL密码含特殊字符的引号包裹方法\",\"methods\":["
            + "{\"method\":\"PowerShell单引号\",\"desc\":\"密码含$时使用单引号避免变量解析\",\"example\":\"java -cp .;mysql-connector.jar scripts.DatabaseQuery --password 'myP@ssw0rd!' --get-schema\"},"
            + "{\"method\":\"PowerShell双引号\",\"desc\":\"无特殊PS变量符号时可用双引号\",\"example\":\"java -cp .;mysql-connector.jar scripts.DatabaseQuery --password \\\"myP@ssw0rd!\\\" --get-schema\"},"
            + "{\"method\":\"环境变量法(推荐)\",\"desc\":\"通过环境变量传入避免shell解释\",\"example\":\"$env:DB_PASSWORD = ...\"},"
            + "{\"method\":\"配置文件法(最安全)\",\"desc\":\"密码保存在~/.java-mysql-query-config.json\",\"example\":\"后续无需再传入密码参数\"}"
            + "]}";
    }

    private String showDatabasesGuide() {
        return "{\"title\":\"SHOW DATABASES 快速列举所有库\",\"commands\":["
            + "{\"desc\":\"列出所有数据库\",\"sql\":\"SHOW DATABASES;\"},"
            + "{\"desc\":\"切换目标数据库\",\"sql\":\"USE <数据库名>;\"},"
            + "{\"desc\":\"通过DatabaseQuery执行\",\"command\":\"java -cp <skill目录>;<mysql-connector.jar> scripts.DatabaseQuery \\\"SHOW DATABASES\\\"\"}"
            + "],\"useCases\":[\"多租户环境探索\",\"数据库盘点\",\"迁移前摸底\"]}";
    }

    // ========== JSON 工具 ==========
    private static String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> parseJsonObject(String json) {
        Map<String, Object> map = new LinkedHashMap<>();
        json = json.trim();
        if (!json.startsWith("{")) return map;
        json = json.substring(1, json.lastIndexOf('}')).trim();
        int i = 0;
        while (i < json.length()) {
            // find key
            int ks = json.indexOf('"', i);
            if (ks < 0) break;
            int ke = json.indexOf('"', ks + 1);
            String key = json.substring(ks + 1, ke);
            i = json.indexOf(':', ke) + 1;
            while (i < json.length() && json.charAt(i) == ' ') i++;
            // parse value
            if (json.charAt(i) == '"') {
                StringBuilder val = new StringBuilder();
                i++;
                while (i < json.length()) {
                    char c = json.charAt(i);
                    if (c == '\\') { i++; if (i < json.length()) val.append(json.charAt(i)); }
                    else if (c == '"') break;
                    else val.append(c);
                    i++;
                }
                map.put(key, val.toString());
                i++;
            } else if (json.charAt(i) == '{') {
                int depth = 1, start = i;
                i++;
                while (i < json.length() && depth > 0) {
                    if (json.charAt(i) == '{') depth++;
                    else if (json.charAt(i) == '}') depth--;
                    i++;
                }
                map.put(key, parseJsonObject(json.substring(start, i)));
            } else if (json.charAt(i) == '[') {
                int depth = 1, start = i;
                i++;
                while (i < json.length() && depth > 0) {
                    if (json.charAt(i) == '[') depth++;
                    else if (json.charAt(i) == ']') depth--;
                    i++;
                }
                map.put(key, parseJsonArray(json.substring(start, i)));
            } else if (json.charAt(i) == 't' || json.charAt(i) == 'f') {
                int end = json.indexOf(',', i);
                if (end < 0) end = json.length();
                String b = json.substring(i, end).trim();
                map.put(key, b.startsWith("t"));
                i = end;
            } else if (json.charAt(i) == 'n') {
                int end = json.indexOf(',', i);
                if (end < 0) end = json.length();
                i = end;
            } else {
                // number
                int end = json.indexOf(',', i);
                if (end < 0) end = json.length();
                String num = json.substring(i, end).trim();
                try { map.put(key, Integer.parseInt(num)); }
                catch (NumberFormatException e) {
                    try { map.put(key, Double.parseDouble(num)); }
                    catch (NumberFormatException e2) { map.put(key, num); }
                }
                i = end;
            }
            while (i < json.length() && (json.charAt(i) == ',' || json.charAt(i) == ' ')) i++;
        }
        return map;
    }

    private static List<Object> parseJsonArray(String json) {
        List<Object> list = new ArrayList<>();
        json = json.trim();
        if (!json.startsWith("[")) return list;
        json = json.substring(1, json.lastIndexOf(']')).trim();
        if (json.isEmpty()) return list;
        // Parse array elements (simplified: only handles strings and objects)
        int i = 0;
        while (i < json.length()) {
            if (json.charAt(i) == '{') {
                int depth = 1, start = i;
                i++;
                while (i < json.length() && depth > 0) {
                    if (json.charAt(i) == '{') depth++;
                    else if (json.charAt(i) == '}') depth--;
                    i++;
                }
                list.add(parseJsonObject(json.substring(start, i)));
            } else if (json.charAt(i) == '"') {
                StringBuilder val = new StringBuilder();
                i++;
                while (i < json.length()) {
                    char c = json.charAt(i);
                    if (c == '\\') { i++; if (i < json.length()) val.append(json.charAt(i)); }
                    else if (c == '"') break;
                    else val.append(c);
                    i++;
                }
                list.add(val.toString());
                i++;
            } else {
                while (i < json.length() && json.charAt(i) != ',' && json.charAt(i) != ']') i++;
            }
            while (i < json.length() && (json.charAt(i) == ',' || json.charAt(i) == ' ')) i++;
        }
        return list;
    }

    private static String mapToJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(escapeJson(e.getKey())).append("\":");
            Object val = e.getValue();
            if (val == null) sb.append("null");
            else if (val instanceof String) sb.append("\"").append(escapeJson((String) val)).append("\"");
            else if (val instanceof Map) sb.append(mapToJson((Map<String, Object>) val));
            else if (val instanceof List) sb.append(listToJson((List<Object>) val));
            else if (val instanceof Number || val instanceof Boolean) sb.append(val);
            else sb.append("\"").append(escapeJson(val.toString())).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private static String listToJson(List<Object> list) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Object val : list) {
            if (!first) sb.append(",");
            first = false;
            if (val == null) sb.append("null");
            else if (val instanceof String) sb.append("\"").append(escapeJson((String) val)).append("\"");
            else if (val instanceof Map) sb.append(mapToJson((Map<String, Object>) val));
            else if (val instanceof List) sb.append(listToJson((List<Object>) val));
            else if (val instanceof Number || val instanceof Boolean) sb.append(val);
            else sb.append("\"").append(escapeJson(val.toString())).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private static void printHelp() {
        System.out.println("Java + Superpowers 审计报告生成器");
        System.out.println("用法: java -cp . scripts.AuditReportGenerator [选项]");
        System.out.println("选项:");
        System.out.println("  --input,-i <文件>    审计数据JSON文件");
        System.out.println("  --format,-f <格式>  报告格式: json|markdown|html (默认markdown)");
        System.out.println("  --output,-o <文件>  输出文件路径");
        System.out.println("  --title,-t <标题>   报告标题");
        System.out.println("  --sample            生成示例审计报告");
        System.out.println("  --password-guide    输出密码引号包裹指南");
        System.out.println("  --show-databases-guide  输出SHOW DATABASES指南");
        System.out.println("  --save-config <k=v> 保存配置");
        System.out.println("  --clear-config      清除配置");
    }
}
