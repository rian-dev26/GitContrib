"""Migrate SQLite gitcontrib.db tables and data into PostgreSQL."""

import sys
import sqlite3
import psycopg2
from pathlib import Path
import json
from datetime import datetime

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

SQLITE_PATH = Path("c:/xampp/htdocs/GitContrib/backend/gitcontrib.db")

# PostgreSQL connection params (adjust as needed)
PG_HOST = "localhost"
PG_PORT = 5432
PG_USER = "postgres"
PG_PASSWORD = "password"
PG_DB = "gitcontrib"

def escape_sql_value(val):
    """Escape value for PostgreSQL INSERT."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, datetime):
        return f"'{val.isoformat()}'"
    val_str = str(val).replace("\\", "\\\\").replace("'", "''")
    return f"'{val_str}'"

def main():
    print(f"Reading from {SQLITE_PATH}...")
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_c = sqlite_conn.cursor()

    tables = [row[0] for row in sqlite_c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    print(f"Found tables: {tables}")

    schema_map = {
        "analysis_jobs": """
CREATE TABLE IF NOT EXISTS analysis_jobs (
    job_id VARCHAR(50) PRIMARY KEY,
    repo_url VARCHAR(500) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    progress FLOAT DEFAULT 0.0,
    error_message VARCHAR(500),
    created_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
""",
        "analysis_results": """
CREATE TABLE IF NOT EXISTS analysis_results (
    result_id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    n_commits INT,
    n_contributors INT,
    n_clusters INT,
    summary JSONB,
    cluster_distribution JSONB,
    commit_type_distribution JSONB,
    created_at TIMESTAMP
);
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
    created_at TIMESTAMP
);
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
    commit_date TIMESTAMP,
    created_at TIMESTAMP
);
""",
    }

    insert_statements = []
    
    for table in tables:
        col_info = sqlite_c.execute(f"PRAGMA table_info({table})").fetchall()
        col_names = [col[1] for col in col_info]
        cols_joined = ", ".join(col_names)

        rows = sqlite_c.execute(f"SELECT * FROM {table}").fetchall()
        print(f"Table {table}: {len(rows)} rows")

        for row in rows:
            values_escaped = [escape_sql_value(v) for v in row]
            vals_joined = ", ".join(values_escaped)
            insert_statements.append(
                f"INSERT INTO {table} ({cols_joined}) VALUES ({vals_joined}) ON CONFLICT DO NOTHING;"
            )

    sqlite_conn.close()

    print(f"\nConnecting to PostgreSQL ({PG_HOST}:{PG_PORT}/{PG_DB})...")
    try:
        pg_conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            database=PG_DB
        )
        pg_cursor = pg_conn.cursor()

        print("Creating tables...")
        for table in tables:
            if table in schema_map:
                pg_cursor.execute(schema_map[table])

        print("Inserting data...")
        for stmt in insert_statements:
            try:
                pg_cursor.execute(stmt)
            except Exception as e:
                print(f"Warning: {e}")

        pg_conn.commit()
        pg_cursor.close()
        pg_conn.close()
        print("✓ Migration complete!")

    except psycopg2.Error as e:
        print(f"✗ PostgreSQL error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
