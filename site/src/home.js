import { compareHot, compareNew, paginate, summarize, termsOf } from "./search.mjs";

const boot = JSON.parse(document.getElementById("hub-boot").textContent);
const PAGE = boot.pageSize || 24;

const els = {
  form: document.getElementById("search-form"),
  q: document.getElementById("q"),
  types: document.getElementById("type-filters"),
  cats: document.getElementById("cat-filters"),
  meta: document.getElementById("result-meta"),
  grid: document.getElementById("results"),
  pager: document.getElementById("pager"),
  sort: document.getElementById("sort"),
};

const state = {
  q: "",
  type: "",
  cat: "",
  sort: "hot",
  page: 1,
  ready: false,
  items: [],
  hay: [],
  types: [],
  categories: [],
};

let timer = 0;
let focusPager = false;

function readUrl() {
  const params = new URLSearchParams(location.search);
  state.q = params.get("q") || "";
  state.type = params.get("type") || "";
  state.cat = params.get("cat") || "";
  state.sort = params.get("sort") === "new" ? "new" : "hot";
  state.page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  if (els.q) els.q.value = state.q;
}

function writeUrl() {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.type) params.set("type", state.type);
  if (state.cat) params.set("cat", state.cat);
  if (state.sort !== "hot") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  const query = params.toString();
  const next = query ? `${location.pathname}?${query}` : location.pathname;
  if (next !== location.pathname + location.search) history.replaceState(null, "", next);
}

function isPrerenderState() {
  return !state.q && !state.type && !state.cat && state.sort === "hot" && state.page === 1;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlight(text, terms) {
  const raw = String(text ?? "");
  if (!raw || !terms.length) return esc(raw);
  const lower = raw.toLowerCase();
  const ranges = [];
  for (const term of terms) {
    const needle = term.toLowerCase();
    if (!needle) continue;
    let from = 0;
    while (from < lower.length) {
      const found = lower.indexOf(needle, from);
      if (found < 0) break;
      ranges.push([found, found + needle.length]);
      from = found + needle.length;
    }
  }
  if (!ranges.length) return esc(raw);
  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (!last || range[0] > last[1]) merged.push(range.slice());
    else last[1] = Math.max(last[1], range[1]);
  }
  let html = "";
  let cursor = 0;
  for (const [start, end] of merged) {
    html += `${esc(raw.slice(cursor, start))}<mark>${esc(raw.slice(start, end))}</mark>`;
    cursor = end;
  }
  return html + esc(raw.slice(cursor));
}

function formatCount(n) {
  const value = Number(n) || 0;
  if (value >= 10000) {
    const wan = value / 10000;
    const text = wan >= 10 ? wan.toFixed(0) : wan.toFixed(1).replace(/\.0$/, "");
    return `${text} 万`;
  }
  return String(value);
}

function engagement(item) {
  if (item[8] > 0) return `${formatCount(item[8])} 赞`;
  if (item[9] > 0) return `${formatCount(item[9])} 浏览`;
  return "暂无互动";
}

function typeLabel(id) {
  return state.types.find((item) => item.id === id)?.label || id;
}

function cardHtml(item, terms) {
  const type = item[2];
  const href = `/item/${encodeURIComponent(item[0])}`;
  return `<a class="card" data-type="${esc(type)}" href="${href}">
    <div class="card-top">
      <span class="pill" data-type="${esc(type)}">${esc(typeLabel(type))}</span>
      <span class="cat">${esc(item[3])}</span>
    </div>
    <h2 class="card-title">${highlight(item[1], terms)}</h2>
    <p class="card-summary">${highlight(item[4], terms)}</p>
    <div class="card-foot">
      <span>${item[7]} 个来源</span>
      <span>${esc(engagement(item))}</span>
      <span>${esc(item[10] || "日期不详")}</span>
    </div>
  </a>`;
}

function chip(kind, id, label, count, pressed) {
  const attr = kind === "type" ? "data-type-value" : "data-cat-value";
  return `<button type="button" class="chip" ${attr}="${esc(id)}" aria-pressed="${pressed ? "true" : "false"}">${esc(label)}<small>${count}</small></button>`;
}

function renderPager(page, pages) {
  const buttons = [];
  const add = (n, label, extra) => {
    buttons.push(
      `<button type="button" data-page="${n}" ${extra || ""}>${label}</button>`,
    );
  };
  add(page - 1, "上一页", page <= 1 ? "disabled" : "");
  const windowPages = new Set([1, pages, page - 1, page, page + 1]);
  const nums = [...windowPages].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) buttons.push('<span class="gap" aria-hidden="true">…</span>');
    buttons.push(
      `<button type="button" data-page="${n}" ${n === page ? 'aria-current="page"' : ""}>${n}</button>`,
    );
    prev = n;
  }
  add(page + 1, "下一页", page >= pages ? "disabled" : "");
  els.pager.innerHTML = buttons.join("");
}

function render(options) {
  const terms = termsOf(state.q);
  const knownType = state.types.some((item) => item.id === state.type) ? state.type : "";
  const knownCat = state.categories.some((item) => item.id === state.cat) ? state.cat : "";
  const { typeCounts, catCounts, matched } = summarize(state.items, state.hay, {
    terms,
    type: knownType,
  });
  const list = knownCat ? matched.filter((item) => item[3] === knownCat) : matched.slice();
  list.sort(state.sort === "new" ? compareNew : compareHot);
  const page = paginate(list, state.page, PAGE);
  state.page = page.page;

  const totalForTypes = terms.length
    ? [...typeCounts.values()].reduce((sum, n) => sum + n, 0)
    : state.items.length;
  const visibleTypes = state.types.filter((item) => (typeCounts.get(item.id) || 0) > 0 || knownType === item.id);
  els.types.innerHTML = [
    chip("type", "", "全部", totalForTypes, !knownType),
    ...visibleTypes.map((item) => chip("type", item.id, item.label, typeCounts.get(item.id) || 0, knownType === item.id)),
  ].join("");

  const totalForCats = knownType ? matched.length : totalForTypes;
  const visibleCats = state.categories.filter((item) => (catCounts.get(item.id) || 0) > 0 || knownCat === item.id);
  els.cats.innerHTML = [
    chip("cat", "", "全部分类", knownType ? matched.length : totalForCats, !knownCat),
    ...visibleCats.map((item) => chip("cat", item.id, item.label, catCounts.get(item.id) || 0, knownCat === item.id)),
  ].join("");

  for (const button of els.sort.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", button.getAttribute("data-sort-value") === state.sort ? "true" : "false");
  }

  const sortLabel = state.sort === "new" ? "最新" : "热度";
  els.meta.textContent = page.total
    ? `按${sortLabel} · 第 ${page.page} / ${page.pages} 页 · 共 ${page.total} 条`
    : "没有匹配的条目";
  document.title = state.q
    ? `${state.q} · 搜索 · Awesome WorkBuddy Hub`
    : boot.title;

  const keepServer = options.keepPrerender && isPrerenderState();
  if (!keepServer) {
    els.grid.innerHTML = page.total
      ? page.slice.map((item) => cardHtml(item, terms)).join("")
      : `<div class="empty"><p>没有找到匹配的资源。换个词，或清空类型和分类。</p><button type="button" class="btn" id="reset-filters">清空筛选</button></div>`;
    renderPager(page.page, page.pages);
  }
  writeUrl();
  if (focusPager) {
    els.meta.focus();
    focusPager = false;
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!state.ready) return;
    render({ keepPrerender: false });
  }, 80);
}

els.form?.addEventListener("submit", (event) => {
  event.preventDefault();
  state.q = els.q.value;
  state.page = 1;
  if (state.ready) render({ keepPrerender: false });
});

els.q?.addEventListener("input", () => {
  state.q = els.q.value;
  state.page = 1;
  schedule();
});

els.types?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-type-value]");
  if (!button) return;
  state.type = button.getAttribute("data-type-value") || "";
  state.page = 1;
  if (state.ready) render({ keepPrerender: false });
});

els.cats?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cat-value]");
  if (!button) return;
  state.cat = button.getAttribute("data-cat-value") || "";
  state.page = 1;
  if (state.ready) render({ keepPrerender: false });
});

els.sort?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sort-value]");
  if (!button) return;
  state.sort = button.getAttribute("data-sort-value") === "new" ? "new" : "hot";
  state.page = 1;
  if (state.ready) render({ keepPrerender: false });
});

els.pager?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (!button || button.disabled) return;
  const next = parseInt(button.getAttribute("data-page") || "1", 10);
  if (!Number.isFinite(next) || next === state.page) return;
  state.page = next;
  focusPager = true;
  if (state.ready) render({ keepPrerender: false });
  window.scrollTo({ top: document.getElementById("browse").offsetTop - 72, behavior: "smooth" });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#reset-filters")) return;
  state.q = "";
  state.type = "";
  state.cat = "";
  state.sort = "hot";
  state.page = 1;
  if (els.q) els.q.value = "";
  if (state.ready) render({ keepPrerender: false });
});

window.addEventListener("popstate", () => {
  readUrl();
  if (state.ready) render({ keepPrerender: false });
});

readUrl();

fetch(boot.index)
  .then((response) => {
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  })
  .then((index) => {
    state.items = index.items;
    state.hay = index.hay;
    state.types = index.types;
    state.categories = index.categories;
    state.ready = true;
    const started = performance.now();
    render({ keepPrerender: isPrerenderState() });
    const spent = Math.round(performance.now() - started);
    console.info(JSON.stringify({ message: "index ready", items: state.items.length, renderMs: spent }));
  })
  .catch(() => {
    const note = document.createElement("p");
    note.className = "banner";
    note.textContent = "搜索索引没有载入。当前仍可打开下面已列出的条目，刷新后可再试搜索和筛选。";
    els.grid.before(note);
  });
