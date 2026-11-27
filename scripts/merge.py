import json,re,os,collections,hashlib,sys
sys.path.insert(0,'build')
from overrides import O
GH=json.load(open('data/raw/github_items.json'))
EX=json.load(open('data/raw/github_extra_filtered.json'))
XI=json.load(open('data/raw/x_items.json'))
CATS=["办公文档","内容创作","数据分析","设计","开发","营销","自动化","学习教程","行业应用","工具集成","效率","其他"]
def clip(s,n):
    s=re.sub(r'\s+',' ',s or '').strip()
    return s if len(s)<=n else s[:n-1]+'…'
RULES=[(r'PPT|slide|presentation|幻灯|Word|docx|xlsx|Excel|spreadsheet|\bpdf\b|文档|表格|简历|resume|公文|会议纪要|办公|office|notion|飞书|金山|WPS|腾讯文档|markdown|ocr',"办公文档"),
(r'小红书|公众号|短视频|视频|video|文案|写作|writing|novel|小说|自媒体|漫剧|短剧|爆款|封面|图文|直播|抖音|tiktok|youtube|twitter|social|content|blog|podcast|音频|audio|tts',"内容创作"),
(r'数据|data|分析|analy|股|stock|finance|投研|财报|调研|research|爬虫|crawl|scrap|采集|抓取|知识库|obsidian|笔记|note|database|sql|chart|dashboard|bi\b',"数据分析"),
(r'设计|design|海报|poster|\bui\b|\bux\b|生图|image|绘图|图片|svg|品牌|logo|cad|建模|3d|动画|animation|figma|canvas|photo',"设计"),
(r'投标|招标|合同|法务|legal|contract|造价|工程|医|教育|教师|学生|课程|地产|财务|会计|审计|audit|hr\b|招聘|政务|行业',"行业应用"),
(r'营销|marketing|电商|ecommerce|运营|变现|接单|seo|geo|广告|ads?\b|带货|跨境|sales|crm|增长',"营销"),
(r'自动化|automat|定时|cron|schedule|微信|wechat|企微|slack|telegram|discord|mcp|connector|连接器|rpa|browser|浏览器|签到|workflow|agent-browser|email|邮件',"自动化"),
(r'代码|code|coding|开发|develop|github|\bgit\b|api|编程|部署|deploy|devops|docker|test|debug|sdk|cli\b|framework|python|node|typescript|rust|react|vue',"开发"),
(r'教程|入门|指南|guide|tutorial|课程|新手|小白|learn|docs?\b|官方',"学习教程")]
def cat(t,src_cat=''):
    for pat,c in RULES:
        if re.search(pat,t,re.I): return c
    return "效率"
def slugify(s):
    s=re.sub(r'[^a-zA-Z0-9]+','-',s or '').strip('-').lower()
    return s[:48].strip('-')
def canon(u):
    m=re.match(r'https?://github\.com/([^/#?]+)/([^/#?]+)',u or '')
    return ('gh',m.group(1).lower(),m.group(2).lower().replace('.git','')) if m else None
items=[]
byrepo={}
def repo_key(u):
    c=canon(u)
    return c if (c and re.match(r'https?://github\.com/[^/]+/[^/]+/?$',u.split('#')[0].split('?')[0])) else None
seenurl={}
def srcrec(**k): return {a:b for a,b in k.items() if b not in (None,'',[])}
# GH items
for g in GH:
    url=g['url'].split('#')[0]
    key=url.rstrip('/').lower()
    if key in seenurl:
        it=seenurl[key]
        it['sources'].append(srcrec(source_type='github',url=g['url'],repo=g['repo'],license=g.get('license'),note=g.get('src_cat')))
        if len(g.get('summary',''))>len(it['summary']) and g['repo'].startswith('sandbase'): pass
        continue
    txt=(g['name']+' '+(g.get('name_en') or '')+' '+g.get('summary','')+' '+(g.get('src_cat') or ''))
    c=cat(txt)
    if g['repo']=='yehuzi2026/workbuddy-skills-hub' : c=cat(txt) if cat(txt)!="效率" else "行业应用"
    it=dict(type=g['type'],name=g['name'],name_en=g.get('name_en') if g.get('name_en')!=g['name'] else '',category=c,tags=[t for t in [g.get('src_cat_zh') or g.get('src_cat')] if t],summary=clip(g.get('summary') or '',110),description='',
            install_or_link=g['url'],sources=[srcrec(source_type='github',url=g['url'],repo=g['repo'],license=g.get('license'),note=g.get('src_cat'),author_name=g.get('author'),date=g.get('date'))],media=[],lang=g.get('lang',''),curation='aggregated')
    items.append(it); seenurl[key]=it
# extra repos
BAD=re.compile(r'账号池|号池|反代|签到|积分|白嫖|破甲|prompt-patcher|api 网关|2api|api-gateway|gateway|switch|账号切换|多账号|account',re.I)
for e in EX:
    if e['stars']<30: continue
    d=(e['desc'] or '')
    if BAD.search(e['full_name']+' '+d): continue
    url='https://github.com/'+e['full_name']
    key=url.lower()
    if key in seenurl: continue
    t='skill' if re.search(r'skill|技能',e['full_name']+d,re.I) else 'other'
    it=dict(type=t,name=e['full_name'].split('/')[1],name_en=e['full_name'],category=cat(e['full_name']+' '+d),tags=['GitHub 搜索发现']+(e.get('topics') or [])[:3],summary=clip(d,110),description='',install_or_link=url,
        sources=[srcrec(source_type='github',url=url,repo=e['full_name'],license=e.get('license'),note=f"stars {e['stars']}",date=e['pushed'])],media=[],lang='',curation='aggregated')
    items.append(it); seenurl[key]=it
# X items
for x in XI:
    ov=O.get(x['post_id'][-6:])
    name,summ,typ,c=(ov if ov else (x['name'],x['summary'],x['type'],x['category']))
    srcs=[srcrec(source_type='x',url=x['post_url'],author_name=x['author_name'],author_handle=x['author_handle'],date=x['post_date'],likes=x['likes'],reposts=x['reposts'],views=x['views'])]
    for o in x['others']:
        srcs.append(srcrec(source_type='x',url=o['post_url'],author_name=o['author_name'],author_handle=o['author_handle'],date=o['post_date'],likes=o['likes'],reposts=o['reposts'],views=o['views']))
    link=x['link']
    # merge with gh item by repo url
    if link and 'github.com' in link:
        k=link.split('#')[0].split('?')[0].rstrip('/').lower()
        m=re.match(r'(https://github\.com/[^/]+/[^/]+)',k)
        k2=m.group(1) if m else k
        for kk in (k,k2):
            if kk in seenurl:
                it=seenurl[kk]; it['sources']=srcs+it['sources']
                it.setdefault('x_context',[]).append(clip(x['body'],300))
                it['media']=(it['media']+x['media'])[:3]
                break
        else: kk=None
        if kk: continue
    it=dict(type=typ,name=name,name_en='',category=c,tags=[],summary=summ,description=x['body'],install_or_link=link,sources=srcs,media=x['media'],lang='zh',curation='curated' if ov else 'auto',has_article=x['has_article'])
    items.append(it)
    if link and 'github.com' in link: seenurl[link.split('#')[0].rstrip('/').lower()]=it
# slugs
used=set()
for it in items:
    base=slugify(it.get('name_en') or '') or slugify(it['name'])
    if not base:
        s0=it['sources'][0]['url']; m=re.search(r'status/(\d+)',s0)
        base=('x-'+m.group(1)[-8:]) if m else 'item-'+hashlib.md5(s0.encode()).hexdigest()[:8]
    if it['type']=='tutorial' and it['sources'][0]['source_type']=='x' and not slugify(it['name']): pass
    s=base;n=2
    while s in used: s=f'{base}-{n}'; n+=1
    used.add(s); it['id']=s
    it['primary_source_url']=it['sources'][0]['url']
    it['post_url']=next((s['url'] for s in it['sources'] if s['source_type']=='x'),'')
    it['source_type']=it['sources'][0]['source_type']
    it['tags']=list(dict.fromkeys([t for t in it['tags'] if t]+[it['category']]))
order=['skill','workflow','tutorial','knowledge','prompt','case','other']
items.sort(key=lambda i:(order.index(i['type']),CATS.index(i['category']) if i['category'] in CATS else 99,-sum((s.get('likes') or 0) for s in i['sources'])))
json.dump(items,open('data/items.json','w'),ensure_ascii=False,indent=1)
print(len(items),collections.Counter(i['type'] for i in items),collections.Counter(i['category'] for i in items),collections.Counter(i['source_type'] for i in items))
print('multi-source',sum(1 for i in items if len(i['sources'])>1))
