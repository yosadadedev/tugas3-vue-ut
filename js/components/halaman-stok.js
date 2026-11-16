/* ==========================================================
   <halaman-stok> - Halaman Stok Bahan Ajar
   Props : stok, upbjjList, kategoriList, filterAwal
   Emit  : 'tambah-stok', 'ubah-stok', 'hapus-stok'
   Komponen ini TIDAK mengubah props stok secara langsung;
   perubahan dikirim ke root (app.js) lewat $emit.
   ========================================================== */

function filterStokKosong() {
  return { kataKunci: '', upbjj: '', kategori: '', reorder: false };
}

Vue.component('halaman-stok', {
  props: {
    stok: { type: Array, required: true },
    upbjjList: { type: Array, required: true },
    kategoriList: { type: Array, required: true },
    // Filter awal dari halaman lain, mis. { reorder: true } atau { upbjj: 'Jakarta' }
    filterAwal: { type: Object, default: function () { return {}; } }
  },

  data() {
    return {
      filter: Object.assign(filterStokKosong(), this.filterAwal),
      sort: { kolom: 'judul', arah: 'asc' },
      modal: null,       // null | 'tambah' | 'edit'
      itemDiedit: null
    };
  },

  computed: {
    // Dependent option: jumlah bahan ajar per kategori di UT-Daerah terpilih
    opsiKategori() {
      var daerah = this.filter.upbjj;
      var stok = this.stok;
      return this.kategoriList.map(function (nama) {
        var jumlah = stok.filter(function (s) {
          return s.upbjj === daerah && s.kategori === nama;
        }).length;
        return { nama: nama, jumlah: jumlah };
      });
    },

    // Computed di-cache: hanya dihitung ulang jika stok / filter berubah
    stokTerfilter() {
      var f = this.filter;
      var kunci = f.kataKunci.toLowerCase();
      return this.stok.filter(function (item) {
        if (kunci && item.kode.toLowerCase().indexOf(kunci) === -1 &&
            item.judul.toLowerCase().indexOf(kunci) === -1) return false;
        if (f.upbjj && item.upbjj !== f.upbjj) return false;
        if (f.kategori && item.kategori !== f.kategori) return false;
        if (f.reorder && !Util.perluReorder(item)) return false;
        return true;
      });
    },

    stokTampil() {
      var kolom = this.sort.kolom;
      var arah = this.sort.arah === 'asc' ? 1 : -1;
      // slice() agar urutan stokTerfilter tidak ikut berubah
      return this.stokTerfilter.slice().sort(function (a, b) {
        if (typeof a[kolom] === 'string') return a[kolom].localeCompare(b[kolom], 'id') * arah;
        return (a[kolom] - b[kolom]) * arah;
      });
    },

    filterAktif() {
      var f = this.filter;
      return !!(f.kataKunci || f.upbjj || f.kategori || f.reorder);
    },

    // Ringkasan untuk kartu statistik di atas tabel
    ringkasan() {
      var daerah = {};
      var hasil = { eksemplar: 0, reorder: 0, daerah: 0 };
      this.stok.forEach(function (s) {
        hasil.eksemplar += s.qty;
        if (Util.perluReorder(s)) hasil.reorder++;
        daerah[s.upbjj] = true;
      });
      hasil.daerah = Object.keys(daerah).length;
      return hasil;
    },

    totalTampil() {
      return this.stokTampil.reduce(function (jml, s) { return jml + s.qty; }, 0);
    },

    subjudulModal() {
      if (this.modal !== 'edit' || !this.itemDiedit) return 'Data disimpan di browser (localStorage) karena belum menggunakan back-end.';
      return this.itemDiedit.kode + ' · ' + this.itemDiedit.judul + ' · UT-Daerah ' + this.itemDiedit.upbjj;
    }
  },

  watch: {
    // Watcher: kategori yang dipilih belum tentu ada di UT-Daerah baru,
    // jadi filter kategori di-reset setiap kali UT-Daerah berganti.
    'filter.upbjj'() {
      this.filter.kategori = '';
    }
  },

  mounted() {
    document.addEventListener('keydown', this.tanganiPintasan);
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.tanganiPintasan);
  },

  methods: {
    statusStok(item) {
      return Util.statusStok(item);
    },

    kunci(item) {
      return Util.kunciStok(item);
    },

    // Event keyboard: "/" fokus ke pencarian, "N" tambah bahan ajar
    tanganiPintasan(event) {
      if (this.modal || Util.sedangMengetik(event) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '/') {
        event.preventDefault();
        this.$refs.cari.focus();
      } else if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        this.bukaTambah();
      }
    },

    // Event mouse: klik judul kolom untuk mengurutkan
    urutkan(kolom) {
      if (this.sort.kolom === kolom) {
        this.sort.arah = this.sort.arah === 'asc' ? 'desc' : 'asc';
      } else {
        this.sort = { kolom: kolom, arah: 'asc' };
      }
    },

    // Nama ikon Bootstrap Icons untuk penanda arah urutan
    ikonUrut(kolom) {
      if (this.sort.kolom !== kolom) return 'bi-arrow-down-up';
      return this.sort.arah === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
    },

    kelasBar(item) {
      return { aman: 'is-success', menipis: 'is-warning', kosong: 'is-warning' }[this.statusStok(item)];
    },

    warnaKategori(kategori) {
      return { 'MK Wajib': 'blue', 'MK Pilihan': 'purple', 'Praktikum': 'green', 'Problem-Based': 'orange' }[kategori] || 'cyan';
    },

    // Lebar bar stok (%) dibandingkan safety stock; 100% = stok sama dengan safety
    persenStok(item) {
      if (!item.safety) return item.qty > 0 ? 100 : 0;
      return Math.min(100, Math.round(item.qty / item.safety * 100));
    },

    hapusFilter(nama) {
      this.filter[nama] = nama === 'reorder' ? false : '';
    },

    resetFilter() {
      this.filter = filterStokKosong();
      this.sort = { kolom: 'judul', arah: 'asc' };
    },

    bukaTambah() {
      this.itemDiedit = null;
      this.modal = 'tambah';
    },

    bukaEdit(item) {
      this.itemDiedit = item;
      this.modal = 'edit';
    },

    tutupModal() {
      this.modal = null;
      this.itemDiedit = null;
    },

    simpanForm(data) {
      if (this.modal === 'edit') {
        this.$emit('ubah-stok', { kunci: this.kunci(this.itemDiedit), data: data });
      } else {
        this.$emit('tambah-stok', data);
      }
      this.tutupModal();
    },

    hapus(item) {
      if (confirm('Hapus ' + item.kode + ' - ' + item.judul + ' (' + item.upbjj + ') dari daftar stok?')) {
        this.$emit('hapus-stok', this.kunci(item));
      }
    }
  },

  template: `
    <section>
      <div class="space-between mb-16">
        <div>
          <h1 class="page-title">Informasi Stok Bahan Ajar</h1>
          <p class="page-desc">Klik judul kolom untuk mengurutkan, klik dua kali sebuah baris untuk mengedit.</p>
        </div>
        <button type="button" class="btn btn-primary" title="Pintasan: N" @click="bukaTambah">
          <i class="bi bi-plus-lg" aria-hidden="true"></i> Tambah Bahan Ajar
        </button>
      </div>

      <div class="grid grid-4 mb-16">
        <kartu-statistik label="Total Judul" :nilai="stok.length" satuan="judul" ikon="bi-book" warna="blue"></kartu-statistik>
        <kartu-statistik label="Total Stok" :nilai="ringkasan.eksemplar" satuan="eks" ikon="bi-stack" warna="green"></kartu-statistik>
        <kartu-statistik label="Perlu Re-order" :nilai="ringkasan.reorder" satuan="judul" ikon="bi-exclamation-triangle" warna="orange"
                         bisa-diklik @klik="filter.reorder = true"></kartu-statistik>
        <kartu-statistik label="UT-Daerah" :nilai="ringkasan.daerah" satuan="lokasi" ikon="bi-geo-alt" warna="purple"></kartu-statistik>
      </div>

      <article class="card">
        <!-- ================= TOOLBAR FILTER ================= -->
        <div class="toolbar">
          <label class="input-affix">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input ref="cari" type="search" class="input" v-model.trim="filter.kataKunci"
                   placeholder="Cari kode / nama bahan ajar..." aria-label="Cari bahan ajar"
                   @keyup.esc="filter.kataKunci = ''">
            <kbd v-if="!filter.kataKunci">/</kbd>
          </label>

          <select class="select" v-model="filter.upbjj" aria-label="Filter UT-Daerah">
            <option value="">Semua UT-Daerah</option>
            <option v-for="daerah in upbjjList" :key="daerah" :value="daerah">{{ daerah }}</option>
          </select>

          <!-- Dependent option: kategori baru aktif setelah UT-Daerah dipilih -->
          <select class="select" v-if="filter.upbjj" v-model="filter.kategori" aria-label="Filter kategori">
            <option value="">Semua kategori</option>
            <option v-for="opsi in opsiKategori" :key="opsi.nama" :value="opsi.nama" :disabled="opsi.jumlah === 0">
              {{ opsi.nama }} ({{ opsi.jumlah }})
            </option>
          </select>
          <select class="select" v-else disabled title="Pilih UT-Daerah terlebih dahulu">
            <option>Pilih UT-Daerah dulu</option>
          </select>

          <label class="checkbox">
            <input type="checkbox" v-model="filter.reorder">
            <span>Perlu re-order</span>
          </label>

          <button type="button" class="btn toolbar-end" :disabled="!filterAktif" @click="resetFilter">
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reset
          </button>
        </div>

        <div class="filter-tags" v-show="filterAktif">
          <span class="text-muted">Filter aktif:</span>
          <span class="tag" v-if="filter.kataKunci">Cari: {{ filter.kataKunci }}
            <button type="button" class="tag-close" aria-label="Hapus filter" @click="hapusFilter('kataKunci')"><i class="bi bi-x-lg"></i></button></span>
          <span class="tag" v-if="filter.upbjj">{{ filter.upbjj }}
            <button type="button" class="tag-close" aria-label="Hapus filter" @click="hapusFilter('upbjj')"><i class="bi bi-x-lg"></i></button></span>
          <span class="tag" v-if="filter.kategori">{{ filter.kategori }}
            <button type="button" class="tag-close" aria-label="Hapus filter" @click="hapusFilter('kategori')"><i class="bi bi-x-lg"></i></button></span>
          <span class="tag tag-warning" v-if="filter.reorder">Perlu re-order
            <button type="button" class="tag-close" aria-label="Hapus filter" @click="hapusFilter('reorder')"><i class="bi bi-x-lg"></i></button></span>
        </div>

        <!-- ================= TABEL ================= -->
        <div class="table-wrapper">
          <table class="table table-compact">
            <thead>
              <tr>
                <th class="text-right">No</th>
                <th class="th-sort" :class="{ 'is-sorted': sort.kolom === 'judul' }" @click="urutkan('judul')">
                  Bahan Ajar <i class="bi" :class="ikonUrut('judul')"></i></th>
                <th>Kategori</th>
                <th class="th-sort" :class="{ 'is-sorted': sort.kolom === 'upbjj' }" @click="urutkan('upbjj')">
                  UT-Daerah / Rak <i class="bi" :class="ikonUrut('upbjj')"></i></th>
                <th class="th-sort text-right" :class="{ 'is-sorted': sort.kolom === 'harga' }" @click="urutkan('harga')">
                  Harga <i class="bi" :class="ikonUrut('harga')"></i></th>
                <th class="th-sort" :class="{ 'is-sorted': sort.kolom === 'qty' }" @click="urutkan('qty')">
                  Stok / Safety <i class="bi" :class="ikonUrut('qty')"></i></th>
                <th>Status</th>
                <th>Catatan</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in stokTampil" :key="kunci(item)"
                  class="is-clickable" tabindex="0"
                  title="Klik dua kali atau tekan Enter untuk mengedit"
                  @dblclick="bukaEdit(item)"
                  @keyup.enter.self="bukaEdit(item)">
                <td class="text-right text-muted">{{ index + 1 }}</td>
                <td>
                  <div class="cell-book">
                    <span class="thumb-fallback" :class="'tone-' + warnaKategori(item.kategori)">
                      <i class="bi bi-journal-bookmark" aria-hidden="true"></i>
                    </span>
                    <div>
                      <div class="cell-title" :title="item.judul">{{ item.judul | potong(30) }}</div>
                      <div class="cell-sub text-mono">{{ item.kode }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="tag tag-purple">{{ item.kategori }}</span></td>
                <td class="nowrap">
                  <div>{{ item.upbjj }}</div>
                  <div class="cell-sub text-mono" v-text="item.lokasiRak"></div>
                </td>
                <td class="text-right nowrap">{{ item.harga | rupiah }}</td>
                <td>
                  <div class="mini-bar" :title="persenStok(item) + '% dari safety stock'">
                    <div class="mini-bar-track">
                      <div class="mini-bar-fill" :class="kelasBar(item)" :style="{ width: persenStok(item) + '%' }"></div>
                    </div>
                    <span class="mini-bar-value nowrap">{{ item.qty | angka }} <span class="text-muted">/ {{ item.safety }}</span></span>
                  </div>
                </td>
                <td><badge-stok :qty="item.qty" :safety="item.safety"></badge-stok></td>
                <td class="cell-note" v-html="item.catatanHTML"></td>
                <td class="text-right nowrap">
                  <button type="button" class="btn btn-text btn-icon" title="Edit" @click="bukaEdit(item)">
                    <i class="bi bi-pencil-square" aria-hidden="true"></i></button>
                  <button type="button" class="btn btn-text btn-icon text-danger" title="Hapus" @click="hapus(item)">
                    <i class="bi bi-trash3" aria-hidden="true"></i></button>
                </td>
              </tr>
              <tr v-if="stokTampil.length === 0">
                <td colspan="9">
                  <div class="empty">
                    <i class="bi bi-search empty-icon" aria-hidden="true"></i>
                    <div>Tidak ada bahan ajar yang sesuai filter.</div>
                    <button type="button" class="btn btn-link" @click="resetFilter">Reset filter</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span>Menampilkan <strong>{{ stokTampil.length }}</strong> dari {{ stok.length }} bahan ajar &middot;
            total stok {{ totalTampil | angka }} eksemplar</span>
          <span class="legend">
            <span><i style="background:var(--success)"></i> Aman &ge; safety</span>
            <span><i class="is-warning"></i> Menipis &lt; safety</span>
            <span><i style="background:var(--error)"></i> Kosong</span>
          </span>
        </div>
      </article>

      <!-- ================= MODAL TAMBAH / EDIT ================= -->
      <modal-dialog v-if="modal" lebar="lg"
                    :judul="modal === 'edit' ? 'Edit Bahan Ajar' : 'Tambah Bahan Ajar'"
                    :subjudul="subjudulModal"
                    @tutup="tutupModal">
        <form-bahan-ajar :mode-edit="modal === 'edit'"
                         :data-awal="itemDiedit"
                         :stok-list="stok"
                         :upbjj-list="upbjjList"
                         :kategori-list="kategoriList"
                         @simpan="simpanForm"
                         @batal="tutupModal"></form-bahan-ajar>
      </modal-dialog>
    </section>
  `
});
