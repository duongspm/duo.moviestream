/**
 * ============================================================
 *  PAGE: SEARCH (search.html)
 * ============================================================
 */

const SearchPage = {
  state: {
    keyword: "",
    page: 1,
  },

  async init() {
    Header.mount();
    Footer.mount();

    this.state.keyword = Utils.getQueryParam("keyword") || "";
    this.state.page = Number(Utils.getQueryParam("page")) || 1;

    const input = document.getElementById("search-page-input");
    input.value = this.state.keyword;

    document.getElementById("search-page-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const kw = input.value.trim();
      if (!kw) return;
      this.state.keyword = kw;
      this.state.page = 1;
      Utils.setQueryParams({ keyword: kw, page: "" });
      this._search();
    });

    if (this.state.keyword) {
      this._search();
    } else {
      document.getElementById("search-grid").innerHTML = `
        <div class="empty-block">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path>
          </svg>
          <p>Nhập từ khóa để tìm phim bạn muốn xem.</p>
        </div>`;
    }
  },

  async _search() {
    const grid = document.getElementById("search-grid");
    const heading = document.getElementById("search-heading");
    heading.textContent = `Kết quả tìm kiếm cho "${this.state.keyword}"`;
    document.title = `Tìm kiếm: ${this.state.keyword} - ${CONFIG.SITE.NAME}`;
    grid.innerHTML = Utils.skeletonCards(12);

    try {
      const result = await movieService.search(this.state.keyword, {}, this.state.page);
      const valid = result.items.filter(Boolean);
      grid.innerHTML = MovieCard.renderList(valid);
      Utils.initLazyImages(grid);

      const info = document.getElementById("search-info");
      if (result.pagination) {
        info.innerHTML = `Tìm thấy <b>${result.pagination.totalItems || valid.length}</b> phim phù hợp`;
        this._renderPagination(result.pagination);
      } else {
        info.textContent = valid.length ? `Tìm thấy ${valid.length} phim phù hợp` : "";
      }
    } catch (err) {
      grid.innerHTML = Utils.errorBlock(err.message || "Lỗi khi tìm kiếm.", () => this._search());
    }
  },

  _renderPagination(pagination) {
    const { currentPage, totalPages } = pagination;
    const container = document.getElementById("search-pagination");
    if (!totalPages || totalPages <= 1) {
      container.innerHTML = "";
      return;
    }
    const maxShown = 5;
    let pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxShown / 2));
    let end = Math.min(totalPages, start + maxShown - 1);
    start = Math.max(1, end - maxShown + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    const btn = (label, page, opts = {}) => `
      <button class="page-btn ${opts.active ? "active" : ""}" ${opts.disabled ? "disabled" : ""} data-page="${page}">
        ${label}
      </button>`;

    let html = "";
    html += btn("‹", currentPage - 1, { disabled: currentPage <= 1 });
    pages.forEach((p) => (html += btn(p, p, { active: p === currentPage })));
    html += btn("›", currentPage + 1, { disabled: currentPage >= totalPages });

    container.innerHTML = html;
    container.querySelectorAll(".page-btn[data-page]").forEach((b) => {
      b.addEventListener("click", () => {
        const page = Number(b.dataset.page);
        if (!page || page === currentPage) return;
        this.state.page = page;
        Utils.setQueryParams({ page });
        this._search();
        window.scrollTo({ top: 0, behavior: "instant" });
      });
    });
  },
};

document.addEventListener("DOMContentLoaded", () => SearchPage.init());
