/* ==========================================================
   <halaman-pemesanan> - Formulir pemesanan bahan ajar (DO baru)
   Props : paket, stok, pengirimanList, upbjjList, tracking
   Emit  : 'buat-do' ({ nomor, data })
   ========================================================== */

function formPesananKosong() {
  return {
    nim: '',
    nama: '',
    upbjj: '',
    paket: '',
    ekspedisi: 'REG',
    tanggalKirim: Util.tanggalHariIni()
  };
}

Vue.component('halaman-pemesanan', {
  props: {
    paket: { type: Array, required: true },
    stok: { type: Array, required: true },
    pengirimanList: { type: Array, required: true },
    upbjjList: { type: Array, required: true },
    tracking: { type: Object, required: true }
  },

  data() {
    return {
      form: formPesananKosong(),
      error: {},
      sudahSubmit: false,
      hariIni: Util.tanggalHariIni()
    };
  },

  computed: {
    // Nomor DO otomatis: DO + tahun berjalan + nomor urut 4 digit (format sama dengan DO2025-0001)
    nomorDOBaru() {
      var tahun = new Date().getFullYear();
      var pola = new RegExp('^DO' + tahun + '-(\\d+)$');
      var terbesar = 0;
      Object.keys(this.tracking).forEach(function (nomor) {
        var cocok = nomor.match(pola);
        if (cocok) terbesar = Math.max(terbesar, parseInt(cocok[1], 10));
      });
      return 'DO' + tahun + '-' + String(terbesar + 1).padStart(4, '0');
    },

    paketTerpilih() {
      var kode = this.form.paket;
      return this.paket.find(function (p) { return p.kode === kode; }) || null;
    },

    // Rincian isi paket terpilih (computed -> di-cache selama paket tidak berganti)
    isiPaket() {
      return this.paketTerpilih ? this.rincianIsi(this.paketTerpilih) : [];
    },

    ekspedisiTerpilih() {
      var kode = this.form.ekspedisi;
      return this.pengirimanList.find(function (e) { return e.kode === kode; }) || null;
    },

    totalHarga() {
      return this.paketTerpilih ? this.paketTerpilih.harga : 0;
    },

    jumlahError() {
      return Object.keys(this.error).length;
    },

    // Status tiap isian: true bila sudah terisi dengan benar
    isianValid() {
      var f = this.form;
      return [
        /^\d{9}$/.test(f.nim),
        f.nama.trim().length >= 3,
        !!f.upbjj,
        !!f.paket,
        !!f.ekspedisi,
        !!f.tanggalKirim
      ];
    },

    // Persentase kelengkapan form untuk progress bar
    persenLengkap() {
      return Math.round(this.isianValid.filter(Boolean).length / this.isianValid.length * 100);
    },

    // Langkah 1-3 ditandai centang hijau bila semua isiannya lengkap
    langkahLengkap() {
      var v = this.isianValid;
      return [v[0] && v[1] && v[2], v[3], v[4] && v[5]];
    }
  },

  watch: {
    // Watcher: NIM hanya angka, maksimal 9 digit
    'form.nim'(nilai) {
      var angka = String(nilai).replace(/\D/g, '').slice(0, 9);
      if (angka !== nilai) this.form.nim = angka;
    },
    // Watcher: nama tidak boleh mengandung angka
    'form.nama'(nilai) {
      var bersih = nilai.replace(/[0-9]/g, '');
      if (bersih !== nilai) this.form.nama = bersih;
    },
    // Watcher deep: validasi langsung setelah tombol simpan pernah ditekan
    form: {
      deep: true,
      handler() {
        if (this.sudahSubmit) this.error = this.validasi();
      }
    }
  },

  methods: {
    // Methods (bukan computed) karena butuh argumen dan dipanggil per paket di v-for
    rincianIsi(p) {
      var stok = this.stok;
      return p.isi.map(function (kode) {
        var semua = stok.filter(function (s) { return s.kode === kode; });
        return {
          kode: kode,
          judul: semua.length ? semua[0].judul : '(belum terdaftar di stok)',
          harga: semua.length ? semua[0].harga : 0,
          tersedia: semua.reduce(function (jml, s) { return jml + s.qty; }, 0)
        };
      });
    },

    hematPaket(p) {
      var satuan = this.rincianIsi(p).reduce(function (jml, b) { return jml + b.harga; }, 0);
      return Math.max(0, satuan - p.harga);
    },

    pilihPaket(kode) {
      this.form.paket = kode;
    },

    validasi() {
      var f = this.form;
      var error = {};
      if (!f.nim) error.nim = 'NIM wajib diisi.';
      else if (!/^\d{9}$/.test(f.nim)) error.nim = 'NIM harus 9 digit angka (sekarang ' + f.nim.length + ' digit).';

      var nama = f.nama.trim();
      if (!nama) error.nama = 'Nama wajib diisi.';
      else if (nama.length < 3) error.nama = 'Nama minimal 3 karakter.';
      else if (!/^[A-Za-z .,']+$/.test(nama)) error.nama = 'Nama hanya boleh berisi huruf.';

      if (!f.upbjj) error.upbjj = 'Pilih UT-Daerah asal mahasiswa.';

      if (!f.paket) {
        error.paket = 'Pilih salah satu paket bahan ajar.';
      } else if (this.isiPaket.some(function (b) { return b.tersedia === 0; })) {
        error.paket = 'Ada bahan ajar dalam paket ini yang stoknya kosong.';
      }

      if (!f.ekspedisi) error.ekspedisi = 'Pilih jenis pengiriman.';
      if (!f.tanggalKirim) error.tanggalKirim = 'Tanggal kirim wajib diisi.';
      else if (f.tanggalKirim < this.hariIni) error.tanggalKirim = 'Tanggal kirim tidak boleh sebelum hari ini.';
      return error;
    },

    kirim() {
      this.sudahSubmit = true;
      this.error = this.validasi();
      if (this.jumlahError) {
        this.$nextTick(function () {
          var salah = this.$el.querySelector('.field.error input, .field.error select, .field.error button');
          if (salah) salah.focus();
        });
        return;
      }
      var f = this.form;
      this.$emit('buat-do', {
        nomor: this.nomorDOBaru,
        data: {
          nim: f.nim,
          nama: f.nama.trim().replace(/\s+/g, ' '),
          upbjj: f.upbjj,
          status: 'Diproses',
          ekspedisi: 'JNE ' + this.ekspedisiTerpilih.nama.split(' (')[0],
          tanggalKirim: f.tanggalKirim,
          paket: f.paket,
          total: this.totalHarga,
          perjalanan: [
            { waktu: Util.waktuSekarang(), keterangan: 'Pesanan dibuat oleh UT ' + f.upbjj + ', menunggu penjemputan ekspedisi' }
          ]
        }
      });
    },

    kosongkan() {
      this.form = formPesananKosong();
      this.error = {};
      this.sudahSubmit = false;
    }
  },

  template: `
    <section>
      <div class="mb-16">
        <h1 class="page-title">Pemesanan Bahan Ajar</h1>
        <p class="page-desc">Buat Delivery Order (DO) paket bahan ajar untuk mahasiswa. Ringkasan pesanan diperbarui otomatis.</p>
      </div>

      <div class="grid grid-main-side" style="align-items:start">
        <!-- ================= FORMULIR ================= -->
        <article class="card">
          <header class="card-head">
            <h2 class="card-title"><i class="bi bi-cart3" aria-hidden="true"></i> Formulir Pemesanan</h2>
            <span class="text-muted" style="font-size:13px"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> untuk menyimpan</span>
          </header>

          <form class="card-body" novalidate
                @submit.prevent="kirim"
                @keydown.ctrl.enter.prevent="kirim"
                @keydown.meta.enter.prevent="kirim">

            <div class="alert alert-error mb-16" v-show="jumlahError">
              <i class="bi bi-x-circle-fill" aria-hidden="true"></i>
              <span>Ada <strong>{{ jumlahError }}</strong> isian yang perlu diperbaiki.</span>
            </div>

            <!-- Langkah 1 -->
            <div class="form-section" :class="{ 'is-complete': langkahLengkap[0] }">
              <div class="form-section-title">
                <span class="form-section-num"><i v-if="langkahLengkap[0]" class="bi bi-check-lg"></i><template v-else>1</template></span>
                Data Mahasiswa
              </div>
              <div class="form-row">
                <div class="form-item compact" :class="{ 'has-error': error.nim }">
                  <label class="form-label required" for="p-nim">NIM</label>
                  <div class="input-affix">
                    <i class="bi bi-person-vcard" aria-hidden="true"></i>
                    <input id="p-nim" class="input" v-model.trim="form.nim" inputmode="numeric" maxlength="9" placeholder="9 digit angka" autocomplete="off">
                    <span class="text-muted" style="font-size:12px">{{ form.nim.length }}/9</span>
                  </div>
                  <div class="form-explain">{{ error.nim }}</div>
                </div>
                <div class="form-item compact" :class="{ 'has-error': error.nama }">
                  <label class="form-label required" for="p-nama">Nama Lengkap</label>
                  <div class="input-affix">
                    <i class="bi bi-person" aria-hidden="true"></i>
                    <input id="p-nama" class="input" v-model="form.nama" placeholder="cth. Rina Wulandari" autocomplete="off">
                  </div>
                  <div class="form-explain">{{ error.nama }}</div>
                </div>
                <div class="form-item compact span-2" :class="{ 'has-error': error.upbjj }">
                  <label class="form-label required" for="p-upbjj">UT-Daerah</label>
                  <select id="p-upbjj" class="select" v-model="form.upbjj">
                    <option value="" disabled>Pilih UT-Daerah</option>
                    <option v-for="daerah in upbjjList" :key="daerah" :value="daerah">UT {{ daerah }}</option>
                  </select>
                  <div class="form-explain">{{ error.upbjj }}</div>
                </div>
              </div>
            </div>

            <!-- Langkah 2 -->
            <div class="form-section" :class="{ 'is-complete': langkahLengkap[1] }">
              <div class="form-section-title">
                <span class="form-section-num"><i v-if="langkahLengkap[1]" class="bi bi-check-lg"></i><template v-else>2</template></span>
                Pilih Paket Bahan Ajar
              </div>
              <div class="form-item compact" :class="{ 'has-error': error.paket }">
                <div class="option-grid">
                  <button type="button" v-for="p in paket" :key="p.kode"
                          class="option-card" :class="{ 'is-selected': form.paket === p.kode }"
                          :aria-pressed="form.paket === p.kode ? 'true' : 'false'"
                          @click="pilihPaket(p.kode)">
                    <span class="option-check"><i class="bi bi-check-lg" v-show="form.paket === p.kode"></i></span>
                    <div>
                      <div class="option-title">{{ p.nama }}</div>
                      <div class="cell-sub text-mono">{{ p.kode }}</div>
                    </div>
                    <div class="option-list">
                      <div v-for="b in rincianIsi(p)" :key="b.kode">
                        <i class="bi bi-journal-text text-muted" aria-hidden="true"></i>
                        <span class="text-mono">{{ b.kode }}</span> &middot; {{ b.judul | potong(22) }}
                      </div>
                    </div>
                    <div class="option-foot">
                      <span class="option-price">{{ p.harga | rupiah }}</span>
                      <span class="tag tag-success" v-if="hematPaket(p) > 0">Hemat {{ hematPaket(p) | rupiah }}</span>
                    </div>
                  </button>
                </div>
                <div class="form-explain">{{ error.paket }}</div>
              </div>
            </div>

            <!-- Langkah 3 -->
            <div class="form-section" :class="{ 'is-complete': langkahLengkap[2] }">
              <div class="form-section-title">
                <span class="form-section-num"><i v-if="langkahLengkap[2]" class="bi bi-check-lg"></i><template v-else>3</template></span>
                Pengiriman
              </div>
              <div class="form-item compact" :class="{ 'has-error': error.ekspedisi }">
                <span class="form-label required">Ekspedisi</span>
                <div class="radio-group">
                  <label v-for="e in pengirimanList" :key="e.kode" class="radio-card" :class="{ 'is-selected': form.ekspedisi === e.kode }">
                    <input type="radio" name="ekspedisi" :value="e.kode" v-model="form.ekspedisi">
                    <span>
                      <span class="radio-card-title">JNE {{ e.nama.split(' (')[0] }}</span>
                      <span class="radio-card-desc">Estimasi {{ e.nama.split('(')[1].replace(')', '') }}</span>
                    </span>
                  </label>
                </div>
                <div class="form-explain">{{ error.ekspedisi }}</div>
              </div>
              <div class="form-row">
                <div class="form-item compact" :class="{ 'has-error': error.tanggalKirim }">
                  <label class="form-label required" for="p-tanggal">Tanggal Kirim</label>
                  <input id="p-tanggal" class="input" type="date" v-model="form.tanggalKirim" :min="hariIni">
                  <div class="form-explain">{{ error.tanggalKirim }}</div>
                  <div class="form-help" v-if="!error.tanggalKirim">{{ form.tanggalKirim | tanggal }}</div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn" @click="kosongkan">Kosongkan</button>
              <button type="submit" class="btn btn-primary">
                <i class="bi bi-send" aria-hidden="true"></i> Buat Delivery Order
              </button>
            </div>
          </form>
        </article>

        <!-- ================= RINGKASAN ================= -->
        <article class="card sticky-side">
          <header class="card-head">
            <h2 class="card-title"><i class="bi bi-receipt" aria-hidden="true"></i> Ringkasan Pesanan</h2>
            <span class="text-mono text-muted" v-text="nomorDOBaru"></span>
          </header>
          <div class="card-body">
            <div class="progress" :class="{ 'is-success': persenLengkap === 100, 'is-active': persenLengkap < 100 }">
              <div class="progress-track">
                <div class="progress-bar" :style="{ width: persenLengkap + '%' }"></div>
              </div>
              <span class="progress-text">
                <i v-if="persenLengkap === 100" class="bi bi-check-circle-fill"></i>
                <template v-else>{{ persenLengkap }}%</template>
              </span>
            </div>
            <p class="text-muted mb-16" style="font-size:13px;margin-top:4px">
              {{ persenLengkap === 100 ? 'Formulir lengkap, siap dibuat.' : 'Kelengkapan formulir' }}
            </p>

            <dl class="descriptions descriptions-single descriptions-compact">
              <div class="descriptions-item">
                <dt><i class="bi bi-person" aria-hidden="true"></i> Mahasiswa</dt>
                <dd>
                  <template v-if="form.nama">{{ form.nama | judulKata }}</template><span v-else class="text-muted">-</span>
                  <div class="cell-sub text-mono" v-if="form.nim">{{ form.nim }}</div>
                </dd>
              </div>
              <div class="descriptions-item">
                <dt><i class="bi bi-geo-alt" aria-hidden="true"></i> UT-Daerah</dt>
                <dd>{{ form.upbjj | strip }}</dd>
              </div>
              <div class="descriptions-item">
                <dt><i class="bi bi-truck" aria-hidden="true"></i> Ekspedisi</dt>
                <dd>{{ ekspedisiTerpilih ? 'JNE ' + ekspedisiTerpilih.nama.split(' (')[0] : '-' }}</dd>
              </div>
              <div class="descriptions-item">
                <dt><i class="bi bi-calendar3" aria-hidden="true"></i> Tgl Kirim</dt>
                <dd>{{ form.tanggalKirim | tanggal }}</dd>
              </div>
            </dl>

            <div class="summary-items" v-if="paketTerpilih">
              <div class="text-strong">{{ paketTerpilih.nama }} <span class="text-muted" style="font-weight:400">· {{ isiPaket.length }} bahan ajar</span></div>
              <div class="summary-item" v-for="(b, i) in isiPaket" :key="b.kode">
                <div>
                  <div>{{ i + 1 }}. {{ b.judul }}</div>
                  <div class="cell-sub text-mono">{{ b.kode }}</div>
                </div>
                <span v-if="b.tersedia === 0" class="tag tag-error">Stok kosong</span>
                <span v-else class="text-muted nowrap">stok {{ b.tersedia }}</span>
              </div>
            </div>
            <div class="empty" style="padding:24px 0 8px" v-else>
              <i class="bi bi-box-seam empty-icon" style="font-size:40px" aria-hidden="true"></i>
              Belum ada paket yang dipilih.
            </div>
          </div>
          <div class="summary-total">
            <span class="text-secondary">Total Pembayaran</span>
            <strong>{{ totalHarga | rupiah }}</strong>
          </div>
        </article>
      </div>
    </section>
  `
});
