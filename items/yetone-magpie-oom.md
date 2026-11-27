# @yetone magpie 今天把我机器 OOM 干掉了几次，查了下。

> 类型：知识点与使用技巧 ｜ 分类：数据分析 ｜ 标签：数据分析

## 简介

@yetone magpie 今天把我机器 OOM 干掉了几次，查了下。 我的场景：Pi → magpie(Responses) → Wo…

## 详情

> @yetone magpie 今天把我机器 OOM 干掉了几次，查了下。 我的场景：Pi → magpie(Responses) → WorkBuddy 插件。带图片就崩，不带图就没事。 插件通道把 body 再 base64 编码一次，实测 4.0x 放大（1/8/32MB 全是 4.0x）；而这批数据等著的队列 writeReq 没有 size 字段，只按条数记账

## 使用/获取


## 所有来源

- X · [zzjcool @zzjcoo](https://x.com/zzjcoo/status/2112541857167348126) · 2026-10-20 · 0 赞 / 35 浏览

---
*由 awesome-workbuddy-collection 整理；简介为自写，原文版权归原作者所有。*
