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

import json
import os
import re
import shutil
import stat
import subprocess
import tempfile
import urllib.request
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


def fetch_github_email_to_username(repo_url: str | None) -> dict[str, str]:
    """
    Jika repo berasal dari GitHub, coba ambil mapping email -> GitHub username
    menggunakan GitHub Commits API agar nama contributor sesuai dengan tampilan GitHub.
    Akan fallback otomatis tanpa error jika offline, repo private, atau rate-limit.
    """
    if not repo_url:
        return {}
    match = re.search(r"github\.com[/:]([\w.\-]+)/([\w.\-]+?)(?:\.git|/.*)?$", repo_url)
    if not match:
        return {}
    owner, repo = match.group(1), match.group(2)
    api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=100"
    mapping: dict[str, str] = {}
    try:
        req = urllib.request.Request(
            api_url,
            headers={
                "User-Agent": "GitContrib-Viewer/1.0",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, list):
                for item in data:
                    commit_info = item.get("commit", {})
                    author_info = item.get("author")
                    if author_info and "login" in author_info:
                        login = author_info["login"]
                        c_author = commit_info.get("author", {})
                        if c_author and "email" in c_author:
                            e = c_author["email"].strip().lower()
                            if e:
                                mapping[e] = login
                        c_committer = commit_info.get("committer", {})
                        if c_committer and "email" in c_committer:
                            ce = c_committer["email"].strip().lower()
                            if ce and ce not in mapping:
                                mapping[ce] = login
    except Exception:
        pass
    return mapping


def get_remote_origin_url(repo_path: Path) -> str | None:
    """Ambil URL origin remote dari folder git lokal jika ada."""
    try:
        out = run_git(["remote", "get-url", "origin"], cwd=repo_path).strip()
        return out if out else None
    except Exception:
        return None


def load_raw_commits(repo_path: Path, limit: int) -> list[dict]:
    """Membaca daftar commit mentah dari git log di SEMUA branch (--all)."""
    fmt = FIELD_SEP.join(["%H", "%an", "%ae", "%aI", "%s"]) + RECORD_SEP
    out = run_git(
        ["log", "--all", f"--max-count={limit}", f"--pretty=format:{fmt}"],
        cwd=repo_path,
    )
    records = []
    seen_hashes: set[str] = set()
    for record in out.split(RECORD_SEP):
        record = record.strip("\n")
        if not record:
            continue
        parts = record.split(FIELD_SEP, maxsplit=4)
        if len(parts) < 5:
            continue
        sha, author, email, date, message = parts
        sha = sha.strip()
        if sha in seen_hashes:
            continue
        seen_hashes.add(sha)
        records.append(
            {
                "sha": sha,
                "author": author.strip(),
                "email": email.strip(),
                "date": date.strip(),
                "message": message,
            }
        )
    return records


def process_commits_dataframe(
    raw_records: list[dict],
    repo_url: str | None = None,
    group_by_identity: bool = True,
    gh_email_map: dict[str, str] | None = None,
) -> pd.DataFrame:
    """
    Konversi record commit mentah ke DataFrame dengan resolusi contributor cerdas:
    - Jika group_by_identity True: menyatukan commit dengan email sama dan menyinkronkan
      nama contributor dengan username GitHub asli (seperti 'Crist' & 'Crist-afk' -> Crist-afk).
    - Jika False: menggunakan nama git author mentah apa adanya.
    """
    if gh_email_map is None:
        gh_email_map = (
            fetch_github_email_to_username(repo_url)
            if (group_by_identity and repo_url)
            else {}
        )

    # Hitung frekuensi nama author per email untuk menentukan nama kanonikal
    email_name_counts: dict[str, dict[str, int]] = {}
    for r in raw_records:
        e = r["email"].lower() if r["email"] else "unknown"
        author = r["author"] or "Unknown"
        if e not in email_name_counts:
            email_name_counts[e] = {}
        email_name_counts[e][author] = email_name_counts[e].get(author, 0) + 1

    canonical_for_email: dict[str, str] = {}
    for e, counts in email_name_counts.items():
        if e in gh_email_map:
            canonical_for_email[e] = gh_email_map[e]
        else:
            best_name = max(counts.items(), key=lambda x: x[1])[0]
            canonical_for_email[e] = best_name

    rows = []
    for r in raw_records:
        sha = r["sha"]
        author = r["author"]
        email = r["email"]
        date = r["date"]
        message = r["message"]
        e = email.lower() if email else "unknown"

        if group_by_identity:
            contrib_name = canonical_for_email.get(e, author)
        else:
            contrib_name = author

        rows.append(
            {
                "Hash": sha,
                "Hash Pendek": sha[:7],
                "Contributor": contrib_name,
                "Nama Git": author,
                "Email": email,
                "Waktu": pd.to_datetime(date, utc=True),
                "Pesan": message,
            }
        )
    return pd.DataFrame(rows)


def load_commits(
    repo_path: Path,
    limit: int,
    repo_url: str | None = None,
    group_by_identity: bool = True,
    gh_email_map: dict[str, str] | None = None,
) -> tuple[pd.DataFrame, list[dict], dict[str, str]]:
    """Membaca commit dan mengembalikan (DataFrame, raw_records, gh_email_map)."""
    raw = load_raw_commits(repo_path, limit)
    if gh_email_map is None and repo_url and group_by_identity:
        gh_email_map = fetch_github_email_to_username(repo_url)
    elif gh_email_map is None:
        gh_email_map = {}
    df = process_commits_dataframe(raw, repo_url, group_by_identity, gh_email_map)
    return df, raw, gh_email_map


def get_commit_stat_lines(repo_path: Path, sha: str) -> tuple[int, int]:
    """
    Ambil jumlah baris yang ditambahkan dan dihapus untuk satu commit.
    Mengembalikan (lines_added, lines_deleted).
    """
    try:
        out = run_git(
            ["show", "--format=", "--numstat", sha],
            cwd=repo_path,
        )
        added = 0
        deleted = 0
        for line in out.strip().splitlines():
            parts = line.split("\t")
            if len(parts) >= 2:
                try:
                    added += int(parts[0])
                    deleted += int(parts[1])
                except ValueError:
                    # Biner atau "-" tidak bisa dikonversi
                    pass
        return added, deleted
    except Exception:
        return 0, 0


def get_commit_file_changes(repo_path: Path, sha: str) -> list[dict]:
    """
    Ambil informasi perubahan ukuran file untuk satu commit.
    Mengembalikan list dict {file, added, deleted}.
    """
    try:
        out = run_git(
            ["show", "--format=", "--numstat", sha],
            cwd=repo_path,
        )
        files = []
        for line in out.strip().splitlines():
            parts = line.split("\t")
            if len(parts) >= 3:
                fname = parts[2]
                try:
                    a = int(parts[0])
                    d = int(parts[1])
                except ValueError:
                    a, d = 0, 0
                files.append({"file": fname, "added": a, "deleted": d})
        return files
    except Exception:
        return []


def build_contributor_stats(commits: pd.DataFrame, repo_path: Path) -> pd.DataFrame:
    """
    Bangun statistik lengkap per contributor:
    - Jumlah commit
    - Active days
    - Contribution duration (hari)
    - Lines added (total)
    - Lines deleted (total)
    - Total lines changed
    - Jumlah file berubah (informasi pendukung perubahan ukuran file)
    """
    stats = []

    for contributor, grp in commits.groupby("Contributor"):
        n_commits = len(grp)
        times = grp["Waktu"]
        first_commit = times.min()
        last_commit = times.max()
        active_days = grp["Waktu"].dt.normalize().nunique()
        duration_days = max((last_commit - first_commit).days, 0)

        total_added = 0
        total_deleted = 0
        all_files: set = set()

        for sha in grp["Hash"]:
            a, d = get_commit_stat_lines(repo_path, sha)
            total_added += a
            total_deleted += d
            fc = get_commit_file_changes(repo_path, sha)
            for f in fc:
                all_files.add(f["file"])

        alias_names = (
            sorted(list(set(grp["Nama Git"].dropna().astype(str).tolist())))
            if "Nama Git" in grp
            else []
        )
        alias_emails = (
            sorted(list(set(grp["Email"].dropna().astype(str).tolist())))
            if "Email" in grp
            else []
        )

        stats.append(
            {
                "Contributor": contributor,
                "Nama Git": ", ".join(alias_names) if alias_names else contributor,
                "Email": ", ".join(alias_emails) if alias_emails else "-",
                "Jumlah Commit": n_commits,
                "Active Days": active_days,
                "Contribution Duration (hari)": duration_days,
                "Lines Added": total_added,
                "Lines Deleted": total_deleted,
                "Total Lines Changed": total_added + total_deleted,
                "Jumlah File Berubah": len(all_files),
                "Commit Pertama": first_commit.strftime("%Y-%m-%d %H:%M"),
                "Commit Terakhir": last_commit.strftime("%Y-%m-%d %H:%M"),
            }
        )

    df = (
        pd.DataFrame(stats)
        .sort_values("Jumlah Commit", ascending=False)
        .reset_index(drop=True)
    )
    return df


def get_commit_details(repo_path: Path, sha: str):
    """Ambil pesan penuh, ringkasan file (stat), dan diff patch (mendukung merge commit via --cc)."""
    full_message = run_git(["log", "-1", "--format=%B", sha], cwd=repo_path).strip()
    stat_out = run_git(["show", "--format=", "--stat", sha], cwd=repo_path)
    diff = run_git(["show", "--format=", "--patch", "--cc", sha], cwd=repo_path)
    truncated = len(diff) > MAX_DIFF_CHARS
    return full_message, stat_out, diff[:MAX_DIFF_CHARS], truncated


def cleanup():
    """Hapus folder sementara dan reset session state (hanya folder temp, tidak menyentuh repo lokal)."""
    if st.session_state.get("is_temp"):
        old = st.session_state.get("tmp_root")
        if old:
            safe_rmtree(old)
    for key in (
        "tmp_root",
        "repo_path",
        "raw_records",
        "commits",
        "repo_url",
        "is_temp",
        "contrib_stats",
        "gh_email_map",
        "last_group_mode",
    ):
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

    st.divider()
    group_mode = st.toggle(
        "Gabungkan Akun/Email (Sesuai GitHub)",
        value=True,
        help="Menyatukan nama git author yang menggunakan email sama (misal 'Crist' dan 'Crist-afk') dan mendeteksi username GitHub asli. Memastikan jumlah contributor akurat sesuai GitHub Insights.",
    )

    if st.session_state.get("repo_path"):
        st.divider()
        if st.button("Tutup / Hapus Cache", use_container_width=True):
            cleanup()
            st.rerun()

# Cek perubahan toggle group_mode saat repo sudah dimuat
if "raw_records" in st.session_state and st.session_state["raw_records"]:
    if st.session_state.get("last_group_mode") != group_mode:
        st.session_state["commits"] = process_commits_dataframe(
            st.session_state["raw_records"],
            st.session_state.get("repo_url"),
            group_mode,
            st.session_state.get("gh_email_map"),
        )
        st.session_state["last_group_mode"] = group_mode
        st.session_state.pop("contrib_stats", None)

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
            origin_remote = get_remote_origin_url(p)
            st.session_state["repo_url"] = origin_remote if origin_remote else str(p)

        with st.spinner("Membaca riwayat commit & menyinkronkan data kontributor..."):
            commits, raw_records, gh_email_map = load_commits(
                repo_path,
                int(limit),
                repo_url=st.session_state.get("repo_url"),
                group_by_identity=group_mode,
            )

        st.session_state["repo_path"] = str(repo_path)
        st.session_state["raw_records"] = raw_records
        st.session_state["gh_email_map"] = gh_email_map
        st.session_state["commits"] = commits
        st.session_state["last_group_mode"] = group_mode
        st.session_state.pop("contrib_stats", None)
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

repo_path_val = st.session_state.get("repo_path")
if not repo_path_val:
    st.stop()
repo_path = Path(repo_path_val)

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

tab_commits, tab_contrib = st.tabs(["📜 Daftar Commit & Diff", "👥 Contributor & Analisis"])

# ---- Tab Contributor
with tab_contrib:
    st.subheader("📊 Indikator Kontribusi")

    # Disclaimer penting
    st.info(
        "ℹ️ **Catatan:** Jumlah commit **tidak boleh dijadikan satu-satunya ukuran kontribusi**. "
        "Analisis ini menggunakan beberapa indikator untuk memberikan gambaran lebih lengkap "
        "tentang aktivitas contributor. "
        "Hasil analisis pola aktivitas mencerminkan **data historis git**, bukan penilaian mutlak "
        "atas produktivitas atau kemampuan seseorang."
    )

    # Tabel indikator yang dianalisis
    with st.expander("📋 Indikator yang Dianalisis", expanded=False):
        indicator_df = pd.DataFrame(
            {
                "Indikator": [
                    "Jumlah Commit",
                    "Active Days",
                    "Contribution Duration",
                    "Lines Added",
                    "Lines Deleted",
                    "Total Lines Changed",
                    "Perubahan Ukuran File",
                ],
                "Penjelasan": [
                    "Banyaknya commit yang tercatat.",
                    "Jumlah hari ketika contributor melakukan aktivitas commit.",
                    "Rentang waktu aktivitas kontribusi (dari commit pertama ke terakhir).",
                    "Jumlah baris kode yang ditambahkan.",
                    "Jumlah baris kode yang dihapus.",
                    "Total perubahan baris yang dihitung dari penambahan dan penghapusan.",
                    "Informasi pendukung tentang perubahan file (jumlah file yang tersentuh).",
                ],
            }
        )
        st.dataframe(indicator_df, use_container_width=True, hide_index=True)

    # Hitung statistik contributor (dengan caching di session_state)
    if "contrib_stats" not in st.session_state:
        with st.spinner(
            "Menghitung statistik kontribusi lengkap (lines added/deleted per commit)... "
            "Ini mungkin memakan waktu untuk repo besar."
        ):
            contrib_stats = build_contributor_stats(commits, repo_path)
            st.session_state["contrib_stats"] = contrib_stats
    else:
        contrib_stats = st.session_state["contrib_stats"]

    # Tabel statistik lengkap
    st.markdown("### 📋 Tabel Statistik Kontribusi")
    st.dataframe(contrib_stats, use_container_width=True, hide_index=True)

    # ---- Visualisasi per indikator
    st.markdown("### 📈 Visualisasi Indikator")

    viz_col1, viz_col2 = st.columns(2)

    with viz_col1:
        st.markdown("**Jumlah Commit per Contributor**")
        st.bar_chart(contrib_stats.set_index("Contributor")["Jumlah Commit"])

        st.markdown("**Active Days per Contributor**")
        st.bar_chart(contrib_stats.set_index("Contributor")["Active Days"])

        st.markdown("**Contribution Duration (hari) per Contributor**")
        st.bar_chart(contrib_stats.set_index("Contributor")["Contribution Duration (hari)"])

    with viz_col2:
        st.markdown("**Lines Added per Contributor**")
        st.bar_chart(contrib_stats.set_index("Contributor")["Lines Added"])

        st.markdown("**Lines Deleted per Contributor**")
        st.bar_chart(contrib_stats.set_index("Contributor")["Lines Deleted"])

        st.markdown("**Total Lines Changed per Contributor**")
        st.bar_chart(contrib_stats.set_index("Contributor")["Total Lines Changed"])

    st.markdown("**Jumlah File Berubah (Perubahan Ukuran File) per Contributor**")
    st.bar_chart(contrib_stats.set_index("Contributor")["Jumlah File Berubah"])

    # ---- Pola Aktivitas (ML disclaimer)
    st.markdown("### 🤖 Pola Aktivitas Berbasis Data")
    st.warning(
        "⚠️ **Disclaimer Machine Learning:** Hasil analisis pola di bawah ini dihasilkan dari data git "
        "dan ditampilkan sebagai **pola aktivitas berdasarkan data**, bukan sebagai bukti mutlak "
        "mengenai produktivitas atau kemampuan seseorang. "
        "Konteks proyek, tipe pekerjaan, dan faktor lain di luar git perlu dipertimbangkan."
    )

    if not contrib_stats.empty:
        cs = contrib_stats.copy()
        cs["Commit per Active Day"] = (
            cs["Jumlah Commit"] / cs["Active Days"].replace(0, 1)
        ).round(2)
        cs["Avg Lines Changed per Commit"] = (
            cs["Total Lines Changed"] / cs["Jumlah Commit"].replace(0, 1)
        ).round(1)
        cs["Avg Lines Added per Commit"] = (
            cs["Lines Added"] / cs["Jumlah Commit"].replace(0, 1)
        ).round(1)

        pattern_df = cs[
            [
                "Contributor",
                "Jumlah Commit",
                "Active Days",
                "Commit per Active Day",
                "Total Lines Changed",
                "Avg Lines Changed per Commit",
                "Avg Lines Added per Commit",
                "Contribution Duration (hari)",
            ]
        ]
        st.markdown("**Ringkasan Pola Aktivitas:**")
        st.dataframe(pattern_df, use_container_width=True, hide_index=True)

        st.markdown("**Intensitas Kontribusi: Commit per Active Day**")
        st.bar_chart(cs.set_index("Contributor")["Commit per Active Day"])

        st.markdown("**Rata-rata Perubahan Baris per Commit**")
        st.bar_chart(cs.set_index("Contributor")["Avg Lines Changed per Commit"])

        st.caption(
            "🔍 *Commit per Active Day* mencerminkan seberapa sering contributor melakukan commit "
            "pada hari-hari aktifnya. "
            "*Avg Lines Changed per Commit* memberikan gambaran ukuran rata-rata setiap perubahan. "
            "Kedua metrik ini adalah **pola observasional**, bukan penilaian kualitas."
        )

# ---- Tab Commit
with tab_commits:
    # ---- Contributor Card Selector
    st.subheader("👤 Kartu Indikator Contributor")
    st.caption("Pilih nama contributor untuk melihat ringkasan indikator kontribusinya.")

    all_contributors = sorted(commits["Contributor"].unique())
    card_contributor = st.selectbox(
        "Pilih contributor:",
        options=[""] + all_contributors,
        format_func=lambda x: "— Pilih contributor —" if x == "" else x,
        key="card_contributor_selector",
    )

    if card_contributor:
        # Ambil atau hitung contrib_stats jika belum ada
        if "contrib_stats" not in st.session_state:
            with st.spinner("Menghitung statistik kontribusi..."):
                contrib_stats_card = build_contributor_stats(commits, repo_path)
                st.session_state["contrib_stats"] = contrib_stats_card
        else:
            contrib_stats_card = st.session_state["contrib_stats"]

        row_c = contrib_stats_card[contrib_stats_card["Contributor"] == card_contributor]

        if not row_c.empty:
            rc = row_c.iloc[0]

            # ---- Contributor Card UI
            with st.container(border=True):
                st.markdown(f"### 👤 {rc['Contributor']}")
                git_name_str = rc.get("Nama Git", rc['Contributor'])
                email_str = rc.get("Email", "-")
                st.caption(
                    f"🏷️ **Nama Git:** `{git_name_str}` &nbsp;|&nbsp; "
                    f"📧 **Email:** `{email_str}`  \n"
                    f"📅 Commit pertama: **{rc['Commit Pertama']}** &nbsp;→&nbsp; "
                    f"Commit terakhir: **{rc['Commit Terakhir']}**"
                )
                st.divider()

                # Baris 1: Commit & waktu
                ca, cb, cc = st.columns(3)
                ca.metric(
                    "📌 Jumlah Commit",
                    rc["Jumlah Commit"],
                    help="Banyaknya commit yang tercatat.",
                )
                cb.metric(
                    "📆 Active Days",
                    rc["Active Days"],
                    help="Jumlah hari ketika contributor melakukan aktivitas commit.",
                )
                cc.metric(
                    "⏳ Contribution Duration",
                    f"{rc['Contribution Duration (hari)']} hari",
                    help="Rentang waktu aktivitas kontribusi (dari commit pertama ke terakhir).",
                )

                # Baris 2: Lines
                cd, ce, cf = st.columns(3)
                cd.metric(
                    "➕ Lines Added",
                    f"+{rc['Lines Added']:,}",
                    help="Jumlah baris kode yang ditambahkan.",
                )
                ce.metric(
                    "➖ Lines Deleted",
                    f"-{rc['Lines Deleted']:,}",
                    help="Jumlah baris kode yang dihapus.",
                )
                cf.metric(
                    "🔀 Total Lines Changed",
                    f"{rc['Total Lines Changed']:,}",
                    help="Total perubahan baris yang dihitung dari penambahan dan penghapusan.",
                )

                # Baris 3: File changes
                cg, ch, ci = st.columns(3)
                cg.metric(
                    "📁 File Berubah",
                    rc["Jumlah File Berubah"],
                    help="Informasi pendukung tentang perubahan file (jumlah file yang tersentuh).",
                )
                # Derived pattern metrics
                commit_per_day = (
                    round(rc["Jumlah Commit"] / rc["Active Days"], 2)
                    if rc["Active Days"] > 0
                    else 0
                )
                avg_lines = (
                    round(rc["Total Lines Changed"] / rc["Jumlah Commit"], 1)
                    if rc["Jumlah Commit"] > 0
                    else 0
                )
                ch.metric(
                    "📊 Commit / Active Day",
                    commit_per_day,
                    help="Rata-rata commit per hari aktif (pola intensitas).",
                )
                ci.metric(
                    "📏 Avg Lines / Commit",
                    avg_lines,
                    help="Rata-rata total baris berubah per commit.",
                )

                # Filter commit milik contributor ini
                contrib_commits = commits[commits["Contributor"] == card_contributor]
                with st.expander(
                    f"📜 Lihat {len(contrib_commits)} commit dari {card_contributor}",
                    expanded=False,
                ):
                    tbl = contrib_commits[["Hash Pendek", "Waktu", "Pesan"]].copy()
                    tbl["Waktu"] = tbl["Waktu"].dt.strftime("%Y-%m-%d %H:%M UTC")
                    st.dataframe(tbl, use_container_width=True, hide_index=True)

                st.caption(
                    "⚠️ Data di atas adalah **pola aktivitas berdasarkan data git**, "
                    "bukan penilaian mutlak atas produktivitas atau kemampuan seseorang."
                )

    st.divider()

    # ---- Filter & Tabel Commit
    st.subheader("📜 Daftar Commit")
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
            full_msg, stat_out, diff, truncated = get_commit_details(repo_path, sha)

            # Hitung lines added/deleted untuk commit yang dipilih
            lines_added, lines_deleted = get_commit_stat_lines(repo_path, sha)
            file_changes = get_commit_file_changes(repo_path, sha)

            # ---- Mini Contributor Card untuk commit ini
            contributor_name = row["Contributor"]
            if "contrib_stats" in st.session_state:
                cs_df = st.session_state["contrib_stats"]
                row_mini = cs_df[cs_df["Contributor"] == contributor_name]
                if not row_mini.empty:
                    rm = row_mini.iloc[0]
                    with st.container(border=True):
                        mini_col_title, mini_col_rest = st.columns([2, 5])
                        mini_col_title.markdown(f"**👤 {contributor_name}**")
                        mini_col_rest.caption(
                            f"📌 {rm['Jumlah Commit']} commit &nbsp;|&nbsp; "
                            f"📆 {rm['Active Days']} active days &nbsp;|&nbsp; "
                            f"⏳ {rm['Contribution Duration (hari)']} hari durasi &nbsp;|&nbsp; "
                            f"➕ +{rm['Lines Added']:,} baris &nbsp;|&nbsp; "
                            f"➖ -{rm['Lines Deleted']:,} baris &nbsp;|&nbsp; "
                            f"🔀 {rm['Total Lines Changed']:,} total changed &nbsp;|&nbsp; "
                            f"📁 {rm['Jumlah File Berubah']} file berubah"
                        )

            contributor_name = row["Contributor"]
            git_name_val = row.get("Nama Git", contributor_name)
            git_label_extra = f" *(Git: {git_name_val})*" if git_name_val != contributor_name else ""

            st.markdown(
                f"**Commit:** `{sha}`  \n"
                f"**Contributor:** {contributor_name}{git_label_extra} ({row['Email']})  \n"
                f"**Waktu:** {format_waktu(row['Waktu'])}"
            )

            # Metrik perubahan baris untuk commit yang dipilih
            m1, m2, m3, m4 = st.columns(4)
            m1.metric("Lines Added", f"+{lines_added}")
            m2.metric("Lines Deleted", f"-{lines_deleted}")
            m3.metric("Total Lines Changed", lines_added + lines_deleted)
            m4.metric("File Berubah", len(file_changes))

            with st.expander("Lihat Pesan Commit Lengkap", expanded=True):
                st.code(full_msg or row['Pesan'], language="text")

            # Detail perubahan ukuran file
            if file_changes:
                with st.expander("📁 Detail Perubahan File (Perubahan Ukuran File)", expanded=False):
                    fc_df = pd.DataFrame(file_changes)
                    fc_df.columns = ["File", "Lines Added", "Lines Deleted"]
                    fc_df["Total Changed"] = fc_df["Lines Added"] + fc_df["Lines Deleted"]
                    st.dataframe(fc_df, use_container_width=True, hide_index=True)

            if stat_out.strip():
                st.markdown("**Ringkasan File yang Berubah:**")
                st.code(stat_out, language="text")
            if diff.strip():
                st.markdown("**Diff Perubahan Kode:**")
                st.code(diff, language="diff")
                if truncated:
                    st.warning(f"Diff dipotong karena melebihi batas {MAX_DIFF_CHARS:,} karakter.")
            else:
                st.info("Commit ini tidak memiliki perbedaan file (misal merge commit tanpa konflik).")
        except Exception as e:
            st.error(f"Gagal membaca detail diff: {e}")
