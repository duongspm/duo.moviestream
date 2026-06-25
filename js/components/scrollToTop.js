/**
 * ============================================================
 * COMPONENT: SCROLL TO TOP WITH PROGRESS INDICATOR
 * ============================================================
 */

const ScrollToTop = {
    mount() {
        // Tránh mount trùng lặp trên cùng một trang
        if (document.getElementById("scroll-to-top")) return;

        // 1. Tạo cấu trúc HTML
        const btn = document.createElement("button");
        btn.id = "scroll-to-top";
        btn.className = "scroll-to-top";
        btn.setAttribute("aria-label", "Cuộn lên đầu trang");

        btn.innerHTML = `
      <svg class="progress-circle" width="46" height="46" viewBox="0 0 46 46">
        <circle class="progress-bg" cx="23" cy="23" r="20" fill="none" stroke-width="3"></circle>
        <circle class="progress-bar" cx="23" cy="23" r="20" fill="none" stroke-width="3" 
                stroke-dasharray="125.66" stroke-dashoffset="125.66"></circle>
      </svg>
      <div class="arrow-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </div>
      <span class="progress-text" id="scroll-percent-text">0%</span>
    `;

        document.body.appendChild(btn);

        // Chu vi vòng tròn (2 * PI * r) với r = 20
        const circumference = 125.66;
        const progressBar = btn.querySelector(".progress-bar");
        const textPercent = btn.querySelector("#scroll-percent-text");

        // 2. Logic xử lý tính toán khi cuộn
        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

            // Hiển thị hoặc ẩn nút tùy thuộc vào tọa độ cuộn (quá 200px thì hiện)
            if (scrollTop > 200) {
                btn.classList.add("visible");
            } else {
                btn.classList.remove("visible");
            }

            if (docHeight <= 0) return;

            // Tính phần trăm cuộn
            const percent = Math.min(Math.round((scrollTop / docHeight) * 100), 100);

            // Cập nhật vòng tròn tiến độ SVG
            if (progressBar) {
                const offset = circumference - (percent / 100) * circumference;
                progressBar.style.strokeDashoffset = offset;
            }

            // Cập nhật text số %
            if (textPercent) {
                textPercent.textContent = `${percent}%`;
            }
        };

        // 3. Đăng ký sự kiện cuộn (Tận dụng hàm throttle trong utils.js của bạn)
        if (typeof Utils !== "undefined" && Utils.throttle) {
            window.addEventListener("scroll", Utils.throttle(handleScroll, 40));
        } else {
            window.addEventListener("scroll", handleScroll);
        }

        // 4. Sự kiện click cuộn lên đầu mượt mà
        btn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });

        // Chạy thử luôn một lần để đồng bộ trạng thái ban đầu khi vừa load trang
        handleScroll();
    }
};