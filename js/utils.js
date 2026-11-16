/* ==========================================================
   utils.js - Fungsi bantu umum (bukan komponen Vue)
   Dipakai bersama oleh app.js dan komponen-komponen.
   ========================================================== */

var Util = {
  // Salinan "dalam" (deep copy) agar data awal tidak ikut berubah
  salin: function (nilai) {
    return JSON.parse(JSON.stringify(nilai));
  },

  // Baca data dari localStorage; jika belum ada / gagal, pakai data cadangan
  muat: function (kunci, cadangan) {
    try {
      var tersimpan = localStorage.getItem(kunci);
      if (tersimpan) return JSON.parse(tersimpan);
    } catch (e) { /* localStorage tidak tersedia, pakai data awal */ }
    return Util.salin(cadangan);
  },

  simpan: function (kunci, nilai) {
    try {
      localStorage.setItem(kunci, JSON.stringify(nilai));
    } catch (e) { /* abaikan */ }
  },

  duaDigit: function (n) {
    return String(n).padStart(2, '0');
  },

  // Tanggal lokal (bukan UTC) format YYYY-MM-DD untuk input type="date"
  tanggalHariIni: function () {
    var d = new Date();
    return d.getFullYear() + '-' + Util.duaDigit(d.getMonth() + 1) + '-' + Util.duaDigit(d.getDate());
  },

  // Format YYYY-MM-DD HH:mm:ss, sama dengan format riwayat perjalanan di data
  waktuSekarang: function () {
    var d = new Date();
    return Util.tanggalHariIni() + ' ' + Util.duaDigit(d.getHours()) + ':' +
      Util.duaDigit(d.getMinutes()) + ':' + Util.duaDigit(d.getSeconds());
  },

  // Status stok: kosong (qty = 0) -> menipis (qty < safety) -> aman
  statusStok: function (item) {
    if (item.qty === 0) return 'kosong';
    if (item.qty < item.safety) return 'menipis';
    return 'aman';
  },

  perluReorder: function (item) {
    return item.qty === 0 || item.qty < item.safety;
  },

  // Satu kode mata kuliah bisa ada di beberapa UT-Daerah,
  // jadi identitas unik stok = kode + UT-Daerah
  kunciStok: function (item) {
    return item.kode + '@' + item.upbjj;
  },

  // True bila pengguna sedang mengetik di input, agar pintasan keyboard tidak mengganggu
  sedangMengetik: function (event) {
    var el = event.target;
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }
};
