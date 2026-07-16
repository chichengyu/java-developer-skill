package scripts;
import java.io.*;
import java.nio.file.*;

/**
 * CI/CD 集成助手 (Java 版)
 * 自动化审计：校验Git提交信息，运行数据质量检查，生成审计报告。
 * 用法: javac -encoding utf8 scripts/CicdHelper.java
 *       java -cp . scripts.CicdHelper --check-commit-msg "feat(user): 新增接口"
 */
public class CicdHelper {
    public static void main(String[] args) throws Exception {
        String command = "";
        String commitMsg = "", auditFile = "", outputDir = "./reports";
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--check-commit-msg": commitMsg = args[++i]; command = "check-commit"; break;
                case "--pre-commit-install": command = "install-hook"; break;
                case "--audit": auditFile = args[++i]; command = "audit"; break;
                case "--output-dir": outputDir = args[++i]; break;
            }
        }
        switch (command) {
            case "check-commit":
                StringBuilder msgs = new StringBuilder("[");
                if (commitMsg.isEmpty()) msgs.append("\"提交信息为空\"");
                else if (!commitMsg.matches("^(feat|fix|refactor|test|docs|chore|perf|style|ci)\\([\\w-]+\\)?:\\s.+"))
                    msgs.append("\"格式不符: <类型>(<范围>): <描述>\"");
                else msgs.append("\"提交信息格式正确\"");
                msgs.append("]");
                String status = msgs.toString().contains("正确") ? "ok" : "error";
                System.out.println("{\"status\":\"" + status + "\",\"messages\":" + msgs + "}");
                break;
            case "install-hook":
                Paths.get(".git/hooks").toFile().mkdirs();
                String hook = "#!/bin/sh\njava -cp . scripts.CicdHelper --check-commit-msg \"$(git log -1 --pretty=%B)\"\n";
                Files.write(Paths.get(".git/hooks/pre-commit"), hook.getBytes());
                new File(".git/hooks/pre-commit").setExecutable(true);
                System.out.println("{\"status\":\"installed\"}");
                break;
            case "audit":
                Files.createDirectories(Paths.get(outputDir));
                ProcessBuilder pb = new ProcessBuilder("java", "-cp", ".", "scripts.AuditReportGenerator",
                    "--input", auditFile, "--format", "markdown", "--output", outputDir + "/audit_report.md");
                pb.inheritIO().start().waitFor();
                System.out.println("{\"status\":\"success\",\"output\":\"" + outputDir + "/audit_report.md\"}");
                break;
            default:
                System.out.println("用法: --check-commit-msg <msg> | --pre-commit-install | --audit <file> --output-dir <dir>");
        }
    }
}
