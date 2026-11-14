# Tóm tắt và phân tích Assignment 1 (M1) & Assignment 2 (M2)

**Đề tài:** Hệ thống chấm công và kiểm soát ra/vào bằng QR cho TMC Manufacturing Joint Stock Company.

**Nguồn:** [Assignment M1 — 3 trang](SA_CC_hk261_Assignment_M1.pdf) và [Assignment M2 — 3 trang](SA_CC_hk261_Assignment_M2.pdf). Trong tài liệu này, “Assignment 1/2” tương ứng với hai mốc M1/M2 trong đề.

> **Cách đọc:** **[BẮT BUỘC]** là yêu cầu được đề nêu trực tiếp; **[ĐỊNH HƯỚNG]** là mục tiêu chung của đề nhưng chưa có quy cách chi tiết; **[ĐỀ XUẤT]** là phân tích hoặc cách triển khai gợi ý; **[CẦN CHỐT]** là thông tin đề chưa xác định. Các mã FR, NFR, M1, M2 bên dưới do bản tóm tắt đặt để tiện đối chiếu, không phải mã trong PDF. Các hướng dẫn trong đề được ghi nhận là yêu cầu bài tập, không phải lệnh triển khai hệ thống trong lần tạo tài liệu này.

## 1. Nhìn nhanh: phải làm gì ở từng assignment?

| Nội dung | Assignment 1 — M1 | Assignment 2 — M2 |
|---|---|---|
| Trọng tâm | Phân tích yêu cầu, bối cảnh, phạm vi và thiết kế kiến trúc | Hoàn thiện thiết kế, xử lý vấn đề phát sinh, triển khai và kiểm thử theo mục tiêu chung |
| Phạm vi nghiệp vụ | Chấm công và kiểm soát nhân viên ra/vào bằng QR | Kế thừa phạm vi M1; bổ sung xử lý mất kết nối và rủi ro QR tĩnh bị lộ |
| Kiến trúc | Đặc tính kiến trúc, so sánh/chọn style, kiến trúc logical và physical, quyết định và nguyên tắc thiết kế | Toàn bộ nội dung M1, đồng thời yêu cầu rõ module views, component-and-connector views và allocation views |
| SOLID | Đã xuất hiện trong mục tiêu chung; nên định hướng thiết kế theo SOLID | Phải giải thích việc áp dụng SOLID và viết reflection report |
| Code | Không có Task triển khai code hay yêu cầu nộp GitHub riêng trong M1 | Phải chọn **ít nhất một module chính** để triển khai, code tuân thủ SOLID |
| Kiểm thử | Không có Task kiểm thử riêng | Mục tiêu chung nhắc triển khai và kiểm thử; đề không quy định bộ test, framework hay mức coverage cụ thể |
| Sản phẩm nộp | Báo cáo chi tiết trên LMS | Báo cáo chi tiết **có URL GitHub chứa source code**, nộp trên LMS |
| Deadline, thang điểm, độ dài | Không được ghi trong PDF | Không được ghi trong PDF |

**Điểm cần nhớ:** M2 là bước phát triển tiếp của cùng hệ thống. Không có yêu cầu phải triển khai toàn bộ hệ thống trong Task 2; mức tối thiểu được nêu là một module chính. Báo cáo M2 vẫn phải đáp ứng đầy đủ các nội dung thiết kế được đề liệt kê. [Nguồn: M1, tr. 1–3](SA_CC_hk261_Assignment_M1.pdf#page=1); [M2, tr. 1–3](SA_CC_hk261_Assignment_M2.pdf#page=1).

~~~mermaid
flowchart LR
    A["Bối cảnh TMC<br/>Hai nhà máy, QR, chấm công, kiểm soát cổng"] --> B["M1<br/>Phân tích yêu cầu + thiết kế kiến trúc"]
    B --> C["M2: hoàn thiện kiến trúc<br/>Mất kết nối + QR bị lộ + các views + SOLID"]
    C --> D["Triển khai ít nhất 1 module chính<br/>Kiểm chứng hoạt động theo mục tiêu M2"]
    D --> E["Nộp LMS<br/>Báo cáo M2 có URL GitHub source code"]
~~~

## 2. Bối cảnh, mục tiêu và ranh giới hệ thống

### 2.1. Dữ kiện nền phải đưa vào phân tích

| Dữ kiện từ đề | Ý nghĩa đối với bài làm |
|---|---|
| Nhà máy Bình Dương khoảng 800 nhân viên; Long An khoảng 600 nhân viên | Có hai địa điểm vận hành, khoảng 1.400 nhân viên tổng cộng; kiến trúc cần thể hiện quan hệ giữa các nhà máy và hệ thống chung |
| Dùng QR để định danh nhân viên và check-in/check-out | QR, nhân viên, điểm quét và sự kiện vào/ra là các khái niệm nghiệp vụ cốt lõi |
| Scanner kích hoạt tín hiệu đến turnstile controller để mở cổng | Phải mô tả đường đi từ quét QR đến điều khiển cổng qua hệ thống có sẵn |
| Mỗi lần vào hoặc ra được ghi thành một attendance transaction | Cần phân biệt chiều vào/ra và bảo toàn bản ghi chấm công tương ứng |
| Công ty đã có HR/Payroll System | Hệ thống mới phải tích hợp qua API; không thay thế chức năng tính lương |
| Dữ liệu phải sẵn sàng đối soát trước 12:00 trưa ngày 1 hằng tháng | Đây là mốc nghiệp vụ bắt buộc; việc chỉ có báo cáo nội bộ chưa đáp ứng yêu cầu tích hợp |
| Công ty đã có turnstile control system với API mở/đóng cổng | Không mặc định phải chế tạo phần cứng hoặc xây lại bộ điều khiển cổng |
| Mỗi nhân viên có smartphone, có thể truy cập app công ty, web portal hoặc email để hiển thị QR | Cần nêu cách nhân viên nhận/hiển thị QR; đề không yêu cầu tự xây mới cả ba kênh |

[Nguồn chung: M1, tr. 1](SA_CC_hk261_Assignment_M1.pdf#page=1); [M2, tr. 1](SA_CC_hk261_Assignment_M2.pdf#page=1).

### 2.2. Scope: trong và ngoài phạm vi

| Phạm vi | Hạng mục | Mức yêu cầu |
|---|---|---|
| Trong | Quản lý người dùng và QR | **[BẮT BUỘC]** Nhóm chức năng được nêu trực tiếp |
| Trong | Quản lý gate station / điểm cổng | **[BẮT BUỘC]** Nhóm chức năng được nêu trực tiếp |
| Trong | Ghi nhận sự kiện chấm công vào/ra | **[BẮT BUỘC]** Nhóm chức năng được nêu trực tiếp |
| Trong | Báo cáo và kiểm toán/truy vết | **[BẮT BUỘC]** Nhóm chức năng được nêu trực tiếp |
| Trong | Quản trị hệ thống | **[BẮT BUỘC]** Nhóm chức năng được nêu trực tiếp |
| Trong | Tích hợp API với HR/Payroll và bộ điều khiển turnstile | **[BẮT BUỘC]** Có trong phần Context |
| Bổ sung ở M2 | Giải pháp kiến trúc cho mất kết nối và QR tĩnh bị lộ | **[BẮT BUỘC]** Phải giải thích tác dụng và cách tích hợp vào kiến trúc |
| Ngoài | Quản lý khách/visitor management | Đề ghi ngoài phạm vi giai đoạn này |
| Ngoài | Tính lương/payroll calculation | Hệ thống chỉ xuất dữ liệu chấm công, không xử lý tính lương |
| Chưa được yêu cầu riêng | App mobile mới, nhận diện khuôn mặt, GPS, sinh trắc học, chế tạo cổng | Chỉ thêm khi có lý do và ghi rõ là mở rộng, không biến thành điều kiện bắt buộc |

**Ranh giới quan trọng:** Thiết kế kiến trúc cần bao quát hệ thống; phạm vi code M2 có thể giới hạn ở module chính được chọn. Ngoài phạm vi tính lương không có nghĩa là bỏ phần kết nối HR/Payroll. [Nguồn: M1, tr. 1–2](SA_CC_hk261_Assignment_M1.pdf#page=1); [M2, tr. 1–2 và tr. 3, Task 2](SA_CC_hk261_Assignment_M2.pdf#page=1).

### 2.3. Actors và nhu cầu cần phân tích

Đề **bắt buộc nhận diện** các actors sau. Cột vai trò dưới đây là **[ĐỀ XUẤT]** để phân tích use case và RBAC; đề chưa cấp quyền cụ thể cho từng actor.

| Actor | Vai trò/use case đề xuất để làm rõ |
|---|---|
| Nhân viên | Hiển thị QR, thực hiện vào/ra; xem dữ liệu chấm công của mình nếu chọn hỗ trợ |
| Giám sát sản xuất | Theo dõi tình hình nhân sự/chấm công thuộc phạm vi phụ trách |
| Nhân sự/HR | Xem báo cáo, đối soát dữ liệu và theo dõi việc chuyển dữ liệu sang HR/Payroll |
| Bảo vệ | Theo dõi tình trạng cổng, lượt quét và các tình huống truy cập cần xử lý |
| Quản trị viên hệ thống | Quản lý tài khoản, vai trò, cấu hình và điểm cổng |
| Ban điều hành | Xem báo cáo và theo dõi tình hình tổng hợp |

**[CẦN CHỐT]** Quyền xem/sửa/duyệt cụ thể, giới hạn theo nhà máy/bộ phận và quy trình sửa công chưa được đề xác định. [Danh sách actors: M1, tr. 1](SA_CC_hk261_Assignment_M1.pdf#page=1); [M2, tr. 1](SA_CC_hk261_Assignment_M2.pdf#page=1).

## 3. Requirements và các ràng buộc nghiệp vụ chung

### 3.1. Functional requirements — yêu cầu chức năng

Đề mới liệt kê năm **nhóm** chức năng, chưa đặc tả toàn bộ use case. Vì vậy cần phân rã chúng trong báo cáo; các thao tác minh họa dưới đây không phải danh sách thao tác bắt buộc do đề quy định.

| Mã | Yêu cầu trực tiếp từ đề | Chi tiết nên phân tích — **[ĐỀ XUẤT]** |
|---|---|---|
| FR-01 | User and QR Code Management | Quan hệ nhân viên–tài khoản–QR; cấp, thay thế, thu hồi QR; vòng đời QR và tài khoản; cách hiển thị QR |
| FR-02 | Gate Station Management | Nhà máy, gate station, scanner, controller; định danh điểm quét và chiều vào/ra; cấu hình kết nối và trạng thái thiết bị |
| FR-03 | Attendance Event Recording | Tiếp nhận lượt quét, xác thực, xác định vào/ra, điều khiển cổng, lưu giao dịch; xử lý lỗi và chống ghi trùng khi cần |
| FR-04 | Reporting and Auditing | Báo cáo tháng, tra cứu lịch sử và audit log; người xem, dữ liệu đầu vào, cách đối soát |
| FR-05 | System Administration | Cấu hình hệ thống, người dùng/vai trò và các chính sách vận hành cần thiết |
| INT-01 | Chuyển dữ liệu chấm công sang HR/Payroll qua API | Dữ liệu trao đổi, lịch truyền, trạng thái giao nhận và đối soát; đạt mốc trước 12:00 trưa ngày 1 |
| INT-02 | Tích hợp turnstile control system qua API | Luồng gọi mở/đóng cổng, timeout, phản hồi và ghi nhận kết quả; không giả định scanner đồng nghĩa nhân viên đã qua cổng thành công |

FR-01 đến FR-05 xuất phát từ Scope; INT-01 và INT-02 xuất phát từ Context. [M1, tr. 1–2](SA_CC_hk261_Assignment_M1.pdf#page=1); [M2, tr. 1–2](SA_CC_hk261_Assignment_M2.pdf#page=1).

### 3.2. Non-functional requirements — yêu cầu phi chức năng

| Mã | Ràng buộc bắt buộc | Cách trình bày/kiểm chứng đề xuất |
|---|---|---|
| NFR-01 — Hiệu năng | Thời gian phản hồi kiosk **≤ 2 giây**, trong tải hiện tại: khoảng **800 giao dịch ra/vào trong 30 phút tại mỗi nhà máy** vào giờ đổi ca | Mô tả kịch bản tải, điểm bắt đầu/kết thúc phép đo, môi trường và số liệu thực đo; cần có đợt quét dồn thay vì chỉ phát đều |
| NFR-02 — Toàn vẹn dữ liệu | **Không mất bản ghi chấm công trong vận hành bình thường** | Định nghĩa khi nào sự kiện được tiếp nhận thành công, cơ chế lưu bền vững và đối chiếu số sự kiện với số bản ghi |
| NFR-03 — Phân quyền và truy vết | **RBAC và audit logging đầy đủ** | Có ma trận quyền và mô tả sự kiện phải audit; kiểm tra từ chối thao tác không được phép, khả năng truy vết |
| NFR-04 — Bảo vệ dữ liệu cá nhân | Bảo vệ dữ liệu cá nhân nhân viên theo các quy định về quyền riêng tư áp dụng | Mô tả dữ liệu thu thập, người được truy cập và biện pháp bảo vệ; đề không chỉ định tên luật hay thời hạn lưu trữ |

**Lưu ý về con số:** 800 / 30 ≈ **26,7 giao dịch/phút**, tương đương **0,44 giao dịch/giây/nhà máy** ở mức trung bình. Đây là phép suy ra để ước lượng, không phải tốc độ đỉnh hay giới hạn tải mới. Số khoảng 600 nhân viên Long An không thay thế được mốc tải khoảng 800 giao dịch/30 phút/**mỗi nhà máy** mà đề đã nêu.

**[CẦN CHỐT]** Đề chưa định nghĩa biên đo 2 giây, percentile, số kiosk/cổng, tỷ lệ quét đồng thời, số lượt vào so với ra, SLA availability, RPO/RTO hoặc thời gian mất mạng tối đa. Không tự ghi các giá trị này thành yêu cầu của giảng viên. [Nguồn: M1, tr. 2](SA_CC_hk261_Assignment_M1.pdf#page=2); [M2, tr. 2](SA_CC_hk261_Assignment_M2.pdf#page=2).

### 3.3. Business rules và constraints cần giữ đúng

| Mã | Quy tắc/ràng buộc từ đề | Hệ quả đối với thiết kế |
|---|---|---|
| BR-01 | Dùng QR để nhận diện nhân viên và check-in/check-out | Thiết kế phải có luồng xác thực QR và gắn với nhân viên |
| BR-02 | Mỗi sự kiện vào hoặc ra tạo một attendance transaction | Phân biệt hướng; liên kết với nhân viên, thời điểm và điểm cổng theo mô hình dữ liệu được chọn |
| BR-03 | Scanner kích hoạt mở cổng thông qua hệ thống turnstile | Mô tả rõ tích hợp điều khiển cổng và kết quả xử lý |
| BR-04 | Truyền dữ liệu sang HR/Payroll **qua API**, sẵn sàng đối soát **trước 12:00 trưa ngày 1 hằng tháng** | Cần mô tả cả luồng truyền và trạng thái dữ liệu đến hệ thống nhận; định dạng file đơn thuần chưa thay thế được yêu cầu API |
| BR-05 | Không tính lương, không quản lý khách trong phạm vi này | Giới hạn use case, mô hình dữ liệu và phạm vi demo tương ứng |
| BR-06 | Phải đáp ứng RBAC, audit và bảo vệ dữ liệu cá nhân | Gắn quyền và dấu vết thao tác vào thiết kế, không chỉ ghi thành khẩu hiệu |

**[CẦN CHỐT]** Kỳ dữ liệu được chốt vào ngày 1, múi giờ nghiệp vụ và cơ chế sửa công sau đối soát chưa được nêu. Hiểu báo cáo là dữ liệu tháng trước là hợp lý nhưng vẫn cần ghi rõ là giả định. Quy tắc ca đêm, đi muộn, tăng ca, nghỉ phép, quên check-out và phê duyệt sửa công cũng chưa được đề đặc tả.

~~~mermaid
sequenceDiagram
    participant NV as Nhân viên
    participant K as Scanner / Kiosk
    participant S as Hệ thống TMC
    participant G as Turnstile Controller
    participant H as HR / Payroll
    NV->>K: Hiển thị và quét QR khi vào/ra
    K->>S: Gửi dữ liệu lượt quét
    S->>S: Kiểm tra định danh và quyền truy cập
    S->>G: Gọi API điều khiển cổng theo kết quả xử lý
    G-->>S: Trả kết quả điều khiển
    S->>S: Ghi nhận giao dịch chấm công theo quy tắc đã chốt
    S-->>K: Phản hồi kết quả
    S->>H: Truyền dữ liệu chấm công qua API
    Note over S,H: Dữ liệu sẵn sàng đối soát trước 12:00 trưa ngày 1 hằng tháng
~~~

Sơ đồ trên là **[ĐỀ XUẤT]** để hình dung luồng nghiệp vụ, không áp đặt thứ tự commit dữ liệu và mở cổng. Báo cáo cần chốt thời điểm ghi nhận “đã vào/ra”, cách xác nhận người đã qua cổng và cách xử lý khi cổng hoặc kết nối lỗi. Không coi mọi QR lỗi/bị từ chối là một giao dịch chấm công thành công.

## 4. Assignment 1 — danh sách việc phải làm

M1 có **Task 1: Software Architecture Design**. Báo cáo cần bao phủ các mục sau. [Nguồn: M1, tr. 2–3](SA_CC_hk261_Assignment_M1.pdf#page=2).

| Mã | Việc bắt buộc | Kết quả nên thể hiện trong báo cáo — **[ĐỀ XUẤT]** |
|---|---|---|
| M1-01 | Mô tả kỹ bối cảnh, mục tiêu, phạm vi, yêu cầu chức năng và phi chức năng | Bối cảnh hai nhà máy; actors; in/out scope; danh sách FR/NFR; tích hợp; giả định và điểm chưa rõ |
| M1-02 | Xác định **Architecture Characteristics**: các tiêu chí thành công | Gắn hiệu năng, toàn vẹn dữ liệu, bảo mật, khả năng bảo trì… với kịch bản và cách đánh giá; phân biệt yêu cầu từ đề với tiêu chí nhóm bổ sung |
| M1-03 | **So sánh và chọn architecture styles** phù hợp | Các phương án, tiêu chí so sánh, đánh đổi và lý do lựa chọn; không chỉ đưa tên style đã chọn |
| M1-04 | Trình bày **từng bước xây dựng kiến trúc logical và physical** | Từ yêu cầu đến phân rã trách nhiệm, quan hệ/tương tác, rồi ánh xạ sang vị trí triển khai; có lý do cho từng bước |
| M1-05 | Trình bày **Architecture Decisions**: các quy tắc xây dựng hệ thống | Quyết định, bối cảnh, phương án cân nhắc, lý do và hệ quả; ADR là cách ghi đề xuất, không phải mẫu bắt buộc |
| M1-06 | Trình bày **Design Principles**: hướng dẫn thiết kế hệ thống | Nguyên tắc tách trách nhiệm, phụ thuộc qua interface, bảo mật… và vị trí áp dụng; SOLID đã có trong mục tiêu chung |
| M1-07 | Nộp **báo cáo chi tiết trên LMS** | Báo cáo đọc độc lập được, sơ đồ có chú giải, dẫn nguồn và giả định rõ ràng |

**Logical architecture** trả lời hệ thống gồm những phần nào, trách nhiệm và quan hệ ra sao. **Physical architecture** trả lời các phần đó chạy ở đâu, trên những node/môi trường nào và kết nối như thế nào. Hai phần cần khớp nhau.

Mục tiêu chung của M1 đã đề cập tài liệu kiến trúc từ nhiều góc nhìn. Tuy nhiên, danh sách chính xác **module / component-and-connector / allocation views** được ghi thành yêu cầu cụ thể ở M2; không nên nói M1 hoàn toàn không cần nhiều góc nhìn, cũng không nên gán toàn bộ các Task bổ sung của M2 vào M1.

## 5. Assignment 2 — danh sách việc phải làm

M2 tiếp tục có **Task 1: Software Architecture Design**, thêm nội dung thiết kế và **Task 2: Code Implementation**. Phần Issues Encountered cũng là yêu cầu cần trả lời. [Nguồn: M2, tr. 2–3](SA_CC_hk261_Assignment_M2.pdf#page=2).

| Mã | Việc bắt buộc | Bằng chứng cần chuẩn bị — cách thể hiện **[ĐỀ XUẤT]** |
|---|---|---|
| M2-01 | Tiếp tục mô tả bối cảnh, FR/NFR, mục tiêu và scope; đầy đủ characteristics, structure, decisions, principles | Bản thiết kế cuối cùng, cập nhật từ M1; các phần vẫn nhất quán sau khi xử lý hai vấn đề mới |
| M2-02 | Đề xuất cải tiến/thay đổi kiến trúc cho **mất kết nối khi xử lý giao dịch chấm công** | Phân tích tình huống lỗi, cơ chế xử lý, vì sao giảm rủi ro và tích hợp vào thành phần/luồng nào |
| M2-03 | Đề xuất cải tiến/thay đổi kiến trúc cho **QR tĩnh bị lộ**, dẫn đến truy cập trái phép hoặc gian lận chấm công | Mô hình đe dọa, phương án bảo vệ QR, giới hạn còn lại và thay đổi kiến trúc tương ứng |
| M2-04 | Trình bày **module views** | Phân rã code/module, trách nhiệm và quan hệ phụ thuộc |
| M2-05 | Trình bày **component-and-connector views** | Các thành phần đang chạy và cách chúng giao tiếp; luồng bình thường và luồng lỗi quan trọng |
| M2-06 | Trình bày **allocation views** | Ánh xạ phần mềm vào môi trường/tài nguyên; deployment view là lựa chọn phù hợp để thể hiện hai nhà máy, server và hệ thống ngoài |
| M2-07 | Giải thích cách áp dụng **SOLID** | Từng nguyên tắc, phần thiết kế chịu tác động và ví dụ cụ thể; liên hệ code của module đã triển khai |
| M2-08 | Viết **reflection report ngắn về SOLID** | Thiết kế được cải thiện ra sao, khó khăn khi áp dụng, ảnh hưởng đến modularity, maintainability và extensibility |
| M2-09 | Triển khai **ít nhất một module chính**, có chức năng cốt lõi theo thiết kế và code tuân thủ SOLID | Source code có thể chạy, phạm vi module rõ ràng và luồng nghiệp vụ có ý nghĩa; không chỉ có giao diện tĩnh |
| M2-10 | Nộp **báo cáo chi tiết chứa URL GitHub source code lên LMS** | Link repo đúng, mã nguồn tương ứng với thiết kế và người chấm truy cập được |

**Kiểm thử trong M2:** Phần Objective mô tả M2 là hoàn thiện thiết kế, triển khai và kiểm thử. Tuy nhiên, danh sách Task không tách Task kiểm thử, không ấn định số test, loại test, coverage hay mẫu báo cáo test. Nên có kiểm thử và bằng chứng thực thi để đáp ứng định hướng này; phân biệt chúng với các yêu cầu cụ thể được nêu trong bảng trên.

**Không cần suy diễn thành yêu cầu mới:** Đề không bắt buộc code tất cả module, chuyển sang microservices, dùng QR động theo một giao thức nhất định, xây ứng dụng mobile riêng hoặc dùng một ngôn ngữ/framework cụ thể. Hai vấn đề M2 đều phải được giải quyết trong **thiết kế kiến trúc**, kể cả khi phạm vi code chỉ chọn một module.

## 6. Hai vấn đề trọng tâm M2 và hướng giải quyết

Toàn bộ cơ chế kỹ thuật ở mục 6 là **[ĐỀ XUẤT]**. Yêu cầu bắt buộc của đề là: xử lý được từng vấn đề ở mức kiến trúc, giải thích vì sao giải pháp giảm thiểu vấn đề và cách đưa nó vào hệ thống. [Nguồn: M2, tr. 2, Issues Encountered](SA_CC_hk261_Assignment_M2.pdf#page=2).

### 6.1. Mất kết nối trong lúc chấm công

**Vấn đề phải phân tích:** Kiosk mất đường truyền đến server; server đã lưu nhưng phản hồi bị mất; kết nối đến cổng hoặc HR/Payroll bị gián đoạn. Đề không chỉ rõ đoạn mạng nào bị mất, vì vậy cần xác định phạm vi giả định trước khi chọn cách giải quyết.

| Tình huống/rủi ro | Cơ chế đề xuất | Đưa vào kiến trúc ở đâu? |
|---|---|---|
| Kiosk gửi sự kiện nhưng mạng hỏng trước khi server tiếp nhận | Lưu sự kiện bền vững tại điểm tiếp nhận; có hàng chờ chờ đồng bộ | Kho cục bộ/edge hoặc bộ phận tiếp nhận phù hợp với ranh giới lỗi đã chọn |
| Server đã commit nhưng kiosk không nhận ACK; gửi lại gây trùng | Mỗi sự kiện có ID ổn định; dùng lại cùng ID khi retry; server xử lý idempotent với ràng buộc duy nhất/lưu trạng thái phù hợp | Client gửi sự kiện + API tiếp nhận + kho dữ liệu trung tâm |
| Mạng phục hồi, nhiều kiosk đẩy dữ liệu cùng lúc | Worker đồng bộ, retry có backoff, quản lý backlog và trạng thái pending/synced/failed | Thành phần sync; ghi nhận ACK chỉ sau khi dữ liệu được lưu bền vững |
| Sự kiện đến trễ hoặc không đúng thứ tự | Lưu thời điểm sự kiện và thời điểm nhận; định danh thiết bị/nhà máy; quy tắc đối soát rõ ràng | Mô hình sự kiện và xử lý chấm công/báo cáo |
| Lệnh mở cổng timeout, chưa biết cổng đã mở hay chưa | Theo dõi command ID/trạng thái; truy vấn hoặc đối soát nếu controller hỗ trợ; tránh retry mù lệnh có tác động vật lý | Adapter turnstile và state machine điều khiển cổng |
| API HR/Payroll tạm ngừng hoạt động | Hàng chờ/outbox, retry, idempotency nếu API nhận hỗ trợ và theo dõi lần giao nhận | Adapter HR/Payroll và worker tích hợp; theo dõi nguy cơ trễ mốc đối soát |

**Luồng phục hồi đề xuất:** tạo event ID → lưu bền vững tại điểm tiếp nhận → gửi/đồng bộ → server kiểm tra ID và lưu → nhận xác nhận → đánh dấu đã đồng bộ. Nếu mất xác nhận thì gửi lại **cùng ID**, không tạo một sự kiện mới.

**Các giới hạn phải nói rõ:**

- “Không mất dữ liệu” ở M1 được nêu cho vận hành bình thường. M2 buộc xem xét thêm mất kết nối; không được tự đổi thành cam kết không mất dữ liệu trong mọi kiểu hỏng phần cứng/thảm họa.
- Lưu chờ đồng bộ **không tự động đồng nghĩa** vẫn cho nhân viên qua cổng lúc offline. Phải chốt riêng chính sách cho phép/từ chối/quy trình thủ công và dữ liệu nào được dùng để xác thực cục bộ.
- Offline authorization, nếu chọn, cần giới hạn thời gian, dữ liệu quyền hợp lệ, xử lý thu hồi quyền và bảo vệ kho cục bộ. Đây là đánh đổi bảo mật–khả dụng cần ghi vào quyết định kiến trúc.
- Idempotency giúp tránh tác động dữ liệu trùng do retry; không đủ để tuyên bố hệ thống phân tán hoặc cổng vật lý đạt “exactly once” trong mọi tình huống.

### 6.2. QR tĩnh bị lộ, bị dùng để vào trái phép hoặc chấm công hộ

**Vấn đề phải phân tích:** QR tĩnh có thể bị chụp/chia sẻ và dùng lại. Cần xử lý cả nguy cơ truy cập cơ sở trái phép lẫn gian lận chấm công, không chỉ thay đổi hình thức hiển thị QR.

| Cơ chế đề xuất | Tác dụng | Giới hạn/điểm phải chốt |
|---|---|---|
| QR động hoặc token có thời hạn ngắn | Giảm khoảng thời gian dùng được của mã bị lộ | Thời hạn cụ thể do nhóm đề xuất; hết hạn không ngăn được chia sẻ tức thời |
| Token có chữ ký số hoặc MAC phù hợp | Giúp bộ xác thực kiểm tra nguồn phát hành và phát hiện sửa nội dung | Phải có quản lý khóa và phân phối quyền xác thực; chữ ký/MAC không ngăn sao chép token còn hạn |
| Nonce/token ID và kiểm tra dùng lại | Giảm replay của token đã sử dụng | Phải chốt định nghĩa “một lần sử dụng”, quan hệ với vào/ra và khả năng kiểm tra khi nhiều cổng offline |
| Kiểm tra trạng thái nhân viên và quyền truy cập tại thời điểm xác thực | QR hợp lệ về kỹ thuật vẫn phải qua kiểm tra quyền hiện hành | Cache offline có thể chậm cập nhật việc khóa tài khoản hoặc thu hồi quyền |
| QR không chứa PII không cần thiết; bảo vệ giao tiếp và không ghi token nhạy cảm vào log | Giảm lộ lọt thông tin và giảm khả năng dùng log để tái sử dụng mã | Đây là lựa chọn thiết kế bảo vệ dữ liệu, đề không quy định định dạng payload cụ thể |
| Theo dõi hành vi bất thường; nếu cần, bổ sung bước xác minh phù hợp | Hỗ trợ phát hiện dùng lại mã, lượt quét bất hợp lý hoặc nghi ngờ chấm công hộ | Sinh trắc học/GPS/nhận diện khuôn mặt không được đề bắt buộc; không tự mở rộng phạm vi dữ liệu nhạy cảm |

**Tích hợp đề xuất:** QR Issuer cấp token → QR Validator kiểm tra tính xác thực, hạn dùng, trạng thái và quyền → Replay Guard kiểm tra dùng lại theo chính sách → Attendance xử lý giao dịch → Gate Adapter điều khiển cổng → Audit lưu kết quả phù hợp.

**Giới hạn phải công khai:** QR động hoặc token được ký vẫn có thể bị chia sẻ theo thời gian thực; không tự chứng minh người cầm điện thoại là đúng nhân viên. Khi kiosk offline, kiểm tra thu hồi quyền và chống replay xuyên nhiều cổng khó hơn. Giải pháp M2 cần nêu cách cân bằng hai vấn đề này, không khẳng định chỉ đổi sang QR động là giải quyết triệt để gian lận.

## 7. Gợi ý tổ chức kiến trúc và visualization

Mục này là **[ĐỀ XUẤT]** để hình dung bài làm; đề yêu cầu **so sánh và tự chọn kiến trúc phù hợp**, không quy định sẵn kiến trúc hay stack dưới đây.

### 7.1. So sánh phương án trước khi lựa chọn

| Phương án | Điểm phù hợp | Đánh đổi cần thảo luận |
|---|---|---|
| Layered architecture / modular monolith cho phần trung tâm | Dễ phân chia nghiệp vụ, kiểm thử và triển khai trong phạm vi nhóm sinh viên | Cần giữ ranh giới module, tránh truy cập chéo dữ liệu tùy tiện và phụ thuộc vòng |
| Microservices | Có thể tách triển khai, mở rộng hoặc cô lập một số phần độc lập | Tăng chi phí vận hành, giao tiếp mạng, đồng bộ dữ liệu và xử lý lỗi phân tán; phải chứng minh lợi ích cho bài toán |
| Event-driven cho ghi nhận và đồng bộ/tích hợp | Phù hợp retry, xử lý bất đồng bộ, giảm phụ thuộc tức thời vào HR/Payroll | Phải xử lý event trùng, thứ tự, giám sát backlog và nhất quán cuối cùng |

Các lựa chọn trên không hoàn toàn loại trừ nhau: modular monolith có thể dùng sự kiện nội bộ hoặc worker tích hợp; microservices cũng có thể dùng event-driven. Một hướng khả thi là **trung tâm dạng modular monolith, tích hợp qua adapter, có thành phần cục bộ/hàng chờ cho đoạn cần chịu mất mạng**. Cần kiểm chứng trên yêu cầu tải, bảo mật và phạm vi triển khai đã chọn.

### 7.2. Ba góc nhìn M2 bắt buộc

| View | Trả lời câu hỏi gì? | Nội dung/sơ đồ gợi ý |
|---|---|---|
| **Module view** | Code được chia thành những đơn vị nào, ai phụ thuộc ai? | Sơ đồ module/layer/package, trách nhiệm và interface; đây là cấu trúc tĩnh |
| **Component-and-connector view** | Thành phần nào tương tác khi hệ thống chạy, qua kênh/giao thức nào? | Runtime components, API, connector đồng bộ/bất đồng bộ; sequence quét QR và mất mạng; không chỉ liệt kê thư mục code |
| **Allocation view** | Phần mềm được ánh xạ vào môi trường/tài nguyên nào? | Deployment mapping cho kiosk/edge tại hai nhà máy, máy chủ trung tâm, kho dữ liệu và hệ thống ngoài; có thể bổ sung ánh xạ mã nguồn/nhóm phát triển khi hữu ích |

Các view cần dùng cùng tên module/thành phần, có chú giải và nhất quán về ranh giới hệ thống. Một hình chỉ có các khối tên chức năng khó thay thế được cả ba góc nhìn.

**Ví dụ module view — các mũi tên thể hiện phụ thuộc code dự kiến:**

~~~mermaid
flowchart TB
    UI["API / Presentation"] --> APP["Application use cases<br/>Tiếp nhận lượt quét, báo cáo, đồng bộ"]
    APP --> DOMAIN["Domain<br/>Attendance, QR policy, Access policy"]
    APP --> PORTS["Ports / Interfaces<br/>Repository, QR verifier, Gate, HR"]
    INFRA["Infrastructure adapters<br/>Database, QR crypto, Turnstile API, HR API"] --> PORTS
    INFRA --> DOMAIN
~~~

Trong ví dụ này, infrastructure triển khai interface; application không phải phụ thuộc trực tiếp vào SDK phần cứng hoặc một database cụ thể. Đây là một cách thể hiện DIP, không phải cấu trúc thư mục bắt buộc.

**Ví dụ component-and-connector view — đường truyền chấm công có cơ chế retry:**

~~~mermaid
sequenceDiagram
    participant K as Kiosk Agent
    participant L as Local Store
    participant W as Sync Worker
    participant A as Attendance API
    participant D as Central DB
    K->>L: Lưu event với ID ổn định
    W->>L: Đọc event pending
    W->>A: Gửi event qua API
    A->>D: Kiểm tra ID, lưu hoặc trả kết quả đã xử lý
    D-->>A: Kết quả bền vững
    alt Nhận được phản hồi
        A-->>W: ACK theo event ID
        W->>L: Đánh dấu đã đồng bộ
    else Kết nối mất hoặc không nhận được ACK
        Note over W,A: Kết quả ở server có thể chưa biết
        W->>W: Retry có backoff, giữ nguyên event ID
    end
~~~

Ví dụ này chỉ mô tả lưu và chuyển sự kiện; luồng quyết định cho qua cổng, xác thực QR offline và điều khiển phần cứng cần sơ đồ/chính sách bổ sung khi chọn hỗ trợ.

**Ví dụ allocation/deployment view — có thành phần tại hai nhà máy:**

~~~mermaid
flowchart TB
    subgraph BD["Nhà máy Bình Dương"]
        K1["Scanner / Kiosk Agent"] --> L1[("Local Store")]
        K1 --> G1["Turnstile Controller<br/>Hệ thống có sẵn"]
    end
    subgraph LA["Nhà máy Long An"]
        K2["Scanner / Kiosk Agent"] --> L2[("Local Store")]
        K2 --> G2["Turnstile Controller<br/>Hệ thống có sẵn"]
    end
    subgraph CENTER["Môi trường trung tâm — vị trí cụ thể cần lựa chọn"]
        API["TMC Backend / API"] --> DB[("Attendance + Audit Data")]
        API --> SYNC["Integration Worker"]
    end
    K1 <-->|"API: truyền dữ liệu / đồng bộ"| API
    K2 <-->|"API: truyền dữ liệu / đồng bộ"| API
    SYNC -->|"API chấm công"| HR["HR / Payroll<br/>Hệ thống có sẵn"]
~~~

Đây là phương án minh họa, không phải bằng chứng có server/cloud hoặc local database được đề bắt buộc. Cần xác định giao thức thực tế, vị trí xác thực QR, nơi ra quyết định mở cổng, số node và policy offline. Nếu thay đổi cách bố trí, các sequence và module view phải cập nhật theo.

## 8. SOLID: phải giải thích gì và thể hiện ở đâu?

**[BẮT BUỘC ở M2]** Giải thích việc áp dụng SOLID trong thiết kế; code được chọn triển khai cũng tuân thủ SOLID; có reflection report. Không chỉ chép định nghĩa. Các ví dụ dưới đây là **[ĐỀ XUẤT]** cho một module chấm công. [Nguồn: M2, tr. 3](SA_CC_hk261_Assignment_M2.pdf#page=3).

| Nguyên tắc | Ý nghĩa áp dụng | Ví dụ thiết kế/code và cách kiểm chứng đề xuất |
|---|---|---|
| **S — Single Responsibility** | Mỗi phần có trách nhiệm và lý do thay đổi rõ ràng | Tách xác thực QR, xử lý chấm công, gọi cổng và xuất HR; thay đổi API cổng không buộc sửa logic tính giao dịch |
| **O — Open/Closed** | Có điểm mở rộng cho thay đổi dự kiến, hạn chế sửa luồng đã ổn định | Thêm loại QR verifier hoặc gate adapter bằng implementation mới qua interface; không rải điều kiện theo hãng thiết bị trong use case |
| **L — Liskov Substitution** | Implementation thay thế được nhau mà vẫn giữ đúng hợp đồng hành vi | Adapter thật và fake/mock cùng tuân thủ quy tắc thành công, lỗi, timeout và dữ liệu trả về; fake luôn trả thành công chưa chứng minh được tính thay thế |
| **I — Interface Segregation** | Client chỉ phụ thuộc vào khả năng thực sự cần | Tách interface ghi chấm công, đọc báo cáo và điều khiển cổng; module báo cáo không phải phụ thuộc lệnh mở cổng |
| **D — Dependency Inversion** | Logic nghiệp vụ phụ thuộc abstraction thay vì chi tiết hạ tầng | Use case nhận repository, QR verifier, clock và gateway qua interface; adapter database/turnstile triển khai các interface đó |

**Reflection report nên trả lời ngắn, dựa trên việc thật nhóm đã làm:**

1. Ban đầu phần nào ghép trách nhiệm hoặc phụ thuộc chặt? Có ví dụ trước/sau nếu đã refactor.
2. Áp dụng nguyên tắc nào, tại module/interface nào, giúp cải thiện điều gì?
3. Khó khăn và đánh đổi: thêm abstraction có làm code khó hiểu, nhiều lớp hoặc tốn công triển khai không?
4. Tác động đến tính mô-đun, bảo trì và mở rộng; minh họa bằng một thay đổi cụ thể như đổi API cổng hoặc thêm QR validator.

Đề chỉ yêu cầu reflection **ngắn**, không chỉ định số trang hoặc số từ. Không viết như nhóm đã thực hiện một lần refactor nếu thực tế chưa làm.

## 9. Phạm vi code M2 và kế hoạch kiểm chứng

### 9.1. Chọn ít nhất một module chính

**[BẮT BUỘC]** Có triển khai chức năng cốt lõi theo thiết kế trong ít nhất một module chính, tuân thủ SOLID. Các lựa chọn sau là gợi ý, không phải danh sách module do giảng viên ấn định.

| Module có thể chọn | Luồng nên chứng minh — **[ĐỀ XUẤT]** | Lưu ý phạm vi |
|---|---|---|
| Attendance / Access Processing | Nhận lượt quét → kiểm tra QR/quyền → xử lý giao dịch → gọi gate adapter → lưu/audit; có lỗi và retry phù hợp | Gắn trực tiếp nghiệp vụ chính và các vấn đề M2; cần phân biệt kết quả quét, kết quả mở cổng và bản ghi chấm công |
| User & QR Management | Quản lý định danh, cấp QR, kiểm tra hạn/trạng thái, thu hồi hoặc chống replay theo thiết kế đã chọn | Cần có luồng hoạt động thực sự; việc sinh một ảnh QR đơn thuần chưa minh họa đầy đủ rủi ro M2 |
| Reporting & HR Integration | Tổng hợp dữ liệu, báo cáo và gửi API HR; có trạng thái giao nhận, retry/đối soát | Không mở rộng sang tính lương; vẫn phải thiết kế giải pháp cho cả hai vấn đề M2 trong báo cáo |

**Hướng làm đề xuất:** Chọn Attendance / Access Processing nếu muốn liên kết rõ giữa nghiệp vụ, SOLID, mất mạng và QR. Có thể dùng adapter giả lập khi chưa có thiết bị/API thật, nhưng phải ghi rõ thành phần được giả lập và giới hạn của demo. Quy tắc chấp nhận mock cho bài nộp cần đối chiếu hướng dẫn môn học vì PDF không quy định.

README hướng dẫn chạy, cấu hình mẫu không chứa bí mật và dữ liệu demo là các tài liệu **nên có** để người chấm chạy được code; đề không yêu cầu đích danh từng file này. UI hoàn chỉnh, mobile app và triển khai production không được nêu là điều kiện bắt buộc.

### 9.2. Ma trận kiểm chứng đề xuất

Đây là **kế hoạch gợi ý**, không phải test suite hoặc tiêu chí chấm điểm được đề ấn định. Phạm vi kiểm chứng thực tế cần phù hợp module đã code; các phần chưa triển khai vẫn cần phân tích ở mức thiết kế và nêu giới hạn bằng chứng.

| Yêu cầu/vấn đề gốc | Kịch bản nên kiểm tra | Kết quả cần quan sát |
|---|---|---|
| FR-03, BR-02 | Nhân viên hợp lệ thực hiện một lượt vào và một lượt ra | Giao dịch gắn đúng người, hướng và điểm cổng theo mô hình đã chốt; kết quả điều khiển cổng có thể truy vết |
| M2-03: QR bị lộ | QR sai chữ ký/nội dung, hết hạn, đã dùng hoặc thuộc tài khoản bị khóa theo policy đã chọn | Từ chối và lưu dấu vết phù hợp; không ghi nhận thành công hoặc mở cổng do token không hợp lệ |
| M2-02: mất kết nối | Mất mạng trước khi gửi hoặc trong lúc gửi sự kiện | Trạng thái rõ ràng, sự kiện được lưu chờ theo thiết kế; phục hồi và đối soát được |
| M2-02: mất ACK | Server đã lưu nhưng client không nhận phản hồi rồi gửi lại cùng event ID | Không phát sinh giao dịch dữ liệu trùng từ cùng sự kiện; kiểm tra riêng tác động điều khiển cổng |
| M2-02/M2-03 giao nhau | Offline với QR hết hạn, quyền bị thu hồi hoặc token bị dùng ở cổng khác | Hành vi phù hợp policy đã công bố; chỉ rõ trường hợp không thể kiểm tra trực tuyến |
| INT-02 | Turnstile API lỗi hoặc timeout | Không khẳng định cổng đã mở khi chưa đủ bằng chứng; trạng thái lỗi/không xác định được quản lý |
| NFR-01 | Khoảng 800 giao dịch/30 phút/nhà máy, có đợt dồn phù hợp giả định | Báo cáo thời gian phản hồi kiosk so với **≤ 2 giây**, ranh giới đo, môi trường và các lỗi; tải trung bình không chứng minh tải đỉnh |
| NFR-02 | Đối chiếu số sự kiện hợp lệ đã tiếp nhận và dữ liệu đã lưu trong vận hành bình thường | Không mất bản ghi trong phạm vi đã kiểm chứng; phân biệt với các thử nghiệm sự cố M2 |
| NFR-03: RBAC | Actor gọi chức năng được phép và không được phép | Thao tác trái quyền bị từ chối; không chỉ ẩn nút giao diện |
| NFR-03: Audit | Kiểm tra các thao tác quan trọng theo danh sách audit đã chọn | Truy được chủ thể, thao tác, thời điểm và kết quả; bảo vệ dữ liệu nhạy cảm trong log |
| NFR-04 | Kiểm tra quyền xem dữ liệu nhân viên, payload QR và log | Dữ liệu chỉ được truy cập/hiển thị theo thiết kế bảo vệ dữ liệu đã công bố; không xem đây là bằng chứng tuân thủ pháp lý đầy đủ |
| INT-01, BR-04 | Gửi dữ liệu sang HR, kể cả trường hợp API lỗi rồi phục hồi | Dữ liệu đúng, trạng thái giao nhận/đối soát rõ ràng và kế hoạch đáp ứng mốc trước 12:00 trưa ngày 1; demo đơn lẻ không tự chứng minh SLA hằng tháng |

Không có số % coverage bắt buộc trong hai PDF. Kiểm thử với mock không đủ để kết luận tích hợp thiết bị thật hoặc đạt thời gian phản hồi kiosk ngoài thực tế; cần nêu môi trường và giới hạn kết luận.

## 10. Lộ trình thực hiện và checklist bàn giao

### 10.1. Thứ tự làm đề xuất

| Bước | Việc cần hoàn thành | Đầu ra chính |
|---|---|---|
| 1 | Trích yêu cầu, xác định actors, ranh giới và điểm chưa rõ | Bảng FR/NFR, constraints, giả định và use cases |
| 2 | Xác định characteristics và kịch bản chất lượng | Tiêu chí đo hiệu năng, dữ liệu, bảo mật; mức bổ sung tự đề xuất được đánh dấu |
| 3 | So sánh style, chọn phương án và giải thích đánh đổi | Bảng so sánh, quyết định kiến trúc và nguyên tắc |
| 4 | Thiết kế logical và physical theo từng bước | Sơ đồ, trách nhiệm, interface, tích hợp hai hệ thống có sẵn; đóng gói báo cáo M1 |
| 5 | Cập nhật M2 theo hai rủi ro mới; hoàn thiện ba views | Luồng mất kết nối, bảo vệ QR, policy offline và thiết kế nhất quán |
| 6 | Chọn module chính, triển khai theo SOLID | Code có thể chạy, adapter và dữ liệu cần thiết trong phạm vi module |
| 7 | Kiểm thử, lưu bằng chứng và viết reflection thật | Kết quả chạy, giới hạn kiểm chứng, nhận xét về SOLID |
| 8 | Đối chiếu báo cáo–sơ đồ–code, hoàn tất GitHub và nộp LMS | Bài nộp có thể đọc, truy cập và kiểm tra được |

### 10.2. Checklist M1 — yêu cầu trực tiếp từ đề

- [ ] M1-01: Mô tả kỹ bối cảnh, mục tiêu, scope, chức năng và phi chức năng.
- [ ] M1-02: Architecture Characteristics xác định tiêu chí thành công.
- [ ] M1-03: So sánh và chọn architecture styles có lý do.
- [ ] M1-04: Trình bày từng bước kiến trúc logical và physical.
- [ ] M1-05: Architecture Decisions nêu các quy tắc xây dựng.
- [ ] M1-06: Design Principles hướng dẫn thiết kế.
- [ ] Thể hiện định hướng SOLID và tài liệu nhiều góc nhìn từ mục tiêu chung.
- [ ] M1-07: Nộp báo cáo chi tiết lên LMS.

### 10.3. Checklist M2 — yêu cầu trực tiếp từ đề

- [ ] M2-01: Báo cáo thiết kế cuối cùng đầy đủ các nội dung kiến trúc đã liệt kê.
- [ ] M2-02: Đề xuất xử lý mất kết nối, giải thích tác dụng và vị trí tích hợp vào kiến trúc.
- [ ] M2-03: Đề xuất xử lý QR tĩnh bị lộ/gian lận, giải thích tác dụng và vị trí tích hợp.
- [ ] M2-04: Có module views.
- [ ] M2-05: Có component-and-connector views.
- [ ] M2-06: Có allocation views.
- [ ] M2-07: Giải thích cách áp dụng SOLID trong thiết kế.
- [ ] M2-08: Có reflection ngắn về lợi ích, khó khăn và tác động của SOLID.
- [ ] M2-09: Triển khai ít nhất một module chính, chức năng theo thiết kế và code tuân thủ SOLID.
- [ ] M2-10: Nộp báo cáo chi tiết chứa URL GitHub source code lên LMS.

**Đối chiếu thêm với mục tiêu M2:** Có hoạt động kiểm thử và bằng chứng phù hợp phần đã triển khai; không gán thêm framework, số lượng test hoặc coverage mà đề chưa yêu cầu.

### 10.4. Khung báo cáo gợi ý — không phải mẫu bắt buộc

| Phần | M1 | M2 |
|---|---|---|
| Bối cảnh, mục tiêu, actors, phạm vi, giả định | Trình bày đầy đủ | Cập nhật theo thiết kế cuối |
| FR/NFR, ràng buộc và Architecture Characteristics | Trình bày đầy đủ | Kế thừa, cập nhật các vấn đề mới |
| So sánh styles, lựa chọn và đánh đổi | Có | Cập nhật nếu đổi kiến trúc |
| Các bước thiết kế logical và physical | Có | Hoàn thiện, đồng bộ với code |
| Các góc nhìn kiến trúc | Theo định hướng nhiều góc nhìn của mục tiêu | Phải có module, component-and-connector và allocation |
| Architecture Decisions và Design Principles | Có | Bổ sung quyết định mất mạng, bảo vệ QR |
| Phân tích hai vấn đề M2 | Chưa được M1 nêu thành yêu cầu riêng | Có giải pháp và cách tích hợp |
| Áp dụng SOLID và reflection | Có thể định hướng SOLID trong thiết kế; chưa yêu cầu reflection riêng | Giải thích SOLID và reflection bắt buộc |
| Module triển khai, cách chạy và kiểm thử | Không có Task code riêng | Trình bày module đã code, bằng chứng và giới hạn kiểm thử |
| GitHub URL | M1 không ghi yêu cầu này | Phải có trong báo cáo |

## 11. Những điểm đề chưa chốt — tránh tự biến giả định thành requirement

| Chủ đề | Cần xác nhận hoặc ghi thành giả định thiết kế |
|---|---|
| Tổ chức bài nộp | Deadline, quy mô nhóm, thang điểm, mẫu báo cáo, tên file, định dạng file và lịch demo: hai PDF không nêu; kiểm tra LMS/hướng dẫn môn học |
| Tiêu chí chọn module code | Đề chỉ nói ít nhất một module chính; mức hoàn thiện, mức chấp nhận mock và môi trường demo chưa được ấn định |
| Công nghệ | Không chỉ định ngôn ngữ, framework, database, cloud, message broker hoặc style bắt buộc |
| Thiết bị và mạng | Chưa có số cổng/kiosk, cấu hình phần cứng, topology hay đặc tả API turnstile |
| Đo hiệu năng | Chưa rõ biên đo kiosk ≤ 2 giây, phân bố tải đỉnh, percentile hoặc tỷ lệ lỗi chấp nhận |
| Sự kiện chấm công | Thời điểm nào được tính “đã vào/ra”, có cảm biến xác nhận qua cổng không, xử lý quét trùng/thiếu lượt ra sao |
| Chính sách offline | Mất kết nối ở đâu, tối đa bao lâu, có cho qua cổng không, dữ liệu quyền nào còn được tin cậy |
| QR và danh tính | Cách cấp QR ban đầu, TTL, replay policy, thu hồi, bảo vệ khóa và cách giảm chia sẻ mã trực tiếp |
| Nghiệp vụ nhân sự | Ca đêm, đi muộn, tăng ca, ngày nghỉ, quên check-out, sửa công và phê duyệt chưa được mô tả |
| Tích hợp HR/Payroll | Contract API, xác nhận nhận dữ liệu, kỳ chấm công, mốc chốt và múi giờ nghiệp vụ, xử lý sửa dữ liệu sau đối soát |
| RBAC và dữ liệu cá nhân | Quyền chi tiết theo vai trò/nhà máy; dữ liệu cần thu thập, thời hạn lưu, phạm vi audit và quy định áp dụng |

Đề cho phép sinh viên đề xuất yêu cầu bổ sung. Mỗi bổ sung nên ghi **lý do, giả định, tác động scope và cách đánh giá**, tách khỏi yêu cầu gốc. Không đưa visitor management hoặc tính lương trở lại phạm vi bắt buộc khi đề đã loại trừ.

## 12. Bản đồ tra cứu tài liệu gốc

| Vị trí | Nội dung cần đối chiếu |
|---|---|
| [M1, trang 1](SA_CC_hk261_Assignment_M1.pdf#page=1) | Objective, hai milestones, bối cảnh nhà máy, QR/cổng, HR/Payroll, actors và smartphone |
| [M1, trang 2](SA_CC_hk261_Assignment_M1.pdf#page=2) | Out of scope, 5 nhóm FR, 4 nhóm NFR, Task 1 phần bối cảnh/characteristics/structure/decisions |
| [M1, trang 3](SA_CC_hk261_Assignment_M1.pdf#page=3) | Design Principles và yêu cầu nộp báo cáo chi tiết trên LMS |
| [M2, trang 1](SA_CC_hk261_Assignment_M2.pdf#page=1) | Objective, milestones và Context kế thừa M1 |
| [M2, trang 2](SA_CC_hk261_Assignment_M2.pdf#page=2) | Out of scope, FR/NFR và hai Issues Encountered; yêu cầu đề xuất và tích hợp cải tiến kiến trúc |
| [M2, trang 3](SA_CC_hk261_Assignment_M2.pdf#page=3) | Task 1 đầy đủ, ba views, áp dụng SOLID, reflection, Task 2 code ít nhất một module chính và nộp báo cáo có GitHub URL |
