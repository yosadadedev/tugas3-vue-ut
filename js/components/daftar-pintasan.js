/* ==========================================================
   <daftar-pintasan> - Tabel pintasan keyboard (isi modal "?")
   ========================================================== */

Vue.component('daftar-pintasan', {
  data() {
    return {
      pintasan: [
        { tombol: ['Alt', '1 – 4'], fungsi: 'Pindah menu (Beranda, Stok, Pemesanan, Tracking)' },
        { tombol: ['/'], fungsi: 'Fokus ke kolom pencarian stok' },
        { tombol: ['N'], fungsi: 'Tambah bahan ajar (halaman stok)' },
        { tombol: ['Enter'], fungsi: 'Buka edit pada baris stok yang sedang fokus / cari DO' },
        { tombol: ['Ctrl', 'Enter'], fungsi: 'Simpan formulir' },
        { tombol: ['Esc'], fungsi: 'Tutup pop-up atau kosongkan pencarian' },
        { tombol: ['↑', '↓'], fungsi: 'Pilih DO di tabel tracking' },
        { tombol: ['?'], fungsi: 'Tampilkan daftar pintasan ini' }
      ]
    };
  },
  template: `
    <table class="table table-sm">
      <tbody>
        <tr v-for="p in pintasan" :key="p.fungsi">
          <td class="nowrap">
            <template v-for="(t, i) in p.tombol"><span v-if="i > 0" :key="'p' + i" class="text-muted"> + </span><kbd :key="'k' + i">{{ t }}</kbd></template>
          </td>
          <td class="text-secondary">{{ p.fungsi }}</td>
        </tr>
      </tbody>
    </table>
  `
});
