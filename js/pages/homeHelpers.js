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
};
