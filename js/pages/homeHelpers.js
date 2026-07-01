/**
 * ============================================================
 *  HOME HELPERS
 * ============================================================
 * Các hàm xử lý dữ liệu phức tạp riêng cho trang chủ, tách khỏi
 * home.js để file đó chỉ còn thuần khai báo "row nào fetch gì".
 * ============================================================
 */

const HomeHelpers = {
  /**
   * Lấy danh sách phim "nổi bật" ưu tiên theo điểm TMDB nếu dữ liệu có sẵn.
   *
   * Lưu ý minh bạch quan trọng: endpoint danh sách của KKPhim KHÔNG đảm bảo
   * luôn trả field `tmdb.vote_average` cho mọi item (field này chủ yếu xuất
   * hiện đầy đủ ở endpoint chi tiết /phim/{slug}). Hàm này tự kiểm tra xem có
   * đủ dữ liệu rating để sort hay không:
   *  - Nếu CÓ ít nhất vài phim có rating -> sort giảm dần theo rating, phim
   *    không có rating xếp xuống cuối (không loại bỏ, tránh mất dữ liệu).
   *  - Nếu KHÔNG có phim nào có rating -> trả nguyên danh sách mới nhất,
   *    KHÔNG giả vờ đã sort theo độ nổi bật (tránh đánh lừa người dùng).
   */
  async getTopRatedMovies() {
    const { items, pagination } = await movieService.getNewest(1);
    const valid = items.filter(Boolean);

    const hasAnyRating = valid.some((m) => typeof m.tmdb?.vote_average === "number");

    if (!hasAnyRating) {
      // Không đủ dữ liệu để xếp hạng độ nổi bật - trả về nguyên trạng,
      // trung thực hơn là giả vờ đây là danh sách "top rated".
      return { items: valid, pagination };
    }

    const sorted = [...valid].sort((a, b) => {
      const ra = typeof a.tmdb?.vote_average === "number" ? a.tmdb.vote_average : -1;
      const rb = typeof b.tmdb?.vote_average === "number" ? b.tmdb.vote_average : -1;
      return rb - ra;
    });

    return { items: sorted, pagination };
  },
  /**
   * Row Netflix: lấy phim Âu Mỹ chất lượng cao nhất từ danh sách mới
   * nhất, sort theo TMDB rating giảm dần nếu data có sẵn - đây là cách
   * gần nhất có thể làm với KKPhim vì không có slug "netflix" chính thức.
   * Lấy số lượng nhiều (limit 48) rồi sort phía client để có đủ phim
   * rating cao sau khi lọc bỏ những phim không có TMDB data.
   */
  async getNetflixMovies() {
    try {
      // Fetch 2 trang song song để có pool phim đủ lớn để sort rating
      const [page1, page2] = await Promise.all([
        movieService.getListByType(
          CONFIG.API.TYPE_LIST.PHIM_LE,
          { country: CONFIG.API.NETFLIX_COUNTRY, limit: 24, sortField: "modified.time" },
          1
        ),
        movieService.getListByType(
          CONFIG.API.TYPE_LIST.PHIM_LE,
          { country: CONFIG.API.NETFLIX_COUNTRY, limit: 24, sortField: "modified.time" },
          2
        ),
      ]);

      const combined = [...page1.items, ...page2.items];

      // Ưu tiên phim có TMDB rating cao (nếu có data), fallback giữ thứ tự
      // mới nhất — đúng như cách getTopRatedMovies đã làm, không giả định
      const hasRating = combined.some((m) => m.tmdb?.vote_average);
      if (hasRating) {
        combined.sort((a, b) => {
          const ra = a.tmdb?.vote_average || 0;
          const rb = b.tmdb?.vote_average || 0;
          return rb - ra;
        });
      }

      // Loại bỏ trùng lặp theo slug (có thể xảy ra khi 2 trang có item chung)
      const seen = new Set();
      const unique = combined.filter((m) => {
        if (seen.has(m.slug)) return false;
        seen.add(m.slug);
        return true;
      });

      return { items: unique.slice(0, 20) };
    } catch (err) {
      return { items: [] };
    }
  },

  /**
   * Row Phim Chiếu Rạp Việt Nam: dùng endpoint phim-chieu-rap lọc theo
   * country=viet-nam, sort theo thời gian cập nhật mới nhất (phim đang
   * chiếu được cập nhật thường xuyên nhất).
   */
  async getVietnamCinemaMovies() {
    try {
      const result = await movieService.getListByType(
        CONFIG.API.TYPE_LIST.PHIM_CHIEU_RAP,
        { country: "viet-nam", limit: 24, sortField: "modified.time" },
        1
      );
      return result;
    } catch (err) {
      return { items: [] };
    }
  },
};
