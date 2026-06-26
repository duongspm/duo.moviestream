/**
 * ============================================================
 *  PAGE: FAVORITES (favorites.html)
 * ============================================================
 * Toàn bộ dữ liệu đọc từ localStorage qua storageService - không
 * gọi API nào. Vì vậy trang này hoạt động được cả khi mất mạng,
 * miễn là người dùng đã từng lưu phim yêu thích trên máy này.
 * ============================================================
 */

const FavoritesPage = {
  init() {
    Header.mount();
    Footer.mount();
    this._render();
  },

  _render() {
    const grid = document.getElementById("favorites-grid");
    const emptyState = document.getElementById("favorites-empty");
    const list = storageService.getFavorites();

    if (!list.length) {
      grid.innerHTML = "";
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    grid.innerHTML = list
      .map(
        (m) => `
        <div class="movie-card favorite-card" data-slug="${m.slug}">
          <a href="detail.html?slug=${encodeURIComponent(m.slug)}">
            <div class="card-poster-wrap">
              <img class="card-poster" data-src="${m.thumbUrl}" src="" alt="${Utils.escapeHtml(m.name)}" loading="lazy" />
              <div class="card-overlay">
                <button class="card-play-btn" aria-label="Xem chi tiết">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
              </div>
            </div>
            <div class="card-info">
              <h3 class="card-title">${Utils.escapeHtml(m.name)}</h3>
              <p class="card-subtitle">${Utils.escapeHtml(m.originName || "")}</p>
            </div>
          </a>
          <button class="favorite-remove-btn" data-remove-slug="${m.slug}" type="button">
            Xoá khỏi yêu thích
          </button>
        </div>`
      )
      .join("");

    Utils.initLazyImages(grid);

    grid.querySelectorAll(".favorite-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        storageService.removeFavorite(btn.dataset.removeSlug);
        this._render();
        Utils.toast("Đã xoá khỏi Yêu thích.", "success");
      });
    });
  },
};

document.addEventListener("DOMContentLoaded", () => FavoritesPage.init());
