/* ==========================================================
   <halaman-tracking> - Lacak & perbarui status Delivery Order
   Props : tracking, paket, statusList, nomorAwal
   Emit  : 'perbarui-do' ({ nomor, status, keterangan })
   ========================================================== */

Vue.component('halaman-tracking', {
  props: {
    tracking: { type: Object, required: true },
    paket: { type: Array, required: true },
    statusList: { type: Array, required: true },
    // Nomor DO yang langsung dibuka, mis. setelah DO baru dibuat
    nomorAwal: { type: String, default: '' }
  },

  data() {
    var adaAwal = !!(this.nomorAwal && this.tracking[this.nomorAwal]);
    return {
      nomorCari: adaAwal ? this.nomorAwal : '',
      nomorTerpilih: adaAwal ? this.nomorAwal : '',
      pesanCari: '',
      filterStatus: 'Semua',
      riwayat: { status: '', keterangan: '' },
      errorRiwayat: '',
      tersalin: false,
      // Ikon Bootstrap Icons untuk setiap label detail DO
      ikonInfo: {
        'Nama Mahasiswa': 'bi-person',
        'NIM': 'bi-person-vcard',
        'UT-Daerah': 'bi-geo-alt',
        'Ekspedisi': 'bi-truck',
        'Tanggal Kirim': 'bi-calendar3',
        'Paket': 'bi-box-seam',
        'Total Pembayaran': 'bi-credit-card'
      }
    };
  },

  computed: {
    // Objek tracking (name-based) diubah menjadi array agar bisa diurutkan & difilter
    daftarDO() {
      var tracking = this.tracking;
      return Object.keys(tracking).sort().reverse().map(function (nomor) {
        return Object.assign({ nomor: nomor }, tracking[nomor]);
      });
    },

    // Hasilnya OBJEK: { Semua: 2, Diproses: 1, ... } -> ditampilkan dengan v-for (nilai, kunci)
    jumlahPerStatus() {
      var hasil = { Semua: this.daftarDO.length };
      var daftar = this.daftarDO;
      this.statusList.forEach(function (status) {
        hasil[status] = daftar.filter(function (d) { return d.status === status; }).length;
      });
      return hasil;
    },

    daftarTampil() {
      var status = this.filterStatus;
      if (status === 'Semua') return this.daftarDO;
      return this.daftarDO.filter(function (d) { return d.status === status; });
    },

    doTerpilih() {
      return this.nomorTerpilih ? this.tracking[this.nomorTerpilih] : null;
    },

    indeksStatus() {
      return this.doTerpilih ? this.statusList.indexOf(this.doTerpilih.status) : -1;
    },

    // Data untuk komponen steps: nama status + ikon + keterangan
    langkahStatus() {
      var info = {
        'Diproses': { ikon: 'bi-clipboard-check', ket: 'DO dibuat' },
        'Dalam Perjalanan': { ikon: 'bi-truck', ket: 'Transit antar hub' },
        'Terkirim': { ikon: 'bi-house-check', ket: 'Paket sampai tujuan' }
      };
      var akhir = this.statusList.length - 1;
      return this.statusList.map(function (nama, i) {
        var x = info[nama] || { ikon: 'bi-circle', ket: '' };
        return { nama: nama, ikon: x.ikon, ket: x.ket, akhir: i === akhir };
      });
    },

    persenProgres() {
      if (this.indeksStatus < 0) return 0;
      return Math.round(this.indeksStatus / (this.statusList.length - 1) * 100);
    },

    // Detail DO sebagai objek label -> nilai, ditampilkan dengan v-for name-based index.
    // Filter global dipanggil dari JavaScript lewat Vue.filter('nama').
    infoDO() {
      var d = this.doTerpilih;
      if (!d) return {};
      var paket = this.paket.find(function (p) { return p.kode === d.paket; });
      return {
        'Nama Mahasiswa': Vue.filter('judulKata')(d.nama),
        'NIM': d.nim,
        'UT-Daerah': d.upbjj || '-',
        'Ekspedisi': d.ekspedisi,
        'Tanggal Kirim': Vue.filter('tanggal')(d.tanggalKirim),
        'Paket': d.paket + (paket ? ' (' + paket.nama + ')' : ''),
        'Total Pembayaran': Vue.filter('rupiah')(d.total)
      };
    }
  },

  watch: {
    // Watcher: nomor DO otomatis kapital; pesan "tidak ditemukan" hilang saat mengetik ulang
    nomorCari(nilai) {
      var kapital = nilai.toUpperCase();
      if (kapital !== nilai) this.nomorCari = kapital;
      this.pesanCari = '';
    },

    // Watcher immediate: form riwayat disiapkan setiap kali DO yang dipilih berganti.
    // Status default = tahap berikutnya, mis. "Diproses" -> "Dalam Perjalanan".
    nomorTerpilih: {
      immediate: true,
      handler() {
        this.siapkanRiwayat();
      }
    },

    // Watcher: setelah status DO diperbarui, pilihan status ikut maju ke tahap berikutnya
    'doTerpilih.status'() {
      this.siapkanRiwayat();
    }
  },

  methods: {
    siapkanRiwayat() {
      var status = '';
      if (this.doTerpilih) {
        var i = this.statusList.indexOf(this.doTerpilih.status);
        status = this.statusList[Math.min(i + 1, this.statusList.length - 1)] || this.doTerpilih.status;
      }
      this.riwayat = { status: status, keterangan: '' };
      this.errorRiwayat = '';
    },

    cariDO() {
      var nomor = this.nomorCari;
      if (!nomor) {
        this.pesanCari = 'Masukkan nomor DO terlebih dahulu.';
      } else if (this.tracking[nomor]) {
        this.nomorTerpilih = nomor;
      } else {
        this.nomorTerpilih = '';
        this.pesanCari = 'Nomor DO "' + nomor + '" tidak ditemukan.';
      }
    },

    pilihDO(nomor) {
      this.nomorTerpilih = nomor;
      this.nomorCari = nomor;
      this.tersalin = false;
    },

    resetCari() {
      this.nomorCari = '';
      this.nomorTerpilih = '';
    },

    // Event mouse: salin nomor DO ke clipboard
    salinNomor() {
      var vm = this;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(vm.nomorTerpilih).catch(function () { /* izin ditolak */ });
      }
      vm.tersalin = true;
      setTimeout(function () { vm.tersalin = false; }, 1500);
    },

    // Event keyboard: panah atas / bawah memilih DO sebelumnya / berikutnya
    geserPilihan(langkah) {
      var daftar = this.daftarTampil;
      if (!daftar.length) return;
      var nomorSekarang = this.nomorTerpilih;
      var i = daftar.findIndex(function (d) { return d.nomor === nomorSekarang; });
      var berikut = i === -1 ? 0 : Math.min(daftar.length - 1, Math.max(0, i + langkah));
      this.pilihDO(daftar[berikut].nomor);
      this.$nextTick(function () {
        var el = this.$el.querySelector('tr.is-selected');
        if (el) el.scrollIntoView({ block: 'nearest' });
      });
    },

    kirimRiwayat() {
      if (this.riwayat.keterangan.length < 5) {
        this.errorRiwayat = 'Keterangan minimal 5 karakter.';
        return;
      }
      this.$emit('perbarui-do', {
        nomor: this.nomorTerpilih,
        status: this.riwayat.status,
        keterangan: this.riwayat.keterangan
      });
      this.riwayat.keterangan = '';
      this.errorRiwayat = '';
    }
  },

  template: `
    <section>
      <div class="mb-16">
        <h1 class="page-title">Tracking Pengiriman</h1>
        <p class="page-desc">Lacak status pengiriman bahan ajar menggunakan Nomor Delivery Order (DO).</p>
      </div>

      <!-- ================= PENCARIAN ================= -->
      <article class="card">
        <header class="card-head">
          <h2 class="card-title"><i class="bi bi-search" aria-hidden="true"></i> Cari Delivery Order</h2>
        </header>
        <div class="card-body">
          <form class="form-inline track-search" @submit.prevent="cariDO">
            <div class="form-item" :class="{ 'has-error': pesanCari }">
              <label class="input-affix input-lg">
                <i class="bi bi-box-seam" aria-hidden="true"></i>
                <input type="search" class="input" v-model.trim="nomorCari" list="daftar-nomor-do"
                       placeholder="Masukkan nomor DO, cth. DO2025-0001" aria-label="Nomor DO"
                       @keyup.esc="nomorCari = ''">
              </label>
              <div class="form-explain">{{ pesanCari }}</div>
            </div>
            <datalist id="daftar-nomor-do">
              <option v-for="d in daftarDO" :key="d.nomor" :value="d.nomor">{{ d.nama }}</option>
            </datalist>
            <button type="submit" class="btn btn-primary btn-lg"><i class="bi bi-search" aria-hidden="true"></i> Cari</button>
            <button type="button" class="btn btn-lg" @click="resetCari">Reset</button>
          </form>
          <div class="track-examples">
            Contoh nomor DO:
            <button type="button" class="tag tag-clickable" v-for="d in daftarDO.slice(0, 3)" :key="d.nomor"
                    @click="pilihDO(d.nomor)">{{ d.nomor }}</button>
          </div>
        </div>
      </article>

      <!-- ================= HASIL ================= -->
      <template v-if="doTerpilih">
        <article class="card track-result fade-in" :key="'ringkas-' + nomorTerpilih">
          <div class="card-body">
            <div class="track-summary">
              <div class="track-do">
                <span class="statistic-icon tone-blue"><i class="bi bi-box-seam" aria-hidden="true"></i></span>
                <div>
                  <div class="text-muted">Nomor Delivery Order</div>
                  <div class="track-do-number">{{ nomorTerpilih }}</div>
                </div>
              </div>
              <div class="space">
                <badge-do :status="doTerpilih.status" tag></badge-do>
                <button type="button" class="btn btn-sm" @click="salinNomor">
                  <i class="bi" :class="tersalin ? 'bi-check2' : 'bi-copy'" aria-hidden="true"></i>
                  {{ tersalin ? 'Tersalin' : 'Salin No. DO' }}
                </button>
              </div>
            </div>

            <!-- Steps status: langkah yang sudah dilalui diberi warna -->
            <div class="track-progress">
              <ol class="steps">
                <li v-for="(s, i) in langkahStatus" :key="s.nama" class="step"
                    :class="{ 'is-finish': indeksStatus > i || (indeksStatus === i && s.akhir), 'is-process': indeksStatus === i && !s.akhir }">
                  <span class="step-icon">
                    <i v-if="indeksStatus > i || (indeksStatus === i && s.akhir)" class="bi bi-check-lg"></i>
                    <i v-else class="bi" :class="s.ikon"></i>
                  </span>
                  <div>
                    <div class="step-title">{{ s.nama }}</div>
                    <div class="step-desc">{{ s.ket }}</div>
                  </div>
                </li>
              </ol>
              <div class="progress" :class="{ 'is-success': persenProgres === 100, 'is-active': persenProgres < 100 }">
                <div class="progress-track"><div class="progress-bar" :style="{ width: persenProgres + '%' }"></div></div>
                <span class="progress-text">
                  <i v-if="persenProgres === 100" class="bi bi-check-circle-fill"></i>
                  <template v-else>{{ persenProgres }}%</template>
                </span>
              </div>
            </div>
          </div>
        </article>

        <div class="grid grid-main-side mt-24" style="align-items:start" :key="'detail-' + nomorTerpilih">
          <article class="card">
            <header class="card-head">
              <h2 class="card-title"><i class="bi bi-file-earmark-text" aria-hidden="true"></i> Detail Pengiriman</h2>
            </header>
            <div class="card-body">
              <!-- v-for name-based index: (nilai, label) in objek -->
              <dl class="descriptions descriptions-single">
                <div class="descriptions-item" v-for="(nilai, label) in infoDO" :key="label">
                  <dt><i class="bi" :class="ikonInfo[label]" aria-hidden="true"></i> {{ label }}</dt>
                  <dd :class="{ 'text-success text-strong': label === 'Total Pembayaran' }">{{ nilai }}</dd>
                </div>
              </dl>
            </div>
          </article>

          <article class="card">
            <header class="card-head">
              <h2 class="card-title"><i class="bi bi-geo-alt" aria-hidden="true"></i> Riwayat Perjalanan</h2>
              <span class="text-muted">{{ doTerpilih.perjalanan.length }} aktivitas</span>
            </header>
            <div class="card-body">
              <timeline-perjalanan :perjalanan="doTerpilih.perjalanan" :selesai="doTerpilih.status === 'Terkirim'"></timeline-perjalanan>

              <form v-if="doTerpilih.status !== 'Terkirim'" class="track-update" novalidate @submit.prevent="kirimRiwayat">
                <div class="text-strong mb-16">Perbarui Status Pengiriman</div>
                <div class="form-item compact">
                  <label class="form-label" for="r-status">Status</label>
                  <select id="r-status" class="select" v-model="riwayat.status">
                    <option v-for="(s, i) in statusList" :key="s" :value="s" :disabled="i < indeksStatus">{{ s }}</option>
                  </select>
                </div>
                <div class="form-item compact" :class="{ 'has-error': errorRiwayat }">
                  <label class="form-label required" for="r-ket">Keterangan</label>
                  <input id="r-ket" class="input" v-model.trim="riwayat.keterangan" placeholder="cth. Tiba di Hub: MAKASSAR">
                  <div class="form-explain">{{ errorRiwayat }}</div>
                </div>
                <div class="space-between">
                  <span class="text-muted" style="font-size:13px">Tekan <kbd>Enter</kbd> untuk menyimpan</span>
                  <button type="submit" class="btn btn-primary"><i class="bi bi-plus-lg" aria-hidden="true"></i> Tambah Riwayat</button>
                </div>
              </form>
              <div v-else class="alert alert-success mt-16">
                <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                <span>Paket sudah diterima. Pengiriman selesai.</span>
              </div>
            </div>
          </article>
        </div>
      </template>

      <article class="card track-result" v-else>
        <div class="empty">
          <i class="bi bi-truck empty-icon" aria-hidden="true"></i>
          <div>Cari nomor DO di atas atau pilih salah satu DO dari tabel di bawah.</div>
        </div>
      </article>

      <!-- ================= DAFTAR DO ================= -->
      <article class="card mt-24">
        <header class="card-head">
          <h2 class="card-title"><i class="bi bi-list-ul" aria-hidden="true"></i> Daftar Delivery Order</h2>
          <!-- v-for name-based index: (jumlah, status) in objek -->
          <div class="segmented" role="tablist">
            <button type="button" v-for="(jumlah, status) in jumlahPerStatus" :key="status"
                    class="segmented-item" :class="{ 'is-active': filterStatus === status }"
                    @click="filterStatus = status">
              {{ status }} <span class="segmented-count">{{ jumlah }}</span>
            </button>
          </div>
        </header>
        <div class="table-wrapper table-keyboard" tabindex="0"
             aria-label="Daftar DO, gunakan panah atas dan bawah untuk memilih"
             @keydown.down.prevent="geserPilihan(1)"
             @keydown.up.prevent="geserPilihan(-1)">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Nomor DO</th>
                <th>Mahasiswa</th>
                <th>Ekspedisi</th>
                <th>Paket</th>
                <th>Tgl Kirim</th>
                <th class="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in daftarTampil" :key="d.nomor" class="is-clickable"
                  :class="{ 'is-selected': d.nomor === nomorTerpilih }"
                  @click="pilihDO(d.nomor)">
                <td class="text-mono text-strong">{{ d.nomor }}</td>
                <td>
                  <div class="cell-title">{{ d.nama | judulKata }}</div>
                  <div class="cell-sub text-mono">{{ d.nim }}</div>
                </td>
                <td class="nowrap">{{ d.ekspedisi }}</td>
                <td class="text-mono nowrap">{{ d.paket }}</td>
                <td class="nowrap">{{ d.tanggalKirim | tanggal }}</td>
                <td class="text-right nowrap">{{ d.total | rupiah }}</td>
                <td class="nowrap"><badge-do :status="d.status"></badge-do></td>
              </tr>
              <tr v-if="!daftarTampil.length">
                <td colspan="7"><div class="empty"><i class="bi bi-inbox empty-icon"></i>Tidak ada DO dengan status ini.</div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-footer">
          <span>{{ daftarTampil.length }} DO ditampilkan</span>
          <span>Klik tabel lalu gunakan <kbd>&uarr;</kbd> <kbd>&darr;</kbd> untuk berpindah DO</span>
        </div>
      </article>
    </section>
  `
});
