# Stop Cari Nomor WhatsApp, Mulai Cari Leads

Static web ebook yang dapat dibuka langsung tanpa build step, package manager, backend, font eksternal, atau CDN.

## Menjalankan secara lokal

Buka `index.html` secara langsung di browser, atau jalankan static server dari folder ini, misalnya:

```sh
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Struktur

- `index.html` — semantic shell, header, drawer, dan accessibility anchors.
- `styles.css` — editorial visual system, responsive layout, print style, focus states, dan reduced-motion support.
- `content-parts-1-3.js` — manuskrip Pengantar serta Bagian 1–3.
- `content-parts-4-6.js` — manuskrip Bagian 4–6 serta Penutup.
- `content.js` — komposisi metadata dan fragmen manuskrip menjadi satu `window.EBOOK` untuk aplikasi.
- `app.js` — hash router, rendering, deep links, drawer navigation, keyboard controls, dan local reading progress.

Urutan script di `index.html` harus tetap: kedua fragmen konten, `content.js`, lalu `app.js`. Semua file memakai script biasa agar ebook tetap dapat dibuka langsung melalui `file://` tanpa build step atau network request.

## Deep links

- `#/` — daftar isi utama
- `#/pembuka` — Pengantar
- `#/bagian-1` hingga `#/bagian-6` — daftar bab per bagian
- `#/bab/1` hingga `#/bab/43` — tiap bab
- `#/penutup` — Penutup

Pada reading view, gunakan tombol panah kiri/kanan keyboard untuk berpindah bacaan. Progres dan posisi terakhir tersimpan di `localStorage` browser.
