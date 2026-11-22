# Phạm vi đồ án VestibularScreening

Nguồn: toàn bộ tài liệu `đề thi cuối kì (2).docx`, gồm FR-01–FR-42 và phần Clinical Protocol & Software Specification. Ngày đối chiếu: 04/11/2026.

Đây là nguyên mẫu học tập bằng JavaScript và Expo SDK 58, chạy hướng tới Expo Go trên iPhone. SDK được nâng từ 57 lên 58 theo đồng ý của người dùng ngày 04/11/2026 vì Expo Go trên iPhone đã dùng SDK 58. Đề xuất Swift, Core Data và PDFKit trong tài liệu là bối cảnh sản phẩm gốc, không thay thế yêu cầu React Native của đồ án. Không có bằng chứng kiểm chứng lâm sàng. Protocol chi tiết và ngưỡng diễn giải chưa được cung cấp.

## Cách đọc bảng

- **Thật**: có thể xây dựng chức năng tương ứng trong Expo Go, có điều kiện ghi trong bảng; không có nghĩa đã triển khai.
- **Mô phỏng**: chỉ minh họa UI, stimulus hoặc dữ liệu mẫu, luôn ghi “Dữ liệu mô phỏng – Demo”; không đưa kết luận bệnh lý.
- **Nghiên cứu/native**: yêu cầu đầy đủ cần development build, native iOS, backend bảo mật hoặc nghiên cứu và validation. Những phần khả thi được tách riêng.

Các FR bên dưới là phân loại tính khả thi, không phải chứng nhận hoàn thành toàn bộ 42 yêu cầu. Đến 22/11/2026 đã có Auth, quản lý hồ sơ/Thùng rác, 6 bài stimulus mô phỏng và chuỗi, camera thường, metadata/ghi chú/lịch sử/so sánh, PDF/logo, Việt–Anh, Demo/Hướng dẫn/Góp ý và nhật ký cục bộ. Người dùng đã nghiệm thu nhiều checklist riêng trên iPhone, gần nhất là Nhật ký hoạt động. Các mốc lịch sử ở dưới giữ nguyên bối cảnh tại ngày triển khai; trạng thái hiện tại và giới hạn tổng hợp ở README. Kiểm thử xuyên suốt bản bàn giao vẫn cần thực hiện riêng; phần tracking/metrics/chẩn đoán không được coi là hoàn thành.

| FR | Chức năng gốc | Phân loại | Phạm vi và điều kiện |
| --- | --- | --- | --- |
| 01 | Đăng ký và xác nhận email | Thật | Supabase Auth; cần cấu hình dịch vụ và kiểm thử email thật. |
| 02 | Đăng nhập, đăng xuất, sinh trắc học | Nghiên cứu/native | Email và logout làm thật; Face ID trên iPhone cần development build, tách khỏi demo Expo Go. |
| 03 | Quên mật khẩu | Thật | Supabase gửi email; redirect/reset phải kiểm thử riêng trong Expo Go, không tuyên bố chỉ gửi email là xong. |
| 04 | Hồ sơ clinician và logo | Thật | Tên/chuyên khoa/cơ sở lưu Supabase Auth; chọn/đổi/gỡ logo SQLite riêng theo tài khoản trên thiết bị, chưa đồng bộ logo. PDF dùng logo và thông tin đã lưu hiện tại. Người dùng xác nhận checklist 1–7 PASS trên iPhone. |
| 05 | Admin và Clinician | Thật | Cần backend/RLS thực thi quyền, không chỉ ẩn nút trên UI; ngoài MVP đầu. |
| 06 | Timeout 15 phút | Thật | Đếm thời gian không hoạt động, kiểm tra khi app trở lại foreground và hủy session. |
| 07 | Tạo bệnh nhân | Thật | Đã triển khai SQLite, tên, ngày sinh, giới tính chỉ gồm Nam/Nữ, mã tự tạo hoặc nhập, ghi chú; bắt buộc chọn giới tính và chỉ dùng dữ liệu giả lập. Cần kiểm thử lưu bền trên iPhone. |
| 08 | Tìm theo tên hoặc mã | Thật | Đã triển khai truy vấn SQLite tham số hóa, bỏ dấu tiếng Việt và tìm khi nhập; giới hạn 200 hồ sơ mỗi lần tải. |
| 09 | Lịch sử theo bệnh nhân | Thật | Liên kết phiên và bệnh nhân, sắp ngày giảm dần. |
| 10 | Chỉnh sửa hồ sơ | Thật | Đã triển khai kiểm tra đầu vào và cập nhật SQLite, lọc theo chủ sở hữu. |
| 11 | Xóa mềm, khôi phục 30 ngày | Thật | Đã có deleted_at, thùng rác, khôi phục hồ sơ kèm phiên trong 30 ngày, xóa vĩnh viễn có xác nhận. Dọn hết hạn theo tài khoản khi mở/foreground hoặc truy cập quản lý hồ sơ; không có lịch chạy nền đúng ngày. Cần nghiệm thu trên iPhone. |
| 12 | Anonymous mode | Thật | Test không gắn hồ sơ; tách khỏi dữ liệu bệnh nhân. |
| 13 | Chọn bài hoặc full battery | Thật | Có 6 bài mô phỏng chạy riêng hoặc theo chuỗi: thiết lập hồ sơ/camera một lần, màn nghỉ giữa bài, lưu từng lượt riêng và tổng hợp trong bộ nhớ. Người dùng đã báo chuỗi PASS 1–7; không có protocol/metrics lâm sàng hoặc khôi phục chuỗi sau đóng app. |
| 14 | Hướng dẫn trước bài | Thật | Hai bài hỗ trợ có hướng dẫn riêng, sơ đồ trái/giữa/phải, xem chuyển động mẫu 8 giây tự dừng, ba bước chuẩn bị và lưu ý tạm dừng. Tôn trọng Giảm chuyển động; mẫu không quay/lưu phiên. Vẫn giữ đếm ngược 3 giây khi chạy. Người dùng xác nhận checklist 1–7 PASS trên iPhone. |
| 15 | Hiệu chỉnh đồng tử 5–9 điểm | Nghiên cứu/native | Có thể mô phỏng điểm hiệu chỉnh, chưa có ánh xạ đồng tử thật. |
| 16 | Stimulus theo protocol chuẩn | Mô phỏng | Chuyển động UI thật, thông số phục vụ học tập; chưa có protocol được duyệt để gọi là chuẩn lâm sàng. |
| 17 | Video 240fps và đồng bộ | Nghiên cứu/native | Chỉ thử preview/ghi video thông thường bằng expo-camera; timestamp bắt đầu/kết thúc không tương đương đồng bộ frame. |
| 18 | Apple Vision pupil tracking | Nghiên cứu/native | Không có Apple Vision custom module trong Expo Go; cần thuật toán và validation. |
| 19 | Pause và hủy | Thật | Dừng stimulus/timer, điều phối camera riêng; không ngụ ý có pause video native. |
| 20 | Lặp lại theo chất lượng | Mô phỏng | Làm thật nút lặp lại; chưa có quality score để quyết định tự động. |
| 21 | Chất lượng tracking trực tiếp | Nghiên cứu/native | Không tạo đèn xanh hoặc điểm chất lượng giả; UI minh họa phải có nhãn demo. |
| 22 | NPC break/recovery/distance | Nghiên cứu/native | Để tương lai; cần theo dõi, mô hình khoảng cách và kiểm chứng. |
| 23 | Tính metrics mắt | Nghiên cứu/native | Đã bổ sung bộ phân tích CSV góc có hiệu chỉnh bên ngoài: RMS/gain vận tốc, latency/peak/displacement gain saccade. Chưa lấy trace từ camera, chưa SPV/NPC/OKN asymmetry hoặc xác minh lâm sàng. |
| 24 | So sánh normative data | Nghiên cứu/native | Chưa có bộ dữ liệu tham chiếu/ngưỡng được kiểm chứng; không phân loại bình thường hoặc bất thường. |
| 25 | Báo cáo sau bài | Mô phỏng | Phiên lưu tên bài, bệnh nhân, thời gian, trạng thái, ghi chú; chưa trace camera. Màn phân tích riêng có đồ thị và chỉ số từ CSV, không tự gắn vào phiên bệnh nhân hay diễn giải bệnh lý. |
| 26 | PDF | Thật | expo-print và expo-sharing; PDF phiên giữ metadata/logo/ghi chú, PDF phân tích riêng có đồ thị/chỉ số tính từ CSV và nhãn nguồn. Chưa PDF đo mắt tự động sau bài camera. |
| 27 | So sánh nhiều lần | Mô phỏng | Đã so sánh metadata của 2 phiên cùng bệnh nhân/cùng bài: thời điểm, trạng thái, thời gian thực hiện, camera, ghi chú. Không so sánh phiên không gắn hồ sơ hoặc kết luận tiến triển lâm sàng. Chưa nghiệm thu trên iPhone. |
| 28 | Ghi chú phiên | Thật | Lưu ghi chú với phiên trước khi hoàn tất. |
| 29 | Chia sẻ báo cáo | Thật | Share sheet iOS; đích email/AirDrop/Files tùy thiết bị. |
| 30 | Slow motion và overlay đồng tử | Nghiên cứu/native | Playback thường có thể làm; overlay và slow-motion chính xác phụ thuộc video/tracking thực. |
| 31 | Offline và lưu mã hóa | Nghiên cứu/native | Hồ sơ SQLite hoạt động cục bộ/offline; chưa mã hóa nên không hoàn thành phần mã hóa của FR. Không lưu dữ liệu bệnh nhân thật. |
| 32 | Cloud backup tùy chọn | Thật | Backend và consent, mặc định tắt; không cần cho MVP. iCloud riêng cần nghiên cứu native. |
| 33 | AES-256 và video riêng tư | Nghiên cứu/native | SQLCipher cần custom build; SecureStore cho token không mã hóa toàn bộ SQLite. Không lưu Camera Roll làm được riêng. |
| 34 | Xóa local khi logout | Thật | Đã có lựa chọn riêng trong Cài đặt, hiển thị số lượng và xác nhận trước khi xóa hồ sơ/thùng rác/phiên/ghi chú/logo theo owner trong transaction rồi đăng xuất. Đăng xuất thường giữ dữ liệu. Không xóa tài khoản Supabase hoặc PDF đã xuất; không tuyên bố xóa byte an toàn hay dọn toàn bộ file cache không có owner. Người dùng báo PASS, chưa nêu riêng từng mục kiểm thử. |
| 35 | Audit log | Thật | Đã có Nhật ký hoạt động cục bộ theo tài khoản, filter/paging, thao tác hồ sơ/phiên và các mốc PDF có ngữ nghĩa rõ. Chỉ metadata tối thiểu, không nội dung bệnh nhân; người dùng đã báo PASS 1–7 trên iPhone. Không chống sửa đổi hoặc chứng minh tuân thủ. |
| 36 | Xóa video raw | Thật | File tạm, cleanup sau sử dụng và dọn file tồn sau crash; chưa có xử lý metrics. |
| 37 | Việt/Anh | Thật | Đã có lựa chọn Tiếng Việt/English trong Cài đặt, dictionary offline và tùy chọn riêng trên thiết bị; giao diện/hướng dẫn/thông báo/PDF theo lựa chọn. Giữ nguyên dữ liệu tự nhập, tên chuyên môn và enum giới tính Nam/Nữ. Cần nghiệm thu bố cục native. |
| 38 | Normative population | Mô phỏng | Có thể minh họa bộ chọn, không áp ngưỡng chưa được cung cấp/kiểm chứng. |
| 39 | Tutorial | Thật | Hướng dẫn lần đầu, cách dùng và giới hạn; không đưa thông số khám chưa kiểm chứng. |
| 40 | Demo không lưu dữ liệu | Thật | Fixture riêng trong bộ nhớ, chọn hồ sơ/bài, ghi chú và tối đa 10 lượt; không camera/SQLite/PDF hoặc dữ liệu tài khoản. Người dùng đã báo các mốc Demo PASS; không có khôi phục danh sách sau thoát. |
| 41 | Feedback và bug report | Thật | Đã có form Báo lỗi/Góp ý, validation, xem lại và sao chép/chia sẻ văn bản thủ công bằng share sheet. Tùy chọn phiên bản/OS chỉ whitelist thông tin công khai; không tự đính kèm dữ liệu tài khoản. Chưa có inbox/email nhận cố định hoặc backend gửi/nhận. Bản soạn chỉ trong bộ nhớ; cần nghiệm thu iPhone. |
| 42 | Core offline | Thật | Stimulus, SQLite và PDF local; đăng ký/reset cần mạng, tracking lâm sàng chưa có. |

## Các mốc triển khai

Lưu tạm và khôi phục (22/11/2026): người dùng duyệt chức năng giữ metadata/ghi chú chưa lưu khi đóng app, không tự tiếp tục bài/camera. Schema v7 thêm pending_runs theo owner/patient, checkpoint khoảng mỗi giây và ghi chú khi nhập, writer tuần tự/gộp bản cập nhật với revision. Màn /drafts đọc lại dữ liệu, sửa ghi chú, lưu completed/cancelled vào lịch sử và dọn nháp nguyên tử; active hiển thị Gián đoạn và chỉ chuẩn bị bài mới sau xác nhận xóa. Trang chủ báo có nháp, Cài đặt/Hướng dẫn có lối vào. Giữ bản nháp khi rời kết quả; bỏ lượt/xóa nháp có xác nhận. Xóa local dọn nháp, logout thường giữ, trash ẩn/khôi phục và hard delete cascade theo hồ sơ. Không khôi phục chuỗi/Demo/video hoặc bảo đảm ký tự chưa ghi xong. Checklist thiết bị ở DRAFT-RECOVERY.md.

Đối chiếu lại `đề thi cuối kì (1).docx` (22/11/2026): xem [bảng trạng thái 42 FR và kiểm thử mới](REQUIREMENTS-REVIEW.md). Gaze-Evoked được sửa thành giữa/trái/phải/trên/dưới theo phần protocol tiếng Anh; mỗi vị trí vẫn 6 giây mô phỏng. Thêm màn Phân tích dữ liệu mắt từ Cài đặt/Hướng dẫn, nhận mẫu tổng hợp hoặc CSV góc đã hiệu chỉnh bên ngoài, tính RMS/gain vận tốc và latency/peak velocity/displacement gain saccade kèm kiểm tra dữ liệu, đồ thị và PDF riêng. Đây là phần tính toán thật từ dữ liệu nhập cho FR-23/25/26, chưa nối camera, calibration, normative data hoặc lịch sử bệnh nhân. Dữ liệu trong bộ nhớ, nhãn nguồn rõ, không gọi quality gate là tracking score. Chưa nghiệm thu UI/PDF và Gaze mới trên iPhone.

Nhật ký hoạt động (18/11/2026): người dùng duyệt mục Cài đặt, thao tác hồ sơ/lưu phiên/PDF, chia ngày/lọc loại và Việt/Anh. Schema v6 thêm activity_events và trigger cùng statement cho create/update/trash/restore/delete bệnh nhân, save/update notes phiên. Không backfill quá khứ hoặc JOIN tên khi đọc; target_id là ID nội bộ, event/category cố định, thời điểm ISO. PDF append bằng SELECT EXISTS ràng buộc owner/phiên active; log phân biệt requested preview/print, verified file creation, requested share, không coi là gửi/in/lưu thành công. Viewer keyset paging 30 dòng, lọc theo category và chặn stale response. Account clear xóa nhật ký cuối transaction để dọn cả event phát sinh do trigger xóa hồ sơ, giữ tài khoản khác. Native/flow PDF/migration cần nghiệm thu; không log đăng nhập/nhật ký bảo mật hoặc đồng bộ/chống sửa đổi.

Việt/Anh (18/11/2026): người dùng duyệt ngôn ngữ trong Cài đặt, giữ bố cục/tên chuyên môn, nhớ lựa chọn và áp dụng PDF. Đã thêm dictionary English tách riêng, helper nội suy chỉ dịch chuỗi giao diện do ứng dụng tạo; tên/ghi chú/email/ID giữ nguyên. useSyncExternalStore cập nhật các màn đang mount mà không đổi key tài khoản hoặc form. Preference SecureStore riêng, web localStorage; ghi lỗi giữ lựa chọn cũ, đọc giá trị lạ dùng vi. Guide tạo nội dung theo locale ở mỗi render; ngày/giờ phiên và lịch chọn ngày sinh theo locale. PDF nhận locale rõ ràng tại lúc xuất, escape dữ liệu như cũ, không đổi URI chia sẻ. Không dịch dữ liệu SQLite hoặc email template Supabase. Chuỗi 6 bài đã được người dùng báo PASS 1–7 trước nhiệm vụ này; phần ngôn ngữ mới cần nghiệm thu iPhone.

Chuỗi 6 bài (18/11/2026): người dùng duyệt chọn hồ sơ/camera một lần, tiến độ, nghỉ chủ động, kết thúc có xác nhận, lưu từng lượt và tổng hợp. Đã thêm route /battery dùng chung StimulusPlayer với cấu hình cố định; không tự chạy bài tiếp. Chuyển bài chỉ sau kết quả/cameraBusy false/saving false và xử lý xác nhận lượt chưa lưu. iOS đợi onDismiss của modal rồi mới chuyển state cha, Android/web chuyển sau cập nhật trạng thái. Bảng tổng hợp phân biệt completed/cancelled/chưa thực hiện và saved/không lưu; các phiên đã lưu vẫn riêng trong DB. Tổng hợp trong bộ nhớ, chưa khôi phục chuỗi hoặc xuất PDF tổng hợp; từng phiên vẫn có PDF như cũ. Người dùng đã báo OKN PASS 1–7, chuỗi mới cần nghiệm thu thiết bị.

Optokinetic Nystagmus/OKN (18/11/2026): người dùng duyệt bố cục dải sáng–tối thay chấm, giữ header/timer/camera/controls. Bài thứ sáu chạy 30 giây, chuyển dịch 30 px/s sang phải trong nửa đầu rồi sang trái; sọc rộng 28 px, lặp theo chu kỳ bằng native-driver transform. Đây là các thông số mô phỏng màn hình, chưa hiệu chỉnh góc nhìn hoặc có protocol lâm sàng. Pause/resume dựng phần animation còn lại từ thời gian chạy tích lũy. Mẫu 8 giây đổi hướng sau 4 giây, có hình tĩnh khi Giảm chuyển động. Dùng chung lưu phiên/lịch sử/PDF/Demo, không đổi schema hoặc recordingController. Chưa nghiệm thu iPhone; không tự đánh giá phản xạ hoặc tạo metrics.

Gaze-Evoked Nystagmus (18/11/2026): bài thứ năm được người dùng duyệt theo bố cục hiện tại. Thứ tự mô phỏng giữa/trái/giữa/phải/giữa, mỗi vị trí 6 giây, tổng 30 giây; không gọi đây là protocol lâm sàng. Dùng thời gian chạy tích lũy nên pause/resume giữ phần còn lại của vị trí. Hướng dẫn có mẫu 8 giây rút ngắn, tôn trọng Giảm chuyển động. Mở từ Trang chủ/Kiểm tra/Demo, dùng chung camera/lưu metadata/notes/history/PDF. Không đổi controller hoặc schema và không đánh giá nystagmus. Chưa nghiệm thu iPhone; Anti-Saccade trước đó đã được người dùng báo PASS 1–7.

Anti-Saccade (18/11/2026): người dùng duyệt bài thứ tư theo bố cục hiện tại. Hướng dẫn phân biệt chấm vàng và hướng nhìn đối diện bằng vòng xanh chỉ có ở mẫu; khi chạy chỉ có chấm vàng, bắt đầu giữa rồi luân phiên hai bên ở khoảng thời gian mô phỏng như các bài saccades trước. Không suy ra hướng nhìn thực tế hoặc tạo điểm đúng/sai. Dùng chung camera/pause/hủy/save/notes/history/PDF/Demo, không đổi schema SQLite. Cần nghiệm thu iPhone. Trước đó người dùng báo PASS mục 1–7 của Vertical Saccades.

Vertical Saccades (18/11/2026): được người dùng duyệt triển khai theo bố cục hiện tại. Mở bài thứ ba ở Trang chủ/Kiểm tra/Demo; hướng dẫn và mẫu theo trục dọc, target chạy trên/giữa/dưới trong 30 giây, giữ luồng camera/pause/hủy/save, tên bài riêng trong lịch sử/PDF/so sánh. Bộ chọn bài hỗ trợ dùng chung cho UI và validation phiên. Chưa nghiệm thu iPhone, không có chỉ số/tracking lâm sàng. Trước đó người dùng đã báo PASS mục 1–7 cho giao diện mới của hai bài đầu.

Màn bài tập có/không camera (14/11/2026): triển khai sau khi người dùng duyệt mẫu tương tác. Thiết lập có liên kết mở CameraTrial, vùng mục tiêu cao tối thiểu 260 px cùng kích thước ở hai chế độ, camera nhỏ riêng phía trên, đồng hồ và thanh tiến độ, điều khiển tạm dừng/tiếp tục/kết thúc, thông báo dọn video và lỗi, kết quả metadata/ghi chú. Giữ controller ghi/xóa video và điều kiện chờ dọn xong mới lưu; xác nhận kết thúc/bỏ lượt chưa lưu. Demo vẫn chỉ bộ nhớ. Chưa nghiệm thu native; không thêm tracking hoặc metrics.

Thẻ bài nổi bật (14/11/2026): người dùng duyệt mẫu trước khi yêu cầu code. Đã triển khai thẻ riêng có tên gốc → Việt hóa, thời lượng và nút Chọn bài; tách style khỏi Link asChild để sửa lỗi khung/mũi tên trong ảnh iPhone. Không đổi chức năng bài. Chưa nghiệm thu giao diện native sau triển khai.

UI Kiểm tra/Trang chủ/Thông tin bài (14/11/2026): tên mô tả tiếng Việt giữ nguyên ID/tên chuyên môn khi lưu dữ liệu; nhóm lối tắt theo hồ sơ/kết quả và hỗ trợ. Màn trước bài dùng hướng dẫn thu gọn và nhóm thiết lập hồ sơ/camera/thời lượng/nút bắt đầu, không đổi stimulus/timer/camera/save. Cần nghiệm thu iPhone. UI Demo/Hướng dẫn trước đó được người dùng báo PASS.

Giao diện Demo/Hướng dẫn (14/11/2026): Demo hai bước, lựa chọn có đánh dấu, hướng dẫn compact riêng và danh sách lượt/ghi chú đóng mở; vẫn tối đa 10 lượt chỉ trong bộ nhớ, không owner/camera/DB/PDF. Hướng dẫn chia 4 nhóm/13 chủ đề mở từng mục, giữ các nội dung chức năng và giới hạn. Phần giao diện mới cần nghiệm thu iPhone.

Báo lỗi và góp ý (11/11/2026): thêm route /feedback từ Cài đặt và Hướng dẫn, hỗ trợ tài khoản và xem trước. Form có hai loại phản hồi, bước xem lại trước khi chia sẻ và xóa bản soạn có xác nhận. Không có người nhận cấu hình sẵn; người dùng tự sao chép/chọn đích chia sẻ. Không gửi HTTP, truy vấn bệnh nhân, đọc khóa hoặc lưu DB. Phần mới cần nghiệm thu thiết bị.

Nghiệm thu UI tài khoản (11/11/2026): người dùng xác nhận “ui pass 1-7” cho đăng ký/xác nhận email, khôi phục/đặt mật khẩu mới và hồ sơ tài khoản sau khi đồng bộ với phong cách login. Ghi nhận PASS theo báo cáo thiết bị của người dùng.

Nghiệm thu thùng rác (11/11/2026): người dùng xác nhận checklist mục 1–7 PASS trên thiết bị, gồm xóa mềm/ẩn, khôi phục kèm phiên, lưu bền/cách ly tài khoản, giữ mã và xóa vĩnh viễn có xác nhận. Ranh giới 30 ngày được kiểm thử tự động, chưa chờ thực tế 30 ngày trên thiết bị.

Thùng rác (11/11/2026): schema SQLite v4 bổ sung deleted_at, giữ lịch sử/ghi chú khi xóa mềm và phục hồi cùng ID. Hồ sơ thùng rác không có trong danh sách/tìm kiếm/chọn bài/lịch sử/chi tiết/PDF/so sánh; các ghi/sửa theo đường dẫn cũ bị chặn. Khôi phục trong 30 ngày, xóa vĩnh viễn chỉ nhận hồ sơ trong thùng rác; hết hạn hoặc xóa hẳn mới cascade phiên. Cách ly owner, giữ mã unique trong thùng rác, không phục hồi dữ liệu đã xóa vĩnh viễn từ bản cũ. Phần mới chưa nghiệm thu thiết bị.

Nghiệm thu so sánh: ngày 11/11/2026, người dùng xác nhận checklist so sánh hai lượt mục 1–7 PASS trên thiết bị. Phạm vi nghiệm thu là đối chiếu metadata của hai phiên cùng bệnh nhân/cùng bài, không phải đánh giá tiến triển lâm sàng.

So sánh hai lượt: chọn tối đa hai phiên trong Lịch sử tổng hoặc theo bệnh nhân, ràng buộc cùng hồ sơ và cùng bài; tải lại dữ liệu theo owner trước khi so sánh, tự sắp trước/sau theo thời điểm kết thúc. Chỉ đọc metadata, không chỉnh dữ liệu, không có biểu đồ chỉ số mắt hoặc xuất PDF so sánh. Phần mới cần nghiệm thu trên iPhone.

Giai đoạn 6: đã bổ sung hướng dẫn /guide, màn demo tách dữ liệu trong bộ nhớ và Cài đặt theo nhóm. Demo không có owner/camera/persistence, không xuất file, hỗ trợ hai hồ sơ mẫu Nam/Nữ và hai stimulus; danh sách/ghi chú mất khi đóng route. Không thêm ngôn ngữ khác hoặc feedback gửi email vì chưa có cấu hình/địa chỉ đích. Phần mới chưa nghiệm thu trên iPhone.

Nghiệm thu sửa chia sẻ PDF: sau khi bỏ bước di chuyển file và dùng nguyên URI từ Expo Print, người dùng xác nhận “đã oke”. Ghi nhận luồng sửa chia sẻ PDF PASS theo người dùng; các trường hợp PDF dài/ngoại tuyến và toàn bộ checklist mở rộng chưa được suy rộng thành PASS.

PDF/chia sẻ: thêm Xem / in báo cáo và Xuất / chia sẻ PDF trên chi tiết phiên đã lưu bằng expo-print/expo-sharing tương thích SDK 58. Báo cáo lấy lại dữ liệu theo owner, ghi chú đã lưu và hồ sơ hiện tại; có nhãn mô phỏng học tập, không bịa metrics. Bản PDF tạm dọn sau share sheet và dọn file còn tồn trong thư mục riêng khi xuất tiếp. Chưa nghiệm thu xuất/lưu Tệp/AirDrop hoặc bố cục PDF native trên iPhone.

Nghiệm thu lưu phiên/lịch sử: người dùng xác nhận toàn bộ mục 1–7 trong checklist chat PASS trên thiết bị, gồm liên kết bệnh nhân, ghi chú, lịch sử theo hồ sơ, camera pause/resume, hủy/bỏ phiên, lưu bền, cách ly tài khoản và cascade khi xóa hồ sơ. Phần metadata/lịch sử của giai đoạn 5 đã được người dùng nghiệm thu; PDF/chia sẻ còn chưa triển khai.

Giai đoạn 5 (thông tin phiên): thêm chọn bệnh nhân/tìm tên-mã hoặc không gắn hồ sơ trước bài; lưu thủ công sau completed/cancelled, ghi chú tối đa 1.000 ký tự. Schema SQLite v3 lưu metadata, không có video/trace/metrics. Lịch sử tổng và theo bệnh nhân, phân trang, chi tiết và cập nhật ghi chú; lọc owner_id ở mọi thao tác. Xóa hồ sơ sẽ cascade xóa phiên liên quan, được thông báo trước xác nhận. Xem trước không lưu. Xuất PDF và chia sẻ chưa triển khai. Chưa nghiệm thu tính năng mới trên iPhone.

Nghiệm thu tiếp camera trong bài: sau bản sửa giữ camera đến khi hoàn tất/xóa video và chỉnh safe area, người dùng xác nhận “đã ổn”. Ghi nhận lượt kiểm tra lại PASS theo người dùng; chưa coi là đã nghiệm thu mọi trường hợp lỗi hoặc đồng bộ frame.

Cập nhật tiếp 10/11/2026: đã thêm tùy chọn quay camera trước trong hai bài (mute 480p), đợi progress native rồi chạy stimulus; dừng và xóa từng đoạn khi pause/kết thúc, tiếp tục bằng đoạn mới. Camera trong bài chưa được nghiệm thu thiết bị. Chỉ điều phối theo trạng thái ứng dụng, không có đồng bộ từng frame, pupil tracking/metrics hoặc lưu phiên; giai đoạn 4 chưa được coi là nghiệm thu đầy đủ.

Cập nhật 10/11/2026: người dùng báo hai stimulus chạy thành công. Thêm camera thử riêng (preview trước + quay mute tối đa 10 giây + tự xóa file trả về), chưa quay cùng stimulus và chưa hoàn tất đồng bộ/camera của giai đoạn 4. Người dùng xác nhận camera thử riêng hoạt động hoàn toàn ổn ngày 10/11/2026; chưa có log/video đối chiếu từng tình huống lỗi. Không có tracking/metrics mắt, 240fps hoặc kết luận lâm sàng.

Cập nhật 09/11/2026: đã triển khai phần stimulus của giai đoạn 4 cho Smooth Pursuit và Horizontal Saccades: đếm ngược 3 giây, lượt mô phỏng 30 giây, tạm dừng/tiếp tục/hủy/chạy lại và tự tạm dừng khi ứng dụng mất hoạt động. Smooth Pursuit di chuyển tuyến tính liên tục, Horizontal Saccades đổi vị trí tức thời với khoảng chờ 600–1.200 ms. Đây là thông số minh họa, chưa phải protocol lâm sàng. Chưa tích hợp camera, chọn bệnh nhân, lưu phiên hay báo cáo; giai đoạn 4 chưa hoàn tất toàn bộ. Cần nghiệm thu chuyển động và vòng đời trên iPhone.

1. Nền tảng: SDK 58 tương thích Expo Go hiện tại, Router, theme, bốn tab, auth stack và chi tiết, lint, kiểm tra kiểu JS, bundle iOS.
2. Supabase Auth: login/register/verification/reset/profile và quản lý session. Chỉ dùng publishable/anon key; không dùng service role.
3. SQLite bệnh nhân: đã có CRUD, tìm kiếm có bỏ dấu tiếng Việt, lưu bền và cách ly theo chủ sở hữu; cần nghiệm thu trên iPhone. Lịch sử theo bệnh nhân vẫn ở giai đoạn 5.
4. Hai stimulus: countdown 3 giây, Smooth Pursuit liên tục, Horizontal Saccades nhảy tức thời với thời gian chờ thay đổi; pause/resume/cancel/repeat. Camera độc lập, kiểm thử trên máy thật.
5. Lưu metadata phiên, ghi chú, lịch sử và PDF. Dữ liệu minh họa luôn gắn nhãn. Không có kết luận bệnh lý.
6. Demo không lưu, hướng dẫn, settings, kiểm thử iPhone, README và GitHub.

## Điều kiện nghiệm thu

Lint/typecheck/bundle chỉ xác minh mã và đóng gói; không thay thế chạy iPhone. Cần ghi lại kết quả mở Expo Go, điều hướng, auth thật, lưu bền SQLite sau mở lại, thời gian/animation, quyền camera bị từ chối, ghi/xóa video và chia sẻ PDF. Không đánh dấu PASS nếu chưa có bằng chứng. Không cam kết iOS 16/iPhone 12 của tài liệu gốc được SDK 57 hỗ trợ nếu chưa đối chiếu môi trường chạy thực tế.

Tài liệu gốc có hai mô tả trái nhau: xóa video raw sau xử lý và lưu raw eye movement data. Đồ án ưu tiên xóa video tạm, chỉ lưu metadata/kết quả thực tế; không lưu face data. Không triển khai hay tuyên bố HIPAA/GDPR, AES-256, 240fps hoặc độ chính xác lâm sàng trong MVP Expo Go.
