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
   * @param {{ resumeAt?: number }} options - resumeAt: giây cần seek tới sau
   *   khi video sẵn sàng (chỉ áp dụng được ở mode 'hls' — xem ghi chú ở
   *   _playIframe() để biết lý do mode iframe không hỗ trợ được tính năng này).
   */
  async play(episode, wrapId = "player-wrap", options = {}) {
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
      const success = await this._playHls(episode.linkM3u8, wrap, options.resumeAt || 0);
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
  async _playHls(src, wrap, resumeAt = 0) {
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
        if (resumeAt > 0 && resumeAt < video.duration - 5) {
          video.currentTime = resumeAt;
        }
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
      //========= bắt đầu code cũ =========
      // if (window.Hls && Hls.isSupported()) {
      //   this.hls = new Hls({ maxBufferLength: 30 });
      //   this.hls.loadSource(src);
      //   this.hls.attachMedia(video);
      //   this.hls.on(Hls.Events.ERROR, (_, data) => {
      //     if (data.fatal) {
      //       this.hls.destroy();
      //       handleFatalError();
      //     }
      //   });
      // } 
      //========= hết code cũ =========
      //========= code cũ 14/07 =========
      if (window.Hls && Hls.isSupported()) {
        this.hls = new Hls({
          // ---------- Buffer: tăng lên để tích trữ sẵn nhiều segment hơn,
          // giảm hiện tượng "xem 10 giây rồi đứng lại chờ load" ----------
          maxBufferLength: 90,          // giây video tích sẵn trong buffer (mặc định 30)
          maxMaxBufferLength: 180,      // trần tối đa buffer cho phép (mặc định 600, nhưng để 120 tránh ngốn RAM)
          maxBufferSize: 100 * 1024 * 1024, // 80MB RAM tối đa cho buffer (mặc định 60MB)
          maxBufferHole: 0.5,           // khoảng trống tối đa giữa 2 segment được coi là "ok" (giây)

          // ---------- Retry: tự thử lại khi segment bị lỗi/timeout,
          // thay vì báo lỗi ngay lập tức ----------
          manifestLoadingMaxRetry: 4,        // thử lại playlist m3u8 tối đa 4 lần
          manifestLoadingRetryDelay: 1500,   // chờ 1 giây giữa mỗi lần retry
          levelLoadingMaxRetry: 4,           // thử lại level (chất lượng) tối đa 4 lần
          levelLoadingRetryDelay: 1000,
          fragLoadingMaxRetry: 8,            // thử lại từng segment video tối đa 6 lần
          fragLoadingRetryDelay: 600,        // chờ 0.5 giây (ngắn hơn vì segment nhỏ)
          fragLoadingMaxRetryTimeout: 6000,  // timeout tối đa mỗi lần retry segment

          // ---------- Timeout: phát hiện CDN chậm sớm hơn để retry ----------
          fragLoadingTimeOut: 20000,         // timeout 20 giây cho mỗi segment (mặc định 20000, giữ nguyên)
          manifestLoadingTimeOut: 15000,     // timeout 15 giây cho playlist

          // ---------- Âm thanh: ưu tiên giữ audio sync khi buffer bị gián đoạn ----------
          enableSoftwareAES: true,  // giải mã AES bằng JS thay vì hardware, ổn định hơn
                                    // trên các CDN mã hoá stream (tránh méo tiếng khi
                                    // hardware decryptor bị desynced)

          // ---------- Chất lượng: bắt đầu ở chất lượng thấp rồi tự nâng lên,
          // thay vì bắt đầu cao nhất rồi tụt xuống gây giật ----------
          startLevel: -1,           // -1 = HLS.js tự chọn level phù hợp bandwidth hiện tại
          abrEwmaDefaultEstimate: 300000, // ước tính bandwidth ban đầu: 500kbps (an toàn)
          abrBandWidthFactor: 0.8,        // chỉ dùng 80% bandwidth đo được để chọn quality
                                          // → buffer an toàn hơn, ít bị thiếu segment hơn
          // Giới hạn độ "nhảy" quality để tránh player liên tục đổi quality
          // (mỗi lần đổi quality = có thể gây glitch audio ngắn)
          abrBandWidthUpFactor: 0.5,
        });

        this.hls.loadSource(src);
        this.hls.attachMedia(video);

        this.hls.on(Hls.Events.ERROR, (_, data) => {
          console.warn("HLS error:", data.type, data.details, "fatal:", data.fatal);

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Lỗi mạng (CDN chậm, timeout) → thử recover thay vì destroy ngay
                console.warn("HLS network error, thử recover...");
                this.hls.startLoad();
                // Nếu recover thất bại liên tục (HLS.js sẽ gọi lại ERROR với fatal)
                // thì mới fallback sang iframe ở lần gọi tiếp theo
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                // Lỗi giải mã media (méo tiếng, video giật) → recoverMediaError
                // tự reset bộ giải mã, thường giải quyết được méo audio
                console.warn("HLS media error, thử recoverMediaError...");
                this.hls.recoverMediaError();
                break;

              default:
                // Lỗi không recover được → fallback iframe
                this.hls.destroy();
                handleFatalError();
                break;
            }
          }
        });

        // Hiện toast khi buffer thấp (sắp bị đứng hình) để người dùng biết
        // là đang load thêm chứ không phải trình phát bị treo
        this.hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal && data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
            Utils.toast("Đang tải thêm dữ liệu, vui lòng chờ xíu nhé...", "info", 2000);
          }
        });
        
        // Đếm số lần media error liên tiếp để quyết định recover hay fallback
        let mediaErrorCount = 0;
        let lastErrorTime = 0;

        this.hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              // Lỗi mạng: thử startLoad lại trước
              console.warn("[HLS] Network error, thử startLoad lại...");
              this.hls.startLoad();

            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              const now = Date.now();
              // Nếu lỗi media xảy ra liên tục trong 10 giây → fallback hẳn
              if (now - lastErrorTime < 10000) {
                mediaErrorCount++;
              } else {
                mediaErrorCount = 1;
              }
              lastErrorTime = now;

              if (mediaErrorCount <= 3) {
                // Lần 1-3: recoverMediaError — reset bộ giải mã audio/video
                // đây là cách xử lý chính cho triệu chứng méo tiếng theo đoạn
                console.warn(`[HLS] Media error lần ${mediaErrorCount}, recoverMediaError...`);
                this.hls.recoverMediaError();
              } else {
                // Lần 4+: recover không hiệu quả → fallback iframe
                console.warn("[HLS] Media error quá nhiều, fallback sang iframe...");
                this.hls.destroy();
                handleFatalError();
              }
            } else {
              this.hls.destroy();
              handleFatalError();
            }
          } else {
            // Lỗi không fatal: chỉ log, không cần làm gì
            // (HLS.js tự retry segment lỗi theo config fragLoadingMaxRetry)
            if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
              Utils.toast("Đang tải thêm dữ liệu...", "info", 1500);
            }
          }
        });
      }
      //========= hết code cũ 14/07 =========
      
      else if (video.canPlayType("application/vnd.apple.mpegurl")) {
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

  /**
   * Fallback: nhúng iframe link_embed từ nguồn phim, sandbox hạn chế popup.
   *
   * GIỚI HẠN QUAN TRỌNG (minh bạch với người dùng code): vì iframe trỏ tới
   * domain khác (cross-origin), JavaScript của site KHÔNG thể đọc được
   * currentTime/duration hay bắt event "ended" từ bên trong iframe đó.
   * Hệ quả: tính năng "Tiếp tục xem" (resume) và "Auto-next tập" CHỈ hoạt
   * động khi player đang ở mode HLS (tự render bằng Plyr) — khi rơi về
   * mode iframe, 2 tính năng này tự động không khả dụng cho tập đó, KHÔNG
   * có cách nào khắc phục từ phía client mà không có sự hợp tác của nguồn
   * nhúng (ví dụ qua postMessage, mà các nguồn phim free thường không hỗ trợ).
   */
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
