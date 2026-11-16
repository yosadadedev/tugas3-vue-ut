/* ==========================================================
   filters.js - Global filter Vue untuk formatting teks
   Dipakai di template dengan tanda pipe, contoh:
     {{ item.harga | rupiah }}
     {{ item.judul | potong(25) }}
     {{ do.tanggalKirim | tanggal }}
   Filter hanya mengubah TAMPILAN, data aslinya tidak berubah.
   ========================================================== */

var NAMA_BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// 65000 -> "Rp 65.000"
Vue.filter('rupiah', function (nilai) {
  var angka = Number(nilai);
  if (nilai === '' || nilai === null || isNaN(angka)) return 'Rp -';
  return 'Rp ' + angka.toLocaleString('id-ID');
});

// 1250 -> "1.250"
Vue.filter('angka', function (nilai) {
  var angka = Number(nilai);
  if (isNaN(angka)) return nilai;
  return angka.toLocaleString('id-ID');
});

// "2025-08-25" -> "25 Agustus 2025"
Vue.filter('tanggal', function (iso) {
  if (!iso) return '-';
  var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
});

// "2025-08-25 14:07:56" -> "25 Agu 2025, 14:07"
Vue.filter('tanggalWaktu', function (teks) {
  if (!teks) return '-';
  var bagian = String(teks).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!bagian) return teks;
  return parseInt(bagian[3], 10) + ' ' + NAMA_BULAN_SINGKAT[parseInt(bagian[2], 10) - 1] + ' ' +
    bagian[1] + ', ' + bagian[4] + ':' + bagian[5];
});

// "rina wulandari" -> "Rina Wulandari"
Vue.filter('judulKata', function (teks) {
  return String(teks || '').toLowerCase().replace(/(^|\s)\S/g, function (huruf) {
    return huruf.toUpperCase();
  });
});

// Memotong teks panjang. Filter dengan argumen: {{ teks | potong(20) }}
Vue.filter('potong', function (teks, panjang) {
  teks = String(teks || '');
  panjang = panjang || 30;
  return teks.length > panjang ? teks.slice(0, panjang - 1).trim() + '…' : teks;
});

// Nilai kosong ditampilkan sebagai tanda strip
Vue.filter('strip', function (nilai) {
  return (nilai === '' || nilai === null || nilai === undefined) ? '-' : nilai;
});
