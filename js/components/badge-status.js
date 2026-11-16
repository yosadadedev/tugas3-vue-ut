/* ==========================================================
   <badge-stok> dan <badge-do> - Label status berwarna
   Dipakai ulang di halaman beranda, stok, pemesanan, dan tracking.
   ========================================================== */

// <badge-stok :qty="28" :safety="20"></badge-stok>
Vue.component('badge-stok', {
  props: {
    qty: { type: Number, required: true },
    safety: { type: Number, required: true }
  },
  template: `
    <span v-if="qty === 0" class="tag tag-error" title="Stok habis, segera pesan ulang">Kosong</span>
    <span v-else-if="qty < safety" class="tag tag-warning" :title="'Kurang ' + (safety - qty) + ' dari safety stock'">Menipis</span>
    <span v-else class="tag tag-success" title="Stok di atas safety stock">Aman</span>
  `
});

// <badge-do status="Dalam Perjalanan"></badge-do>       -> titik + teks
// <badge-do status="Terkirim" tag></badge-do>          -> bentuk tag
Vue.component('badge-do', {
  props: {
    status: { type: String, required: true },
    tag: { type: Boolean, default: false }
  },
  template: `
    <span v-if="tag && status === 'Terkirim'" class="tag tag-success">{{ status }}</span>
    <span v-else-if="tag && status === 'Dalam Perjalanan'" class="tag tag-processing">{{ status }}</span>
    <span v-else-if="tag" class="tag tag-warning">{{ status }}</span>
    <span v-else-if="status === 'Terkirim'" class="badge-dot success">{{ status }}</span>
    <span v-else-if="status === 'Dalam Perjalanan'" class="badge-dot processing">{{ status }}</span>
    <span v-else class="badge-dot warning">{{ status }}</span>
  `
});
