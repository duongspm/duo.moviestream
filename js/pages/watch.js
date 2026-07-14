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
  resumeTime: 0, // thời điểm (giây) sẽ tự seek tới khi vào tập đã xem dở
  _saveProgressTimer: null,

  async init() {
    Header.mount();
    Footer.mount();

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

    if (!this.movie.servers?.length || !this.movie.servers.some((s) => s.items.length)) {
      this._fatalError("Phim này hiện chưa có nguồn phát. Vui lòng quay lại sau.");
      return;
    }

    // Đọc server/ep từ URL nếu có (đến từ trang detail), không thì lấy tập đầu
    const serverFromUrl = Number(Utils.getQueryParam("server"));
    const epSlugFromUrl = Utils.getQueryParam("ep");

    this.serverIndex = this.movie.servers[serverFromUrl]?.items.length ? serverFromUrl : 0;
    const items = this.movie.servers[this.serverIndex].items;
    const epIdx = items.findIndex((e) => e.slug === epSlugFromUrl);

    // Nếu người dùng vào thẳng từ trang chủ/Tiếp tục xem mà KHÔNG chỉ định
    // rõ tập (không có ?ep=) thì tự nhảy tới đúng tập đang xem dở (nếu có).
    const savedProgress = storageService.getProgress(slug);
    if (epIdx >= 0) {
      this.episodeIndex = epIdx;
    } else if (savedProgress && items[savedProgress.episodeIndex]) {
      this.episodeIndex = savedProgress.episodeIndex;
    } else {
      this.episodeIndex = 0;
    }

    // Chỉ tự resume đúng thời điểm cũ nếu đang mở lại ĐÚNG tập đã xem dở
    // (tránh seek nhầm khi người dùng chủ động chọn 1 tập khác hẳn).
    this.resumeTime =
      savedProgress &&
      savedProgress.episodeIndex === this.episodeIndex &&
      savedProgress.serverIndex === this.serverIndex &&
      savedProgress.currentTime > 10
        ? savedProgress.currentTime
        : 0;

    this._renderTitleBlock();
    this._renderToolbar();
    this._renderSidebar();
    this._loadEpisode();

    playerService.onEnded(() => this._handleEnded());
    playerService.onTimeUpdate((currentTime, duration) => this._handleTimeUpdate(currentTime, duration));

    // Lưu lại tiến độ ngay trước khi người dùng đóng tab/điều hướng đi nơi khác,
    // để không mất vài giây cuối chưa kịp lưu theo định kỳ.
    window.addEventListener("beforeunload", () => this._saveProgressNow());

    this._bindKeyboardShortcuts();
  },

  /**
   * Phím tắt điều khiển player, CHỈ hoạt động khi player ở mode HLS (video
   * tag do site tự render). Khi rơi về mode iframe (nguồn nhúng bên thứ ba),
   * trình duyệt không cho JS của site điều khiển video bên trong iframe đó
   * (cross-origin) nên các phím tắt này sẽ không có tác dụng - đây là giới
   * hạn kỹ thuật, không phải lỗi.
   *
   * Space/K  : play / pause
   * ← / →    : lùi / tiến 10 giây
   * ↑ / ↓    : tăng / giảm âm lượng 10%
   * M        : tắt / mở tiếng
   * F        : toàn màn hình
   * N        : chuyển tập kế tiếp (nếu có)
   */
  _bindKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Không can thiệp khi người dùng đang gõ vào ô input/textarea (ví dụ search box)
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const video = playerService.video;
      const isHlsMode = playerService.mode === "hls" && video;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          if (!isHlsMode) return;
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case "arrowleft":
          if (!isHlsMode) return;
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "arrowright":
          if (!isHlsMode) return;
          e.preventDefault();
          video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
          break;
        case "arrowup":
          if (!isHlsMode) return;
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case "arrowdown":
          if (!isHlsMode) return;
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case "m":
          if (!isHlsMode) return;
          video.muted = !video.muted;
          break;
        case "f":
          if (!isHlsMode) return;
          this._toggleFullscreen();
          break;
        case "n":
          if (this._hasNextEpisode()) this._goNextEpisode();
          break;
        default:
          break;
      }
    });
  },

  _toggleFullscreen() {
    const wrap = document.getElementById("player-wrap");
    if (!document.fullscreenElement) {
      wrap.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
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
        ${m.servers.map((s, i) =>
            `<button class="${i === this.serverIndex ? "active" : ""}" data-server="${i}" 
            ${!s.items.length ? "disabled title='Server không có dữ liệu'" : ""}>${Utils.escapeHtml(s.serverName)}</button>`
          )
          .join("")}
      </div>
      
      <button class="btn btn-outline" id="retry-load-btn" style="font-size:var(--fs-tiny);padding:0.35rem 0.7rem;" title="Tải lại tập phim hiện tại nếu bị lag/đứng hình">
        🔄 Tải lại thử
      </button>

      <label class="autonext-toggle">
        Tự động chuyển tập nhé
        <span class="switch ${this.autoNextEnabled ? "on" : ""}" id="autonext-switch"></span>
      </label>

      <!-- Thêm nút này ngay sau label autonext-toggle -->
      <button class="btn-fix-audio" id="fix-audio-btn" title="Bấm khi tiếng bị méo/vỡ">
        🔧 Sửa tiếng
      </button>
      
      <span class="keyboard-hint" title="Space: Play/Pause • ←/→: Lùi/Tiến 10s • ↑/↓: Âm lượng • M: Tắt tiếng • F: Toàn màn hình • N: Tập kế">
        ⌨️ Phím tắt nè
      </span>`;

    toolbar.querySelectorAll("#server-switch button:not(:disabled)").forEach((btn) => {
      btn.addEventListener("click", () => {
        const newServer = Number(btn.dataset.server);
        if (newServer === this.serverIndex) return;
        this._saveProgressNow();
        this.serverIndex = newServer;
        this.episodeIndex = 0;
        this._renderToolbar();
        this._renderTitleBlock();
        this._renderSidebar();
        this._loadEpisode();
      });
    });

    document.getElementById("autonext-switch").addEventListener("click", (e) => {
      this.autoNextEnabled = !this.autoNextEnabled;
      e.target.classList.toggle("on", this.autoNextEnabled);
      if (!this.autoNextEnabled) this._clearAutoNextOverlay();
    });

    document.getElementById("retry-load-btn")?.addEventListener("click", () => {
      if (playerService.hls) {
        // Nếu đang dùng HLS.js: tua lại 3 giây rồi load lại segment từ đó
        // thay vì reset hoàn toàn (giữ nguyên vị trí xem, ít gián đoạn hơn)
        const currentTime = playerService.video?.currentTime || 0;
        playerService.hls.stopLoad();
        playerService.hls.startLoad(Math.max(0, currentTime - 3));
        Utils.toast("Đang tải lại từ vị trí hiện tại nè...", "info", 2000);
      } else {
        // Đang dùng iframe: chỉ có thể reload hoàn toàn
        this._loadEpisode();
        Utils.toast("Đang tải lại thử...", "info", 2000);
      }
    });
    document.getElementById("fix-audio-btn")?.addEventListener("click", () => {
      if (playerService.hls && playerService.video) {
        // Lưu vị trí đang xem
        const currentTime = playerService.video.currentTime;

        // recoverMediaError reset hoàn toàn bộ giải mã audio
        // mà không phải load lại toàn bộ video từ đầu
        playerService.hls.recoverMediaError();

        // Sau 300ms (đủ để reset xong), tua về đúng vị trí cũ
        setTimeout(() => {
          if (playerService.video) {
            playerService.video.currentTime = currentTime;
            playerService.video.play().catch(() => {});
          }
        }, 300);

        Utils.toast("Đã reset âm thanh, tiếp tục xem...", "success", 2000);
      } else {
        // Đang dùng iframe: chỉ có thể tải lại hoàn toàn
        this._loadEpisode();
        Utils.toast("Đang tải lại...", "info", 2000);
      }
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
              `<button class="ep-list-item ${i === this.episodeIndex ? "current" : ""}" data-ep="${i}">${Utils.escapeHtml(ep.name.replace(/^Tập\s*/i, ""))}</button>`
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
    this._saveProgressNow();
    document.querySelectorAll(".ep-list-item").forEach((b) => b.classList.remove("current"));
    document.querySelector(`.ep-list-item[data-ep="${this.episodeIndex}"]`)?.classList.add("current");
    this._renderTitleBlock();
    this._loadEpisode();
    this._syncUrl();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  _syncUrl() {
    const ep = this._currentEpisode();
    Utils.setQueryParams({ slug: this.movie.slug, server: this.serverIndex, ep: ep.slug });
  },

  _loadEpisode() {
    this._clearAutoNextOverlay();
    const ep = this._currentEpisode();
    const seekTo = this.resumeTime;
    this.resumeTime = 0; // chỉ resume 1 lần lúc vào trang, không áp dụng khi đổi tập sau đó

    playerService.play(ep, "player-wrap", { resumeAt: seekTo });
    if (seekTo > 5) {
      Utils.toast(`Đang tiếp tục từ ${Utils.formatDuration(seekTo)}`, "info");
    }
    this._syncUrl();
  },

  _handleTimeUpdate(currentTime, duration) {
    this._lastKnownTime = currentTime;
    this._lastKnownDuration = duration;

    // Throttle: chỉ ghi localStorage mỗi ~5 giây phát, không ghi mỗi frame
    // (timeupdate bắn rất thường xuyên) để tránh tốn hiệu năng vô ích.
    if (this._saveProgressTimer) return;
    this._saveProgressTimer = setTimeout(() => {
      this._saveProgressTimer = null;
      this._saveProgressNow();
    }, 5000);
  },

  _saveProgressNow() {
    if (!this.movie || !this._lastKnownDuration) return;
    // Phim coi như đã xem xong (>95%) thì xoá khỏi "Tiếp tục xem" luôn,
    // tránh hiển thị 1 phim đã xem hết trong row dành cho phim xem dở.
    const pct = (this._lastKnownTime / this._lastKnownDuration) * 100;
    if (pct >= 95) {
      storageService.removeProgress(this.movie.slug);
      return;
    }
    const ep = this._currentEpisode();
    storageService.saveProgress({
      slug: this.movie.slug,
      name: this.movie.name,
      thumbUrl: this.movie.thumbUrl,
      year: this.movie.year,
      type: this.movie.type,
      serverIndex: this.serverIndex,
      episodeIndex: this.episodeIndex,
      episodeSlug: ep.slug,
      episodeName: ep.name,
      currentTime: this._lastKnownTime,
      duration: this._lastKnownDuration,
    });
  },

  _hasNextEpisode() {
    return this.episodeIndex < this.movie.servers[this.serverIndex].items.length - 1;
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
    const nextEp = this.movie.servers[this.serverIndex].items[this.episodeIndex + 1];
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
    document.getElementById("autonext-now").addEventListener("click", () => this._goNextEpisode());
    document.getElementById("autonext-cancel").addEventListener("click", () => this._clearAutoNextOverlay());

    this.autoNextTimer = setInterval(() => {
      seconds -= 1;
      const secEl = document.getElementById("autonext-seconds");
      if (secEl) secEl.textContent = seconds;
      const offset = circumference * (1 - seconds / CONFIG.PLAYER.AUTO_NEXT_COUNTDOWN);
      if (progressCircle) progressCircle.setAttribute("stroke-dashoffset", offset);
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
