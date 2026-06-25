/**
 * ============================================================
 *  PAGE: HOME (index.html)
 * ============================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  Header.mount();
  Footer.mount();

  HeroSlider.mount("hero-slider");

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

  // Row 4: Phim Xem Nhiều (dùng sort_field theo year để mô phỏng "trending",
  // do KKPhim chưa có field lượt-xem-realtime công khai qua endpoint danh sách)
  MovieRow.mount("row-hot", {
    title: "Phim Xem Nhiều",
    viewAllHref: `filter.html?type=${CONFIG.API.TYPE_LIST.PHIM_LE}&sort_field=year`,
    fetcher: () =>
      movieService.getListByType(CONFIG.API.TYPE_LIST.PHIM_LE, { sortField: "year", sortType: "desc" }, 2),
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
});
