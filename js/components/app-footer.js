/* ==========================================================
   <app-footer> - Kaki halaman
   Props : keterangan
   ========================================================== */

Vue.component('app-footer', {
  props: {
    keterangan: { type: String, default: '' }
  },
  template: `
    <footer class="layout-footer">&copy; {{ tahun }} {{ keterangan }}</footer>
  `,
  computed: {
    tahun() {
      return new Date().getFullYear();
    }
  }
});
