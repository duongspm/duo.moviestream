/**
 * ============================================================
 *  FILE CẤU HÌNH TRUNG TÂM
 * ============================================================
 * Toàn bộ thông số liên quan tới nguồn dữ liệu phim được khai báo
 * tại đây. Khi muốn đổi sang một API khác (Ophim, NguonC, ...),
 * bạn CHỈ cần sửa các giá trị trong object CONFIG.API bên dưới,
 * KHÔNG cần sửa logic ở bất kỳ file service/page nào khác,
 * miễn là API mới có cùng cấu trúc response (chuẩn "KKPhim style").
 *
 * Nếu API mới có cấu trúc response khác, chỉ cần sửa phần
 * "ADAPTER" trong movieService.js (lớp chuyển đổi dữ liệu),
 * các trang UI vẫn giữ nguyên vì chúng chỉ làm việc với dữ liệu
 * đã được chuẩn hoá.
 * ============================================================
 */

const CONFIG = {
  // ----------------------------------------------------------
  // 1. NGUỒN DỮ LIỆU PHIM (đổi domain tại đây nếu cần)
  // ----------------------------------------------------------
  API: {
    // Domain gốc cung cấp dữ liệu phim (KKPhim / Ophim đều tương thích)
    BASE_URL: "https://phimapi.com",

    // Domain dùng để chuyển ảnh sang .webp giúp tải nhanh hơn (tối ưu SEO/Lighthouse)
    IMAGE_OPTIMIZE_URL: "https://phimapi.com/image.php?url=",

    // Có bật tối ưu ảnh sang webp hay không
    ENABLE_IMAGE_OPTIMIZE: true,

    // Danh sách endpoint - KHÔNG cần đổi nếu vẫn dùng chuẩn KKPhim/Ophim
    ENDPOINTS: {
      NEWEST: "/danh-sach/phim-moi-cap-nhat-v3", // phim mới cập nhật (bản v3 nhiều field hơn)
      DETAIL: "/phim", // GET /phim/{slug}
      TMDB: "/tmdb", // GET /tmdb/{type}/{tmdb_id} - chỉ phim có hỗ trợ TMDB ID
      LIST: "/v1/api/danh-sach", // GET /v1/api/danh-sach/{type_list}
      SEARCH: "/v1/api/tim-kiem", // GET /v1/api/tim-kiem?keyword=
      CATEGORY: "/v1/api/the-loai", // GET /v1/api/the-loai/{slug}
      CATEGORY_LIST: "/the-loai", // GET /the-loai (lấy danh sách thể loại)
      COUNTRY: "/v1/api/quoc-gia", // GET /v1/api/quoc-gia/{slug}
      COUNTRY_LIST: "/quoc-gia", // GET /quoc-gia (lấy danh sách quốc gia)
      YEAR: "/v1/api/nam", // GET /v1/api/nam/{year}
    },

    // Các type_list hệ thống hỗ trợ (dùng cho trang danh mục)
    TYPE_LIST: {
      PHIM_BO: "phim-bo",
      PHIM_LE: "phim-le",
      TV_SHOWS: "tv-shows",
      HOAT_HINH: "hoat-hinh",
      PHIM_VIETSUB: "phim-vietsub",
      PHIM_THUYET_MINH: "phim-thuyet-minh",
      PHIM_LONG_TIENG: "phim-long-tieng",
      PHIM_CHIEU_RAP: "phim-chieu-rap",
    },

    // Giá trị hợp lệ cho tham số sort_lang (lọc theo ngôn ngữ lồng tiếng/sub)
    SORT_LANG: {
      VIETSUB: "vietsub",
      THUYET_MINH: "thuyet-minh",
      LONG_TIENG: "long-tieng",
    },

    // Quốc gia nổi bật để dựng row riêng trên trang chủ (slug phải khớp /quoc-gia)
    FEATURED_COUNTRIES: [
      { slug: "han-quoc", label: "Phim Hàn Quốc" },
      { slug: "trung-quoc", label: "Phim Trung Quốc" },
      { slug: "au-my", label: "Phim Âu Mỹ" },
    ],

    // Số phim gợi ý liên quan hiển thị ở trang chi tiết
    RELATED_LIMIT: 12,

    // Số phim / trang mặc định (tối đa BE cho phép là 64)
    DEFAULT_LIMIT: 24,

    // Timeout cho mỗi request (ms)
    TIMEOUT: 15000,
  },

  // ----------------------------------------------------------
  // 2. THÔNG TIN WEBSITE
  // ----------------------------------------------------------
  SITE: {
    NAME: "Duoflix",
    DESCRIPTION:
      "Chiếc web xem phim tự code chạy bằng cơm, không pop-up, không quảng cáo , không trị xương khớp. Chỉ có phim hay, giao diện mượt và sự yên bình cho tâm hồn Gen Z sau giờ chạy deadline. Xem phim online chất lượng cao, cập nhật nhanh nhất - Vietsub, Thuyết minh, Lồng tiếng",
    LOGO_TEXT: "DUO",
    LOGO_ACCENT: "FLIX",
  },

  // ----------------------------------------------------------
  // 3. PLAYER
  // ----------------------------------------------------------
  PLAYER: {
    // "hls" => dùng HLS.js + Plyr cho link m3u8 (mượt, tự chủ UI)
    // "iframe" => nhúng iframe link_embed do nguồn phim cung cấp (dự phòng)
    DEFAULT_MODE: "hls",
    AUTO_NEXT_COUNTDOWN: 8, // giây đếm ngược trước khi tự chuyển tập kế tiếp
    AUTO_NEXT_TRIGGER_BEFORE_END: 15, // tự hiện gợi ý next khi còn n giây
  },

  // ----------------------------------------------------------
  // 4. CACHE (giảm số lần gọi API lặp lại trong cùng phiên)
  // ----------------------------------------------------------
  CACHE: {
    ENABLE: true,
    TTL: 5 * 60 * 1000, // 5 phút
  },

  // ----------------------------------------------------------
  // 5. LOCAL STORAGE KEYS (Yêu thích / Tiếp tục xem / Lịch sử)
  // ----------------------------------------------------------
  // Toàn bộ tính năng này lưu trên máy người dùng (localStorage),
  // KHÔNG gửi lên server nào - vì site không có backend riêng.
  STORAGE: {
    FAVORITES_KEY: "moviestream_favorites", // danh sách phim yêu thích
    HISTORY_KEY: "moviestream_history", // lịch sử xem (kèm % tiến độ)
    HISTORY_MAX_ITEMS: 50, // giới hạn số phim lưu trong lịch sử
  },
};

// Đóng băng để tránh việc code khác vô tình ghi đè cấu hình lúc runtime
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.SITE);
Object.freeze(CONFIG.PLAYER);
Object.freeze(CONFIG.CACHE);
Object.freeze(CONFIG.STORAGE);
