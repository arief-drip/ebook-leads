/* Compose the split manuscript into the single data contract consumed by app.js. */
(function composeEbook() {
  "use strict";

  const requiredFragments = [
    "EBOOK_OPENING_EXPANDED",
    "EBOOK_PARTS_1_3_EXPANDED",
    "EBOOK_PARTS_4_6_EXPANDED",
    "EBOOK_CLOSING_EXPANDED",
  ];
  const missingFragments = requiredFragments.filter((key) => !window[key]);

  if (missingFragments.length) {
    throw new Error(`Ebook content fragments missing: ${missingFragments.join(", ")}`);
  }

  window.EBOOK = {
    meta: {
      title: "Stop Cari Nomor WhatsApp, Mulai Cari Leads",
      subtitle: "Cara Membangun Database yang Benar, Melakukan Nurturing, dan Mengubah Leads Menjadi Customer dengan Evergreen Campaign",
      kicker: "Field Guide / 2026—2027",
      description: "Dari database nomor menuju database calon customer.",
    },
    opening: window.EBOOK_OPENING_EXPANDED,
    parts: [
      ...window.EBOOK_PARTS_1_3_EXPANDED,
      ...window.EBOOK_PARTS_4_6_EXPANDED,
    ],
    closing: window.EBOOK_CLOSING_EXPANDED,
  };

  for (const key of requiredFragments) {
    delete window[key];
  }
})();
