"""
GitHub Commit Viewer
--------------------
Clone repo GitHub dari link, lalu lihat daftar commit beserta
waktu, contributor, dan diff (perubahan kode) tiap commit.

Cara jalankan:
    pip install streamlit pandas
    streamlit run github_commit_viewer.py

Syarat: Git sudah terinstall di komputer (cek dengan `git --version`).
"""

import os
import re
import shutil
import stat
import subprocess
import tempfile
from pathlib import Path

import pandas as pd
# pyrefly: ignore [missing-import]
import streamlit as st

# ---------------------------------------------------------------- konfigurasi
st.set_page_config(page_title="GitHub Commit Viewer", page_icon="🔍", layout="wide")

FIELD_SEP = "\x1f"
RECORD_SEP = "\x1e"
MAX_DIFF_CHARS = 200_000  # batasi diff agar browser tidak berat


# ------------------------------------------------------------------- helper file & git
def safe_rmtree(path: Path | str | None):
    """Hapus folder sementara dengan aman di Windows (mengatasi file read-only .git)."""
    if not path:
        return
    p = Path(path)
    if not p.exists():
        return

    def handle_remove_readonly(func, target_path, exc):
        try:
            os.chmod(target_path, stat.S_IWRITE)
            func(target_path)
        except Exception:
            pass

    try:
        shutil.rmtree(p, onexc=handle_remove_readonly)
    except TypeError:
        shutil.rmtree(p, onerror=handle_remove_readonly)
    except Exception:
        pass


def run_git(args, cwd=None, timeout=300):
    """Jalankan perintah git dengan UTF-8 dan kembalikan stdout. Raise error bila gagal."""
    full_args = ["git", "-c", "i18n.logOutputEncoding=utf-8", *args]
    result = subprocess.run(
        full_args,
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )
    if result.returncode != 0:
        err = result.stderr.strip() or result.stdout.strip() or "Perintah git gagal."
        raise RuntimeError(err)
    return result.stdout


def parse_github_url(raw: str) -> str:
    """Bersihkan dan validasi URL GitHub, mendukung URL web (misal /tree/main, www., dll)."""
    url = raw.strip()
    if not url:
        raise ValueError("Link GitHub tidak boleh kosong.")
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    match = re.match(
        r"^https?://(?:www\.)?github\.com/([\w.\-]+)/([\w.\-]+?)(?:\.git|/.*)?$", url
    )
    if not match:
        raise ValueError(
            "Link tidak valid. Gunakan format seperti: https://github.com/pemilik/nama-repo"
        )
    owner, repo = match.group(1), match.group(2)
    return f"https://github.com/{owner}/{repo}.git"


def clone_repo(url: str) -> Path:
    """Clone repo ke folder sementara (riwayat penuh agar semua commit terbaca)."""
    norm_url = parse_github_url(url)
    tmp_dir = Path(tempfile.mkdtemp(prefix="gh_viewer_"))
    repo_dir = tmp_dir / "repo"
    try:
        run_git(["clone", "--quiet", "--", norm_url, str(repo_dir)])
    except Exception:
        safe_rmtree(tmp_dir)
        raise
    return repo_dir


def load_commits(repo_path: Path, limit: int) -> pd.DataFrame:
    """Membaca daftar commit dari git log."""
    fmt = FIELD_SEP.join(["%H", "%an", "%ae", "%aI", "%s"]) + RECORD_SEP
    out = run_git(
        ["log", f"--max-count={limit}", f"--pretty=format:{fmt}"], cwd=repo_path
    )
    rows = []
    for record in out.split(RECORD_SEP):
        record = record.strip("\n")
        if not record:
            continue
        parts = record.split(FIELD_SEP, maxsplit=4)
        if len(parts) < 5:
            continue
        sha, author, email, date, message = parts
        rows.append(
            {
                "Hash": sha.strip(),
                "Hash Pendek": sha.strip()[:7],
                "Contributor": author,
                "Email": email,
                "Waktu": pd.to_datetime(date, utc=True),
                "Pesan": message,
            }
        )
    return pd.DataFrame(rows)


def get_commit_details(repo_path: Path, sha: str):
    """Ambil pesan penuh, ringkasan file (stat), dan diff patch (mendukung merge commit via --cc)."""
    full_message = run_git(["log", "-1", "--format=%B", sha], cwd=repo_path).strip()
    stat = run_git(["show", "--format=", "--stat", sha], cwd=repo_path)
    diff = run_git(["show", "--format=", "--patch", "--cc", sha], cwd=repo_path)
    truncated = len(diff) > MAX_DIFF_CHARS
    return full_message, stat, diff[:MAX_DIFF_CHARS], truncated


def cleanup():
    """Hapus folder sementara dan reset session state (hanya folder temp, tidak menyentuh repo lokal)."""
    if st.session_state.get("is_temp"):
        old = st.session_state.get("tmp_root")
        if old:
            safe_rmtree(old)
    for key in ("tmp_root", "repo_path", "commits", "repo_url", "is_temp"):
        st.session_state.pop(key, None)


def format_waktu(ts) -> str:
    """Format timestamp dengan aman tanpa bergantung pada locale sistem."""
    try:
        return ts.strftime("%Y-%m-%d %H:%M:%S UTC")
    except Exception:
        return str(ts)


# ------------------------------------------------------------------------- UI
st.title("🔍 GitHub Commit Viewer")
st.caption("Lihat commit, waktu, contributor, dan diff perubahan kode dari repo GitHub atau folder lokal.")

with st.sidebar:
    st.header("Sumber Repository")
    mode = st.radio(
        "Pilih Sumber:",
        ["Link GitHub", "Folder Repo Lokal (di komputer)"],
        index=0,
    )

    if mode == "Link GitHub":
        url = st.text_input("Link GitHub", placeholder="https://github.com/user/repo")
        limit = st.number_input("Maksimal commit dimuat", 10, 20000, 500, step=50)
        load_btn = st.button("Clone & Muat Commit", type="primary", use_container_width=True)
    else:
        current_dir = str(Path.cwd())
        local_path = st.text_input("Path Folder Repo Git", value=current_dir)
        limit = st.number_input("Maksimal commit dimuat", 10, 20000, 500, step=50)
        load_btn = st.button("Muat Repo Lokal", type="primary", use_container_width=True)

    if st.session_state.get("repo_path"):
        st.divider()
        if st.button("Tutup / Hapus Cache", use_container_width=True):
            cleanup()
            st.rerun()

# Logika pemuatan repository
if load_btn:
    cleanup()
    try:
        if mode == "Link GitHub":
            if not url or not url.strip():
                st.sidebar.error("Masukkan link GitHub terlebih dahulu.")
                st.stop()
            with st.spinner("Meng-clone repository... (repo besar bisa agak lama)"):
                repo_path = clone_repo(url)
            st.session_state["is_temp"] = True
            st.session_state["tmp_root"] = str(repo_path.parent)
            st.session_state["repo_url"] = parse_github_url(url)
        else:
            p = Path(local_path.strip())
            if not p.exists() or not (p / ".git").exists():
                st.sidebar.error(f"Folder '{p}' bukan direktori Git yang valid (tidak ada .git).")
                st.stop()
            repo_path = p
            st.session_state["is_temp"] = False
            st.session_state["tmp_root"] = None
            st.session_state["repo_url"] = str(p)

        with st.spinner("Membaca riwayat commit..."):
            commits = load_commits(repo_path, int(limit))

        st.session_state["repo_path"] = str(repo_path)
        st.session_state["commits"] = commits
    except FileNotFoundError:
        st.error("Git belum terinstall di komputer. Silakan install Git terlebih dahulu.")
    except ValueError as e:
        st.error(str(e))
    except RuntimeError as e:
        st.error(f"Error Git: {e}")
    except Exception as e:
        st.error(f"Gagal memuat repository: {e}")

commits = st.session_state.get("commits")

if commits is None:
    st.info("Pilih sumber repo di sidebar lalu klik tombol untuk memuat commit.")
    st.stop()

if not isinstance(commits, pd.DataFrame) or commits.empty:
    st.warning("Repository ini tidak memiliki riwayat commit.")
    st.stop()

repo_path = Path(st.session_state["repo_path"])

# ---- Ringkasan
c1, c2, c3 = st.columns(3)
c1.metric("Total commit dimuat", len(commits))
c2.metric("Jumlah contributor", commits["Contributor"].nunique())
waktu_min = commits["Waktu"].min()
waktu_max = commits["Waktu"].max()
c3.metric(
    "Rentang waktu",
    f"{waktu_min.strftime('%d %b %Y')} → {waktu_max.strftime('%d %b %Y')}",
)
st.caption(f"**Target:** `{st.session_state['repo_url']}`")

tab_commits, tab_contrib = st.tabs(["📜 Daftar Commit & Diff", "👥 Contributor"])

# ---- Tab Contributor
with tab_contrib:
    summary = (
        commits.groupby("Contributor")
        .agg(
            Commit=("Hash", "count"),
            Pertama=("Waktu", "min"),
            Terakhir=("Waktu", "max"),
        )
        .sort_values("Commit", ascending=False)
        .reset_index()
    )
    summary["Pertama"] = summary["Pertama"].dt.strftime("%Y-%m-%d %H:%M")
    summary["Terakhir"] = summary["Terakhir"].dt.strftime("%Y-%m-%d %H:%M")
    st.dataframe(summary, use_container_width=True, hide_index=True)
    st.bar_chart(summary.set_index("Contributor")["Commit"])

# ---- Tab Commit
with tab_commits:
    f1, f2 = st.columns([1, 2])
    selected = f1.multiselect("Filter contributor", sorted(commits["Contributor"].unique()))
    keyword = f2.text_input("Cari di pesan commit")

    view = commits.copy()
    if selected:
        view = view[view["Contributor"].isin(selected)]
    if keyword:
        view = view[view["Pesan"].str.contains(keyword, case=False, na=False)]

    table = view[["Hash Pendek", "Waktu", "Contributor", "Pesan"]].copy()
    table["Waktu"] = table["Waktu"].dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    st.dataframe(table, use_container_width=True, hide_index=True, height=350)
    st.caption(f"Menampilkan {len(view)} commit dari total {len(commits)}.")

    st.divider()
    st.subheader("Detail & Diff Commit")

    if view.empty:
        st.info("Tidak ada commit yang cocok dengan filter.")
    else:
        # Buat label unik per commit untuk selectbox
        raw_options: dict[str, str] = {}
        seen: dict[str, int] = {}
        for _, r in view.iterrows():
            label = f"{r['Hash Pendek']} · {r['Waktu'].strftime('%Y-%m-%d %H:%M')} · {r['Contributor']} · {r['Pesan'][:70]}"
            if label in seen:
                seen[label] += 1
                label = f"{label} ({seen[label]})"
            else:
                seen[label] = 0
            raw_options[label] = r["Hash"]

        choice = st.selectbox("Pilih commit untuk melihat detail diff", list(raw_options.keys()))
        sha = raw_options[choice]
        row = commits[commits["Hash"] == sha].iloc[0]

        try:
            full_msg, stat, diff, truncated = get_commit_details(repo_path, sha)
            
            st.markdown(
                f"**Commit:** `{sha}`  \n"
                f"**Contributor:** {row['Contributor']} ({row['Email']})  \n"
                f"**Waktu:** {format_waktu(row['Waktu'])}"
            )
            
            with st.expander("Lihat Pesan Commit Lengkap", expanded=True):
                st.code(full_msg or row['Pesan'], language="text")

            if stat.strip():
                st.markdown("**Ringkasan File yang Berubah:**")
                st.code(stat, language="text")
            if diff.strip():
                st.markdown("**Diff Perubahan Kode:**")
                st.code(diff, language="diff")
                if truncated:
                    st.warning(f"Diff dipotong karena melebihi batas {MAX_DIFF_CHARS:,} karakter.")
            else:
                st.info("Commit ini tidak memiliki perbedaan file (misal merge commit tanpa konflik).")
        except Exception as e:
            st.error(f"Gagal membaca detail diff: {e}")
