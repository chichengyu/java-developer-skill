package scripts;
import java.io.*;
import java.nio.file.*;
import java.sql.*;

/**
 * SQL Explain Analyzer (Java 版)
 * 分析 MySQL 查询执行计划，识别全表扫描、索引使用等性能瓶颈。
 * 用法: javac -encoding utf8 scripts/SqlExplainAnalyzer.java
 *       java -cp . scripts.SqlExplainAnalyzer --db mydb "SELECT * FROM user"
 */
public class SqlExplainAnalyzer {
    private static String dbHost = "localhost", dbPort = "3306", dbName, dbUser = "root", dbPassword = "", dbSsl = "false";

    public static void main(String[] args) throws Exception {
        String sql = "";
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--host": dbHost = args[++i]; break;
                case "--port": dbPort = args[++i]; break;
                case "--db": dbName = args[++i]; break;
                case "--user": dbUser = args[++i]; break;
                case "--password": dbPassword = args[++i]; break;
                case "--ssl": dbSsl = args[++i]; break;
                default: sql = (sql.isEmpty() ? "" : sql + " ") + args[i];
            }
        }
        if (dbName == null || sql.isEmpty()) {
            System.out.println("用法: java -cp . scripts.SqlExplainAnalyzer --db mydb \"SELECT * FROM table\"");
            return;
        }
        String url = "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName
                   + "?useSSL=" + dbSsl + "&allowPublicKeyRetrieval=" + ("true".equals(dbSsl) ? "false" : "true")
                   + "&serverTimezone=UTC&characterEncoding=UTF-8";
        try (Connection conn = DriverManager.getConnection(url, dbUser, dbPassword);
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("EXPLAIN FORMAT=JSON " + sql)) {
            if (rs.next()) {
                String plan = rs.getString(1);
                System.out.println("{\"status\":\"success\",\"sql\":\"" + sql.replace("\"","\\\"") + "\",\"explain\":" + plan + "}");
            }
        }
    }
}
