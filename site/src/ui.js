(function () {
  const key = "awh-theme";
  const root = document.documentElement;

  function syncTheme(theme) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("aria-label", theme === "light" ? "切换为暗色" : "切换为亮色");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f3efe6" : "#0c0d11");
    try { localStorage.setItem(key, theme); } catch (e) { /* private mode */ }
  }

  document.getElementById("theme-toggle")?.addEventListener("click", function () {
    syncTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light");
  });

  syncTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      area.remove();
      return ok;
    }
  }

  document.addEventListener("click", function (event) {
    const btn = event.target.closest("[data-copy]");
    if (!btn) return;
    const url = btn.getAttribute("data-copy") || location.href;
    const prev = btn.textContent;
    copyText(url).then(function (ok) {
      btn.textContent = ok ? "已复制" : "复制失败";
      setTimeout(function () { btn.textContent = prev; }, 1400);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    if (typing) return;
    const input = document.getElementById("q");
    if (!input) return;
    event.preventDefault();
    input.focus();
    input.select();
  });
})();
