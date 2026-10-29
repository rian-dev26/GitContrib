# GitContrib

Aplikasi analisis pola kontribusi anggota tim berdasarkan histori aktivitas Git dari repository GitHub.

Dikembangkan sebagai bagian dari Project-Based Learning mata kuliah **IF314 Proyek Inovasi Agile** — Politeknik Negeri Batam.

---

## Tech Stack (Rencana)

| Layer | Teknologi |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + Recharts |
| Backend | Python + FastAPI |
| Data Pipeline | PyDriller + Pandas + Scikit-learn |
| Database | PostgreSQL |

Tujuan awal proyek GitContrib adalah membangun aplikasi berbasis web untuk membantu dosen menganalisis pola kontribusi setiap anggota tim dalam pengembangan proyek menggunakan repository GitHub.

Berdasarkan dokumen Rencana Pelaksanaan Proyek, masalah utamanya adalah jumlah commit saja belum cukup untuk menggambarkan aktivitas setiap anggota. Setiap commit memiliki jumlah dan jenis perubahan yang berbeda.

Tujuan proyek GitContrib meliputi:

1\. Menganalisis kontribusi anggota tim melalui histori GitHub, seperti jumlah commit, hari aktif, durasi kontribusi, baris kode yang ditambahkan, dihapus, dan diubah.

2\. Mengolah data kontribusi menggunakan Python, PyDriller, dan Pandas agar aktivitas setiap contributor lebih terstruktur.

3\. Menggunakan Machine Learning untuk mengidentifikasi pola kontribusi berdasarkan karakteristik aktivitas yang tercatat dalam repository.

4\. Menampilkan hasil analisis dalam dashboard berbasis web berupa statistik, grafik, dan informasi pola kontribusi.

5\. Menghasilkan laporan analisis yang bisa diunduh dalam format PDF dan CSV.

Tujuan akhirnya adalah membantu dosen memahami aktivitas kontribusi anggota tim berdasarkan data yang tersedia di GitHub.

Perlu dipahami bahwa GitContrib tidak bertujuan memberikan nilai akademik, menentukan anggota terbaik, atau menggantikan penilaian dosen. Sistem ini hanya menyediakan informasi pendukung berdasarkan histori Git.

Jadi, secara sederhana, GitContrib dibangun untuk menjawab pertanyaan: “Bagaimana dosen mengetahui pola kontribusi setiap anggota tim secara lebih terstruktur berdasarkan aktivitas mereka di GitHub?”

---

## Cara Menjalankan (Prototype Streamlit — saat ini)

**Prasyarat:**
- Python 3.9+
- Git terinstall di komputer

**Install dependensi:**
```bash
pip install -r requirements.txt
```

**Jalankan:**
```bash
streamlit run github_commit_viewer.py
```

Aplikasi akan berjalan di `http://localhost:8501`.

---

## Anggota Tim

| Nama | Role |
|---|---|
| (Nama Anda) | Backend + Data Pipeline |
| (Nama Rekan) | Frontend + UI/UX |
