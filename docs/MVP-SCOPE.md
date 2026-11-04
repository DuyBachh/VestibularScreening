# Phạm vi đồ án VestibularScreening

Nguồn: toàn bộ tài liệu `đề thi cuối kì (2).docx`, gồm FR-01–FR-42 và phần Clinical Protocol & Software Specification. Ngày đối chiếu: 04/11/2026.

Đây là nguyên mẫu học tập bằng JavaScript và Expo SDK 57, chạy hướng tới Expo Go trên iPhone. Đề xuất Swift, Core Data và PDFKit trong tài liệu là bối cảnh sản phẩm gốc, không thay thế yêu cầu React Native của đồ án. Không có bằng chứng kiểm chứng lâm sàng. Protocol chi tiết và ngưỡng diễn giải chưa được cung cấp.

## Cách đọc bảng

- **Thật**: có thể xây dựng chức năng tương ứng trong Expo Go, có điều kiện ghi trong bảng; không có nghĩa đã triển khai.
- **Mô phỏng**: chỉ minh họa UI, stimulus hoặc dữ liệu mẫu, luôn ghi “Dữ liệu mô phỏng – Demo”; không đưa kết luận bệnh lý.
- **Nghiên cứu/native**: yêu cầu đầy đủ cần development build, native iOS, backend bảo mật hoặc nghiên cứu và validation. Những phần khả thi được tách riêng.

Tất cả FR bên dưới đang ở trạng thái **chưa triển khai đầy đủ** trong Giai đoạn 1. Màn hình khung không tính là hoàn thành chức năng.

| FR | Chức năng gốc | Phân loại | Phạm vi và điều kiện |
| --- | --- | --- | --- |
| 01 | Đăng ký và xác nhận email | Thật | Supabase Auth; cần cấu hình dịch vụ và kiểm thử email thật. |
| 02 | Đăng nhập, đăng xuất, sinh trắc học | Nghiên cứu/native | Email và logout làm thật; Face ID trên iPhone cần development build, tách khỏi demo Expo Go. |
| 03 | Quên mật khẩu | Thật | Supabase gửi email; redirect/reset phải kiểm thử riêng trong Expo Go, không tuyên bố chỉ gửi email là xong. |
| 04 | Hồ sơ clinician và logo | Thật | Cập nhật thông tin và chọn logo; bảo vệ dữ liệu theo tài khoản. |
| 05 | Admin và Clinician | Thật | Cần backend/RLS thực thi quyền, không chỉ ẩn nút trên UI; ngoài MVP đầu. |
| 06 | Timeout 15 phút | Thật | Đếm thời gian không hoạt động, kiểm tra khi app trở lại foreground và hủy session. |
| 07 | Tạo bệnh nhân | Thật | SQLite, tên, ngày sinh, giới tính, mã và ghi chú; chỉ dữ liệu giả lập. |
| 08 | Tìm theo tên hoặc mã | Thật | Truy vấn SQLite có tham số, tìm khi nhập. |
| 09 | Lịch sử theo bệnh nhân | Thật | Liên kết phiên và bệnh nhân, sắp ngày giảm dần. |
| 10 | Chỉnh sửa hồ sơ | Thật | Kiểm tra đầu vào và cập nhật SQLite. |
| 11 | Xóa mềm, khôi phục 30 ngày | Thật | MVP xóa có xác nhận; yêu cầu đầy đủ cần deleted_at, khôi phục và dọn khi mở app, không đảm bảo tác vụ nền đúng ngày. |
| 12 | Anonymous mode | Thật | Test không gắn hồ sơ; tách khỏi dữ liệu bệnh nhân. |
| 13 | Chọn bài hoặc full battery | Thật | MVP chọn riêng hai bài đầu; sáu bài liên tiếp triển khai sau. |
| 14 | Hướng dẫn trước bài | Thật | Nội dung Việt, hình minh họa, đếm ngược; khung văn bản hiện có chưa đủ FR. |
| 15 | Hiệu chỉnh đồng tử 5–9 điểm | Nghiên cứu/native | Có thể mô phỏng điểm hiệu chỉnh, chưa có ánh xạ đồng tử thật. |
| 16 | Stimulus theo protocol chuẩn | Mô phỏng | Chuyển động UI thật, thông số phục vụ học tập; chưa có protocol được duyệt để gọi là chuẩn lâm sàng. |
| 17 | Video 240fps và đồng bộ | Nghiên cứu/native | Chỉ thử preview/ghi video thông thường bằng expo-camera; timestamp bắt đầu/kết thúc không tương đương đồng bộ frame. |
| 18 | Apple Vision pupil tracking | Nghiên cứu/native | Không có Apple Vision custom module trong Expo Go; cần thuật toán và validation. |
| 19 | Pause và hủy | Thật | Dừng stimulus/timer, điều phối camera riêng; không ngụ ý có pause video native. |
| 20 | Lặp lại theo chất lượng | Mô phỏng | Làm thật nút lặp lại; chưa có quality score để quyết định tự động. |
| 21 | Chất lượng tracking trực tiếp | Nghiên cứu/native | Không tạo đèn xanh hoặc điểm chất lượng giả; UI minh họa phải có nhãn demo. |
| 22 | NPC break/recovery/distance | Nghiên cứu/native | Để tương lai; cần theo dõi, mô hình khoảng cách và kiểm chứng. |
| 23 | Tính metrics mắt | Nghiên cứu/native | Gain, latency, SPV, velocity… cần trace mắt và thuật toán đã xác minh; chỉ biểu đồ mẫu có nhãn nếu cần. |
| 24 | So sánh normative data | Nghiên cứu/native | Chưa có bộ dữ liệu tham chiếu/ngưỡng được kiểm chứng; không phân loại bình thường hoặc bất thường. |
| 25 | Báo cáo sau bài | Mô phỏng | Lưu thật tên bài, bệnh nhân, thời gian, trạng thái, ghi chú; không có trace mắt hay interpretation thật. |
| 26 | PDF | Thật | expo-print và expo-sharing; ghi rõ dữ liệu thực tế có sẵn, không bịa chỉ số. |
| 27 | So sánh nhiều lần | Mô phỏng | Có thể so sánh metadata thật; graph chỉ số mắt cần dữ liệu thật hoặc nhãn demo rõ. |
| 28 | Ghi chú phiên | Thật | Lưu ghi chú với phiên trước khi hoàn tất. |
| 29 | Chia sẻ báo cáo | Thật | Share sheet iOS; đích email/AirDrop/Files tùy thiết bị. |
| 30 | Slow motion và overlay đồng tử | Nghiên cứu/native | Playback thường có thể làm; overlay và slow-motion chính xác phụ thuộc video/tracking thực. |
| 31 | Offline và lưu mã hóa | Nghiên cứu/native | SQLite thường làm được offline, chưa mã hóa; không hoàn thành phần mã hóa của FR. |
| 32 | Cloud backup tùy chọn | Thật | Backend và consent, mặc định tắt; không cần cho MVP. iCloud riêng cần nghiên cứu native. |
| 33 | AES-256 và video riêng tư | Nghiên cứu/native | SQLCipher cần custom build; SecureStore cho token không mã hóa toàn bộ SQLite. Không lưu Camera Roll làm được riêng. |
| 34 | Xóa local khi logout | Thật | Tùy chọn có xác nhận, xóa đúng dữ liệu theo tài khoản và file tạm. |
| 35 | Audit log | Thật | Log thao tác học tập khả thi; log local không đủ chứng minh tuân thủ hoặc chống sửa đổi. |
| 36 | Xóa video raw | Thật | File tạm, cleanup sau sử dụng và dọn file tồn sau crash; chưa có xử lý metrics. |
| 37 | Việt/Anh | Thật | Tách dictionary và lưu tùy chọn; hiện mới tiếng Việt. |
| 38 | Normative population | Mô phỏng | Có thể minh họa bộ chọn, không áp ngưỡng chưa được cung cấp/kiểm chứng. |
| 39 | Tutorial | Thật | Hướng dẫn lần đầu, cách dùng và giới hạn; không đưa thông số khám chưa kiểm chứng. |
| 40 | Demo không lưu dữ liệu | Thật | Fixture riêng trong bộ nhớ, không ghi SQLite hoặc thông tin thật. Khung hiện tại chưa là Demo Mode. |
| 41 | Feedback và bug report | Thật | Form hoặc email khi đã có địa chỉ đích; không gửi tự động. |
| 42 | Core offline | Thật | Stimulus, SQLite và PDF local; đăng ký/reset cần mạng, tracking lâm sàng chưa có. |

## Các mốc triển khai

1. Nền tảng: SDK 57 giữ nguyên, Router, theme, bốn tab, auth stack và chi tiết, lint, kiểm tra kiểu JS, bundle iOS.
2. Supabase Auth: login/register/verification/reset/profile và quản lý session. Chỉ dùng publishable/anon key; không dùng service role.
3. SQLite: CRUD, tìm kiếm, lưu bền và lịch sử theo bệnh nhân. Thiết kế dữ liệu theo chủ sở hữu trước khi đưa nhiều tài khoản lên cùng thiết bị.
4. Hai stimulus: countdown 3 giây, Smooth Pursuit liên tục, Horizontal Saccades nhảy tức thời với thời gian chờ thay đổi; pause/resume/cancel/repeat. Camera độc lập, kiểm thử trên máy thật.
5. Lưu metadata phiên, ghi chú, lịch sử và PDF. Dữ liệu minh họa luôn gắn nhãn. Không có kết luận bệnh lý.
6. Demo không lưu, hướng dẫn, settings, kiểm thử iPhone, README và GitHub.

## Điều kiện nghiệm thu

Lint/typecheck/bundle chỉ xác minh mã và đóng gói; không thay thế chạy iPhone. Cần ghi lại kết quả mở Expo Go, điều hướng, auth thật, lưu bền SQLite sau mở lại, thời gian/animation, quyền camera bị từ chối, ghi/xóa video và chia sẻ PDF. Không đánh dấu PASS nếu chưa có bằng chứng. Không cam kết iOS 16/iPhone 12 của tài liệu gốc được SDK 57 hỗ trợ nếu chưa đối chiếu môi trường chạy thực tế.

Tài liệu gốc có hai mô tả trái nhau: xóa video raw sau xử lý và lưu raw eye movement data. Đồ án ưu tiên xóa video tạm, chỉ lưu metadata/kết quả thực tế; không lưu face data. Không triển khai hay tuyên bố HIPAA/GDPR, AES-256, 240fps hoặc độ chính xác lâm sàng trong MVP Expo Go.
