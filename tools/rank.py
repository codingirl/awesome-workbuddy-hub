"""posts_all.json -> x_ranked_candidates.json (relaxed gate: any WorkBuddy-related informative post)."""
import json,re,sys,math,collections
ROOT=sys.argv[1] if len(sys.argv)>1 else 'data/raw'
P=json.load(open(ROOT+'/posts_all.json'))
NOISE=re.compile(r'邀请码|邀请积分|返佣|空投|\$WorkBuddy|注册就送|注册送|拉新|免费领|0x[0-9a-f]{20}|卖WorkBuddy教程赚|月入\d+万|赚了\d+万|薅|白嫖|代充|充值|转让|出售账号|号池|抽奖|giveaway|airdrop|presale|contract address|\bCA\b[:：]|pump\.fun|memecoin|solana|转发.{0,6}关注|扫码进群|加群|进群|私信.{0,6}领取|代做|代写|求邀请|互关|互粉|引流',re.I)
SIGNAL=re.compile(r'skill|技能|教程|工作流|workflow|提示词|prompt|实测|案例|指南|技巧|攻略|玩法|配置|安装|mcp|插件|自动化|更新|版本|新功能|功能|上线|发布|测评|评测|对比|体验|怎么|如何|原理|踩坑|报错|解决|问题|bug|how to|tutorial|tip|guide|feature|update|release|launch|review|vs\b|开源|github|模型|connector|连接器|定时|知识库|记忆|memory|agent|智能体|龙虾|openclaw|codebuddy|飞书|微信|企微|ppt|excel|word|文档|视频|小红书|公众号|生成|搭建|部署|接入|api|cli|token|额度|积分|套餐|定价|pricing',re.I)
def clean(t):
    t=re.sub(r'https?://\S+','',t or '');t=re.sub(r'@\w+','',t)
    return re.sub(r'\s+',' ',t).strip()
out=[];drop=collections.Counter()
for p in P:
    a=p.get('article') or {}
    atext=a.get('plain_text') or ''
    full=(a.get('title') or '')+'\n'+p['text']+'\n'+atext
    if 'workbuddy' not in full.lower(): drop['no_wb']+=1; continue
    if p['text'].startswith('RT @'): drop['rt']+=1; continue
    if NOISE.search(full): drop['noise']+=1; continue
    c=clean(p['text'])
    if p['text'].startswith('@') and len(c)<120: drop['reply']+=1; continue
    informative = bool(a.get('title')) or len(c)>=60 and SIGNAL.search(full)
    if not informative: drop['thin']+=1; continue
    m=p.get('public_metrics',{})
    urls=[u.get('expanded_url') for u in p.get('entities',{}).get('urls',[]) if u.get('expanded_url')]
    u=p.get('_user',{})
    score=math.log10(1+m.get('like_count',0)*3+m.get('retweet_count',0)*4+m.get('bookmark_count',0)*2+m.get('reply_count',0))*4+ (3 if a.get('title') else 0)+min(len(c),400)/200
    out.append(dict(id=p['id'],date=p['created_at'][:10],author=u.get('username') or '',name=u.get('name') or '',likes=m.get('like_count',0),reposts=m.get('retweet_count',0),views=m.get('impression_count',0),
        text=p['text'],urls=urls,article_title=a.get('title') or '',article_text=atext[:2500],media=[x.get('url') or x.get('preview_image_url') for x in p.get('_media',[]) if x.get('url') or x.get('preview_image_url')][:2],
        url=p.get('url') or f"https://x.com/{u.get('username')}/status/{p['id']}",score=round(score,2)))
out.sort(key=lambda r:-r['score'])
json.dump(out,open(ROOT+'/x_ranked_candidates.json','w'),ensure_ascii=False)
print(len(P),'posts',len(out),'candidates',dict(drop))
