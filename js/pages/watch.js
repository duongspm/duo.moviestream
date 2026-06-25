/**
 * ============================================================
 *  PAGE: WATCH (watch.html)
 * ============================================================
 */

const WatchPage = {
  movie: null,
  serverIndex: 0,
  episodeIndex: 0,
  autoNextEnabled: true,
  autoNextTimer: null,

  async init() {
    Header.mount();
    Footer.mount();
    ScrollToTop.mount();

    const slug = Utils.getQueryParam("slug");
    if (!slug) {
      this._fatalError("Thiếu thông tin phim cần xem.");
      return;
    }

    try {
      this.movie = await movieService.getDetail(slug);
    } catch (err) {
      this._fatalError(err.message || "Không thể tải dữ liệu phim.");
      return;
    }

    if (
      !this.movie.servers?.length ||
      !this.movie.servers.some((s) => s.items.length)
    ) {
      this._fatalError(
        "Phim này hiện chưa có nguồn phát. Vui lòng quay lại sau.",
      );
      return;
    }

    // Đọc server/ep từ URL nếu có (đến từ trang detail), không thì lấy tập đầu
    const serverFromUrl = Number(Utils.getQueryParam("server"));
    const epSlugFromUrl = Utils.getQueryParam("ep");

    this.serverIndex = this.movie.servers[serverFromUrl]?.items.length
      ? serverFromUrl
      : 0;
    const items = this.movie.servers[this.serverIndex].items;
    const epIdx = items.findIndex((e) => e.slug === epSlugFromUrl);
    this.episodeIndex = epIdx >= 0 ? epIdx : 0;

    this._renderTitleBlock();
    this._renderToolbar();
    this._renderSidebar();
    this._loadEpisode();

    playerService.onEnded(() => this._handleEnded());
  },

  _currentEpisode() {
    return this.movie.servers[this.serverIndex].items[this.episodeIndex];
  },

  _renderTitleBlock() {
    const m = this.movie;
    const ep = this._currentEpisode();
    document.title = `${m.name} - ${ep.name} - ${CONFIG.SITE.NAME}`;

    document.getElementById("watch-title-block").innerHTML = `
      <a href="detail.html?slug=${encodeURIComponent(m.slug)}" class="watch-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        Quay lại trang chi tiết
      </a>
      <h1>${Utils.escapeHtml(m.name)} <span class="ep-current">— ${Utils.escapeHtml(ep.name)}</span></h1>
      <p>${Utils.escapeHtml(m.originName || "")} • ${m.year || ""} • ${Utils.typeLabel(m.type)}</p>`;
  },

  _renderToolbar() {
    const m = this.movie;
    const toolbar = document.getElementById("player-toolbar");
    toolbar.innerHTML = `
      <div class="server-switch" id="server-switch">
        ${m.servers
          .map(
            (s, i) =>
              `<button class="${i === this.serverIndex ? "active" : ""}" data-server="${i}" ${!s.items.length ? "disabled title='Server không có dữ liệu'" : ""}>${Utils.escapeHtml(s.serverName)}</button>`,
          )
          .join("")}
      </div>
      <label class="autonext-toggle">
        Tự động chuyển tập
        <span class="switch ${this.autoNextEnabled ? "on" : ""}" id="autonext-switch"></span>
      </label>`;

    toolbar
      .querySelectorAll("#server-switch button:not(:disabled)")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const newServer = Number(btn.dataset.server);
          if (newServer === this.serverIndex) return;
          this.serverIndex = newServer;
          this.episodeIndex = 0;
          this._renderToolbar();
          this._renderTitleBlock();
          this._renderSidebar();
          this._loadEpisode();
        });
      });

    document
      .getElementById("autonext-switch")
      .addEventListener("click", (e) => {
        this.autoNextEnabled = !this.autoNextEnabled;
        e.target.classList.toggle("on", this.autoNextEnabled);
        if (!this.autoNextEnabled) this._clearAutoNextOverlay();
      });
  },

  _renderSidebar() {
    const items = this.movie.servers[this.serverIndex].items;
    const sidebar = document.getElementById("watch-sidebar");
    sidebar.innerHTML = `
      <h3>Danh Sách Tập (${items.length})</h3>
      <div class="ep-list" id="ep-list">
        ${items
          .map(
            (ep, i) =>
              `<button class="ep-list-item ${i === this.episodeIndex ? "current" : ""}" data-ep="${i}">${Utils.escapeHtml(ep.name.replace(/^Tập\s*/i, ""))}</button>`,
          )
          .join("")}
      </div>`;

    sidebar.querySelectorAll(".ep-list-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.ep);
        if (idx === this.episodeIndex) return;
        this.episodeIndex = idx;
        this._afterEpisodeChange();
      });
    });
  },

  _afterEpisodeChange() {
    document
      .querySelectorAll(".ep-list-item")
      .forEach((b) => b.classList.remove("current"));
    document
      .querySelector(`.ep-list-item[data-ep="${this.episodeIndex}"]`)
      ?.classList.add("current");
    this._renderTitleBlock();
    this._loadEpisode();
    this._syncUrl();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  _syncUrl() {
    const ep = this._currentEpisode();
    Utils.setQueryParams({
      slug: this.movie.slug,
      server: this.serverIndex,
      ep: ep.slug,
    });
  },

  _loadEpisode() {
    this._clearAutoNextOverlay();
    const ep = this._currentEpisode();
    playerService.play(ep, "player-wrap");
    this._syncUrl();
  },

  _hasNextEpisode() {
    return (
      this.episodeIndex < this.movie.servers[this.serverIndex].items.length - 1
    );
  },

  _goNextEpisode() {
    if (!this._hasNextEpisode()) return;
    this.episodeIndex += 1;
    this._afterEpisodeChange();
  },

  _handleEnded() {
    if (!this.autoNextEnabled || !this._hasNextEpisode()) return;
    this._showAutoNextOverlay();
  },

  _showAutoNextOverlay() {
    const nextEp =
      this.movie.servers[this.serverIndex].items[this.episodeIndex + 1];
    const wrap = document.getElementById("player-wrap");
    let seconds = CONFIG.PLAYER.AUTO_NEXT_COUNTDOWN;
    const circumference = 2 * Math.PI * 28;

    const overlay = document.createElement("div");
    overlay.className = "autonext-overlay";
    overlay.id = "autonext-overlay";
    overlay.innerHTML = `
      <img src="${this.movie.thumbUrl}" alt="" />
      <p class="autonext-title">Tự động chuyển tới: ${Utils.escapeHtml(nextEp.name)}</p>
      <p class="autonext-sub">Video hiện tại đã kết thúc</p>
      <div class="autonext-ring">
        <svg width="64" height="64">
          <circle class="bg" cx="32" cy="32" r="28" fill="none" stroke-width="4"></circle>
          <circle class="progress" cx="32" cy="32" r="28" fill="none" stroke-width="4"
            stroke-dasharray="${circumference}" stroke-dashoffset="0"></circle>
        </svg>
        <span id="autonext-seconds">${seconds}</span>
      </div>
      <div class="autonext-actions">
        <button class="btn btn-primary" id="autonext-now">Xem ngay</button>
        <button class="btn btn-outline" id="autonext-cancel">Hủy</button>
      </div>`;
    wrap.appendChild(overlay);

    const progressCircle = overlay.querySelector(".progress");
    document
      .getElementById("autonext-now")
      .addEventListener("click", () => this._goNextEpisode());
    document
      .getElementById("autonext-cancel")
      .addEventListener("click", () => this._clearAutoNextOverlay());

    this.autoNextTimer = setInterval(() => {
      seconds -= 1;
      const secEl = document.getElementById("autonext-seconds");
      if (secEl) secEl.textContent = seconds;
      const offset =
        circumference * (1 - seconds / CONFIG.PLAYER.AUTO_NEXT_COUNTDOWN);
      if (progressCircle)
        progressCircle.setAttribute("stroke-dashoffset", offset);
      if (seconds <= 0) {
        clearInterval(this.autoNextTimer);
        this._goNextEpisode();
      }
    }, 1000);
  },

  _clearAutoNextOverlay() {
    if (this.autoNextTimer) clearInterval(this.autoNextTimer);
    document.getElementById("autonext-overlay")?.remove();
  },

  _fatalError(message) {
    document.getElementById("watch-root").innerHTML = `
      <div class="container" style="padding: var(--space-xl) var(--space-md);">
        ${Utils.errorBlock(message)}
      </div>`;
  },
};

document.addEventListener("DOMContentLoaded", () => WatchPage.init());
