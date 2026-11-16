# Panduan Alur Video – Tugas Praktik 3

Alur penjelasan disusun mengikuti urutan kriteria penilaian 1.1 sampai 1.8. Durasi yang disarankan sekitar 12–15 menit. Siapkan dua jendela: **browser** (aplikasi) dan **VS Code** (kode). Sebelum merekam, buka menu pengguna di kanan atas lalu klik **"Pulihkan data awal"** agar data kembali bersih.

---

## 0. Pembuka (±1 menit)
- Perkenalkan diri: nama, NIM, prodi, UPBJJ.
- Jelaskan tujuan aplikasi: SITTA untuk pemesanan dan distribusi bahan ajar UT, dibangun dengan Vue.js 2 memakai konsep **Vue Component dan Template**.
- Demo singkat keempat menu: Beranda, Stok, Pemesanan, dan Tracking.

## 1. Arsitektur & struktur proyek – kriteria 1.1 (±2 menit)
Tampilkan pohon folder di VS Code.
- `index.html` adalah satu-satunya HTML. Tunjukkan custom element `<app-sider>`, `<app-header>`, dan `<halaman-stok>`, serta urutan `<script>`.
- Folder `js/components/` berisi satu file untuk satu komponen, dan nama file sama dengan nama tag.
- Buka `badge-status.js` sebagai contoh komponen paling sederhana: `Vue.component(...)`, `props`, dan **property `template`**.
- Buka `app.js`: root instance menyimpan data, lalu menjelaskan **props down, events up**. Tunjukkan bagian `@tambah-stok="tambahStok"` di `index.html` dan `this.$emit('tambah-stok', data)` di `halaman-stok.js`.
- Tunjukkan `<modal-dialog>` yang memakai **slot**, dan `<form-bahan-ajar>` yang dipakai ulang untuk mode tambah dan edit.

> **Argumen:** Pemecahan menjadi komponen membuat kode mudah dirawat dan dipakai ulang. Contohnya, badge status ditulis sekali dan dipakai di tiga tempat. Data dipusatkan di root agar semua halaman selalu sinkron.

## 2. Data binding, v-for, dan filter – kriteria 1.2 (±2 menit)
Buka halaman Stok dan `halaman-stok.js`.
- Mustache `{{ }}`, `v-text` (lokasi rak), dan `v-html` (kolom catatan, tunjukkan teks miring/tebal yang ikut ter-render).
- `v-bind`: `:class` untuk warna baris dan `:style` untuk lebar bar stok.
- `v-model`: ketik di kolom pencarian dan tabel langsung tersaring (two-way).
- `v-for` **zero-based**: kolom No memakai `index + 1`.
- `v-for` **name-based**: di Beranda, `(info, daerah, index) in stokPerDaerah`. Di Tracking, tab status `(jumlah, status) in jumlahPerStatus`.
- Buka `filters.js` dan tunjukkan `{{ item.harga | rupiah }}`, `{{ judul | potong(30) }}` (filter dengan argumen), serta `tanggalWaktu` di timeline.

> **Argumen:** Filter hanya mengubah tampilan, data asli tetap berupa angka sehingga masih bisa diurutkan dan dihitung.

## 3. Conditional – kriteria 1.3 (±1 menit)
- `badge-stok`: rantai `v-if` / `v-else-if` / `v-else` untuk status Kosong, Menipis, dan Aman.
- Filter kategori baru muncul setelah UT-Daerah dipilih (`v-if` / `v-else`).
- `v-show` pada baris tag filter aktif. Jelaskan bedanya: `v-show` hanya menyembunyikan dengan CSS, sedangkan `v-if` benar-benar menghapus elemen.
- Di Tracking, form riwayat diganti pesan "Pengiriman selesai" bila status sudah Terkirim.

## 4. Computed & Methods – kriteria 1.4 (±1,5 menit)
- `stokTerfilter` lalu `stokTampil` adalah computed yang di-*cache*. Filter tidak dihitung ulang kecuali data atau filter berubah.
- `nomorDOBaru` di Pemesanan dibuat otomatis dari data tracking.
- Bandingkan dengan **methods** `hematPaket(p)` dan `rincianIsi(p)`, yang dipakai karena butuh argumen untuk tiap paket di dalam `v-for`.

## 5. Watchers – kriteria 1.5 (±1,5 menit)
Demokan dan tunjukkan kodenya:
- Ketik NIM berisi huruf. Huruf langsung terbuang oleh watcher `form.nim`.
- Ketik kode `ekma4117`. Isian otomatis menjadi kapital (watcher `form.kode`).
- Pilih UT-Daerah lalu kategori, kemudian ganti UT-Daerah. Kategori ter-reset (watcher `filter.upbjj`).
- Watcher `stok` dan `tracking` (deep) menyimpan ke localStorage. Refresh halaman untuk membuktikan datanya tetap ada.
- Watcher `nilai` (immediate) di kartu statistik menjalankan animasi angka.

## 6. Formulir, validasi, event mouse & keyboard – kriteria 1.6 (±2,5 menit)
- Tekan `N` di halaman stok, lalu `Ctrl+Enter` saat form masih kosong. Muncul 8 pesan error dan kursor pindah ke field pertama. Isi satu per satu dan tunjukkan error hilang secara langsung.
- Klik dua kali sebuah baris untuk membuka edit, lalu tekan `Esc` untuk menutup.
- Klik judul kolom untuk mengurutkan. Arahkan mouse ke kartu statistik (mouseenter).
- `Alt+3` untuk pindah ke Pemesanan. Isi form, klik kartu paket, pilih ekspedisi, lalu klik **Buat DO**. Aplikasi otomatis pindah ke Tracking.
- Di Tracking: ketik nomor DO huruf kecil lalu `Enter`, klik daftar lalu tekan `↑ ↓`, kemudian tambah riwayat dengan `Enter`.
- Tunjukkan kodenya: modifier `@keydown.ctrl.enter`, `@keyup.esc`, `@dblclick`, `@click.self`, serta listener global di `mounted()` / `beforeDestroy()`.

## 7. Kreativitas UI – kriteria 1.7 (±1 menit)
- Kartu statistik yang bisa diklik membuka stok yang sudah terfilter re-order.
- Ringkasan pesanan langsung, progress bar kelengkapan form, dan info hemat paket.
- Sebutkan bahwa tampilan sengaja dibuat konsisten dengan Tugas 1 (design system gaya Ant Design yang sama).
- Banner sapaan yang berubah warna sesuai waktu, jam berjalan, steps status DO, timeline, dan tombol "Salin No. DO".
- Lencana merah di menu samping, notifikasi di atas layar, modal pintasan keyboard (tekan `?`), dan transisi halaman.
- Kecilkan jendela browser untuk menunjukkan tampilan responsif dan menu samping yang bisa dibuka-tutup.

## 8. Penutup (±30 detik)
- Rangkum konsep yang diterapkan: component, template, props/emit, directive, computed, watcher, filter, dan event.
- Sebutkan keterbatasan: data masih tersimpan di localStorage dan belum memakai backend/API.
