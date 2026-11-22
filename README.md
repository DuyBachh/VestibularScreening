# VestibularScreening

Đồ án React Native bằng JavaScript, Expo SDK 58 và Expo Router. Nguyên mẫu học tập, không phải thiết bị chẩn đoán. Chỉ dùng dữ liệu bệnh nhân giả lập.

## Trạng thái hiện tại · 22/11/2026

Phạm vi ứng dụng Expo Go đã có các nhóm chức năng dưới đây. Người dùng đã nghiệm thu các mốc chức năng qua checklist trên iPhone, gần nhất là Nhật ký hoạt động. Kiểm thử tổng thể cho bản bàn giao vẫn cần chạy lại trên thiết bị; không coi kiểm thử mã hoặc bundle là bằng chứng camera/UI native đã đạt.

- **Tài khoản:** Supabase Auth email/OTP, đăng nhập/đăng xuất, khôi phục mật khẩu, hồ sơ chuyên môn và logo. Phiên lưu SecureStore, timeout 15 phút không hoạt động.
- **Hồ sơ mẫu:** SQLite, tạo/sửa/tìm không dấu theo tên hoặc mã, lịch chọn ngày sinh, giới tính chỉ Nam/Nữ. Tách dữ liệu theo tài khoản, thùng rác/khôi phục 30 ngày và xác nhận xóa vĩnh viễn.
- **Sáu bài mô phỏng:** tên chuyên môn gốc kèm mô tả Việt/Anh; hướng dẫn, mẫu 8 giây, đếm ngược 3 giây, lượt 30 giây, pause/resume/hủy/chạy lại.
- **Camera tùy chọn:** camera trước, không thu âm, ghi theo đoạn và xóa video tạm khi dừng. Có preview/quay thử riêng, xử lý từ chối quyền và tự pause khi chuyển ứng dụng. Không tự lưu Camera Roll.
- **Kết quả:** lưu metadata/ghi chú, lịch sử tổng/theo hồ sơ, sửa ghi chú, so sánh hai phiên cùng hồ sơ và cùng bài. Không so sánh hoặc kết luận tình trạng sức khỏe.
- **PDF:** xem/in, xuất/chia sẻ bằng share sheet iPhone; tên/chuyên khoa/cơ sở/logo lấy từ thông tin đã lưu. Giữ URI gốc của Expo Print để chia sẻ trong Expo Go.
- **Chuỗi 6 bài:** chọn hồ sơ/camera một lần, tiến độ n/6, màn nghỉ chủ động, lưu từng phiên riêng và tổng hợp cuối. Tổng hợp chỉ trong bộ nhớ màn, chưa có khôi phục chuỗi sau đóng app hoặc PDF gộp.
- **Việt/Anh:** chọn trong Cài đặt, nút VI/EN ở đăng nhập và các màn tài khoản. Đã bỏ nút khỏi Trang chủ theo yêu cầu. Ghi nhớ lựa chọn trên thiết bị, dịch UI/hướng dẫn/thông báo/PDF; giữ tên, ghi chú, ID và giá trị giới tính lưu Nam/Nữ.
- **Nhật ký hoạt động:** lọc theo loại, chia ngày, mới nhất trước, phân trang; chỉ ID nội bộ/thời điểm/loại thao tác, không tên/ghi chú/token/URI. Ghi từ bản cập nhật schema v6, không tạo lại lịch sử quá khứ. Yêu cầu chia sẻ PDF không có nghĩa đã gửi hoặc lưu.
- **Demo/Hướng dẫn/Góp ý:** Demo dùng hồ sơ mẫu riêng, tối đa 10 lượt trong bộ nhớ, không camera/DB/PDF. Góp ý do người dùng xem lại rồi sao chép/chia sẻ thủ công, chưa có hộp thư nhận tự động.
- **Dọn dữ liệu:** Đăng xuất giữ dữ liệu; Xóa dữ liệu và đăng xuất có xác nhận, xóa hồ sơ/thùng rác/phiên/ghi chú/logo/nhật ký theo tài khoản trong transaction. Tài khoản Supabase và PDF đã xuất ra Tệp vẫn còn.
- **Phân tích dữ liệu mắt:** Cài đặt → Phân tích dữ liệu mắt, dùng mẫu có đáp án hoặc dán CSV góc đã hiệu chỉnh bên ngoài. Tính RMS, gain vận tốc, độ trễ/vận tốc đỉnh/gain biên độ saccade, vẽ trace và xuất PDF Việt/Anh. Chạy offline, dữ liệu chỉ trong bộ nhớ; chưa nối với camera hoặc lịch sử bệnh nhân. Có kiểm tra dữ liệu và loại đáp ứng không đủ điều kiện.

| Bài | Cách hiển thị trong bản mô phỏng |
| --- | --- |
| Smooth Pursuit | Chấm đi liên tục theo chiều ngang. |
| Horizontal Saccades | Chấm nhảy trái/giữa/phải, chờ khoảng 0,6–1,2 giây. |
| Vertical Saccades | Chấm nhảy trên/giữa/dưới. |
| Anti-Saccade | Chấm ở hai bên; hướng dẫn nhìn phía đối diện, không tự chấm đúng/sai. |
| Gaze-Evoked Nystagmus | Giữa → trái → phải → trên → dưới, giữ mỗi vị trí 6 giây. |
| Optokinetic Nystagmus (OKN) | Dải sáng–tối chạy ngang, đổi hướng sau 15 giây. |

Các thời lượng/tốc độ trên phục vụ mô phỏng học tập, chưa phải protocol lâm sàng được kiểm chứng. Chưa theo dõi đồng tử, đo metrics từ camera, hiệu chỉnh góc nhìn, ghi 240fps, phát hiện rung giật nhãn cầu hoặc đưa kết luận chẩn đoán. Bộ tính CSV là chức năng nghiên cứu độc lập; dữ liệu mẫu có nhãn và không thay thế số đo mắt. NPC, Face ID/development build, phân quyền admin và sao lưu cloud chưa triển khai.

SQLite chưa mã hóa hoặc đồng bộ đám mây; logo và nhật ký cũng chỉ ở thiết bị. SecureStore bảo vệ token và tùy chọn nhỏ, không mã hóa toàn bộ database. Nhật ký cục bộ chưa chống chỉnh sửa. Chỉ dùng dữ liệu giả lập. Offline dùng được các phần cục bộ khi phiên tài khoản còn hợp lệ; đăng ký/đăng nhập/reset hoặc làm mới phiên cần dịch vụ mạng. Xem trước và Demo là hai luồng riêng.

**Cấu hình tài khoản:** làm theo [hướng dẫn Supabase từng bước](docs/SUPABASE-SETUP.md), điền `.env` từ `.env.example`, bật Confirm email và sửa hai mẫu email để hiện `{{ .Token }}`.

Xem [bảng 42 FR và phạm vi MVP](docs/MVP-SCOPE.md). Tài liệu đề thi là nguồn yêu cầu, không phải lệnh thay đổi stack sang Swift.

Đợt bổ sung ngày 22/11: [đối chiếu đủ 42 yêu cầu, cách thử phân tích, thuật toán và phần còn thiếu](docs/REQUIREMENTS-REVIEW.md). Hai bộ CSV mẫu có đáp án trong [docs/samples](docs/samples).

## Chạy trên Windows và iPhone

```powershell
Set-Location 'D:\Code\React Native\VestibularScreening'
npm ci
npx expo start --clear
```

Đã nâng từ SDK 57 lên SDK 58 theo đồng ý của người dùng để khớp Expo Go trên iPhone. Dùng Node.js 22.13+ trên nhánh 22, hoặc 24.3+ trên nhánh 24; môi trường hiện tại dùng Node 24.21.0.

Trong terminal đang chạy server cũ, nhấn Ctrl+C trước khi chạy `npx expo start --clear`. Kết nối iPhone và máy tính cùng Wi-Fi, dùng Camera iPhone quét QR mới rồi mở Expo Go SDK 58. Windows không chạy iOS Simulator. Người dùng đã xác nhận ứng dụng và các mốc nêu trên chạy được trên iPhone; phạm vi từng lần nghiệm thu ghi trong `docs/VALIDATION.md`.

Lần đầu có thể chọn **Thử demo · Không cần tài khoản** hoặc **Lần đầu sử dụng? Xem hướng dẫn** ở màn đăng nhập. Khi đã đăng nhập, mở Demo/Hướng dẫn từ Trang chủ hoặc Cài đặt. Trong Demo: chọn hồ sơ mẫu và bài → Tiếp tục → xem hướng dẫn/chạy thử → thêm ghi chú → Về Demo → mở Các lượt đã thử. Đổi hồ sơ hoặc bài kiểm tra để chọn lại mà vẫn giữ danh sách demo trong màn. Thoát demo về Trang chủ sẽ bỏ bộ nhớ demo, không đổi dữ liệu tài khoản. Hướng dẫn có 4 nhóm: Bắt đầu, Chạy bài, Lưu & chia sẻ, Dữ liệu & trợ giúp; mỗi lần mở một chủ đề. Luồng đầy đủ: đăng nhập → tạo hồ sơ mẫu → chọn bài/bệnh nhân → chạy → lưu phiên → Lịch sử → PDF.

## Kiểm tra mã

```powershell
npx expo lint
npx tsc --project jsconfig.json --noEmit
npx expo install --check
npm test
npx expo-doctor@latest
npx expo export --platform ios
```

TypeScript chỉ là công cụ kiểm tra kiểu cho JavaScript qua `allowJs`/`checkJs`; mã ứng dụng không dùng `.ts` hoặc `.tsx`. Bundle iOS không chứng minh camera/animation hoặc UI đã chạy trên thiết bị.

## Cấu trúc

- `src/app`: route và layout Expo Router, nhóm tabs/auth, màn hình chi tiết.
- `src/components`: Screen, Card, RouteButton dùng chung.
- `src/constants`: theme.
- `src/features/tests`: stimulus, điều phối camera, chọn bệnh nhân cho lượt chạy, lưu phiên, lịch sử và mẫu báo cáo.
- `src/features/demo`: hồ sơ mẫu và danh sách demo trong bộ nhớ, chính sách chặn owner/camera.
- `src/features/auth`: trạng thái phiên, validation, form và chính sách timeout.
- `src/features/patients`: màn hình CRUD và kiểm tra dữ liệu bệnh nhân.
- `src/services`: Supabase client, adapter lưu phiên SecureStore chia nhỏ giá trị và SQLite.
- `src/features/language`: dictionary Việt/Anh và lựa chọn ngôn ngữ trên thiết bị.
- `src/features/activity`: màn nhật ký; trigger/schema và repository ở `src/services`.
- `docs`: phạm vi và kết quả kiểm tra.

`App.js` cũ được giữ lại, chỉ bỏ prop `StatusBar.backgroundColor` không còn được React Native hỗ trợ; entry `index.js` hiện dùng Expo Router. SQLite khởi tạo lười khi truy vấn dữ liệu; màn Demo không gọi dịch vụ đọc/ghi dữ liệu tài khoản.

## Kịch bản demo 7–10 phút

Chuẩn bị tài khoản mẫu đã xác nhận email, một iPhone chạy Expo Go SDK 58, Wi-Fi và ít nhất một phiên đã lưu. Chuỗi 6 bài cần thêm thời gian thực hiện, nên kiểm thử đủ trước buổi demo.

1. Ở màn đăng nhập, bấm VI/EN; mở Demo và chỉ rõ dữ liệu mẫu không lưu vào tài khoản. Có thể chạy một lượt 30 giây rồi quay về.
2. Đăng nhập, tạo hồ sơ giả gồm tên, ngày sinh chọn bằng lịch, Nam/Nữ và mã. Tìm lại hồ sơ bằng một phần tên hoặc mã.
3. Chọn Smooth Pursuit hoặc Horizontal Saccades, đọc hướng dẫn, xem chuyển động mẫu. Bật/tắt camera để giải thích tùy chọn, bắt đầu, pause/resume và hoàn tất một lượt.
4. Nhập ghi chú → Lưu vào lịch sử → mở chi tiết. Xuất/xem PDF; chỉ chia sẻ khi đã tự chọn đích. Báo cáo có nhãn mô phỏng và không có chỉ số mắt giả.
5. Mở Chuẩn bị chuỗi để giới thiệu chọn hồ sơ/camera một lần và thứ tự 6 bài. Màn nghỉ không tự chạy; các phiên đã lưu vẫn riêng trong Lịch sử.
6. Mở Nhật ký hoạt động, lọc Hồ sơ/Lượt kiểm tra/Báo cáo; giải thích chỉ ghi loại thao tác và ID, không phải nhật ký chống sửa đổi.
7. Giới thiệu Thùng rác và hai lựa chọn đăng xuất. Giữ dữ liệu demo để trình diễn lại; phần xóa toàn bộ chỉ thử bằng dữ liệu mẫu có thể bỏ.

## Kiểm thử tổng thể trên iPhone trước bàn giao

Ghi kết quả mục 1–7 và lỗi cụ thể nếu có. Đợt này cần kiểm tra luồng xuyên suốt trên cùng bản mã, dù các tính năng riêng đã được nghiệm thu trước đó.

1. Mở mới app, đăng nhập/xác nhận email hoặc khôi phục bằng tài khoản thử; navigation bốn tab không lỗi. Không thử timeout trong lúc cần giữ lượt demo.
2. Tạo/sửa/tìm hồ sơ, chọn ngày sinh/Nam–Nữ; đóng/mở app kiểm tra lưu bền. Chuyển thùng rác/khôi phục một hồ sơ mẫu kèm lịch sử.
3. Chạy bài riêng có và không camera: mẫu, countdown, pause/resume, chuyển app, hủy có xác nhận, chờ xóa video và lưu ghi chú; không báo tracking thành công.
4. Chạy đủ chuỗi 6 bài, lưu từng lượt và kiểm tra 6 phiên riêng; thử một chuỗi kết thúc sớm, xác nhận bỏ lượt chưa lưu và phân biệt bài hủy/chưa thực hiện.
5. Xem lịch sử, sửa ghi chú, so sánh đúng hai phiên cùng hồ sơ/cùng bài; xuất PDF Việt/Anh với logo và ghi chú dài, mở lại PDF đã lưu trong Tệp.
6. Đổi Việt/Anh, cỡ chữ lớn; Demo/Hướng dẫn/Góp ý và Nhật ký hoạt động hiển thị đúng, các dữ liệu tự nhập giữ nguyên. Đăng xuất thường/đổi tài khoản: dữ liệu và nhật ký không lẫn nhau.
7. Trên tài khoản mẫu có thể bỏ, thử Xóa dữ liệu và đăng xuất, đăng nhập lại để kiểm tra dữ liệu/nhật ký trống và tài khoản khác không ảnh hưởng. Sau đó thử phần cục bộ khi offline trong phiên còn hợp lệ.

## Giải thích kiến trúc khi bảo vệ đồ án

- **Có cần chạy Node server riêng?** Luồng hiện tại gọi Supabase Auth trực tiếp từ ứng dụng; hồ sơ, phiên, logo và nhật ký lưu SQLite cục bộ. Không có backend Node riêng đang phục vụ các luồng này.
- **Vì sao dùng SQLite và SecureStore?** SQLite lưu dữ liệu quan hệ/ngoại tuyến. SecureStore lưu token chia nhỏ và tùy chọn ngôn ngữ, không thay thế mã hóa database.
- **Tách dữ liệu tài khoản thế nào?** Các truy vấn ghi/đọc gắn owner ID; khóa ngoại owner/patient và validation ngăn liên kết phiên sang hồ sơ tài khoản khác. Đây là cách ly logic của app trên thiết bị, chưa phải chống truy cập vật lý vào file SQLite.
- **Camera có theo dõi mắt không?** Camera preview/ghi video thông thường, mute và xóa file tạm. Chưa có thuật toán nhận diện đồng tử hoặc đồng bộ frame; không suy ra metrics hay chẩn đoán từ video.
- **Chuỗi 6 bài lưu gì?** Mỗi lượt có session ID riêng và chỉ lưu khi bấm Lưu vào lịch sử. Bộ điều phối giữ thứ tự, màn nghỉ và tổng hợp trong bộ nhớ; không có schema kết quả lâm sàng chung.
- **Nhật ký có bảo đảm tuân thủ y tế không?** Trigger ghi thay đổi cùng statement để tránh log thành công giả khi rollback, nhưng log vẫn là SQLite cục bộ có thể chỉnh sửa; không có chứng nhận tuân thủ.
- **Chia sẻ PDF có nghĩa gửi thành công không?** Không. Share sheet do hệ điều hành/người dùng điều khiển; nhật ký phân biệt tạo tệp và yêu cầu chia sẻ, không khẳng định người nhận đã nhận.

## Dịch vụ và Git

Giai đoạn 2 cần người dùng tạo Supabase project và điền biến môi trường theo `docs/SUPABASE-SETUP.md`. Luồng email dùng OTP để chạy trong Expo Go; callback deep link tự động chưa triển khai. Không đưa service role key vào ứng dụng. `.gitignore` loại `.env`, token và khóa riêng; `EXPO_PUBLIC_*` luôn là dữ liệu công khai trong bundle.

Repository GitHub: [DuyBachh/VestibularScreening](https://github.com/DuyBachh/VestibularScreening), chế độ **công khai** theo yêu cầu người dùng. Nhánh mặc định và bàn giao là `codex/mvp-handoff-20261122`, tạo từ `master`; remote `origin` trỏ tới repository này. Không đưa `.env`, token, database/video/PDF bệnh nhân hoặc tệp đề thi vào repo. `.env.example` chỉ chứa placeholder.

Đã đưa mã và tài liệu lên GitHub ngày 22/11/2026. Người chấm có thể xem repository công khai. Kiểm thử tổng thể trên iPhone theo checklist ở trên vẫn cần hoàn tất trước buổi demo. Không force push hoặc thay lịch sử nhánh đang có.
