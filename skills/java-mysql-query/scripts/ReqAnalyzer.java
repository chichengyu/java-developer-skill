package scripts;
import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * ReqAnalyzer — 需求深度分析器 (Java 版)
 * 对应契约第6节（两阶段工作流）+ 需求深度分析框架。
 * 编译: javac -encoding utf8 scripts/ReqAnalyzer.java
 * 运行: java -cp . scripts.ReqAnalyzer "新增用户年龄字段"
 *       java -cp . scripts.ReqAnalyzer --input requirement.txt --format html --output analysis.html
 */
public class ReqAnalyzer {
    private String req, title;
    private List<Integer> impactLayers;
    private Map<String, Map<String,String>> risk;
    private List<Map<String,String>> steps;
    private String sql;

    private static final String[] LAYER_NAMES = {"入口层(Controller)", "业务层(Service/AOP)", "数据层(Repository/Mapper)", "异步层(Event/Message)"};
    private String format = "markdown", outputPath = null;

    public ReqAnalyzer(String requirement, String t) {
        this.req = requirement;
        this.title = (t != null && !t.isEmpty()) ? t : (requirement.length() > 60 ? requirement.substring(0, 60) + "..." : requirement);
        this.impactLayers = analyzeLayers();
        this.risk = assessRisk();
        this.steps = generateSteps();
        this.sql = generateSql();
    }

    private List<Integer> analyzeLayers() {
        List<Integer> hits = new ArrayList<>();
        String r = req.toLowerCase();
        if (r.matches(".*(接口|api|端点|请求|响应|rest|controller|路由).*")) hits.add(0);
        if (r.matches(".*(业务|service|逻辑|计算|校验|验证).*")) hits.add(1);
        if (r.matches(".*(数据|查询|sql|存储|表|字段|数据库|索引|实体|增|删|改|查|写|读).*")) hits.add(2);
        if (r.matches(".*(异步|消息|事件|队列|kafka|rabbit|mq|通知|邮件).*")) hits.add(3);
        if (hits.isEmpty()) hits.add(1);
        return hits;
    }

    private Map<String, Map<String,String>> assessRisk() {
        Map<String, Map<String,String>> r = new LinkedHashMap<>();
        r.put("async", riskItem(/异步|队列|kafka|并发/.test(req) ? "高" : /事务|批量|大量/.test(req) ? "中" : "低", "异步处理超时/线程池耗尽"));
        r.put("test", riskItem(/重构|改|重写|替换/.test(req) ? "高" : /新增|拓展|加/.test(req) ? "中" : "低", "现有测试需全部重新验证"));
        r.put("tx", riskItem(/事务|跨库|分布式|回滚/.test(req) ? "高" : /更新|修改|写/.test(req) ? "中" : "低", "长事务导致连接池枯竭"));
        return r;
    }

    private Map<String,String> riskItem(String level, String detail) {
        Map<String,String> m = new LinkedHashMap<>(); m.put("level", level); m.put("detail", detail); return m;
    }

    private List<Map<String,String>> generateSteps() {
        List<Map<String,String>> s = new ArrayList<>();
        if (impactLayers.contains(2)) { Map<String,String> m = new LinkedHashMap<>(); m.put("step","1"); m.put("layer","数据层"); m.put("file","数据库/实体类 [新增]"); m.put("change","新增/修改字段"); s.add(m); }
        if (impactLayers.contains(0)) { Map<String,String> m = new LinkedHashMap<>(); m.put("step",String.valueOf(s.size()+1)); m.put("layer","入口层"); m.put("file","XxxController.java [已有]"); m.put("change","新增/修改接口"); s.add(m); }
        if (impactLayers.contains(1)) { Map<String,String> m = new LinkedHashMap<>(); m.put("step",String.valueOf(s.size()+1)); m.put("layer","业务层"); m.put("file","XxxService.java [已有]"); m.put("change","新增业务方法"); s.add(m); }
        if (impactLayers.contains(3)) { Map<String,String> m = new LinkedHashMap<>(); m.put("step",String.valueOf(s.size()+1)); m.put("layer","异步层"); m.put("file","XxxEventListener.java [已有]"); m.put("change","新增事件监听"); s.add(m); }
        if (s.isEmpty()) { Map<String,String> m = new LinkedHashMap<>(); m.put("step","1"); m.put("layer","综合"); m.put("file","[分析结论]"); m.put("change","无需代码变更"); s.add(m); }
        return s;
    }

    private String generateSql() {
        StringBuilder sb = new StringBuilder("-- 需求分析生成的SQL变更\n-- 需求: " + title + "\n\n");
        String r = req.toLowerCase();
        if (r.contains("年龄") || r.contains("age")) { sb.append("ALTER TABLE user ADD COLUMN age INT DEFAULT NULL COMMENT '年龄';\n-- rollback: ALTER TABLE user DROP COLUMN age;\n"); }
        else if (r.contains("手机") || r.contains("phone")) { sb.append("ALTER TABLE user ADD COLUMN phone VARCHAR(20) DEFAULT NULL COMMENT '手机号';\n-- rollback: ALTER TABLE user DROP COLUMN phone;\n"); }
        else if (r.contains("邮箱") || r.contains("email")) { sb.append("ALTER TABLE user ADD COLUMN email VARCHAR(100) DEFAULT NULL COMMENT '邮箱';\n-- rollback: ALTER TABLE user DROP COLUMN email;\n"); }
        else { sb.append("-- 本次需求不涉及SQL变更\n"); }
        return sb.toString();
    }

    public String toJson() { return "{\"title\":\"" + esc(title) + "\",\"requirement\":\"" + esc(req) + "\",\"layersAffected\":" + impactLayers.size() + ",\"steps\":" + steps.size() + "}"; }

    public String toMarkdown() {
        StringBuilder sb = new StringBuilder();
        sb.append("# 需求影响分析报告: ").append(title).append("\n\n");
        sb.append("**需求原文:** ").append(req).append("\n\n");
        sb.append("**影响层级 (").append(impactLayers.size()).append("层):** ");
        for (int i : impactLayers) sb.append(LAYER_NAMES[i]).append(" ");
        sb.append("\n\n## 1. 业务逻辑与调用链路分析\n\n");
        sb.append("## 2. 潜在副作用与风险评估\n\n| 维度 | 风险 | 说明 |\n|------|------|------|\n");
        sb.append("| 线程池与异步 | **").append(risk.get("async").get("level")).append("** | ").append(risk.get("async").get("detail")).append(" |\n");
        sb.append("| 单元测试 | **").append(risk.get("test").get("level")).append("** | ").append(risk.get("test").get("detail")).append(" |\n");
        sb.append("| 事务传播机制 | **").append(risk.get("tx").get("level")).append("** | ").append(risk.get("tx").get("detail")).append(" |\n\n");
        sb.append("## 3. 详细文件级改造步骤\n\n| 步骤 | 层级 | 文件 | 改动内容 |\n|------|------|------|----------|\n");
        for (Map<String,String> s : steps) sb.append("| ").append(s.get("step")).append(" | ").append(s.get("layer")).append(" | `").append(s.get("file")).append("` | ").append(s.get("change")).append(" |\n");
        sb.append("\n### SQL 变更\n```sql\n").append(sql).append("```\n\n🔄【执行审计】- java-superpowers-contract, ReqAnalyzer");
        return sb.toString();
    }

    public String toHtml() {
        StringBuilder h = new StringBuilder();
        h.append("<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"UTF-8\"><title>需求分析 - ").append(title).append("</title>");
        h.append("<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:960px;margin:2em auto;padding:0 1em}h1{color:#0d6efd;border-bottom:2px solid #0d6efd}h2{color:#198754}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #dee2e6;padding:.5em;text-align:left}th{background:#e9ecef}pre{background:#1a1a2e;color:#f8f9fa;padding:1em;border-radius:6px}</style></head><body>");
        h.append("<h1>&#x1f50d; 需求影响分析报告: ").append(title).append("</h1>");
        h.append("<p><strong>需求:</strong> ").append(req).append("</p>");
        h.append("<p><strong>影响层级:</strong> ").append(impactLayers.size()).append("层 | <strong>建议步骤:</strong> ").append(steps.size()).append("步</p>");
        h.append("<h2>1. 业务逻辑与调用链路分析</h2><p>").append(impactLayers.size()).append(" 个架构层受影响</p>");
        h.append("<h2>2. 风险</h2><table><tr><th>维度</th><th>风险</th></tr><tr><td>异步</td><td>").append(risk.get("async").get("level")).append("</td></tr><tr><td>测试</td><td>").append(risk.get("test").get("level")).append("</td></tr><tr><td>事务</td><td>").append(risk.get("tx").get("level")).append("</td></tr></table>");
        h.append("<h2>3. 改造步骤</h2><table><tr><th>步骤</th><th>层</th><th>文件</th><th>改动</th></tr>");
        for (Map<String,String> s : steps) h.append("<tr><td>").append(s.get("step")).append("</td><td>").append(s.get("layer")).append("</td><td><code>").append(s.get("file")).append("</code></td><td>").append(s.get("change")).append("</td></tr>");
        h.append("</table><pre>").append(sql).append("</pre></body></html>");
        return h.toString();
    }

    private String esc(String s) { return s == null ? "" : s.replace("\\","\\\\").replace("\"","\\\""); }

    public static void main(String[] args) throws Exception {
        String req = "", format = "markdown", outputPath = null, inputFile = null;
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--input": case "-i": inputFile = args[++i]; break;
                case "--format": case "-f": format = args[++i]; break;
                case "--output": case "-o": outputPath = args[++i]; break;
                default: req = req + (req.isEmpty() ? "" : " ") + args[i];
            }
        }
        if (inputFile != null) req = new String(Files.readAllBytes(Paths.get(inputFile)), "UTF-8").trim();
        if (req.isEmpty()) { System.out.println("用法: --db mydb | --input relations.json --output deps.html"); return; }

        ReqAnalyzer analyzer = new ReqAnalyzer(req, null);
        String content;
        switch (format) {
            case "json": content = analyzer.toJson(); break;
            case "html": content = analyzer.toHtml(); break;
            default: content = analyzer.toMarkdown(); break;
        }
        if (outputPath != null) {
            Files.write(Paths.get(outputPath), content.getBytes("UTF-8"));
            System.out.println("{\"status\":\"success\",\"output\":\"" + outputPath + "\",\"format\":\"" + format + "\"}");
        } else {
            System.out.println(content);
        }
    }
}
