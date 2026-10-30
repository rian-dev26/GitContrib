"""Migrate SQLite gitcontrib.db tables and data into XAMPP MySQL."""

import sys
import sqlite3
import subprocess
from pathlib import Path
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

SQLITE_PATH = Path("c:/xampp/htdocs/GitContrib/backend/gitcontrib.db")
MYSQL_BIN = Path("c:/xampp/mysql/bin/mysql.exe")

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    # String / JSON
    val_str = str(val).replace("\\", "\\\\").replace("'", "''")
    return f"'{val_str}'"

def main():
    print(f"Reading from {SQLITE_PATH}...")
    conn = sqlite3.connect(SQLITE_PATH)
    c = conn.cursor()

    # Get tables
    tables = [row[0] for row in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    print(f"Found tables: {tables}")

    sql_statements = [
        "SET FOREIGN_KEY_CHECKS = 0;",
    ]

    # MySQL Table Schemas
    schema_map = {
        "analysis_jobs": """
CREATE TABLE IF NOT EXISTS analysis_jobs (
    job_id VARCHAR(50) PRIMARY KEY,
    repo_url VARCHAR(500) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    progress FLOAT DEFAULT 0.0,
    error_message VARCHAR(500),
    created_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""",
        "analysis_results": """
CREATE TABLE IF NOT EXISTS analysis_results (
    result_id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    n_commits INT,
    n_contributors INT,
    n_clusters INT,
    summary JSON,
    cluster_distribution JSON,
    commit_type_distribution JSON,
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""",
        "contributors": """
CREATE TABLE IF NOT EXISTS contributors (
    contributor_id VARCHAR(100) PRIMARY KEY,
    result_id VARCHAR(50) NOT NULL,
    author_id VARCHAR(100),
    name VARCHAR(255),
    email VARCHAR(255),
    cluster INT,
    cluster_name VARCHAR(100),
    total_commits INT,
    active_days INT,
    lines_added INT,
    lines_deleted INT,
    files_touched INT,
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""",
        "commits": """
CREATE TABLE IF NOT EXISTS commits (
    commit_id VARCHAR(100) PRIMARY KEY,
    result_id VARCHAR(50) NOT NULL,
    sha VARCHAR(40),
    message_subject VARCHAR(500),
    author_id VARCHAR(100),
    author_name VARCHAR(255),
    predicted_type VARCHAR(50),
    lines_added INT,
    lines_deleted INT,
    files_changed INT,
    commit_date DATETIME,
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""",
    }

    for table in tables:
        if table in schema_map:
            sql_statements.append(schema_map[table])

        # Get columns
        col_info = c.execute(f"PRAGMA table_info({table})").fetchall()
        col_names = [col[1] for col in col_info]
        cols_joined = ", ".join(col_names)

        # Get rows
        rows = c.execute(f"SELECT * FROM {table}").fetchall()
        print(f"Table {table}: {len(rows)} rows")

        for row in rows:
            values_escaped = [escape_sql(v) for v in row]
            vals_joined = ", ".join(values_escaped)
            sql_statements.append(
                f"REPLACE INTO {table} ({cols_joined}) VALUES ({vals_joined});"
            )

    sql_statements.append("SET FOREIGN_KEY_CHECKS = 1;")
    full_sql = "\n".join(sql_statements)

    # Save SQL file for user reference
    dump_path = Path("c:/xampp/htdocs/GitContrib/gitcontrib_mysql_dump.sql")
    dump_path.write_text(full_sql, encoding="utf-8")
    print(f"Saved SQL dump to {dump_path}")

    # Import directly into XAMPP MySQL databases: gitcontrib and gitcontrib_db
    for db_name in ["gitcontrib", "gitcontrib_db"]:
        print(f"\nImporting into XAMPP MySQL database '{db_name}'...")
        res = subprocess.run(
            [str(MYSQL_BIN), "-u", "root", db_name],
            input=full_sql,
            text=True,
            capture_output=True,
            encoding="utf-8",
        )
        if res.returncode == 0:
            print(f"✓ Successfully imported into {db_name}!")
        else:
            print(f"✗ Error importing into {db_name}: {res.stderr}")

    print("\nMigration complete!")

if __name__ == "__main__":
    main()
