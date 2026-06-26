# 🎬 MovieStream — Website Xem Phim Online (Vanilla JS)

Website xem phim trực tuyến **không tự host video** — toàn bộ dữ liệu phim và link
phát (HLS/m3u8, iframe embed) được fetch từ nguồn API phim bên thứ ba (mặc định:
[KKPhim / phimapi.com](https://kkphim.com/tai-lieu-api)).

Phong cách: **Dark Mode** đen tuyền – đỏ rượu – vàng neon (lấy cảm hứng "ánh đèn rạp
chiếu"), Responsive 100% (Mobile/Tablet/Desktop), Lazy Loading + Skeleton Screen.

---

## 1. Cấu trúc thư mục

```
movie-site/
├── index.html                 # Trang chủ (Hero + Tiếp tục xem + các row danh mục)
├── filter.html                 # Trang lọc/danh mục phim
├── search.html                  # Trang tìm kiếm
├── detail.html                   # Trang chi tiết phim (+ Yêu thích, Chia sẻ, Liên quan)
├── watch.html                     # Trang xem phim (Player + phím tắt)
├── favorites.html                  # Trang danh sách phim Yêu thích
│
├── assets/                  # Logo, favicon, ảnh OGP (xem mục 9)
│
├── css/
│   ├── tokens.css        # Design tokens: màu sắc, font, spacing (SỬA MÀU TẠI ĐÂY)
│   ├── base.css          # Reset + style chung (button, skeleton, toast...)
│   ├── header.css        # Header, nav, search bar, icon yêu thích
│   ├── hero.css          # Hero slider trang chủ
│   ├── movie-card.css    # Movie card + carousel rows + continue-watching progress bar
│   ├── detail.css        # Trang chi tiết phim
│   ├── watch.css         # Trang xem phim + player + keyboard hint
│   ├── filter.css        # Trang lọc/danh mục + pagination
│   └── footer.css        # Footer
│
└── js/
    ├── config.js                       # ⭐ CẤU HÌNH TRUNG TÂM — đổi API tại đây
    ├── utils.js                        # Hàm tiện ích (debounce, lazy load, toast...)
    ├── services/
    │   ├── httpClient.js               # Lớp fetch cơ sở (cache, timeout, lỗi)
    │   ├── movieService.js             # ⭐ Service gọi API phim + ADAPTER chuẩn hoá data
    │   ├── playerService.js            # Player HLS.js/Plyr + fallback iframe + resume
    │   └── storageService.js           # ⭐ Yêu thích & Tiếp tục xem (localStorage)
    ├── components/
    │   ├── header.js, footer.js        # Layout dùng chung
    │   ├── movieCard.js                # Render 1 card phim
    │   ├── movieRow.js                 # Carousel ngang theo danh mục
    │   ├── continueWatchingRow.js      # Row "Tiếp tục xem" trên trang chủ
    │   └── heroSlider.js               # Slider phim hot/chiếu rạp
    └── pages/
        ├── home.js, homeHelpers.js     # Trang chủ + logic phụ (top-rated)
        ├── filter.js, search.js        # Lọc & tìm kiếm
        ├── detail.js, watch.js         # Chi tiết & xem phim
        └── favorites.js                # Trang yêu thích
```

Toàn bộ code thuần **HTML/CSS/JS (không build step, không framework)** — chỉ cần
mở bằng trình duyệt hoặc deploy thẳng lên bất kỳ static hosting nào.

---

## 2. Tính năng chính

**Khám phá phim:** Hero slider phim hot/chiếu rạp · 6+ row danh mục (Mới cập nhật,
Nổi bật theo rating, Phim Lẻ/Bộ, Hoạt Hình, TV Shows, theo Quốc gia) · Trang lọc đầy
đủ (thể loại, quốc gia, năm, **ngôn ngữ phụ đề**, sắp xếp) · Tìm kiếm realtime có gợi ý.

**Xem phim:** Player HLS.js + Plyr tự chủ UI, fallback iframe an toàn khi nguồn lỗi ·
Auto-next tập có countdown · Chuyển đổi nhiều server dự phòng · **Phím tắt bàn phím**
(xem mục 4) · **Tự động lưu & tiếp tục xem đúng thời điểm đã dừng**.

**Cá nhân hoá (lưu trên máy, không cần đăng nhập):** Danh sách **Yêu thích** riêng ·
Row **"Tiếp Tục Xem"** tự động xuất hiện ở trang chủ · **Chia sẻ phim** (Web Share API
+ fallback copy link) · Gợi ý **"Có Thể Bạn Quan Tâm"** ở trang chi tiết.

---

## 3. Cách đổi nguồn API phim (KKPhim / Ophim / nguồn khác)

Mọi cấu hình API nằm trong **`js/config.js`**:

```js
const CONFIG = {
  API: {
    BASE_URL: "https://phimapi.com",   // 👈 Đổi domain tại đây
    ENDPOINTS: {
      NEWEST: "/danh-sach/phim-moi-cap-nhat-v3",
      DETAIL: "/phim",
      TMDB: "/tmdb",
      LIST: "/v1/api/danh-sach",
      SEARCH: "/v1/api/tim-kiem",
      CATEGORY: "/v1/api/the-loai",
      COUNTRY: "/v1/api/quoc-gia",
      // ...
    },
    FEATURED_COUNTRIES: [ /* danh sách quốc gia hiện row riêng ở trang chủ */ ],
  },
};
```

- Nếu nguồn mới (ví dụ Ophim) có **cùng cấu trúc JSON response** với KKPhim (rất
  nhiều nguồn phim Việt dùng chung schema này) → chỉ cần đổi `BASE_URL`, mọi thứ
  hoạt động ngay, không cần sửa code nào khác.
- Nếu nguồn mới có **schema khác hoàn toàn** → chỉ cần sửa các hàm trong khu vực
  `ADAPTER ZONE` ở cuối file `js/services/movieService.js`
  (`_adaptListItem`, `_adaptListResponse`, `_adaptDetail`). Đây là lớp DUY NHẤT
  chuyển đổi dữ liệu thô → định dạng chuẩn mà toàn bộ UI sử dụng, nên các trang
  (`home.js`, `detail.js`, `watch.js`...) **không cần sửa gì cả**.

### Giới hạn thật của API cần biết

- Endpoint **danh sách** (`/v1/api/danh-sach/...`) **không đảm bảo** trả field
  lượt-xem (`view`) hay luôn có `tmdb.vote_average` cho mọi item — 2 field này
  chủ yếu đầy đủ ở endpoint **chi tiết** (`/phim/{slug}`). Vì vậy row "Phim Nổi
  Bật" ở trang chủ tự kiểm tra dữ liệu thật tại runtime (xem
  `js/pages/homeHelpers.js`) thay vì giả định cứng — nếu không có dữ liệu rating,
  nó hiển thị danh sách mới nhất thay vì giả vờ đã sắp xếp theo độ nổi bật.
- Tham số `sort_lang` (lọc theo Vietsub/Thuyết minh/Lồng tiếng) **chỉ hoạt động**
  ở endpoint `/v1/api/danh-sach/{type}`, **không hoạt động** ở endpoint phim mới
  cập nhật (`/danh-sach/phim-moi-cap-nhat-v3`) — dropdown ngôn ngữ ở `filter.html`
  tự disable khi đang xem "Tất cả" để không đánh lừa người dùng.

---

## 4. Cách hoạt động của Player (quan trọng)

`js/services/playerService.js` áp dụng chiến lược 2 lớp:

1. **Ưu tiên HLS.js + Plyr** phát trực tiếp link `.m3u8` — cho UI player tự thiết
   kế, mượt, hỗ trợ tốc độ phát, chất lượng, PiP, fullscreen.
2. **Tự động fallback sang `<iframe>`** (link `link_embed` do nguồn phim cung cấp)
   nếu link m3u8 lỗi/timeout. Iframe được giới hạn bằng thuộc tính `sandbox` để
   hạn chế tối đa quảng cáo pop-up/redirect từ nguồn nhúng bên thứ ba.

### Phím tắt (chỉ ở trang xem phim)

| Phím | Tác dụng |
|---|---|
| `Space` / `K` | Play / Pause |
| `←` / `→` | Lùi / Tiến 10 giây |
| `↑` / `↓` | Tăng / Giảm âm lượng |
| `M` | Tắt / Mở tiếng |
| `F` | Toàn màn hình |
| `N` | Chuyển tập kế tiếp |

> ⚠️ **Giới hạn quan trọng**: vì iframe trỏ tới domain khác (cross-origin), JavaScript
> của site **không thể** đọc `currentTime`/`duration` hay điều khiển video bên trong
> iframe đó. Hệ quả: mọi phím tắt **trừ `N`**, cũng như tính năng **Tự động lưu tiến
> độ xem** và **Auto-next khi hết video**, chỉ hoạt động khi player đang ở mode HLS
> (do site tự render). Khi rơi về mode iframe, các tính năng này tự động không khả
> dụng cho tập đó — đây là giới hạn kỹ thuật cố hữu, không phải lỗi.
>
> Tương tự, chất lượng và độ ổn định của link m3u8/embed phụ thuộc hoàn toàn vào
> server của bên thứ ba — sandbox iframe giảm thiểu nhưng không loại bỏ 100% quảng
> cáo nếu nguồn cố tình chèn ngay trong luồng video/player của họ.

---

## 5. Yêu thích & Tiếp tục xem (lưu trên máy, không cần đăng nhập)

`js/services/storageService.js` quản lý 2 tính năng này hoàn toàn qua
**localStorage của trình duyệt** — không gửi gì lên server (vì site không có
backend riêng). Điều này có nghĩa:

- Dữ liệu chỉ tồn tại trên **đúng trình duyệt, đúng máy** người dùng đã dùng.
- Đổi máy, đổi trình duyệt, hoặc xoá cache/dữ liệu trang web → **mất toàn bộ**
  danh sách yêu thích và lịch sử xem. Đây là giới hạn cố hữu khi không có
  backend + tài khoản người dùng thật.
- Muốn đồng bộ đa thiết bị thực sự, cần xây thêm backend (ví dụ Firebase,
  Supabase) và thay thế các hàm trong `storageService.js` bằng API calls
  tương ứng — phần UI (`detail.js`, `watch.js`, `favorites.js`,
  `continueWatchingRow.js`) gọi qua service này nên không cần sửa nhiều.

Cấu hình giới hạn số lượng lịch sử lưu tối đa nằm ở `CONFIG.STORAGE` trong
`config.js`.

---

## 6. Chạy thử ở local

Vì trình duyệt chặn `fetch()` với một số thiết lập file `file://`, nên chạy qua
một static server đơn giản:

```bash
cd movie-site

# Cách 1: Python (có sẵn trên hầu hết máy)
python3 -m http.server 8080

# Cách 2: Node.js
npx serve .

# Cách 3: VS Code — extension "Live Server"
```

Sau đó mở `http://localhost:8080`.

---

## 7. Deploy lên GitHub Pages (miễn phí)

```bash
# 1. Tạo repo mới trên GitHub, ví dụ: movie-stream

# 2. Trong thư mục movie-site:
git init
git add .
git commit -m "Initial commit: MovieStream website"
git branch -M main
git remote add origin https://github.com/<username>/movie-stream.git
git push -u origin main

# 3. Vào Settings > Pages trên GitHub:
#    - Source: Deploy from a branch
#    - Branch: main, folder: / (root)
#    - Save

# 4. Sau ~1 phút, site sẽ live tại:
#    https://<username>.github.io/movie-stream/
```

Vì đây là site thuần static (không backend, không build step), GitHub Pages,
Netlify, Vercel, Cloudflare Pages đều deploy được ngay không cần cấu hình gì
thêm — chỉ cần kéo-thả thư mục hoặc connect repo.

---

## 8. SEO

- Mỗi trang có `<title>` và `<meta name="description">` riêng; trang `detail.html`
  và `watch.html` được set động bằng JS theo từng phim (`document.title = ...`),
  bao gồm cả `og:title`/`og:image` để chia sẻ link phim lên Facebook/Zalo hiện
  đúng poster.
- Vì đây là kiến trúc **Client-side Rendering (CSR)** thuần, các search engine
  hiện đại (Googlebot) vẫn index được nhờ render JS, nhưng để SEO tối ưu hơn nữa
  bạn có thể triển khai thêm **pre-rendering** (Prerender.io) hoặc chuyển phần
  fetch dữ liệu sang **SSR bằng Node.js/Next.js** (toàn bộ `movieService.js`
  viết theo dạng module thuần, tái sử dụng được gần như nguyên vẹn trong Node).

---

## 9. Branding (Logo, Favicon, OGP)

Thư mục `assets/` chứa bộ nhận diện thương hiệu hoàn chỉnh, lấy cảm hứng từ
phong cách Netflix (1 icon chữ cái đơn, đậm, độc lập với wordmark):

- **Logomark**: chữ "D" khối đậm màu đỏ rượu, với tam giác Play màu vàng neon
  nằm trong phần bụng rỗng.
- `logo.svg` — phiên bản nền trong suốt, dùng trong header/footer (đã tích hợp).
- `favicon.ico`, `favicon-16x16.png` → `favicon-512x512.png` — đầy đủ kích
  thước favicon chuẩn cho mọi browser/thiết bị.
- `safari-pinned-tab.svg` — icon đơn sắc (mask-icon) riêng cho tab ghim Safari.
- `site.webmanifest` — cấu hình PWA khi "Add to Home Screen" trên mobile.
- `ogp-image.png` (1200×630) — ảnh chia sẻ mặc định lên Facebook/Zalo/Twitter.

Muốn đổi logo/màu thương hiệu: sửa `assets/logo.svg` (vector, dễ sửa) rồi render
lại các size PNG/ICO bằng công cụ bất kỳ (ví dụ
[realfavicongenerator.net](https://realfavicongenerator.net)).

---

## 10. Một số giới hạn cần biết

- Nguồn KKPhim là API **công khai miễn phí**, có thể đôi lúc chậm/quá tải hoặc
  đổi cấu trúc mà không báo trước — đây là lý do file `config.js` được thiết kế
  để đổi nguồn nhanh trong vài giây.
- Website **không lưu trữ, không sở hữu** bất kỳ video nào — toàn bộ nội dung
  phim thuộc về nguồn cung cấp API. Khi triển khai thực tế (đặc biệt nếu công
  khai rộng), bạn nên tự nghiên cứu thêm về vấn đề bản quyền nội dung phù hợp
  với pháp luật tại khu vực mình hoạt động.
- Yêu thích/Tiếp tục xem chỉ lưu local (xem mục 5) — không đồng bộ đa thiết bị.
- Phím tắt và auto-resume chỉ hoạt động ở mode player HLS, không hoạt động khi
  rơi về mode iframe dự phòng (xem mục 4).
