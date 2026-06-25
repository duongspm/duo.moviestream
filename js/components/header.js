/**
 * ============================================================
 *  COMPONENT: HEADER (dùng chung mọi trang)
 * ============================================================
 * Render thanh điều hướng + search bar có gợi ý realtime.
 * ============================================================
 */

const Header = {
  mount(containerId = "site-header") {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = `
      <header class="header" id="header">
        <div class="header-inner">
          <a href="index.html" class="logo">
            <img src="assets/logo.svg" alt="" class="logo-icon" width="32" height="32" />
            <span class="logo-main">${CONFIG.SITE.LOGO_TEXT}</span><span class="logo-accent">${CONFIG.SITE.LOGO_ACCENT}</span>
          </a>

          <nav class="nav-desktop">
            <a href="index.html" data-nav="home">Trang Chủ</a>
            <a href="filter.html?type=phim-le" data-nav="single">Phim Lẻ</a>
            <a href="filter.html?type=phim-bo" data-nav="series">Phim Bộ</a>
            <a href="filter.html?type=hoat-hinh" data-nav="anime">Hoạt Hình</a>
            <a href="filter.html?type=tv-shows" data-nav="tvshows">TV Shows</a>
            <a href="filter.html?type=phim-chieu-rap" data-nav="cinema">Chiếu Rạp</a>
          </nav>

          <div class="header-actions">
            <div class="search-box" id="search-box">
              <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path>
              </svg>
              <input type="text" id="search-input" placeholder="Tìm kiếm phim, diễn viên..." autocomplete="off" />
              <button class="search-clear" id="search-clear" aria-label="Xóa" hidden>&times;</button>
              <div class="search-suggest" id="search-suggest" hidden></div>
            </div>

            <button class="menu-toggle" id="menu-toggle" aria-label="Menu">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <nav class="nav-mobile" id="nav-mobile">
          <a href="index.html">Trang Chủ</a>
          <a href="filter.html?type=phim-le">Phim Lẻ</a>
          <a href="filter.html?type=phim-bo">Phim Bộ</a>
          <a href="filter.html?type=hoat-hinh">Hoạt Hình</a>
          <a href="filter.html?type=tv-shows">TV Shows</a>
          <a href="filter.html?type=phim-chieu-rap">Chiếu Rạp</a>
        </nav>
      </header>`;

    this._bindEvents();
    this._highlightActiveNav();
  },

  _bindEvents() {
    // Menu mobile toggle
    const menuToggle = document.getElementById("menu-toggle");
    const navMobile = document.getElementById("nav-mobile");
    menuToggle?.addEventListener("click", () => {
      navMobile.classList.toggle("open");
      menuToggle.classList.toggle("active");
    });

    // Header shrink khi scroll
    window.addEventListener(
      "scroll",
      Utils.throttle(() => {
        const header = document.getElementById("header");
        if (window.scrollY > 40) header.classList.add("scrolled");
        else header.classList.remove("scrolled");
      }, 100)
    );

    // Search realtime
    const input = document.getElementById("search-input");
    const clearBtn = document.getElementById("search-clear");
    const suggestBox = document.getElementById("search-suggest");

    const doSearch = Utils.debounce(async (keyword) => {
      if (!keyword.trim()) {
        suggestBox.hidden = true;
        return;
      }
      suggestBox.innerHTML = `<div class="suggest-loading">Đang tìm kiếm...</div>`;
      suggestBox.hidden = false;
      try {
        const { items } = await movieService.search(keyword, { limit: 6 });
        if (!items.length) {
          suggestBox.innerHTML = `<div class="suggest-empty">Không tìm thấy kết quả phù hợp</div>`;
          return;
        }
        suggestBox.innerHTML = items
          .map(
            (m) => `
            <a href="detail.html?slug=${encodeURIComponent(m.slug)}" class="suggest-item">
              <img src="${m.thumbUrl}" alt="${Utils.escapeHtml(m.name)}" loading="lazy" />
              <div>
                <p class="suggest-title">${Utils.escapeHtml(m.name)}</p>
                <p class="suggest-sub">${m.year || ""} • ${Utils.typeLabel(m.type)}</p>
              </div>
            </a>`
          )
          .join("") +
          `<a href="search.html?keyword=${encodeURIComponent(keyword)}" class="suggest-viewall">
             Xem tất cả kết quả cho "${Utils.escapeHtml(keyword)}"
           </a>`;
      } catch (err) {
        suggestBox.innerHTML = `<div class="suggest-empty">Lỗi tải dữ liệu, vui lòng thử lại.</div>`;
      }
    }, 400);

    input?.addEventListener("input", (e) => {
      const val = e.target.value;
      clearBtn.hidden = !val;
      doSearch(val);
    });

    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        window.location.href = `search.html?keyword=${encodeURIComponent(input.value.trim())}`;
      }
    });

    clearBtn?.addEventListener("click", () => {
      input.value = "";
      clearBtn.hidden = true;
      suggestBox.hidden = true;
      input.focus();
    });

    document.addEventListener("click", (e) => {
      if (!document.getElementById("search-box").contains(e.target)) {
        suggestBox.hidden = true;
      }
    });
  },

  _highlightActiveNav() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const map = {
      "phim-le": "single",
      "phim-bo": "series",
      "hoat-hinh": "anime",
      "tv-shows": "tvshows",
      "phim-chieu-rap": "cinema",
    };
    const navKey = window.location.pathname.includes("index") || window.location.pathname === "/" ? "home" : map[type];
    if (navKey) {
      document.querySelector(`[data-nav="${navKey}"]`)?.classList.add("active");
    }
  },
};
