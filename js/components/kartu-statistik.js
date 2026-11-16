/* ==========================================================
   <kartu-statistik> - Kartu angka ringkasan (Ant Statistic)
   Props : label, nilai, satuan, ikon, warna, keterangan, bisaDiklik
   Emit  : 'klik'
   Angka dianimasikan (count-up) menggunakan watcher pada prop nilai.
   ========================================================== */

Vue.component('kartu-statistik', {
  props: {
    label: { type: String, required: true },
    nilai: { type: Number, default: 0 },
    satuan: { type: String, default: '' },
    ikon: { type: String, default: 'bi-bar-chart' },   // nama class Bootstrap Icons
    warna: { type: String, default: 'blue' },          // blue | green | orange | red | purple | cyan
    keterangan: { type: String, default: '' },
    bisaDiklik: { type: Boolean, default: false }
  },

  data() {
    return {
      tampil: 0,        // angka yang sedang ditampilkan saat animasi
      disorot: false    // true saat kursor mouse berada di atas kartu
    };
  },

  watch: {
    // Watcher dengan immediate: berjalan sekali saat komponen dibuat,
    // lalu setiap kali nilai dari induk berubah.
    nilai: {
      immediate: true,
      handler(baru, lama) {
        this.animasikan(lama || 0, baru);
      }
    }
  },

  methods: {
    animasikan(dari, ke) {
      var vm = this;
      var mulai = null;
      var durasi = 600;
      function langkah(waktu) {
        if (!mulai) mulai = waktu;
        var p = Math.min((waktu - mulai) / durasi, 1);
        vm.tampil = Math.round(dari + (ke - dari) * p);
        if (p < 1) requestAnimationFrame(langkah);
      }
      requestAnimationFrame(langkah);
    },
    klik() {
      if (this.bisaDiklik) this.$emit('klik');
    }
  },

  template: `
    <div class="card statistic"
         :class="{ 'card-hoverable': bisaDiklik }"
         :tabindex="bisaDiklik ? 0 : null"
         :role="bisaDiklik ? 'button' : null"
         @click="klik"
         @keyup.enter="klik"
         @mouseenter="disorot = true"
         @mouseleave="disorot = false">
      <span class="statistic-icon" :class="'tone-' + warna"><i class="bi" :class="ikon" aria-hidden="true"></i></span>
      <div>
        <div class="statistic-title">{{ label }}</div>
        <div class="statistic-value">{{ tampil | angka }}<small v-if="satuan">{{ satuan }}</small></div>
        <div class="statistic-foot statistic-link" v-if="bisaDiklik && disorot">Lihat detail <i class="bi bi-arrow-right"></i></div>
        <div class="statistic-foot" v-else-if="keterangan">{{ keterangan }}</div>
      </div>
    </div>
  `
});
