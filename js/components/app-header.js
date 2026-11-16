/* ==========================================================
   <app-header> - Header atas: tombol menu (HP), jam, menu pengguna
   Emit  : 'buka-menu', 'pintasan', 'pulihkan'
   ========================================================== */

var NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

Vue.component('app-header', {
  data() {
    return {
      sekarang: new Date(),
      timer: null,
      dropdownTerbuka: false
    };
  },

  computed: {
    // "Senin, 16 November 2026 · 08:30"
    teksJam() {
      var d = this.sekarang;
      return NAMA_HARI[d.getDay()] + ', ' + Vue.filter('tanggal')(Util.tanggalHariIni()) + ' · ' +
        Util.duaDigit(d.getHours()) + ':' + Util.duaDigit(d.getMinutes());
    }
  },

  mounted() {
    var vm = this;
    vm.timer = setInterval(function () { vm.sekarang = new Date(); }, 1000 * 30);
    // Klik di luar dropdown akan menutupnya
    document.addEventListener('click', vm.klikLuar);
  },

  beforeDestroy() {
    clearInterval(this.timer);
    document.removeEventListener('click', this.klikLuar);
  },

  methods: {
    klikLuar(event) {
      if (this.dropdownTerbuka && !this.$refs.dropdown.contains(event.target)) {
        this.dropdownTerbuka = false;
      }
    },
    pilih(aksi) {
      this.dropdownTerbuka = false;
      this.$emit(aksi);
    }
  },

  template: `
    <header class="layout-header">
      <div class="header-left">
        <button type="button" class="btn btn-text btn-icon header-menu-btn" aria-label="Buka menu"
                @click="$emit('buka-menu')">
          <i class="bi bi-list" aria-hidden="true"></i>
        </button>
        <span class="header-clock"><i class="bi bi-clock" aria-hidden="true"></i> {{ teksJam }}</span>
      </div>

      <div class="header-right">
        <button type="button" class="btn btn-text btn-icon" title="Pintasan keyboard (?)" @click="$emit('pintasan')">
          <i class="bi bi-keyboard" aria-hidden="true"></i>
        </button>

        <div class="dropdown" :class="{ 'is-open': dropdownTerbuka }" ref="dropdown">
          <button type="button" class="header-user" :aria-expanded="dropdownTerbuka ? 'true' : 'false'"
                  @click="dropdownTerbuka = !dropdownTerbuka">
            <span class="avatar">PU</span>
            <span class="header-user-text">
              <strong>Petugas UPBJJ</strong>
              <small>UPBJJ-UT</small>
            </span>
            <i class="bi bi-chevron-down" aria-hidden="true"></i>
          </button>
          <div class="dropdown-menu" role="menu">
            <div class="dropdown-profile">
              <span class="avatar avatar-lg">PU</span>
              <div>
                <div class="name">Petugas UPBJJ</div>
                <div class="meta">Pengelola bahan ajar</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button type="button" class="dropdown-item" role="menuitem" @click="pilih('pintasan')">
              <i class="bi bi-keyboard" aria-hidden="true"></i> Pintasan keyboard
            </button>
            <button type="button" class="dropdown-item is-danger" role="menuitem" @click="pilih('pulihkan')">
              <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Pulihkan data awal
            </button>
          </div>
        </div>
      </div>
    </header>
  `
});
