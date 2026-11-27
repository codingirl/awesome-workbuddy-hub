import os,json,glob,sys
from parse import load
ROOT=sys.argv[1] if len(sys.argv)>1 else 'data/raw'
posts={};users={};media={}
files=sorted(glob.glob(ROOT+'/search_pages/*'))+sorted(glob.glob(ROOT+'/search_pages/early/q0*.json'))+sorted(glob.glob(ROOT+'/search_pages/early/probe*.json'))+sorted(glob.glob(ROOT+'/search_pages2/*'))
for f in files:
    try: d=load(f)
    except Exception: continue
    for u in d.get('includes',{}).get('users',[]): users[u['id']]=u
    for m in d.get('includes',{}).get('media',[]): media[m['media_key']]=m
    for p in d.get('data',[]):
        if 'id' in p and 'author_id' in p: posts[p['id']]=p
out=[]
for p in posts.values():
    u=users.get(p['author_id'],{})
    p['_user']={'username':u.get('username'),'name':u.get('name')}
    p['_media']=[media[k] for k in p.get('attachments',{}).get('media_keys',[]) if k in media]
    out.append(p)
out.sort(key=lambda p:p['created_at'])
json.dump(out,open(ROOT+'/posts_all.json','w'),ensure_ascii=False)
print(len(files),'files',len(out),'posts')
