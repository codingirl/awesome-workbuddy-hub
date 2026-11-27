# 数据说明

- 主数据：[`items.json`](items.json)（数组，每条资源一个对象；字段见 [CONTRIBUTING.md](../CONTRIBUTING.md)）。
- **原始采集数据不公开。** X 搜索原始返回、去重前的全部帖子、打分候选列表和 GitHub 搜索原始结果仅保存在维护者本地，不纳入本仓库与 git 历史，以避免把未筛选内容和过大快照公开发布。公开可复现的是本文件中的方法说明，以及 `items.json` 中每条资源的来源链接。

## X 采集方法
- 采集时间：2026-11-27（Asia/Taipei）。时间范围：2026-03-06 ～ 2026-11-27（WorkBuddy 于 2026-03-09 上线）。
- 工具：X 公共全量搜索（search_posts_all），按时间倒序逐页翻页。
- 主查询（“并集查询”）：`workbuddy (skill OR skills OR 技能 OR SKILL.md OR 教程 OR 技巧 OR 工作流 OR 提示词 OR 实测 OR tutorial OR workflow OR prompt) -is:retweet -is:reply`。2026-09-01 至 2026-11-27 按**单日**窗口完整翻页；2026-07、08 月按单日窗口（前 2–3 页）；2026-06 按 2 日窗口；3–5 月按 4–20 天宽窗口逐页翻到窗口起点。
- 补充查询：①`from:`（15 位高产作者与官方账号）+ `workbuddy`（含回复，3 月至 11 月，按月窗口翻页，未翻完）；②别名探测（"Work Buddy"、"腾讯小龙虾"、"WorkBuddy skill" 等，仅第 1 页，噪声较大，由 `workbuddy` 字面匹配过滤）；③早期的 skill/技能/教程/技巧/工作流/提示词/github 关键词探测。
- 结果（本次快照）：原始帖子 7,729 条（按帖子 ID 去重）；其中正文或长文含 “workbuddy” 的 5,847 条；放宽门槛后（见下）候选 4,636 条；去重（同 GitHub 链接 / 同作者同标题 / 不同作者几乎相同的开头合并）后整理为 4,328 条 X 条目（4,564 篇来源帖、2,532 位作者）。
- 收录门槛（刻意放宽）：**没有点赞/互动门槛**；只要含 “workbuddy” 且有信息量（带 X 长文标题，或正文 ≥60 字并含技能/教程/工作流/功能/更新/报错/对比等信号）即收录。剔除：广告、邀请码/返佣/积分拉新、币圈（$WorkBuddy、合约地址等）、抽奖/互关/引流、转帖（RT）、短回复和无信息量闲聊。
- 排序/精选：README 只展示精选（GitHub 清单收录、人工整理、多来源、X 上 ≥60 赞）；全部条目见 [`lists/`](../lists/README.md)。

## GitHub 来源
sandbaseai/awesome-workbuddy（在线目录 `site/resources.json`，554 条）、semlinker/awesome-workbuddy、AlephAITech/WorkBuddyGuide（章节与社区案例）、yehuzi2026/workbuddy-skills-hub、weininghui/skills、shuangying0001-beep/awesome-workbuddy-skills、sandbaseai/workbuddy-skill，以及 GitHub 搜索发现的其他 WorkBuddy 相关仓库（stars≥30，排除账号池/网关/签到类）。简介以简短摘要形式保留并链接回原仓库；CC0/MIT 来源按其许可署名，未声明许可证的仓库只保留名称、链接与简短描述。

## 局限
- X 全量搜索每页最多 25 条，且每日读取额度有限：2026-09～11 覆盖较完整；**2026-06～08 每个窗口只翻了前几页，07/08 月早间（UTC 0–3 点）的尾页未翻完；3–5 月窗口内帖子很少，已翻到头**。高产作者的 `from:` 时间线只翻了每月前 1–3 页，**仍有大量遗漏**（作者回复、纯提及 “workbuddy” 而不含并集关键词的帖子，尤其 9–11 月）。
- 并集查询带 `-is:reply`，线程里的补充和回复会遗漏；只含图片/视频、没有文字的帖子无法判断内容，已丢弃。
- X 条目的类型、分类、标题、简介主要由**规则自动生成**（`curation: auto`，约 4,281 条），仅 37 条为人工整理（`curated`）；类型/分类可能有误，标题多为原帖首句截断，欢迎 PR 修正。
- 部分长文（X Article）只拿到标题或前部分正文；点赞/浏览数为采集时快照。
- 未能识别所有同名其他产品的帖子，已用关键词做了基础过滤；个别帖子可能是对 WorkBuddy 的负面评论或吐槽，收录不代表认同。
- GitHub 清单内容随上游更新而变化；本仓库为 2026-11-27 的快照。
