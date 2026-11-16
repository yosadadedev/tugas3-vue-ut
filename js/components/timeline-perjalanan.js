/* ==========================================================
   <timeline-perjalanan> - Riwayat perjalanan paket DO
   Props : perjalanan (Array of { waktu, keterangan }), selesai (Boolean)
   ========================================================== */

Vue.component('timeline-perjalanan', {
  props: {
    perjalanan: { type: Array, required: true },
    selesai: { type: Boolean, default: false }   // true bila DO sudah Terkirim
  },

  computed: {
    // Salin lalu balik urutan: entri terbaru tampil paling atas.
    // slice() agar array milik induk (props) tidak ikut terbalik.
    langkahTerbaru() {
      return this.perjalanan.slice().reverse();
    }
  },

  template: `
    <ol class="timeline" v-if="langkahTerbaru.length">
      <li v-for="(langkah, index) in langkahTerbaru" :key="langkah.waktu + '-' + index"
          class="timeline-item"
          :class="{ 'is-latest': index === 0 && !selesai, 'is-done': index === 0 && selesai }">
        <span class="timeline-dot"></span>
        <div class="timeline-content">{{ langkah.keterangan }}</div>
        <div class="timeline-time">{{ langkah.waktu | tanggalWaktu }}</div>
      </li>
    </ol>
    <div class="empty" v-else>
      <i class="bi bi-inbox empty-icon" aria-hidden="true"></i>
      Belum ada riwayat perjalanan.
    </div>
  `
});
