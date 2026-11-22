# Đối chiếu yêu cầu và phần bổ sung ngày 22 tháng 11 năm 2026

Đã đọc cả phần FR-01–FR-42 và Clinical Protocol & Software Specification trong `đề thi cuối kì (1).docx`. Đề gốc mô tả một sản phẩm iOS có đo chuyển động mắt; bản React Native hiện tại là nguyên mẫu học tập. Bảng này phân biệt luồng quản lý đã có với các yêu cầu đo lường còn thiếu. Không có thang điểm của giảng viên trong tài liệu, nên không thể tính hoặc bảo đảm điểm.

## Phần đã bổ sung trong đợt này

1. Gaze-Evoked đủ năm vị trí **giữa → trái → phải → trên → dưới**, thay cho chuỗi chỉ có ngang. Thời lượng vẫn là mô phỏng 30 giây, mỗi vị trí 6 giây; không gọi là protocol đã được phê duyệt.
2. Cài đặt → **Phân tích dữ liệu mắt**: chọn Smooth Pursuit/Saccades, dùng mẫu có đáp án hoặc dán CSV một trục góc đã hiệu chỉnh bên ngoài. Phân tích chạy ngoại tuyến, không truy vấn hồ sơ hoặc gửi CSV lên server.
3. Tính RMS sai số vị trí, gain vận tốc ước tính, độ trễ saccade, vận tốc đỉnh và gain biên độ; loại đáp ứng mất mẫu/thiếu nền/đi ngược hướng hoặc không xác định được kết thúc. Khi dữ liệu không đủ, hiển thị dấu — thay cho số giả.
4. Biểu đồ mục tiêu/mắt và báo cáo PDF có nhãn nguồn dữ liệu, thông số thuật toán và giới hạn. Dữ liệu mẫu khác dữ liệu nhập, không được trình bày là kết quả camera.
5. Thêm 13 ca kiểm thử số học và dữ liệu lỗi; cập nhật kiểm thử Gaze-Evoked. Đây là bước đáp ứng **một phần FR-23/25/26**, không hoàn tất bộ đo mắt tự động.

## Đối chiếu 42 yêu cầu

“Có luồng” nghĩa là có chức năng tương ứng trong mã, không tự khẳng định đáp ứng toàn bộ yêu cầu y tế hoặc nghiệm thu thiết bị của bản bổ sung.

| FR | Trạng thái | Bằng chứng hoặc phần còn thiếu |
| --- | --- | --- |
| 01 | Có luồng | Đăng ký email/mật khẩu và xác nhận OTP Supabase. |
| 02 | Một phần | Đăng nhập/đăng xuất có; Face ID/Touch ID chưa có. |
| 03 | Một phần | Khôi phục bằng mã email và đặt mật khẩu mới; không phải callback reset bằng link như đề gốc. |
| 04 | Có luồng | Tên, chuyên khoa, cơ sở, logo và dùng trên PDF. Logo chỉ cục bộ. |
| 05 | Chưa có | Chưa có Admin/Clinician và backend thực thi quyền phòng khám. |
| 06 | Có luồng | Timeout 15 phút; chưa coi là kiểm chứng bảo mật độc lập. |
| 07 | Có luồng | Hồ sơ, lịch ngày sinh, Nam/Nữ, mã và ghi chú. |
| 08 | Có luồng | Tìm tên/mã khi nhập, hỗ trợ bỏ dấu. |
| 09 | Có luồng | Lịch sử theo bệnh nhân, mới nhất trước. |
| 10 | Có luồng | Sửa hồ sơ, validation và lọc owner. |
| 11 | Một phần | Thùng rác/khôi phục 30 ngày, dọn hết hạn khi app hoạt động; chưa có tác vụ nền chạy đúng thời điểm ngày 30. |
| 12 | Có luồng | Không gắn hồ sơ và Demo riêng trong bộ nhớ. |
| 13 | Có luồng | Sáu bài chạy riêng/chuỗi, nghỉ chủ động và lưu từng phiên. NPC vẫn tương lai theo phần tiếng Anh. |
| 14 | Có luồng | Hướng dẫn và mẫu trực quan cho sáu bài. |
| 15 | Chưa có | Chưa hiệu chỉnh đồng tử 5–9 điểm. CSV chỉ nhận góc được hiệu chỉnh bên ngoài. |
| 16 | Một phần | Stimulus có chuyển động tương ứng; Gaze-Evoked đã đủ năm hướng. Chưa có tham số protocol lâm sàng được duyệt. |
| 17 | Một phần | Camera ghi thường; chưa 240fps hoặc đồng bộ timestamp từng frame. |
| 18 | Chưa có | Chưa nhận diện/theo dõi đồng tử trực tiếp. |
| 19 | Có luồng | Pause/resume/hủy và điều phối dừng/xóa đoạn video. |
| 20 | Một phần | Chạy lại được; chưa có tracking quality tự quyết định cần chạy lại. |
| 21 | Chưa có | Không có điểm chất lượng tracking, đo lux hoặc head motion thực. Kiểm tra CSV không thay thế chức năng này. |
| 22 | Chưa có | NPC break/recovery/distance chưa có; đề tiếng Anh ghi Future. |
| 23 | Một phần mới bổ sung | Có phép tính từ CSV đã có góc; chưa lấy từ camera, chưa SPV/OKN asymmetry/NPC/corrective-saccade count. |
| 24 | Chưa có | Chưa có normative dataset/ngưỡng do clinical lead cung cấp. Không tự phân loại bình thường/bất thường. |
| 25 | Một phần mới bổ sung | Phiên thật có metadata; màn phân tích riêng có đồ thị/số học. Chưa có báo cáo đo mắt tự động sau bài chạy. |
| 26 | Một phần mới bổ sung | PDF phiên có logo/hồ sơ/ghi chú. PDF phân tích có đồ thị/chỉ số nhưng tách riêng, không giả gắn với phiên camera. |
| 27 | Một phần | Đối chiếu metadata hai phiên cùng hồ sơ/cùng bài; chưa biểu đồ tiến triển chỉ số mắt. |
| 28 | Có luồng | Ghi chú trước lưu và sửa sau lưu. |
| 29 | Có luồng | Share sheet PDF, đích do người dùng chọn. |
| 30 | Chưa có | Chưa xem lại slow motion/overlay; video tạm được xóa. |
| 31 | Một phần | SQLite cục bộ/offline, chưa mã hóa toàn bộ dữ liệu. |
| 32 | Chưa có | Không backup/sync cloud, không tự upload bệnh nhân. |
| 33 | Một phần | Token SecureStore, video không Camera Roll; chưa AES-256 database. |
| 34 | Có luồng | Tùy chọn xóa dữ liệu local theo owner và đăng xuất, có xác nhận. |
| 35 | Một phần | Nhật ký hồ sơ/phiên/PDF cục bộ; chưa toàn bộ login/run/cancel, chưa chống sửa đổi hay tuân thủ lâm sàng. |
| 36 | Một phần | Xóa video tạm có; chưa có pipeline chuyển video thành metrics/trace để lưu. |
| 37 | Có luồng | Việt/Anh, ghi nhớ lựa chọn, gồm màn phân tích và PDF mới. |
| 38 | Chưa có | Chưa chọn normative population và áp ngưỡng đã xác minh. |
| 39 | Một phần | Có hướng dẫn trong app; chưa onboarding tự mở lần đầu hoặc kiểm chứng đào tạo dưới 30 phút. |
| 40 | Có luồng | Demo không ghi SQLite; dữ liệu mẫu phân tích mới cũng chỉ trong bộ nhớ. |
| 41 | Một phần | Soạn/xem lại/sao chép/chia sẻ thủ công; chưa inbox hoặc dịch vụ nhận báo lỗi. |
| 42 | Một phần | Stimulus, SQLite, PDF và phân tích CSV chạy local; auth cần mạng và chưa có toàn bộ core tracking. |

## Kiểm thử trên iPhone cho phần mới

Chạy `npx expo start --clear`, mở lại Expo Go và thử trên bản mới. Các mục dưới đây chưa được ghi PASS trên thiết bị.

1. **Gaze-Evoked:** xem mẫu 8 giây rồi chạy 30 giây không camera. Thấy giữa/trái/phải/trên/dưới, mỗi vị trí 6 giây. Tạm dừng ở hướng trên, tiếp tục phải giữ thời gian còn lại. Thử lại có camera và trong chuỗi; ghi chú/lưu lịch sử vẫn đúng.
2. **Mẫu Pursuit:** Cài đặt → Phân tích dữ liệu mắt → Smooth Pursuit → Thử dữ liệu mẫu có đáp án. Có hai đường vị trí, gain **0,80**, 401 mẫu, 100 Hz. Bật chế độ máy bay thử lại vẫn tính được.
3. **Mẫu Saccades:** chọn Saccades → thử mẫu. Có **2/2 đáp ứng**, latency **200 ms**, vận tốc đỉnh trung bình **187,5°/s**, gain biên độ **1,00**. Mở chi tiết, hai đỉnh lần lượt 125 và 250°/s.
4. **CSV sai:** mở Nhập hoặc xem CSV, sửa `time_ms` thành `time_s`, bật xác nhận đơn vị rồi bấm Phân tích. Phải báo lỗi header, không giữ chỉ số cũ. Sửa một timestamp trùng dòng trước: báo đúng dòng lỗi. Chưa bật xác nhận thì nút Phân tích bị khóa.
5. **Mất tín hiệu:** dùng [poor-coverage.csv](samples/poor-coverage.csv) từ repo, dán toàn bộ. Màn báo không đủ điều kiện; gain/RMS là —, biểu đồ mắt có khoảng trống. Không xuất ra gain 0 hoặc kết luận bệnh lý.
6. **PDF/Việt–Anh:** xuất PDF cả hai mẫu, lưu vào Tệp, kiểm tra nhãn Demo/đồ thị/chỉ số/giới hạn không bị cắt. Đổi English và xuất lại. Chỉ chia sẻ sau khi chọn đích; không ghi lịch sử bệnh nhân từ màn này.
7. **Xóa và đổi tài khoản:** nhập CSV, bấm đổi dạng/mẫu mới phải hỏi trước thay dữ liệu. Xóa dữ liệu phân tích phải hỏi xác nhận; hủy vẫn giữ dữ liệu, đồng ý chỉ xóa màn phân tích. Đăng xuất/đổi tài khoản không mang CSV sang tài khoản mới. Kiểm tra cỡ chữ lớn và bàn phím không che nút.

## Thuật toán và dữ liệu minh chứng

Định dạng là CSV không có quote: `time_ms,eye_deg,target_deg,valid`. Một trục ngang hoặc dọc được chọn từ nguồn đo bên ngoài; mắt và mục tiêu phải có cùng trục, dấu, gốc góc và đồng hồ. Tối đa 6.000 mẫu/240.000 ký tự, dài 1–120 giây, ít nhất 20 mẫu. Timestamp tăng nghiêm ngặt; `valid=0` giữ mẫu mất dưới dạng null. Nhãn “dữ liệu nhập” không xác nhận nguồn hoặc hiệu chỉnh đúng.

Các điều kiện kỹ thuật do đồ án chọn: median rate ≥20 Hz, valid ≥80%, gap lớn nhất ≤250 ms, không tính sai phân qua khoảng trên 100 ms. Không áp các điều kiện này như normative data hoặc tracking score.

- Vận tốc: `(góc_i − góc_(i−1)) / Δt` bằng độ/giây. Không lọc bandpass hoặc khôi phục chớp mắt.
- RMS: căn trung bình bình phương `eye − target` trên mẫu hợp lệ; bao gồm sai số trễ và lệch gốc, không phải chẩn đoán.
- Gain vận tốc: `Σ(v_eye × v_target × Δt) / Σ(v_target² × Δt)`. Đây là hồi quy qua gốc do đồ án chọn để xử lý hai hướng. Loại target dưới 0,5/trên 40°/s và eye trên 50°/s cùng khoảng lân cận; yêu cầu ≥500 ms dùng được. Không đồng nhất phép ước tính này với một pipeline pursuit lâm sàng đã validation.
- Saccade: target step ≥2°, nền ≥50 ms dưới 10°/s; onset là đầu khoảng đầu tiên trong hai khoảng liên tiếp ≥30°/s cùng hướng; offset khi tốc độ dưới 15°/s, trong tối đa 1 giây hoặc trước mục tiêu kế tiếp. Thiếu mẫu trước khi xác định offset làm loại trial. Latency = onset − target onset. Peak là đỉnh sai phân trong chuyển động đầu tiên; gain biên độ = dịch chuyển mắt/chuyển mục tiêu. Không tách corrective saccades hoặc chấm Anti-Saccade.

Mẫu Pursuit được tạo với `eye = 0,8 × target`, chạy hai chiều. Mẫu Saccades có hai bước +10°/−20°, delay 200 ms, thời gian chuyển 80 ms; đỉnh sai phân 125/250°/s. Có file CSV tương ứng trong `docs/samples`; dữ liệu hoàn toàn tổng hợp, không có thông tin người bệnh.

Tài liệu nền cho định nghĩa và phương pháp, không phải chứng nhận thuật toán đồ án:

- [Heinen và cộng sự, A foveal target increases catch-up saccade frequency during smooth pursuit](https://pmc.ncbi.nlm.nih.gov/articles/PMC4808105/): nghiên cứu tính gain từ vận tốc mắt và mục tiêu, dùng phát hiện saccade ngoại tuyến. Cách lấy cửa sổ trong đồ án khác nghiên cứu.
- [Saccade Latency Indexes Exogenous and Endogenous Object-Based Attention](https://pmc.ncbi.nlm.nih.gov/articles/PMC5014680/): latency từ onset mục tiêu tới onset saccade; phát hiện dựa trên nhiều ngưỡng. Đồ án chỉ thực hiện mô hình vận tốc giản lược, không sao chép đầy đủ thiết bị/thuật toán nghiên cứu.

## Phần cần môi trường hoặc bằng chứng bổ sung

**Nhánh phát triển native:** Apple Vision/tracking đồng tử, thu camera định dạng hỗ trợ frame rate cần thiết, đồng bộ frame/target, Face ID và SQLCipher. Cần development build, kiểm tra module thực, thiết bị/camera hỗ trợ và dữ liệu đối chứng. Expo cho phép native module; giới hạn ở đây là bản Expo Go hiện dùng và việc chưa triển khai/kiểm chứng module, không phải React Native không thể làm.

**Đầu vào lâm sàng:** protocol, tham số, normative dataset, population và nghiên cứu đối chiếu VNG/VOG. Không suy ra độ chính xác 9–15%, lỗi SPV dưới 2°/s, điều kiện ≥300 lux hay độ trễ dưới 33 ms từ bộ dữ liệu tổng hợp.

**Backend:** phân quyền phòng khám cần server/RLS thực thi, cloud backup cần consent/cấu hình và thử khôi phục. Không dùng user_metadata tự gán role như cơ chế phân quyền. Không coi thêm một công tắc Sync là hoàn thành.

**Độ bền và nền tảng:** chưa auto-save/resume mọi bước sau crash, chưa kiểm chứng iOS 16/iPhone 12 theo yêu cầu gốc, chưa chứng nhận mã hóa/tuân thủ. Nên trình bày trung thực phần làm được, kết quả kiểm thử và kế hoạch kỹ thuật, thay vì đưa số liệu mẫu thành kết quả đo thật.
