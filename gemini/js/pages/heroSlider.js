/**
 * ============================================================
 *  COMPONENT: HERO SLIDER (trang chủ)
 * ============================================================
 */

const HeroSlider = {
  _movies: [],
  _current: 0,
  _timer: null,
  _intervalMs: 6000,

  async mount(containerId = "hero-slider") {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = `<div class="hero-skeleton">
      <div class="skeleton-box" style="width:120px;height:24px;border-radius:999px;"></div>
      <div class="skeleton-box" style="width:60%;height:48px;"></div>
      <div class="skeleton-box" style="width:40%;height:20px;"></div>
      <div class="skeleton-box" style="width:30%;height:42px;border-radius:6px;margin-top:1rem;"></div>
    </div>`;

    try {
      // Lấy phim chiếu rạp làm hero — nếu rỗng thì fallback sang phim mới cập nhật
      let movies = [];
      try {
        const cinema = await movieService.getListByType(CONFIG.API.TYPE_LIST.PHIM_CHIEU_RAP, {}, 1);
        movies = cinema.items.filter(Boolean);
      } catch (_) {
        /* ignore, fallback below */
      }
      if (!movies.length) {
        const newest = await movieService.getNewest(1);
        movies = newest.items.filter(Boolean);
      }

      this._movies = movies.slice(0, 6);
      if (!this._movies.length) {
        el.innerHTML = Utils.errorBlock("Không thể tải phim nổi bật lúc này.");
        return;
      }

      this._render(el);
      this._bindEvents(el);
      this._startAutoplay();
    } catch (err) {
      el.innerHTML = Utils.errorBlock(
        err.message || "Lỗi tải dữ liệu trang chủ.",
        () => HeroSlider.mount(containerId)
      );
    }
  },

  _render(el) {
    const slides = this._movies
      .map((m, i) => {
        const rating = Utils.getRating(m);
        return `
        <div class="hero-slide ${i === 0 ? "active" : ""}" data-index="${i}">
          <div class="hero-slide-bg" style="background-image:url('${m.posterUrl || m.thumbUrl}')"></div>
          <div class="hero-slide-content">
            <span class="hero-tag">🔥 Đang Hot</span>
            <h1 class="hero-title">${Utils.escapeHtml(m.name)}</h1>
            <div class="hero-meta">
              ${rating ? `<span class="rating">★ ${rating}</span><span class="dot">•</span>` : ""}
              <span>${m.year || ""}</span>
              <span class="dot">•</span>
              <span>${Utils.typeLabel(m.type)}</span>
              ${m.lang ? `<span class="dot">•</span><span>${Utils.escapeHtml(m.lang)}</span>` : ""}
            </div>
            <p class="hero-desc">${Utils.escapeHtml((m.originName || m.name) + " — Cập nhật mới nhất, chất lượng cao.")}</p>
            <div class="hero-actions">
              <a href="watch.html?slug=${encodeURIComponent(m.slug)}" class="btn btn-primary btn-watch">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Xem Ngay
              </a>
              <a href="detail.html?slug=${encodeURIComponent(m.slug)}" class="btn btn-ghost">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                Chi Tiết
              </a>
            </div>
          </div>
        </div>`;
      })
      .join("");

    const dots = this._movies
      .map((_, i) => `<span class="hero-dot ${i === 0 ? "active" : ""}" data-index="${i}"></span>`)
      .join("");

    el.innerHTML = `
      <div class="hero-slides">${slides}</div>
      <button class="hero-arrow prev" aria-label="Phim trước">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button class="hero-arrow next" aria-label="Phim sau">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
      <div class="hero-dots">${dots}</div>`;
  },

  _bindEvents(el) {
    el.querySelector(".prev")?.addEventListener("click", () => this._go(this._current - 1));
    el.querySelector(".next")?.addEventListener("click", () => this._go(this._current + 1));
    el.querySelectorAll(".hero-dot").forEach((dot) => {
      dot.addEventListener("click", () => this._go(Number(dot.dataset.index)));
    });
    el.addEventListener("mouseenter", () => this._stopAutoplay());
    el.addEventListener("mouseleave", () => this._startAutoplay());
  },

  _go(index) {
    const total = this._movies.length;
    const next = (index + total) % total;
    document.querySelectorAll(".hero-slide").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".hero-dot").forEach((d) => d.classList.remove("active"));
    document.querySelector(`.hero-slide[data-index="${next}"]`)?.classList.add("active");
    document.querySelector(`.hero-dot[data-index="${next}"]`)?.classList.add("active");
    this._current = next;
  },

  _startAutoplay() {
    this._stopAutoplay();
    this._timer = setInterval(() => this._go(this._current + 1), this._intervalMs);
  },

  _stopAutoplay() {
    if (this._timer) clearInterval(this._timer);
  },
};
