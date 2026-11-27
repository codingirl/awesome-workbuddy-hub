import json,re,os,shutil,collections
I=json.load(open('data/items.json'))
shutil.rmtree('items',ignore_errors=True); os.makedirs('items')
TN={'skill':'技能（Skills）','workflow':'工作流','tutorial':'教程与指南','knowledge':'知识点与使用技巧','prompt':'提示词','case':'案例与实测','other':'工具与其他资源'}
TE={'skill':'Skills','workflow':'Workflows','tutorial':'Tutorials & Guides','knowledge':'Knowledge & Tips','prompt':'Prompts','case':'Cases & Reviews','other':'Tools & Misc'}
CATS=["办公文档","内容创作","数据分析","设计","开发","营销","自动化","学习教程","行业应用","工具集成","效率","官方动态","其他"]
def esc(s): return re.sub(r'([\[\]])',r'\\\1',s or '').replace('\n',' ')
def one(s,n=110): 
    s=re.sub(r'\s+',' ',s or '').strip(); return s if len(s)<=n else s[:n-1]+'…'
def srcline(s):
    if s['source_type']=='x':
        m=[]
        if s.get('likes') is not None: m.append(f"{s['likes']} 赞")
        if s.get('reposts'): m.append(f"{s['reposts']} 转")
        if s.get('views'): m.append(f"{s['views']} 浏览")
        return f"- X · [{s.get('author_name','')} @{s.get('author_handle','')}]({s['url']}) · {s.get('date','')}"+(' · '+' / '.join(m) if m else '')
    extra=[]
    if s.get('license'): extra.append('许可：'+str(s['license']))
    if s.get('note'): extra.append(str(s['note']))
    return f"- GitHub · [{s.get('repo','')}]({s['url']})"+(' · '+' · '.join(extra) if extra else '')
for it in I:
    L=[f"# {it['name']}",'']
    meta=[f"类型：{TN[it['type']]}",f"分类：{it['category']}"]
    if it.get('tags'): meta.append('标签：'+'、'.join(it['tags']))
    L+=['> '+' ｜ '.join(meta),'']
    if it.get('name_en'): L+=[f"英文名/标识：`{it['name_en']}`",'']
    L+=['## 简介','',it['summary'] or it['name'],'','## 详情','']
    if it['source_type']=='x' and it.get('description') and not it['sources'][0]['source_type']=='github':
        L+=['以下内容整理自原帖/文章（节选，未做编造；完整内容请见来源链接）：','','> '+re.sub(r'\n+','\n> ',it['description'].strip()),'']
    else:
        L+=[f"本条目收录自社区资源索引，简介见上；具体功能、适用场景与限制请以原项目页面为准。",'']
        for c in it.get('x_context',[])[:2]: L+=['X 上相关分享（节选）：','','> '+c.replace('\n',' '),'']
    L+=['## 使用/获取','']
    if it.get('install_or_link'): L+=[f"- 链接：<{it['install_or_link']}>"]
    if it['type']=='skill': L+=['- 一般做法：按原项目 README / `SKILL.md` 的说明，把 Skill 导入 WorkBuddy（或放入技能目录）。','- ⚠️ 安装第三方 Skill 前请审阅其来源、许可证、会访问的文件/账号/网络权限。']
    elif it['type']=='prompt': L+=['- 提示词请到原帖/文章中获取完整版本，按自己的场景改写后使用。']
    L+=['']
    if it.get('media'): L+=['## 配图（来自原帖）','']+[f"![]({m})" for m in it['media'][:2]]+['']
    L+=['## 所有来源','']+[srcline(s) for s in it['sources']]+['']
    L+=['---','*由 awesome-workbuddy-collection 整理；仅含自写简介与原文节选，版权归原作者所有。*','']
    open(f"items/{it['id']}.md",'w',encoding='utf8').write('\n'.join(L))
def entry(it):
    link=it.get('install_or_link') or it['primary_source_url']
    xs=sum(1 for s in it['sources'] if s['source_type']=='x'); gs=len(it['sources'])-xs
    badge=(' 𝕏' if xs else '')+(' ⌥' if gs else '')
    return f"- [{esc(it['name'])}]({link}) — {esc(one(it["summary"] or it["name"],70))} · [详情](items/{it['id']}.md){badge}"
st=collections.Counter(i['type'] for i in I)
nx=sum(1 for i in I if any(s['source_type']=='x' for s in i['sources'])); ng=sum(1 for i in I if any(s['source_type']=='github' for s in i['sources']))
R=['# Awesome WorkBuddy 资源合集','','维护者：[阿佐](https://x.com/azuo_blog)（X [@azuo_blog](https://x.com/azuo_blog)）','','致谢上游：[sandbaseai/awesome-workbuddy](https://github.com/sandbaseai/awesome-workbuddy)、[semlinker/awesome-workbuddy](https://github.com/semlinker/awesome-workbuddy)、[AlephAITech/WorkBuddyGuide](https://github.com/AlephAITech/WorkBuddyGuide)、[yehuzi2026/workbuddy-skills-hub](https://github.com/yehuzi2026/workbuddy-skills-hub)、[shuangying0001-beep/awesome-workbuddy-skills](https://github.com/shuangying0001-beep/awesome-workbuddy-skills)、[sandbaseai/workbuddy-skill](https://github.com/sandbaseai/workbuddy-skill) 以及 X 上的分享者。','','> 腾讯 **WorkBuddy**（AI 办公智能体 / 桌面 Agent）的技能、教程、工作流、提示词、案例与知识点合集——整理自 X（Twitter）社区分享与多个开源 GitHub 清单，已去重、分类，每条附简介、详情页与全部来源链接。','',
f"**{len(I)} 条资源**（技能 {st['skill']} · 工作流 {st['workflow']} · 教程 {st['tutorial']} · 知识点 {st['knowledge']} · 提示词 {st['prompt']} · 案例 {st['case']} · 工具/其他 {st['other']}）｜来自 X：{nx} 条 · 来自 GitHub 清单：{ng} 条｜[English](README.en.md)",'',
'> ⚠️ 这是第三方、社区整理的索引，非腾讯官方。第三方 Skill/工具使用前请审阅来源、许可证与权限；X 数据采集时间 2026-11-27，详见 [data/README.md](data/README.md)。','',
'图例：𝕏 = X 上有人分享　⌥ = 收录于开源 GitHub 清单。数据：[data/items.json](data/items.json)。','','## 目录','']
for t in TN: R.append(f"- [{TN[t]}](#{t}) （{st[t]}）")
R.append('- [完整清单（lists/）](lists/README.md)')
R.append('- [数据来源与致谢](#数据来源与致谢)\n- [参与贡献](#参与贡献) · [CONTRIBUTING.md](CONTRIBUTING.md)\n')
CSLUG={"办公文档":"office","内容创作":"content","数据分析":"data","设计":"design","开发":"dev","营销":"marketing","自动化":"automation","学习教程":"learning","行业应用":"industry","工具集成":"integration","效率":"productivity","官方动态":"official","其他":"other"}
def feat(it):
    lk=sum((s.get('likes') or 0) for s in it['sources'])
    return any(s['source_type']=='github' for s in it['sources']) or it.get('curation')=='curated' or len(it['sources'])>1 or lk>=60
shutil.rmtree('lists',ignore_errors=True); os.makedirs('lists')
LI=['# 完整清单（按类型 / 分类）','','README 只展示精选（GitHub 清单收录、人工整理、多来源、X 上 ≥60 赞）；这里是**全部**条目。','']
for t in TN:
    R+=[f'<a id="{t}"></a>',f'## {TN[t]}','']
    LI+=[f'## {TN[t]}','']
    grp=collections.defaultdict(list)
    for it in I:
        if it['type']==t: grp[it['category']].append(it)
    for c in CATS:
        if not grp[c]: continue
        fn=f"{t}-{CSLUG[c]}.md"
        allg=sorted(grp[c],key=lambda i:-sum((s.get('likes') or 0) for s in i['sources']))
        open('lists/'+fn,'w',encoding='utf8').write('\n'.join([f"# {TN[t]} · {c}（{len(allg)}）",'','[← 返回 README](../README.md) · [全部清单](README.md)','']+[entry(i).replace('](items/','](../items/') for i in allg])+'\n')
        LI.append(f"- [{c}（{len(allg)}）]({fn})")
        sel=[i for i in allg if feat(i)]
        R+=[f"<details{' open' if len(sel)<=12 else ''}>",f"<summary><b>{c}</b>（精选 {len(sel)} / 全部 {len(allg)}）</summary>",'']
        R+=[entry(i) for i in sel]+['',f"👉 [查看该分类全部 {len(allg)} 条](lists/{fn})",'','</details>','']
    LI.append('')
open('lists/README.md','w',encoding='utf8').write('\n'.join(LI)+'\n')
R+=['## 数据来源与致谢','','- **X（Twitter）**：通过 X 公共搜索（关键词含 workbuddy + skill/技能/教程/技巧/工作流/提示词/实测 等，2026-03-08 起）采集并去重，每条保留原帖链接与作者署名。',
'- GitHub 开源清单（只做索引与链接，简介为简短摘要，内容版权归各项目作者）：',
'  - [sandbaseai/awesome-workbuddy](https://github.com/sandbaseai/awesome-workbuddy)（CC0）及其在线目录数据',
'  - [semlinker/awesome-workbuddy](https://github.com/semlinker/awesome-workbuddy)（CC0）',
'  - [AlephAITech/WorkBuddyGuide](https://github.com/AlephAITech/WorkBuddyGuide)（MIT）— 实战蓝皮书章节与社区案例',
'  - [yehuzi2026/workbuddy-skills-hub](https://github.com/yehuzi2026/workbuddy-skills-hub)（MIT/混合，见其 PROVENANCE.md）',
'  - [shuangying0001-beep/awesome-workbuddy-skills](https://github.com/shuangying0001-beep/awesome-workbuddy-skills)（未声明许可证，仅收录名称、链接与简短描述）',
'  - [sandbaseai/workbuddy-skill](https://github.com/sandbaseai/workbuddy-skill)（Skill Atlas）及 GitHub 搜索发现的其他 WorkBuddy 相关仓库',
'- 已排除：账号池/反代网关/积分签到刷取类工具（可能违反服务条款），以及广告、邀请码、币圈内容。','',
'## 参与贡献','','欢迎 PR 补充或纠错，见 [CONTRIBUTING.md](CONTRIBUTING.md)。','','## 许可','','本仓库自写内容（简介、分类、结构）以 [CC0-1.0](LICENSE) 释出；被收录项目与帖子版权归原作者，详见各详情页“所有来源”。','']
open('README.md','w',encoding='utf8').write('\n'.join(R))
# English readme (compact)
E=['# Awesome WorkBuddy Collection','','Maintainer: [Azo / 阿佐](https://x.com/azuo_blog) ([@azuo_blog](https://x.com/azuo_blog) on X).','','Thanks to upstream lists: sandbaseai/awesome-workbuddy, semlinker/awesome-workbuddy, AlephAITech/WorkBuddyGuide, yehuzi2026/workbuddy-skills-hub, shuangying0001-beep/awesome-workbuddy-skills, and sandbaseai/workbuddy-skill, plus everyone who shared on X.','',f"A curated, de-duplicated index of **{len(I)}** community resources for Tencent **WorkBuddy** (AI desktop work agent): skills, workflows, tutorials, prompts, cases and tips — collected from X (Twitter) posts and several open-source GitHub lists. Each entry links to its original sources.",'',
f"Skills {st['skill']} · Workflows {st['workflow']} · Tutorials {st['tutorial']} · Knowledge {st['knowledge']} · Prompts {st['prompt']} · Cases {st['case']} · Tools/Other {st['other']}",'',
'- Full list (Chinese-first descriptions): [README.md](README.md)','- Machine-readable data: [data/items.json](data/items.json); method and limits: [data/README.md](data/README.md)','- Per-item detail pages: [items/](items/)','- Complete per-category lists: [lists/](lists/README.md)','',
'> Unofficial third-party index, not affiliated with Tencent. Review the source, license and permissions before installing any third-party skill.','','## Top shared on X (by likes)','']
xs=sorted([i for i in I if i['source_type']=='x'],key=lambda i:-sum((s.get('likes') or 0) for s in i['sources']))[:25]
E+=[f"- [{esc(i['name'])}]({i.get('install_or_link') or i['primary_source_url']}) — {TE[i['type']]} · [details](items/{i['id']}.md)" for i in xs]
E+=['','## Sources','','sandbaseai/awesome-workbuddy (CC0), semlinker/awesome-workbuddy (CC0), AlephAITech/WorkBuddyGuide (MIT), yehuzi2026/workbuddy-skills-hub, shuangying0001-beep/awesome-workbuddy-skills, sandbaseai/workbuddy-skill, plus X search results.','','License of our own text: CC0-1.0.','']
open('README.en.md','w',encoding='utf8').write('\n'.join(E))
print(os.path.getsize('README.md'),len(os.listdir('items')))
