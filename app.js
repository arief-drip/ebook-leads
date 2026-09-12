(function () {
  "use strict";

  const book = window.EBOOK;
  const main = document.getElementById("main-content");
  const announcer = document.getElementById("route-announcer");
  const drawer = document.getElementById("contents-drawer");
  const drawerNav = document.getElementById("drawer-nav");
  const drawerButton = document.getElementById("contents-button");
  const closeDrawerButton = document.getElementById("close-drawer");
  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const progressLabel = document.getElementById("header-progress-label");
  const progressBar = document.getElementById("header-progress-bar");
  const storageKey = "lead-machine-reader-v1";

  const chapterMap = new Map();
  const partMap = new Map(book.parts.map((part) => [part.id, part]));
  const readingOrder = [{ ...book.opening, kind: "opening", hash: "#/pembuka" }];

  book.parts.forEach((part) => {
    part.chapters.forEach((chapter) => {
      const destination = {
        ...chapter,
        id: `bab-${chapter.number}`,
        kind: "chapter",
        hash: `#/bab/${chapter.number}`,
        part,
      };
      chapterMap.set(chapter.number, destination);
      readingOrder.push(destination);
    });
  });
  readingOrder.push({ ...book.closing, kind: "closing", hash: "#/penutup" });

  let state = readState();
  let lastFocusedBeforeDrawer = null;

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {
        visited: Array.isArray(parsed.visited) ? parsed.visited.filter((id) => typeof id === "string") : [],
        lastHash: typeof parsed.lastHash === "string" ? parsed.lastHash : "",
      };
    } catch (_error) {
      return { visited: [], lastHash: "" };
    }
  }

  function persistState() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_error) { /* Reading still works without storage. */ }
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function routeParts() {
    return (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
  }

  function currentDestination() {
    const [section, value] = routeParts();
    if (!section) return { kind: "home" };
    if (section === "pembuka") return readingOrder[0];
    if (section === "penutup") return readingOrder[readingOrder.length - 1];
    if (section === "bab" && /^\d+$/.test(value || "")) return chapterMap.get(Number(value)) || null;
    if (partMap.has(section) && !value) return { ...partMap.get(section), kind: "part", hash: `#/${section}` };
    return null;
  }

  function updateProgress(destination) {
    if (destination && ["opening", "chapter", "closing"].includes(destination.kind)) {
      if (!state.visited.includes(destination.id)) state.visited.push(destination.id);
      state.lastHash = destination.hash;
      persistState();
    }
    const completeCount = state.visited.filter((id) => readingOrder.some((item) => item.id === id)).length;
    const percentage = Math.round((completeCount / readingOrder.length) * 100);
    progressLabel.textContent = `${completeCount} / ${readingOrder.length}`;
    progressBar.style.width = `${percentage}%`;
  }

  function findReadingIndex(destination) {
    return destination ? readingOrder.findIndex((item) => item.id === destination.id) : -1;
  }

  function makeHomeCard({ href, eyebrow, count, title, description, wide = false }) {
    return `
      <a class="toc-card${wide ? " wide" : ""}" href="${href}">
        <span class="card-top"><span>${escapeHTML(eyebrow)}</span><span>${escapeHTML(count)}</span></span>
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(description)}</p>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </a>`;
  }

  function renderHome() {
    const saved = readingOrder.find((item) => item.hash === state.lastHash);
    const cards = [
      makeHomeCard({ href: "#/pembuka", eyebrow: "Pembuka", count: "01 titik baca", title: book.opening.title, description: book.opening.summary, wide: true }),
      ...book.parts.map((part) => makeHomeCard({ href: `#/${part.id}`, eyebrow: `Bagian ${part.number}`, count: `${String(part.chapters.length).padStart(2, "0")} bab`, title: part.title, description: part.accent })),
      makeHomeCard({ href: "#/penutup", eyebrow: "Penutup", count: "01 titik baca", title: book.closing.title, description: book.closing.summary, wide: true }),
    ].join("");

    main.innerHTML = `
      <div class="home">
        <section class="hero" aria-labelledby="book-title">
          <p class="eyebrow">${escapeHTML(book.meta.kicker)}</p>
          <h1 id="book-title">Stop Cari Nomor WhatsApp,<br><em>Mulai Cari Leads.</em></h1>
          <p class="hero-subtitle">${escapeHTML(book.meta.subtitle)}</p>
          ${saved ? `
            <a class="continue-card" href="${saved.hash}">
              <span class="continue-icon" aria-hidden="true">→</span>
              <span class="continue-copy"><small>Lanjut membaca</small><strong>${escapeHTML(destinationLabel(saved))}</strong></span>
              <span aria-hidden="true">↗</span>
            </a>` : ""}
        </section>
        <section class="contents-section" aria-labelledby="contents-title">
          <div class="section-label"><span id="contents-title">Pilih titik masuk</span><b>8 bagian utama</b></div>
          <div class="toc-grid">${cards}</div>
        </section>
      </div>`;
    document.title = book.meta.title;
  }

  function renderPart(part) {
    const rows = part.chapters.map((chapter) => `
      <a class="chapter-row" href="#/bab/${chapter.number}">
        <span class="number">${String(chapter.number).padStart(2, "0")}</span>
        <h3>${escapeHTML(chapter.title)}</h3>
        <span class="arrow" aria-hidden="true">→</span>
      </a>`).join("");

    main.innerHTML = `
      <section class="part-hero" aria-labelledby="part-title">
        <p class="part-index">Bagian ${part.number} / ${String(part.chapters.length).padStart(2, "0")} bab</p>
        <h1 id="part-title">${escapeHTML(part.title)}</h1>
        <span class="part-accent">${escapeHTML(part.accent)}</span>
      </section>
      <section class="chapter-directory" aria-labelledby="chapter-directory-title">
        <div class="directory-head">
          <h2 id="chapter-directory-title">Pilih bab.</h2>
          <p>Masuk dari awal atau pilih topik yang paling relevan. Progres tersimpan otomatis di perangkat ini.</p>
        </div>
        <div class="chapter-list">${rows}</div>
      </section>`;
    document.title = `${part.title} — ${book.meta.title}`;
  }

  function renderBlocks(blocks) {
    return blocks.map((block) => {
      if (block.type === "list") return `<ul class="point-list">${block.items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
      if (block.type === "subhead") return `<h2>${escapeHTML(block.text)}</h2>`;
      if (block.type === "paragraph") return `<p>${escapeHTML(block.text)}</p>`;
      if (block.type === "quote") return `<blockquote>${escapeHTML(block.text)}</blockquote>`;
      if (block.type === "anchor") return `<aside class="memory-anchor" role="note" aria-label="${escapeHTML(block.label)}"><p>${escapeHTML(block.text)}</p></aside>`;
      if (block.type === "flow") return `<div class="flow-block" aria-label="Alur: ${escapeHTML(block.items.join(" ke "))}">${block.items.map((item) => `<div class="flow-step">${escapeHTML(item)}</div>`).join("")}</div>`;
      if (block.type === "timeline") return `<dl class="timeline">${block.items.map(([day, action]) => `<dt>${escapeHTML(day)}</dt><dd>${escapeHTML(action)}</dd>`).join("")}</dl>`;
      if (block.type === "diagnostic") return `<div class="diagnostic-grid">${block.groups.map((group) => `<section class="diagnostic-card"><h3>${escapeHTML(group.title)}</h3><p>${escapeHTML(group.intro)}</p><ul>${group.items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></section>`).join("")}</div>`;
      if (block.type === "closing") return `<div class="closing-lines">${block.lines.map((line) => `<p>${escapeHTML(line)}</p>`).join("")}</div>`;
      return "";
    }).join("");
  }

  function destinationLabel(destination) {
    if (destination.kind === "chapter") return `Bab ${destination.number} — ${destination.title}`;
    if (destination.kind === "part") return `Bagian ${destination.number} — ${destination.title}`;
    return `${destination.label || ""}${destination.label ? " — " : ""}${destination.title}`;
  }

  function navLink(destination, direction) {
    if (!destination) return `<span class="empty" aria-hidden="true"></span>`;
    const label = direction === "prev" ? "Sebelumnya" : "Selanjutnya";
    const arrow = direction === "prev" ? "← " : " →";
    return `<a href="${destination.hash}"><small>${label}</small><strong>${direction === "prev" ? arrow : ""}${escapeHTML(destinationLabel(destination))}${direction === "next" ? arrow : ""}</strong></a>`;
  }

  function renderReader(destination) {
    const index = findReadingIndex(destination);
    const previous = readingOrder[index - 1] || null;
    const next = readingOrder[index + 1] || null;
    const part = destination.part || null;
    const routeProgress = Math.round(((index + 1) / readingOrder.length) * 100);
    const number = destination.kind === "chapter" ? String(destination.number).padStart(2, "0") : destination.kind === "opening" ? "00" : "∞";
    const kicker = destination.kind === "chapter" ? `Bagian ${part.number} / Bab ${String(destination.number).padStart(2, "0")}` : destination.label;
    const railTitle = part ? `Bagian ${part.number} — ${part.title}` : book.meta.description;
    const railHref = part ? `#/${part.id}` : "#/";

    main.innerHTML = `
      <div class="reader-wrap">
        <article class="reader-paper" style="--route-progress:${routeProgress}%" aria-labelledby="reader-title">
          <div class="reader-grid">
            <aside class="reader-rail" aria-label="Konteks bacaan">
              <a class="back-link" href="#/"><span aria-hidden="true">←</span> Daftar isi</a>
              <div class="rail-marker"><span class="giant-number" aria-hidden="true">${number}</span><p>Titik ${String(index + 1).padStart(2, "0")} / ${readingOrder.length}</p></div>
              <a class="rail-part-link" href="${railHref}">${escapeHTML(railTitle)}</a>
            </aside>
            <div class="reader-content">
              <header>
                <p class="reader-kicker">${escapeHTML(kicker)}</p>
                <h1 id="reader-title">${escapeHTML(destination.title)}</h1>
                ${destination.summary ? `<p class="reader-summary">${escapeHTML(destination.summary)}</p>` : ""}
              </header>
              <div class="content-blocks">${renderBlocks(destination.blocks)}</div>
            </div>
          </div>
        </article>
        <nav class="reader-nav" aria-label="Navigasi bacaan">${navLink(previous, "prev")}${navLink(next, "next")}</nav>
      </div>`;
    document.title = `${destinationLabel(destination)} — ${book.meta.title}`;
  }

  function renderError() {
    main.innerHTML = `<section class="error-view"><div><h1>404</h1><p>Bagian yang Anda cari tidak ada di ebook ini.</p><a href="#/">Kembali ke daftar isi</a></div></section>`;
    document.title = `Tidak ditemukan — ${book.meta.title}`;
  }

  function renderDrawer() {
    const currentHash = location.hash || "#/";
    const current = (hash) => hash === currentHash ? ' aria-current="page"' : "";
    drawerNav.innerHTML = `
      <div class="drawer-part"><a href="#/pembuka"${current("#/pembuka")}><span>00</span>${escapeHTML(book.opening.title)}</a></div>
      ${book.parts.map((part) => `
        <div class="drawer-part">
          <a href="#/${part.id}"${current(`#/${part.id}`)}><span>${part.number}</span>${escapeHTML(part.title)}</a>
          <ol>${part.chapters.map((chapter) => `<li><a href="#/bab/${chapter.number}"${current(`#/bab/${chapter.number}`)}><span>${String(chapter.number).padStart(2, "0")}</span>${escapeHTML(chapter.title)}</a></li>`).join("")}</ol>
        </div>`).join("")}
      <div class="drawer-part"><a href="#/penutup"${current("#/penutup")}><span>∞</span>${escapeHTML(book.closing.title)}</a></div>`;
  }

  function openDrawer() {
    lastFocusedBeforeDrawer = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    drawerButton.setAttribute("aria-expanded", "true");
    drawerBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    closeDrawerButton.focus();
  }

  function closeDrawer({ restoreFocus = true } = {}) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawerButton.setAttribute("aria-expanded", "false");
    drawerBackdrop.hidden = true;
    document.body.style.overflow = "";
    if (restoreFocus && lastFocusedBeforeDrawer) lastFocusedBeforeDrawer.focus();
  }

  function renderRoute() {
    const destination = currentDestination();
    if (!destination) renderError();
    else if (destination.kind === "home") renderHome();
    else if (destination.kind === "part") renderPart(destination);
    else renderReader(destination);

    updateProgress(destination);
    renderDrawer();
    closeDrawer({ restoreFocus: false });
    window.scrollTo(0, 0);
    announcer.textContent = destination ? `Membuka ${destination.kind === "home" ? "daftar isi" : destinationLabel(destination)}` : "Halaman tidak ditemukan";
  }

  drawerButton.addEventListener("click", () => drawer.classList.contains("is-open") ? closeDrawer() : openDrawer());
  closeDrawerButton.addEventListener("click", () => closeDrawer());
  drawerBackdrop.addEventListener("click", () => closeDrawer());
  drawerNav.addEventListener("click", (event) => { if (event.target.closest("a")) closeDrawer({ restoreFocus: false }); });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      event.preventDefault();
      closeDrawer();
      return;
    }
    if (drawer.classList.contains("is-open") && event.key === "Tab") {
      const focusable = [...drawer.querySelectorAll('a[href], button:not([disabled])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    const destination = currentDestination();
    const index = findReadingIndex(destination);
    if (index < 0) return;
    if (event.key === "ArrowLeft" && readingOrder[index - 1]) location.hash = readingOrder[index - 1].hash;
    if (event.key === "ArrowRight" && readingOrder[index + 1]) location.hash = readingOrder[index + 1].hash;
  });

  window.addEventListener("hashchange", renderRoute);
  renderRoute();
})();
