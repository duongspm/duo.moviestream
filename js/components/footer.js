/**
 * ============================================================
 *  COMPONENT: FOOTER (dùng chung mọi trang)
 * ============================================================
 */

const Footer = {
  mount(containerId = "site-footer") {
    const el = document.getElementById(containerId);
    if (!el) return;
    const year = new Date().getFullYear();

    el.innerHTML = `
      <footer class="footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <a href="index.html" class="logo">
              <img src="assets/logo.svg" alt="" class="logo-icon" width="32" height="32" />
              <span class="logo-main">${CONFIG.SITE.LOGO_TEXT}</span><span class="logo-accent">${CONFIG.SITE.LOGO_ACCENT}</span>
            </a>
            <p class="footer-desc">${CONFIG.SITE.DESCRIPTION}</p>
          </div>

          <div class="footer-col">
            <h4>Danh Mục</h4>
            <a href="filter.html?type=phim-le">Phim Lẻ</a>
            <a href="filter.html?type=phim-bo">Phim Bộ</a>
            <a href="filter.html?type=hoat-hinh">Hoạt Hình</a>
            <a href="filter.html?type=tv-shows">TV Shows</a>
          </div>

          <div class="footer-col">
            <h4>Thông Tin</h4>
            <span>Phim được tổng hợp từ các nguồn API công khai trên Internet.</span>
            <span>Website không lưu trữ bất kỳ video nào trên server.</span>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© ${year} ${CONFIG.SITE.LOGO_TEXT}${CONFIG.SITE.LOGO_ACCENT}. Dữ liệu phim chỉ mang tính chất tổng hợp, không thuộc quyền sở hữu của website.</p>
        </div>
      </footer>`;
  },
};
