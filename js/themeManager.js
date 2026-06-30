/**
 * ============================================================
 *  THEME MANAGER — Dark/Light mode toggle
 * ============================================================
 * Lưu lựa chọn vào localStorage, áp dụng qua thuộc tính
 * data-theme trên thẻ <html> để CSS trong tokens.css đổi biến màu.
 * ============================================================
 */

const ThemeManager = {
  KEY: "duoflix_theme", // giá trị: "dark" | "light"

  getSaved() {
    return localStorage.getItem(this.KEY) || "dark"; // mặc định dark
  },

  applySaved() {
    const theme = this.getSaved();
    document.documentElement.setAttribute("data-theme", theme);
  },

  toggle() {
    const current = this.getSaved();
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(this.KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  },

  syncIcon(btn) {
    if (!btn) return;
    const isLight = this.getSaved() === "light";
    btn.querySelector(".icon-moon").hidden = isLight;
    btn.querySelector(".icon-sun").hidden = !isLight;
  },
};

// Áp dụng theme NGAY LẬP TỨC khi file này load (trước khi render UI khác)
// để tránh hiện tượng "nháy" dark mode rồi mới chuyển sang light mode đã lưu.
ThemeManager.applySaved();