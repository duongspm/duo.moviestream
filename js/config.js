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

    // Số phim / trang mặc định (tối đa BE cho phép là 64)
    DEFAULT_LIMIT: 24,

    // Timeout cho mỗi request (ms)
    TIMEOUT: 15000,
  },

  // ----------------------------------------------------------
  // 2. THÔNG TIN WEBSITE
  // ----------------------------------------------------------
  SITE: {
    NAME: "Duo.MovieStream",
    DESCRIPTION:
      "Vùng đất cứu rỗi những chiếc deadline. Xem phim online không quảng cáo, không 'nhà tôi 3 đời', load nhanh hơn cách người yêu cũ trở mặt! | Xem phim online chất lượng cao, cập nhật nhanh nhất - Vietsub, Thuyết minh, Lồng tiếng",
    LOGO_TEXT: "DUO.MOVIE",
    LOGO_ACCENT: "STREAM",
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
};

// Đóng băng để tránh việc code khác vô tình ghi đè cấu hình lúc runtime
Object.freeze(CONFIG.API);
Object.freeze(CONFIG.SITE);
Object.freeze(CONFIG.PLAYER);
Object.freeze(CONFIG.CACHE);
