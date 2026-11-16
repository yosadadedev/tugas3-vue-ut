/* ==========================================================
   <halaman-beranda> - Dashboard ringkasan SITTA
   Props : stok, tracking, upbjjList
   Emit  : 'navigasi' (namaHalaman, opsi)
   ========================================================== */

Vue.component('halaman-beranda', {
  props: {
    stok: { type: Array, required: true },
    tracking: { type: Object, required: true },
    upbjjList: { type: Array, required: true }
  },

  data() {
    return {
      sekarang: new Date(),
      timer: null,
      hariIni: Util.tanggalHariIni(),
      menuUtama: [
        { id: 'stok', judul: 'Informasi Bahan Ajar', ikon: 'bi-book', warna: 'blue',
          desc: 'Lihat stok, lokasi rak, dan status re-order bahan ajar di setiap UT-Daerah.' },
        { id: 'pemesanan', judul: 'Pemesanan Bahan Ajar', ikon: 'bi-cart3', warna: 'orange',
          desc: 'Buat Delivery Order paket bahan ajar untuk mahasiswa.' },
        { id: 'tracking', judul: 'Tracking Pengiriman', ikon: 'bi-truck', warna: 'green',
          desc: 'Lacak status pengiriman berdasarkan nomor Delivery Order.' }
      ]
    };
  },

  // Jam berjalan: diperbarui tiap detik, interval dihentikan saat komponen dihapus
  mounted() {
    var vm = this;
    vm.timer = setInterval(function () { vm.sekarang = new Date(); }, 1000);
  },

  beforeDestroy() {
    clearInterval(this.timer);
  },

  computed: {
    jamTeks() {
      var d = this.sekarang;
      return Util.duaDigit(d.getHours()) + ':' + Util.duaDigit(d.getMinutes()) + ':' + Util.duaDigit(d.getSeconds());
    },

    // Periode hari menentukan sapaan, ikon, dan warna banner (atribut data-period)
    periode() {
      var jam = this.sekarang.getHours();
      if (jam < 11) return { kode: 'pagi', label: 'Pagi', ikon: 'bi-sunrise' };
      if (jam < 15) return { kode: 'siang', label: 'Siang', ikon: 'bi-sun' };
      if (jam < 18) return { kode: 'sore', label: 'Sore', ikon: 'bi-sunset' };
      return { kode: 'malam', label: 'Malam', ikon: 'bi-moon-stars' };
    },

    ringkasan() {
      var hasil = { eksemplar: 0, nilai: 0, reorder: 0 };
      this.stok.forEach(function (s) {
        hasil.eksemplar += s.qty;
        hasil.nilai += s.qty * s.harga;
        if (Util.perluReorder(s)) hasil.reorder++;
      });
      return hasil;
    },

    // Objek name-based: { Jakarta: { judul, eksemplar, reorder }, Surabaya: {...}, ... }
    stokPerDaerah() {
      var hasil = {};
      this.upbjjList.forEach(function (daerah) {
        hasil[daerah] = { judul: 0, eksemplar: 0, reorder: 0 };
      });
      this.stok.forEach(function (s) {
        if (!hasil[s.upbjj]) hasil[s.upbjj] = { judul: 0, eksemplar: 0, reorder: 0 };
        hasil[s.upbjj].judul++;
        hasil[s.upbjj].eksemplar += s.qty;
        if (Util.perluReorder(s)) hasil[s.upbjj].reorder++;
      });
      return hasil;
    },

    jumlahDaerahTerisi() {
      var daftar = this.stokPerDaerah;
      return Object.keys(daftar).filter(function (k) { return daftar[k].judul > 0; }).length;
    },

    maksEksemplar() {
      var daftar = this.stokPerDaerah;
      return Math.max.apply(null, Object.keys(daftar).map(function (k) { return daftar[k].eksemplar; }).concat(1));
    },

    perluReorder() {
      return this.stok.filter(Util.perluReorder).sort(function (a, b) {
        return (a.qty - a.safety) - (b.qty - b.safety);
      });
    },

    daftarDO() {
      var tracking = this.tracking;
      return Object.keys(tracking).sort().reverse().map(function (nomor) {
        return Object.assign({ nomor: nomor }, tracking[nomor]);
      });
    },

    jumlahDOAktif() {
      return this.daftarDO.filter(function (d) { return d.status !== 'Terkirim'; }).length;
    }
  },

  methods: {
    buka(halaman, opsi) {
      this.$emit('navigasi', halaman, opsi);
    },

    // "Rina Wulandari" -> "RW"
    inisial(nama) {
      return String(nama).trim().split(/\s+/).slice(0, 2).map(function (k) { return k[0]; }).join('').toUpperCase();
    }
  },

  template: `
    <section>
      <div class="greeting" :data-period="periode.kode">
        <div>
          <span class="greeting-eyebrow"><i class="bi" :class="periode.ikon" aria-hidden="true"></i> {{ periode.label }}</span>
          <h1 class="greeting-title">Selamat {{ periode.label }}!</h1>
          <p class="greeting-sub">Pantau stok bahan ajar, buat pemesanan, dan lacak pengirimannya dalam satu tempat.</p>
        </div>
        <div class="greeting-clock">
          <div class="greeting-time"><time>{{ jamTeks }}</time></div>
          <div class="greeting-date">{{ hariIni | tanggal }}</div>
        </div>
      </div>

      <div class="grid grid-4 mt-24">
        <kartu-statistik label="Judul Bahan Ajar" :nilai="stok.length" satuan="judul" ikon="bi-book" warna="blue"
                         :keterangan="'Tersebar di ' + jumlahDaerahTerisi + ' UT-Daerah'"
                         bisa-diklik @klik="buka('stok')"></kartu-statistik>
        <kartu-statistik label="Total Stok" :nilai="ringkasan.eksemplar" satuan="eks" ikon="bi-stack" warna="green"
                         :keterangan="ringkasan.reorder + ' judul perlu re-order'"
                         bisa-diklik @klik="buka('stok', { reorder: true })"></kartu-statistik>
        <kartu-statistik label="Delivery Order" :nilai="daftarDO.length" satuan="DO" ikon="bi-truck" warna="purple"
                         :keterangan="jumlahDOAktif + ' dalam proses'"
                         bisa-diklik @klik="buka('tracking')"></kartu-statistik>
        <kartu-statistik label="Nilai Persediaan" :nilai="Math.round(ringkasan.nilai / 1000)" satuan="rb" ikon="bi-wallet2" warna="orange"
                         :keterangan="ringkasan.nilai | rupiah"></kartu-statistik>
      </div>

      <div class="section-head">
        <h2 class="section-title">Menu Utama</h2>
        <span class="text-muted">Pilih menu untuk memulai</span>
      </div>

      <ul class="nav-tiles nav-tiles-3">
        <li v-for="tile in menuUtama" :key="tile.id">
          <button type="button" class="card nav-tile" @click="buka(tile.id)">
            <span class="nav-tile-head">
              <span class="nav-tile-icon" :class="'tone-' + tile.warna"><i class="bi" :class="tile.ikon" aria-hidden="true"></i></span>
              <i class="bi bi-arrow-right nav-tile-arrow" aria-hidden="true"></i>
            </span>
            <span class="nav-tile-title">{{ tile.judul }}</span>
            <span class="nav-tile-desc">{{ tile.desc }}</span>
          </button>
        </li>
      </ul>

      <div class="grid grid-main-side mt-24">
        <article class="card">
          <header class="card-head">
            <h2 class="card-title"><i class="bi bi-truck" aria-hidden="true"></i> Pengiriman Terbaru</h2>
            <button type="button" class="btn btn-link" @click="buka('tracking')">Lihat semua</button>
          </header>
          <div class="card-body flush">
            <button type="button" class="list-item" v-for="d in daftarDO.slice(0, 4)" :key="d.nomor"
                    @click="buka('tracking', { nomor: d.nomor })">
              <span class="avatar">{{ inisial(d.nama) }}</span>
              <span class="list-item-main">
                <span class="list-item-title">{{ d.nama | judulKata }}</span>
                <span class="text-mono text-muted"> &middot; {{ d.nomor }}</span>
                <span class="list-item-desc" style="display:block">{{ d.perjalanan[d.perjalanan.length - 1].keterangan }}</span>
              </span>
              <span class="text-right">
                <badge-do :status="d.status"></badge-do>
                <span class="cell-sub" style="display:block">{{ d.ekspedisi }}</span>
              </span>
            </button>
            <div class="empty" v-if="!daftarDO.length"><i class="bi bi-inbox empty-icon"></i>Belum ada DO.</div>
          </div>
        </article>

        <!-- v-for name-based index: (info, daerah, index) in objek -->
        <article class="card">
          <header class="card-head">
            <h2 class="card-title"><i class="bi bi-geo-alt" aria-hidden="true"></i> Stok per UT-Daerah</h2>
            <button type="button" class="btn btn-link" @click="buka('stok')">Detail</button>
          </header>
          <div class="card-body bar-list">
            <button type="button" class="bar-row" v-for="(info, daerah, index) in stokPerDaerah" :key="daerah"
                    :title="'Lihat stok UT ' + daerah" @click="buka('stok', { upbjj: daerah })">
              <div class="bar-row-head">
                <span><span class="text-muted">{{ index + 1 }}.</span> {{ daerah }}</span>
                <span v-if="info.judul">{{ info.eksemplar | angka }} eks &middot; {{ info.judul }} judul</span>
                <span v-else class="text-muted">Belum ada stok</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :class="{ 'is-warning': info.reorder > 0 }"
                     :style="{ width: (info.eksemplar / maksEksemplar * 100) + '%' }"></div>
              </div>
            </button>
            <div class="legend">
              <span><i></i> Stok aman</span>
              <span><i class="is-warning"></i> Ada yang perlu re-order</span>
            </div>
          </div>
        </article>
      </div>

      <!-- v-for zero-based index: (item, index) in array -->
      <article class="card mt-24">
        <header class="card-head">
          <h2 class="card-title"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> Perlu Re-order</h2>
          <button type="button" class="btn btn-link" v-show="perluReorder.length" @click="buka('stok', { reorder: true })">Lihat di halaman stok</button>
        </header>
        <div class="table-wrapper" v-if="perluReorder.length">
          <table class="table table-sm">
            <thead>
              <tr><th class="text-right">No</th><th>Bahan Ajar</th><th>UT-Daerah</th><th>Stok / Safety</th><th>Kekurangan</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in perluReorder" :key="item.kode + item.upbjj">
                <td class="text-right text-muted">{{ index + 1 }}</td>
                <td><div class="cell-title">{{ item.judul }}</div><div class="cell-sub text-mono">{{ item.kode }}</div></td>
                <td>{{ item.upbjj }}</td>
                <td>{{ item.qty }} <span class="text-muted">/ {{ item.safety }}</span></td>
                <td class="text-danger">{{ item.safety - item.qty }} eks</td>
                <td><badge-stok :qty="item.qty" :safety="item.safety"></badge-stok></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="empty" v-else>
          <i class="bi bi-check-circle empty-icon" style="color:var(--success)" aria-hidden="true"></i>
          Semua stok dalam kondisi aman.
        </div>
      </article>
    </section>
  `
});
