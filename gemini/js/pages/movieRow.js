/**
 * ============================================================
 *  COMPONENT: MOVIE ROW (carousel ngang theo danh mục)
 * ============================================================
 * Dùng cho trang chủ: "Phim Mới Cập Nhật", "Phim Lẻ", "Phim Bộ", "Phim Xem Nhiều"...
 * fetcher: async function trả về { items: [...] }
 */

const MovieRow = {
  /**
   * @param {string} containerId
   * @param {{ title: string, viewAllHref?: string, fetcher: () => Promise<{items:Array}> }} opts
   */
  async mount(containerId, opts) {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = `
      <div class="section-head">
        <h2 class="section-title">${Utils.escapeHtml(opts.title)}</h2>
        ${opts.viewAllHref ? `<a class="section-link" href="${opts.viewAllHref}">Xem tất cả →</a>` : ""}
      </div>
      <div class="movie-row">
        <div class="movie-row-track" id="${containerId}-track">
          ${Utils.skeletonCards(8)}
        </div>
        <button class="row-nav-btn prev" aria-label="Trượt trái" hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button class="row-nav-btn next" aria-label="Trượt phải">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>`;

    const track = document.getElementById(`${containerId}-track`);

    try {
      const { items } = await opts.fetcher();
      const valid = (items || []).filter(Boolean);
      track.innerHTML = MovieCard.renderList(valid);
      Utils.initLazyImages(track);
      this._bindScroll(el, track);
    } catch (err) {
      track.innerHTML = Utils.errorBlock(
        err.message || "Không thể tải danh sách phim.",
        () => MovieRow.mount(containerId, opts)
      );
    }
  },

  _bindScroll(rowEl, track) {
    const prevBtn = rowEl.querySelector(".prev");
    const nextBtn = rowEl.querySelector(".next");
    const scrollAmount = () => track.clientWidth * 0.85;

    prevBtn?.addEventListener("click", () => {
      track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    });
    nextBtn?.addEventListener("click", () => {
      track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    });

    const updateButtons = () => {
      prevBtn.hidden = track.scrollLeft <= 4;
      nextBtn.hidden = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    track.addEventListener("scroll", Utils.throttle(updateButtons, 150));
    window.addEventListener("resize", Utils.throttle(updateButtons, 200));
    updateButtons();
  },
};
