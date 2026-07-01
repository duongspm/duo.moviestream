/**
 * ============================================================
 *  PAGE: FAVORITES + ĐANG XEM DỞ (favorites.html)
 * ============================================================
 */

const FavoritesPage = {
  init() {
    Header.mount();
    Footer.mount();
    this._bindTabs();
    this._renderFavorites();
    this._renderWatching();
  },

  _bindTabs() {
    document.querySelectorAll(".fav-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".fav-tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".fav-tab-panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
      });
    });
  },

  _renderFavorites() {
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
        this._renderFavorites();
        Utils.toast("Đã xoá khỏi Yêu thích.", "success");
      });
    });
  },

  _renderWatching() {
    const grid = document.getElementById("watching-grid");
    const emptyState = document.getElementById("watching-empty");
    const list = storageService.getHistory(); // danh sách "tiếp tục xem"

    if (!list.length) {
      grid.innerHTML = "";
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    grid.innerHTML = list
      .map((entry) => {
        const pct = StorageService.percentWatched(entry);
        return `
        <div class="movie-card watching-card" data-slug="${entry.slug}">
          <a href="watch.html?slug=${encodeURIComponent(entry.slug)}&server=${entry.serverIndex ?? 0}&ep=${encodeURIComponent(entry.episodeSlug || "")}">
            <div class="card-poster-wrap">
              <img class="card-poster" data-src="${entry.thumbUrl}" src="" alt="${Utils.escapeHtml(entry.name)}" loading="lazy" />
              <div class="card-overlay">
                <button class="card-play-btn" aria-label="Tiếp tục xem">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
              </div>
              <div class="watching-progress-track">
                <div class="watching-progress-fill" style="width:${pct}%"></div>
              </div>
            </div>
            <div class="card-info">
              <h3 class="card-title">${Utils.escapeHtml(entry.name)}</h3>
              <p class="card-subtitle">${entry.episodeName ? Utils.escapeHtml(entry.episodeName) : ""} • ${pct}%</p>
            </div>
          </a>
          <button class="favorite-remove-btn" data-remove-slug="${entry.slug}" type="button">
            Xoá khỏi danh sách
          </button>
        </div>`;
      })
      .join("");

    Utils.initLazyImages(grid);

    grid.querySelectorAll(".favorite-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        storageService.removeProgress(btn.dataset.removeSlug);
        this._renderWatching();
        Utils.toast("Đã xoá khỏi danh sách đang xem.", "success");
      });
    });
  },
};

document.addEventListener("DOMContentLoaded", () => FavoritesPage.init());