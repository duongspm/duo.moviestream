/**
 * ============================================================
 *  UTILITIES — các hàm tiện ích dùng chung toàn app
 * ============================================================
 */

const Utils = {
  /** Debounce - dùng cho ô tìm kiếm tránh gọi API liên tục */
  debounce(fn, delay = 400) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /** Lấy query param từ URL hiện tại, ví dụ ?slug=abc */
  getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  /** Set nhiều query param cùng lúc (không reload trang) */
  setQueryParams(obj) {
    const params = new URLSearchParams(window.location.search);
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") params.delete(k);
      else params.set(k, v);
    });
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  },

  /** Format thời gian/thời lượng phim, ví dụ "120 phút" -> giữ nguyên nếu đã có chữ */
  formatTime(time) {
    if (!time) return "Đang cập nhật";
    return time;
  },

  /** Format số lượt xem dạng 1.2K, 3.4M */
  formatViews(num) {
    if (!num) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return String(num);
  },

  /** Lấy điểm IMDB/TMDB an toàn, trả về null nếu không có */
  getRating(movie) {
    if (movie.tmdb?.vote_average) return Number(movie.tmdb.vote_average).toFixed(1);
    return null;
  },

  /** Nhãn loại phim sang tiếng Việt */
  typeLabel(type) {
    const map = {
      single: "Phim Lẻ",
      series: "Phim Bộ",
      hoathinh: "Hoạt Hình",
      tvshows: "TV Shows",
    };
    return map[type] || "Phim";
  },

  /** Nhãn ngôn ngữ phim */
  langBadgeClass(lang) {
    if (!lang) return "";
    const l = lang.toLowerCase();
    if (l.includes("thuyết minh") || l.includes("thuyet minh")) return "badge-tm";
    if (l.includes("lồng tiếng") || l.includes("long tieng")) return "badge-lt";
    return "badge-vietsub";
  },

  /** Escape HTML để tránh XSS khi render dữ liệu từ API ra DOM */
  escapeHtml(str = "") {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  /** Tạo HTML skeleton card khi đang loading danh sách phim */
  skeletonCards(count = 8) {
    return Array.from({ length: count })
      .map(
        () => `
        <div class="movie-card skeleton-card">
          <div class="skeleton-box poster-skeleton"></div>
          <div class="skeleton-box text-skeleton" style="width: 80%;"></div>
          <div class="skeleton-box text-skeleton" style="width: 50%;"></div>
        </div>`
      )
      .join("");
  },

  /** Hiện toast thông báo nhỏ ở góc màn hình */
  toast(message, type = "info", duration = 3000) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  /** Hiện thông báo lỗi dạng full-block, dùng khi load list/detail lỗi */
  errorBlock(message, retryCallback = null) {
    const id = "retry-" + Math.random().toString(36).slice(2, 8);
    if (retryCallback) window[id] = retryCallback;
    return `
      <div class="error-block">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>${this.escapeHtml(message)}</p>
        ${retryCallback ? `<button class="btn btn-outline" onclick="window['${id}']()">Thử lại</button>` : ""}
      </div>`;
  },

  /** Throttle scroll/resize event để tránh giật lag */
  throttle(fn, limit = 200) {
    let waiting = false;
    return (...args) => {
      if (waiting) return;
      fn(...args);
      waiting = true;
      setTimeout(() => (waiting = false), limit);
    };
  },

  /** Lazy load ảnh dùng IntersectionObserver (data-src -> src) */
  initLazyImages(root = document) {
    const imgs = root.querySelectorAll("img[data-src]");
    if (!("IntersectionObserver" in window)) {
      imgs.forEach((img) => (img.src = img.dataset.src));
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            img.classList.add("loaded");
            obs.unobserve(img);
          }
        });
      },
      { rootMargin: "200px 0px" }
    );
    imgs.forEach((img) => observer.observe(img));
  },
};
async function trackingVisitsWithDate() {
  const namespace = "moviestream_genz_2026"; // Tên định danh viết liền không dấu của bạn
  
  // 1. Lấy thời gian thực của hệ thống
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // Định dạng: YYYY-MM-DD
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // Định dạng: YYYY-MM
  const totalKey = "total_all_time";

  try {
    // 2. Đồng loạt kích hoạt tăng lượt đếm (Tận dụng Promise.all để load song song cho mượt)
    const [resToday, resMonth, resTotal] = await Promise.all([
      fetch(`https://api.countapi.xyz/hit/${namespace}/${todayKey}`),
      fetch(`https://api.countapi.xyz/hit/${namespace}/${monthKey}`),
      fetch(`https://api.countapi.xyz/hit/${namespace}/${totalKey}`)
    ]);

    const dataToday = await resToday.json();
    const dataMonth = await resMonth.json();
    const dataTotal = await resTotal.json();

    // 3. Đổ dữ liệu vào giao diện HTML
    const countContainer = document.getElementById('analytics-counter');
    if (countContainer) {
      countContainer.innerHTML = `
        <div class="counter-item">📅 Hôm nay: <span>${dataToday.value || 1}</span></div>
        <div class="counter-item">🗓️ Tháng này: <span>${dataMonth.value || 1}</span></div>
        <div class="counter-item">🔥 Tổng lượt xem: <span>${dataTotal.value || 1}</span></div>
      `;
    }
  } catch (err) {
    console.log("Hệ thống đếm lượt truy cập đang bận, phim vẫn load mượt nhé bạn ơi!", err);
  }
}

// Chạy khi trang index load xong
document.addEventListener("DOMContentLoaded", () => trackingVisitsWithDate());