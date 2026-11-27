# 参与贡献

欢迎补充、纠错、合并重复条目。

## 条目格式
`data/items.json` 中每条资源包含：`id`、`type`（skill/workflow/tutorial/knowledge/prompt/case/other）、`name`、`name_en`、`category`、`tags`、`summary`、`description`、`install_or_link`、`sources[]`（`source_type`: x/github，含 url、作者、日期、点赞等）、`media`、`lang`、`curation`（curated=人工整理，auto=规则自动整理，aggregated=来自 GitHub 清单）。

## 提交流程
1. 新增或修改条目：编辑 `data/items.json`（保持 JSON 合法），并同步更新 `items/<id>.md`（或运行 `python3 scripts/gen.py` 重新生成 README 与详情页）。
2. 每条必须至少有一个可访问的来源链接；同一内容多人分享请合并到一条，把所有来源写入 `sources`。
3. 简介请用自己的话概括（一句话，≤70 字），不要整段复制他人内容；原文只做简短节选并保留来源。
4. 不收录：广告、邀请码/返佣、账号池/反代网关/积分刷取工具、币圈内容、无实质信息的闲聊。
5. 第三方 Skill 请注明许可证（如已知），并提醒使用前审阅权限。

## 自动化脚本
- `scripts/x.py`：从已采集的 X 候选帖生成条目；`scripts/merge.py`：与 GitHub 清单合并去重并生成 `data/items.json`；`scripts/gen.py`：生成 README、`lists/*.md` 与 `items/*.md`。
- `tools/ingest.py`（把采集页合并为 posts_all.json）、`tools/rank.py`（放宽门槛的候选筛选）、`tools/parse.py`（解析工具）。原始抓取数据不在本仓库中，如需复跑采集脚本，请自备数据目录。

提交内容即视为以 CC0-1.0 授权你写的简介与分类。
