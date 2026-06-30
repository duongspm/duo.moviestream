/**
 * ============================================================
 *  PAGE LOADER — ẩn splash screen khi trang đã load xong
 * ============================================================
 * Ẩn ngay khi window "load" (mọi tài nguyên tĩnh xong), kèm thời
 * gian tối thiểu hiển thị để tránh hiệu ứng "chớp" nếu trang load
 * quá nhanh (loader hiện rồi biến mất ngay lập tức trông giật).
 * ============================================================
 */

(function () {
  const MIN_DISPLAY_MS = 450;
  const startTime = Date.now();

  function hideLoader() {
    const loader = document.getElementById("page-loader");
    if (!loader) return;
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
    setTimeout(() => {
      loader.classList.add("loaded");
      setTimeout(() => loader.remove(), 450); // dọn khỏi DOM sau khi fade xong
    }, remaining);
  }

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader);
  }
})();