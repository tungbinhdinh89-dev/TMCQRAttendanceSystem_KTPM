# Giải thích thuật ngữ và nghiệp vụ trong hệ thống TMC

Tài liệu giúp đọc báo cáo M1, thiết kế M2 và skeleton kiến trúc bằng cách giải thích **thuật ngữ là gì, nằm ở đâu trong hệ thống, giải quyết việc gì và dễ nhầm với điều gì**. Ví dụ dùng nhân viên E001, cổng BD-IN-01 và các mã giao dịch giả định, không phải dữ liệu vận hành thật.

Tên actor/module được đối chiếu với [spec.pdf](spec.pdf). Các bước xử lý, tên trạng thái bổ sung và bảng giao nhận dưới đây là minh họa để hiểu nghiệp vụ, không tự tạo thêm requirement hoặc khẳng định code đã được triển khai. Có thể đọc cùng [structure-architecture.md](structure-architecture.md).

## 1. Bản đồ đọc nhanh

| Nhóm thuật ngữ | Các từ cần hiểu | Câu hỏi mà nhóm này trả lời |
|---|---|---|
| Người sử dụng | EMP, HR, SUP, SEC, ADM, EXE | Ai làm gì, có quyền gì? |
| Hệ thống và thiết bị | HR/Payroll, HRS, portal, turnstile, controller, TCS | Người dùng và phần mềm đang kết nối với những gì? |
| Module phần mềm | IAM, EQR, GATE, ATT, RPT, CFG | Phần nào của backend chịu trách nhiệm nghiệp vụ nào? |
| Điều khiển và xác nhận | ACK, Turnstile Adapter, state machine, CAS | Làm sao biết cổng đang ở trạng thái nào và ai được xử lý? |
| Xử lý nền | Queue, Job, Outbox, Worker, backlog | Việc chưa làm được lưu ở đâu, ai làm tiếp? |
| Gửi lại và đồng bộ | Retry, backoff, jitter, idempotency, idempotent, pending/synced/failed | Khi mạng lỗi thì làm lại thế nào để không tạo tác động trùng? |
| Bảo vệ dữ liệu | Transaction, commit, WAL | Làm sao DB lưu thay đổi nhất quán và phục hồi sau crash? |

**Hai luồng xuyên suốt:**

- **Tại cổng:** nhân viên hiển thị QR → kiosk gửi yêu cầu → hệ thống kiểm tra → điều khiển TCS → nhận bằng chứng → ghi công.
- **Cuối tháng:** chốt dữ liệu công → tạo lô xuất → lưu công việc cần gửi → worker gửi HRS → theo dõi xác nhận và đối soát.

## 2. EMP / HR / SUP / SEC / ADM / EXE — các vai trò người dùng

Đây là **actor/role**, nghĩa là những nhóm người sử dụng hệ thống. Một người có thể có nhiều vai trò nếu được cấp; quyền còn phụ thuộc **scope** — phạm vi nhà máy, tổ hoặc dữ liệu được giao.

| Mã | Tên tiếng Anh | Nghĩa trong nghiệp vụ TMC | Ví dụ thao tác | Giới hạn theo thiết kế M1 |
|---|---|---|---|---|
| **EMP** | Employee | Nhân viên | Xem QR, lịch sử công của mình, gửi yêu cầu kiểm tra sai lệch | Không tự sửa công hoặc xem toàn bộ công của đồng nghiệp |
| **HR** | Human Resources | Nhân sự | Quản lý nhân viên/QR/quyền nhà máy, hiệu chỉnh có lý do, xuất dữ liệu HRS | Không mặc nhiên được cấp quyền quản trị hệ thống |
| **SUP** | Production Supervisor | Giám sát sản xuất | Xem tình hình chấm công của tổ được phân công | Không sửa sự kiện công hoặc cấp quyền |
| **SEC** | Security Guard | Bảo vệ/an ninh tại nhà máy | Xem nhật ký cổng, kiểm tra lượt UNKNOWN, xử lý ngoại lệ có lý do | Chỉ trong nhà máy được giao; không xem mọi hồ sơ HR |
| **ADM** | System Administrator | Quản trị viên hệ thống | Quản lý tài khoản, vai trò, cấu hình cổng, kết nối và vận hành | Không mặc nhiên có quyền hiệu chỉnh công của HR |
| **EXE** | Executive Management | Ban điều hành | Xem báo cáo tổng hợp phục vụ quản lý | Không mặc định được xem lịch sử chi tiết từng nhân viên |

**Ví dụ scope:** Hai người cùng là SEC nhưng một người phụ trách Bình Dương, người còn lại phụ trách Long An. Cùng role không có nghĩa được xem hoặc xử lý cổng của cả hai nhà máy.

**RBAC — Role-Based Access Control** là phân quyền theo vai trò. Với TMC, còn phải kiểm tra phạm vi đối tượng. Ẩn nút “Sửa công” ở giao diện là hỗ trợ trải nghiệm; API/backend vẫn phải kiểm tra quyền khi nhận request.

[Nguồn: spec, phần vai trò trang PDF 3; ma trận quyền §10.2, trang PDF 31–32](spec.pdf#page=3).

## 3. HR/Payroll, portal, turnstile controller và TCS

### 3.1. HR / Payroll / HRS

- **HR — Human Resources:** nghiệp vụ/phòng ban quản lý nhân sự, ví dụ hồ sơ nhân viên và cơ cấu tổ chức. Trong bảng actor, HR là người dùng nhân sự.
- **Payroll:** nghiệp vụ tính và xử lý lương, có thể dùng dữ liệu công cùng quy tắc lương, nghỉ phép và làm thêm của doanh nghiệp.
- **HR/Payroll System**, gọi là **HRS trong spec:** hệ thống nhân sự–tiền lương công ty đã có. Đây là phần mềm bên ngoài nhận dữ liệu từ hệ thống TMC mới.

**Ví dụ:** E001 vào 08:00, ra 12:00, vào 13:00, ra 17:00. TMC có thể tổng hợp hai khoảng hiện diện thành 8 giờ và chuyển sang HRS. HRS áp dụng quy tắc nhân sự/lương để quyết định dữ liệu đó được dùng tính công/lương như thế nào.

**Ranh giới của bài:** TMC làm chấm công, kiểm soát ra/vào và chuyển dữ liệu qua API; **tính lương nằm ngoài scope**. Dữ liệu cần sẵn sàng đối soát tại HRS trước 12:00 trưa ngày 1 hằng tháng. HR là người quản lý/đối soát; HRS là hệ thống nhận dữ liệu. [Đề M2, trang 1–2](SA_CC_hk261_Assignment_M2.pdf#page=1); [spec §6.4–6.5](spec.pdf#page=21).

### 3.2. Portal

**Portal = cổng thông tin web:** giao diện để người dùng đăng nhập và sử dụng các chức năng theo quyền.

| Portal/màn hình | Người sử dụng | Công việc điển hình |
|---|---|---|
| Employee portal / mobile web | EMP | Mở QR, xem công cá nhân |
| HR portal | HR | Hồ sơ nhân viên, thu hồi QR, đối soát và xuất công |
| Security portal | SEC | Nhật ký cổng, lượt chưa rõ kết quả, xử lý ngoại lệ |
| Administration portal | ADM | Tài khoản, vai trò, cấu hình |
| Management/reporting portal | SUP, EXE | Báo cáo theo phạm vi và mức tổng hợp |

Các màn này có thể nằm trong cùng ứng dụng React. Từ “portal” không bắt buộc phải là một ứng dụng, server hoặc domain riêng. “Cổng thông tin” là giao diện phần mềm; “cổng xoay” là thiết bị vật lý.

### 3.3. Turnstile, QR scanner, kiosk và controller

| Thành phần | Hiểu đơn giản | Vai trò trong một lượt vào/ra |
|---|---|---|
| **Turnstile** | Cổng xoay/cổng kiểm soát người qua lại | Thiết bị vật lý chặn hoặc cho phép đi qua |
| **QR scanner** | Máy đọc mã QR | Đọc chuỗi dữ liệu từ mã nhân viên hiển thị |
| **Kiosk** | Trạm/màn hình tiếp nhận lượt quét | Gửi request và hiển thị kết quả; trong M1 scanner USB nối với kiosk |
| **Turnstile controller** | Bộ điều khiển cổng xoay | Nhận lệnh và điều khiển khóa/mở/đóng theo khả năng thiết bị |
| **TCS — Turnstile Control System** | Hệ thống điều khiển cổng hiện có | Cung cấp API và kết nối với bộ điều khiển/thiết bị theo giải pháp của nhà cung cấp |

Controller là bộ phận điều khiển; TCS là ranh giới hệ thống tích hợp được mô tả trong đề. TCS có thể bao gồm phần mềm quản lý và các controller. Cách bố trí cụ thể phải xác nhận với nhà cung cấp.

**Luồng cơ sở M1:** scanner → kiosk → backend TMC → API TCS → controller/cổng. Backend ra quyết định nghiệp vụ dựa trên QR/quyền; thiết bị thực thi lệnh. Kiosk không trực tiếp tự cấp quyền mở cổng. [Spec §8.1–8.3, trang PDF 25–26](spec.pdf#page=25).

## 4. IAM / EQR / GATE / ATT / RPT / CFG — các module phần mềm

Đây là **mã module trong thiết kế nhóm**, không phải actor, thiết bị hoặc tên package bắt buộc của framework. Một số cách viết tắt có nghĩa phổ biến; EQR và cách chia sáu module cần hiểu theo quy ước của spec.

| Mã | Tên/ý nghĩa | Trách nhiệm nghiệp vụ | Ví dụ |
|---|---|---|---|
| **IAM** | Identity and Access Management — định danh, quyền truy cập | Đăng nhập, vai trò/phạm vi, authorizer và audit | Kiểm tra SEC chỉ được đối soát cổng trong nhà máy được giao |
| **EQR** | Module nhân viên và QR theo cách gọi của nhóm | Hồ sơ nhân viên, credential QR, quyền nhà máy, xác minh QR | Thu hồi QR khi nhân viên ngừng hoạt động |
| **GATE** | Kiểm soát cổng | Trạm, yêu cầu quét, lệnh cổng, kết quả và đối soát | Tạo lệnh OPEN và giữ UNKNOWN khi chưa biết kết quả |
| **ATT** | Attendance — chấm công | Sự kiện công hợp lệ, ghép IN/OUT, khoảng hiện diện, correction | Ghép 08–12 và 13–17 thành hai khoảng, tổng 8 giờ |
| **RPT** | Reporting — báo cáo | Báo cáo, snapshot tháng, lô xuất và giao tiếp HRS | Tạo lô công tháng 10 và theo dõi xác nhận của HRS |
| **CFG** | Configuration — cấu hình | Nhà máy, tổ/bộ phận, cấu hình và phiên bản cấu hình | Cấu hình BD-IN-01 là làn IN của Bình Dương |

**Phân biệt IAM và EQR:** IAM quản lý danh tính/quyền sử dụng phần mềm; EQR quản lý nhân viên, QR và quyền nhà máy trong nghiệp vụ. GATE phối hợp kiểm tra này trước khi điều khiển cổng. Cùng một nhân viên có hồ sơ EQR nhưng chưa chắc có quyền quản trị portal.

~~~mermaid
flowchart LR
    EMP["Nhân viên hiển thị QR"] --> K["Scanner / Kiosk"]
    K --> GATE["GATE<br/>Xử lý lượt quét"]
    GATE -->|"Kiểm tra QR / quyền nhà máy"| EQR["EQR"]
    GATE -->|"Quyền / audit"| IAM["IAM"]
    GATE -->|"Đọc cấu hình trạm"| CFG["CFG"]
    GATE --> AD["Turnstile Adapter"]
    AD --> TCS["TCS / Controller / Cổng"]
    GATE -->|"Khi đủ bằng chứng xác nhận"| ATT["ATT<br/>Ghi công"]
    RPT["RPT<br/>Báo cáo / xuất tháng"] -->|"Đọc công"| ATT
    RPT -->|"Gửi qua API"| HRS["HRS / Payroll"]
~~~

Sơ đồ minh họa quan hệ nghiệp vụ, không phải thứ tự tất cả lời gọi hoặc sơ đồ triển khai server. **HR là người dùng; HRS là hệ thống ngoài; RPT là module nội bộ phụ trách xuất dữ liệu.** [Nguồn: spec §5.1–5.3, trang PDF 17–18](spec.pdf#page=17).

## 5. ACK — xác nhận điều gì?

**ACK — Acknowledgement:** thông báo xác nhận từ bên nhận. Câu quan trọng nhất là: **bên nhận đang xác nhận việc đã nhận yêu cầu, đã thực hiện lệnh hay đã xử lý xong dữ liệu?** Ý nghĩa phải được quy định trong API contract.

| Mức xác nhận minh họa | Bên nhận đang nói gì? | Chưa chứng minh được gì? |
|---|---|---|
| ACK tiếp nhận | “Tôi đã nhận request.” | Chưa chắc cổng đã mở hoặc lô công đã xử lý xong |
| Xác nhận thực thi cổng | “Thiết bị đã mở.” | Chưa chắc đúng nhân viên đã đi qua |
| Xác nhận qua cổng | “Có bằng chứng lượt đi qua theo nguồn đã thống nhất.” | Vẫn cần liên kết đúng nhân viên/hướng và tránh ghi trùng |
| ACK xử lý lô HRS | “Lô này đã được xử lý theo kết quả chi tiết.” | Cần kiểm tra đúng kỳ/version/checksum/số lượng và lỗi một phần nếu có |

**Ví dụ TCS:** API phản hồi “đã nhận lệnh OPEN” thì TMC có thể vẫn ở PENDING. Chỉ phản hồi có ngữ nghĩa “đã mở” mới được ánh xạ OPEN_CONFIRMED. Nếu dùng cảm biến qua cổng, còn phải chờ bằng chứng tương ứng trước khi xác nhận công.

**Ví dụ HRS:** HTTP thành công có thể chỉ là tiếp nhận tùy contract. RPT cần ACK xử lý phù hợp với batchId/kỳ/phiên bản/checksum/số bản ghi trước khi coi dữ liệu đã sẵn sàng đối soát.

**Mất ACK:** Bên nhận có thể đã xử lý xong nhưng phản hồi không đến được TMC. Vì vậy, “không nhận được ACK” là kết quả **chưa biết**, không phải bằng chứng “bên kia chưa làm”. Đây là lý do cần status lookup, idempotency và UNKNOWN. [Spec §6.3–6.4, trang PDF 21; §7.3–7.4](spec.pdf#page=21).

## 6. Adapter Turnstile — lớp chuyển đổi kết nối cổng

**Adapter** là lớp chuyển đổi giữa giao diện mà nghiệp vụ cần và giao thức/định dạng của hệ thống bên ngoài. **Turnstile Adapter** là adapter chuyên kết nối TCS.

Ví dụ backend NestJS gọi port **TurnstileGateway.open(...)**. Implementation **TurnstileHttpGateway** chuyển dữ liệu sang API nhà cung cấp, thêm xác thực, gọi HTTP, đọc phản hồi và đổi thành kết quả mà use case TMC hiểu được.

| Adapter phụ trách | Ví dụ |
|---|---|
| Chuyển đổi dữ liệu/giao thức | commandId/turnstileId/deadline sang payload API TCS |
| Kết nối và xác thực | Địa chỉ dịch vụ, credential tích hợp và tuyến kết nối được cấu hình |
| Hiểu ngữ nghĩa phản hồi | Phân biệt “đã nhận lệnh”, “đã mở”, “bị từ chối chắc chắn” và kết quả không rõ |
| Chuẩn hóa lỗi | Timeout mơ hồ thành UNKNOWN theo contract; giữ thông tin đủ đối soát |
| Cách ly thay đổi nhà cung cấp | Đổi API ở adapter khi interface nghiệp vụ còn phù hợp |

**Nghiệp vụ vẫn ở use case:** Nhân viên có quyền hay không, lúc nào ghi công và ai được đối soát không phải là các quyết định giao hết cho adapter. Adapter cũng không phải bộ controller vật lý. Khi chưa có TCS thật, simulator giúp kiểm thử cùng ngữ nghĩa phản hồi, kể cả “mở xong nhưng mất ACK”. [Spec §5.2, §6.3 và ADR-07](spec.pdf#page=18).

## 7. State machine — máy trạng thái

**State machine** mô tả một đối tượng có thể ở những trạng thái nào, sự kiện/điều kiện nào cho phép chuyển trạng thái và chuyển nào không hợp lệ.

**Ví dụ lệnh cổng:**

| Trạng thái | Nghĩa nghiệp vụ | Hành động tiếp theo |
|---|---|---|
| PREPARED | Đã chuẩn bị và lưu lệnh, chưa nhận quyền gửi | Kiểm tra lại hạn/quyền rồi claim nếu hợp lệ |
| DISPATCHING | Một tiến trình đã nhận quyền gửi; kết quả thực tế có thể chưa rõ | Gửi/theo dõi kết quả; nếu crash thì đối soát |
| OPEN_CONFIRMED | Có xác nhận đã mở theo contract | Hoàn tất trạng thái cổng; chỉ ghi công khi đủ bằng chứng |
| OPEN_REJECTED | Có kết quả từ chối/chưa mở chắc chắn theo contract | Kết thúc hoặc xử lý ngoại lệ có quyền |
| UNKNOWN | Chưa đủ thông tin kết luận cổng đã mở hay chưa | Tra cứu TCS hoặc SEC xác minh, ghi bằng chứng |

~~~mermaid
stateDiagram-v2
    [*] --> PREPARED: Lưu lệnh hợp lệ
    PREPARED --> DISPATCHING: Claim thành công, còn hạn và có quyền
    DISPATCHING --> OPEN_CONFIRMED: Xác nhận đã mở
    DISPATCHING --> OPEN_REJECTED: Kết quả từ chối chắc chắn
    DISPATCHING --> UNKNOWN: Mất ACK / kết quả không rõ
    UNKNOWN --> OPEN_CONFIRMED: Đối soát có bằng chứng đã mở
    UNKNOWN --> OPEN_REJECTED: Đối soát có bằng chứng chưa mở / bị từ chối
~~~

Sơ đồ rút gọn, chưa vẽ nhánh lệnh quá hạn trước khi gửi. Quan trọng là không tự đổi UNKNOWN thành “chưa mở” rồi phát OPEN lại. Giới hạn chờ phía ứng dụng không chứng minh thiết bị đã dừng thực thi.

**Ba trạng thái không được gộp:** Quyết định truy cập ALLOW/DENIED, trạng thái GateCommand và trạng thái công NOT_CREATED/PROVISIONAL/CONFIRMED là ba thông tin khác nhau. Có quyền đi vào chưa chứng minh đã mở cổng; mở cổng chưa luôn chứng minh đã qua cổng. [Spec §7.1–7.3, trang PDF 22–24](spec.pdf#page=22).

## 8. Hàng chờ / Outbox / Job / Worker

### 8.1. Hàng chờ — Queue

**Hàng chờ** là nơi lưu các công việc chờ được xử lý. Nhờ đó, yêu cầu hiện tại không phải chờ mọi việc phụ hoàn thành ngay.

**Ví dụ:** HR bấm xuất tháng. Hệ thống tạo lô và công việc xuất, trả mã theo dõi; worker gửi HRS ở nền. Nếu HRS đang lỗi, công việc còn được theo dõi để xử lý tiếp theo chính sách.

Hàng chờ có thể nằm trong memory, bảng DB hoặc một hệ thống message broker. Trong thiết kế M1, nhóm chọn **lưu tác vụ bền vững trong DB**. Danh sách chỉ giữ trong memory có thể mất khi process dừng; vì vậy, “có queue” chưa đủ để kết luận công việc đã bền vững.

### 8.2. Job

**Job = một đơn vị công việc cần chạy.** Ví dụ: gửi lô export-2026-10-v1, gửi thông báo lỗi, hoặc tra cứu lại trạng thái một giao dịch chưa rõ.

Một job thường có mã, loại công việc, dữ liệu tham chiếu, trạng thái, số lần thử và thời điểm được thử tiếp. Job không nhất thiết là một thread/process riêng.

### 8.3. Outbox / Transactional Outbox

**Outbox = hộp thư đi của ứng dụng:** dữ liệu ghi nhận một thông điệp/ý định cần gửi ra ngoài. **Transactional Outbox** lưu dữ liệu nghiệp vụ và ý định gửi trong **cùng transaction DB**, rồi một thành phần khác chuyển tiếp sau commit. Cách này xử lý khoảng trống “lưu nghiệp vụ thành công nhưng process chết trước khi gửi”. Việc chuyển tiếp vẫn có thể lặp; bên xử lý cần cơ chế chống tác động trùng. [AWS — Transactional Outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

**Ví dụ áp dụng cho TMC:**

1. Trong một transaction, tạo ExportBatch kèm snapshot công tháng và OutboxEntry yêu cầu gửi chính lô đó.
2. Commit thành công: cả lô và ý định gửi cùng tồn tại. Nếu rollback thì cả hai không được coi là đã tạo thành công.
3. Worker đọc outbox và gửi HRS ngoài transaction này.
4. Nếu worker restart, nó tiếp tục từ dữ liệu đã lưu, không cần HR nhớ bấm lại.

**Phân biệt Queue và Outbox:** Queue mô tả nơi/cách phân phối công việc chờ. Outbox mô tả cách liên kết an toàn thay đổi nghiệp vụ với ý định gửi. Một bảng DB có thể phục vụ cả hai vai trò trong thiết kế đơn giản, nhưng không phải mọi queue đều là Transactional Outbox.

### 8.4. Worker / Job Worker / Outbox Worker

**Worker = thành phần phần mềm thực thi công việc nền.** Job Worker chạy các loại job được giao. Outbox Worker chuyên đọc và chuyển tiếp mục trong outbox.

| Khái niệm | Có thể hình dung là | Ví dụ TMC |
|---|---|---|
| Job | Một phiếu việc | “Gửi lô công tháng 10, phiên bản 1” |
| Queue | Danh sách phiếu việc chờ xử lý | Bảng jobs có thời điểm chạy tiếp |
| Outbox | Sổ ghi các thông điệp phải gửi, liên kết với transaction nghiệp vụ | OutboxEntry tham chiếu ExportBatch vừa được chốt |
| Worker | Bộ phận tự động nhận và làm việc | Claim job, gọi HRS, ghi kết quả và lên lịch retry |
| Scheduler | Bộ phận kích hoạt theo lịch | Đến giờ xuất tháng thì tạo/kích hoạt công việc phù hợp |

Worker có thể chạy cùng process API hoặc thành process Node.js riêng. Với stack NestJS đã chọn, scheduler/provider ở lớp ngoài có thể kích hoạt công việc; entry point worker riêng dùng lại các use case và adapter cần thiết. Dữ liệu Job/Outbox trong DB mới giữ được công việc qua restart; cron/polling trong memory không tự cung cấp độ bền đó. [Nest — Task Scheduling](https://docs.nestjs.com/application/task-scheduling).

**Bẫy nghiệp vụ:** Worker đã đánh dấu outbox “đã gửi” chưa chắc HRS đã xử lý xong lô. Cần định nghĩa rõ trạng thái giao nhận và tiếp tục theo dõi ExportBatch đến ACK nghiệp vụ yêu cầu. [Liên hệ spec §5.3, §7.4 và ADR-07](spec.pdf#page=18).

## 9. Retry / retry có backoff / jitter

### 9.1. Retry

**Retry = thử thực hiện lại một thao tác sau lỗi hoặc khi chưa biết kết quả.** Ví dụ HRS tạm không truy cập được, worker thử lại việc gửi theo chính sách.

Retry phải xét hai câu hỏi: **lỗi có khả năng tự hết không** và **thử lại có tạo tác động trùng không**. Một lỗi timeout có thể xảy ra sau khi hệ thống nhận đã xử lý xong.

| Tình huống | Cách xử lý minh họa |
|---|---|
| HRS lỗi kết nối hoặc lỗi server tạm thời | Tra cứu trạng thái nếu có; retry theo contract chống trùng và giới hạn số lần |
| Dữ liệu xuất sai định dạng | Sửa dữ liệu/contract; gửi nguyên lỗi cũ nhiều lần không giải quyết được |
| Thiếu quyền | Xử lý quyền/credential; không lặp vô hạn |
| Phiên/token xác thực hết hạn | Làm mới/xác thực lại theo cơ chế được phép; vẫn giữ idempotency của công việc |
| Cùng idempotency key nhưng khác nội dung | Điều tra xung đột; không đổi key tùy ý để bỏ qua kiểm tra |
| TCS có thể đã mở nhưng phản hồi bị mất | Giữ UNKNOWN, tra cứu/đối soát; chỉ gửi lại khi API bảo đảm an toàn |

### 9.2. Backoff

**Backoff = khoảng chờ giữa các lần thử**, thường tăng dần để giảm áp lực lên dịch vụ đang lỗi. **Exponential backoff** là tăng theo cấp số nhân, thường có mức trần và giới hạn số lần thử. **Jitter** là thêm ngẫu nhiên vào thời gian chờ để nhiều worker không cùng gửi lại đúng một lúc. [AWS — Timeouts, Retries and Backoff with Jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/).

Ví dụ minh họa cho một tác vụ nền, không phải thông số bắt buộc:

| Lần gửi | Nếu lỗi, chờ trước lần gửi kế tiếp | Ý nghĩa |
|---|---|---|
| 1 | 1 giây | Thử phục hồi lỗi ngắn |
| 2 | 2 giây | Giảm nhịp gửi lại |
| 3 | 4 giây | Tiếp tục giãn cách |
| 4 | 8 giây | Tránh gọi liên tục |
| Sau giới hạn | Chuyển trạng thái cần xử lý/cảnh báo | Không tự thử mãi đến vô hạn |

Ví dụ jitter: thay vì tất cả cùng chờ đúng 4 giây, mỗi job chờ một giá trị ngẫu nhiên trong khoảng chính sách cho phép.

**Theo nghiệp vụ TMC:** backoff dài phù hợp việc nền như xuất HRS; không giữ màn kiosk chờ chuỗi 1 + 2 + 4 + 8 giây vì kiosk có giới hạn phản hồi 2 giây. Luồng cổng cần deadline, kết quả chờ/chưa rõ phù hợp và đường tra cứu/đối soát riêng. Lịch retry 1/5/15/30 phút trong M1 là đề xuất riêng cho xuất tháng, không phải định nghĩa chung của backoff. [Spec §3.2 và §7.4](spec.pdf#page=15).

## 10. Idempotency / idempotent và “nếu API nhận hỗ trợ”

### 10.1. Nghĩa của hai từ

**Idempotency** là tính chất: thực hiện lặp cùng một yêu cầu nghiệp vụ không tạo thêm tác động ngoài ý định ban đầu. **Idempotent** là tính từ chỉ thao tác có tính chất đó. “API idempotent” và “API có cơ chế idempotency” đều nói đến khả năng xử lý gửi lặp an toàn trong phạm vi hợp đồng đã định.

Ví dụ TMC: cùng một sự kiện đã xác nhận được gửi ba lần nhưng chỉ tạo một lượt công. Hệ thống vẫn có thể ghi ba lần giao nhận vào log; idempotency không bắt mọi bản ghi kỹ thuật hoặc response phải giống tuyệt đối. API có thể dùng request ID do bên gọi tạo để nhận diện cùng ý định và xử lý trùng một cách nguyên tử. [AWS — Making Retries Safe with Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).

### 10.2. Vì sao phải có khóa nhận diện cùng một việc?

Trong M1, lượt quét được nhận diện bằng cặp **(stationId, eventId)**. Các hàng “cùng eventId” dưới đây được hiểu là trong cùng phạm vi trạm/người gửi đã xác định; không tự giả định mọi key đều có phạm vi toàn hệ thống.

| Trường hợp | Ý nghĩa |
|---|---|
| Cùng eventId, cùng nội dung | Cùng lượt yêu cầu được gửi lại; trả trạng thái/kết quả đã có |
| Cùng eventId, khác nội dung | Xung đột; trong spec trả HTTP 409 |
| Khác eventId nhưng nội dung giống | Chưa thể tự kết luận là cùng một lượt; có thể là hai ý định khác nhau |
| Cùng batchId và snapshot | Gửi lại cùng lô xuất; không được cộng dữ liệu lặp nếu HRS hỗ trợ contract đó |
| Dữ liệu xuất đã sửa | Tạo phiên bản mới và liên kết thay thế, không sửa ngầm nội dung của khóa cũ |

Ví dụ thao tác “cộng thêm 8 giờ” gửi hai lần có thể thành 16 giờ. Muốn chống trùng cần cơ chế như nhận diện nguồn sự kiện hoặc khóa lô/phiên bản và quy tắc cập nhật đã thống nhất; không chỉ so số giờ bằng nhau.

### 10.3. “Idempotency nếu API nhận hỗ trợ” nghĩa là gì?

**Bên gửi không thể tự bảo đảm bên nhận chống trùng chỉ bằng cách thêm một header hoặc trường ID.** API HRS/TCS phải thực sự hiểu và xử lý khóa đó theo contract.

Ví dụ TMC gửi cùng key export-2026-10-v1 hai lần:

- **HRS có hỗ trợ:** nhận diện cùng người gửi/phạm vi/key, cùng payload; trả kết quả hoặc trạng thái tương ứng thay vì áp dụng lại tác động nghiệp vụ.
- **HRS không hỗ trợ:** có thể bỏ qua key và xử lý hai lần. UNIQUE trong DB TMC không ngăn được HRS tự cộng dữ liệu lặp.

Cần chốt với API nhận: phạm vi key, thời gian giữ thông tin chống trùng, hành vi khi hai request đến đồng thời, khi cùng key khác payload, khi xử lý một phần và khi retry sau timeout. Cơ chế chống trùng còn phải lưu an toàn cùng thay đổi liên quan ở bên nhận.

Nếu thiếu hỗ trợ, ưu tiên status lookup theo mã tham chiếu, đối soát hoặc cơ chế thay thế/cập nhật đã được thống nhất. Không tự kết luận có thể retry mọi POST. Với TCS, kết quả vật lý không rõ cần UNKNOWN và SEC xác minh khi không có API an toàn. [Áp dụng theo spec §6.2–6.4, trang PDF 21](spec.pdf#page=21).

**Idempotency khác CAS:** Idempotency xử lý yêu cầu lặp; CAS tranh quyền thay đổi trạng thái giữa các tiến trình. Hai cơ chế bổ trợ nhau, không thay nhau.

## 11. Backlog và trạng thái pending / synced / failed

### 11.1. Backlog

**Backlog = lượng công việc tồn chưa hoàn thành**, ví dụ các sự kiện chờ đồng bộ hoặc lô HRS chưa xử lý xong.

Giả sử trong một phút có 100 job mới nhưng worker hoàn thành 60 job, lượng tồn tăng khoảng 40 nếu không có các thay đổi khác. Số tồn tăng liên tục báo hiệu nghẽn, lỗi hệ thống nhận hoặc năng lực xử lý chưa đủ.

**Quản lý backlog** gồm theo dõi số lượng theo trạng thái, tuổi công việc cũ nhất, nguyên nhân lỗi, lịch thử lại và công việc gần deadline; giới hạn concurrency, cảnh báo và cho người có quyền can thiệp khi cần. Nên tách rõ job chờ, đang xử lý, chờ retry và hàng lỗi; job failed đã đóng có thể được đếm riêng thay vì nằm mãi trong backlog hoạt động.

### 11.2. Pending / synced / failed là bộ trạng thái minh họa

| Trạng thái | Nghĩa dễ hiểu | Ví dụ | Bước tiếp theo |
|---|---|---|---|
| **pending** | Còn chờ gửi/đồng bộ hoặc chờ thử lại theo định nghĩa hệ thống | Bản ghi chưa có xác nhận lưu ở hệ thống đích | Worker xử lý khi đến lịch và còn điều kiện |
| **synced** | Đã có xác nhận hoàn tất tại điểm đồng bộ được định nghĩa | Trung tâm xác nhận đã lưu bản ghi | Không tạo bản ghi nghiệp vụ mới khi gửi lặp |
| **failed** | Lần xử lý/công việc bị lỗi theo chính sách | Payload sai hoặc đã hết số lần tự thử | Ghi lý do, cảnh báo, sửa/đối soát và chạy lại có quyền khi phù hợp |

**Phải định nghĩa rõ synced đến đâu:** Đồng bộ tới backend TMC chưa đồng nghĩa đã chuyển HRS; HRS nhận request chưa đồng nghĩa đã xử lý lô; lưu một AccessAttempt chưa đồng nghĩa đã xác nhận công. Bộ ba trạng thái này không phải enum bắt buộc trong đề.

Nếu kết quả gửi chưa rõ, cần trạng thái bổ sung như awaiting_ack/unknown hoặc một cột trạng thái riêng. Đánh dấu failed rồi tự phát lại tác động vật lý là không đủ để xử lý tình huống mất ACK.

**Ví dụ vòng đời một job đồng bộ có thể retry:** pending → processing → synced; lỗi tạm thời → retry_wait → pending; lỗi không tự khắc phục hoặc hết budget → failed. Retry chuyển một bản ghi sang lần thử mới, không tạo một công việc nghiệp vụ mới tùy ý.

## 12. “Theo dõi lần giao nhận” nghĩa là gì?

Đó là lưu **lịch sử mỗi lần cố gắng gửi/nhận** để trả lời: đã gửi chưa, gửi mấy lần, bên nào xác nhận, lần nào timeout, có cần đối soát không. Một lô nghiệp vụ có thể có nhiều delivery attempts mà vẫn chỉ là một lô.

| Trường minh họa | Ý nghĩa |
|---|---|
| batchId / eventId / commandId | Định danh công việc nghiệp vụ tương ứng |
| attemptNo | Số thứ tự lần gửi |
| startedAt / finishedAt | Thời gian bắt đầu/kết thúc lần gửi |
| result / errorCode | Thành công, lỗi, timeout hoặc chưa biết kết quả |
| remoteReference | Mã tham chiếu phía HRS/TCS khi có |
| ACK status, checksum, recordCount | Bằng chứng tiếp nhận/xử lý theo contract |
| nextAttemptAt | Khi nào được thử tiếp |
| correlationId | Mã nối các log, request và kết quả để truy vết |

**Ví dụ:**

| Lô | Lần gửi | Quan sát tại TMC | Kết luận |
|---|---|---|---|
| export-2026-10-v1 | 1 | Timeout, không nhận ACK | Chưa biết HRS đã xử lý hay chưa |
| export-2026-10-v1 | 2 | Retry an toàn cùng key; HRS trả ACK lô đã xử lý | Vẫn một lô, không cộng công lần nữa theo contract |

Số lần gửi là 2, số lô nghiệp vụ là 1. Không dùng attemptNo làm batchId mới cho mỗi retry. Nếu HRS có API status phù hợp, có thể tra cứu để lấy xác nhận mà không cần gửi lại payload.

~~~mermaid
sequenceDiagram
    participant W as Outbox Worker TMC
    participant H as HRS có hỗ trợ idempotency
    W->>H: Gửi batchId B1 + snapshot + checksum
    H->>H: Lưu và xử lý B1 một lần
    Note over W,H: Phản hồi bị mất, TMC chưa có ACK
    W->>W: Lưu lần gửi 1 là kết quả chưa rõ
    W->>H: Nhánh retry an toàn: cùng B1, cùng payload
    H->>H: Nhận diện B1 đã xử lý
    H-->>W: ACK kết quả đã có, khớp lô và nội dung
    W->>W: Lưu lần gửi 2 và cập nhật trạng thái lô
~~~

Sơ đồ chọn nhánh retry khi contract cho phép. Với API không bảo đảm chống trùng, không được giả định bước “xử lý một lần” sẽ tự có. Lịch sử giao nhận cũng cần lọc QR/token/secret và dữ liệu cá nhân không cần thiết. [Spec §6.4, §7.4, ExportAttempt trong §5.1](spec.pdf#page=21).

## 13. CAS — Compare-and-Set

**CAS = chỉ thay đổi giá trị nếu giá trị hiện tại vẫn đúng như điều kiện mong đợi.** Trong TMC, CAS được dùng để tranh quyền gửi một lệnh cổng giữa các tiến trình/request đang chạy đồng thời.

**Vấn đề:** Hai tiến trình A và B cùng đọc thấy CMD-001 đang PREPARED. Nếu cả hai đều suy luận “chưa gửi nên mình gửi” thì có thể cùng phát OPEN. Việc đọc trước rồi kiểm tra bằng if trong mỗi process không tự loại bỏ tranh chấp này.

**Cách làm minh họa ở PostgreSQL:**

~~~sql
UPDATE gate_command
SET state = 'DISPATCHING'
WHERE command_id = 'CMD-001'
  AND state = 'PREPARED'
RETURNING command_id;
~~~

| Tiến trình | Kết quả sau khi transaction tương ứng hoàn tất hợp lệ | Hành vi |
|---|---|---|
| A thắng quyền đổi trạng thái | Một dòng được đổi từ PREPARED sang DISPATCHING và commit | Được tiếp tục bước gửi theo policy |
| B chạy sau đó | Không đổi được dòng vì điều kiện PREPARED không còn đúng | Đọc trạng thái hiện tại; không phát OPEN cho cùng claim |

UPDATE có điều kiện kết hợp kiểm tra và thay đổi ở DB, tránh khoảng trống của SELECT rồi if rồi UPDATE không có kiểm soát tương tranh. RETURNING/số dòng ảnh hưởng cho biết thao tác có thắng điều kiện không. Trong thực tế còn phải kiểm tra deadline, quyền hiện hành và các constraint; SQL trên chỉ minh họa CAS. [PostgreSQL — UPDATE](https://www.postgresql.org/docs/18/sql-update.html), [Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html).

**Sau khi claim phải commit trước khi gọi TCS.** Nếu đã DISPATCHING rồi process dừng, không biết nó dừng trước hay sau khi lệnh tới thiết bị. Vì vậy cần đối soát thay vì tự cho tiến trình khác mở lại. CAS bảo vệ quyền đổi trạng thái nội bộ; mức bảo đảm thực thi ở cổng còn phụ thuộc TCS.

**Liên hệ sửa công:** HR A và B cùng đọc version 3. Chỉ cập nhật nếu version vẫn là 3 rồi tăng thành 4. Người thứ hai gặp xung đột phải đọc lại bản mới thay vì ghi đè. Đây là cách kiểm soát đồng thời lạc quan có cùng tư tưởng kiểm tra điều kiện trước khi đổi. [Spec §6.1, §7.1 và ADR-03](spec.pdf#page=20).

## 14. WAL — Write-Ahead Logging

### 14.1. WAL là gì?

**WAL = cơ chế ghi nhật ký thay đổi trước khi ghi thay đổi đó vào file dữ liệu chính của database.** Đây là cơ chế bên trong DB, giúp khôi phục dữ liệu sau crash.

Với PostgreSQL, các trang dữ liệu có thể được ghi xuống file sau; WAL đã ghi bền vững giúp DB thực hiện lại các thay đổi cần khôi phục. Vì vậy, DB không phải ghi ngay mọi trang bảng/index xuống ổ đĩa ở mỗi lần commit. [PostgreSQL — WAL](https://www.postgresql.org/docs/18/wal-intro.html).

**Hai từ liên quan:**

- **Transaction:** nhóm thao tác dữ liệu cần thành công hoặc rollback cùng nhau, ví dụ ghi kết quả cổng, AttendanceEvent và audit liên quan.
- **Commit:** xác nhận hoàn tất transaction theo cơ chế của DB. Commit dữ liệu không tự xác nhận tác động vật lý ở TCS hoặc việc HRS đã nhận dữ liệu.

### 14.2. Ví dụ khi TMC ghi công

~~~mermaid
flowchart LR
    APP["Backend<br/>Lưu kết quả, công, audit"] --> TX["Transaction PostgreSQL"]
    TX --> WAL["WAL<br/>Ghi thay đổi bền vững theo cấu hình"]
    WAL --> ACK["DB trả commit thành công<br/>theo cấu hình độ bền"]
    WAL --> DATA["Trang dữ liệu chính<br/>có thể được ghi sau"]
    WAL -.-> RECOVER["Sau crash<br/>DB dùng log để khôi phục"]
~~~

Sơ đồ minh họa chế độ commit đợi WAL bền vững, không khẳng định cấu hình repo hiện đã được triển khai như vậy. Nếu bật commit bất đồng bộ, PostgreSQL có thể trả thành công trước khi WAL xuống lưu trữ bền vững, nên các transaction gần nhất có thể mất khi crash. [PostgreSQL — Asynchronous Commit](https://www.postgresql.org/docs/18/wal-async-commit.html).

### 14.3. Phân biệt WAL, audit log, outbox và backup

| Thành phần | Câu hỏi nó trả lời | Ai chủ yếu sử dụng? |
|---|---|---|
| **WAL** | DB cần thay đổi nào để phục hồi trạng thái dữ liệu? | Database engine và công cụ phục hồi |
| **Audit log** | Ai sửa công/thu hồi QR/đổi quyền, lúc nào, vì sao? | HR, ADM, người được phép kiểm toán |
| **Outbox** | Thông điệp/công việc nào còn phải chuyển tiếp? | Worker của ứng dụng |
| **Backup** | Có bản dữ liệu nào để phục hồi khi dữ liệu gốc bị mất/hỏng? | Người vận hành và công cụ phục hồi |

Ví dụ: DB restart có thể dùng WAL để phục hồi công đã commit theo điều kiện độ bền. Muốn biết HR nào hiệu chỉnh công phải xem audit. Muốn gửi tiếp lô HRS phải xem Outbox/ExportBatch. Nếu ổ đĩa mất cả dữ liệu lẫn WAL tại đó, cần bản sao/phương án phục hồi khác.

WAL không thay việc sao lưu, không tự chuyển công sang HRS và không tự bảo đảm mọi tình huống đều không mất dữ liệu. M1 đề xuất backup/WAL archive ngoài máy DB cùng diễn tập phục hồi; đó là một phần thiết kế vận hành cần kiểm chứng. [Spec §8.4, trang PDF 26](spec.pdf#page=26).

## 15. Ghép các thuật ngữ thành nghiệp vụ hoàn chỉnh

### 15.1. Một lượt E001 vào nhà máy

1. **EMP** mở **employee portal**, lấy QR do **EQR** quản lý/phát hành theo chính sách.
2. Scanner/kiosk gửi lượt quét có **eventId** tới backend. **IAM** kiểm tra định danh/quyền cần thiết; **EQR** kiểm tra QR và quyền nhà máy; **CFG** cung cấp cấu hình trạm.
3. **GATE** lưu **AccessAttempt** và chuẩn bị **GateCommand** nếu đủ điều kiện. **Transaction/commit/WAL** bảo vệ phần dữ liệu theo cấu hình DB.
4. **CAS** cho một tiến trình nhận quyền gửi. **Turnstile Adapter** gọi **TCS**, từ đó controller điều khiển cổng.
5. **ACK** được diễn giải theo contract. Nếu mất phản hồi sau khi có thể đã mở, **state machine** giữ **UNKNOWN**; **SEC** kiểm tra/đối soát khi cần.
6. **ATT** tạo tối đa một **AttendanceEvent** cho cùng nguồn xác nhận. Cùng request/source được gửi lại phải xử lý **idempotent** theo thiết kế.
7. **SUP** xem dữ liệu trong tổ được giao; **HR** hiệu chỉnh có quyền/lý do; **EXE** xem tổng hợp; **ADM** phụ trách cấu hình/vận hành trong phạm vi được cấp.

### 15.2. Một lô xuất công tháng

1. **RPT** lấy dữ liệu **ATT**, tạo **snapshot** — bản chụp dữ liệu cố định của lô — và **ExportBatch** có batchId/version.
2. Lưu **Outbox/Job** cần gửi cùng transaction liên quan. Worker xử lý từ hàng chờ, không bắt HR ngồi chờ kết nối HRS.
3. **Job / Outbox Worker** gửi lô sang **HRS** qua adapter tích hợp; mỗi lần gửi tạo lịch sử **delivery attempt**.
4. Nếu lỗi tạm thời, **retry có backoff/jitter** theo giới hạn và contract. Cùng công việc retry giữ khóa/nội dung phù hợp để **idempotency** có tác dụng nếu API nhận hỗ trợ.
5. **Backlog** cho biết số công việc còn tồn. HR/ADM theo dõi lô chờ ACK, job failed và thời gian còn lại trước hạn đối soát.
6. Chỉ coi hoàn tất khi đủ xác nhận nghiệp vụ. **Synced/sent/accepted** phải được định nghĩa theo từng chặng; không dùng một nhãn “thành công” để gộp toàn bộ chuỗi.

### 15.3. Dịch hai câu kỹ thuật sang lời dễ hiểu

> **“Idempotency nếu API nhận hỗ trợ và theo dõi lần giao nhận.”**

Khi gửi dữ liệu sang HRS, dùng cơ chế nhận diện cùng một lô mà API HRS thực sự hỗ trợ để gửi lại không bị tính trùng. Đồng thời lưu lịch sử từng lần gửi và bằng chứng nhận/xử lý, để biết lô đã xong hay còn phải tra cứu, thử lại hoặc đối soát.

> **“Retry có backoff, quản lý backlog và trạng thái pending/synced/failed.”**

Khi gặp lỗi phù hợp thì thử lại có khoảng chờ và giới hạn; giữ danh sách việc chưa xong để tiếp tục sau đó; theo dõi việc nào đang chờ, việc nào đã được đích xác nhận và việc nào cần xử lý lỗi. Nếu kết quả còn mơ hồ thì thể hiện “chưa biết” thay vì đoán thành công hoặc thất bại.

### 15.4. Những cách hiểu dễ sai

| Cách hiểu sai | Cách hiểu phù hợp trong TMC |
|---|---|
| HR và HRS là một | HR là vai trò nhân sự; HRS là phần mềm nhân sự/lương bên ngoài |
| ADM được quyền sửa mọi thứ | Quyền sửa công và quản trị được tách theo thiết kế M1 |
| IAM/EQR/ATT là các loại người dùng | Đây là module phần mềm; HR/SUP/SEC/... mới là actor/role |
| Có ACK là đã hoàn tất nghiệp vụ | Cần biết ACK xác nhận tiếp nhận hay xử lý/thực thi |
| Timeout nghĩa là TCS chưa mở | Cổng có thể đã mở; kết quả tại ứng dụng có thể là UNKNOWN |
| Retry là gửi lại càng nhanh càng tốt | Có điều kiện, backoff, giới hạn và kiểm soát tác động trùng |
| Thêm Idempotency-Key là mọi API tự chống trùng | Bên nhận phải thực thi đúng contract và giữ trạng thái chống trùng |
| Một job có hai lần gửi là hai công việc nghiệp vụ | Có thể vẫn một công việc, hai delivery attempts |
| Outbox giống WAL | Outbox lưu ý định chuyển tiếp ở tầng ứng dụng; WAL phục vụ độ bền/khôi phục DB |
| Đổi trạng thái bằng if là đã có CAS | Cần thao tác kiểm tra–cập nhật nguyên tử và xử lý số dòng/transaction phù hợp |
| Synced nghĩa là đã có công và đã sang Payroll | Phải nêu rõ đồng bộ tới đâu và loại dữ liệu/bằng chứng nào đã được xác nhận |
| DB đã commit thì cổng và HRS cũng hoàn tất | Commit chỉ bao phủ transaction dữ liệu được tham gia; hệ thống ngoài cần xác nhận và đối soát riêng |
