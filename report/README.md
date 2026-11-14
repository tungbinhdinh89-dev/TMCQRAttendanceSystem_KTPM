# Bản LaTeX của Report.pdf

Report.pdf là tài liệu đầu vào, được giữ nguyên. main.tex nhập đủ 37 file
pages/page-01.tex đến pages/page-37.tex theo đúng thứ tự trang bản gốc.

Chữ là mã UTF-8 có thể chỉnh sửa; đường kẻ bảng và sơ đồ là các lệnh TikZ.
Chỉ logo được trích xuất thành ảnh trong figures/original/.
PDF đầu vào không được nhúng vào PDF kết quả.

Bản chuyển đổi dùng tọa độ cố định để giữ bố cục từng trang. Khi sửa dài hơn
nội dung ban đầu, cần tự điều chỉnh vị trí/ngắt dòng trong file trang tương ứng.
Bảng được dựng từ chữ và đường kẻ TikZ, không phải môi trường tabular tự dàn trang.
Font CM Unicode thay thế bộ font VnTeX Computer Modern của PDF nguồn.
Khoảng trắng không được mã hóa trong PDF được khôi phục theo khoảng cách chữ.

## Biên dịch

Cần TeX Live 2026, LuaLaTeX và latexmk. Từ thư mục gốc repository:

    powershell -NoProfile -ExecutionPolicy Bypass -File report/build.ps1

Kết quả: dist/main.pdf. Log đầy đủ từng lần chạy: logs/main/.
Script đặt cache LuaLaTeX trong .tools/tex-cache/.

scripts/convert_report.py lưu quy trình chuyển đổi; scripts/verify_report.py
kiểm tra văn bản và xuất ảnh đối chiếu toàn bộ trang. Cần PyMuPDF và Pillow
(có bản cục bộ trong .tools/). Chạy từ gốc repo với PYTHONPATH=report/.tools.
Không chạy lại script chuyển đổi sau khi tự sửa trang: nó tái tạo các file trang.

Template cũ được sao lưu trong .tools/template-backup/; các file cover.tex,
metadata.tex, preamble.tex, sections/ cũ vẫn giữ nguyên và không được main.tex dùng.
