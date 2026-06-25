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
            <h4>Thông Tin Hệ Điều Hành Bằng Cơm</h4>
            <span>- Phim được tổng hợp từ các nguồn API công khai trên Internet.</span>
            <span>- Chủ thớt quá mệt mỏi với đống quảng cáo   nên tự tay code chiếc web này để healing tâm hồn.</span>
            <span>- Website không lưu trữ bất kỳ video nào trên server.</span>
            <span>- Website hoạt động theo cơ chế 'nhặt nhạnh' API công khai, không lưu trữ video, không làm giàu từ data của bạn. Xem phim vui vẻ, không quạu!</span>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© ${year} ${CONFIG.SITE.LOGO_TEXT}${CONFIG.SITE.LOGO_ACCENT}. Dữ liệu phim chỉ mang tính chất tổng hợp, không thuộc quyền sở hữu của website.</p>
          <div id="analytics-counter" class="analytics-counter">
            <span class="counter-loading">Đang kết nối dữ liệu traffic...</span>
          </div>
        </div>
      </footer>`;
      // 2. Gọi hàm kích hoạt đếm lượt truy cập thực tế
    this.initTrafficCounter();
  },
  async initTrafficCounter() {
    // Đặt namespace duy nhất theo tên miền của bạn để không bị trùng lặp dữ liệu trên hệ thống
    const namespace = "duo_moviestream_vercel_app"; 
    
    const now = new Date();
    const todayKey = `day-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const monthKey = `month-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const totalKey = "total-all-time";

    try {
      // Gọi đồng thời 3 API tăng số lượt đếm (Hỗ trợ HTTPS an toàn trên Vercel)
      const [resToday, resMonth, resTotal] = await Promise.all([
        fetch(`https://api.countapi.xyz/hit/${namespace}/${todayKey}`).then(r => r.json()).catch(() => ({ value: 1 })),
        fetch(`https://api.countapi.xyz/hit/${namespace}/${monthKey}`).then(r => r.json()).catch(() => ({ value: 1 })),
        fetch(`https://api.countapi.xyz/hit/${namespace}/${totalKey}`).then(r => r.json()).catch(() => ({ value: 1 }))
      ]);

      const container = document.getElementById('analytics-counter');
      if (container) {
        container.innerHTML = `
          <div class="counter-item">📅 Hôm nay: <span>${resToday.value || 1}</span></div>
          <div class="counter-item">🗓️ Tháng này: <span>${resMonth.value || 1}</span></div>
          <div class="counter-item">🔥 Tổng lượt xem: <span>${resTotal.value || 1}</span></div>
        `;
      }
    } catch (err) {
      console.warn("CountAPI tạm thời gián đoạn:", err);
    }
  }
  
};
