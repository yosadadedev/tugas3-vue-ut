/* ==========================================================
   <app-sider> - Menu samping (sider) aplikasi
   Props : menu (Array), aktif (String), lencana (Object)
   Emit  : 'pindah' (id halaman)
   ========================================================== */

Vue.component('app-sider', {
  props: {
    menu: { type: Array, required: true },
    aktif: { type: String, required: true },
    // Angka kecil di samping menu, mis. { stok: 2 } = 2 bahan ajar perlu re-order
    lencana: { type: Object, default: function () { return {}; } }
  },

  template: `
    <aside class="layout-sider" aria-label="Navigasi utama">
      <a href="#beranda" class="sider-brand" @click.prevent="$emit('pindah', 'beranda')">
        <span class="brand-logo"><i class="bi bi-book-half" aria-hidden="true"></i></span>
        <span class="brand-name">SITTA <span class="brand-tagline">Universitas Terbuka</span></span>
      </a>

      <nav class="sider-menu">
        <div class="menu-group-title">Menu</div>
        <ul>
          <li v-for="(item, index) in menu" :key="item.id">
            <a :href="'#' + item.id" class="menu-item"
               :class="{ 'is-active': item.id === aktif }"
               :aria-current="item.id === aktif ? 'page' : null"
               :title="item.label + ' (Alt + ' + (index + 1) + ')'"
               @click.prevent="$emit('pindah', item.id)">
              <i class="bi" :class="item.ikon" aria-hidden="true"></i>
              <span class="menu-label">{{ item.label }}</span>
              <span class="menu-badge" v-if="lencana[item.id]">{{ lencana[item.id] }}</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="sider-footer">SITTA v3.0 &middot; Vue.js Component</div>
    </aside>
  `
});
