import json,re,collections,hashlib
R=json.load(open('data/raw/x_ranked_candidates.json'))
OFFICIAL={'workbuddy_ai','tencentcloud','tencenthunyuan','codebuddy_ai','tencentai_news'}
NOISE=re.compile(r'邀请码|邀请积分|返佣|空投|\$WorkBuddy|注册就送|注册送|拉新|免费领|0x[0-9a-f]{20}|卖WorkBuddy教程赚|月入\d+万|赚了\d+万|薅|白嫖|代充|充值|转让|出售账号|号池',re.I)
def clean(t):
    t=re.sub(r'https?://\S+','',t or '')
    t=re.sub(r'[ \t]+',' ',t)
    t=re.sub(r'\n{2,}','\n',t).strip()
    return t
def first_line(t,n=36):
    for l in t.split('\n'):
        l=l.strip(' ·•-—#*【】[]')
        if len(l)>=6: return (l if len(l)<=n else l[:n-1]+'…')
    return t[:n]
def clip(s,n):
    s=re.sub(r'\s+',' ',s).strip()
    return s if len(s)<=n else s[:n-1]+'…'
def ptype(t):
    h=t[:130]
    if re.search(r'skill|技能|SKILL\.md',h,re.I) and re.search(r'开源|发布|分享|做了|做的|推荐|合集|安装|github|仓库|install|上架|新增|制作|封装|蒸馏|清单|盘点|\d+\s*个',h,re.I): return 'skill'
    if re.search(r'教程|入门|指南|课程|保姆级|从0到1|从 0 到 1|手把手|喂饭|零基础|手册|攻略|实战营|tutorial|guide|how to|walkthrough',h,re.I): return 'tutorial'
    if re.search(r'工作流|workflow|流水线|管线|SOP',h,re.I): return 'workflow'
    if re.search(r'提示词|prompt|指令模板|口令',h,re.I) and not re.search(r'skill|技能',h,re.I): return 'prompt'
    if re.search(r'实测|案例|复盘|我用.{0,12}(做|搭|生成|跑)|做了|跑通|体验|对比|评测|测评|review',h,re.I): return 'case'
    return 'knowledge'
def pcat(t):
    for pat,c in [(r'PPT|幻灯|Word|Excel|文档|表格|简历|公文|报告|会议纪要|办公',"办公文档"),(r'小红书|公众号|短视频|视频|文案|写作|自媒体|漫剧|爆款|封面|图文|直播|抖音|TikTok',"内容创作"),(r'数据|分析|股票|A股|投研|财报|调研|爬虫|采集|抓取|知识库|Obsidian|笔记',"数据分析"),(r'设计|海报|UI|生图|绘图|图片|SVG|品牌|CAD|建模|动画',"设计"),(r'代码|开发|GitHub|MCP|API|编程|部署|Codex|Claude Code|Hook|SDK',"开发"),(r'营销|电商|运营|代运营|变现|接单|SEO|GEO|广告|带货|跨境',"营销"),(r'自动化|定时|微信|飞书|企微|IM|远程|连接器|签到',"自动化"),(r'教程|入门|指南|课程|新手|小白',"学习教程")]:
        if re.search(pat,t,re.I): return c
    return "效率"
out=[]
for r in R:
    full=(r['article_title'] or '')+'\n'+r['text']
    if NOISE.search(full): continue
    if not re.search('workbuddy',full+(r['article_text'] or ''),re.I): continue
    txt=clean(r['text']); at=clean(r['article_text'] or '')
    title=r['article_title'] or first_line(txt)
    body=at if len(at)>len(txt) else txt
    link=next((u for u in r['urls'] if 'x.com' not in u and 'twitter.com' not in u and 't.co' not in u),'')
    t=ptype(title+' '+txt[:160])
    if len(clean(r['text']))<30 and not r['article_title']: continue
    off=r['author'].lower() in OFFICIAL
    if off and t not in ('skill','tutorial'): t='knowledge'
    out.append(dict(post_id=r['id'],type=t,category='官方动态' if off else pcat(title+' '+txt[:300]),name=title,summary=clip(txt if txt else title,70) if not r['article_title'] else clip(at or title,70),
        body=clip(body,520),link=link,author_name=r['name'],author_handle=r['author'],post_url=r['url'],post_date=r['date'],likes=r['likes'],reposts=r['reposts'],views=r['views'],media=r['media'],has_article=bool(r['article_title'])))
# dedupe: same author+normalized title prefix, or same link
def norm(s): return re.sub(r'\W+','',s.lower())[:24]
def norm2(o):
    base=o['name'] if o['has_article'] else (o['name']+o['body'])
    return re.sub(r'\W+','',base.lower())[:40]
groups=collections.OrderedDict()
seen_long={}
for o in sorted(out,key=lambda o:-(o['likes'] or 0)):
    n2=norm2(o)
    if o['link'] and 'github.com' in o['link']: key=('L',o['link'].split('#')[0].split('?')[0].rstrip('/').lower())
    elif len(n2)>=24 and ('N',n2) in groups: key=('N',n2)
    else: key=('N',n2) if len(n2)>=24 else ('T',o['author_handle'],norm(o['name']))
    groups.setdefault(key,[]).append(o)
items=[]
for k,g in groups.items():
    p=g[0]; p=dict(p); p['others']=g[1:]
    items.append(p)
json.dump(items,open('data/raw/x_items.json','w'),ensure_ascii=False,indent=0)
print(len(out),len(items),collections.Counter(i['type'] for i in items))
