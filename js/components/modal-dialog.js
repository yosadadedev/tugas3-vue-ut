/* ==========================================================
   <modal-dialog> - Jendela pop-up yang dapat dipakai ulang
   Props : judul, subjudul, lebar (sm | md | lg)
   Slot  : isi modal (default slot)
   Emit  : 'tutup' (klik latar, tombol X, atau tombol Esc)
   ========================================================== */

Vue.component('modal-dialog', {
  props: {
    judul: { type: String, required: true },
    subjudul: { type: String, default: '' },
    lebar: { type: String, default: 'md' }
  },

  mounted() {
    // Event keyboard global: Esc menutup modal
    document.addEventListener('keydown', this.tanganiTombol);
    document.body.classList.add('is-modal-open');

    // Fokus otomatis ke input pertama yang bisa diisi
    this.$nextTick(function () {
      var input = this.$el.querySelector('input:not([readonly]):not([disabled]), select:not([disabled]), textarea');
      if (input) input.focus();
    });
  },

  beforeDestroy() {
    // Listener dilepas agar tidak menumpuk setiap kali modal dibuka
    document.removeEventListener('keydown', this.tanganiTombol);
    document.body.classList.remove('is-modal-open');
  },

  methods: {
    tanganiTombol(event) {
      if (event.key === 'Escape') this.$emit('tutup');
    }
  },

  template: `
    <div class="modal-mask" @click.self="$emit('tutup')">
      <div class="modal" :class="{ 'modal-sm': lebar === 'sm', 'modal-lg': lebar === 'lg' }"
           role="dialog" aria-modal="true" :aria-label="judul">
        <div class="modal-content">
          <button type="button" class="modal-close" title="Tutup (Esc)" @click="$emit('tutup')">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
          <div class="modal-header">
            <div class="modal-title">{{ judul }}</div>
            <div class="modal-subtitle" v-if="subjudul">{{ subjudul }}</div>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  `
});
