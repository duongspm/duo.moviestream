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
├── index.html              # Trang chủ (Hero Slider + 6 rows danh mục)
├── filter.html              # Trang lọc/danh mục phim
├── search.html               # Trang tìm kiếm
├── detail.html                # Trang chi tiết phim
├── watch.html                   # Trang xem phim (Player)
│
├── css/
│   ├── tokens.css        # Design tokens: màu sắc, font, spacing (SỬA MÀU TẠI ĐÂY)
│   ├── base.css          # Reset + style chung (button, skeleton, toast...)
│   ├── header.css        # Header, nav, search bar
│   ├── hero.css          # Hero slider trang chủ
│   ├── movie-card.css    # Movie card + carousel rows
│   ├── detail.css        # Trang chi tiết phim
│   ├── watch.css         # Trang xem phim + player
│   ├── filter.css        # Trang lọc/danh mục + pagination
│   └── footer.css        # Footer
│
└── js/
    ├── config.js                     # ⭐ CẤU HÌNH TRUNG TÂM — đổi API tại đây
    ├── utils.js                      # Hàm tiện ích (debounce, lazy load, toast...)
    ├── services/
    │   ├── httpClient.js             # Lớp fetch cơ sở (cache, timeout, lỗi)
    │   ├── movieService.js           # ⭐ Service gọi API phim + ADAPTER chuẩn hoá data
    │   └── playerService.js          # Player HLS.js/Plyr + fallback iframe
    ├── components/
    │   ├── header.js, footer.js      # Layout dùng chung
    │   ├── movieCard.js              # Render 1 card phim
    │   ├── movieRow.js               # Carousel ngang theo danh mục
    │   └── heroSlider.js             # Slider phim hot/chiếu rạp
    └── pages/
        ├── home.js, filter.js, search.js, detail.js, watch.js
```

Toàn bộ code thuần **HTML/CSS/JS (không build step, không framework)** — chỉ cần
mở bằng trình duyệt hoặc deploy thẳng lên bất kỳ static hosting nào.

---

## 2. Cách đổi nguồn API phim (KKPhim / Ophim / nguồn khác)

Mọi cấu hình API nằm trong **`js/config.js`**:

```js
const CONFIG = {
  API: {
    BASE_URL: "https://phimapi.com",   // 👈 Đổi domain tại đây
    ENDPOINTS: {
      NEWEST: "/danh-sach/phim-moi-cap-nhat-v3",
      DETAIL: "/phim",
      LIST: "/v1/api/danh-sach",
      SEARCH: "/v1/api/tim-kiem",
      CATEGORY: "/v1/api/the-loai",
      COUNTRY: "/v1/api/quoc-gia",
      // ...
    },
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
- Muốn dùng thêm TMDB để lấy poster/rating chất lượng cao hơn → tạo thêm file
  `js/services/tmdbService.js` theo cùng pattern và gọi song song trong
  `detail.js` (Promise.all).

---

## 3. Cách hoạt động của Player (quan trọng)

`js/services/playerService.js` áp dụng chiến lược 2 lớp:

1. **Ưu tiên HLS.js + Plyr** phát trực tiếp link `.m3u8` — cho UI player tự thiết
   kế, mượt, hỗ trợ tốc độ phát, chất lượng, PiP, fullscreen.
2. **Tự động fallback sang `<iframe>`** (link `link_embed` do nguồn phim cung cấp)
   nếu link m3u8 lỗi/timeout. Iframe được giới hạn bằng thuộc tính `sandbox` để
   hạn chế tối đa quảng cáo pop-up/redirect từ nguồn nhúng bên thứ ba.

> ⚠️ Lưu ý: vì link m3u8/embed đến từ **server của bên thứ ba**, chất lượng và độ
> ổn định phụ thuộc hoàn toàn vào nguồn đó. Sandbox iframe giảm thiểu nhưng không
> thể loại bỏ 100% quảng cáo nếu nguồn cố tình chèn quảng cáo ngay trong luồng
> video/player của họ.

---

## 4. Chạy thử ở local

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

## 5. Deploy lên GitHub Pages (miễn phí)

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

## 6. SEO

- Mỗi trang có `<title>` và `<meta name="description">` riêng; trang `detail.html`
  và `watch.html` được set động bằng JS theo từng phim (`document.title = ...`).
- Vì đây là kiến trúc **Client-side Rendering (CSR)** thuần, các search engine
  hiện đại (Googlebot) vẫn index được nhờ render JS, nhưng để SEO tối ưu hơn nữa
  (đặc biệt cho social share / Facebook OG preview), bạn có thể:
  - Triển khai thêm **pre-rendering** (Prerender.io) hoặc
  - Chuyển phần fetch dữ liệu sang **SSR bằng Node.js/Next.js** nếu muốn nâng cấp
    kiến trúc trong tương lai (toàn bộ `movieService.js` hiện tại viết theo
    dạng module thuần, có thể tái sử dụng gần như nguyên vẹn trong Node).

---

## 7. Một số giới hạn cần biết

- Nguồn KKPhim là API **công khai miễn phí**, có thể đôi lúc chậm/quá tải hoặc
  đổi cấu trúc mà không báo trước — đây là lý do file `config.js` được thiết kế
  để đổi nguồn nhanh trong vài giây.
- Website **không lưu trữ, không sở hữu** bất kỳ video nào — toàn bộ nội dung
  phim thuộc về nguồn cung cấp API. Khi triển khai thực tế (đặc biệt nếu công
  khai rộng), bạn nên tự nghiên cứu thêm về vấn đề bản quyền nội dung phù hợp
  với pháp luật tại khu vực mình hoạt động.
