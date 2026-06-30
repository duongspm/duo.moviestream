/**
 * ============================================================
 *  PAGE TRANSITION — fade nhẹ khi chuyển trang
 * ============================================================
 * Chặn click vào link nội bộ (cùng site, không phải #anchor, không
 * target="_blank"), fade-out 180ms rồi mới điều hướng thật, tạo cảm
 * giác mượt hơn so với chuyển trang "nhảy trắng" đột ngột của browser.
 * ============================================================
 */

(function () {
  const overlay = document.createElement("div");
  overlay.className = "page-exit-overlay";
  document.body.appendChild(overlay);

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href");
    const isInternal =
      href &&
      !href.startsWith("#") &&
      !href.startsWith("http") &&
      !href.startsWith("mailto:") &&
      link.target !== "_blank";

    if (!isInternal) return;

    e.preventDefault();
    overlay.classList.add("active");
    setTimeout(() => {
      window.location.href = href;
    }, 160);
  });
})();
