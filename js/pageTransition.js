/**
 * ============================================================
 *  PAGE TRANSITION — hiệu ứng wipe hiện đại khi chuyển trang
 * ============================================================
 */

(function () {
  const overlay = document.createElement("div");
  overlay.className = "page-exit-overlay";
  overlay.innerHTML = `
    <div class="wipe-panel"></div>
    <div class="wipe-logo">DUO<span>FLIX</span></div>
  `;
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
    }, 380); //380 khớp với thời lượng transition transform ở CSS (0.42s) trừ chút để cảm giác nhanh hơn
  });
})();