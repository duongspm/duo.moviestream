/**
 * ============================================================
 *  PAGE: FILTER / CATEGORY (filter.html)
 * ============================================================
 * Đọc query params từ URL: type, category, country, year, sort_field, page
 * Render lại UI + cập nhật URL mỗi khi người dùng đổi filter
 * (cho phép back/forward, share link kèm filter).
 * ============================================================
 */

const FilterPage = {
  state: {
    type: "phim-moi-cap-nhat", // type_list hoặc 'phim-moi-cap-nhat' đặc biệt
    category: "",
    country: "",
    year: "",
    sortField: "modified.time",
    page: 1,
  },
  categories: [],
  countries: [],

  async init() {
    Header.mount();
    Footer.mount();

    this._readStateFromUrl();
    await this._loadFilterOptions();
    this._renderFilterBar();
    this._bindFilterEvents();
    await this._loadList();
  },

  _readStateFromUrl() {
    const p = new URLSearchParams(window.location.search);
    this.state.type = p.get("type") || "phim-moi-cap-nhat";
    this.state.category = p.get("category") || "";
    this.state.country = p.get("country") || "";
    this.state.year = p.get("year") || "";
    this.state.sortField = p.get("sort_field") || "modified.time";
    this.state.page = Number(p.get("page")) || 1;
  },

  async _loadFilterOptions() {
    try {
      const [cats, countries] = await Promise.all([
        movieService.getCategories(),
        movieService.getCountries(),
      ]);
      this.categories = Array.isArray(cats) ? cats : [];
      this.countries = Array.isArray(countries) ? countries : [];
    } catch (_) {
      this.categories = [];
      this.countries = [];
    }
  },

  _renderFilterBar() {
    const titleMap = {
      "phim-moi-cap-nhat": "Phim Mới Cập Nhật",
      [CONFIG.API.TYPE_LIST.PHIM_LE]: "Phim Lẻ",
      [CONFIG.API.TYPE_LIST.PHIM_BO]: "Phim Bộ",
      [CONFIG.API.TYPE_LIST.HOAT_HINH]: "Hoạt Hình",
      [CONFIG.API.TYPE_LIST.TV_SHOWS]: "TV Shows",
      [CONFIG.API.TYPE_LIST.PHIM_CHIEU_RAP]: "Phim Chiếu Rạp",
    };
    document.getElementById("filter-title").textContent = titleMap[this.state.type] || "Danh Sách Phim";
    document.title = `${titleMap[this.state.type] || "Danh sách phim"} - ${CONFIG.SITE.NAME}`;

    const yearOptions = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => 2026 - i);

    const bar = document.getElementById("filter-bar");
    bar.innerHTML = `
      <div class="filter-select">
        <select id="f-type" aria-label="Loại phim">
          <option value="phim-moi-cap-nhat">Tất cả</option>
          <option value="${CONFIG.API.TYPE_LIST.PHIM_LE}">Phim Lẻ</option>
          <option value="${CONFIG.API.TYPE_LIST.PHIM_BO}">Phim Bộ</option>
          <option value="${CONFIG.API.TYPE_LIST.HOAT_HINH}">Hoạt Hình</option>
          <option value="${CONFIG.API.TYPE_LIST.TV_SHOWS}">TV Shows</option>
          <option value="${CONFIG.API.TYPE_LIST.PHIM_CHIEU_RAP}">Chiếu Rạp</option>
        </select>
      </div>
      <div class="filter-select">
        <select id="f-category" aria-label="Thể loại">
          <option value="">Thể loại</option>
          ${this.categories.map((c) => `<option value="${c.slug}">${Utils.escapeHtml(c.name)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-select">
        <select id="f-country" aria-label="Quốc gia">
          <option value="">Quốc gia</option>
          ${this.countries.map((c) => `<option value="${c.slug}">${Utils.escapeHtml(c.name)}</option>`).join("")}
        </select>
      </div>
      <div class="filter-select">
        <select id="f-year" aria-label="Năm phát hành">
          <option value="">Năm phát hành</option>
          ${yearOptions.map((y) => `<option value="${y}">${y}</option>`).join("")}
        </select>
      </div>
      <div class="filter-select">
        <select id="f-sort" aria-label="Sắp xếp">
          <option value="modified.time">Mới cập nhật</option>
          <option value="year">Năm phát hành</option>
          <option value="_id">Mới thêm (ID)</option>
        </select>
      </div>`;

    // Đặt giá trị hiện tại từ state
    bar.querySelector("#f-type").value = this.state.type;
    bar.querySelector("#f-category").value = this.state.category;
    bar.querySelector("#f-country").value = this.state.country;
    bar.querySelector("#f-year").value = this.state.year;
    bar.querySelector("#f-sort").value = this.state.sortField;
  },

  _bindFilterEvents() {
    const bar = document.getElementById("filter-bar");
    ["f-type", "f-category", "f-country", "f-year", "f-sort"].forEach((id) => {
      bar.querySelector(`#${id}`)?.addEventListener("change", () => {
        this.state.type = bar.querySelector("#f-type").value;
        this.state.category = bar.querySelector("#f-category").value;
        this.state.country = bar.querySelector("#f-country").value;
        this.state.year = bar.querySelector("#f-year").value;
        this.state.sortField = bar.querySelector("#f-sort").value;
        this.state.page = 1;
        this._syncUrl();
        this._loadList();
      });
    });
  },

  _syncUrl() {
    Utils.setQueryParams({
      type: this.state.type,
      category: this.state.category,
      country: this.state.country,
      year: this.state.year,
      sort_field: this.state.sortField,
      page: this.state.page > 1 ? this.state.page : "",
    });
  },

  async _loadList() {
    const grid = document.getElementById("filter-grid");
    const info = document.getElementById("filter-results-info");
    grid.innerHTML = Utils.skeletonCards(12);
    info.textContent = "Đang tải dữ liệu...";

    try {
      const filters = {
        category: this.state.category,
        country: this.state.country,
        year: this.state.year,
        sortField: this.state.sortField,
      };

      let result;
      if (this.state.type === "phim-moi-cap-nhat") {
        result = await movieService.getNewest(this.state.page);
      } else {
        result = await movieService.getListByType(this.state.type, filters, this.state.page);
      }

      const valid = result.items.filter(Boolean);
      grid.innerHTML = MovieCard.renderList(valid);
      Utils.initLazyImages(grid);

      if (result.pagination) {
        info.innerHTML = `Tìm thấy <b>${result.pagination.totalItems || valid.length}</b> kết quả`;
        this._renderPagination(result.pagination);
      } else {
        info.textContent = "";
        document.getElementById("filter-pagination").innerHTML = "";
      }

      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (err) {
      grid.innerHTML = Utils.errorBlock(err.message || "Không thể tải danh sách phim.", () => this._loadList());
      info.textContent = "";
    }
  },

  _renderPagination(pagination) {
    const { currentPage, totalPages } = pagination;
    const container = document.getElementById("filter-pagination");
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
    if (start > 1) html += btn("1", 1) + (start > 2 ? `<span class="page-ellipsis">…</span>` : "");
    pages.forEach((p) => (html += btn(p, p, { active: p === currentPage })));
    if (end < totalPages)
      html += (end < totalPages - 1 ? `<span class="page-ellipsis">…</span>` : "") + btn(totalPages, totalPages);
    html += btn("›", currentPage + 1, { disabled: currentPage >= totalPages });

    container.innerHTML = html;
    container.querySelectorAll(".page-btn[data-page]").forEach((b) => {
      b.addEventListener("click", () => {
        const page = Number(b.dataset.page);
        if (!page || page === currentPage) return;
        this.state.page = page;
        this._syncUrl();
        this._loadList();
      });
    });
  },
};

document.addEventListener("DOMContentLoaded", () => FilterPage.init());
