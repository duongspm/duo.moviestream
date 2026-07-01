/**
 * ============================================================
 *  PAGE: HOME (index.html)
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  Header.mount();
  Footer.mount();

  HeroSlider.mount("hero-slider");

  // Row 0 (động): Tiếp tục xem — chỉ hiện nếu người dùng có lịch sử xem
  // trên CHÍNH máy/trình duyệt này (dữ liệu lưu localStorage, không đồng bộ
  // giữa các thiết bị). Nếu chưa xem phim nào thì row này tự ẩn hoàn toàn.
  ContinueWatchingRow.mount("row-continue");

  // Row 1: Phim mới cập nhật
  MovieRow.mount("row-newest", {
    title: "Phim Mới Cập Nhật",
    viewAllHref: "filter.html?type=phim-moi-cap-nhat",
    fetcher: () => movieService.getNewest(1),
  });

  // Row 2: Phim Lẻ
  MovieRow.mount("row-single", {
    title: "Phim Lẻ",
    viewAllHref: `filter.html?type=${CONFIG.API.TYPE_LIST.PHIM_LE}`,
    fetcher: () => movieService.getListByType(CONFIG.API.TYPE_LIST.PHIM_LE, {}, 1),
  });

  // Row 3: Phim Bộ
  MovieRow.mount("row-series", {
    title: "Phim Bộ",
    viewAllHref: `filter.html?type=${CONFIG.API.TYPE_LIST.PHIM_BO}`,
    fetcher: () => movieService.getListByType(CONFIG.API.TYPE_LIST.PHIM_BO, {}, 1),
  });

  // Row 4: Phim Nổi Bật — Lưu ý minh bạch: KKPhim KHÔNG trả field lượt-xem
  // (view) ở endpoint danh sách (chỉ có ở endpoint chi tiết từng phim), nên
  // không thể sort "xem nhiều nhất" thật trên 1 trang danh sách mà không gọi
  // hàng trăm request chi tiết (không khả thi). Thay vào đó dùng điểm TMDB
  // (rating thật từ TMDB, đáng tin cậy hơn random) làm tín hiệu "nổi bật".
  MovieRow.mount("row-hot", {
    title: "Phim Nổi Bật (Rating Cao)",
    viewAllHref: `filter.html?type=${CONFIG.API.TYPE_LIST.PHIM_LE}&sort_field=year`,
    fetcher: () => HomeHelpers.getTopRatedMovies(),
  });

  // Row 5: Hoạt Hình
  MovieRow.mount("row-anime", {
    title: "Hoạt Hình",
    viewAllHref: `filter.html?type=${CONFIG.API.TYPE_LIST.HOAT_HINH}`,
    fetcher: () => movieService.getListByType(CONFIG.API.TYPE_LIST.HOAT_HINH, {}, 1),
  });

  // Row 6: TV Shows
  MovieRow.mount("row-tvshows", {
    title: "TV Shows",
    viewAllHref: `filter.html?type=${CONFIG.API.TYPE_LIST.TV_SHOWS}`,
    fetcher: () => movieService.getListByType(CONFIG.API.TYPE_LIST.TV_SHOWS, {}, 1),
  });

  // Rows động theo quốc gia nổi bật (khai thác /v1/api/quoc-gia/{slug})
  CONFIG.API.FEATURED_COUNTRIES.forEach((country, idx) => {
    MovieRow.mount(`row-country-${idx}`, {
      title: country.label,
      viewAllHref: `filter.html?type=phim-moi-cap-nhat&country=${country.slug}`,
      fetcher: () => movieService.getByCountry(country.slug, {}, 1),
    });
    // Row Netflix — phim Âu Mỹ chất lượng cao nhất, ưu tiên TMDB rating cao
    // (cách tốt nhất có thể với KKPhim vì không có slug "netflix" chính thức)
    MovieRow.mount("row-netflix", {
      title: "🎬 Netflix Originals & Hay Nhất",
      viewAllHref: `filter.html?type=${CONFIG.API.TYPE_LIST.PHIM_LE}&country=${CONFIG.API.NETFLIX_COUNTRY}`,
      fetcher: () => HomeHelpers.getNetflixMovies(),
      // Thay fetcher trong mount "row-netflix" bằng cách này nếu muốn:
      // fetcher: () => movieService.search("netflix", { limit: 24 }, 1),
    });

    // Row Phim Chiếu Rạp Việt Nam — phim VN đang chiếu rạp mới nhất
    MovieRow.mount("row-vn-cinema", {
      title: "🇻🇳 Phim Chiếu Rạp Việt Nam",
      viewAllHref: `filter.html?type=${CONFIG.API.TYPE_LIST.PHIM_CHIEU_RAP}&country=viet-nam`,
      fetcher: () => HomeHelpers.getVietnamCinemaMovies(),
    });
  });
});
