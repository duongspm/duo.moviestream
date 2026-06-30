/**
 * ============================================================
 *  SCROLL TOP BUTTON — nút lên đầu trang kèm % đã scroll
 * ============================================================
 */

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("scroll-top-btn");
    if (!btn) return;

    const ring = btn.querySelector(".scroll-top-ring-fill");
    const percentLabel = document.getElementById("scroll-top-percent");
    const radius = 19;
    const circumference = 2 * Math.PI * radius;

    ring.style.strokeDasharray = `${circumference}`;

    const SHOW_AFTER_PX = 300; // chỉ hiện nút sau khi đã scroll quá mốc này

    function updateScrollButton() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

      const offset = circumference - (percent / 100) * circumference;
      ring.style.strokeDashoffset = offset;
      percentLabel.textContent = `${percent}%`;

      const shouldShow = scrollTop > SHOW_AFTER_PX;
      btn.hidden = false;
      btn.classList.toggle("visible", shouldShow);
      if (!shouldShow) {
        clearTimeout(btn._hideTimer);
        btn._hideTimer = setTimeout(() => {
          if (!btn.classList.contains("visible")) btn.hidden = true;
        }, 300);
      } else {
        clearTimeout(btn._hideTimer);
      }
    }

    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", Utils.throttle(updateScrollButton, 80));
    window.addEventListener("resize", Utils.throttle(updateScrollButton, 200));
    updateScrollButton();
  });
})();