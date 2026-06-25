/**
 * ============================================================
 *  PLAYER SERVICE
 * ============================================================
 * Trách nhiệm:
 *  - Phát link .m3u8 (HLS) bằng HLS.js + Plyr cho UI đẹp, mượt,
 *    tự chủ hoàn toàn giao diện player (không phụ thuộc iframe).
 *  - Nếu link m3u8 lỗi / không có -> fallback sang link_embed
 *    (iframe) do nguồn phim cung cấp, có sandbox hạn chế để giảm
 *    tối đa rủi ro popup quảng cáo từ nguồn nhúng.
 *  - Bắn callback "onEnded" để Watch Page xử lý auto-next.
 * ============================================================
 */

class PlayerService {
  constructor() {
    this.hls = null;
    this.video = null;
    this.plyr = null;
    this.mode = null; // 'hls' | 'iframe'
    this.onEndedCallback = null;
    this.onTimeUpdateCallback = null;
  }

  /**
   * @param {{ linkM3u8?: string, linkEmbed?: string }} episode
   * @param {string} wrapId - id của .player-wrap container
   */
  async play(episode, wrapId = "player-wrap") {
    this.destroy();
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="player-loading" id="player-loading">
        <div class="spinner"></div>
        <span>Đang tải nguồn phát...</span>
      </div>`;

    const preferHls = CONFIG.PLAYER.DEFAULT_MODE === "hls" && episode.linkM3u8;

    if (preferHls) {
      const success = await this._playHls(episode.linkM3u8, wrap);
      if (success) return;
    }

    if (episode.linkEmbed) {
      this._playIframe(episode.linkEmbed, wrap);
      return;
    }

    wrap.innerHTML = `
      <div class="player-error">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p>Không có nguồn phát nào cho tập này. Vui lòng thử server khác.</p>
      </div>`;
  }

  /** Thử phát bằng HLS.js + Plyr. Trả về true nếu khởi tạo OK (không đảm bảo network luôn ổn). */
  async _playHls(src, wrap) {
    return new Promise((resolve) => {
      wrap.innerHTML = `<video id="player-video" class="player-video" playsinline controls></video>`;
      const video = document.getElementById("player-video");
      this.video = video;
      this.mode = "hls";

      const finishLoading = () => {
        document.getElementById("player-loading")?.remove();
      };

      const initPlyr = () => {
        if (window.Plyr) {
          this.plyr = new Plyr(video, {
            controls: [
              "play-large", "play", "progress", "current-time", "duration",
              "mute", "volume", "settings", "pip", "airplay", "fullscreen",
            ],
            settings: ["quality", "speed"],
          });
        }
      };

      video.addEventListener("loadedmetadata", () => {
        finishLoading();
        initPlyr();
        resolve(true);
      });

      video.addEventListener("ended", () => {
        if (this.onEndedCallback) this.onEndedCallback();
      });

      video.addEventListener("timeupdate", () => {
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(video.currentTime, video.duration);
        }
      });

      // Trường hợp lỗi mạng/nguồn ngay từ đầu
      const handleFatalError = () => {
        Utils.toast("Không tải được nguồn HLS, đang chuyển sang trình phát dự phòng...", "info");
        resolve(false);
      };

      if (window.Hls && Hls.isSupported()) {
        this.hls = new Hls({ maxBufferLength: 30 });
        this.hls.loadSource(src);
        this.hls.attachMedia(video);
        this.hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            this.hls.destroy();
            handleFatalError();
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari hỗ trợ HLS gốc
        video.src = src;
      } else {
        handleFatalError();
      }

      // Timeout an toàn nếu loadedmetadata không bao giờ bắn (link chết)
      setTimeout(() => {
        if (video.readyState === 0) handleFatalError();
      }, 9000);
    });
  }

  /** Fallback: nhúng iframe link_embed từ nguồn phim, sandbox hạn chế popup */
  _playIframe(src, wrap) {
    this.mode = "iframe";
    wrap.innerHTML = `
      <iframe
        id="player-iframe"
        src="${src}"
        allowfullscreen
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerpolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        loading="lazy"
      ></iframe>`;
    // Lưu ý: sandbox loại bỏ "allow-popups" và "allow-top-navigation" có chủ đích
    // để chặn phần lớn quảng cáo pop-up/redirect từ nguồn nhúng bên thứ ba.
    // Một số nguồn có thể không tự phát tiếp được do giới hạn này — đây là
    // đánh đổi có chủ đích giữa an toàn và trải nghiệm auto-next khi dùng iframe.
  }

  /** Đăng ký callback khi video kết thúc (chỉ hoạt động ở mode 'hls') */
  onEnded(cb) {
    this.onEndedCallback = cb;
  }

  onTimeUpdate(cb) {
    this.onTimeUpdateCallback = cb;
  }

  /** Dọn dẹp player hiện tại trước khi chuyển tập/server mới */
  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.plyr) {
      this.plyr.destroy();
      this.plyr = null;
    }
    this.video = null;
    this.mode = null;
  }
}

const playerService = new PlayerService();
