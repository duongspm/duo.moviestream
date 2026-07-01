/**
 * ============================================================
 *  COMPONENT: CONTINUE WATCHING ROW (trang chủ)
 * ============================================================
 * Hiển thị các phim người dùng đã xem dở trên CHÍNH máy này
 * (dữ liệu lấy từ storageService / localStorage). Tự ẩn hoàn
 * toàn nếu chưa có lịch sử nào - không hiện row trống.
 * ============================================================
 */

const ContinueWatchingRow = {
  mount(containerId = "row-continue") {
    const el = document.getElementById(containerId);
    if (!el) return;

    const history = storageService.getHistory();
    if (!history.length) {
      el.innerHTML = "";
      el.hidden = true;
      return;
    }
    el.hidden = false;

    el.innerHTML = `
      <div class="section-head">
        <h2 class="section-title">Tiếp Tục Xem</h2>
        <button class="section-link" id="clear-history-btn" type="button">Xoá lịch sử</button>
      </div>
      <div class="movie-row">
        <div class="movie-row-track" id="${containerId}-track"></div>
        <button class="row-nav-btn prev" aria-label="Trượt trái" hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button class="row-nav-btn next" aria-label="Trượt phải">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>`;

    const track = document.getElementById(`${containerId}-track`);
    track.innerHTML = history.map((entry) => this._renderCard(entry)).join("");
    Utils.initLazyImages(track);
    this._bindRemoveButtons(track, containerId);
    this._bindScroll(el, track);

    document.getElementById("clear-history-btn")?.addEventListener("click", () => {
      storageService.clearHistory();
      this.mount(containerId);
      Utils.toast("Đã xoá lịch sử xem.", "success");
    });
  },

  _renderCard(entry) {
    const pct = StorageService.percentWatched(entry);
    const epLabel = entry.episodeName ? Utils.escapeHtml(entry.episodeName) : "";
    return `
      <a href="watch.html?slug=${encodeURIComponent(entry.slug)}&server=${entry.serverIndex ?? 0}&ep=${encodeURIComponent(entry.episodeSlug || "")}"
         class="movie-card continue-card" data-slug="${entry.slug}">
        <div class="card-poster-wrap">
          <img class="card-poster" data-src="${entry.posterUrl}" src="" alt="${Utils.escapeHtml(entry.name)}" loading="lazy" />
          <div class="card-overlay">
            <button class="card-play-btn" aria-label="Tiếp tục xem">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
          <button class="continue-remove-btn" data-remove-slug="${entry.slug}" aria-label="Xoá khỏi lịch sử" title="Xoá khỏi lịch sử">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div class="continue-progress-track">
            <div class="continue-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="card-info">
          <h3 class="card-title">${Utils.escapeHtml(entry.name)}</h3>
          <p class="card-subtitle">${epLabel}</p>
        </div>
      </a>`;
  },

  _bindRemoveButtons(track, containerId) {
    track.querySelectorAll(".continue-remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slug = btn.dataset.removeSlug;
        storageService.removeProgress(slug);
        this.mount(containerId);
      });
    });
  },

  _bindScroll(rowEl, track) {
    const prevBtn = rowEl.querySelector(".prev");
    const nextBtn = rowEl.querySelector(".next");
    const scrollAmount = () => track.clientWidth * 0.85;

    prevBtn?.addEventListener("click", () => track.scrollBy({ left: -scrollAmount(), behavior: "smooth" }));
    nextBtn?.addEventListener("click", () => track.scrollBy({ left: scrollAmount(), behavior: "smooth" }));

    const updateButtons = () => {
      prevBtn.hidden = track.scrollLeft <= 4;
      nextBtn.hidden = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    track.addEventListener("scroll", Utils.throttle(updateButtons, 150));
    window.addEventListener("resize", Utils.throttle(updateButtons, 200));
    updateButtons();
  },
};
