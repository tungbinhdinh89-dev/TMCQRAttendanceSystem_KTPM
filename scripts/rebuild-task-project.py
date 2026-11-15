"""Rebuild the explicitly requested TMC project; retain issues and progress."""
import sys
sys.dont_write_bytecode = True
import importlib.util
import json
import os
import subprocess
import time
from pathlib import Path

spec=importlib.util.spec_from_file_location('backlog',Path(__file__).with_name('publish-feature-backlog.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
b.REPO='tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM'
# Pin the requested owner for this process even if another terminal switches gh.
os.environ['GH_TOKEN']=subprocess.run(['gh','auth','token','--hostname','github.com','--user','tungbinhdinh89'],capture_output=True,text=True,check=True,env={k:v for k,v in os.environ.items() if k not in ['GH_TOKEN','GITHUB_TOKEN']}).stdout.strip()
original_gql=b.gql
def reliable_gql(query,**variables):
    for attempt in range(4):
        try:return original_gql(query,**variables)
        except RuntimeError as exc:
            if not any(code in str(exc) for code in ['502','503','504']) or 'createProjectV2' in query or attempt==3:raise
            time.sleep(2)
b.gql=reliable_gql
NEW='PVT_kwDOFL-1HM4BrnTp'
OLD='PVT_kwHOBqA8Mc4BqGry'
LEGACY='PVT_kwHODenJ1c4BqGqu'
OUT=b.OUT

def snapshot(pid):
    project=b.gql('query($id:ID!){node(id:$id){... on ProjectV2{id title url owner{... on User{login} ... on Organization{login}} fields(first:60){nodes{... on ProjectV2Field{id name dataType} ... on ProjectV2SingleSelectField{id name dataType options{id name color description}} ... on ProjectV2IterationField{id name dataType}}} views(first:30){nodes{id name number layout}}}}}',id=pid)['node']
    items=[];cursor=None
    while True:
        r=b.gql('query($id:ID!,$c:String){node(id:$id){... on ProjectV2{items(first:100,after:$c){nodes{id content{... on Issue{id number title url state assignees(first:30){nodes{login}} parent{id}}} fieldValues(first:50){nodes{... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2Field{name}}} ... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{name}}} ... on ProjectV2ItemFieldDateValue{date field{... on ProjectV2Field{name}}} ... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2SingleSelectField{name}}} ... on ProjectV2ItemFieldIterationValue{title field{... on ProjectV2IterationField{name}}}}}}pageInfo{hasNextPage endCursor}}}}}',id=pid,c=cursor)['node']['items']
        items+=r['nodes']
        if not r['pageInfo']['hasNextPage']:break
        cursor=r['pageInfo']['endCursor']
    project['items']=items
    return project

def mutations(rows):
    for start in range(0,len(rows),20):
        part=rows[start:start+20]
        b.gql('mutation{'+''.join(f'm{i}:'+v for i,v in enumerate(part))+'}')
        print(f'Updated {min(start+20,len(rows))}/{len(rows)}',flush=True)

def create_field(name,kind,options=None):
    inp=dict(projectId=NEW,name=name,dataType=kind)
    if options:inp['singleSelectOptions']=[{k:v for k,v in o.items() if k!='id'} for o in options]
    return b.gql('mutation($i:CreateProjectV2FieldInput!){createProjectV2Field(input:$i){projectV2Field{... on ProjectV2Field{id name dataType} ... on ProjectV2SingleSelectField{id name dataType options{id name}}}}}',i=inp)['createProjectV2Field']['projectV2Field']

def migrate():
    src=snapshot(OLD)
    assert src['owner']['login']=='tungbinhdinh89' and len(src['items'])==105
    b.save('task-project-source.json',src)
    dst=snapshot(NEW)
    fields={f['name']:f for f in dst['fields']['nodes']}
    for field in src['fields']['nodes']:
        name=field['name'];kind=field['dataType']
        if kind=='SINGLE_SELECT' and name=='Status':
            options=field['options']
            if not any(o['name']=='Blocked' for o in options):options=options+[dict(name='Blocked',color='RED',description='Record blocker and next action')]
            r=b.gql('mutation($i:UpdateProjectV2FieldInput!){updateProjectV2Field(input:$i){projectV2Field{... on ProjectV2SingleSelectField{id name dataType options{id name}}}}}',i=dict(fieldId=fields[name]['id'],singleSelectOptions=[{k:v for k,v in o.items() if k!='id'} for o in options]))
            fields[name]=r['updateProjectV2Field']['projectV2Field']
        elif name not in fields and kind in ['TEXT','NUMBER','DATE','SINGLE_SELECT','ITERATION']:
            fields[name]=create_field(name,'TEXT' if kind=='ITERATION' else kind,field.get('options'))
    tasks={g[1]:f'TMC-{g[0]:03} | {g[2]}' for g in b.GROUPS}
    for name,kind,options in [
        ('Task ID','TEXT',None),('Task','SINGLE_SELECT',[dict(name=v,color='PURPLE',description='Feature task with linked implementation tickets') for v in tasks.values()]),
        ('Work Type','SINGLE_SELECT',[dict(name=n,color='BLUE',description=n) for n in ['Task','Ticket','Sub-ticket']]),
        ('Area','TEXT',None),('Dependencies','TEXT',None)]:
        if name not in fields:fields[name]=create_field(name,kind,options)
    b.save('task-project-fields.json',fields)
    mapping={int(k):v for k,v in json.loads((OUT/'issue-map.json').read_text(encoding='utf-8')).items()}
    tickets={t['id']:t for t in json.loads((OUT/'tickets.json').read_text(encoding='utf-8'))}
    reverse={v['id']:n for n,v in mapping.items()}
    taskids={g[0] for g in b.GROUPS}
    for n in taskids:
        t=tickets[n];r=b.gh('api',f'repos/{b.REPO}/issues/{mapping[n]["number"]}')
        body=r['body'].replace('**Type:** EPIC','**Type:** TASK').replace('Feature epic','Feature task')
        title=f'[TMC-{n:03}] [TASK] {t["title"]}'
        labels=[l['name'] for l in r['labels'] if l['name']!='type:epic']
        labels=list(dict.fromkeys(labels+['type:task','level:task']))
        b.gh('api',f'repos/{b.REPO}/issues/{r["number"]}','--method','PATCH',payload=dict(title=title,body=body,labels=labels))
    existing={i['content']['id']:i for i in dst['items'] if i.get('content',{}).get('id')}
    for start in range(0,len(src['items']),20):
        batch=[i for i in src['items'][start:start+20] if i['content']['id'] not in existing]
        if not batch:continue
        result=b.gql('mutation{'+''.join(f'm{k}:addProjectV2ItemById(input:{{projectId:"{NEW}",contentId:"{i["content"]["id"]}"}}){{item{{id content{{... on Issue{{id}}}}}}}}' for k,i in enumerate(batch))+'}')
        for value in result.values():existing[value['item']['content']['id']]=value['item']
    rows=[];expected={}
    for item in src['items']:
        content=item['content'];n=reverse[content['id']]
        t=tickets.get(n,dict(feature_slug='foundation',area='frontend',deps=[],parent=101))
        values={}
        for f in item['fieldValues']['nodes']:
            if not f.get('field'):continue
            name=f['field']['name']
            if name not in fields or fields[name]['dataType'] not in ['TEXT','NUMBER','DATE','SINGLE_SELECT']:continue
            for key in ['text','number','date','name','title']:
                if f.get(key) is not None:values[name]=f[key];break
        values.update({'Task ID':f'TMC-{n:03}','Task':tasks[t['feature_slug']],'Work Type':'Task' if n in taskids else 'Sub-ticket' if t.get('parent') in [31,40,41,42,43] else 'Ticket','Area':t['area'],'Dependencies':', '.join(f'TMC-{d:03}' for d in t['deps']) or 'None'})
        values.setdefault('Status','Backlog')
        values.setdefault('Priority',t.get('priority','P1'))
        expected[content['id']]=values
        for name,value in values.items():
            field=fields[name];kind=field['dataType']
            if kind=='SINGLE_SELECT':payload={'singleSelectOptionId':next(o['id'] for o in field['options'] if o['name']==value)}
            else:payload={{'TEXT':'text','NUMBER':'number','DATE':'date'}[kind]:value}
            key,val=next(iter(payload.items()))
            rows.append(f'updateProjectV2ItemFieldValue(input:{{projectId:"{NEW}",itemId:"{existing[content["id"]]["id"]}",fieldId:"{field["id"]}",value:{{{key}:{json.dumps(val)}}}}}){{projectV2Item{{id}}}}')
    b.save('task-project-expected.json',expected)
    mutations(rows)
    visible=[fields[n]['id'] for n in ['Title','Task ID','Task','Work Type','Assignees','Status','Priority','Parent issue','Sub-issues progress','Dependencies','Target date','Labels']]
    for index,(name,fil) in enumerate([('Tasks & Tickets',''),('Tasks','label:"level:task"'),('Implementation Tickets','-label:"level:task"'),('Review Queue','status:"In review"'),('Blocked','status:Blocked')]):
        if index==0:view=dst['views']['nodes'][0]
        else:view=b.gql('mutation($i:CreateProjectV2ViewInput!){createProjectV2View(input:$i){projectV2View{id}}}',i=dict(projectId=NEW,name=name,layout='TABLE_LAYOUT'))['createProjectV2View']['projectV2View']
        b.gql('mutation($i:UpdateProjectV2ViewInput!){updateProjectV2View(input:$i){projectV2View{id}}}',i=dict(viewId=view['id'],name=name,layout='TABLE_LAYOUT',filter=fil,configuration=dict(visibleFieldIds=visible)))
    repo=b.gh('api',f'repos/{b.REPO}')
    b.gql('mutation($i:LinkProjectV2ToRepositoryInput!){linkProjectV2ToRepository(input:$i){repository{id}}}',i=dict(projectId=NEW,repositoryId=repo['node_id']))
    b.gql('mutation($i:UpdateProjectV2Input!){updateProjectV2(input:$i){projectV2{id}}}',i=dict(projectId=NEW,readme='# TMC Access — Tasks & Tickets\n\n14 feature Tasks → 91 implementation tickets (including 15 sub-tickets). Stable TMC IDs and existing GitHub issues are retained.\n\nFilter the Task column, assign issue owners in Assignees, and use Parent issue / Sub-issues progress. Backlog → Ready → In progress → In review → Done; Blocked requires a reason and next action. Done requires human acceptance.\n\nProgress, assignments, dates and estimates copied from the previous owner project. No application feature implementation or product testing is implied. M2 requires at least one main module; the full backlog includes optional extensions.'))
    print('New task project populated and linked.',flush=True)

def verify_delete():
    src=json.loads((OUT/'task-project-source.json').read_text(encoding='utf-8'))
    expected=json.loads((OUT/'task-project-expected.json').read_text(encoding='utf-8'))
    dst=snapshot(NEW)
    assert len(dst['items'])==105 and dst['owner']['login']=='tungbinhdinh89-dev'
    byid={i['content']['id']:i for i in dst['items']}
    for old in src['items']:
        new=byid[old['content']['id']]
        for key in ['state','assignees','parent']:assert old['content'][key]==new['content'][key],key
        got={}
        for f in new['fieldValues']['nodes']:
            if f.get('field'):
                got[f['field']['name']]=next(f[k] for k in ['text','number','date','name','title'] if f.get(k) is not None)
        for key,value in expected[old['content']['id']].items():assert got[key]==value,(key,value,got.get(key))
    b.save('task-project-verified.json',dst)
    # Delete only the exact two old TMC projects after snapshots and verification.
    old=snapshot(OLD);assert old['id']==OLD and old['owner']['login']=='tungbinhdinh89'
    b.gql('mutation($id:ID!){deleteProjectV2(input:{projectId:$id}){clientMutationId}}',id=OLD)
    interim=snapshot('PVT_kwHOBqA8Mc4BrnNX')
    assert interim['owner']['login']=='tungbinhdinh89' and interim['title']=='TMC Access — Tasks & Tickets'
    b.save('task-project-interim-backup.json',interim)
    b.gql('mutation($id:ID!){deleteProjectV2(input:{projectId:$id}){clientMutationId}}',id=interim['id'])
    token=subprocess.run(['gh','auth','token','--hostname','github.com','--user','stephen89-hcmut'],capture_output=True,text=True,check=True,env={k:v for k,v in os.environ.items() if k not in ['GH_TOKEN','GITHUB_TOKEN']}).stdout.strip()
    previous=os.environ.get('GH_TOKEN')
    try:
        os.environ['GH_TOKEN']=token
        legacy=snapshot(LEGACY)
        assert legacy['owner']['login']=='stephen89-hcmut' and 'TMC Access' in legacy['title']
        b.save('task-project-legacy-backup.json',legacy)
        b.gql('mutation($id:ID!){deleteProjectV2(input:{projectId:$id}){clientMutationId}}',id=LEGACY)
    finally:
        if previous is None:os.environ.pop('GH_TOKEN',None)
        else:os.environ['GH_TOKEN']=previous
    b.save('task-project-migration.json',dict(result='PASS',project=dst['url'],issues=105,tasks=14,implementationTickets=91,subTickets=15,deletedProjects=[OLD,LEGACY,interim['id']]))
    mapping={int(k):v for k,v in json.loads((OUT/'issue-map.json').read_text(encoding='utf-8')).items()}
    tickets=json.loads((OUT/'tickets.json').read_text(encoding='utf-8'))
    for t in tickets:
        if t['id'] in {g[0] for g in b.GROUPS}:
            t['type']='TASK'
            mapping[t['id']]['title']=f'[TMC-{t["id"]:03}] [TASK] {t["title"]}'
    b.save('tickets.json',tickets);b.save('issue-map.json',mapping)
    lines=['# TMC Access — Tasks & Tickets','',f'[Mở Project mới]({dst["url"]}) · [Repository Projects](https://github.com/{b.REPO}/projects)','',
      'Project thuộc tổ chức tungbinhdinh89-dev, cùng owner hiện tại của repository và đã liên kết vào repository. Hai Project TMC cũ và bảng cá nhân tạo tạm đã được xóa sau khi sao lưu và kiểm chứng. Các issue được giữ nguyên ID/URL, nội dung, phân công và quan hệ cha/con; 14 issue cấp cao được đổi từ EPIC sang TASK.',
      '', '**Cấu trúc:** 14 Task lớn → 91 ticket thực thi, trong đó 15 sub-ticket. Tổng 105 issue. Không tạo issue trùng và không đánh dấu hoàn thành thêm.',
      '', '**Cách dùng:** có 14 table view riêng cho từng Task; mở Tasks để xem nhóm lớn; mở Tasks & Tickets rồi lọc cột Task để xem toàn bộ ticket của một nhóm. Dùng Assignees để phân công, Parent issue / Sub-issues progress để theo dõi cấp con.',
      '', '**Trạng thái:** Backlog → Ready → In progress → In review → Done; Blocked phải có lý do và bước tiếp theo. Giữ trạng thái, ngày hạn và ước lượng có sẵn; chưa có trạng thái thì Backlog. Done cần người dùng nghiệm thu.',
      '', '**Quy ước:** `[TMC-NNN] [TASK] Name` cho Task lớn; các ticket giữ ID TMC-NNN và type tương ứng. Label `level:task` nhận diện cấp lớn; `feature:*`, `type:*`, `area:*`, `priority:*` giữ phân loại công việc.',
      '', '**Phạm vi:** M1 tập trung thiết kế; M2 yêu cầu ít nhất một module chính. Backlog đầy đủ có cả phần mở rộng, không phải toàn bộ 105 issue đều bắt buộc để nộp M2.',
      '', '## Task và ticket tương ứng','']
    for eid,slug,name,_,_,_,_ in b.GROUPS:
        lines += [f'### [TMC-{eid:03} — {name}]({mapping[eid]["url"]})','']
        members=[t for t in tickets if t.get('feature_slug')==slug and t['id']!=eid]
        for t in sorted(members,key=lambda t:t['id']):
            suffix=' (sub-ticket)' if t.get('parent') in [31,40,41,42,43] else ''
            lines.append(f'- [TMC-{t["id"]:03}]({mapping[t["id"]]["url"]}) {t["title"]}{suffix}')
        if slug=='foundation':lines.append(f'- [TMC-088]({mapping[88]["url"]}) UI foundations and component alignment')
        lines.append('')
    lines += ['## Kiểm chứng','', 'Đã đọc lại đủ 105 item, đối chiếu Task ID, Task, Work Type, dependencies và dữ liệu tiến độ; kiểm tra trạng thái issue, assignees và parent không đổi. Chi tiết: task-project-verified.json và task-project-migration.json. Snapshot hai bảng cũ được giữ trong task-project-source.json và task-project-legacy-backup.json.', '', 'Đây là thao tác tổ chức backlog; không triển khai tính năng hoặc chạy product tests.','']
    (OUT/'README.md').write_text('\n'.join(lines),encoding='utf-8')
    # Historical reports are retained; this manifest identifies the active project.
    b.save('active-project.json',dict(id=NEW,owner='tungbinhdinh89-dev',number=2,url=dst['url']))
    print('Verified all 105 issues and preserved progress; deleted both old TMC projects.',flush=True)

def task_views():
    fields=json.loads((OUT/'task-project-fields.json').read_text(encoding='utf-8'))
    views=snapshot(NEW)['views']['nodes']
    visible=[fields[n]['id'] for n in ['Title','Task ID','Task','Work Type','Assignees','Status','Priority','Parent issue','Sub-issues progress','Dependencies','Target date']]
    mapping=json.loads((OUT/'issue-map.json').read_text(encoding='utf-8'))
    b.gh('api',f'repos/{b.REPO}/issues/{mapping["88"]["number"]}/labels',payload={'labels':['feature:foundation']})
    for eid,slug,name,_,_,_,_ in b.GROUPS:
        title=f'TMC-{eid:03} {name}'
        view=next((v for v in views if v['name']==title),None)
        if not view:view=b.gql('mutation($i:CreateProjectV2ViewInput!){createProjectV2View(input:$i){projectV2View{id}}}',i=dict(projectId=NEW,name=title,layout='TABLE_LAYOUT'))['createProjectV2View']['projectV2View']
        b.gql('mutation($i:UpdateProjectV2ViewInput!){updateProjectV2View(input:$i){projectV2View{id}}}',i=dict(viewId=view['id'],filter=f'label:"feature:{slug}"',configuration=dict(visibleFieldIds=visible)))
        print(f'Task view TMC-{eid:03} configured',flush=True)

def complete():
    dst=snapshot(NEW)
    expected=json.loads((OUT/'task-project-expected.json').read_text(encoding='utf-8'))
    fields=json.loads((OUT/'task-project-fields.json').read_text(encoding='utf-8'))
    rows=[]
    for item in dst['items']:
        got={}
        for f in item['fieldValues']['nodes']:
            if f.get('field'):got[f['field']['name']]=next(f[k] for k in ['text','number','date','name','title'] if f.get(k) is not None)
        for name,value in expected[item['content']['id']].items():
            if got.get(name)==value:continue
            field=fields[name];kind=field['dataType']
            if kind=='SINGLE_SELECT':payload={'singleSelectOptionId':next(o['id'] for o in field['options'] if o['name']==value)}
            else:payload={{'TEXT':'text','NUMBER':'number','DATE':'date'}[kind]:value}
            key,val=next(iter(payload.items()))
            rows.append(f'updateProjectV2ItemFieldValue(input:{{projectId:"{NEW}",itemId:"{item["id"]}",fieldId:"{field["id"]}",value:{{{key}:{json.dumps(val)}}}}}){{projectV2Item{{id}}}}')
    mutations(rows)
    visible=[fields[n]['id'] for n in ['Title','Task ID','Task','Work Type','Assignees','Status','Priority','Parent issue','Sub-issues progress','Dependencies','Target date','Labels']]
    for index,(name,fil) in enumerate([('Tasks & Tickets',''),('Tasks','label:"level:task"'),('Implementation Tickets','-label:"level:task"'),('Review Queue','status:"In review"'),('Blocked','status:Blocked')]):
        view=next((v for v in dst['views']['nodes'] if v['name']==name),None)
        if not view and index==0:view=dst['views']['nodes'][0]
        if not view:view=b.gql('mutation($i:CreateProjectV2ViewInput!){createProjectV2View(input:$i){projectV2View{id}}}',i=dict(projectId=NEW,name=name,layout='TABLE_LAYOUT'))['createProjectV2View']['projectV2View']
        b.gql('mutation($i:UpdateProjectV2ViewInput!){updateProjectV2View(input:$i){projectV2View{id}}}',i=dict(viewId=view['id'],name=name,layout='TABLE_LAYOUT',filter=fil,configuration=dict(visibleFieldIds=visible)))
    repo=b.gh('api',f'repos/{b.REPO}')
    b.gql('mutation($i:LinkProjectV2ToRepositoryInput!){linkProjectV2ToRepository(input:$i){repository{id}}}',i=dict(projectId=NEW,repositoryId=repo['node_id']))
    b.gql('mutation($i:UpdateProjectV2Input!){updateProjectV2(input:$i){projectV2{id}}}',i=dict(projectId=NEW,readme='14 Tasks → 91 implementation tickets, including 15 sub-tickets; 105 existing GitHub issues. Use Task-specific table views or filter the Task column. Assignees and existing progress preserved. Backlog → Ready → In progress → In review → Done; Blocked records reason and next action. Human acceptance required before Done. M2 requires at least one main module; this backlog includes optional extensions.'))
    print('Metadata, table views and repository link completed.',flush=True)

if __name__=='__main__':
    {'migrate':migrate,'complete':complete,'task-views':task_views,'verify-delete':verify_delete}[sys.argv[1]]()
