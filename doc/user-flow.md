# Use Case Diagram & User Flow — TMC

**Phạm vi:** Hệ thống chấm công và kiểm soát ra/vào bằng QR tại hai nhà máy Bình Dương và Long An. Tài liệu mô tả mục tiêu của từng actor, các bước sử dụng, kết quả và nhánh lỗi quan trọng.

**Nền tảng đã thống nhất:** client/ dùng React; api/ dùng Node.js/NestJS + TypeORM + PostgreSQL. Các sơ đồ là thiết kế nghiệp vụ, không khẳng định toàn bộ chức năng đã được hiện thực.

**Nguồn:** [Báo cáo M1 — spec.pdf](spec.pdf), [đề M2](SA_CC_hk261_Assignment_M2.pdf), [thiết kế kiến trúc](structure-architecture.md) và [tech stack](teach-stack.md). Mã **UC-01…UC-08 giữ nguyên từ M1**; mã **UF-xx** do tài liệu này đặt cho các luồng. Nhãn **[M2 đề xuất]** phân biệt cách cải tiến do nhóm đề xuất với yêu cầu gốc của giảng viên.

Các thuật ngữ ACK, UNKNOWN, CAS, Outbox, idempotency và actor/module được giải thích tại [explain-detail.md](explain-detail.md).

## 1. Cách đọc và ranh giới hệ thống

| Loại sơ đồ | Trả lời câu hỏi | Cách đọc |
|---|---|---|
| **Use case diagram** | Ai dùng chức năng gì? Hệ thống ngoài tham gia việc gì? | Actor nằm ngoài khung hệ thống; các mục tiêu nghiệp vụ nằm trong khung. Đường liên kết không biểu diễn thứ tự xử lý |
| **User flow** | Bắt đầu từ màn nào, làm gì, rẽ nhánh và kết thúc ra sao? | Đọc theo mũi tên; hình thoi là câu hỏi/điều kiện; nhãn trên nhánh là kết quả quyết định |
| **Bảng kết quả/ngoại lệ** | Lúc nào được coi là xong, lỗi nào cần ai xử lý? | Đối chiếu với đường thành công, chờ xác nhận, từ chối và chưa rõ kết quả |

Sơ đồ use case phía dưới dùng Mermaid flowchart với nhãn **«actor»**, mục tiêu bo tròn và khung hệ thống để tương thích nhiều trình đọc Markdown. Phụ lục §14 có **nguồn PlantUML** cho hai sơ đồ use case khi cần xuất hình UML. Mermaid cũng có native use case ở dạng beta từ phiên bản 12; tài liệu này dùng cú pháp flowchart phổ biến cho phần xem trực tiếp. [Mermaid — Use Case](https://mermaid.js.org/syntax/usecase.html), [PlantUML — Use Case](https://plantuml.com/use-case-diagram).

**Trong phạm vi:** nhân viên/QR, cổng, chấm công, báo cáo/đối soát, quản trị và kết nối TCS/HRS. **Ngoài phạm vi:** quản lý khách, tính lương, chế tạo phần cứng và logic thoát hiểm. TMC xuất dữ liệu hiện diện/công; HRS áp dụng quy tắc nhân sự/lương của hệ thống nhận.

**Lựa chọn vận hành trong các flow:** online tại trung tâm, có phục hồi request đã nhận và quy trình SEC/HR nhập bù khi cần. Hoạt động tự động tại nhà máy khi WAN mất hoàn toàn cần phương án edge riêng; các sơ đồ không mặc định có chức năng đó.

### 1.1. Actors và giới hạn

| Actor | Mục tiêu chính | Giới hạn phải giữ |
|---|---|---|
| EMP — nhân viên | Hiển thị QR, vào/ra, xem công cá nhân, yêu cầu kiểm tra sai lệch | Không tự sửa công hoặc xem công người khác |
| HR — nhân sự | Hồ sơ/QR/quyền nhà máy, hiệu chỉnh và đối soát, xuất HRS | Không mặc định quản trị tài khoản/vai trò hệ thống |
| SUP — giám sát sản xuất | Xem dữ liệu trong tổ được giao | Không hiệu chỉnh công hoặc phân quyền |
| SEC — bảo vệ | Nhật ký cổng, xác minh UNKNOWN và xử lý ngoại lệ | Trong nhà máy được giao; không sửa công HR tùy ý |
| ADM — quản trị | Tài khoản/vai trò, cổng/cấu hình, vận hành và kiểm toán có quyền | Không mặc nhiên được hiệu chỉnh công |
| EXE — ban điều hành | Báo cáo tổng hợp | Không mặc định xem hồ sơ chi tiết từng cá nhân |
| TCS — hệ thống điều khiển cổng | Thực thi lệnh, phản hồi/sự kiện thiết bị theo API có sẵn | Xác nhận đã nhận lệnh khác với đã mở hoặc đã qua cổng |
| HRS — HR/Payroll System | Nhận và xác nhận dữ liệu công, đối soát theo contract | Việc tiếp nhận HTTP chưa chắc hoàn tất xử lý lô |

Một người có thể mang thêm vai trò EMP cho công cá nhân. Không dùng đặc quyền HR/ADM làm lý do bỏ qua scope tổ/nhà máy. Scheduler, worker, database và các module IAM/EQR/... là thành phần nội bộ, không được vẽ thành actor bên ngoài hệ thống TMC. [Spec §1.3 và §2.3, trang PDF 9–13](spec.pdf#page=9).

## 2. Use case diagram

### 2.1. Nhóm nhân viên, QR, cổng và chấm công

~~~mermaid
flowchart LR
    EMP["«actor»<br/>EMP · Nhân viên"]
    HR["«actor»<br/>HR · Nhân sự"]
    SEC["«actor»<br/>SEC · Bảo vệ"]
    TCS["«actor»<br/>TCS · Hệ thống cổng"]
    subgraph TMC["HỆ THỐNG TMC · Nhóm truy cập và chấm công"]
        direction TB
        UC01(["UC-01<br/>Quét QR tại cổng"])
        UC02(["UC-02<br/>Xem QR, hồ sơ và công cá nhân"])
        UC03(["UC-03<br/>Quản lý nhân viên, QR và quyền nhà máy"])
        UC04(["UC-04<br/>Hỗ trợ ngoại lệ, đối soát cổng"])
        UC05(["UC-05<br/>Hiệu chỉnh chấm công"])
    end
    EMP --- UC01
    EMP --- UC02
    HR --- UC03
    HR --- UC04
    HR --- UC05
    SEC --- UC04
    UC01 --- TCS
    UC04 --- TCS
~~~

HR tham gia UC-04 ở bước đối chiếu/nhập bù có nguồn khi cần; SEC chịu trách nhiệm xác minh tình huống vật lý tại cổng. UC-04 không cấp quyền cho SEC sửa mọi bản ghi công. QR ngắn hạn và kiểm tra replay là cải tiến bên trong UC-02/UC-01, không thay actor hoặc mã use case gốc.

### 2.2. Nhóm báo cáo, xuất HRS và quản trị

~~~mermaid
flowchart LR
    HR["«actor»<br/>HR · Nhân sự"]
    SUP["«actor»<br/>SUP · Giám sát"]
    SEC["«actor»<br/>SEC · Bảo vệ"]
    EXE["«actor»<br/>EXE · Ban điều hành"]
    ADM["«actor»<br/>ADM · Quản trị"]
    HRS["«actor»<br/>HRS · HR/Payroll"]
    subgraph TMC["HỆ THỐNG TMC · Nhóm báo cáo và quản trị"]
        direction TB
        UC06(["UC-06<br/>Xuất và đối soát dữ liệu tháng"])
        UC07(["UC-07<br/>Xem báo cáo, nhật ký theo quyền"])
        UC08(["UC-08<br/>Quản trị và kiểm toán"])
    end
    HR --- UC06
    UC06 --- HRS
    HR --- UC07
    SUP --- UC07
    SEC --- UC07
    EXE --- UC07
    ADM --- UC08
~~~

UC-06 có thể được khởi tạo tự động theo lịch hoặc bởi HR có quyền; lịch chạy là trigger nội bộ, không thêm quyền người dùng mới. UC-07 gom các loại báo cáo/nhật ký nhưng **mỗi actor nhìn một phạm vi khác nhau**; SEC không được xem báo cáo HR toàn công ty chỉ vì cùng nối tới UC-07. ADM tra audit phục vụ quản trị trong UC-08 theo phạm vi được cấp.

### 2.3. Danh mục mục tiêu và kết quả

| Use case M1 | Kết quả nghiệp vụ cần đạt | Module chính | User flow bên dưới |
|---|---|---|---|
| UC-01 | Có kết quả truy cập/cổng; công chỉ tạo khi đủ bằng chứng | GATE, EQR, IAM, ATT, CFG | UF-02, UF-03 |
| UC-02 | EMP chỉ lấy được QR/hồ sơ/công của mình | EQR, ATT, IAM | UF-01 |
| UC-03 | Hồ sơ, credential và quyền nhà máy được cập nhật có audit | EQR, IAM, CFG | UF-04 |
| UC-04 | Ngoại lệ/UNKNOWN được xử lý hoặc còn chờ với người phụ trách | GATE, ATT, IAM | UF-05 |
| UC-05 | Correction có phiên bản/lý do; sự kiện gốc giữ nguyên | ATT, IAM | UF-06 |
| UC-06 | HRS xác nhận dữ liệu sẵn sàng đối soát đúng hạn | RPT, ATT, EQR, IAM, CFG | UF-07 |
| UC-07 | Báo cáo/nhật ký đúng phạm vi và mức chi tiết | RPT, ATT, IAM | UF-08 |
| UC-08 | Tài khoản/cấu hình/vận hành có kiểm soát và audit | IAM, CFG và hạ tầng liên quan | UF-09 |

UF-00 là flow đăng nhập chung được bổ sung để mô tả trải nghiệm, không đổi danh mục UC-01…08 của M1. [Nguồn danh mục UC: spec §2.3, trang PDF 13](spec.pdf#page=13).

## 3. UF-00 — Đăng nhập và vào đúng khu vực

**Actor:** người dùng portal. **Bắt đầu:** mở client trên web/mobile. **Kết thúc:** có phiên hợp lệ và vào màn được phép hoặc nhận lỗi rõ ràng.

~~~mermaid
flowchart TD
    A(["Mở portal"]) --> B{"Có phiên còn hiệu lực?"}
    B -->|"Không"| C["Nhập thông tin đăng nhập"]
    C --> D["API xác thực tài khoản / trạng thái"]
    D --> E{"Hợp lệ?"}
    E -->|"Không"| F["Hiển thị lỗi phù hợp<br/>Ghi nhận theo chính sách audit"]
    F --> C
    E -->|"Có"| G{"Chính sách yêu cầu MFA?"}
    G -->|"Có"| H["Hoàn tất MFA"]
    H --> I{"Xác minh thành công?"}
    I -->|"Không"| F
    I -->|"Có"| J["Tạo phiên có hạn"]
    G -->|"Không"| J
    B -->|"Có"| K["Tải danh tính và quyền hiện hành"]
    J --> K
    K --> L["Vào khu vực theo vai trò<br/>EMP / HR / SUP / SEC / ADM / EXE"]
    L --> M["Mỗi thao tác: API kiểm tra quyền và scope"]
    M --> N{"Được phép trên đối tượng?"}
    N -->|"Có"| O(["Xử lý use case tương ứng"])
    N -->|"Không"| P(["Từ chối truy cập<br/>Không trả dữ liệu ngoài quyền"])
~~~

**Quy tắc:** MFA là đề xuất/chính sách cho tài khoản quan trọng trong M1, không mặc định giảng viên bắt buộc cho mọi actor. Thử lại đăng nhập/MFA chịu giới hạn theo chính sách xác thực. Đăng xuất/phiên hết hạn/thu hồi quyền đưa người dùng về trạng thái thích hợp và loại bỏ cache dữ liệu nhạy cảm liên quan. Kiosk sử dụng xác thực trạm riêng; không buộc nhân viên đăng nhập portal tại màn kiosk cho mỗi lượt quét.

## 4. UF-01 — EMP xem QR, hồ sơ và công cá nhân

**Liên kết:** UC-02. **QR ngắn hạn/chống replay:** [M2 đề xuất]. **Kết thúc:** hiển thị dữ liệu của chính EMP hoặc hướng dẫn xử lý trạng thái không hợp lệ.

~~~mermaid
flowchart TD
    A(["EMP có phiên hợp lệ"]) --> B["Mở khu vực cá nhân"]
    B --> C{"Chọn nhu cầu"}
    C -->|"Hiển thị QR"| D["API kiểm tra nhân viên / credential / quyền hiện hành"]
    D --> E{"Đủ điều kiện cấp mã?"}
    E -->|"Không"| F(["Báo mã bị khóa / không đủ điều kiện<br/>Liên hệ HR"])
    E -->|"Có"| G["API cấp token ngắn hạn<br/>jti và thời hạn theo policy M2"]
    G --> H["Client hiển thị QR và thời hạn"]
    H --> I{"Mã còn hợp lệ để quét?"}
    I -->|"Còn hạn, chưa dùng"| J(["Đưa mã tới scanner · sang UF-02"])
    I -->|"Hết hạn / đã dùng"| D
    C -->|"Xem hồ sơ / công"| K["Chọn kỳ / bộ lọc cá nhân"]
    K --> L["API xác định EMP từ phiên<br/>Chỉ trả dữ liệu của người đó"]
    L --> M["Hiển thị sự kiện, khoảng hiện diện và bất thường"]
    M --> N{"Có sai lệch cần kiểm tra?"}
    N -->|"Không"| O(["Hoàn tất tra cứu"])
    N -->|"Có"| P["Gửi yêu cầu kiểm tra kèm thông tin liên quan"]
    P --> Q(["HR xem xét · sang UF-06"])
~~~

**Nhánh cần giữ:** QR hết hạn/bị thu hồi/nhân viên inactive không được dùng lại để qua cổng. Cùng một request đã nhận được tra cứu lại theo eventId, không bị xử lý như một lượt mới chỉ vì QR đã hết hạn sau đó. Khi mất mạng tới dịch vụ cấp QR, không hiển thị mã cũ hết hạn như mã còn dùng được.

M1 dùng QR tĩnh có thu hồi; flow token ngắn hạn là thay đổi được đề xuất cho M2. Cách gửi yêu cầu kiểm tra có thể là màn/form nội bộ; trạng thái ticket và quy trình phê duyệt chi tiết chưa được đề ấn định. [Spec §1.3, FR-1.3/1.5; cải tiến tại teach-stack §9.1](teach-stack.md).

## 5. UF-02 — Quét QR, mở cổng và ghi công

**Liên kết:** UC-01. **Actor:** EMP, TCS; kiosk đã được đăng ký và xác thực riêng. **Chiều IN/OUT:** lấy từ cấu hình làn phía server, không để nhân viên tự khai để thay đổi ý nghĩa lượt quét.

~~~mermaid
flowchart TD
    A(["EMP đưa QR tới scanner"]) --> B["Kiosk đọc mã<br/>Tạo eventId trước khi POST"]
    B --> C["API xác thực trạm<br/>Xác định gate và chiều IN/OUT"]
    C --> D{"Trạm được phép hoạt động?"}
    D -->|"Không"| E(["Từ chối xử lý<br/>Báo lỗi trạm cho SEC/ADM"])
    D -->|"Có"| F{"Cặp stationId/eventId đã tồn tại?"}
    F -->|"Có"| G{"Nội dung khớp request cũ?"}
    G -->|"Có"| H(["Trả trạng thái cũ<br/>Không tạo OPEN/công mới"])
    G -->|"Không"| I(["HTTP 409<br/>Xung đột ID và nội dung"])
    F -->|"Chưa"| J["Kiểm tra QR, hạn, thu hồi, nhân viên<br/>Quyền nhà máy và replay policy"]
    J --> K{"Hợp lệ?"}
    K -->|"Không"| L(["DENIED<br/>Lưu lượt từ chối khi DB ghi được<br/>Không mở, không tạo công"])
    K -->|"Có"| M["Lưu attempt, OPEN PREPARED<br/>jti khi áp dụng, audit; commit"]
    M --> N{"Lưu bền vững thành công?"}
    N -->|"Không"| O(["Chưa ghi nhận<br/>Không gọi OPEN; nhờ hỗ trợ"])
    N -->|"Có"| P["Kiểm tra lại hạn/quyền<br/>CAS DISPATCHING rồi commit"]
    P --> Q{"Nhận quyền gửi hợp lệ?"}
    Q -->|"Không"| R(["Trả trạng thái cũ / kết thúc theo lý do<br/>Không tự phát OPEN"])
    Q -->|"Có"| S["Adapter gửi OPEN tới TCS"]
    S --> T{"Kết quả theo contract"}
    T -->|"Từ chối chắc chắn"| U(["OPEN_REJECTED<br/>Lưu kết quả; không tạo công"])
    T -->|"Chỉ ACK tiếp nhận"| V(["PENDING<br/>Chờ xác nhận; theo dõi UF-05"])
    T -->|"Mất phản hồi / không rõ"| W(["UNKNOWN<br/>EMP nhờ SEC kiểm tra · UF-05"])
    T -->|"Đã mở"| X["Kiosk báo đã mở<br/>EMP đi qua theo chỉ dẫn cổng"]
    X --> Y{"Đủ nguồn xác nhận ghi công?"}
    Y -->|"Chưa"| Z(["Công còn chờ<br/>Đợi cảm biến / đối soát phù hợp"])
    Y -->|"Có"| AA["Lưu kết quả + AttendanceEvent + audit<br/>Cùng transaction; sourceId duy nhất"]
    AA --> AB(["Công CONFIRMED<br/>EMP tra cứu được khi dữ liệu sẵn sàng"])
~~~

**Thời gian phản hồi kiosk:** ≤ 2 giây trong kịch bản tải đã quy định. Việc đợi nhân viên đi qua/cảm biến xác nhận công có thể hoàn thành sau phản hồi kiosk; không bắt UI chờ vô hạn hoặc hiển thị “đã ghi công” khi mới nhận ACK lệnh.

| Tình huống | Điều phải giữ |
|---|---|
| QR hết hạn, bị thu hồi, sai chữ ký, thiếu quyền hoặc replay trái policy | Từ chối; không gọi OPEN, không tạo công |
| Request cùng ID gửi lại | Kiểm tra trong phạm vi trạm và payload; trả trạng thái cũ, không tiêu thụ jti/tạo công lần nữa |
| TCS đã mở nhưng lưu kết quả cuối bị lỗi/crash | Attempt/DISPATCHING trước đó còn là căn cứ phục hồi; đưa đối soát, không chạy lại toàn bộ luồng để mở lần nữa |
| TCS chỉ ACK đã nhận | Không ánh xạ thành đã mở; theo dõi callback/status phù hợp |
| Đã mở nhưng chưa có bằng chứng đã qua | Tách trạng thái cổng và trạng thái công; chỉ dùng “đã mở” làm đại diện nếu policy TMC chấp thuận và ghi evidenceType |
| Callback trùng/sai thứ tự | Xác thực nguồn, chống trùng và kiểm tra điều kiện chuyển trạng thái |
| Đóng cổng lỗi | Cảnh báo SEC; giữ công đã được xác nhận. CLOSE có theo dõi riêng khi API yêu cầu, không tạo công mới |
| Làn đang có lệnh UNKNOWN chưa được giải quyết | Tạm dừng phát lệnh mới theo policy nếu chọn hạng mục FR-2.6 mức S; phối hợp SEC, không mặc định mọi lượt sau đều an toàn |

Đồ thị rút gọn nhánh kết quả để dễ theo dõi; việc lưu trạng thái kết quả/audit áp dụng cho cả thành công, từ chối và chưa rõ theo điều kiện DB. [Spec FR-2/FR-3 và §6.2–7.3, trang PDF 21–24](spec.pdf#page=21).

## 6. UF-03 — Mất mạng hoặc mất phản hồi tại kiosk

**Liên kết:** UC-01/UC-04, cải tiến mất kết nối của M2. **Mục tiêu:** tìm lại kết quả của đúng request, không tự mở muộn hoặc tạo lượt công trùng.

~~~mermaid
flowchart TD
    A(["Kiosk không nhận được kết quả"]) --> B["Hiển thị Chưa xác định / Chưa có xác nhận<br/>Giữ eventId và metadata tối thiểu"]
    B --> C{"Kết nối đã phục hồi?"}
    C -->|"Chưa"| D["SEC ghi nhận sự cố / hỗ trợ<br/>Không mặc định cổng chưa mở"]
    D --> E(["Theo dõi kết nối hoặc chuyển UF-05"])
    C -->|"Rồi"| F["Xác thực trạm<br/>GET trạng thái theo eventId"]
    F --> G{"Tìm được request thuộc phạm vi?"}
    G -->|"Không"| H["Không tự gửi lại OPEN từ dữ liệu cũ<br/>SEC xác minh nếu kết quả còn mơ hồ"]
    H --> I(["Quét mới khi đủ điều kiện / nhập bù sau đối soát"])
    G -->|"Có"| J{"Trạng thái hiện tại"}
    J -->|"Kết quả đã rõ"| K(["Hiển thị lại kết quả cổng và công<br/>Không tạo lượt mới"])
    J -->|"PENDING / PREPARED còn hợp lệ"| L["Theo dõi trong giới hạn<br/>Backend xử lý theo deadline/quyền"]
    L --> R{"Đã hết thời gian chờ theo policy?"}
    R -->|"Chưa"| F
    R -->|"Rồi"| M
    J -->|"UNKNOWN / DISPATCHING chưa rõ"| M(["SEC / hệ thống đối soát · UF-05"])
    J -->|"Đã hết hạn trước khi gửi"| N(["Không mở muộn<br/>Hướng dẫn quét mới hoặc hỗ trợ"])
~~~

**Quy tắc phục hồi:**

- GET trạng thái chỉ tra cứu; nó không phải lệnh OPEN mới.
- Không đổi eventId mỗi lần mất ACK. Nếu request chưa tới server và cần quét mới, phải còn ngữ cảnh hiện diện, mã/quyền hợp lệ và policy cho phép; không tự resume POST cũ khi mạng trở lại.
- Not found không tự chứng minh “cổng chưa từng mở” trong mọi sự cố, ví dụ khi có phục hồi DB; tình huống chưa đủ bằng chứng phải chuyển đối soát.
- Journal tại kiosk là hỗ trợ phục hồi, không phải AttendanceEvent chính thức. Không mặc định có lưu công offline đáng tin cậy hoặc quyền mở offline.

[Thiết kế M2 đề xuất: teach-stack §9.2](teach-stack.md); [spec §7.3 và ADR-10](spec.pdf#page=24).

## 7. UF-04 — HR quản lý nhân viên, QR và quyền nhà máy

**Liên kết:** UC-03. **Tiền điều kiện:** HR có quyền đúng phạm vi. **Kết thúc:** thay đổi hợp lệ được lưu cùng audit; client tải lại trạng thái mới.

~~~mermaid
flowchart TD
    A(["HR mở Quản lý nhân viên"]) --> B["API kiểm tra quyền và scope<br/>Tìm/chọn nhân viên trong phạm vi"]
    B --> C{"Thao tác"}
    C -->|"Tạo / cập nhật hồ sơ"| D["Nhập hồ sơ, tổ/nhà máy<br/>Kiểm tra mã ổn định và ánh xạ HRS"]
    C -->|"Cấp lại / thu hồi QR"| E["Chọn credential và lý do<br/>Chuẩn bị vô hiệu mã cũ / cấp mới theo policy"]
    C -->|"Quyền nhà máy"| F["Chọn nhà máy, hiệu lực, lý do<br/>Kiểm tra phạm vi được cấp"]
    C -->|"Ngừng hoạt động nhân viên"| G["Chuẩn bị ngừng hoạt động<br/>Yêu cầu vô hiệu nhân viên và QR cùng transaction"]
    D --> H{"Input và quyền hiện hành hợp lệ?"}
    E --> H
    F --> H
    G --> H
    H -->|"Không"| I["Hiển thị lỗi / xung đột<br/>Không ghi thay đổi một phần"]
    I --> B
    H -->|"Có"| J["Commit thay đổi + audit<br/>Version/concurrency theo thiết kế"]
    J --> K{"Thành công?"}
    K -->|"Không"| I
    K -->|"Có"| L["Thông báo kết quả<br/>Tải lại hồ sơ/QR/quyền từ server"]
    L --> M(["Lượt cấp QR / quét sau đó dùng trạng thái hiện hành"])
~~~

**Nhánh QR bị lộ:** HR thu hồi credential → các mã dựa vào credential đó bị từ chối ở lần kiểm tra server tiếp theo → cấp lại theo policy → EMP lấy mã hiện hành. Token ngắn hạn giảm khoảng thời gian dùng mã bị lộ; vẫn còn rủi ro chia sẻ theo thời gian thực, cần nêu rõ giới hạn.

HR quản lý AccessGrant nghiệp vụ; ADM quản lý account/role/scope phần mềm trong UF-09. Các lệnh đã tới thiết bị không được coi là tự hủy chỉ vì vừa thu hồi QR. [Spec FR-1.1–1.6, trang PDF 10](spec.pdf#page=10).

## 8. UF-05 — SEC hỗ trợ và đối soát cổng

**Liên kết:** UC-04. Tách hai trường hợp để tránh nhập bù trùng hoặc biến kết luận “không thấy người đi qua” thành “cổng chưa mở”.

### 8.1. Đối soát request đã có / UNKNOWN

~~~mermaid
flowchart TD
    A(["SEC nhận cảnh báo / EMP nhờ hỗ trợ"]) --> B["Đăng nhập cá nhân<br/>Kiểm tra scope nhà máy"]
    B --> C["Mở attempt/command và lịch sử<br/>Tra cứu TCS nếu API hỗ trợ"]
    C --> D["Kiểm tra thực tế / bằng chứng<br/>Ghi người xử lý, thời điểm và lý do"]
    D --> E{"Kết quả thiết bị đã xác minh được?"}
    E -->|"Chưa"| F(["Giữ UNKNOWN<br/>Giao người xử lý / theo dõi tiếp"])
    E -->|"Rồi"| G["Lưu kết quả cổng đúng bằng chứng<br/>Không tự phát lại OPEN cũ"]
    G --> H{"Đủ căn cứ tạo công?"}
    H -->|"Có"| I["Hệ thống xác nhận một lần theo sourceId<br/>Lưu công + trạng thái + audit phù hợp"]
    H -->|"Không / còn chờ"| J["Ghi kết luận hoặc trạng thái chờ xác minh<br/>Không tạo công chính thức tùy tiện"]
    I --> K(["Kết thúc / thông báo kết quả trong phạm vi"])
    J --> K
~~~

Cổng đã mở nhưng chưa có căn cứ đã qua vẫn có thể là OPEN_CONFIRMED và công chưa CONFIRMED. Khi cần mở một lượt ngoại lệ mới, SEC phải thực hiện thao tác mới có quyền/lý do theo policy, đi qua cơ chế lưu/claim/chống trùng; không sửa UNKNOWN về PREPARED để gửi lại tùy ý.

### 8.2. Mất kết nối trung tâm / nhập MANUAL

~~~mermaid
flowchart TD
    A(["Không hoàn tất được lượt online"]) --> B["SEC ghi sự cố<br/>Nhân viên, giờ xảy ra, hướng, cổng, bằng chứng"]
    B --> C["Khi hệ thống phục hồi<br/>HR đối chiếu hồ sơ với SEC và dữ liệu sẵn có"]
    C --> D{"Đã có công tương ứng?"}
    D -->|"Có"| E(["Liên kết hồ sơ sự cố<br/>Không tạo công trùng"])
    D -->|"Chưa"| F{"Đủ quyền và bằng chứng nhập bù?"}
    F -->|"Không"| G(["Giữ hồ sơ cần xử lý<br/>Không tự xác nhận thành công"])
    F -->|"Có"| H["HR nhập bù nguồn MANUAL<br/>Tách giờ sự kiện và giờ nhập"]
    H --> I["Lưu nguồn, lý do, người thực hiện và audit<br/>Kiểm tra trùng, tính lại khoảng liên quan"]
    I --> J(["Công được cập nhật theo kết quả đối soát"])
~~~

Flow này không cấp quyền mở offline tự động cho kiosk và không điều khiển cơ chế thoát hiểm phần cứng. Dữ liệu bảo vệ ghi nhận là bằng chứng cần được đối chiếu, không tự trở thành bản ghi công hợp lệ. [Spec UC-04, FR-3.6, §7.3 và ADR-10](spec.pdf#page=13).

## 9. UF-06 — HR kiểm tra và hiệu chỉnh chấm công

**Liên kết:** UC-05; có thể bắt đầu từ yêu cầu EMP trong UC-02 hoặc HR phát hiện bất thường. **Kết thúc:** kết luận không cần sửa hoặc correction có version và audit, giữ nguyên sự kiện gốc.

~~~mermaid
flowchart TD
    A(["EMP yêu cầu kiểm tra / HR phát hiện bất thường"]) --> B["HR mở hồ sơ trong scope<br/>Xem IN/OUT, nguồn xác nhận và phiên bản hiện tại"]
    B --> C["Đối chiếu bằng chứng<br/>Phối hợp SEC nếu cần làm rõ tình huống cổng"]
    C --> D{"Có căn cứ hiệu chỉnh?"}
    D -->|"Không / chưa đủ"| E(["Thông báo kết luận hoặc yêu cầu bổ sung<br/>Không sửa tùy tiện"])
    D -->|"Có"| F["Nhập thay đổi, lý do và tài liệu liên quan<br/>Gửi expectedVersion"]
    F --> G["API kiểm tra quyền, dữ liệu và version"]
    G --> H{"Version còn khớp?"}
    H -->|"Không"| I["Báo xung đột<br/>Tải lại bản mới và xem xét thay đổi"]
    I --> B
    H -->|"Có"| J["Transaction: tạo Correction/version mới + audit<br/>Giữ sự kiện gốc"]
    J --> K["Tính lại khoảng hiện diện bị ảnh hưởng<br/>Giữ cờ thiếu/trùng/bất thường khi chưa giải quyết"]
    K --> L{"Kỳ / dữ liệu đã nằm trong lô xuất?"}
    L -->|"Chưa"| M(["Báo cáo/công cá nhân dùng dữ liệu hiệu lực mới"])
    L -->|"Rồi"| N["Tạo phiên bản lô mới khi xuất lại<br/>Liên kết supersedesBatchId"]
    N --> O(["UF-07: HRS xử lý thay thế/cập nhật theo contract"])
~~~

**Quy tắc:** Không dùng “giờ vào đầu–giờ ra cuối” để cộng cả thời gian vắng giữa ngày. Hỗ trợ nhiều cặp IN/OUT, qua đêm và ranh giới tháng; thiếu lượt không được tự biến thành một ca hoàn chỉnh. Hai HR sửa đồng thời phải phát hiện version conflict. Việc HR sửa không cần tự thêm một cấp duyệt thứ hai nếu nhóm chưa chọn chính sách đó. [Spec FR-3.4/3.5, §6.5 và UC-05](spec.pdf#page=22).

## 10. UF-07 — Chốt tháng, xuất HRS và đối soát

**Liên kết:** UC-06. **Trigger:** lịch nội bộ hoặc HR có quyền. **Kết quả thành công:** HRS xác nhận lô đúng kỳ/version/checksum/số lượng theo contract và dữ liệu sẵn sàng đối soát **trước 12:00 trưa ngày 1**.

~~~mermaid
flowchart TD
    A(["Đến lịch / HR yêu cầu xuất"]) --> B["Xác định kỳ theo Asia/Ho_Chi_Minh<br/>Kiểm tra quyền nếu khởi tạo thủ công"]
    B --> C["Khóa/claim job theo kỳ và version<br/>Tra lô đã có để tránh tạo trùng"]
    C --> D["Chốt snapshot dữ liệu công hiệu lực<br/>Kèm nguồn, phiên bản và cờ bất thường"]
    D --> E["Transaction: ExportBatch + ExportItem<br/>Job/Outbox; batchId, checksum, count cố định"]
    E --> F["Worker claim công việc<br/>Ghi lần giao nhận và gửi qua HRS adapter"]
    F --> G{"Kết quả từ HRS"}
    G -->|"ACK đã xử lý"| H{"Khớp kỳ/version/checksum/số lượng<br/>và kết quả xử lý theo contract?"}
    H -->|"Có"| I["ACCEPTED theo nội dung ACK<br/>Lưu thời điểm xác nhận"]
    I --> TA{"Đạt mốc đối soát áp dụng cho lô?"}
    TA -->|"Có"| TB(["Hoàn tất đúng hạn"])
    TA -->|"Không"| TC(["Đã hoàn tất nhưng trễ hạn<br/>Lưu sai lệch và cảnh báo"])
    H -->|"Không"| J["Giữ lô chưa hoàn tất<br/>HR kiểm tra sai lệch"]
    G -->|"Đang xử lý / chỉ tiếp nhận"| K["Chờ và tra trạng thái phù hợp<br/>Chưa đánh dấu hoàn tất"]
    K --> G
    G -->|"Timeout / lỗi tạm thời"| L{"Có API tra trạng thái?"}
    L -->|"Có"| M["Tra batchId đã gửi<br/>Không tạo batch mới"]
    M --> N{"Kết quả đã rõ?"}
    N -->|"Đã xử lý / còn xử lý / bị từ chối"| G
    N -->|"Chưa rõ"| O{"Retry an toàn theo contract<br/>và còn budget/điều kiện?"}
    L -->|"Không"| O
    O -->|"Có"| P["Backoff + jitter<br/>Giữ batchId và snapshot"]
    P --> F
    O -->|"Không"| Q["Cảnh báo HR/ADM<br/>Giữ trạng thái chưa rõ/lỗi, xử lý có kiểm soát"]
    G -->|"Lỗi dữ liệu/quyền hoặc từ chối một phần"| J
    J --> R["Sửa nguyên nhân / dữ liệu có quyền<br/>Nếu nội dung đổi: version mới, liên kết lô cũ"]
    R --> S(["Chạy lại theo contract, giữ lịch sử giao nhận"])
    Q --> S
~~~

Để đồ thị gọn, nhánh chờ/tra cứu được thể hiện như vòng lặp; khi hiện thực phải có giới hạn chờ, lịch polling, escalation và người phụ trách. Không lặp vô hạn hoặc đánh dấu hoàn tất chỉ vì HTTP 2xx.

| Tình huống | Hành vi bắt buộc theo thiết kế |
|---|---|
| Cùng snapshot gửi lại | Giữ batchId; HRS cần thực thi contract chống trùng phù hợp |
| Mất ACK sau khi HRS đã xử lý | Status lookup hoặc retry cùng key nếu được hỗ trợ; không cộng lặp |
| Một phần lô bị từ chối / checksum hoặc count không khớp | Chưa hoàn tất; đối chiếu chi tiết và sửa theo contract |
| Sửa công sau khi chốt | Snapshot cũ giữ nguyên; dữ liệu mới dùng version mới và quan hệ thay thế |
| Lỗi quyền/định dạng | Không tự gửi nguyên lỗi mãi; sửa nguyên nhân. Nếu payload giữ nguyên, giữ định danh lô phù hợp |
| HRS kéo dài sự cố gần hoặc qua hạn | Cảnh báo nguy cơ/trễ hạn, lưu bằng chứng và tiếp tục xử lý theo kế hoạch; không báo đạt hạn giả |
| OUT đến sau thời điểm chốt hoặc ca qua tháng | Giữ cờ và tham chiếu nguồn; bổ sung/thay thế theo version đã thống nhất, không cộng lại toàn kỳ tùy ý |

M1 đề xuất chạy 01:00, tăng cảnh báo lúc 09:00/11:00 và mốc nội bộ 11:30. Đây là thông số nhóm lựa chọn, khác với mốc bắt buộc trước 12:00. Hệ thống chỉ chuyển dữ liệu công/hiện diện; tính lương thuộc HRS. [Spec §6.4–6.5 và §7.4, trang PDF 21–25](spec.pdf#page=21).

Mốc xuất kỳ tháng ban đầu là trước 12:00 ngày 1. **Đề xuất phân biệt theo dõi:** lô hiệu chỉnh phát sinh về sau có lịch xử lý theo thỏa thuận HRS và giữ quan hệ thay thế; không xóa lịch sử đúng/trễ hạn của lô ban đầu hoặc tự gán mọi correction sau ngày 1 là lỗi SLA mới.

## 11. UF-08 — Xem báo cáo và nhật ký theo vai trò

**Liên kết:** UC-07. **Actor:** HR, SUP, SEC, EXE; EMP xem dữ liệu cá nhân trong UF-01, ADM xem kiểm toán quản trị trong UF-09.

~~~mermaid
flowchart TD
    A(["Người dùng mở Báo cáo / Nhật ký"]) --> B["Client hiển thị loại báo cáo theo quyền"]
    B --> C["Chọn kỳ, nhà máy/tổ, bộ lọc được phép"]
    C --> D["API xác thực phiên, permission và scope<br/>Không tin phạm vi chỉ do client khai"]
    D --> E{"Được xem loại dữ liệu này?"}
    E -->|"Không"| F(["Từ chối<br/>Không trả dữ liệu ngoài quyền"])
    E -->|"Có"| G["Áp scope vào truy vấn / tổng hợp trên server<br/>Giới hạn mức chi tiết theo actor"]
    G --> H["Trả dữ liệu phân trang / tổng hợp<br/>Audit truy xuất nhạy cảm theo chính sách"]
    H --> I["Hiển thị kết quả và cờ bất thường"]
    I --> J{"Yêu cầu xuất CSV?"}
    J -->|"Không"| K(["Hoàn tất tra cứu"])
    J -->|"Có, nếu chức năng được chọn"| L["API kiểm tra quyền xuất và scope lần nữa"]
    L --> M{"Được phép?"}
    M -->|"Không"| F
    M -->|"Có"| N(["Tạo/tải file đúng phạm vi<br/>Audit người tải, kỳ và bộ lọc"])
~~~

| Actor | Dữ liệu được xem theo M1 |
|---|---|
| HR | Công/báo cáo và thông tin phục vụ đối soát trong phạm vi được cấp |
| SUP | Tổ được phân công; không tự mở rộng bộ lọc sang tổ khác |
| SEC | Nhật ký cổng thuộc nhà máy được giao; không phải mọi trường hồ sơ HR |
| EXE | Số liệu tổng hợp, không mặc định drill-down cá nhân |

CSV là hạng mục mức S trong M1; không mặc định đã được hiện thực. Đăng xuất/đổi tài khoản phải tránh giữ cache/file truy cập ngoài scope. [Spec FR-4.1/4.2/4.7 và ma trận quyền](spec.pdf#page=11).

## 12. UF-09 — ADM quản trị hệ thống và vận hành

**Liên kết:** UC-08. **Actor:** ADM trong phạm vi được cấp. **Kết thúc:** cấu hình/quyền hợp lệ được lưu có audit hoặc có kết quả theo dõi vận hành rõ ràng.

~~~mermaid
flowchart TD
    A(["ADM đăng nhập khu vực quản trị"]) --> B["API kiểm tra quyền quản trị / scope"]
    B --> C{"Nhóm thao tác"}
    C -->|"Tài khoản / role / scope"| D["Chọn đối tượng, nhập thay đổi<br/>Tách quyền quản trị khỏi quyền hiệu chỉnh công"]
    C -->|"Trạm / cấu hình tích hợp"| E["Nhà máy, chiều IN/OUT, turnstileId<br/>API config, secret references, phiên bản khóa"]
    D --> F["Validate quyền, dữ liệu và version hiện hành"]
    E --> F
    F --> G{"Hợp lệ?"}
    G -->|"Không"| H["Hiển thị lỗi / xung đột<br/>Giữ trạng thái cũ"]
    H --> C
    G -->|"Có"| I["Commit thay đổi + audit<br/>Áp cấu hình/hiệu lực theo policy"]
    I --> J(["Thông báo kết quả<br/>Rà quyền/phiên và trạng thái liên quan"])
    C -->|"Theo dõi / kiểm toán / vận hành"| K["Xem sức khỏe dịch vụ, backlog, UNKNOWN<br/>Lô HRS, backup/restore và audit được phép"]
    K --> L{"Cần hành động vận hành?"}
    L -->|"Không"| M(["Hoàn tất theo dõi"])
    L -->|"Có"| N["Chọn thao tác được cấp<br/>Kiểm tra chính sách và điều kiện thực hiện"]
    N --> O["Thực hiện có lưu kết quả và audit<br/>Chuyển đúng người phụ trách nếu ngoài quyền"]
    O --> P(["Theo dõi đến khi có kết quả / người nhận việc"])
~~~

**Ràng buộc quản trị:**

- Cổng đã có lịch sử được ngừng sử dụng thay vì xóa dấu vết.
- Secret được lưu/quản lý phù hợp phía server, UI không đưa khóa ký QR hoặc credential tích hợp vào public bundle.
- Thu hồi/sửa role không bỏ qua scope; ADM không tự trở thành HR để sửa công.
- Backup/restore cần môi trường/quy trình phù hợp; dữ liệu/lệnh/lô sau phục hồi phải đối soát với TCS/HRS theo thiết kế.
- Lưu giữ/xóa dữ liệu phải qua chính sách đã duyệt, kiểm tra giữ chứng cứ, quyền và audit; không vẽ xóa hồ sơ thành thao tác tùy ý.

[Spec FR-5.1–5.4, §8.4, §10.2–10.4](spec.pdf#page=12).

## 13. Truy vết flow, màn hình và tình huống cần kiểm chứng

### 13.1. Bản đồ triển khai

Màn hình bên dưới là nhóm chức năng đề xuất cho client/, không phải xác nhận route/source hiện đã tồn tại.

| Flow | Use case | Yêu cầu M1/M2 liên quan | Nhóm màn hình |
|---|---|---|---|
| UF-00 | Đăng nhập chung, hỗ trợ UC-02…08 | FR-5.1, FR-4.6; role/scope | Đăng nhập, phiên và khu vực theo vai trò |
| UF-01 | UC-02 | FR-1.3, FR-1.5; cải tiến QR M2 | Cá nhân / QR / công của tôi |
| UF-02 | UC-01 | FR-2.2–2.4, FR-3.1–3.3, NFR-1/2; QR M2 | Kiosk và kết quả truy cập |
| UF-03 | UC-01, UC-04 | FR-3.2, FR-3.6; mất kết nối M2 | Kiosk phục hồi, tra cứu trạng thái |
| UF-04 | UC-03 | FR-1.1/1.2/1.4/1.6 | HR: nhân viên, QR, quyền nhà máy |
| UF-05 | UC-04 | FR-2.5–2.7, FR-3.6 | SEC: nhật ký/đối soát; HR: nhập bù |
| UF-06 | UC-05 | FR-3.4–3.5 | HR: bất thường và hiệu chỉnh |
| UF-07 | UC-06 | FR-4.3–4.5 | HR: lô xuất HRS, ACK và lịch sử gửi |
| UF-08 | UC-07 | FR-4.1/4.2/4.7 | Báo cáo / nhật ký theo quyền |
| UF-09 | UC-08 | FR-4.6, FR-5.1–5.4 | ADM: tài khoản, cấu hình, audit/vận hành |

Mức ưu tiên S trong M1, như CSV hoặc một số theo dõi trạng thái trạm, cần được công bố nếu đưa vào phạm vi code. Các flow không tự thay đổi mức ưu tiên đó.

### 13.2. Kịch bản kiểm chứng đề xuất

| Tình huống | Kết quả cần quan sát |
|---|---|
| EMP lấy QR hợp lệ rồi vào/ra ở làn đúng cấu hình | Đúng chiều, đúng quyền; công chỉ từ nguồn đủ bằng chứng |
| QR hết hạn/bị thu hồi hoặc replay trái policy | Không mở và không tạo công; log/trạng thái phù hợp |
| Kiosk gửi đồng thời cùng stationId/eventId | Một quyền gửi OPEN cơ sở; tối đa một công cho cùng nguồn |
| Cùng ID nhưng payload khác | 409, giữ request gốc; không đổi key tùy ý để vượt kiểm tra |
| DB lỗi trước OPEN | Không gửi lệnh thiết bị; kiosk không báo đã ghi nhận thành công |
| TCS mở rồi mất ACK/crash trước lưu kết quả | UNKNOWN/DISPATCHING có đường đối soát; không mở lại mù |
| Kiosk mất kết nối rồi GET lại trạng thái | Đọc đúng request cũ; không coi GET là thao tác mở cổng |
| SEC xác minh cổng đã mở nhưng chưa đủ bằng chứng đi qua | Không tạo công chính thức chỉ vì trạng thái cổng rõ |
| HR nhập bù khi dữ liệu thật đã xuất hiện sau phục hồi | Đối chiếu nguồn/attempt, không tạo công trùng |
| Hai HR hiệu chỉnh cùng version | Phát hiện conflict, không ghi đè thay đổi mới |
| HRS xử lý xong nhưng TMC không nhận ACK | Status/retry cùng lô theo contract; không cộng dữ liệu lặp |
| HRS trả partial/mismatch hoặc ngừng lâu qua hạn | Không báo hoàn tất/đạt hạn giả; có cảnh báo và xử lý |
| SUP/SEC/EXE đổi bộ lọc hoặc gọi API vượt scope | API từ chối/lọc đúng; không dựa vào việc client ẩn nút |

Đây là kế hoạch kiểm chứng, chưa phải kết quả test đã chạy. Source sự kiện để chống trùng phải ổn định và đối chiếu được; không tự gộp hai lượt hợp lệ chỉ vì cùng nhân viên và thời điểm gần nhau. [Kế hoạch kiểm chứng M1, trang PDF 33–34](spec.pdf#page=33).

## 14. Nguồn PlantUML cho use case diagram

Hai block dưới đây cùng actor/use case/association với §2, dùng để xuất hình UML trong môi trường hỗ trợ PlantUML. Không dùng mũi tên nối use case để mô tả “bước tiếp theo”; thứ tự và nhánh xử lý nằm ở các user flow.

### 14.1. Nhân viên, QR, cổng và công

~~~plantuml
@startuml
left to right direction
skinparam shadowing false
actor "EMP\nNhân viên" as EMP
actor "HR\nNhân sự" as HR
actor "SEC\nBảo vệ" as SEC
actor "TCS\nHệ thống cổng" as TCS

rectangle "Hệ thống TMC - Truy cập và chấm công" {
  usecase "UC-01\nQuét QR tại cổng" as UC01
  usecase "UC-02\nXem QR, hồ sơ, công cá nhân" as UC02
  usecase "UC-03\nQuản lý nhân viên, QR, quyền nhà máy" as UC03
  usecase "UC-04\nHỗ trợ ngoại lệ, đối soát cổng" as UC04
  usecase "UC-05\nHiệu chỉnh chấm công" as UC05
}

EMP -- UC01
EMP -- UC02
HR -- UC03
HR -- UC04
HR -- UC05
SEC -- UC04
UC01 -- TCS
UC04 -- TCS
@enduml
~~~

### 14.2. Báo cáo, xuất HRS và quản trị

~~~plantuml
@startuml
left to right direction
skinparam shadowing false
actor "HR\nNhân sự" as HR
actor "SUP\nGiám sát sản xuất" as SUP
actor "SEC\nBảo vệ" as SEC
actor "EXE\nBan điều hành" as EXE
actor "ADM\nQuản trị" as ADM
actor "HRS\nHR / Payroll" as HRS

rectangle "Hệ thống TMC - Báo cáo và quản trị" {
  usecase "UC-06\nXuất và đối soát dữ liệu tháng" as UC06
  usecase "UC-07\nXem báo cáo, nhật ký theo quyền" as UC07
  usecase "UC-08\nQuản trị và kiểm toán" as UC08
}

HR -- UC06
UC06 -- HRS
HR -- UC07
SUP -- UC07
SEC -- UC07
EXE -- UC07
ADM -- UC08
@enduml
~~~
