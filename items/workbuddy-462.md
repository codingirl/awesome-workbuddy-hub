# WorkBuddy 接入第三方/自定义模型踩了一个坑：

> 类型：知识点与使用技巧 ｜ 分类：效率 ｜ 标签：效率

## 简介

WorkBuddy 接入第三方/自定义模型踩了一个坑： 同一套 vLLM + Qwen3.8-27B 后端： WorkBuddy：❌ 思考…

## 详情

以下内容整理自原帖/文章（节选，未做编造；完整内容请见来源链接）：

> WorkBuddy 接入第三方/自定义模型踩了一个坑： 同一套 vLLM + Qwen3.8-27B 后端： WorkBuddy：❌ 思考过程不显示 OpenCode：✅ 正常显示 Cherry Studio：✅ 正常显示 一开始以为是 WorkBuddy 的问题，排查后发现是 reasoning 字段兼容性。 vLLM 0.28 的流式响应发送的是： delta.reasoning

## 使用/获取


## 所有来源

- X · [刚哥 @guntherjourney](https://x.com/guntherjourney/status/2093495467363738092) · 2026-08-29 · 0 赞 / 119 浏览

---
*由 awesome-workbuddy-collection 整理；仅含自写简介与原文节选，版权归原作者所有。*
