/* ==========================================================
   app.js - Root instance Vue (induk semua komponen)
   - Menyimpan SATU sumber data (stok & tracking)
   - Mengirim data ke komponen lewat props
   - Menerima perubahan dari komponen lewat event ($emit)
   - Mengatur navigasi halaman (hash URL) & notifikasi
   ========================================================== */

var KUNCI_STORAGE = { stok: 'sitta3-stok', tracking: 'sitta3-tracking' };

var MENU = [
  { id: 'beranda', label: 'Dashboard', ikon: 'bi-grid-1x2' },
  { id: 'stok', label: 'Informasi Bahan Ajar', ikon: 'bi-book' },
  { id: 'pemesanan', label: 'Pemesanan', ikon: 'bi-cart3' },
  { id: 'tracking', label: 'Tracking Pengiriman', ikon: 'bi-truck' }
];

function halamanDariHash() {
  var id = location.hash.replace('#', '');
  return MENU.some(function (m) { return m.id === id; }) ? id : 'beranda';
}

var app = new Vue({
  el: '#app',

  data: {
    upbjjList: dataBahanAjar.upbjjList,
    kategoriList: dataBahanAjar.kategoriList,
    pengirimanList: dataBahanAjar.pengirimanList,
    paket: dataBahanAjar.paket,
    stok: Util.muat(KUNCI_STORAGE.stok, dataBahanAjar.stok),
    tracking: Util.muat(KUNCI_STORAGE.tracking, dataBahanAjar.tracking),
    statusList: ['Diproses', 'Dalam Perjalanan', 'Terkirim'],

    menu: MENU,
    halaman: halamanDariHash(),
    opsiHalaman: {},      // data tambahan untuk halaman tujuan, mis. { reorder: true }
    kunciHalaman: 0,      // diubah agar komponen halaman dibuat ulang saat navigasi
    siderTerbuka: false,  // menu samping di layar HP
    tampilPintasan: false,

    notifikasi: { pesan: '', jenis: 'sukses' },
    timerNotifikasi: null
  },

  computed: {
    judulHalaman() {
      var aktif = this.halaman;
      var m = this.menu.find(function (item) { return item.id === aktif; });
      return m ? m.label : '';
    },

    // Angka lencana di menu samping (sider)
    lencanaMenu() {
      var tracking = this.tracking;
      return {
        stok: this.stok.filter(Util.perluReorder).length,
        tracking: Object.keys(tracking).filter(function (n) { return tracking[n].status !== 'Terkirim'; }).length
      };
    }
  },

  watch: {
    // Watcher 1 (deep): setiap perubahan stok disimpan ke localStorage
    stok: {
      deep: true,
      handler(nilai) {
        Util.simpan(KUNCI_STORAGE.stok, nilai);
      }
    },

    // Watcher 2 (deep): setiap perubahan DO disimpan ke localStorage
    tracking: {
      deep: true,
      handler(nilai) {
        Util.simpan(KUNCI_STORAGE.tracking, nilai);
      }
    },

    // Watcher 3 (immediate): judul tab browser & URL hash mengikuti halaman aktif
    halaman: {
      immediate: true,
      handler(baru, lama) {
        document.title = this.judulHalaman + ' · SITTA UT';
        if (location.hash !== '#' + baru) {
          if (lama === undefined) history.replaceState(null, '', '#' + baru);
          else location.hash = baru;
        }
        this.siderTerbuka = false;
        window.scrollTo(0, 0);
      }
    }
  },

  mounted() {
    window.addEventListener('hashchange', this.bacaHash);       // tombol back/forward browser
    document.addEventListener('keydown', this.pintasanGlobal);  // Alt + 1..4
  },

  beforeDestroy() {
    window.removeEventListener('hashchange', this.bacaHash);
    document.removeEventListener('keydown', this.pintasanGlobal);
  },

  methods: {
    pindahHalaman(nama, opsi) {
      this.opsiHalaman = opsi || {};
      this.halaman = nama;
      this.kunciHalaman++;
    },

    bacaHash() {
      var id = halamanDariHash();
      if (id !== this.halaman) this.pindahHalaman(id);
    },

    // Event keyboard global: Alt + angka untuk pindah menu, "?" daftar pintasan, Esc tutup sider.
    // event.code dipakai (bukan event.key) agar tetap jalan di macOS (Option + angka).
    pintasanGlobal(event) {
      if (event.key === 'Escape' && this.siderTerbuka) {
        this.siderTerbuka = false;
        return;
      }
      if (event.key === '?' && !Util.sedangMengetik(event)) {
        this.tampilPintasan = true;
        return;
      }
      if (!event.altKey) return;
      var cocok = /^Digit([1-9])$/.exec(event.code);
      if (!cocok) return;
      var tujuan = this.menu[parseInt(cocok[1], 10) - 1];
      if (tujuan) {
        event.preventDefault();
        this.pindahHalaman(tujuan.id);
      }
    },

    tampilkanNotifikasi(pesan, jenis) {
      var vm = this;
      vm.notifikasi = { pesan: pesan, jenis: jenis || 'sukses' };
      clearTimeout(vm.timerNotifikasi);
      vm.timerNotifikasi = setTimeout(function () {
        vm.notifikasi.pesan = '';
      }, 3500);
    },

    /* ---------- Event dari <halaman-stok> ---------- */
    indeksStok(kunci) {
      return this.stok.findIndex(function (s) { return Util.kunciStok(s) === kunci; });
    },

    tambahStok(data) {
      this.stok.push(data);
      this.tampilkanNotifikasi('Bahan ajar ' + data.kode + ' (' + data.upbjj + ') berhasil ditambahkan.');
    },

    ubahStok(perubahan) {
      var i = this.indeksStok(perubahan.kunci);
      if (i === -1) return;
      // splice dipakai agar perubahan elemen array terdeteksi reaktivitas Vue 2
      this.stok.splice(i, 1, perubahan.data);
      this.tampilkanNotifikasi('Stok ' + perubahan.data.kode + ' (' + perubahan.data.upbjj + ') berhasil diperbarui.');
    },

    hapusStok(kunci) {
      var i = this.indeksStok(kunci);
      if (i === -1) return;
      var terhapus = this.stok.splice(i, 1)[0];
      this.tampilkanNotifikasi('Bahan ajar ' + terhapus.kode + ' dihapus dari ' + terhapus.upbjj + '.', 'info');
    },

    /* ---------- Event dari <halaman-pemesanan> ---------- */
    buatDO(pesanan) {
      // $set dipakai karena menambah properti BARU ke objek reaktif
      this.$set(this.tracking, pesanan.nomor, pesanan.data);
      this.tampilkanNotifikasi('DO ' + pesanan.nomor + ' berhasil dibuat.');
      this.pindahHalaman('tracking', { nomor: pesanan.nomor });
    },

    /* ---------- Event dari <halaman-tracking> ---------- */
    perbaruiDO(info) {
      var d = this.tracking[info.nomor];
      if (!d) return;
      d.perjalanan.push({ waktu: Util.waktuSekarang(), keterangan: info.keterangan });
      d.status = info.status;
      this.tampilkanNotifikasi('Status ' + info.nomor + ' diperbarui: ' + info.status + '.');
    },

    pulihkanData() {
      if (!confirm('Kembalikan semua data (stok & DO) ke data awal? Perubahan yang sudah dibuat akan hilang.')) return;
      this.stok = Util.salin(dataBahanAjar.stok);
      this.tracking = Util.salin(dataBahanAjar.tracking);
      this.pindahHalaman(this.halaman);
      this.tampilkanNotifikasi('Data dikembalikan ke data awal.', 'info');
    }
  }
});
