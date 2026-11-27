import json,sys,re
def load(p):
    s=open(p).read()
    i=s.index('{"')
    return json.JSONDecoder().raw_decode(s[i:])[0]
if __name__=='__main__':
    d=load(sys.argv[1]); print(d.get('meta'), len(d['data']))
    users={u['id']:u for u in d.get('includes',{}).get('users',[])}
    for p in d['data']:
        u=users.get(p['author_id'],{})
        print(p['id'],p['created_at'][:10],'@'+u.get('username','?'),p['public_metrics']['like_count'],p['text'][:100].replace('\n',' '))
