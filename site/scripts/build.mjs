import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compareHot, norm, paginate, summarize } from "../src/search.mjs";

const PAGE_SIZE = 24;
const SITE_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO_DIR = dirname(SITE_DIR);
const DIST = join(SITE_DIR, "dist");
const DATA = join(REPO_DIR, "data", "items.json");
const SITE_URL = (process.env.SITE_URL || "https://awesome-workbuddy-hub.azuoblog.workers.dev").replace(/\/$/, "");
const REPO_URL = "https://github.com/codingirl/awesome-workbuddy-hub";
const MAINTAINER_URL = "https://x.com/azuo_blog";

const TYPE_ORDER = [
  ["knowledge", "知识点"],
  ["skill", "技能"],
  ["tutorial", "教程"],
  ["case", "案例"],
  ["prompt", "提示词"],
  ["workflow", "工作流"],
  ["other", "工具"],
];

const UPSTREAM = [
  ["sandbaseai/awesome-workbuddy", "https://github.com/sandbaseai/awesome-workbuddy"],
  ["semlinker/awesome-workbuddy", "https://github.com/semlinker/awesome-workbuddy"],
  ["AlephAITech/WorkBuddyGuide", "https://github.com/AlephAITech/WorkBuddyGuide"],
  ["yehuzi2026/workbuddy-skills-hub", "https://github.com/yehuzi2026/workbuddy-skills-hub"],
  ["weininghui/skills", "https://github.com/weininghui/skills"],
  ["shuangying0001-beep/awesome-workbuddy-skills", "https://github.com/shuangying0001-beep/awesome-workbuddy-skills"],
  ["sandbaseai/workbuddy-skill", "https://github.com/sandbaseai/workbuddy-skill"],
];

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function hash(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 10);
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

function engagement(tuple) {
  if (tuple[8] > 0) return `${formatCount(tuple[8])} 赞`;
  if (tuple[9] > 0) return `${formatCount(tuple[9])} 浏览`;
  return "暂无互动";
}

function dateNum(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? Number(iso.replaceAll("-", "")) : 0;
}

function clip(text, max) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

function paragraphs(text) {
  return String(text || "")
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${esc(part)}</p>`)
    .join("");
}

function ext(url, label) {
  if (!url) return esc(label);
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}

function isImage(url) {
  return /^https:\/\//.test(url || "") && (/\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) || url.includes("pbs.twimg.com"));
}

async function mapPool(items, limit, fn) {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
}

function themeBoot() {
  return `<script>
(() => {
  try {
    const saved = localStorage.getItem("awh-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "light" ? "#f3efe6" : "#0c0d11";
  } catch (e) {}
})();
</script>`;
}

function header() {
  return `<a class="skip" href="#content">跳到内容</a>
<header class="topbar">
  <div class="wrap">
    <a class="brand" href="/">
      <span class="mark" aria-hidden="true">W</span>
      <span>
        <strong>Awesome WorkBuddy Hub</strong>
        <em>社区资源索引</em>
      </span>
    </a>
    <div class="top-actions">
      <nav class="top-links" aria-label="站点">
        <a href="/#browse">浏览</a>
        <a href="${esc(REPO_URL)}" target="_blank" rel="noopener noreferrer">GitHub</a>
      </nav>
      <button type="button" class="icon-btn" id="theme-toggle" aria-label="切换为亮色">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg>
      </button>
    </div>
  </div>
</header>`;
}

function footer(snapshot) {
  const upstream = UPSTREAM.map(([name, url]) => `<li>${ext(url, name)}</li>`).join("");
  return `<footer class="site-footer">
  <div class="wrap foot-grid">
    <div>
      <h2>Awesome WorkBuddy Hub</h2>
      <p>腾讯 WorkBuddy 的社区资源档案，由 <code>data/items.json</code> 构建。收录截至 ${esc(snapshot)}。这是第三方索引，不是腾讯官方站点。</p>
    </div>
    <div>
      <h2>致谢上游</h2>
      <ul>${upstream}</ul>
    </div>
    <div>
      <h2>维护</h2>
      <ul>
        <li>${ext(REPO_URL, "GitHub 仓库")}</li>
        <li>${ext(`${REPO_URL}/blob/main/lists/README.md`, "Markdown 完整清单")}</li>
        <li>维护者 <a href="${esc(MAINTAINER_URL)}" target="_blank" rel="me noopener noreferrer">阿佐 @azuo_blog</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap">
    <p class="disclaimer">第三方 Skill 与工具在导入前请自行核对来源、许可证和权限。帖子与项目原文的版权归原作者。</p>
  </div>
</footer>`;
}

function layout({ title, description, canonical, path, jsonLd, body, scripts = [] }) {
  const fullTitle = title.includes("Awesome WorkBuddy Hub") ? title : `${title} · Awesome WorkBuddy Hub`;
  const desc = clip(description, 160);
  const url = `${SITE_URL}${canonical}`;
  const ld = jsonLd
    ? `<script type="application/ld+json">${safeJson(jsonLd)}</script>`
    : "";
  const scriptTags = scripts.map((src) => `<script ${src.module ? 'type="module" ' : ""}src="${esc(src.src)}"></script>`).join("");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="#0c0d11">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:site_name" content="Awesome WorkBuddy Hub">
<meta property="og:locale" content="zh_CN">
<meta property="og:type" content="${path === "/" ? "website" : "article"}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
${themeBoot()}
<link rel="stylesheet" href="${esc(ASSETS.css)}">
${ld}
</head>
<body>
${header()}
${body}
${footer(SNAPSHOT)}
<script src="${esc(ASSETS.ui)}"></script>
${scriptTags}
</body>
</html>
`;
}

function cardHtml(tuple, typeLabels) {
  const type = tuple[2];
  return `<a class="card" data-type="${esc(type)}" href="/item/${esc(tuple[0])}">
    <div class="card-top">
      <span class="pill" data-type="${esc(type)}">${esc(typeLabels.get(type) || type)}</span>
      <span class="cat">${esc(tuple[3])}</span>
    </div>
    <h2 class="card-title">${esc(tuple[1])}</h2>
    <p class="card-summary">${esc(tuple[4])}</p>
    <div class="card-foot">
      <span>${tuple[7]} 个来源</span>
      <span>${esc(engagement(tuple))}</span>
      <span>${esc(tuple[10] || "日期不详")}</span>
    </div>
  </a>`;
}

function chip(kind, id, label, count, pressed) {
  const attr = kind === "type" ? "data-type-value" : "data-cat-value";
  return `<button type="button" class="chip" ${attr}="${esc(id)}" aria-pressed="${pressed ? "true" : "false"}">${esc(label)}<small>${count}</small></button>`;
}

function pagerHtml(page, pages) {
  const buttons = [`<button type="button" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>上一页</button>`];
  const nums = [...new Set([1, pages, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) buttons.push('<span class="gap" aria-hidden="true">…</span>');
    buttons.push(`<button type="button" data-page="${n}" ${n === page ? 'aria-current="page"' : ""}>${n}</button>`);
    prev = n;
  }
  buttons.push(`<button type="button" data-page="${page + 1}" ${page >= pages ? "disabled" : ""}>下一页</button>`);
  return buttons.join("");
}

function sourceHtml(source) {
  const kind = source.sourceType === "github" ? "GitHub 清单" : source.sourceType === "x" ? "X" : "来源";
  const bits = [];
  if (source.authorName || source.authorHandle) {
    const who = [source.authorName, source.authorHandle ? `@${source.authorHandle}` : ""].filter(Boolean).join(" · ");
    bits.push(`<p class="src-by">${esc(who)}</p>`);
  }
  if (source.sourceType === "x") {
    const stats = [
      source.likes ? `${formatCount(source.likes)} 赞` : "",
      source.reposts ? `${formatCount(source.reposts)} 转发` : "",
      source.views ? `${formatCount(source.views)} 浏览` : "",
    ].filter(Boolean);
    if (stats.length) bits.push(`<p class="src-stats">${esc(stats.join(" · "))}</p>`);
  }
  if (source.repo) bits.push(`<p class="src-note">收录于 ${esc(source.repo)}</p>`);
  if (source.license) bits.push(`<p class="src-note">许可：${esc(source.license)}</p>`);
  if (source.note) bits.push(`<p class="src-note">${esc(source.note)}</p>`);
  return `<li class="source">
    <p class="src-kicker">${esc(kind)}${source.date ? ` · ${esc(source.date)}` : ""}</p>
    <p>${ext(source.url, source.sourceType === "github" ? "打开仓库" : "打开链接")}</p>
    ${bits.join("")}
  </li>`;
}

function relatedHtml(models) {
  if (!models.length) return "";
  const cards = models.map((model) => `<a class="side-card" href="/item/${esc(model.id)}">
      <strong>${esc(model.name)}</strong>
      <span>${esc(model.typeLabel)} · ${esc(model.category)}</span>
    </a>`).join("");
  return `<aside class="side">
    <h2>相关推荐</h2>
    <div class="side-list">${cards}</div>
  </aside>`;
}

let ASSETS = { css: "", ui: "", home: "" };
let SNAPSHOT = "";

function homePage({ total, xCount, githubCount, authors, typeMeta, categories, tuples, typeLabels }) {
  const { typeCounts, matched } = summarize(tuples, tuples.map(() => ""), { terms: [], type: "" });
  const ordered = matched.slice().sort(compareHot);
  const page = paginate(ordered, 1, PAGE_SIZE);
  const typeChips = [
    chip("type", "", "全部", total, true),
    ...typeMeta.map((item) => chip("type", item.id, item.label, typeCounts.get(item.id) || 0, false)),
  ].join("");
  const catCounts = new Map();
  for (const tuple of tuples) catCounts.set(tuple[3], (catCounts.get(tuple[3]) || 0) + 1);
  const catChips = [
    chip("cat", "", "全部分类", total, true),
    ...categories.map((item) => chip("cat", item.id, item.label, catCounts.get(item.id) || 0, false)),
  ].join("");
  const description = `腾讯 WorkBuddy 社区资源索引，收录 ${total} 条技能、工作流、教程、提示词、案例与知识点，支持全文搜索。`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Awesome WorkBuddy Hub",
        url: `${SITE_URL}/`,
        inLanguage: "zh-CN",
        description,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?q={query}`,
          "query-input": "required name=query",
        },
      },
      {
        "@type": "Organization",
        name: "Awesome WorkBuddy Hub",
        url: SITE_URL,
        sameAs: [REPO_URL, MAINTAINER_URL],
      },
    ],
  };
  const body = `<main id="content">
  <section class="hero">
    <div class="wrap">
      <p class="watermark" aria-hidden="true">${total}</p>
      <div class="hero-copy">
        <p class="eyebrow">非官方社区档案 · 截至 ${esc(SNAPSHOT)}</p>
        <h1>Awesome WorkBuddy Hub</h1>
        <p class="subhead">WorkBuddy 技能、教程与工作流索引</p>
        <p class="lede">把散落在 X 和 GitHub 上的 WorkBuddy 经验收成一座可以检索的库。每条都有独立链接，也能回到原帖或仓库。</p>
        <form class="search" id="search-form" role="search" action="/" method="get">
          <label class="sr" for="q">搜索资源</label>
          <input id="q" name="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="搜索名称、简介、标签或正文">
          <button class="btn primary" type="submit">搜索</button>
        </form>
        <p class="hint">多个词会同时匹配。按 <kbd>/</kbd> 聚焦搜索。筛选和排序在浏览器里完成，${total.toLocaleString("zh-CN")} 条也只渲染当前这一页。</p>
      </div>
      <dl class="stats">
        <div><dt>收录条目</dt><dd>${total.toLocaleString("zh-CN")}</dd></div>
        <div><dt>来自 X</dt><dd>${xCount.toLocaleString("zh-CN")}</dd></div>
        <div><dt>GitHub 清单</dt><dd>${githubCount.toLocaleString("zh-CN")}</dd></div>
        <div><dt>贡献作者</dt><dd>${authors.toLocaleString("zh-CN")}</dd></div>
      </dl>
    </div>
  </section>
  <section class="browse" id="browse">
    <div class="wrap">
      <noscript><p class="noscript">搜索、筛选和翻页需要 JavaScript。下面先按热度列出一部分条目，详情页可以直接打开。</p></noscript>
      <div class="filters">
        <div class="type-row" id="type-filters" role="group" aria-label="按类型筛选">${typeChips}</div>
        <div class="cat-row" id="cat-filters" role="group" aria-label="按分类筛选">${catChips}</div>
      </div>
      <div class="toolbar">
        <p id="result-meta" tabindex="-1">按热度 · 第 1 / ${page.pages} 页 · 共 ${page.total} 条</p>
        <div class="sort" id="sort" role="group" aria-label="排序">
          <button type="button" data-sort-value="hot" aria-pressed="true">热度</button>
          <button type="button" data-sort-value="new" aria-pressed="false">最新</button>
        </div>
      </div>
      <div class="grid" id="results" data-total="${total}">
        ${page.slice.map((tuple) => cardHtml(tuple, typeLabels)).join("")}
      </div>
      <nav class="pager" id="pager" aria-label="分页">${pagerHtml(page.page, page.pages)}</nav>
    </div>
  </section>
</main>
<script type="application/json" id="hub-boot">${safeJson({ index: ASSETS.index, pageSize: PAGE_SIZE, title: "Awesome WorkBuddy Hub — WorkBuddy 技能、教程与工作流索引" })}</script>`;
  return layout({
    title: "Awesome WorkBuddy Hub — WorkBuddy 技能、教程与工作流索引",
    description,
    canonical: "/",
    path: "/",
    jsonLd,
    body,
    scripts: [{ src: ASSETS.home, module: true }],
  });
}

function taipeiTime(iso) {
  const date = new Date(iso || "");
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function initials(name, username) {
  const source = String(name || username || "?").trim();
  if (/[\u3400-\u9fff]/.test(source)) return source.slice(0, 1);
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function hueOf(seed) {
  let hash = 0;
  for (const char of String(seed || "?")) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}

function linkifyInline(line, record) {
  let text = String(line ?? "");
  for (const url of record?.unexpanded_urls || []) {
    if (url) text = text.split(url).join("");
  }
  text = text.replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/g, "");
  const spans = [];
  const occupied = (start, end) => spans.some((span) => start < span.end && end > span.start);
  const urlRe = /https?:\/\/[^\s<>"']+/g;
  for (const match of text.matchAll(urlRe)) {
    let href = match[0].replace(/[),.;，。！？、]+$/u, "");
    if (/t\.co\//.test(href)) continue;
    const start = match.index ?? 0;
    spans.push({ start, end: start + href.length, href });
  }
  for (const link of record?.links || []) {
    if (!link?.url || !link.display || /t\.co\//.test(link.url) || text.includes(link.url)) continue;
    const start = text.indexOf(link.display);
    if (start < 0 || occupied(start, start + link.display.length)) continue;
    spans.push({ start, end: start + link.display.length, href: link.url });
  }
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  let html = "";
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    html += `${esc(text.slice(cursor, span.start))}<a href="${esc(span.href)}" target="_blank" rel="noopener noreferrer">${esc(text.slice(span.start, span.end))}</a>`;
    cursor = span.end;
  }
  return html + esc(text.slice(cursor));
}

function stripHiddenUrls(text, record) {
  let raw = String(text || "");
  for (const url of record?.unexpanded_urls || []) {
    if (url) raw = raw.split(url).join("");
  }
  return raw.replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/g, "");
}

function richText(text, record) {
  const blocks = stripHiddenUrls(text, record)
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]*\n/g, "\n\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (!blocks.length) return "";
  return blocks.map((block) => `<p>${block.split("\n").map((line) => linkifyInline(line, record)).join("<br>")}</p>`).join("");
}

function metricsHtml(metrics) {
  const rows = [
    ["likes", "赞"],
    ["reposts", "转发"],
    ["replies", "回复"],
    ["quotes", "引用"],
    ["bookmarks", "收藏"],
    ["views", "浏览"],
  ];
  const items = rows
    .filter(([key]) => Number(metrics?.[key]) > 0)
    .map(([key, label]) => `<li><strong>${esc(formatCount(metrics[key]))}</strong><span>${label}</span></li>`);
  if (!items.length) return "";
  return `<ul class="metrics">${items.join("")}</ul>`;
}

function bylineHtml(record) {
  const name = record.author_name || record.author_username || "匿名";
  const handle = record.author_username ? `@${record.author_username}` : "";
  const when = taipeiTime(record.created_at);
  return `<header class="byline">
    <span class="avatar" style="--hue:${hueOf(record.author_username || name)}" aria-hidden="true">${esc(initials(record.author_name, record.author_username))}</span>
    <span class="byline-id"><strong>${esc(name)}</strong>${handle ? `<span>${esc(handle)}</span>` : ""}</span>
    ${when ? `<time datetime="${esc(record.created_at)}">${esc(when)}</time>` : ""}
  </header>`;
}

function galleryHtml(record) {
  const photos = (record.media || []).filter((item) => item?.type === "photo" && item.local);
  const plays = (record.media || []).filter((item) => item && (item.type === "video" || item.type === "animated_gif"));
  const countClass = photos.length === 1 ? "count-1" : photos.length === 2 ? "count-2" : photos.length === 3 ? "count-3" : "count-4";
  const shots = photos.map((item) => `<button type="button" class="shot" data-lightbox="${esc(item.local)}">
      <img src="${esc(item.local)}" alt="" loading="lazy" decoding="async">
    </button>`).join("");
  const clips = plays.map((item) => {
    const thumb = item.local || item.preview_image_url || "";
    const label = item.type === "animated_gif" ? "查看动图" : "查看视频";
    return `<a class="play" href="${esc(record.url)}" target="_blank" rel="noopener noreferrer">
      ${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy" decoding="async">` : ""}
      <span class="play-badge"><span aria-hidden="true">▶</span><span class="sr">${label}</span></span>
    </a>`;
  }).join("");
  return `${shots ? `<div class="gallery ${countClass}">${shots}</div>` : ""}${clips ? `<div class="clips">${clips}</div>` : ""}`;
}

function quoteCard(quoted) {
  if (!quoted || typeof quoted !== "object") return "";
  const articleText = quoted.article?.text || "";
  const tweet = quoted.text || "";
  if (!articleText && !tweet) return "";
  const title = quoted.article?.title ? `<h3>${esc(quoted.article.title)}</h3>` : "";
  const intro = articleText && tweet ? `<div class="post-intro">${richText(tweet, quoted)}</div>` : "";
  const body = articleText ? richText(articleText, quoted) : richText(tweet, quoted);
  return `<blockquote class="quote">
    ${bylineHtml(quoted)}
    ${intro}
    ${title}
    <div class="post-body">${body}</div>
    ${galleryHtml(quoted)}
  </blockquote>`;
}

function postHtml(post) {
  const articleText = post.article?.text || "";
  const tweet = post.text || "";
  const intro = articleText && tweet ? `<div class="post-intro">${richText(tweet, post)}</div>` : "";
  const title = articleText && post.article?.title ? `<h2 class="article-title">${esc(post.article.title)}</h2>` : "";
  const body = articleText ? richText(articleText, post) : richText(tweet, post);
  const notes = [];
  if (post.media_unresolved) notes.push("原帖含更多图片，见原帖");
  if (post.text_maybe_truncated || post.article?.text_missing) notes.push("全文可能不完整，见原帖");
  return `<article class="xpost">
    ${bylineHtml(post)}
    ${metricsHtml(post.metrics)}
    ${intro}
    ${title}
    <div class="post-body${articleText ? " article-body" : ""}">${body}</div>
    ${galleryHtml(post)}
    ${quoteCard(post.quoted)}
    ${notes.map((note) => `<p class="quiet">${note}</p>`).join("")}
    ${post.url ? `<p class="origin"><a href="${esc(post.url)}" target="_blank" rel="noopener noreferrer">查看原帖</a></p>` : ""}
  </article>`;
}

function detailPage(model, related) {
  const description = model.summary || clip(model.description, 140) || `${model.name} · ${model.typeLabel}`;
  const badges = [`<span class="pill" data-type="${esc(model.type)}">${esc(model.typeLabel)}</span>`, `<span class="cat">${esc(model.category)}</span>`];
  if (model.curation === "curated") badges.push('<span class="pill">人工整理</span>');
  if (model.curation === "aggregated") badges.push('<span class="pill">清单收录</span>');
  if (model.posts.some((post) => post.article?.text) || model.hasArticle) badges.push('<span class="pill">含长文</span>');
  const tags = model.tags.map((tag) => `<li><a href="/?q=${encodeURIComponent(tag)}">${esc(tag)}</a></li>`).join("");
  const githubSources = model.sources.filter((source) => source.sourceType === "github");
  const posts = model.posts;
  const primary = posts[0] ? postHtml(posts[0]) : "";
  const more = posts.slice(1).map((post) => postHtml(post)).join("");
  const install = model.install && !posts.length
    ? `<p class="install">获取：${ext(model.install, model.install)}</p>`
    : "";
  const caution = model.type === "skill"
    ? `<p class="quiet">第三方技能导入前，请核对许可证，以及它会访问的文件、账号和网络。</p>`
    : "";
  const catalog = posts.length
    ? ""
    : `<section class="block"><h2>说明</h2>${model.summary ? `<p>${esc(model.summary)}</p>` : ""}${model.description && model.description !== model.summary ? paragraphs(model.description) : ""}${install}</section>`;
  const sourceBlock = githubSources.length
    ? `<section class="block"><h2>${posts.length ? "其他来源" : "全部来源"}</h2><ol class="sources">${githubSources.map(sourceHtml).join("")}</ol></section>`
    : (posts.length ? "" : `<section class="block"><h2>全部来源</h2><ol class="sources">${model.sources.map(sourceHtml).join("") || "<li>暂无来源链接。</li>"}</ol></section>`);
  const canonical = `/item/${model.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: model.name,
        description,
        inLanguage: model.lang === "en" ? "en" : "zh-CN",
        url: `${SITE_URL}${canonical}`,
        datePublished: posts[0]?.created_at || model.date || undefined,
        keywords: model.tags.join(", "),
        author: (posts[0]?.author_name ? [posts[0].author_name] : model.authors).map((name) => ({ "@type": "Person", name })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: model.typeLabel, item: `${SITE_URL}/?type=${encodeURIComponent(model.type)}` },
          { "@type": "ListItem", position: 3, name: model.name, item: `${SITE_URL}${canonical}` },
        ],
      },
    ],
  };
  const body = `<main class="article" id="content">
  <div class="wrap">
    <nav class="crumb" aria-label="面包屑">
      <a href="/">首页</a>
      <span aria-hidden="true">/</span>
      <a href="/?type=${encodeURIComponent(model.type)}">${esc(model.typeLabel)}</a>
      <span aria-hidden="true">/</span>
      <a href="/?type=${encodeURIComponent(model.type)}&amp;cat=${encodeURIComponent(model.category)}">${esc(model.category)}</a>
    </nav>
    <header class="article-head">
      <div class="badge-row">${badges.join("")}</div>
      <h1>${esc(model.name)}</h1>
      <div class="actions"><button type="button" class="btn" data-copy>复制本页链接</button></div>
    </header>
    <div class="layout">
      <div class="prose">
        ${primary}
        ${more ? `<section class="block related-posts"><h2>相关帖子</h2>${more}</section>` : ""}
        ${catalog}
        ${caution}
        ${sourceBlock}
        ${tags ? `<section class="block"><h2>标签</h2><ul class="tag-list">${tags}</ul></section>` : ""}
      </div>
      ${relatedHtml(related)}
    </div>
  </div>
  <dialog id="lightbox" aria-label="查看图片">
    <button type="button" class="lb-x" data-lb-close>关闭</button>
    <img alt="">
  </dialog>
</main>`;
  return layout({
    title: model.name,
    description,
    canonical,
    path: canonical,
    jsonLd,
    body,
  });
}

function notFoundPage() {
  const body = `<main class="not-found wrap" id="content">
    <p class="eyebrow">404</p>
    <h1>没有这一页</h1>
    <p class="lede">链接可能写错了，或者条目已经从索引里拿掉。回到首页可以搜索名称、标签或正文。</p>
    <p><a class="btn primary" href="/">回到首页</a></p>
  </main>`;
  return layout({
    title: "页面不存在",
    description: "Awesome WorkBuddy Hub 没有找到这个页面。",
    canonical: "/404",
    path: "/404",
    body,
  }).replace('<meta name="robots" content="index,follow">', "").replace(
    "<title>",
    '<meta name="robots" content="noindex">\n<title>',
  );
}

const raw = JSON.parse(await readFile(DATA, "utf8"));
if (!Array.isArray(raw) || raw.length === 0) throw new Error("data/items.json 为空");
const xPosts = JSON.parse(await readFile(join(REPO_DIR, "data", "x-posts.json"), "utf8"));

const typeLabels = new Map(TYPE_ORDER);
for (const item of raw) {
  if (!typeLabels.has(item.type)) typeLabels.set(item.type, item.type || "其他");
}
const typeMeta = [...typeLabels.entries()].map(([id, label]) => ({ id, label }));

const catCounts = new Map();
for (const item of raw) catCounts.set(item.category || "其他", (catCounts.get(item.category || "其他") || 0) + 1);
const categories = [...catCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh"))
  .map(([id, count]) => ({ id, label: id, count }));

const authorSet = new Set();
let snapshot = "";
const models = raw.map((item) => {
  const sources = (item.sources || []).map((source) => ({
    sourceType: source.source_type || "",
    url: source.url || "",
    authorName: source.author_name || "",
    authorHandle: source.author_handle || "",
    date: source.date || "",
    likes: source.likes || 0,
    reposts: source.reposts || 0,
    views: source.views || 0,
    repo: source.repo || "",
    note: source.note || "",
    license: source.license || "",
  }));
  const primaryUrl = item.primary_source_url || item.post_url || sources[0]?.url || "";
  sources.sort((a, b) => {
    const primary = Number(b.url === primaryUrl) - Number(a.url === primaryUrl);
    if (primary) return primary;
    return (b.date || "").localeCompare(a.date || "");
  });
  let likes = 0;
  let reposts = 0;
  let views = 0;
  let date = "";
  for (const source of sources) {
    likes += source.likes;
    reposts += source.reposts;
    views += source.views;
    if (source.date && source.date > date) date = source.date;
    if (source.authorHandle) authorSet.add(source.authorHandle.toLowerCase());
    else if (source.authorName) authorSet.add(source.authorName);
  }
  if (date > snapshot) snapshot = date;
  const summary = (item.summary || "").trim() || clip(item.description || "", 80) || "这条资源没有简介，打开详情可查看来源。";
  const authors = [...new Set(sources.map((source) => source.authorName).filter(Boolean))];
  return {
    id: item.id,
    name: (item.name || item.id).trim(),
    nameEn: (item.name_en || "").trim(),
    type: item.type || "other",
    typeLabel: typeLabels.get(item.type) || item.type || "其他",
    category: item.category || "其他",
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
    summary,
    description: (item.description || "").trim(),
    install: (item.install_or_link || "").trim(),
    curation: item.curation || "",
    hasArticle: Boolean(item.has_article),
    lang: item.lang || "",
    media: Array.isArray(item.media) ? item.media : [],
    xContext: Array.isArray(item.x_context) ? item.x_context.filter(Boolean) : [],
    sources,
    primaryUrl,
    likes,
    reposts,
    views,
    heat: likes + reposts * 2 + Math.round(Math.log10(views + 1) * 20) + Math.max(0, sources.length - 1) * 30,
    sourceCount: sources.length,
    date,
    dateNum: dateNum(date),
    authors,
    posts: Array.isArray(xPosts[item.id]?.posts) ? xPosts[item.id].posts : [],
  };
});

const byId = new Map(models.map((model) => [model.id, model]));
const byCategory = new Map();
const byType = new Map();
for (const model of models) {
  const catBucket = byCategory.get(model.category) || [];
  catBucket.push(model);
  byCategory.set(model.category, catBucket);
  const typeBucket = byType.get(model.type) || [];
  typeBucket.push(model);
  byType.set(model.type, typeBucket);
}

function scoreRelated(model, other) {
  if (other.id === model.id) return null;
  let score = other.type === model.type ? 4 : 1;
  const tags = new Set(model.tags);
  for (const tag of other.tags) {
    if (tag !== model.category && tags.has(tag)) score += 2;
  }
  score += Math.log10(other.heat + 1) * 0.2;
  return score;
}

for (const model of models) {
  const pool = byCategory.get(model.category) || [];
  const ranked = [];
  for (const other of pool) {
    const score = scoreRelated(model, other);
    if (score == null) continue;
    ranked.push([score, other.heat, other]);
  }
  ranked.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const picked = ranked.slice(0, 6).map((row) => row[2]);
  if (picked.length < 4) {
    const seen = new Set(picked.map((item) => item.id));
    seen.add(model.id);
    const fillers = (byType.get(model.type) || [])
      .filter((item) => !seen.has(item.id))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 6 - picked.length);
    picked.push(...fillers);
  }
  model.related = picked;
}

const tuples = [];
const hay = [];
for (const model of models) {
  tuples.push([
    model.id,
    model.name,
    model.type,
    model.category,
    model.summary,
    model.heat,
    model.dateNum,
    model.sourceCount,
    model.likes,
    model.views,
    model.date,
  ]);
  hay.push(norm([
    model.name,
    model.nameEn,
    model.summary,
    model.description,
    model.tags.join(" "),
    model.category,
    model.typeLabel,
    model.install,
    model.authors.join(" "),
    model.sources.map((source) => [source.authorHandle, source.note, source.repo, source.url].join(" ")).join(" "),
    model.posts.map((post) => [post.text, post.article?.title, post.author_name, post.author_username, post.quoted?.text, post.quoted?.article?.title].filter(Boolean).join(" ")).join(" "),
  ].join(" ")));
}

SNAPSHOT = snapshot || "2026-11-27";
const githubCount = models.filter((model) => model.sources.some((source) => source.sourceType === "github")).length;

const indexJson = JSON.stringify({
  types: typeMeta,
  categories,
  items: tuples,
  hay,
});

const css = await readFile(join(SITE_DIR, "src", "site.css"));
const ui = await readFile(join(SITE_DIR, "src", "ui.js"));
let home = await readFile(join(SITE_DIR, "src", "home.js"), "utf8");
const searchJs = await readFile(join(SITE_DIR, "src", "search.mjs"));
const favicon = await readFile(join(SITE_DIR, "src", "favicon.svg"));

const cssHash = hash(css);
const uiHash = hash(ui);
const searchHash = hash(searchJs);
home = home.replace('from "./search.mjs"', `from "./search.${searchHash}.js"`);
const homeHash = hash(home);
const indexHash = hash(indexJson);

ASSETS = {
  css: `/assets/site.${cssHash}.css`,
  ui: `/assets/ui.${uiHash}.js`,
  home: `/assets/home.${homeHash}.js`,
  index: `/assets/search-index.${indexHash}.json`,
};

await rm(DIST, { recursive: true, force: true });
await mkdir(join(DIST, "assets"), { recursive: true });
await mkdir(join(DIST, "item"), { recursive: true });

await writeFile(join(DIST, "assets", `site.${cssHash}.css`), css);
await writeFile(join(DIST, "assets", `ui.${uiHash}.js`), ui);
await writeFile(join(DIST, "assets", `search.${searchHash}.js`), searchJs);
await writeFile(join(DIST, "assets", `home.${homeHash}.js`), home);
await writeFile(join(DIST, "assets", `search-index.${indexHash}.json`), indexJson);
await writeFile(join(DIST, "favicon.svg"), favicon);
await cp(join(REPO_DIR, "media"), join(DIST, "media"), { recursive: true });

const indexHtml = homePage({
  total: models.length,
  xCount: models.filter((model) => model.sources.some((source) => source.sourceType === "x")).length,
  githubCount,
  authors: authorSet.size,
  typeMeta,
  categories,
  tuples,
  typeLabels,
});
await writeFile(join(DIST, "index.html"), indexHtml);
await writeFile(join(DIST, "404.html"), notFoundPage());

const started = Date.now();
await mapPool(models, 64, async (model) => {
  const html = detailPage(model, model.related);
  await writeFile(join(DIST, "item", `${model.id}.html`), html);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${models.map((model) => `  <url><loc>${SITE_URL}/item/${model.id}</loc>${model.date ? `<lastmod>${model.date}</lastmod>` : ""}</url>`).join("\n")}
  <url><loc>${SITE_URL}/</loc></url>
</urlset>
`;
await writeFile(join(DIST, "sitemap.xml"), sitemap);
await writeFile(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
await writeFile(join(DIST, "_headers"), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/media/*
  Cache-Control: public, max-age=31536000, immutable
`);

const ids = new Set(models.map((model) => model.id));
if (ids.size !== models.length) throw new Error("条目 id 有重复");
if (!indexHtml.includes('id="q"') || !indexHtml.includes("Awesome WorkBuddy Hub")) {
  throw new Error("首页缺少搜索或标题");
}
console.log(JSON.stringify({
  message: "site built",
  items: models.length,
  authors: authorSet.size,
  snapshot: SNAPSHOT,
  detailMs: Date.now() - started,
  indexBytes: Buffer.byteLength(indexJson),
  siteUrl: SITE_URL,
}));
