package scripts;
import java.io.*;
import java.nio.file.*;
import java.sql.*;

/**
 * CSV Exporter (Java 版)
 * 将 SQL 查询结果导出为 CSV 文件。
 * 用法: javac -encoding utf8 scripts/CsvExporter.java
 *       java -cp . scripts.CsvExporter --db mydb "SELECT * FROM user" --output users.csv
 */
public class CsvExporter {
    private static String dbHost = "localhost", dbPort = "3306", dbName, dbUser = "root", dbPassword = "", dbSsl = "false";

    public static void main(String[] args) throws Exception {
        String sql = "", outputFile = "export.csv";
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--host": dbHost = args[++i]; break;
                case "--port": dbPort = args[++i]; break;
                case "--db": dbName = args[++i]; break;
                case "--user": dbUser = args[++i]; break;
                case "--password": dbPassword = args[++i]; break;
                case "--ssl": dbSsl = args[++i]; break;
                case "--output": case "-o": outputFile = args[++i]; break;
                default: sql = (sql.isEmpty() ? "" : sql + " ") + args[i];
            }
        }
        if (dbName == null || sql.isEmpty()) {
            System.out.println("用法: java -cp . scripts.CsvExporter --db mydb \"SELECT * FROM table\" --output file.csv");
            return;
        }
        String url = "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName
                   + "?useSSL=" + dbSsl + "&allowPublicKeyRetrieval=" + ("true".equals(dbSsl) ? "false" : "true")
                   + "&serverTimezone=UTC&characterEncoding=UTF-8";
        try (Connection conn = DriverManager.getConnection(url, dbUser, dbPassword);
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            ResultSetMetaData rsmd = rs.getMetaData();
            int colCount = rsmd.getColumnCount();
            StringBuilder csv = new StringBuilder();
            for (int i = 1; i <= colCount; i++) {
                if (i > 1) csv.append(",");
                csv.append("\"").append(rsmd.getColumnName(i).replace("\"","\"\"")).append("\"");
            }
            csv.append("\n");
            int rows = 0;
            while (rs.next()) {
                for (int i = 1; i <= colCount; i++) {
                    if (i > 1) csv.append(",");
                    String val = rs.getString(i);
                    csv.append("\"").append(val != null ? val.replace("\"", "\"\"") : "").append("\"");
                }
                csv.append("\n");
                rows++;
            }
            Files.write(Paths.get(outputFile), csv.toString().getBytes("UTF-8"));
            System.out.println("{\"status\":\"success\",\"output\":\"" + outputFile + "\",\"rows\":" + rows + "}");
        }
    }
}
