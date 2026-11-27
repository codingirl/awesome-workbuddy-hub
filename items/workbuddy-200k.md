# WorkBuddy 更新后，默认上下文统一降到 200K；手动调高，重…

> 类型：知识点与使用技巧 ｜ 分类：效率 ｜ 标签：效率

## 简介

WorkBuddy 更新后，默认上下文统一降到 200K；手动调高，重启或新开对话又会被覆盖。Mac：launchd 监听配置，defau…

## 详情

以下内容整理自原帖/文章（节选，未做编造；完整内容请见来源链接）：

> WorkBuddy 更新后，默认上下文统一降到 200K；手动调高，重启或新开对话又会被覆盖。Mac：launchd 监听配置，defaultLength 降低就自动修回上限，5 分钟轮询兜底。已拦住 9 次，5.4.4→5.5.1 仍有效。安装 Prompt 见图 3。Windows 可换 FileSystemWatcher + Task Scheduler（未实测）。

## 使用/获取


## 所有来源

- X · [yu chen @yuchen2r](https://x.com/yuchen2r/status/2095193566947807529) · 2026-09-02 · 0 赞 / 15 浏览

---
*由 awesome-workbuddy-collection 整理；仅含自写简介与原文节选，版权归原作者所有。*
