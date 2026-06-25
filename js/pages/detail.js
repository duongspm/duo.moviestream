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
    ScrollToTop.mount();

    const slug = Utils.getQueryParam("slug");
    if (!slug) {
      this._renderNotFound(
        "Thiếu thông tin phim. Vui lòng quay lại trang chủ.",
      );
      return;
    }

    try {
      this.movie = await movieService.getDetail(slug);
      this._renderSEO();
      this._renderContent();
      this._renderEpisodes();
    } catch (err) {
      this._renderNotFound(err.message || "Không thể tải thông tin phim.");
    }
  },

  _renderSEO() {
    const m = this.movie;
    const pageTitle = `${m.name} (${m.year || ""}) - Xem Phim Vietsub Online - ${CONFIG.SITE.NAME}`;
    const pageDesc = (
      m.content ||
      `Xem phim ${m.name} - ${m.originName || ""} vietsub, thuyết minh chất lượng cao.`
    ).slice(0, 160);
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
      <div class="detail-banner" style="background-image:url('${m.posterUrl || m.thumbUrl}')"></div>

      <div class="detail-main">
        <div class="detail-poster">
          <img src="${m.thumbUrl || m.posterUrl}" alt="${Utils.escapeHtml(m.name)}" />
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

          <p class="detail-desc">${Utils.escapeHtml(m.content || "Nội dung đang được cập nhật.")}</p>

          <div class="detail-credit">
            <div><b>Quốc gia</b><span>${(m.country || []).map((c) => c.name).join(", ") || "Đang cập nhật"}</span></div>
            <div><b>Đạo diễn</b><span>${(m.director || []).filter((d) => d && d !== "Đang cập nhật").join(", ") || "Đang cập nhật"}</span></div>
            <div><b>Diễn viên</b><span>${
              (m.actor || [])
                .filter((a) => a && a !== "Đang cập nhật")
                .slice(0, 6)
                .join(", ") || "Đang cập nhật"
            }</span></div>
          </div>

          <div class="detail-actions">
            <a href="watch.html?slug=${encodeURIComponent(m.slug)}" class="btn btn-primary btn-watch">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Xem Ngay
            </a>
            ${m.imdb?.id ? `<a href="https://www.imdb.com/title/${m.imdb.id}" target="_blank" rel="noopener" class="btn btn-outline">Xem trên IMDB</a>` : ""}
          </div>
        </div>
      </div>`;
  },

  _renderEpisodes() {
    const m = this.movie;
    const section = document.getElementById("episode-section");
    if (
      !m.servers ||
      !m.servers.length ||
      !m.servers.some((s) => s.items.length)
    ) {
      section.innerHTML = "";
      return;
    }

    section.innerHTML = `
      <div class="container">
        <div class="section-head"><h2 class="section-title">Danh Sách Tập</h2></div>
        <div class="server-tabs" id="detail-server-tabs">
          ${m.servers
            .map(
              (s, i) =>
                `<button class="server-tab ${i === 0 ? "active" : ""}" data-index="${i}">${Utils.escapeHtml(s.serverName)}</button>`,
            )
            .join("")}
        </div>
        <div class="episode-grid" id="detail-episode-grid"></div>
      </div>`;

    this._renderEpisodeGrid(0);

    section.querySelectorAll(".server-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        section
          .querySelectorAll(".server-tab")
          .forEach((t) => t.classList.remove("active"));
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
        </a>`,
      )
      .join("");
  },

  _renderNotFound(message) {
    const root = document.getElementById("detail-root");
    root.innerHTML = `<div class="container" style="padding-top: 140px;">${Utils.errorBlock(message)}</div>`;
  },
};

document.addEventListener("DOMContentLoaded", () => DetailPage.init());
