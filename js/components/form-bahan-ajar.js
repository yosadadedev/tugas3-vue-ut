/* ==========================================================
   <form-bahan-ajar> - Formulir tambah / edit bahan ajar
   Satu komponen dipakai ulang untuk dua mode lewat prop modeEdit.
   Props : modeEdit, dataAwal, stokList, upbjjList, kategoriList
   Emit  : 'simpan' (data form), 'batal'
   ========================================================== */

function formBahanAjarKosong() {
  return {
    kode: '',
    judul: '',
    kategori: '',
    upbjj: '',
    lokasiRak: '',
    harga: '',
    qty: '',
    safety: '',
    catatanHTML: ''
  };
}

Vue.component('form-bahan-ajar', {
  props: {
    modeEdit: { type: Boolean, default: false },
    dataAwal: { type: Object, default: null },
    stokList: { type: Array, required: true },
    upbjjList: { type: Array, required: true },
    kategoriList: { type: Array, required: true }
  },

  data() {
    return {
      // Props tidak boleh diubah langsung, jadi form bekerja pada SALINAN dataAwal
      form: this.dataAwal ? Object.assign({}, this.dataAwal) : formBahanAjarKosong(),
      error: {},
      sudahSubmit: false
    };
  },

  computed: {
    jumlahError() {
      return Object.keys(this.error).length;
    },
    // Pratinjau status hanya ditampilkan bila stok & safety sudah berupa angka bulat
    bisaPratinjau() {
      return Number.isInteger(this.form.qty) && Number.isInteger(this.form.safety);
    }
  },

  watch: {
    // Watcher: kode mata kuliah otomatis huruf kapital tanpa spasi
    'form.kode'(nilai) {
      var rapi = String(nilai || '').toUpperCase().replace(/\s/g, '');
      if (rapi !== nilai) this.form.kode = rapi;
    },
    // Watcher: lokasi rak otomatis huruf kapital
    'form.lokasiRak'(nilai) {
      var kapital = String(nilai || '').toUpperCase();
      if (kapital !== nilai) this.form.lokasiRak = kapital;
    },
    // Watcher deep: setelah pernah disubmit, validasi berjalan ulang setiap kali
    // isian berubah, sehingga pesan error langsung hilang saat input diperbaiki.
    form: {
      deep: true,
      handler() {
        if (this.sudahSubmit) this.error = this.validasi();
      }
    }
  },

  methods: {
    validasi() {
      var f = this.form;
      var error = {};
      var stok = this.stokList;

      function cekBilanganBulat(field, label) {
        var nilai = f[field];
        if (nilai === '' || nilai === null || nilai === undefined) {
          error[field] = label + ' wajib diisi.';
        } else if (!Number.isInteger(nilai) || nilai < 0) {
          error[field] = label + ' harus bilangan bulat 0 atau lebih.';
        }
      }

      // Identitas bahan ajar hanya divalidasi saat tambah (saat edit tidak bisa diubah)
      if (!this.modeEdit) {
        if (!f.kode) {
          error.kode = 'Kode mata kuliah wajib diisi.';
        } else if (!/^[A-Z]{4,5}\d{4}$/.test(f.kode)) {
          error.kode = 'Format kode tidak valid (contoh: EKMA4116).';
        } else if (f.upbjj && stok.some(function (s) { return s.kode === f.kode && s.upbjj === f.upbjj; })) {
          error.kode = 'Kode ini sudah terdaftar di UT-Daerah ' + f.upbjj + '.';
        }

        if (!f.judul) error.judul = 'Nama mata kuliah wajib diisi.';
        else if (f.judul.length < 3) error.judul = 'Nama mata kuliah minimal 3 karakter.';

        if (!f.kategori) error.kategori = 'Pilih kategori mata kuliah.';
        if (!f.upbjj) error.upbjj = 'Pilih UT-Daerah.';
      }

      if (!f.lokasiRak) error.lokasiRak = 'Lokasi rak wajib diisi.';
      else if (!/^R\d+-[A-Z]\d+$/.test(f.lokasiRak)) error.lokasiRak = 'Format lokasi rak tidak valid (contoh: R1-A3).';

      cekBilanganBulat('harga', 'Harga');
      if (!error.harga && f.harga === 0) error.harga = 'Harga harus lebih dari 0.';
      cekBilanganBulat('qty', 'Jumlah stok');
      cekBilanganBulat('safety', 'Safety stock');

      return error;
    },

    kirim() {
      this.sudahSubmit = true;
      this.error = this.validasi();
      if (this.jumlahError) {
        // Fokuskan kursor ke field pertama yang salah
        this.$nextTick(function () {
          var salah = this.$el.querySelector('.field.error input, .field.error select');
          if (salah) salah.focus();
        });
        return;
      }
      this.$emit('simpan', Object.assign({}, this.form));
    }
  },

  template: `
    <form novalidate
          @submit.prevent="kirim"
          @keydown.ctrl.enter.prevent="kirim"
          @keydown.meta.enter.prevent="kirim">

      <div class="alert alert-error mb-16" v-show="jumlahError">
        <i class="bi bi-x-circle-fill" aria-hidden="true"></i>
        <span>Ada <strong>{{ jumlahError }}</strong> isian yang perlu diperbaiki.</span>
      </div>

      <div class="form-row">
        <div class="form-item compact" :class="{ 'has-error': error.kode }">
          <label class="form-label" :class="{ required: !modeEdit }" for="fb-kode">Kode Mata Kuliah</label>
          <input id="fb-kode" class="input text-mono" v-model.trim="form.kode" :disabled="modeEdit" maxlength="9" placeholder="cth. EKMA4117">
          <div class="form-explain">{{ error.kode }}</div>
          <div class="form-help" v-if="!error.kode && !modeEdit">4–5 huruf diikuti 4 angka.</div>
        </div>

        <div class="form-item compact" :class="{ 'has-error': error.upbjj }">
          <label class="form-label" :class="{ required: !modeEdit }" for="fb-upbjj">UT-Daerah</label>
          <select id="fb-upbjj" class="select" v-model="form.upbjj" :disabled="modeEdit">
            <option value="" disabled>Pilih UT-Daerah</option>
            <option v-for="daerah in upbjjList" :key="daerah" :value="daerah">{{ daerah }}</option>
          </select>
          <div class="form-explain">{{ error.upbjj }}</div>
        </div>

        <div class="form-item compact span-2" :class="{ 'has-error': error.judul }">
          <label class="form-label" :class="{ required: !modeEdit }" for="fb-judul">Nama Mata Kuliah</label>
          <input id="fb-judul" class="input" v-model.trim="form.judul" :disabled="modeEdit" placeholder="cth. Pengantar Ekonomi Mikro">
          <div class="form-explain">{{ error.judul }}</div>
        </div>

        <div class="form-item compact" :class="{ 'has-error': error.kategori }">
          <label class="form-label" :class="{ required: !modeEdit }" for="fb-kategori">Kategori</label>
          <select id="fb-kategori" class="select" v-model="form.kategori" :disabled="modeEdit">
            <option value="" disabled>Pilih kategori</option>
            <option v-for="k in kategoriList" :key="k" :value="k">{{ k }}</option>
          </select>
          <div class="form-explain">{{ error.kategori }}</div>
        </div>

        <div class="form-item compact" :class="{ 'has-error': error.lokasiRak }">
          <label class="form-label required" for="fb-rak">Lokasi Rak</label>
          <input id="fb-rak" class="input text-mono" v-model.trim="form.lokasiRak" placeholder="cth. R1-A5">
          <div class="form-explain">{{ error.lokasiRak }}</div>
          <div class="form-help" v-if="!error.lokasiRak">Format R&lt;angka&gt;-&lt;huruf&gt;&lt;angka&gt;</div>
        </div>

        <div class="form-item compact" :class="{ 'has-error': error.qty }">
          <label class="form-label required" for="fb-qty">Jumlah Stok</label>
          <input id="fb-qty" class="input" type="number" min="0" v-model.number="form.qty" placeholder="0">
          <div class="form-explain">{{ error.qty }}</div>
        </div>

        <div class="form-item compact" :class="{ 'has-error': error.safety }">
          <label class="form-label required" for="fb-safety">Safety Stock</label>
          <input id="fb-safety" class="input" type="number" min="0" v-model.number="form.safety" placeholder="0">
          <div class="form-explain">{{ error.safety }}</div>
        </div>

        <div class="form-item compact span-2" :class="{ 'has-error': error.harga }">
          <label class="form-label required" for="fb-harga">Harga Satuan</label>
          <div class="input-affix">
            <span class="text-muted">Rp</span>
            <input id="fb-harga" class="input" type="number" min="0" step="500" v-model.number="form.harga" placeholder="65000">
          </div>
          <div class="form-explain">{{ error.harga }}</div>
          <div class="form-help" v-if="!error.harga && form.harga">{{ form.harga | rupiah }}</div>
        </div>

        <div class="form-item compact span-2">
          <label class="form-label" for="fb-catatan">Catatan <span class="text-muted">(boleh berisi HTML sederhana)</span></label>
          <textarea id="fb-catatan" class="input" style="height:auto;min-height:64px" rows="2" v-model="form.catatanHTML" placeholder="cth. <em>Edisi 2025</em>"></textarea>
          <div class="form-help" v-if="form.catatanHTML">Pratinjau: <span v-html="form.catatanHTML"></span></div>
        </div>
      </div>

      <div class="space text-muted" v-if="bisaPratinjau">
        Status setelah disimpan: <badge-stok :qty="form.qty" :safety="form.safety"></badge-stok>
      </div>

      <div class="modal-footer" style="margin-top:20px">
        <span class="text-muted" style="margin-right:auto;font-size:13px"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> simpan</span>
        <button type="button" class="btn" @click="$emit('batal')">Batal</button>
        <button type="submit" class="btn btn-primary">
          <i class="bi bi-check-lg" aria-hidden="true"></i> {{ modeEdit ? 'Simpan Perubahan' : 'Simpan' }}
        </button>
      </div>
    </form>
  `
});
