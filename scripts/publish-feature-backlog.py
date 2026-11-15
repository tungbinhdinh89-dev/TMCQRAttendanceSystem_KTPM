"""Author and synchronize the explicitly requested TMC feature backlog via gh.

No application code, assignment, due date, issue state or repository rule changes.
Remote IDs are recorded immediately for safe resumption.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "doc/backlog-2026-11-14"
OUT.mkdir(exist_ok=True)
REPO = "tungbinhdinh89/TMCQRAttendanceSystem_KTPM"
PROJECT = "PVT_kwHODenJ1c4BqGqu"
OWNER = "stephen89-hcmut"


def gh(*args, payload=None):
    command = ["gh", *args]
    if payload is not None:
        command += ["--input", "-"]
    result = subprocess.run(command, input=json.dumps(payload, ensure_ascii=False) if payload is not None else None,
                            capture_output=True, encoding="utf-8", cwd=ROOT)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return json.loads(result.stdout) if result.stdout.strip() else None


def gql(query, **variables):
    result = gh("api", "graphql", payload={"query": query, "variables": variables})
    if result.get("errors"):
        raise RuntimeError(json.dumps(result["errors"], ensure_ascii=False))
    return result["data"]


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def inspect():
    issues = gh("issue", "list", "--repo", REPO, "--state", "all", "--limit", "500", "--json", "number,id,title,body,state,labels,url")
    save("remote-before.json", issues)
    schema = gql('{mutation:__type(name:"Mutation"){fields{name args{name type{kind name ofType{kind name}}}}} project:node(id:"' + PROJECT + '"){... on ProjectV2{id title url viewerCanUpdate views(first:30){nodes{id name layout filter}} fields(first:50){nodes{... on ProjectV2Field{id name dataType} ... on ProjectV2SingleSelectField{id name options{id name}}}}}}}')
    save("project-before.json", schema["project"])
    save("mutation-schema.json", schema["mutation"])
    print(json.dumps(schema["project"], ensure_ascii=False))
    print("View mutations:", [f["name"] for f in schema["mutation"]["fields"] if "ProjectV2View" in f["name"]])


def schema():
    result = {}
    for name in ["ProjectV2ViewConfigurationInput", "ProjectV2SingleSelectFieldOptionInput"]:
        result[name] = gql('query{__type(name:"' + name + '"){inputFields{name type{kind name ofType{kind name}}}}}')
    save('view-schema.json',result)
    print(json.dumps(result,ensure_ascii=False))


# Epic ID, feature slug, name, direct children, priority, area, outcome.
GROUPS = [
 (89,"authorization","Authorization & session RBAC",[7,8,50,87],"P0","security","Mọi API nghiệp vụ kiểm tra session, permission và scope ở server; không phụ thuộc việc ẩn nút UI."),
 (90,"employee","Employee Management",[55,56,57],"P0","backend","HR tạo/sửa/trạng thái nhân viên và phân công có hiệu lực, lưu thật và giữ lịch sử."),
 (91,"qr","QR Credential Management",[9,10,11,15,17],"P0","security","QR do server ký, ngắn hạn, thu hồi được và chống replay nguyên tử."),
 (92,"gate-config","Gate & Factory Configuration",[6,39,72,73,74,83,84],"P0","backend","Tổ chức/trạm/credential/cấu hình version được quản trị đúng quyền; heartbeat phản ánh dữ liệu nhận thực tế."),
 (93,"gate-processing","Gate Scan & Access Processing",[12,13,14,16,18,27],"P0","backend","Station xác thực gửi scan; policy, TCS adapter và UI phân biệt quyết định truy cập với kết quả mở/qua cổng."),
 (94,"attendance","Attendance Event Recording",[19,20,21],"P0","backend","Lưu sự kiện và revision từ bằng chứng được chấp thuận; truy vấn cá nhân/phạm vi không ghi trùng."),
 (95,"reliability","Reliability, Recovery & Offline Policy",[22,23,24,25,26,42],"P0","backend","Mất mạng/ACK hoặc crash không mất dữ liệu đã nhận bền vững và không tự phát lại tác động vật lý chưa rõ."),
 (96,"audit","Audit & Traceability",[103],"P0","security","Thao tác quan trọng có audit bền vững, truy vấn đúng scope và không lộ bí mật."),
 (97,"reporting","Reporting & HRS Integration",[28,41,75,76,77],"P1","backend","Báo cáo đúng scope, snapshot tháng bất biến và giao nhận HRS có ACK/retry/đối soát."),
 (98,"administration","Administration: Accounts & Role Assignments",[43,58,59],"P1","security","ADM quản lý tài khoản và role assignment có scope/hiệu lực, không tự nâng quyền nghiệp vụ HR."),
 (99,"extended-business","Nghiệp vụ mở rộng: ca làm & hiệu chỉnh",[40,104,105],"P2","backend","Có mô hình ca, ghép công và correction có revision; quy tắc ca đêm/thiếu lượt được công bố."),
 (100,"architecture","Architecture, Privacy & Assignment Deliverables",[1,33,34,35,36,37,78,79,80,81,82,86],"P0","architecture","Báo cáo M1/M2, ba views, SOLID/reflection và policy dữ liệu khớp phạm vi code đã kiểm chứng."),
 (101,"foundation","Foundation, Delivery & Operations",[2,3,4,5,44,45,46,47,48,49,54,88],"P1","devops","Workspace/migration/CI/runbook và quản trị backlog tái lập được; chỉ sửa gap đã xác minh."),
 (102,"verification","Verification: API, DB, E2E & NFR",[29,30,31,32,38,85],"P0","backend","Có bằng chứng PostgreSQL, race/crash, quyền, E2E và đo latency trên revision ứng viên."),
]


def author():
    source = json.loads((ROOT / ".tmp-backlog-authoring/tickets.json").read_text(encoding="utf-8"))
    tickets = {t["id"]: t for t in source}
    # Refresh stale foundation descriptions against the audited working tree.
    updates = {
      2:"Client đã ở client/src, có React/Vite/Tailwind/Astra/MUI. Kiểm chứng cấu hình/build/preview hiện tại; không di chuyển source lần nữa.",
      3:"NestJS và contracts đã có. Hoàn thiện wiring, application ports và DTO cho nghiệp vụ còn thiếu; không dựng lại scaffold.",
      4:"ORM entities/registry/migration đã có. Kiểm chứng constraints và bổ sung migration cho gap thật trên DB test được chỉ định; không reset DB hiện tại.",
      5:"Đã có Node test runner và thay đổi OpenAPI/CI trong workspace. Đối chiếu manifest/revision khi nhận ticket; bổ sung check còn thiếu, không ghi đè thay đổi chưa commit.",
      6:"Đã có seed tài khoản local có chủ đích. Kiểm chứng role/scope và chuẩn bị station fixtures trên DB test riêng; không tạo dữ liệu vận hành giả hoặc tự xoay mật khẩu DB hiện tại.",
      7:"Login/me/logout cookie session đã có. Bổ sung permission guard/policy và scope theo từng operation; giữ session authentication, đề không yêu cầu JWT.",
      8:"Đăng nhập thật và route/menu theo role đã có. Kiểm chứng expired session, logout/đổi user và cập nhật quyền; không coi frontend là biên bảo mật.",
      50:"Bootstrap hiện yêu cầu session và lọc scope. Kiểm chứng hồi quy, sửa gap có bằng chứng; xem xét hợp nhất nhiều role assignment thay vì chọn role đầu tiên.",
    }
    for n, problem in updates.items():
        tickets[n]["problem"] = problem
    tickets[6]['tasks'] = ['Đối chiếu seed tài khoản với sáu role và scope; không tự tạo lịch sử công/QR/lượt quét.', 'Chuẩn bị factory/station IN/OUT fixtures có chủ đích trên DB test, bao gồm credential hết hạn/thu hồi và nhân viên inactive.']
    tickets[6]['cases'] = ['Đăng nhập sáu role và gọi API theo scope trên DB test; xác nhận không lộ dữ liệu nhà máy khác.', 'Kiểm tra direction/device ID và station credential của fixtures; chứng minh script không reset DB hoặc chạy seed khi API khởi động.']
    tickets[55]["priority"] = tickets[56]["priority"] = tickets[57]["priority"] = "P0"
    tickets[72]["priority"] = tickets[73]["priority"] = tickets[74]["priority"] = "P0"
    tickets[41]["priority"] = "P1"
    tickets[87]["priority"] = "P1"
    tickets[7]["tasks"] = ["Tách xác thực session và kiểm tra permission/scope thành guard/policy tái sử dụng; mặc định từ chối.","Áp dụng ở API nghiệp vụ ngay khi tạo; kiểm tra object thuộc factory/department/team/self từ dữ liệu server.","Chốt semantics nhiều role assignment; không ghép scope của role này với permission của role khác."]
    tickets[7]["ac"] += ["Request hợp lệ nhưng thiếu permission hoặc ngoài scope bị 403 khi gọi API trực tiếp.","Nhiều assignment được xử lý theo policy đã chốt, không mất scope hợp lệ hoặc tự mở rộng quyền."]
    tickets[55]["tasks"] = ["Xây query/create/update/deactivate/reactivate employee API và DTO validation.","Bảo vệ unique employeeCode, optimistic conflict và mapping HRS; không xóa cứng lịch sử.","Deactivate vô hiệu hóa truy cập/session/QR theo policy trong transaction hoặc workflow phục hồi đã chứng minh; reactivate không hồi sinh token đã thu hồi."]
    tickets[55]["ac"] += ["Tạo/sửa/trạng thái tồn tại sau reload; dữ liệu sai/duplicate/stale update không ghi một phần.","Reactivate tuân policy cấp quyền mới, không khôi phục QR/session đã revoke."]
    tickets[57]["ac"] += ["Form lưu qua API và reload đọc đúng dữ liệu; bỏ badge Dữ liệu mẫu trên màn dùng dữ liệu thật; không thông báo thành công khi API lỗi."]
    tickets[43]["children"] = [60,61]
    tickets[40]["children"] = [62,63,64]
    tickets[41]["children"] = [65,66,67,68]
    tickets[42]["children"] = [69,70,71]
    tickets[31]["children"] = [51,52,53]
    tickets[103] = dict(id=103,title="Implement durable audit writes and scoped audit search",type="FEATURE",priority="P0",deps=[7,4],parent=None,paths=["api/src/modules/iam","contracts/src"],req=["NFR-3","NFR-4"],problem="AuditEntry mới có persistence; chưa có use case ghi/query audit cho thao tác nghiệp vụ.",tasks=["Định nghĩa audit port và event schema actor/action/object/outcome/reason/correlationId; redact dữ liệu nhạy cảm.","Ghi audit thay đổi dữ liệu cùng transaction; thất bại đăng nhập/từ chối quyền có đường ghi riêng phù hợp.","Thêm query API có scope, filter/pagination và UI tra cứu tối thiểu; không cung cấp sửa/xóa audit qua UI."],ac=["Tạo/sửa employee, revoke QR, đổi role/station, correction và export có audit truy vết theo operation đã triển khai.","Rollback thay đổi nghiệp vụ không để audit thành công giả; lỗi audit bắt buộc không bị bỏ qua im lặng.","EMP/EXE không đọc log ngoài quyền; log không chứa mật khẩu, raw session/QR, station secret hoặc private key."],cases=["Kiểm tra commit/rollback và audit ở DB test; correlationId nối request với attempt/command.","Gọi trực tiếp query audit ngoài scope; kiểm tra redaction bằng payload chứa dữ liệu nhạy cảm."],children=[])
    tickets[104] = dict(id=104,title="Implement shift definitions and effective employee schedules",type="FEATURE",priority="P2",deps=[4,7,55,56],parent=None,paths=["api/src/modules/att","contracts/src/attendance.ts"],req=["Extension: shift policy"],problem="UI ca làm tồn tại nhưng chưa có API/persistence nghiệp vụ hoàn chỉnh; cần refine schema thay vì ghi shiftId giả.",tasks=["Chốt owner ATT, timezone, ca đêm, khoảng hiệu lực, grace và policy ca chồng lấn.","Tạo entity/registry/migration/constraints và API CRUD trạng thái ca, gán lịch hiệu lực theo scope.","Giữ lịch sử lịch ca; xác định version lịch dùng để tính lại công và ảnh hưởng snapshot HRS."],ac=["Ca 22h–06h xác định ngày nghiệp vụ đúng theo policy; kiểm tra giờ, hiệu lực và chồng lấn.","Gán ca ngoài scope hoặc update stale bị từ chối; thay lịch không ghi đè lịch sử hoặc snapshot đã phát hành."],cases=["Migration up/down trên DB test; CRUD/gán ca và reload qua API.","Test timezone, đổi ngày/ca đêm, chồng lấn, effective date và quyền khác factory."],children=[])
    tickets[105] = dict(id=105,title="Connect shift and schedule screens to persisted APIs",type="UI",priority="P2",deps=[104,57],parent=None,paths=["client/src/features/shifts","client/src/data/api.ts","client/src/features/employees"],req=["Extension: shift policy"],problem="saveShift/assignShift hiện luôn từ chối; cần nối API ca/lịch sau khi contract được chốt.",tasks=["Nối danh sách/form ca, gán ca theo hiệu lực và lịch sử vào API thật.","Dùng factory/department/team IDs từ server; hỗ trợ loading/empty/403/409/lỗi mạng và thao tác bàn phím."],ac=["Tạo/sửa/gán lịch và reload vẫn đúng DB; lỗi API không hiển thị thành công.","UI ca đêm và hiệu lực nhất quán policy; chỉ mở nút theo capability server, API vẫn kiểm tra quyền."],cases=["E2E HR đúng scope CRUD và gán lịch; EMP chỉ xem lịch cá nhân nếu được cấp.","Kiểm tra responsive, lỗi mạng và stale update 409."],children=[])
    membership = {}
    for eid, slug, name, ids, priority, area, outcome in GROUPS:
        for n in ids:
            membership[n] = eid
            if n != 88:
                tickets[n]["parent"] = eid
        tickets[eid] = dict(id=eid,title=name,type="EPIC",priority=priority,parent=None,deps=[],paths=[],req=["M1/M2 scope: see child tickets"],problem=outcome,tasks=["Refine và phân công các ticket con; xác nhận contract/phụ thuộc trước khi chuyển Ready.","Tích hợp phần đã triển khai và đối chiếu tiêu chí từng ticket với evidence đúng revision."],ac=["Tất cả ticket con thuộc phạm vi cam kết được nghiệm thu; phần hoãn có lý do và liên kết rõ.","Luồng tính năng tích hợp đạt kiểm chứng; không suy Done từ sự tồn tại schema/UI hay việc import backlog."],cases=["Review AC/evidence/limitations của ticket con và demo tích hợp tính năng."],children=ids,feature_slug=slug,area=area)
    for p in [31,40,41,42,43]:
        for child in tickets[p]["children"]:
            tickets[child]["parent"] = p
            membership[child] = membership[p]
    for n,t in tickets.items():
        if t["type"] != "EPIC":
            epic = tickets[membership[n]]
            t["feature_slug"] = epic["feature_slug"]
            paths = " ".join(t.get("paths",[]))
            t["area"] = "frontend" if paths.startswith("client/") else epic["area"]
        # Remove inferred dates/effort; planning is not an owner commitment.
        for key in ["start","target","hours","legacy_hours","rank","baseline","milestone","available","source"]:
            t.pop(key,None)
    assert set(tickets) == set(range(1,106)) - {88}
    for t in tickets.values():
        for d in t["deps"]:
            assert d in tickets or d == 88
    def walk(n, trail):
        assert n not in trail, f"Dependency cycle: {trail + [n]}"
        for d in tickets[n]["deps"]:
            if d in tickets: walk(d, trail+[n])
    for n in tickets: walk(n,[])
    save("tickets.json", list(tickets.values()))
    print("Authored",len(tickets),"items plus existing TMC-088; 14 feature epics")


def issue_body(t, mapping):
    def ref(n):
        return f"[TMC-{n:03}]({mapping[n]['url']})" if n in mapping else f"TMC-{n:03} (reserved; pending publication)"
    lines = [f"## TMC-{t['id']:03} · {t['title']}","",f"**Type:** {t['type']} · **Feature:** {t['feature_slug']} · **Priority:** {t['priority']} · **Area:** {t['area']}","",f"**Parent:** {ref(t['parent']) if t.get('parent') else 'Feature epic'}",f"**Dependencies:** {', '.join(ref(n) for n in t['deps']) or 'Không có; refine contract khi nhận việc.'}","**Assignee / estimate / target date:** Chưa phân công hoặc cam kết; người phụ trách cập nhật sau refinement.","","### Problem / Outcome",t['problem'],"","### Scope / Implementation checklist"]
    lines += [f"- [ ] {s}" for s in t['tasks']]
    lines += ["","### Acceptance criteria"]+[f"- [ ] AC{i}: {s}" for i,s in enumerate(t['ac'],1)]
    lines += ["","### Verification plan"]+[f"- [ ] {s}" for s in t['cases']]
    lines += ["- [ ] Chọn lệnh check từ manifest tại revision thực hiện. Không truyền --runInBand cho Node test runner. Integration chỉ dùng môi trường DB test đã chỉ định; không reset/seed DB hiện tại.","","### Deliverables", "- PR/diff, contracts/migration khi có thay đổi và evidence gắn revision; đánh giá từng AC, lỗi và giới hạn."]
    if t.get("paths"):
        lines += ["- Module/file định hướng: "+", ".join('`'+p+'`' for p in t['paths'])+"; kiểm tra đường dẫn thực tế khi nhận việc."]
    if t.get("children"):
        lines += ["","### Child tickets"]+[f"- [ ] {ref(n)}" for n in t['children']]
    lines += ["","### Definition of Done","- [ ] Mọi AC trong scope có evidence thật; build/typecheck/tests phù hợp phần thay đổi đạt; UI có visual check nếu áp dụng.","- [ ] Thay đổi đúng bounded context; contracts không phụ thuộc framework/ORM; thay schema có migration/constraint plan, không synchronize.","- [ ] PR được người dùng review/nghiệm thu; không tự merge/approve hoặc đánh dấu Done.","- [ ] Cập nhật tài liệu và giới hạn; simulator không chứng minh tích hợp thiết bị/HRS thật.","","### Sources / Scope notes",f"- [M1](https://github.com/{REPO}/blob/main/doc/SA_CC_hk261_Assignment_M1.pdf), [M2](https://github.com/{REPO}/blob/main/doc/SA_CC_hk261_Assignment_M2.pdf), kiến trúc/schema/workflow trong doc/.","- M1 tập trung thiết kế; M2 yêu cầu ít nhất một module chính. P0/P1/P2 là ưu tiên backlog nội bộ, không phải mọi ticket P0 đều là điều kiện bắt buộc của đề.","- Các quy tắc QR/offline/ca/retention chi tiết là quyết định thiết kế cần chốt; không tuyên bố là yêu cầu nguyên văn đề.","- Baseline 2026-11-14: rà soát tĩnh; tạo/cập nhật issue không chứng minh tính năng đã hoàn thành.",""]
    return "\n".join(lines)


def publish():
    tickets = json.loads((OUT / "tickets.json").read_text(encoding="utf-8"))
    remote = gh("issue","list","--repo",REPO,"--state","all","--limit","500","--json","number,id,title,url")
    mapping = {}
    for r in remote:
        m = re.search(r"TMC-(\d+)",r["title"])
        if m:
            n = int(m[1]); assert n not in mapping, f"Duplicate TMC ID {n}"
            mapping[n]=r
    save("issue-map.json",mapping)
    labels = {"type:epic":("7057FF","Feature parent; aggregate acceptance, not extra implementation effort"),"type:task":("5319E7","Implementation task"),"type:feature":("1D76DB","Feature implementation"),"type:test":("0E8A16","Verification and evidence"),"type:documentation":("0075CA","Architecture or documentation"),"type:subtask":("C5DEF5","Child task under an implementation ticket")}
    for _,slug,name,_,_,_,_ in GROUPS:
        labels["feature:"+slug] = ("D4C5F9",name[:100])
    current = {x['name'] for x in gh('api',f'repos/{REPO}/labels?per_page=100')}
    for name,(color,description) in labels.items():
        if name not in current:
            gh('api',f'repos/{REPO}/labels',payload=dict(name=name,color=color,description=description))
    for t in tickets:
        n=t['id']
        typ = 'epic' if t['type']=='EPIC' else 'subtask' if t.get('parent',0) in [31,40,41,42,43] else 'test' if t['type']=='TEST' else 'documentation' if t['type']=='DOCS' else 'feature' if t['type'] in ['FEATURE','UI','ENHANCEMENT'] else 'task'
        tags=[f'type:{typ}',f'feature:{t["feature_slug"]}',f'priority:{t["priority"]}',f'area:{t["area"]}','milestone:M2']
        title=f'[TMC-{n:03}] [{t["type"]}] {t["title"]}'
        payload=dict(title=title,body=issue_body(t,mapping),labels=tags)
        if n in mapping:
            existing = gh('api',f'repos/{REPO}/issues/{mapping[n]["number"]}')
            # Preserve pre-existing body as a local audit snapshot; never erase discussion/comments.
            save(f'original-{n:03}.json',existing)
            existing_tags = [x['name'] for x in existing['labels'] if not x['name'].startswith(('type:','priority:','feature:','area:'))]
            payload['labels']=list(dict.fromkeys(tags+existing_tags))
            r=gh('api',f'repos/{REPO}/issues/{mapping[n]["number"]}','--method','PATCH',payload=payload)
        else:
            r=gh('api',f'repos/{REPO}/issues',payload=payload)
        mapping[n]=dict(number=r['number'],id=r['node_id'],title=r['title'],url=r['html_url'])
        save('issue-map.json',mapping)
        (OUT/f'TMC-{n:03}.md').write_text(payload['body'],encoding='utf-8')
        print(f'Published TMC-{n:03} -> #{r["number"]}',flush=True)
    # Resolve every forward dependency link once all issue numbers exist.
    for t in tickets:
        body=issue_body(t,mapping)
        gh('api',f'repos/{REPO}/issues/{mapping[t["id"]]["number"]}','--method','PATCH',payload=dict(body=body))
        (OUT/f'TMC-{t["id"]:03}.md').write_text(body,encoding='utf-8')
    print('All issue bodies linked',flush=True)


def configure():
    project = gql('query{node(id:"'+PROJECT+'"){... on ProjectV2{fields(first:60){nodes{... on ProjectV2Field{id name dataType} ... on ProjectV2SingleSelectField{id name options{id name color description}}}} views(first:30){nodes{id name layout}}}}}')['node']
    fields = {f['name']:f for f in project['fields']['nodes']}
    for name,datatype in [('Task ID','TEXT'),('Feature','SINGLE_SELECT'),('Work Type','SINGLE_SELECT'),('Target Date','DATE'),('Dependencies','TEXT')]:
        if name in fields: continue
        inp=dict(projectId=PROJECT,name=name,dataType=datatype)
        if name=='Feature':
            inp['singleSelectOptions']=[dict(name=g[1],color='PURPLE',description=g[2]) for g in GROUPS]
        if name=='Work Type':
            inp['singleSelectOptions']=[dict(name=n,color=c,description=n) for n,c in [('Epic','PURPLE'),('Ticket','BLUE'),('Sub-ticket','GRAY')]]
        r=gql('mutation($i:CreateProjectV2FieldInput!){createProjectV2Field(input:$i){projectV2Field{... on ProjectV2Field{id name dataType} ... on ProjectV2SingleSelectField{id name options{id name}}}}}',i=inp)
        fields[name]=r['createProjectV2Field']['projectV2Field']
    status=fields['Status']
    options=status['options']
    existing={x['name'] for x in options}
    for name,color,desc in [('Ready','BLUE','Dependencies and acceptance refined; ready to assign'),('In Review','PURPLE','PR/evidence waiting for human review'),('Blocked','RED','Record blocker, owner and next action')]:
        if name not in existing: options.append(dict(name=name,color=color,description=desc))
    gql('mutation($i:UpdateProjectV2FieldInput!){updateProjectV2Field(input:$i){projectV2Field{... on ProjectV2SingleSelectField{id name options{id name}}}}}',i=dict(fieldId=status['id'],singleSelectOptions=options))
    readme='''# TMC Access — Assignment M1/M2 Delivery

Repository: https://github.com/'''+REPO+'''

Feature Epic → implementation Ticket → Sub-ticket where independently assignable. TMC-NNN is a stable local ID; GitHub #number is a separate remote identifier. IDs 001–088 are retained; 089–102 are feature epics, 103 audit implementation, 104–105 shift API/UI. Epic rows aggregate child acceptance and must not be counted as additional implementation effort.

Use Feature Backlog table to assign work. Filter by Feature/Priority/Work Type, set Assignees, and use Parent issue / Sub-issues progress. Existing Todo means backlog. Workflow: Todo → Ready → In Progress → In Review → Done; Blocked requires reason and next action. Done requires human acceptance and applicable verification; no automatic Done/merge authorization.

P0 is the internal critical path; P1 supporting/full system; P2 optional extension. M2 requires at least one main module, not every issue. Proposed main slice: QR → station scan → TCS decision/result → evidence-based attendance, including network failure and replay protection. Full employee/configuration CRUD and reports are tracked separately. All priority details remain in tickets.

Assignments, estimates and target dates are deliberately uncommitted. Existing assignments/statuses are preserved. Imported/created issues do not prove implementation or tests passed. Baseline: 2026-11-14 Asia/Saigon. Simulators do not prove physical hardware/HRS integration. No DB reset, deployment or source implementation is part of this backlog operation.
'''
    gql('mutation($i:UpdateProjectV2Input!){updateProjectV2(input:$i){projectV2{id title url}}}',i=dict(projectId=PROJECT,title='TMC Access — Assignment M1/M2 Delivery',shortDescription='Feature epics, tickets, sub-tickets and acceptance evidence for QR access and attendance.',readme=readme))
    visible=[fields[n]['id'] for n in ['Title','Task ID','Feature','Work Type','Assignees','Status','Priority','Parent issue','Sub-issues progress','Dependencies','Target Date','Labels']]
    views=project['views']['nodes']
    # Reuse the original table, preserving its ID/link.
    base=next((v for v in views if v['name'] in ['View 1','Feature Backlog']),views[0])
    gql('mutation($i:UpdateProjectV2ViewInput!){updateProjectV2View(input:$i){projectV2View{id name layout}}}',i=dict(viewId=base['id'],name='Feature Backlog',layout='TABLE_LAYOUT',configuration=dict(visibleFieldIds=visible)))
    for name,filter_text in [('Feature Epics','label:"type:epic"'),('Critical Path P0','label:"priority:P0" -label:"type:epic"'),('Review Queue','status:"In Review"'),('Blocked Work','status:Blocked')]:
        v=next((v for v in views if v['name']==name),None)
        if not v:
            v=gql('mutation($i:CreateProjectV2ViewInput!){createProjectV2View(input:$i){projectV2View{id name layout}}}',i=dict(projectId=PROJECT,name=name,layout='TABLE_LAYOUT',configuration=dict(visibleFieldIds=visible)))['createProjectV2View']['projectV2View']
        gql('mutation($i:UpdateProjectV2ViewInput!){updateProjectV2View(input:$i){projectV2View{id name filter}}}',i=dict(viewId=v['id'],filter=filter_text))
    save('project-fields.json',fields)
    repository=gh('api',f'repos/{REPO}')
    try:
        gql('mutation($i:LinkProjectV2ToRepositoryInput!){linkProjectV2ToRepository(input:$i){repository{id}}}',i=dict(projectId=PROJECT,repositoryId=repository['node_id']))
    except RuntimeError as exc:
        if 'same owner' not in str(exc): raise
        save('repository-link-limitation.json',dict(reason='GitHub only links same-owner repositories and projects',projectOwner=OWNER,repository=REPO))
        print('Repository tab link unavailable across owners; issue items still supported.',flush=True)
    print('Configured project fields and five saved table views',flush=True)


def batch_mutations(mutations):
    results=[]
    for offset in range(0,len(mutations),12):
        part=mutations[offset:offset+12]
        result=gql('mutation{'+''.join(f'm{i}:'+m for i,m in enumerate(part))+'}')
        results.extend(result.values())
        print(f'Mutations {offset+len(part)}/{len(mutations)}',flush=True)
    return results


def populate():
    tickets={t['id']:t for t in json.loads((OUT/'tickets.json').read_text(encoding='utf-8'))}
    mapping={int(k):v for k,v in json.loads((OUT/'issue-map.json').read_text(encoding='utf-8')).items()}
    # Inspect before adding parents; never replace an unrelated existing parent.
    entries=[]
    for offset in range(0,len(mapping),40):
        ids=[v['id'] for v in list(mapping.values())[offset:offset+40]]
        entries+=gql('query($ids:[ID!]!){nodes(ids:$ids){... on Issue{id number parent{id} }}}',ids=ids)['nodes']
    parents={e['id']:(e['parent']['id'] if e['parent'] else None) for e in entries}
    muts=[]
    for n,t in tickets.items():
        if not t.get('parent'): continue
        child=mapping[n]['id']; parent=mapping[t['parent']]['id']
        if parents.get(child)==parent: continue
        assert parents.get(child) is None, f'TMC-{n}: existing parent differs; manual reconciliation required'
        muts.append('addSubIssue(input:'+json.dumps(dict(issueId=parent,subIssueId=child)).replace('"issueId":','issueId:').replace('"subIssueId":','subIssueId:')+'){issue{id} subIssue{id}}')
    # TMC-088 remains unchanged, but belongs under Foundation.
    if not parents.get(mapping[88]['id']):
        muts.append(f'addSubIssue(input:{{issueId:"{mapping[101]["id"]}",subIssueId:"{mapping[88]["id"]}"}}){{issue{{id}} subIssue{{id}}}}')
    batch_mutations(muts)
    existing=[]; cursor=None
    while True:
        r=gql('query($id:ID!,$cursor:String){node(id:$id){... on ProjectV2{items(first:100,after:$cursor){nodes{id content{... on Issue{id number}} fieldValueByName(name:"Status"){... on ProjectV2ItemFieldSingleSelectValue{name}}} pageInfo{hasNextPage endCursor}}}}}',id=PROJECT,cursor=cursor)['node']['items']
        existing+=r['nodes']
        if not r['pageInfo']['hasNextPage']: break
        cursor=r['pageInfo']['endCursor']
    items={x['content']['id']:x for x in existing if x.get('content',{}).get('id')}
    missing=[v for v in mapping.values() if v['id'] not in items]
    added=batch_mutations([f'addProjectV2ItemById(input:{{projectId:"{PROJECT}",contentId:"{v["id"]}"}}){{item{{id content{{... on Issue{{id number}}}}}}}}' for v in missing])
    for r in added:
        item=r['item']; items[item['content']['id']]=item
    fields=json.loads((OUT/'project-fields.json').read_text(encoding='utf-8'))
    # Refresh status option IDs after extending options.
    current=gql('query{node(id:"'+PROJECT+'"){... on ProjectV2{fields(first:60){nodes{... on ProjectV2SingleSelectField{id name options{id name}}}}}}}')['node']['fields']['nodes']
    fields.update({f['name']:f for f in current if 'name' in f})
    muts=[]
    for n,v in mapping.items():
        item=items[v['id']]
        t=tickets.get(n,dict(id=88,feature_slug='foundation',priority='P1',area='frontend',deps=[],parent=101,type='FEATURE'))
        kind='Epic' if t['type']=='EPIC' else 'Sub-ticket' if t.get('parent') in [31,40,41,42,43] else 'Ticket'
        values={'Task ID':f'TMC-{n:03}','Feature':t['feature_slug'],'Work Type':kind,'Priority':t['priority'],'Area':{'frontend':'Frontend','backend':'Backend','security':'Security','architecture':'Architecture','devops':'DevOps'}[t['area']],'Dependencies':', '.join(f'TMC-{d:03}' for d in t['deps']) or 'None'}
        if not item.get('fieldValueByName'): values['Status']='Todo'
        for name,value in values.items():
            field=fields[name]
            val={'singleSelectOptionId':next(o['id'] for o in field['options'] if o['name']==value)} if 'options' in field else {'text':value}
            key,nextvalue=next(iter(val.items()))
            muts.append(f'updateProjectV2ItemFieldValue(input:{{projectId:"{PROJECT}",itemId:"{item["id"]}",fieldId:"{field["id"]}",value:{{{key}:{json.dumps(nextvalue)}}}}}){{projectV2Item{{id}}}}')
    batch_mutations(muts)
    save('project-items.json',items)
    print('Hierarchy and project metadata populated',flush=True)


def verify():
    tickets={t['id']:t for t in json.loads((OUT/'tickets.json').read_text(encoding='utf-8'))}
    mapping={int(k):v for k,v in json.loads((OUT/'issue-map.json').read_text(encoding='utf-8')).items()}
    assert len(mapping)==105
    remote=gh('issue','list','--repo',REPO,'--state','all','--limit','500','--json','number,id,title,body,state,labels,url,assignees')
    save('remote-after.json',remote)
    indexed={r['id']:r for r in remote}
    for n,t in tickets.items():
        r=indexed[mapping[n]['id']]
        assert f'TMC-{n:03}' in r['title']
        for section in ['### Problem / Outcome','### Acceptance criteria','### Verification plan','### Definition of Done','### Deliverables']:
            assert section in r['body'],(n,section)
        assert 'pending publication' not in r['body'],n
        assert f'feature:{t["feature_slug"]}' in [l['name'] for l in r['labels']]
        assert f'priority:{t["priority"]}' in [l['name'] for l in r['labels']]
    before=json.loads((OUT/'remote-before.json').read_text(encoding='utf-8'))
    for r in before:
        assert indexed[r['id']]['state']==r['state'],r['number']
    project=gql('query{node(id:"'+PROJECT+'"){... on ProjectV2{id title url public viewerCanUpdate views(first:30){nodes{id name number layout filter}} fields(first:60){nodes{... on ProjectV2Field{id name} ... on ProjectV2SingleSelectField{id name options{id name}}}}}}}')['node']
    items=[]; cursor=None
    while True:
        page=gql('query($id:ID!,$cursor:String){node(id:$id){... on ProjectV2{items(first:100,after:$cursor){nodes{id content{... on Issue{id number parent{id} subIssuesSummary{total completed}}} fieldValues(first:30){nodes{... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2Field{name}}} ... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2SingleSelectField{name}}}}}} pageInfo{hasNextPage endCursor}}}}}',id=PROJECT,cursor=cursor)['node']['items']
        items+=page['nodes']
        if not page['pageInfo']['hasNextPage']:break
        cursor=page['pageInfo']['endCursor']
    bycontent={i['content']['id']:i for i in items if i.get('content',{}).get('id')}
    for n,m in mapping.items():
        assert m['id'] in bycontent,n
        i=bycontent[m['id']]
        values={f['field']['name']:f.get('text',f.get('name')) for f in i['fieldValues']['nodes'] if f.get('field')}
        assert values['Task ID']==f'TMC-{n:03}',n
        assert values.get('Status'),n
        if n!=88:
            assert values['Feature']==tickets[n]['feature_slug'],n
            if tickets[n].get('parent'):
                assert i['content']['parent']['id']==mapping[tickets[n]['parent']]['id'],n
    table=next(v for v in project['views']['nodes'] if v['name']=='Feature Backlog')
    assert table['layout']=='TABLE_LAYOUT'
    save('verification.json',dict(result='PASS',issues=len(mapping),epics=len(GROUPS),tickets=91,subTickets=15,hierarchyEdges=91,views=project['views']['nodes'],project=project,items=items,checks=['IDs unique; all 105 mapped issues in project','104 authored issues have description/AC/verification/DoD/deliverables','Forward links resolved; feature and priority labels match','Existing issue states preserved','Native parents match; Task ID/Feature/Status populated','Feature Backlog uses TABLE_LAYOUT']))
    url=project['url']+'/views/'+str(table['number'])
    summary=['# TMC Access — Feature Backlog','',f'[Mở Project Table]({url}) · [Repository issues](https://github.com/{REPO}/issues)','',
      'Baseline: 2026-11-14, Asia/Saigon. 105 issue gồm 14 Epic và 91 ticket thực thi (18 ticket nằm dưới ticket cha). Tái sử dụng 44 issue; tạo mới 61. TMC-088 được giữ nguyên nội dung và đưa vào Foundation.',
      '', '## Quy ước','', '`[TMC-NNN] [TYPE] Name`. ID TMC là mã ổn định, khác số GitHub #issue. Epic → ticket → sub-ticket dùng native sub-issues; không tạo thêm hệ mã con khó đổi khi chuyển cha.',
      '', 'Labels: `type:*`, `feature:*`, `area:*`, `priority:P0/P1/P2`, `milestone:M2`. P0 là ưu tiên nội bộ; đề M2 chỉ yêu cầu ít nhất một module chính. Các phần mở rộng có thể hoãn sau khi chốt scope.',
      '', '## Nhóm công việc','', '| Epic | Tính năng | Ticket con trực tiếp |','|---|---|---|']
    for eid,slug,name,children,_,_,_ in GROUPS:
        summary.append(f'| [TMC-{eid:03}]({mapping[eid]["url"]}) | {name} | {len(children)} |')
    summary += ['', '## Cách dùng bảng','',
      '1. Lọc Feature hoặc mở Feature Epics để xem nhóm lớn; mở issue để đọc AC và phụ thuộc.',
      '2. Phân công ở Assignees; refine scope, estimate và Target Date trước khi chuyển Ready.',
      '3. Todo → Ready → In Progress → In Review → Done. Blocked phải ghi lý do, người xử lý và bước tiếp theo. Giữ Todo làm backlog để bảo toàn status hiện có.',
      '4. Người review đối chiếu từng AC với evidence thật rồi mới nghiệm thu. Không tự merge hoặc tự Done. Epic chỉ tổng hợp tiến độ con, không cộng thêm effort.',
      '', 'Project có 5 saved table views: Feature Backlog, Feature Epics, Critical Path P0, Review Queue, Blocked Work. Các cột chính: Title, Task ID, Feature, Work Type, Assignees, Status, Priority, Parent issue, Sub-issues progress, Dependencies, Target Date, Labels.',
      '', '## Thứ tự đề xuất','', 'Chốt policy/phạm vi và nền tảng → authorization/audit → QR và station → scan/TCS → attendance → recovery và kiểm thử → báo cáo/bàn giao. Employee/configuration CRUD chạy song song khi contracts và quyền đã rõ; Administration/HRS/ca làm theo scope nhóm cam kết.',
      '', '## Giới hạn và kiểm chứng','',
      'Chỉ author/synchronize backlog; không triển khai tính năng hoặc chạy product tests. Đã kiểm chứng metadata/hierarchy/labels/links/project ở remote; chi tiết trong verification.json. Không gán assignee/ngày hạn và không thay trạng thái issue hiện có.',
      '', 'Project thuộc stephen89-hcmut; repository thuộc tungbinhdinh89. GitHub không cho link Project vào tab Projects của repo khi khác owner, nhưng issue vẫn có đầy đủ trong bảng. Mở bằng URL trực tiếp ở đầu tài liệu. Giữ nguyên visibility của Project hiện có.',
      '', 'Nguồn registry cũ: .tmp-backlog-authoring/tickets.json (TMC-001…087), doc/tickets/TMC-088.md. Snapshot trước/sau, issue-map.json, tickets.json và từng body TMC-NNN.md nằm cùng thư mục. Không chạy lại publish nếu đã có chỉnh sửa thủ công sau baseline mà chưa đối chiếu diff.','']
    (OUT/'README.md').write_text('\n'.join(summary),encoding='utf-8')
    import csv
    with (OUT/'backlog.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.writer(f);writer.writerow(['Task ID','GitHub Issue','Name','Feature','Type','Priority','Parent','Dependencies','URL'])
        for n in sorted(mapping):
            t=tickets.get(n,dict(title='UI foundations and component alignment',feature_slug='foundation',type='FEATURE',priority='P1',parent=101,deps=[]))
            writer.writerow([f'TMC-{n:03}',mapping[n]['number'],t['title'],t['feature_slug'],t['type'],t['priority'],f'TMC-{t["parent"]:03}' if t.get('parent') else '',', '.join(f'TMC-{d:03}' for d in t['deps']),mapping[n]['url']])
    print('Verified 105 issues, native hierarchy and project fields. Table: '+url,flush=True)


def repair_fixture_ticket():
    path=OUT/'tickets.json'
    tickets=json.loads(path.read_text(encoding='utf-8'))
    t=next(t for t in tickets if t['id']==6)
    t['tasks']=['Đối chiếu seed tài khoản với sáu role và scope; không tự tạo lịch sử công/QR/lượt quét.', 'Chuẩn bị factory/station IN/OUT fixtures có chủ đích trên DB test, bao gồm credential hết hạn/thu hồi và nhân viên inactive.']
    t['cases']=['Đăng nhập sáu role và gọi API theo scope trên DB test; xác nhận không lộ dữ liệu nhà máy khác.', 'Kiểm tra direction/device ID và station credential của fixtures; chứng minh script không reset DB hoặc chạy seed khi API khởi động.']
    save('tickets.json',tickets)
    mapping={int(k):v for k,v in json.loads((OUT/'issue-map.json').read_text(encoding='utf-8')).items()}
    body=issue_body(t,mapping)
    gh('api',f'repos/{REPO}/issues/{mapping[6]["number"]}','--method','PATCH',payload=dict(body=body))
    (OUT/'TMC-006.md').write_text(body,encoding='utf-8')
    print('Fixture scope/verification refined')


if __name__ == '__main__':
    {'inspect':inspect,'schema':schema,'author':author,'publish':publish,'configure':configure,'populate':populate,'verify':verify,'repair':repair_fixture_ticket}[sys.argv[1]]()
