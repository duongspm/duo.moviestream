/**
 * ============================================================
 *  COMPONENT: MOVIE CARD
 * ============================================================
 * Hàm thuần render ra HTML string cho 1 card phim.
 * Dùng chung cho: trang chủ (rows), trang danh mục, trang search.
 * ============================================================
 */

const MovieCard = {
  /**
   * @param {object} movie - movie đã chuẩn hoá từ movieService
   * @param {object} options - { lazy: boolean }
   */
  render(movie, options = {}) {
    const { lazy = true } = options;
    if (!movie || !movie.slug) return "";

    const imgAttr = lazy
      ? `data-src="${movie.thumbUrl}" src=""`
      : `src="${movie.thumbUrl}"`;

    const episodeBadge = movie.episodeCurrent
      ? `<span class="card-badge badge-episode">${Utils.escapeHtml(movie.episodeCurrent)}</span>`
      : "";

    const qualityBadge = movie.quality
      ? `<span class="card-badge badge-quality">${Utils.escapeHtml(movie.quality)}</span>`
      : "";

    return `
      <a href="detail.html?slug=${encodeURIComponent(movie.slug)}" class="movie-card" data-slug="${movie.slug}">
        <div class="card-poster-wrap">
          <img class="card-poster ${lazy ? "" : "loaded"}" ${imgAttr} alt="${Utils.escapeHtml(movie.name)}" loading="lazy" />
          <div class="card-overlay">
            <button class="card-play-btn" aria-label="Xem phim">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
          <div class="card-badges">
            ${qualityBadge}
            ${episodeBadge}
          </div>
        </div>
        <div class="card-info">
          <h3 class="card-title">${Utils.escapeHtml(movie.name)}</h3>
          <p class="card-subtitle">${Utils.escapeHtml(movie.originName || "")}</p>
          <div class="card-meta">
            <span>${movie.year || ""}</span>
            ${movie.lang ? `<span class="dot">•</span><span>${Utils.escapeHtml(movie.lang)}</span>` : ""}
          </div>
        </div>
      </a>`;
  },

  /** Render danh sách card vào 1 container */
  renderList(movies = []) {
    if (!movies.length) {
      return `<div class="empty-block">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 3v4M8 3v4"></path>
        </svg>
        <p>Không tìm thấy phim nào phù hợp.</p>
      </div>`;
    }
    return movies.map((m) => this.render(m)).join("");
  },
};
