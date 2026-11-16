/* ==========================================================
   <notifikasi-toast> - Pesan singkat di atas layar (gaya Ant Message)
   Props : pesan, jenis (sukses | gagal | info)
   Emit  : 'tutup' (diklik)
   ========================================================== */

Vue.component('notifikasi-toast', {
  props: {
    pesan: { type: String, default: '' },
    jenis: { type: String, default: 'sukses' }
  },
  computed: {
    kelasJenis() {
      return { sukses: 'message-success', gagal: 'message-error', info: 'message-info' }[this.jenis] || 'message-info';
    }
  },
  template: `
    <div class="message-container" role="status" aria-live="polite">
      <transition name="msg">
        <div v-if="pesan" class="message" :class="kelasJenis" title="Klik untuk menutup" @click="$emit('tutup')">
          <i v-if="jenis === 'gagal'" class="bi bi-x-circle-fill" aria-hidden="true"></i>
          <i v-else-if="jenis === 'info'" class="bi bi-info-circle-fill" aria-hidden="true"></i>
          <i v-else class="bi bi-check-circle-fill" aria-hidden="true"></i>
          <span>{{ pesan }}</span>
        </div>
      </transition>
    </div>
  `
});
