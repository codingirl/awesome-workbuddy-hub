# 数据说明

- 主数据：[`items.json`](items.json)（数组，每条资源一个对象；字段见 [CONTRIBUTING.md](../CONTRIBUTING.md)）。
- **原始采集数据不公开。** X 搜索原始返回、去重前的全部帖子、打分候选列表和 GitHub 搜索原始结果仅保存在维护者本地，不纳入本仓库与 git 历史，以避免把未筛选内容和过大快照公开发布。公开可复现的是本文件中的方法说明，以及 `items.json` 中每条资源的来源链接。

## X 采集方法
- 采集时间：2026-11-27（Asia/Taipei）。时间范围：2026-03-08 ～ 2026-11-27（WorkBuddy 于 2026-03-09 上线）。
- 工具：X 公共全量搜索（search_posts_all）。
- 主查询：`workbuddy (skill OR skills OR 技能 OR SKILL.md OR 教程 OR 技巧 OR 工作流 OR 提示词 OR 实测 OR tutorial OR workflow OR prompt) -is:retweet -is:reply`，`sort_order=relevancy`，按 2–4 天窗口逐段检索（3 月至 4 月窗口较宽，11 月窗口较密）。
- 补充查询：`workbuddy (github.com OR 开源 OR "open source" OR 安装) -is:retweet -is:reply`（2 周内窗口）；以及早期的 skill/技能/教程/技巧/工作流/提示词 全局关键词探测。
- 结果：原始帖子 2,452 条（去重后）；含 WorkBuddy 且命中关键词的候选 1,430 条；按启发式打分（点赞、是否长文、是否含 GitHub 链接、关键词）取分数≥4 并剔除广告/邀请/币圈等噪声后，整理为 425 条 X 条目（共 432 篇来源帖、269 位作者）。

## GitHub 来源
sandbaseai/awesome-workbuddy（在线目录 `site/resources.json`，554 条）、semlinker/awesome-workbuddy、AlephAITech/WorkBuddyGuide（章节与社区案例）、yehuzi2026/workbuddy-skills-hub、weininghui/skills、shuangying0001-beep/awesome-workbuddy-skills、sandbaseai/workbuddy-skill，以及 GitHub 搜索发现的其他 WorkBuddy 相关仓库（stars≥30，排除账号池/网关/签到类）。简介以简短摘要形式保留并链接回原仓库；CC0/MIT 来源按其许可署名，未声明许可证的仓库只保留名称、链接与简短描述。

## 局限
- 搜索使用 relevancy 排序，每个时间窗口最多返回约 25 条最相关结果，**密集时段（尤其 10–11 月）仍会漏掉低互动的帖子**；已排除回复（`-is:reply`），线程中的补充内容可能遗漏。
- X 条目的分类、标题、简介主要由规则自动生成（`curation: auto`），仅约 40 条为人工整理（`curated`）；部分标题可能是原帖首句截断，欢迎 PR 修正。
- 受限于 X 返回，部分长文（X Article）只拿到标题或前部分正文；点赞/浏览数为采集时快照。
- 未能识别所有同名其他产品的帖子（如币圈 $WorkBuddy），已用关键词做了基础过滤。
- GitHub 清单内容随上游更新而变化；本仓库为 2026-11-27 的快照。
