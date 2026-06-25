/**
 * ============================================================
 *  HTTP CLIENT - lớp thấp nhất, mọi service đều dùng qua đây
 * ============================================================
 * Trách nhiệm:
 *  - Gọi fetch() có timeout
 *  - Cache GET request trong bộ nhớ (Map) để tránh gọi API thừa
 *  - Chuẩn hoá lỗi để các tầng trên xử lý dễ dàng
 * ============================================================
 */

class HttpClient {
  constructor() {
    this._cache = new Map(); // key: url, value: { data, expireAt }
  }

  _getFromCache(key) {
    if (!CONFIG.CACHE.ENABLE) return null;
    const cached = this._cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expireAt) {
      this._cache.delete(key);
      return null;
    }
    return cached.data;
  }

  _setCache(key, data) {
    if (!CONFIG.CACHE.ENABLE) return;
    this._cache.set(key, {
      data,
      expireAt: Date.now() + CONFIG.CACHE.TTL,
    });
  }

  /**
   * GET request có timeout + cache
   * @param {string} url
   * @param {{ useCache?: boolean }} options
   */
  async get(url, options = {}) {
    const { useCache = true } = options;

    if (useCache) {
      const cached = this._getFromCache(url);
      if (cached) return cached;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);

    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new ApiError(`HTTP ${res.status} - ${res.statusText}`, res.status);
      }

      const data = await res.json();

      if (useCache) this._setCache(url, data);
      return data;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new ApiError("Yêu cầu quá thời gian chờ (timeout). Vui lòng thử lại.", 408);
      }
      if (err instanceof ApiError) throw err;
      // err.message gốc của browser (ví dụ "Failed to fetch", lỗi CORS, mất mạng...)
      // không thân thiện với người dùng cuối nên luôn quy về 1 thông báo tiếng Việt chung.
      throw new ApiError("Không thể kết nối tới nguồn dữ liệu phim. Vui lòng kiểm tra mạng và thử lại.", 0);
    } finally {
      clearTimeout(timer);
    }
  }

  clearCache() {
    this._cache.clear();
  }
}

/** Lỗi tuỳ biến giúp UI hiển thị thông báo phù hợp */
class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Singleton dùng chung toàn app
const httpClient = new HttpClient();
