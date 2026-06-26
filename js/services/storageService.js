/**
 * ============================================================
 *  STORAGE SERVICE — Yêu thích & Lịch sử xem (Continue Watching)
 * ============================================================
 * Toàn bộ dữ liệu lưu trong localStorage của trình duyệt, KHÔNG
 * gửi lên server nào. Vì vậy dữ liệu chỉ tồn tại trên 1 máy/1
 * trình duyệt cụ thể - đổi máy hoặc xoá cache sẽ mất dữ liệu.
 * Đây là giới hạn cố hữu khi site không có backend riêng.
 * ============================================================
 */

class StorageService {
  constructor() {
    this.favKey = CONFIG.STORAGE.FAVORITES_KEY;
    this.historyKey = CONFIG.STORAGE.HISTORY_KEY;
  }

  _safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  _safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      // Có thể do localStorage đầy hoặc bị chặn (Safari private mode...)
      return false;
    }
  }

  // ==========================================================
  // YÊU THÍCH
  // ==========================================================

  getFavorites() {
    return this._safeGet(this.favKey, []);
  }

  isFavorite(slug) {
    return this.getFavorites().some((m) => m.slug === slug);
  }

  /** @param {object} movie - cần tối thiểu {slug, name, originName, thumbUrl, year, type} */
  addFavorite(movie) {
    const list = this.getFavorites();
    if (list.some((m) => m.slug === movie.slug)) return list;
    const entry = {
      slug: movie.slug,
      name: movie.name,
      originName: movie.originName || "",
      thumbUrl: movie.thumbUrl || movie.posterUrl || "",
      year: movie.year || "",
      type: movie.type || "",
      addedAt: Date.now(),
    };
    const updated = [entry, ...list];
    this._safeSet(this.favKey, updated);
    return updated;
  }

  removeFavorite(slug) {
    const updated = this.getFavorites().filter((m) => m.slug !== slug);
    this._safeSet(this.favKey, updated);
    return updated;
  }

  toggleFavorite(movie) {
    return this.isFavorite(movie.slug) ? this.removeFavorite(movie.slug) : this.addFavorite(movie);
  }

  // ==========================================================
  // LỊCH SỬ XEM / TIẾP TỤC XEM
  // ==========================================================

  getHistory() {
    return this._safeGet(this.historyKey, []);
  }

  /** Lấy tiến độ xem đã lưu của 1 phim cụ thể, null nếu chưa xem bao giờ */
  getProgress(slug) {
    return this.getHistory().find((h) => h.slug === slug) || null;
  }

  /**
   * Lưu/ghi đè tiến độ xem hiện tại.
   * @param {object} data - {slug, name, thumbUrl, year, type, serverIndex, episodeIndex, episodeName, currentTime, duration}
   */
  saveProgress(data) {
    const list = this.getHistory().filter((h) => h.slug !== data.slug);
    const entry = { ...data, updatedAt: Date.now() };
    const updated = [entry, ...list].slice(0, CONFIG.STORAGE.HISTORY_MAX_ITEMS);
    this._safeSet(this.historyKey, updated);
    return updated;
  }

  removeProgress(slug) {
    const updated = this.getHistory().filter((h) => h.slug !== slug);
    this._safeSet(this.historyKey, updated);
    return updated;
  }

  clearHistory() {
    this._safeSet(this.historyKey, []);
  }

  /** % tiến độ đã xem, dùng để vẽ progress bar trên card. Trả về 0-100. */
  static percentWatched(entry) {
    if (!entry || !entry.duration || !entry.currentTime) return 0;
    const pct = (entry.currentTime / entry.duration) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  }
}

const storageService = new StorageService();
