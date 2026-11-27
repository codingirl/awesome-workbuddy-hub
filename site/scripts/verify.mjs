import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compareHot, norm, paginate, summarize, termsOf } from "../src/search.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

assert.equal(norm("Work-Buddy，技能"), "workbuddy技能");
assert.deepEqual(termsOf("  PPT   技能 "), ["ppt", "技能"]);

const sample = [
  ["a", "甲技能", "skill", "办公文档", "做 PPT", 10, 20261101, 1, 3, 0, "2026-11-01"],
  ["b", "乙教程", "tutorial", "开发", "别的内容", 2, 20260101, 1, 0, 10, "2026-01-01"],
];
const hay = [norm("甲技能 做 PPT 办公文档"), norm("乙教程 别的内容 开发")];
const { typeCounts, matched } = summarize(sample, hay, { terms: termsOf("ppt"), type: "" });
assert.equal(matched.length, 1);
assert.equal(matched[0][0], "a");
assert.equal(typeCounts.get("skill"), 1);
const page = paginate(matched.slice().sort(compareHot), 1, 24);
assert.equal(page.total, 1);

const html = await readFile(join(dist, "index.html"), "utf8");
assert.match(html, /Awesome WorkBuddy Hub/);
assert.match(html, /id="q"/);
assert.match(html, /id="type-filters"/);
assert.match(html, /data-sort-value="hot"/);
const boot = JSON.parse(html.match(/<script type="application\/json" id="hub-boot">([\s\S]*?)<\/script>/)[1]);
const index = JSON.parse(await readFile(join(dist, boot.index), "utf8"));
assert.equal(index.items.length, index.hay.length);
assert.ok(index.items.length > 1000, "索引条目过少");
const total = Number(html.match(/data-total="(\d+)"/)[1]);
assert.equal(total, index.items.length);

const found = summarize(index.items, index.hay, { terms: termsOf("zhijian"), type: "skill" });
assert.ok(found.matched.some((item) => item[0] === "zhijian-skills"), "全文索引应能找到 Zhijian Skills");
const office = found.matched.filter((item) => item[3] === "办公文档");
assert.ok(office.some((item) => item[0] === "zhijian-skills"));

const started = performance.now();
const broad = summarize(index.items, index.hay, { terms: termsOf("workbuddy 技能"), type: "" });
broad.matched.slice().sort(compareHot);
const spent = performance.now() - started;
assert.ok(spent < 250, `搜索过慢: ${spent.toFixed(1)}ms`);

assert.equal(index.items.length, 3368);
assert.match(html, /awesome-workbuddy-hub\.azuoblog\.workers\.dev/);
assert.doesNotMatch(html, /五千条/);

const detail = await readFile(join(dist, "item", "zhijian-skills.html"), "utf8");
assert.match(detail, /<link rel="canonical" href="https:\/\/awesome-workbuddy-hub\.azuoblog\.workers\.dev\/item\/zhijian-skills">/);
assert.match(detail, /Zhijian Skills/);
assert.match(detail, /相关推荐/);
assert.match(detail, /查看原帖/);
assert.match(detail, /og:title/);
assert.match(detail, /https:\/\/github.com\/zjp1997720\/zhijian-skills/);
assert.doesNotMatch(detail, /打开主要来源/);
assert.doesNotMatch(detail, /节选/);

const photos = await readFile(join(dist, "item", "agent-37.html"), "utf8");
assert.match(photos, /\/media\/x\/3_2071786867192987648\.jpg/);
assert.match(photos, /data-lightbox=/);
assert.match(photos, /class="avatar"/);
assert.doesNotMatch(photos, /<video/);

const article = await readFile(join(dist, "item", "skill-2.html"), "utf8");
assert.match(article, /几千人催我做的公众号排版 Skill，开源了!/);
assert.match(article, /article-body/);
assert.match(article, /class="post-intro"/);

const quoted = await readFile(join(dist, "item", "workbuddy-95.html"), "utf8");
assert.match(quoted, /class="quote"/);

const github = await readFile(join(dist, "item", "sensenova-skills.html"), "utf8");
assert.match(github, /打开仓库/);
assert.match(github, /https:\/\/github.com\/OpenSenseNova\/SenseNova-Skills/);
assert.doesNotMatch(github, /查看原帖/);
assert.doesNotMatch(github, /打开主要来源/);

await access(join(dist, "media", "x", "3_2071786867192987648.jpg"));
await access(join(dist, "x-posts.json")).then(() => {
  throw new Error("不应把 x-posts.json 发布到站点");
}, (error) => {
  if (error.code !== "ENOENT") throw error;
});

const sitemap = await readFile(join(dist, "sitemap.xml"), "utf8");
const locs = sitemap.match(/<loc>/g) || [];
assert.equal(locs.length, index.items.length + 1);
assert.match(sitemap, /https:\/\/awesome-workbuddy-hub\.azuoblog\.workers\.dev\/item\/zhijian-skills</);

const robots = await readFile(join(dist, "robots.txt"), "utf8");
assert.match(robots, /Sitemap:/);
const missing = await readFile(join(dist, "404.html"), "utf8");
assert.match(missing, /noindex/);
assert.match(missing, /没有这一页/);

const wrangler = await readFile(join(root, "wrangler.jsonc"), "utf8");
assert.match(wrangler, /"name": "awesome-workbuddy-hub"/);
assert.match(wrangler, /"directory": "\.\/dist"/);
assert.match(wrangler, /"not_found_handling": "404-page"/);

console.log(JSON.stringify({
  message: "site verified",
  items: index.items.length,
  searchMs: Math.round(spent),
  queryHits: broad.matched.length,
}));
