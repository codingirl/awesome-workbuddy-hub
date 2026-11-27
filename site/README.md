# Awesome WorkBuddy Hub

本目录是仓库的在线目录：从 `../data/items.json` 预渲染静态 HTML，再用 Cloudflare Workers 的静态资源（Workers Assets，不是 Pages）托管。首页搜索、筛选、排序和分页在浏览器里完成。

Worker 名称是 `awesome-workbuddy-hub`，必须和 Cloudflare 后台里的 Worker 名称一致。

## 本地

需要 Node.js 20 或更新版本。

```bash
cd site
npm ci
npm run build
npm test
npm run dev
```

`npm run dev` 会先构建，再用 `wrangler dev` 在本地打开站点（默认 <http://localhost:8787>）。

可以直接打开：

- 首页：<http://localhost:8787/>
- 详情：<http://localhost:8787/item/zhijian-skills>
- 带筛选的首页：<http://localhost:8787/?type=skill&cat=%E5%8A%9E%E5%85%AC%E6%96%87%E6%A1%A3&q=ppt>

数据更新后重新执行 `npm run build` 即可，不需要改页面代码。构建会读取仓库根目录的 `data/items.json`，并写入 `site/dist/`（不要提交这个目录）。

正式域名还没定时，canonical、Open Graph 和 `sitemap.xml` 默认使用 `https://awesome-workbuddy-hub.workers.dev`。绑定自定义域名后，构建前设置：

```bash
SITE_URL=https://your.domain npm run build
```

## 部署一：Cloudflare Workers Builds

把这个 GitHub 仓库接到 Worker 上，推送后自动构建并部署。Workers Builds **不会**读取 `wrangler.jsonc` 里的自定义 build 命令，所以要在后台单独填构建命令。

1. 打开 [Workers 和 Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)，创建 Worker，名称填 `awesome-workbuddy-hub`。
2. 进入该 Worker 的 **Settings → Builds → Connect**，选择本仓库和分支 `main`。
3. 构建配置：
   - **Root directory**：`site`
   - **Build command**：`npm ci && npm run build`
   - **Deploy command**：`npx wrangler deploy`
4. 若使用自定义域名，在 **Build variables** 里加上 `SITE_URL`（例如 `https://hub.example.com`），然后重新构建。
5. 保存后推一次 `main`，或在 Builds 页面重试构建。

默认会监听仓库里任意文件的变更，所以更新 `data/items.json` 也会触发重新部署。不需要把 API Token 放进仓库；Workers Builds 会用 Cloudflare 账号自己的令牌。

后台 Worker 名称必须等于 `wrangler.jsonc` 的 `name`。Root directory 保持 `site`，这样 Wrangler 才能找到同目录的配置，并把 `./dist` 作为静态资源目录。

## 部署二：本机 wrangler deploy

在本机登录过 Cloudflare（`npx wrangler login`），或在环境里提供 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`：

```bash
cd site
npm ci
npm run deploy
```

`npm run deploy` 会先构建再执行 `wrangler deploy`。只上传、不重新构建时，在 `site/` 里执行 `npx wrangler deploy`（需要已经有 `dist/`）。

## GitHub Actions

`.github/workflows/workers.yml` 会在 pull request 和 `main` 上构建并运行 `npm test`。只有推到 `main`、且仓库 secrets 里同时存在下面两项时才会部署：

- `CLOUDFLARE_API_TOKEN`：令牌权限包含 Workers Scripts 的编辑（Account → Workers Scripts → Edit）
- `CLOUDFLARE_ACCOUNT_ID`：账号 ID

没有这两项时，部署步骤会跳过并成功结束，不会假装已经上线。Workers Builds 和 GitHub Actions 二选一即可，避免同一分支部署两次。
