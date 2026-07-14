/**
 * ============================================================
 *  PAGE: DETAIL (detail.html)
 * ============================================================
 */

const DetailPage = {
  movie: null,
  activeServerIndex: 0,

  async init() {
    Header.mount();
    Footer.mount();

    const slug = Utils.getQueryParam("slug");
    if (!slug) {
      this._renderNotFound("Thiếu thông tin phim. Vui lòng quay lại trang chủ.");
      return;
    }

    try {
      this.movie = await movieService.getDetail(slug);
      this._renderSEO();
      this._renderContent();
      this._renderEpisodes();
      this._renderRelated(); // không await - tải nền, không chặn phần nội dung chính
    } catch (err) {
      this._renderNotFound(err.message || "Không thể tải thông tin phim.");
    }
    var swiper = new Swiper('.mySwiper', {
      effect: 'cards',
      grabCursor: true,
    });
  },

  _renderSEO() {
    const m = this.movie;
    const pageTitle = `${m.name} (${m.year || ""}) - Xem Phim Vietsub Online - ${CONFIG.SITE.NAME}`;
    const pageDesc = (m.content || `Xem phim ${m.name} - ${m.originName || ""} vietsub, thuyết minh chất lượng cao.`).slice(0, 160);
    const ogImage = m.posterUrl || m.thumbUrl;

    document.title = pageTitle;

    const setMeta = (id, attr, value) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute(attr, value);
    };

    setMeta("og-title", "content", pageTitle);
    setMeta("og-description", "content", pageDesc);
    setMeta("og-image", "content", ogImage);
    setMeta("twitter-title", "content", pageTitle);
    setMeta("twitter-image", "content", ogImage);

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", pageDesc);
  },

  _renderContent() {
    const m = this.movie;
    const root = document.getElementById("detail-root");
    const rating = Utils.getRating(m);

    const statusMap = {
      ongoing: { label: "Đang chiếu", cls: "status-ongoing" },
      completed: { label: "Hoàn Tất", cls: "status-completed" },
      trailer: { label: "Trailer", cls: "" },
    };
    const status = statusMap[m.status] || null;

    root.innerHTML = `
      <div class="detail-banner" style="background-image:url('${m.thumbUrl || m.posterUrl}')"></div>

      <div class="detail-main">
        <div class="detail-poster">
          <div class="swiper mySwiper">
            <div class="swiper-wrapper">
              <div class="swiper-slide">
                <a href="${m.posterUrl || m.thumbUrl}" data-caption="${Utils.escapeHtml(m.name)}" data-fancybox="gallery">
                  <img src="${m.posterUrl || m.thumbUrl}" alt="${Utils.escapeHtml(m.name)}" />              
                </a>
              </div>
              <div class="swiper-slide">
                <a href="${m.thumbUrl || m.posterUrl}" data-caption="${Utils.escapeHtml(m.name)}" data-fancybox="gallery">
                  <img src="${m.thumbUrl || m.posterUrl}" alt="${Utils.escapeHtml(m.name)}" />              
                </a>
              </div>
            </div>
            <p>(click vào để xem chi tiết nhé)</p>
          </div>
          
        </div>

        <div class="detail-info">
          <h1 class="detail-title">${Utils.escapeHtml(m.name)}</h1>
          <p class="detail-origin-title">${Utils.escapeHtml(m.originName || "")}</p>

          <div class="detail-tags">
            <span class="detail-tag">${Utils.typeLabel(m.type)}</span>
            ${status ? `<span class="detail-tag ${status.cls}">${status.label}</span>` : ""}
            ${m.quality ? `<span class="detail-tag">${Utils.escapeHtml(m.quality)}</span>` : ""}
            ${m.lang ? `<span class="detail-tag">${Utils.escapeHtml(m.lang)}</span>` : ""}
            ${(m.category || []).map((c) => `<span class="detail-tag">${Utils.escapeHtml(c.name)}</span>`).join("")}
          </div>

          <div class="detail-stats">
            ${rating ? `<span class="stat-rating">★ ${rating}</span><span class="dot">•</span>` : ""}
            <span>${m.year || "Đang cập nhật"}</span>
            <span class="dot">•</span>
            <span>${Utils.formatTime(m.time)}</span>
            <span class="dot">•</span>
            <span>${Utils.escapeHtml(m.episodeCurrent || "")}</span>
          </div>

          <p class="detail-desc">${Utils.escapeHtml(stripHtml(m.content) || "Nội dung đang được cập nhật.")}</p>

          <div class="detail-credit">
            <div><b>Quốc gia</b><span>${(m.country || []).map((c) => c.name).join(", ") || "Đang cập nhật"}</span></div>
            <div><b>Đạo diễn</b><span>${(m.director || []).filter((d) => d && d !== "Đang cập nhật").join(", ") || "Đang cập nhật"}</span></div>
            <div><b>Diễn viên</b><span>${(m.actor || []).filter((a) => a && a !== "Đang cập nhật").slice(0, 6).join(", ") || "Đang cập nhật"}</span></div>
          </div>

          <div class="detail-actions">
            <a href="watch.html?slug=${encodeURIComponent(m.slug)}" class="btn btn-primary btn-watch">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Xem Ngay
            </a>
            <button class="btn btn-outline" id="favorite-btn" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="favorite-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span id="favorite-label">Yêu Thích</span>
            </button>
            <button class="btn btn-outline" id="share-btn" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Chia Sẻ
            </button>
            ${m.imdb?.id ? `<a href="https://www.imdb.com/title/${m.imdb.id}" target="_blank" rel="noopener" class="btn btn-outline">Xem trên IMDB</a>` : ""}
          </div>
        </div>
      </div>`;

    this._bindActionButtons();
    
    function stripHtml(htmlString) {
      if (!htmlString || typeof htmlString !== 'string') {
        return '';
      }

      let cleanText = htmlString;

      // Bước 1: Loại bỏ triệt để các thẻ <script>, <style> và NỘI DUNG bên trong chúng
      cleanText = cleanText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
      cleanText = cleanText.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');

      // Bước 2: Loại bỏ toàn bộ các thẻ HTML còn lại
      // Regex này xử lý được cả các thẻ có thuộc tính phức tạp chứa dấu ngoặc kép hoặc xuống dòng
      cleanText = cleanText.replace(/<[^>]*>/g, '');

      // Bước 3: Giải mã các ký tự HTML Entities phổ biến về dạng ký tự thường
      const htmlEntities = {
        '&nbsp;': ' ',
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&quot;': '"',
        '&#39;': "'",
        '&cent;': '¢',
        '&pound;': '£',
        '&yen;': '¥',
        '&euro;': '€',
        '&copy;': '©',
        '&reg;': '®'
      };

      // Thay thế các entities tìm thấy bằng ký tự thực tế
      cleanText = cleanText.replace(/&[a-z0-9#]+;/gi, (match) => {
        return htmlEntities[match.toLowerCase()] || match;
      });

      // Bước 4: Dọn dẹp khoảng trắng thừa và xuống dòng liên tục cho đẹp mắt
      return cleanText
        .replace(/\s+/g, ' ') // Gộp nhiều khoảng trắng/xuống dòng liên tiếp thành 1 khoảng trắng
        .trim();             // Cắt khoảng trắng thừa ở 2 đầu
    }
  },

  _bindActionButtons() {
    const m = this.movie;
    const favBtn = document.getElementById("favorite-btn");
    const favIcon = document.getElementById("favorite-icon");
    const favLabel = document.getElementById("favorite-label");

    const syncFavUI = () => {
      const isFav = storageService.isFavorite(m.slug);
      favBtn.classList.toggle("is-favorite", isFav);
      favIcon.setAttribute("fill", isFav ? "currentColor" : "none");
      favLabel.textContent = isFav ? "Đã Yêu Thích" : "Yêu Thích";
    };
    syncFavUI();

    favBtn.addEventListener("click", () => {
      storageService.toggleFavorite({
        slug: m.slug,
        name: m.name,
        originName: m.originName,
        thumbUrl: m.thumbUrl,
        year: m.year,
        type: m.type,
      });
      syncFavUI();
      Utils.toast(
        storageService.isFavorite(m.slug) ? "Đã thêm vào Yêu thích" : "Đã xoá khỏi Yêu thích",
        "success"
      );
    });

    document.getElementById("share-btn").addEventListener("click", async () => {
      const shareData = {
        title: m.name,
        text: `Xem phim ${m.name} (${m.originName || ""}) trên ${CONFIG.SITE.NAME}`,
        url: window.location.href,
      };
      // Web Share API: chỉ hoạt động trên HTTPS + trình duyệt hỗ trợ (đa số
      // mobile browser hiện đại); desktop Chrome/Firefox phần lớn KHÔNG hỗ
      // trợ nên sẽ rơi xuống fallback copy link - đây là hành vi mong đợi,
      // không phải lỗi.
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (_) {
          /* người dùng tự hủy share, không cần xử lý gì thêm */
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          Utils.toast("Đã sao chép link phim vào clipboard!", "success");
        } catch (_) {
          Utils.toast("Không thể sao chép link. Vui lòng copy thủ công.", "info");
        }
      }
    });
  },

  _renderEpisodes() {
    const m = this.movie;
    const section = document.getElementById("episode-section");
    if (!m.servers || !m.servers.length || !m.servers.some((s) => s.items.length)) {
      section.innerHTML = "";
      return;
    }

    section.innerHTML = `
      <div class="container">
        <div class="section-head"><h2 class="section-title">Danh Sách Tập</h2></div>
        <div class="server-tabs" id="detail-server-tabs">
          ${m.servers
            .map(
              (s, i) => `<button class="server-tab ${i === 0 ? "active" : ""}" data-index="${i}">${Utils.escapeHtml(s.serverName)}</button>`
            )
            .join("")}
        </div>
        <div class="episode-grid" id="detail-episode-grid"></div>
      </div>`;

    this._renderEpisodeGrid(0);

    section.querySelectorAll(".server-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        section.querySelectorAll(".server-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this._renderEpisodeGrid(Number(tab.dataset.index));
      });
    });
  },

  _renderEpisodeGrid(serverIndex) {
    const m = this.movie;
    const grid = document.getElementById("detail-episode-grid");
    const items = m.servers[serverIndex]?.items || [];
    if (!items.length) {
      grid.innerHTML = `<p style="color:var(--text-tertiary)">Server này chưa có tập phim.</p>`;
      return;
    }
    grid.innerHTML = items
      .map(
        (ep) => `
        <a class="episode-item" href="watch.html?slug=${encodeURIComponent(m.slug)}&server=${serverIndex}&ep=${encodeURIComponent(ep.slug)}">
          ${Utils.escapeHtml(ep.name)}
        </a>`
      )
      .join("");
  },

  async _renderRelated() {
    const section = document.getElementById("related-section");
    if (!section) return;

    try {
      const related = await movieService.getRelated(this.movie);
      if (!related.length) {
        section.innerHTML = "";
        return;
      }
      section.innerHTML = `
        <div class="container">
          <div class="section-head"><h2 class="section-title">Có Thể Bạn Quan Tâm</h2></div>
          <div class="movie-grid">${MovieCard.renderList(related)}</div>
        </div>`;
      Utils.initLazyImages(section);
    } catch (_) {
      // Phim liên quan chỉ là gợi ý phụ - lỗi ở đây không nên làm hỏng
      // trải nghiệm xem trang chi tiết, nên im lặng bỏ qua, không hiện lỗi.
      section.innerHTML = "";
    }
  },

  _renderNotFound(message) {
    const root = document.getElementById("detail-root");
    root.innerHTML = `<div class="container" style="padding-top: 140px;">${Utils.errorBlock(message)}</div>`;
  },
};

document.addEventListener("DOMContentLoaded", () => DetailPage.init());
