import json,re,os,glob,collections
G=os.environ.get('WORKBUDDY_GH_SRC','../gh_src')
if not os.path.isdir(G):
    raise SystemExit('Set WORKBUDDY_GH_SRC to a directory of cloned upstream repos.')
items=[]
def add(**k): items.append(k)
def fm(path):
    try: s=open(path,encoding='utf8').read()
    except: return {}
    m=re.match(r'---\s*\n(.*?)\n---',s,re.S)
    d={}
    if m:
        for line in m.group(1).split('\n'):
            mm=re.match(r'^([A-Za-z_-]+):\s*(.*)$',line)
            if mm: d[mm.group(1)]=mm.group(2).strip().strip('"\'')
    return d
def clip(s,n):
    s=re.sub(r'\s+',' ',s or '').strip()
    return s if len(s)<=n else s[:n-1]+'…'
# 1 sandbase resources (CC0)
SB='sandbaseai/awesome-workbuddy'
tmap={'Ready-to-use Skills':'skill','Skill collections':'skill','Tools and integrations':'other','Community clients and enhancements':'other','Learning and reference':'tutorial','Core concepts':'knowledge','Platform integrations':'knowledge','Documents, data, and professional work':'case','Content and career':'case','Automation and Agent workflows':'workflow','Articles':'tutorial','Videos':'tutorial','Research and Engineering':'case','Build and use Skills':'tutorial','Connect tools with MCP':'knowledge','Knowledge management':'case','Education':'case','Community channels':'other','Start here':'other','Benchmarks':'other'}
for r in json.load(open(f'{G}/sandbaseai_awesome-workbuddy/site/resources.json')):
    add(repo=SB,type=tmap.get(r['category'],'other'),name=r.get('titleZh') or r['title'],name_en=r['title'],summary=r.get('descriptionZh') or r.get('description') or '',
        url=r['url'],src_cat=r['category'],src_cat_zh=r.get('categoryZh'),license='CC0-1.0',lang='zh')
# 2 semlinker bullets (CC0)
SL='semlinker/awesome-workbuddy'
h2=h3='';
for line in open(f'{G}/semlinker_awesome-workbuddy/README.md',encoding='utf8'):
    line=line.rstrip()
    if line.startswith('## '): h2=line[3:].strip()
    elif line.startswith('### '): h3=line[4:].strip()
    m=re.match(r'^- \[(.+?)\]\((https?://[^)]+)\)\s*(?:[—-]+\s*(.*))?$',line)
    if m and h2 not in('贡献指南','维护约定','目录'):
        sec=h3 or h2
        t={'官方资源':'knowledge','快速入门':'tutorial','提示词、Skills 与 MCP':'skill'}.get(h2,'case')
        if h3=='视频' or h3=='文章': t='tutorial'
        add(repo=SL,type=t,name=m.group(1),summary=m.group(3) or '',url=m.group(2),src_cat=sec,license='CC0-1.0',lang='zh')
# 3 shuangying
SH='shuangying0001-beep/awesome-workbuddy-skills'
txt=open(f'{G}/shuangying0001-beep_awesome-workbuddy-skills/README.md',encoding='utf8').read()
sec=''
for line in txt.split('\n'):
    if line.startswith('## '): sec=line[3:].strip()
    m=re.match(r'^\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$',line)
    if m:
        ln=re.search(r'\((https?://[^)]+)\)',m.group(3))
        url=ln.group(1) if ln else f'https://github.com/{SH}'
        add(repo=SH,type='skill',name=m.group(1),name_en=m.group(1),summary=clip(m.group(2),90),url=url,src_cat=sec,license='unspecified',lang='zh')
# 4 yehuzi hub
YH='yehuzi2026/workbuddy-skills-hub'
base=f'{G}/yehuzi2026_workbuddy-skills-hub/categories'
for cat in sorted(os.listdir(base)):
    if not os.path.isdir(f'{base}/{cat}'): continue
    for sk in sorted(os.listdir(f'{base}/{cat}')):
        p=f'{base}/{cat}/{sk}'
        if not os.path.isdir(p): continue
        sm=glob.glob(p+'/SKILL.md')
        d=fm(sm[0]) if sm else {}
        from urllib.parse import quote
        add(repo=YH,type='skill',name=d.get('name') or sk,name_en=sk,summary=clip(d.get('description',''),90),url=f'https://github.com/{YH}/tree/main/categories/{quote(cat)}/{quote(sk)}',src_cat=cat,license='MIT/mixed (see PROVENANCE.md)',lang='zh')
# 5 weininghui
WH='weininghui/skills'
base=f'{G}/weininghui_skills'
for sk in sorted(os.listdir(base)):
    p=f'{base}/{sk}'
    if os.path.isdir(p) and not sk.startswith('.') and os.path.exists(p+'/SKILL.md'):
        d=fm(p+'/SKILL.md')
        add(repo=WH,type='skill',name=d.get('name') or sk,name_en=sk,summary=clip(d.get('description',''),110),url=f'https://github.com/{WH}/tree/main/{sk}',src_cat='skills',license='MIT',lang='en')
# 6 guide
AG='AlephAITech/WorkBuddyGuide'
from urllib.parse import quote
bb=f'{G}/AlephAITech_WorkBuddyGuide/docs/bluebook'
for f in sorted(glob.glob(bb+'/*/*/index.md')+glob.glob(bb+'/*/index.md')):
    rel=os.path.relpath(os.path.dirname(f),f'{G}/AlephAITech_WorkBuddyGuide')
    parts=rel.split('/')
    if len(parts)<4: continue
    title=open(f,encoding='utf8').readline().lstrip('# ').strip()
    add(repo=AG,type='tutorial',name=title,summary='',url=f'https://github.com/{AG}/tree/main/{quote(rel)}',src_cat=parts[2],license='MIT',lang='zh')
for f in sorted(glob.glob(f'{G}/AlephAITech_WorkBuddyGuide/docs/cases/submissions/*/index.md')):
    d=fm(f); rel=os.path.relpath(os.path.dirname(f),f'{G}/AlephAITech_WorkBuddyGuide')
    add(repo=AG,type='case',name=d.get('title',os.path.basename(os.path.dirname(f))),summary=clip(d.get('summary',''),110),url=f'https://github.com/{AG}/tree/main/{quote(rel)}',src_cat='社区案例·'+d.get('category',''),author=d.get('author'),date=d.get('date'),license='MIT',lang='zh')
# 7 atlas
add(repo='sandbaseai/workbuddy-skill',type='skill',name='WorkBuddy Skill Atlas（技能目录）',name_en='WorkBuddy Skill Atlas',summary='可检索的公开 Agent Skill 目录（2 万余条快照）及审阅过的可安装 WorkBuddy 技能包',url='https://github.com/sandbaseai/workbuddy-skill',src_cat='Skill collections',license='MIT',lang='zh')
json.dump(items,open('data/raw/github_items.json','w'),ensure_ascii=False,indent=0)
print(len(items),collections.Counter(i['repo'] for i in items))
