/**
 * ============================================================
 *  MOVIE SERVICE
 * ============================================================
 * Đây là lớp DUY NHẤT mà các trang (pages) được phép gọi để lấy
 * dữ liệu phim. Bên trong nó gọi httpClient -> nguồn API thật,
 * sau đó chuẩn hoá (adapt) dữ liệu thô thành một định dạng
 * thống nhất (Normalized Movie Object) để toàn bộ UI dùng chung,
 * không phụ thuộc vào cấu trúc riêng của từng nguồn API.
 *
 * => Khi đổi nguồn API khác có schema khác, bạn chỉ cần viết lại
 *    các hàm trong khu vực "ADAPTER" bên dưới.
 * ============================================================
 */

class MovieService {
  constructor(http) {
    this.http = http;
    this.base = CONFIG.API.BASE_URL;
    this.ep = CONFIG.API.ENDPOINTS;
  }

  // ==========================================================
  // HELPERS DỰNG URL
  // ==========================================================
  _buildQuery(params = {}) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return query ? `?${query}` : "";
  }

  /** Tối ưu ảnh sang webp qua proxy của nguồn (nếu bật trong config) */
  optimizeImage(url) {
    if (!url) return "";
    if (!CONFIG.API.ENABLE_IMAGE_OPTIMIZE) return url;
    // Một số ảnh đã là full URL, một số chỉ là path tương đối -> chuẩn hoá trước
    const fullUrl = url.startsWith("http") ? url : `https://phimimg.com/${url}`;
    return `${CONFIG.API.IMAGE_OPTIMIZE_URL}${encodeURIComponent(fullUrl)}`;
  }

  // ==========================================================
  // 1. PHIM MỚI CẬP NHẬT (trang chủ)
  // ==========================================================
  async getNewest(page = 1) {
    const url = `${this.base}${this.ep.NEWEST}${this._buildQuery({ page })}`;
    const raw = await this.http.get(url);
    return {
      items: (raw.items || []).filter(Boolean).map(this._adaptListItem),
      pagination: this._adaptPagination(raw.pagination || raw),
    };
  }

  // ==========================================================
  // 2. DANH SÁCH THEO LOẠI (phim-bo, phim-le, hoat-hinh, tv-shows...)
  // ==========================================================
  async getListByType(typeList, filters = {}, page = 1) {
    const { sortField, sortType, sortLang, category, country, year, limit } = filters;
    const url =
      `${this.base}${this.ep.LIST}/${typeList}` +
      this._buildQuery({
        page,
        sort_field: sortField || "modified.time",
        sort_type: sortType || "desc",
        sort_lang: sortLang,
        category,
        country,
        year,
        limit: limit || CONFIG.API.DEFAULT_LIMIT,
      });
    const raw = await this.http.get(url);
    return this._adaptListResponse(raw);
  }

  // ==========================================================
  // 3. TÌM KIẾM
  // ==========================================================
  async search(keyword, filters = {}, page = 1) {
    if (!keyword || !keyword.trim()) return { items: [], pagination: null };
    const { category, country, year, limit } = filters;
    const url =
      `${this.base}${this.ep.SEARCH}` +
      this._buildQuery({
        keyword: keyword.trim(),
        page,
        category,
        country,
        year,
        limit: limit || CONFIG.API.DEFAULT_LIMIT,
      });
    const raw = await this.http.get(url, { useCache: false });
    return this._adaptListResponse(raw);
  }

  // ==========================================================
  // 4. CHI TIẾT PHIM + DANH SÁCH TẬP (dùng cho trang detail & watch)
  // ==========================================================
  async getDetail(slug) {
    const url = `${this.base}${this.ep.DETAIL}/${slug}`;
    const raw = await this.http.get(url);
    if (!raw || raw.status === false) {
      throw new ApiError("Không tìm thấy phim này hoặc phim đã bị gỡ.", 404);
    }
    return this._adaptDetail(raw);
  }

  // ==========================================================
  // 5. DANH SÁCH THỂ LOẠI / QUỐC GIA (cho trang lọc phim)
  // ==========================================================
  async getCategories() {
    const url = `${this.base}${this.ep.CATEGORY_LIST}`;
    return this.http.get(url);
  }

  async getCountries() {
    const url = `${this.base}${this.ep.COUNTRY_LIST}`;
    return this.http.get(url);
  }

  async getByCategory(slug, filters = {}, page = 1) {
    const url =
      `${this.base}${this.ep.CATEGORY}/${slug}` +
      this._buildQuery({ page, ...this._mapFilters(filters) });
    const raw = await this.http.get(url);
    return this._adaptListResponse(raw);
  }

  async getByCountry(slug, filters = {}, page = 1) {
    const url =
      `${this.base}${this.ep.COUNTRY}/${slug}` +
      this._buildQuery({ page, ...this._mapFilters(filters) });
    const raw = await this.http.get(url);
    return this._adaptListResponse(raw);
  }

  async getByYear(year, filters = {}, page = 1) {
    const url =
      `${this.base}${this.ep.YEAR}/${year}` +
      this._buildQuery({ page, ...this._mapFilters(filters) });
    const raw = await this.http.get(url);
    return this._adaptListResponse(raw);
  }

  _mapFilters(filters = {}) {
    const { sortField, sortType, sortLang, category, country, year, limit } = filters;
    return {
      sort_field: sortField || "modified.time",
      sort_type: sortType || "desc",
      sort_lang: sortLang,
      category,
      country,
      year,
      limit: limit || CONFIG.API.DEFAULT_LIMIT,
    };
  }

  // ==========================================================
  //  ADAPTER ZONE — nơi DUY NHẤT cần sửa khi đổi nguồn API khác
  // ==========================================================

  /** Chuẩn hoá 1 item trong danh sách (poster, tên, slug...) */
  _adaptListItem = (item) => {
    if (!item) return null;
    return {
      id: item._id || item.id,
      slug: item.slug,
      name: item.name,
      originName: item.origin_name,
      thumbUrl: this.optimizeImage(item.thumb_url),
      posterUrl: this.optimizeImage(item.poster_url),
      year: item.year,
      type: item.type, // single (phim lẻ) | series (phim bộ) | hoathinh | tvshows
      quality: item.quality,
      lang: item.lang,
      episodeCurrent: item.episode_current,
      time: item.time,
      modifiedTime: item.modified?.time,
    };
  };

  /** Chuẩn hoá phần phân trang để UI render nút next/prev đồng nhất */
  _adaptPagination(p) {
    if (!p) return null;
    return {
      currentPage: p.currentPage || p.current_page || 1,
      totalPages: p.totalPages || p.total_pages || 1,
      totalItems: p.totalItems || p.totalItemsPerPage || p.total_items || 0,
      totalItemsPerPage: p.totalItemsPerPage || p.totalItems || 24,
    };
  }

  /** Chuẩn hoá response dạng { status, items: [...], pagination } */
  _adaptListResponse(raw) {
    const data = raw.data || raw; // một số endpoint bọc thêm { data: {...} }
    // Lọc bỏ item rỗng/null ngay tại nguồn để mọi nơi gọi service đều nhận
    // dữ liệu sạch, không cần filter(Boolean) lặp lại ở từng trang UI.
    const items = (data.items || []).filter(Boolean).map(this._adaptListItem);
    const pagination = this._adaptPagination(data.params?.pagination || data.pagination);
    const titlePage = data.titlePage || data.seoOnPage?.titleHead || "";
    const breadCrumb = data.breadCrumb || [];
    return { items, pagination, titlePage, breadCrumb };
  }

  /** Chuẩn hoá chi tiết phim đầy đủ + danh sách tập phim theo server */
  _adaptDetail(raw) {
    const movie = raw.movie || raw.data?.item || raw;
    const episodesRaw = raw.episodes || raw.data?.episodes || [];

    const servers = episodesRaw.map((server) => ({
      serverName: server.server_name,
      items: (server.server_data || []).map((ep) => ({
        name: ep.name, // ví dụ "Tập 1"
        slug: ep.slug,
        filename: ep.filename,
        linkEmbed: ep.link_embed,
        linkM3u8: ep.link_m3u8,
      })),
    }));

    return {
      id: movie._id || movie.id,
      slug: movie.slug,
      name: movie.name,
      originName: movie.origin_name,
      content: movie.content,
      type: movie.type,
      status: movie.status, // ongoing | completed | trailer
      thumbUrl: this.optimizeImage(movie.thumb_url),
      posterUrl: this.optimizeImage(movie.poster_url),
      isCopyright: movie.is_copyright,
      subDocquyen: movie.sub_docquyen,
      time: movie.time,
      episodeCurrent: movie.episode_current,
      episodeTotal: movie.episode_total,
      quality: movie.quality,
      lang: movie.lang,
      notify: movie.notify,
      showtimes: movie.showtimes,
      year: movie.year,
      view: movie.view,
      actor: movie.actor || [],
      director: movie.director || [],
      category: movie.category || [],
      country: movie.country || [],
      tmdb: movie.tmdb || null, // { vote_average, vote_count, ... }
      imdb: movie.imdb || null, // { id }
      servers, // [{ serverName, items: [{name, slug, linkM3u8, linkEmbed}] }]
    };
  }
}

// Singleton dùng chung toàn app
const movieService = new MovieService(httpClient);
