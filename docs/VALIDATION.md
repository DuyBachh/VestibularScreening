# Kết quả kiểm tra VestibularScreening

## Đưa mã lên GitHub · 22/11/2026

Theo yêu cầu trực tiếp của người dùng, đã tạo repository riêng tư https://github.com/DuyBachh/VestibularScreening trên tài khoản DuyBachh. Remote origin và nhánh mặc định codex/mvp-handoff-20261122 đã được cấu hình; commit ứng dụng d86345b đã push thành công, giữ nguyên lịch sử Git. README được cập nhật đường dẫn và trạng thái bàn giao. File môi trường được theo dõi chỉ có .env.example placeholder; .env thực vẫn bị ignore. Thao tác này không thay đổi kết quả kiểm thử hoặc thay thế checklist tổng thể trên iPhone.

## Tổng kiểm tra và chuẩn bị demo · 22/11/2026

Người dùng xác nhận Nhật ký hoạt động PASS 1–7 trên iPhone. Sau các mốc chức năng đã được báo pass, chuyển sang kiểm thử xuyên suốt và chuẩn bị bàn giao đúng phạm vi đề bài ban đầu, không thêm tính năng lâm sàng/cloud hoặc đổi UI. Đã rút gọn README thành trạng thái hiện tại thay vì danh sách mốc cũ còn ghi chờ nghiệm thu; bổ sung bảng 6 stimulus, kịch bản demo 7–10 phút, checklist tổng thể và phần giải thích kiến trúc khi bảo vệ.

Kiểm tra bản hiện tại: expo lint PASS, tsc --project jsconfig.json --noEmit PASS, npm test 117/117 PASS, export iOS PASS (1.376 modules, bundle 3,9 MB). expo install --check báo các dependencies khớp local SDK map; networking bị tắt nên đây không phải xác minh phiên bản mới nhất qua mạng. Chưa chạy expo-doctor online ở mốc này. Các warning Node MODULE_TYPELESS_PACKAGE_JSON/SQLite experimental và NO_COLOR không làm thất bại kiểm thử/bundle; không coi là lỗi camera đã tái hiện.

Chuẩn bị Git: branch ban đầu master, chưa có remote. .env được ignore; danh sách file đang được Git quản lý/nhận thêm chỉ có .env.example placeholder, không có .env thực. Kiểm tra theo mẫu không tìm thấy sb_secret/private-key block trong các file mã/tài liệu được xét; đây không phải chứng nhận không có mọi loại bí mật trong lịch sử Git. Người dùng trả lời chưa có repository GitHub, vì vậy chưa cấu hình remote hoặc đưa mã ra ngoài. Đã tạo nhánh cục bộ codex/mvp-handoff-20261122 để lưu mốc mã và tài liệu; GitHub vẫn là mục bàn giao chưa hoàn thành.

Checklist tổng thể 1–7 đặt trong README; cần người dùng chạy trên cùng bản mã trước buổi demo. Các nghiệm thu riêng trước đây không thay thế kiểm thử tổng thể trên thiết bị. Chưa ghi nhận PASS tổng thể cho mốc 22/11.

## Nhật ký hoạt động · 18/11/2026

Người dùng duyệt Nhật ký hoạt động FR-35 ở Cài đặt với lịch sử thao tác hồ sơ/phiên/PDF, ngày/mới nhất trước, lọc loại và Việt/Anh. Đã thêm route /activity chỉ cho tài khoản đăng nhập; UI chia ngày theo locale, filter All/Patient/Session/Report, keyset paging 30 event và refresh. Owner + filter + generation token chặn kết quả tải cũ, không JOIN tên hoặc nội dung hồ sơ. Chỉ metadata: id, owner_id, event, category, target_id, occurred_at. Không payload tự do, token/email/ghi chú/URI/video/report body.

Migration schema v6 cài bảng/index/triggers trong transaction, không tạo log cho dữ liệu có trước. Trigger ghi cùng statement cho tạo/sửa hồ sơ (chỉ khi nội dung thực sự đổi), vào thùng rác/khôi phục/xóa vật lý (gồm dọn hết hạn), lưu phiên và đổi ghi chú. Lưu phiên retry/no-op update không sinh log trùng. Thao tác bị lỗi/rollback không để lại event thành công. Event tồn tại sau xóa đối tượng và không có FK cascade vào log. Xóa toàn bộ dữ liệu tài khoản dọn activity_events cuối exclusive transaction, sau trigger tạo event delete; rollback/cách ly owner được kiểm thử. Đăng xuất thường giữ nhật ký.

PDF: log pdf_preview_requested trước gọi Print, pdf_created chỉ sau xác nhận file tồn tại/kích thước >0, pdf_share_requested trước gọi Sharing; mỗi insert kiểm tra owner/phiên active ở cùng SQL. Kiểm tra isCurrent quanh các lần await. Yêu cầu không khẳng định cửa sổ đã mở, đã in/gửi/lưu. Việc tạo PDF tạm khi đã rời màn không được coi là export của màn còn active. Nếu ghi nhật ký báo lỗi, luồng báo lỗi theo cơ chế hiện tại và dọn file qua finally.

npm test 117/117 PASS: 8 ca mới về trigger/chỉ metadata, atomicity/rollback, session retry/no-op/owner, keyset/filter, PDF whitelist/active owner/unlinked, migration lặp/lưu bền/không backfill, account clear thực với trigger và nhãn Việt/Anh. Bộ accountData mở rộng thêm lỗi/mất owner ở bước xóa activity và đảm bảo dữ liệu tài khoản khác giữ nguyên. Lint/typecheck/diff check PASS. Đóng gói iOS PASS: 1.376 modules, bundle 3,9 MB. Chưa nghiệm thu UI, migration trên DB thiết bị và native PDF của phần mới.

Checklist iPhone:

1. Tải lại app với dữ liệu cũ: hồ sơ/lịch sử vẫn còn; Cài đặt → Nhật ký hoạt động mở được, không tự tạo nhật ký quá khứ. Preview không có mục/không đọc dữ liệu.
2. Tạo hồ sơ mẫu, sửa một trường thật, chuyển thùng rác, khôi phục rồi xóa vĩnh viễn một hồ sơ mẫu: có từng event đúng thứ tự mới nhất trước; không hiển thị tên/ngày sinh/nội dung ghi chú trong nhật ký.
3. Chạy và lưu phiên hoàn tất/hủy, sửa ghi chú phiên: có event lưu/sửa đúng ID. Bấm lưu lặp hoặc lưu ghi chú không đổi không sinh bản sao; thao tác bị hủy trước xác nhận không có success event.
4. Xem/in PDF: event Yêu cầu xem/in PDF. Xuất/chia sẻ: Đã tạo tệp PDF + Yêu cầu chia sẻ PDF; hủy bảng chia sẻ không bị ghi là đã gửi/in/lưu. PDF/URI chia sẻ vẫn hoạt động như trước.
5. Thử từng bộ lọc, kéo làm mới, Xem thêm khi đủ 30 event và đổi bộ lọc nhanh; không trùng dòng/hiện dữ liệu sai nhóm, ngày/giờ đúng và đổi English/Vi giữ nguyên action/ID/thời điểm gốc.
6. Đăng xuất thường, đăng nhập lại: nhật ký vẫn còn. Đổi tài khoản: chỉ thấy nhật ký riêng, không có dữ liệu tài khoản trước. Đóng/mở app và offline vẫn xem được nhật ký đã có.
7. Trên tài khoản dữ liệu giả có thể bỏ: Xóa dữ liệu và đăng xuất có nhắc xóa nhật ký; sau đăng nhập lại nhật ký rỗng, dữ liệu tài khoản khác còn. Thử chữ lớn/màn hẹp, filter/tiêu đề/nút tải vẫn đọc/bấm được. Bản cục bộ không có chống chỉnh sửa hoặc chứng nhận tuân thủ.

Điều chỉnh sau phản hồi: đã bỏ LanguageSwitch khỏi Trang chủ để gọn bố cục. Các vị trí đổi ngôn ngữ ở đăng nhập, AccountScreen và Cài đặt giữ nguyên. Chỉ bỏ import và nút khỏi Trang chủ; cần tải lại trên iPhone để xem bố cục.

## Nút đổi ngôn ngữ nhanh VI/EN · 18/11/2026

Theo yêu cầu đưa lựa chọn ra ngoài Cài đặt, thêm LanguageSwitch chung ở hàng logo màn đăng nhập, đầu Trang chủ và phía trên AccountScreen cho các màn tài khoản. Hai nút VI/EN dùng chung saveLanguage/preference; đang chọn tô primary, nút tối thiểu 44×44, có selected/disabled/busy và nhãn song ngữ cho trình đọc màn hình. Login header cho phép xuống dòng khi màn hẹp/chữ lớn, giữ input state khi đổi ngôn ngữ. Lưu lỗi dùng Alert, không đổi lựa chọn cũ; không thay auth hoặc dữ liệu. Cài đặt vẫn giữ lựa chọn đầy đủ.

npm test 109/109 PASS; lint/typecheck/diff check PASS. Đóng gói iOS PASS, 1.371 modules, bundle 3,8 MB; Metro tự crawl lại khi cache không đọc được và hoàn tất bình thường. Dictionary thêm 3 nhãn (889 mục). Cần kiểm tra native: (1) nhập email/mật khẩu rồi bấm EN/VI ở login, nội dung nhập giữ nguyên; (2) đổi ở Trang chủ và kiểm tra Cài đặt đồng bộ lựa chọn; (3) đóng/mở app, thử chữ lớn/màn hẹp và các màn đăng ký/khôi phục, nút không đè logo/tiêu đề và lựa chọn còn được nhớ.

## Việt/Anh · 18/11/2026

Người dùng báo chuỗi 6 bài PASS 1–7 rồi duyệt lựa chọn ngôn ngữ. Cài đặt có Tiếng Việt/English và trạng thái đang chọn. Preference riêng thiết bị dùng key vestibular.ui.language.v1 qua SecureStore, web localStorage; không chung key token/tài khoản. Khởi tạo preference trước khi mount Auth/navigation, thay đổi qua external store giữ component identity và form state. Ghi lỗi không đổi locale đang dùng; giá trị lưu thiếu/lạ quay về vi. Dictionary offline English có 886 mục, nội suy tham số chỉ sau khi dịch UI; không chạy lookup trên tên/ghi chú tự nhập. Giới tính hiển thị Male/Female nhưng validation/SQLite vẫn chỉ Nam/Nữ. Mã bài/trạng thái/session ID và protocol mô phỏng giữ nguyên.

Đã nối dịch ở auth, Trang chủ/tabs, hồ sơ/thùng rác, lịch sử/so sánh, cài đặt/tài khoản, Demo/Hướng dẫn/góp ý, sáu bài và chuỗi. PDF dùng locale snapshot ở đầu export, html lang và ngày/giờ theo ngôn ngữ; giữ escape HTML, dữ liệu tự nhập, tên chuyên môn và URI chia sẻ gốc. PDF default helper vẫn vi cho caller không truyền locale. Email template Supabase không đổi. Tên của hồ sơ Demo giữ nguyên như dữ liệu mẫu.

npm test 109/109 PASS, gồm 8 ca mới: preference lưu/đọc lại/cách ly key, ghi lỗi/giá trị lạ, subscription, nội suy giữ dữ liệu/whitespace, sáu hướng dẫn/guide đổi locale không đổi ID, giới tính/validation giữ dữ liệu, PDF Anh/Vi bảo toàn nội dung và escape, coverage toàn bộ lời gọi t dạng literal và placeholder dictionary. Lint/typecheck/diff check PASS; đóng gói iOS PASS: 1.370 modules, bundle 3,8 MB. Chưa nghiệm thu bố cục/ngôn ngữ native.

Checklist iPhone:

1. Cài đặt → Ngôn ngữ / Language → English: các nhóm Cài đặt, tiêu đề, 4 tab và Trang chủ đổi tiếng Anh ngay; vẫn đăng nhập tài khoản hiện tại.
2. Đóng/mở app, xác nhận English còn được chọn. Đăng xuất thường rồi đăng nhập lại: màn auth tiếng Anh, dữ liệu tài khoản giữ nguyên. Về Settings → Tiếng Việt đổi lại được.
3. Chuyển qua Patients/tìm kiếm/thùng rác/tài khoản: nhãn, placeholder, xác nhận xóa và lỗi nhập liệu đúng tiếng Anh. Tạo hồ sơ giả tên “Trang chủ”, ghi chú “Đăng nhập”; giữ nguyên nội dung khi chuyển ngôn ngữ và chọn giới tính chỉ Male/Female (giá trị lưu vẫn Nam/Nữ).
4. Mở hướng dẫn/Demo/cả 6 bài: tên chuyên môn giữ nguyên, phần mô tả/hướng dẫn/nút/camera/đếm ngược/kết quả tiếng Anh, chuyển động và mẫu như trước. Kiểm tra các hướng dẫn Anti-Saccade, Gaze-Evoked và OKN vẫn đúng.
5. Chạy riêng và thử chuỗi có/không camera: kiểm tra pause/kết thúc, camera cleanup, xác nhận bỏ lượt chưa lưu, màn nghỉ/tổng hợp và ghi chú. Lịch sử/PDF đúng tên bài/dữ liệu sau lưu, không bị đổi ID hoặc trùng phiên.
6. Xuất PDF ở English: heading/disclaimer/nhãn/trạng thái/ngày giờ tiếng Anh, tên/ghi chú tự nhập vẫn nguyên; đổi sang Tiếng Việt và xuất lại có nhãn Việt. PDF cũ đã lưu không thay đổi, chia sẻ/in vẫn hoạt động.
7. Mở Hướng dẫn/góp ý, thử validation tiếng Anh; tăng cỡ chữ kiểm tra nút/tiêu đề/cuộn/bàn phím. Thử offline vẫn đổi ngôn ngữ và mở hướng dẫn được. Nội dung hồ sơ/ghi chú đã lưu giữ nguyên sau đổi qua lại hai ngôn ngữ.

## Chuỗi 6 bài · 18/11/2026

Người dùng báo OKN PASS checklist 1–7, sau đó duyệt luồng chạy chuỗi. Đã thêm Chuẩn bị chuỗi ở tab Kiểm tra, route /battery cho tài khoản và xem trước. Hồ sơ/camera đóng băng theo cấu hình chuỗi; tiến độ Bài n/6 hiển thị cả chuẩn bị và modal chạy. Mỗi bài vẫn cần bấm bắt đầu, lưu kết quả riêng hoặc xác nhận bỏ trước khi Tiếp tục chuỗi. Giữa bài là màn nghỉ, camera không chạy. Cuối bài 6 có Xem tổng hợp. Kết thúc sớm giữ các phiên đã lưu; bài chưa chạy không tạo phiên và không bị ghi thành đã hủy. Tổng hợp không lưu DB, không có khôi phục chuỗi/PDF gộp. Hướng dẫn trong app đã cập nhật.

RunCamera/controller không đổi; finishInBattery chặn khi chưa có kết quả, cameraBusy hoặc saving. Modal iOS dùng onDismiss để bàn giao sau khi đóng; Android/web dùng effect với chặn bàn giao trùng. Bộ điều phối chỉ nhận đúng bài kế tiếp, session ID khác nhau và trạng thái completed/cancelled hợp lệ, không nhận trùng/out-of-order. Điều hướng rời chuỗi bị chặn lúc thực hiện; dùng Kết thúc trong bài rồi Kết thúc chuỗi ở kết quả. Trong màn nghỉ có xác nhận kết thúc. Auth đổi owner tạo lại màn chuỗi; không mang cấu hình/hồ sơ sang tài khoản khác.

npm test 101/101 PASS, thêm 5 ca điều phối thứ tự/trùng/kết thúc sớm/xem trước/đầu vào và một ca SQLite lưu sáu phiên độc lập, giữ ghi chú riêng, chống lưu trùng và cách ly owner. Typecheck, lint và git diff --check PASS. Đóng gói iOS PASS: 1.365 modules, bundle 3,7 MB. Chưa nghiệm thu các tương tác modal/camera/điều hướng native của chuỗi.

Checklist iPhone:

1. Kiểm tra → Chuẩn bị chuỗi: thấy 6 bài đúng thứ tự; chọn một hồ sơ mẫu và tắt camera. Bắt đầu chuỗi → Bài 1/6, hồ sơ/camera cố định.
2. Chạy bài 1 đủ 30 giây → nhập ghi chú → Lưu vào lịch sử → Tiếp tục chuỗi. Phải về màn nghỉ, camera không hoạt động. Tiếp tục → hướng dẫn bài 2/6, không tự chạy.
3. Chạy đến bài 6, lưu từng bài, cuối chọn Xem tổng hợp: 6 hoàn tất, 0 hủy/chưa thực hiện, 6 đã lưu. Lịch sử có 6 phiên riêng đúng hồ sơ/tên bài/ghi chú; PDF từng phiên vẫn đúng.
4. Chuỗi mới: hủy bài đang chạy rồi chưa lưu mà bấm Tiếp tục. Có xác nhận bỏ lượt; Ở lại giữ ghi chú, Bỏ lượt mới sang màn nghỉ. Tổng hợp phân biệt đã hủy và không lưu.
5. Kết thúc chuỗi sớm từ kết quả hoặc màn nghỉ: có xác nhận, giữ phiên đã lưu; các bài còn lại Chưa thực hiện. Thử Back/gesture và nút kết thúc trước khi bắt đầu một bài, không rời chuỗi âm thầm.
6. Bật camera cho chuỗi: hồ sơ/camera giữ qua ít nhất 2 bài; pause/background hoạt động, chờ dọn video trước chuyển bài. Không camera ở màn nghỉ. Thử từ chối quyền/lỗi và kết thúc chuỗi an toàn.
7. Xem trước không đăng nhập: chuỗi không ghi lịch sử. Tăng cỡ chữ/nhập ghi chú kiểm tra cuộn/nút. Đóng app mất tổng hợp tạm nhưng các phiên đã lưu vẫn có sau mở lại; các bài chạy riêng/Demo vẫn hoạt động.

## Optokinetic Nystagmus (OKN) · 18/11/2026

Người dùng duyệt bài thứ sáu với vùng dải sáng–tối chuyển động ngang, đổi hướng giữa lượt. Đã triển khai OknStripes dùng Animated native driver, dải lặp không hở mép, tốc độ mô phỏng 30 px/s, sọc rộng 28 px. Lượt 30 giây: sang phải 0–15 giây, sang trái 15–30 giây. Resume dùng active elapsed để giữ thời gian đổi hướng còn lại. Mẫu 8 giây đổi hướng sau 4 giây; khi Giảm chuyển động chỉ có hình tĩnh/mẫu bị khóa. Header/timer/camera/pause/hủy/save/history/PDF/Demo dùng chung, không thay controller hoặc DB schema. Không đo hay kết luận phản xạ mắt; tốc độ chưa hiệu chỉnh theo góc nhìn/khoảng cách.

Lint/typecheck và git diff --check PASS; npm test 95/95 PASS. Sáu ca mới kiểm tra hai chiều và mốc đổi hướng, khôi phục đúng tốc độ/thời gian còn lại, mẫu 8 giây và giá trị biên, độ phủ sọc ở màn hẹp/rộng, lưu hoàn tất/hủy theo owner và tên bài/ghi chú trong PDF. Bài không hỗ trợ vẫn bị chặn bằng ID giả trong kiểm thử. Đóng gói iOS PASS: 1.362 modules, bundle 3,7 MB. Chưa nghiệm thu native OKN; chưa có xác nhận checklist riêng của Gaze-Evoked ở lượt mới nhất.

Checklist iPhone:

1. Tải lại app: Kiểm tra có 6 thẻ, mở OKN đúng tên gốc/Việt hóa từ Trang chủ/Kiểm tra/Demo.
2. Cách thực hiện: mẫu 8 giây có dải sáng–tối chạy ngang, đổi hướng ở giây 4 và tự dừng; không có chấm vàng. Giảm chuyển động chỉ hiện hình tĩnh.
3. Tắt camera, chạy sau 3 giây chuẩn bị: dải chạy sang phải 15 giây đầu rồi sang trái 15 giây sau, đủ 30 giây thực hiện; hai mép không xuất hiện khoảng trống, dòng hướng dẫn đọc được.
4. Pause trước/sau mốc 15 giây: dải và timer dừng; tiếp tục đúng phần thời gian còn lại, không đặt lại hướng/thời lượng từ đầu. Kết thúc và bỏ lượt chưa lưu có xác nhận.
5. Có camera: xem trước/đóng rồi chạy, thumbnail không che dải; pause/hoàn tất chờ dọn video. Chuyển ứng dụng tự pause, từ chối quyền có hướng dẫn.
6. Lưu hoàn tất/hủy kèm ghi chú: lịch sử/PDF/chia sẻ đúng Optokinetic Nystagmus, hồ sơ/trạng thái/ghi chú. Chỉ so sánh cùng hồ sơ/cùng bài; không có điểm phản xạ mắt.
7. Demo thêm được lượt OKN chỉ trong bộ nhớ; thử lại các bài chấm trước đó, tăng cỡ chữ và đổi kích thước màn để kiểm tra chữ/nút/cuộn và mép dải.

## Gaze-Evoked Nystagmus · 18/11/2026

Người dùng báo PASS checklist 1–7 của Anti-Saccade rồi duyệt bài thứ năm. Đã thêm bài giữ ánh nhìn theo bố cục chung, tên gốc/Việt hóa, hướng dẫn giữ đầu cố định. Chấm giữ nguyên ở giữa 0–6 giây, trái 6–12, giữa 12–18, phải 18–24, giữa 24–30; dựa trên active elapsed nên pause/resume không đặt lại vị trí hoặc thời gian giữ. Mẫu 8 giây có cùng thứ tự, mỗi vị trí 1,6 giây và được ghi rõ là rút ngắn. Các thời lượng phục vụ mô phỏng học tập, chưa có protocol lâm sàng được duyệt. Không tạo chỉ số hoặc phát hiện rung giật nhãn cầu.

Lint/typecheck và git diff --check PASS; npm test 89/89 PASS. Năm ca mới kiểm tra ranh giới thời gian giữ, phần còn lại sau pause, mẫu rút ngắn, lưu hoàn tất/hủy theo owner và tên bài/ghi chú trong PDF; OKN vẫn bị chặn vì chưa triển khai. Đóng gói iOS PASS: 1.360 modules, bundle 3,7 MB. Chưa nghiệm thu native bài mới.

Checklist iPhone:

1. Tải lại app: Kiểm tra có 5 bài, Gaze-Evoked Nystagmus có tên Việt hóa; mở được từ Trang chủ/Demo và không nằm trong nhóm đang phát triển.
2. Cách thực hiện: đọc rõ giữ đầu cố định/giữ mắt tại chấm; mẫu 8 giây có thứ tự giữa/trái/giữa/phải/giữa, chấm đứng yên từng đoạn. Giảm chuyển động dùng hình tĩnh.
3. Không camera, chọn hồ sơ mẫu rồi chạy: đếm ngược 3 giây; giữ mỗi vị trí khoảng 6 giây theo thứ tự trên, kết thúc sau 30 giây thực hiện, không có kết luận rung giật nhãn cầu.
4. Pause ở khoảng giây thứ 8–9: chấm bên trái và thời gian dừng. Chờ rồi tiếp tục, chấm giữ bên trái khoảng 3–4 giây thực hiện còn lại trước khi về giữa. Kết thúc có xác nhận, lượt chưa lưu có xác nhận khi rời/chạy lại.
5. Có camera: xem trước/đóng rồi chạy, pause/hoàn tất chờ dọn video; thumbnail không che chấm. Chuyển ứng dụng tự pause; từ chối quyền có hướng dẫn xử lý.
6. Lưu hoàn tất và hủy kèm ghi chú: Lịch sử/PDF/chia sẻ đúng Gaze-Evoked Nystagmus, hồ sơ/trạng thái/ghi chú; chỉ so sánh cùng hồ sơ/cùng bài.
7. Demo thêm được bài mới và chỉ giữ lượt trong Demo; thử lại 4 bài trước để xác nhận chuyển động cũ. Tăng cỡ chữ, kiểm tra cuộn và nút lưu khi mở bàn phím.

## Anti-Saccade · 18/11/2026

Người dùng báo PASS checklist 1–7 của Vertical Saccades rồi duyệt thêm Anti-Saccade theo bố cục chung. Bài thứ tư được mở ở Trang chủ/Kiểm tra/Demo và hỗ trợ lưu metadata/ghi chú, lịch sử, PDF. Hướng dẫn có chấm vàng ở một bên và vòng xanh minh họa phía cần nhìn đối diện, mẫu tự dừng sau 8 giây và tôn trọng Giảm chuyển động. Trong lượt chạy, ban đầu chấm ở giữa để chuẩn bị; sau đó chỉ có chấm vàng đổi giữa hai bên (không cue giữa), không có vòng xanh hoặc tính điểm ánh nhìn. Giữ controller camera và điều kiện dọn video trước khi tiếp tục/lưu.

Lint/typecheck và git diff --check PASS; npm test 84/84 PASS, thêm kiểm tra cue hai bên không lặp, bảo toàn ba vị trí cho bài ngang/dọc, lưu hoàn tất/hủy theo owner và tên bài/ghi chú trong PDF. Đóng gói iOS PASS: 1.359 modules, bundle 3,7 MB. Chưa nghiệm thu native bài mới.

Checklist iPhone:

1. Tải lại app: Kiểm tra có 4 thẻ, tên Anti-Saccade và Việt hóa; mở được từ Trang chủ/Demo, không còn trong nhóm đang phát triển.
2. Mở Cách thực hiện: đọc rõ Chấm trái → Nhìn phải và ngược lại. Mẫu có chấm vàng/vòng xanh luôn ở hai phía đối diện, tự dừng sau 8 giây. Giảm chuyển động có hình tĩnh và chữ hướng dẫn.
3. Tắt camera, chọn hồ sơ mẫu, chạy: 3 giây chuẩn bị/30 giây thực hiện; bắt đầu ở giữa rồi chấm đổi hai bên. Trong lúc chạy chỉ có chấm vàng, dòng nhắc nhìn đối diện, không có điểm đúng/sai.
4. Tạm dừng/tiếp tục không mất thời gian/vị trí; Kết thúc có xác nhận. Chạy lại/Về thông tin bài trước khi lưu hỏi bỏ lượt, chọn ở lại giữ ghi chú.
5. Bật camera, xem trước/đóng rồi chạy; pause/hoàn tất chờ dọn video, thumbnail không che chấm. Chuyển ứng dụng tự pause; từ chối quyền có hướng dẫn xử lý.
6. Lưu lượt hoàn tất/hủy kèm ghi chú: lịch sử đúng hồ sơ/bài/trạng thái; PDF/chia sẻ đúng Anti-Saccade/ghi chú. Chỉ so sánh hai lượt cùng hồ sơ/cùng bài, không có kết luận đúng/sai ánh nhìn.
7. Demo thêm được lượt Anti-Saccade và chỉ giữ trong Demo; thử lại ba bài cũ để xác nhận hướng chấm như trước. Kiểm tra cỡ chữ lớn, cuộn và nút lưu khi mở bàn phím.

## Vertical Saccades · 18/11/2026

Người dùng báo PASS checklist 1–7 của mốc UI hai bài đầu, sau đó duyệt thêm bài Vertical Saccades theo cùng bố cục. Bài thứ ba có hướng dẫn riêng, sơ đồ/mẫu trục dọc, đếm ngược 3 giây/lượt 30 giây, tùy chọn camera, pause/hủy, ghi chú/lưu phiên, lịch sử/PDF và Demo. Các vị trí chuẩn hóa -1/0/1 ánh xạ sang translateY, chiều ngang vẫn translateX. Giữ khoảng cách với caption phía dưới; không đổi recordingController hoặc tạo migration DB.

Kiểm thử tự động 80/80 PASS: thêm kiểm tra biên vùng chấm dọc ở nhiều kích thước, giữ biên hai bài ngang, lưu bài dọc hoàn tất/hủy, cách ly tài khoản, chặn bài chưa hỗ trợ và tên bài trong báo cáo. Typecheck, lint và git diff --check PASS. Đóng gói iOS PASS, 1.358 modules, bundle 3,7 MB. Chưa nghiệm thu camera hoặc UI native cho bài mới.

Checklist iPhone:

1. Tải lại app, mở Kiểm tra: thấy 3 thẻ, tên Vertical Saccades/Việt hóa và biểu tượng dọc; bài mới không còn ở Bài đang phát triển. Trang chủ mở được bài.
2. Mở Cách thực hiện: sơ đồ Trên/Giữa/Dưới, mẫu 8 giây chỉ nhảy theo chiều dọc, tự dừng. Giảm chuyển động dùng hình tĩnh.
3. Tắt camera, chọn hồ sơ mẫu, bắt đầu: đếm ngược 3 giây rồi chấm đổi vị trí trên/giữa/dưới trong 30 giây. Chấm không chạy ngang hoặc đè dòng hướng dẫn.
4. Tạm dừng/tiếp tục giữ thời gian/vị trí; Kết thúc có xác nhận. Từ kết quả chưa lưu, Chạy lại/Về thông tin bài phải hỏi bỏ lượt.
5. Bật camera, xem trước/đóng rồi chạy; pause/hoàn tất chờ dọn đoạn video trước khi tiếp tục/lưu, thumbnail không che chấm. Chuyển ứng dụng tự pause; từ chối quyền có hướng dẫn.
6. Lưu lượt hoàn tất và lượt hủy có ghi chú: Lịch sử đúng Vertical Saccades, trạng thái và hồ sơ. PDF/chia sẻ đúng tên bài/ghi chú; so sánh chỉ nhận cùng hồ sơ/cùng bài.
7. Demo chọn được bài thứ ba, chạy/thêm lượt chỉ trong Demo. Thử lại hai bài cũ để xác nhận chấm vẫn theo chiều ngang; tăng cỡ chữ để kiểm tra cuộn và nút.

## Triển khai mẫu màn bài tập đã duyệt · 14/11/2026

Người dùng duyệt triển khai sau mẫu tương tác có/không camera. Cả Smooth Pursuit và Horizontal Saccades dùng chung bố cục mới: thiết lập, đếm ngược, chạy, tạm dừng, xử lý video, lỗi camera, kết quả và ghi chú/lưu. Nút Xem trước camera mở CameraTrial hiện có, không mở camera tự động khi bật công tắc. RunCamera giữ vị trí mount ổn định qua lúc dừng/xóa; camera thumbnail tách khỏi vùng mục tiêu. Chấm và timer giữ cách điều khiển cũ; kết quả không giả lập số đo mắt hoặc xác nhận ghi/xóa khi chưa có bằng chứng.

Kiểm tra mã: expo lint và tsc --project jsconfig.json --noEmit thành công; npm test 76/76 PASS, gồm 6 ca mới cho các trạng thái camera/busy/lỗi/foreground và đồng hồ. expo export --platform ios thành công, 1.357 modules, bundle 3,7 MB. Đây chưa phải nghiệm thu camera/animation/bố cục native.

Checklist thiết bị cần chạy cho cả hai bài:

1. Bốn tab có icon/nhãn rõ, không đè vùng home indicator; mở từng bài có tên gốc/Việt hóa, hướng dẫn thu gọn, chọn hồ sơ và nút bắt đầu.
2. Tắt camera: đếm ngược 3 giây, chạy 30 giây; chấm rõ, đồng hồ/tiến độ và hai nút dễ đọc. Hoàn tất không có thông báo đã quay video.
3. Tạm dừng: chấm/thời gian dừng; tiếp tục đúng thời gian còn lại. Kết thúc có xác nhận, Giữ tạm dừng không hủy; xác nhận hủy hiển thị trạng thái đã hủy.
4. Bật camera và mở Xem trước camera; đóng màn thử rồi bắt đầu. Thumbnail ở trên vùng chấm; chỉ báo đang ghi sau khi xác nhận bắt đầu ghi. Tạm dừng/kết thúc phải chờ xử lý video rồi mới tiếp tục/lưu; có số đoạn xóa thực tế.
5. Nhập ghi chú và lưu: có thông báo đã lưu, lịch sử đúng hồ sơ/bài/trạng thái/thời lượng/ghi chú. Chạy lại hoặc về trước khi lưu phải hỏi bỏ lượt; Ở lại giữ ghi chú, Bỏ lượt không lưu.
6. Kiểm tra từ chối quyền camera, chuyển app rồi quay lại trong lượt có camera: không tự báo thành công, không tiếp tục ghi nền; có hướng dẫn xử lý và kết thúc. Sau khi dọn xong về thiết lập có thể tắt camera chạy lại.
7. Thử Demo và tăng cỡ chữ hệ thống: Demo không camera/ghi DB, thêm lượt rồi Về Demo xem lại; màn chạy/kết quả cuộn được, bàn phím không che phần nhập/lưu và nút không mất chữ.

## Thanh tab và mẫu màn bài tập · 14/11/2026

Theo yêu cầu người dùng, chỉ triển khai thanh tab trước, rồi dựng mẫu chi tiết có/không camera để duyệt trước khi sửa các màn bài tập. Mã StimulusPlayer/RunCamera/SessionSave không thay đổi ở nhiệm vụ này.

Thanh tab: thay ký tự Unicode bằng expo-symbols ~58.0.5 cài qua expo install, dùng SF Symbols iOS và Material Symbols Android/web. Bốn tab giữ nguyên tên/route: Trang chủ, Bệnh nhân, Kiểm tra, Lịch sử. Biểu tượng nét regular 21 px, label bên dưới 11 px, tab active primary/700 và inactive 400; nền trắng, đường phân cách mảnh, khoảng cách đều. Chiều cao 64 + safe-area bottom; giữ khoảng home indicator. Nhãn tab chỉ giới hạn scale 1.3 để tránh tràn, nhãn truy cập vẫn đầy đủ, nội dung màn không bị giới hạn font.

Lint/typecheck PASS; export Hermes iOS PASS (1.355 modules, khoảng 3,7 MB), dependency check map SDK cục bộ báo phù hợp (mạng tắt khi check), diff check PASS. Bộ symbols được tài liệu SDK 58 ghi hỗ trợ Expo Go. Chưa nghiệm thu icon/native safe-area trên thiết bị hoặc Android/web.

Mẫu exercise-camera-flow-proposal.html nằm trong vùng xem trước của cuộc trò chuyện, không được import vào app. Có lựa chọn hai bài, chuẩn bị, đếm ngược, chạy, pause, dọn video, hoàn tất và lỗi camera; bật/tắt camera để đối chiếu. Camera là khung minh họa, timer/progress là trạng thái mẫu, không dùng getUserMedia, không gửi mạng/ghi DB. Đề xuất vùng mục tiêu cùng kích thước cho hai chế độ; camera thumbnail nằm riêng phía trên. Khi dọn video: khóa Tiếp tục/lưu; khi lỗi: không xác nhận ghi hình thành công. Giữ hộp xác nhận hủy và rời lượt chưa lưu. Phần bài tập đang chờ người dùng duyệt bố cục, chưa triển khai.

Checklist thanh tab:

1. Reload app: bốn biểu tượng hiển thị đúng, không còn clover/ký tự Unicode thay biểu tượng.
2. Chuyển từng tab: icon/nhãn đổi màu và nhãn tab đang chọn đậm đúng; route/nội dung cũ giữ nguyên.
3. Trên iPhone có home indicator, thanh không che nội dung và vùng bấm không sát cạnh dưới.
4. Cỡ chữ lớn hoặc màn nhỏ: nhãn vẫn đọc được, không chồng biểu tượng/nhãn bên cạnh.
5. Vào bài chạy modal full-screen: thanh tab vẫn ẩn như trước; quay lại danh sách vẫn chọn tab Kiểm tra.

## Triển khai mẫu Thẻ bài nổi bật đã chọn · 14/11/2026

Sau ảnh IMG_1050.HEIC thể hiện thẻ mất nền/viền/padding và mũi tên rơi thành dòng riêng, đã dựng hai mẫu xem trước. Người dùng chọn Thẻ bài nổi bật và yêu cầu triển khai; đây là duyệt mẫu thiết kế, chưa phải nghiệm thu mã mới trên thiết bị.

Thay thẻ bấm tối giản bằng ExerciseCard: View tĩnh có nền trắng, viền nhạt, bóng nhẹ, bo 20, padding 20; dấu nhận diện nhỏ + 30 giây thực hiện; tên gốc 22 px đậm, Việt hóa 15 px ngay dưới; nút Chọn bài cao tối thiểu 50 px, nền primary và mũi tên trong cùng hàng. Mỗi nút có accessibilityLabel riêng theo bài, điều hướng bằng router.push. Thẻ và tên không giới hạn số dòng. Hai liên kết phụ Demo/Bài đang phát triển đặt dưới các thẻ; danh sách bài chưa hỗ trợ vẫn đóng/mở và không chạy được.

Nguyên nhân lỗi kiểu hiển thị được đối chiếu trong Expo Router BaseExpoRouterLink/ui Slot và Radix Slot cục bộ: style callback của Pressable khi qua Slot bị hợp nhất thành object rỗng. Thử nghiệm renderToStaticMarkup với đúng package cài đặt cho kết quả slotted callback → object không key; slotted style object giữ key; callback trực tiếp giữ kiểu function. Bản mới không dùng Link asChild cho thẻ/nút; khung View dùng style object và Pressable nhận callback trực tiếp. Không sửa dependency, không thêm snapshot test chỉ chụp lại cấu trúc UI.

70/70 test hiện có PASS; lint/typecheck/diff check PASS; export Hermes iOS PASS (1.352 modules, khoảng 3,7 MB). Không đổi ID/tên catalog, timer/camera/save, quyền hoặc schema. Cần nghiệm thu trên iPhone để xác nhận hiển thị native theo mẫu.

Checklist:

1. Tải lại app → tab Kiểm tra: hai thẻ có nền trắng, đường viền/bo góc và khoảng đệm rõ, không còn chữ/mũi tên rời như ảnh cũ.
2. Tên Smooth Pursuit và Horizontal Saccades nổi bật; bản Việt hóa ở ngay dưới đúng bài. Hàng thời lượng và biểu tượng nhỏ gọn.
3. Mỗi thẻ có nút Chọn bài màu đậm, chữ và mũi tên nằm cùng hàng; nhấn có phản hồi màu.
4. Nút bài thứ nhất/thứ hai mở đúng Thông tin bài, có thể Back về danh sách và chọn lại.
5. Thử Demo trước mở đúng Demo; Bài đang phát triển mở/thu gọn được, không có bài chưa hỗ trợ nào chạy được.
6. Chữ lớn/màn nhỏ: tên và nút tự tăng chiều cao, không cắt chữ hoặc chồng nhau, cuộn đến phần phụ được.
7. Chọn bài → hồ sơ/camera/hướng dẫn/Bắt đầu vẫn hoạt động như trước. Không cần xóa dữ liệu hoặc chạy lại toàn bộ checklist dữ liệu để kiểm tra thẻ.

## Tinh gọn tab Kiểm tra và thứ tự tên bài · 14/11/2026

Theo yêu cầu mới: tên gốc tiếng Anh là tiêu đề, tên Việt hóa ở ngay bên dưới trong danh sách Kiểm tra, hai bài Trang chủ, lựa chọn/tóm tắt Demo và tiêu đề Thông tin bài. Không đổi ID, tên catalog, metadata/PDF hoặc nội dung thực hiện.

Tab Kiểm tra bỏ khung tổng quan màu, số thứ tự, mô tả dài, dải minh họa và dòng CTA lặp. Chỉ giữ hai lựa chọn chính với tên 21 px đậm, Việt hóa 15 px và mũi tên tròn tương phản. Cả thẻ bấm được, không có nút lồng nhau. Thời gian 30 giây/chuẩn bị 3 giây hiển thị một lần dưới tiêu đề trang. Demo và các bài đang phát triển gom nhóm Tìm hiểu thêm, bài chưa hỗ trợ vẫn thu gọn và không bấm chạy được. Chiều cao thẻ chỉ là tối thiểu; tên dài/chữ lớn có thể xuống dòng.

Kiểm tra mã: 70/70 test hiện có PASS, lint/typecheck/diff check PASS; export Hermes iOS PASS (1.351 modules, khoảng 3,7 MB). Không thêm dependency hoặc đổi schema/logic lượt chạy.

Chưa nghiệm thu giao diện mới trên iPhone. Checklist:

1. Tab Kiểm tra: Smooth Pursuit và Horizontal Saccades là tiêu đề đậm, bản Việt hóa nằm dưới đúng bài.
2. Hai thẻ chính dễ nhận ra, không còn số thứ tự, dải minh họa hoặc đoạn mô tả dài; bấm bất kỳ vùng nào trong thẻ mở đúng bài.
3. Trang chủ và Thông tin bài có tên gốc ở trên, Việt hóa ở dưới; các lối tắt vẫn mở đúng.
4. Demo ở bước chọn bài và tóm tắt dùng cùng thứ tự tên; đổi lựa chọn vẫn đúng hồ sơ/bài.
5. Tìm hiểu thêm → Demo mở được; Các bài đang phát triển mở/thu gọn được và không có thao tác chạy.
6. Cách thực hiện, lựa chọn hồ sơ, camera và nút Bắt đầu trong Thông tin bài vẫn hoạt động; không cần lặp lại toàn bộ lượt chạy để đánh giá bố cục.
7. Chữ lớn/màn nhỏ: tên không bị cắt, bản Việt hóa không chồng lên mũi tên; cuộn tới nhóm phụ được.

## Danh sách Kiểm tra, lối tắt và thông tin bài · 14/11/2026

Người dùng báo “pass” cho UI Demo/Hướng dẫn rồi yêu cầu chỉnh tab Kiểm tra, khu vực dưới lối tắt Trang chủ và Thông tin bài kiểm tra. Ghi nhận Demo/Hướng dẫn PASS theo người dùng, chưa có kết quả riêng từng mục hoặc log/video. Phần giao diện mới trong mục này chưa nghiệm thu thiết bị.

Tab Kiểm tra dùng tên mô tả tiếng Việt, tên chuyên môn phụ và hai thẻ chạy được. Thời lượng/chuẩn bị hiển thị một lần; các bài chưa hỗ trợ thu gọn và không có nút chạy. Có lối vào Demo riêng. testPresentation chỉ bổ sung nội dung UI, không đổi ID hoặc testCatalog.name dùng trong lưu phiên/PDF.

Phần dưới Trang chủ đổi từ lối tắt biểu tượng và các link rời sang hai nhóm: Hồ sơ và kết quả (Bệnh nhân/Lịch sử), Làm quen và hỗ trợ (Demo/Hướng dẫn/Cài đặt). Hàng có mô tả ngắn và toàn hàng bấm được; xem trước được dẫn đăng nhập khi chọn quản lý hồ sơ/lịch sử. Hai bài trên Trang chủ dùng cùng tên Việt + tên chuyên môn. Giới hạn chiều rộng 600 px, bỏ cắt mô tả hai dòng ở các thẻ này.

Thông tin bài: mô tả ngắn luôn hiện, Cách thực hiện thu gọn mặc định; mở để xem sơ đồ và mẫu 8 giây. TestPreparation compact/embedded bỏ viền/card lồng nhau, vẫn giữ tư thế và cảnh báo. Chuẩn bị lượt kiểm tra nhóm 3 giây/30 giây, hồ sơ không bắt buộc, switch camera với trạng thái bật/tắt, link Thử camera và một nút Bắt đầu chính. Demo giữ cách trình bày đã nghiệm thu; không đổi timer, modal đang chạy, vòng đời camera hoặc lưu phiên. Không có thao tác xóa dữ liệu/schema/dependency.

Kiểm tra mã: 70/70 test hiện có PASS; lint/typecheck và diff check PASS. Export Hermes iOS PASS (1.351 modules, khoảng 3,7 MB). Các kiểm tra này không thay thế nghiệm thu bố cục/điều hướng/camera native trên iPhone.

Checklist:

1. Trang chủ: hai bài và hai nhóm dưới lối tắt có chữ rõ, không chồng/cắt khi tên dài/chữ lớn. Bệnh nhân/Lịch sử mở đúng; xem trước dẫn đăng nhập.
2. Demo, Hướng dẫn, Cài đặt trong nhóm hỗ trợ mở đúng màn; Back quay lại đúng Trang chủ. Demo/Hướng dẫn vừa sửa vẫn hoạt động.
3. Tab Kiểm tra: hai bài chạy được dễ phân biệt bằng tên Việt/tên chuyên môn. Các bài đang phát triển mở/thu gọn, không có nút chạy.
4. Mở từng bài từ Trang chủ và tab Kiểm tra: đúng tên, mô tả, 3 giây chuẩn bị/30 giây thực hiện. Cách thực hiện mở/đóng được; mẫu 8 giây và Giảm chuyển động vẫn đúng, đóng mục thì mẫu dừng.
5. Chạm hàng Hồ sơ → chọn/đổi hoặc Không gắn hồ sơ: tên/mã cập nhật đúng. Bật/tắt camera, Thử camera trước hoạt động và không đổi lựa chọn hồ sơ.
6. Chạy một lượt không camera và thử camera nếu cần: countdown/pause/resume/hủy, lưu ghi chú và lịch sử vẫn đúng. Lượt camera vẫn chờ dừng/xóa trước khi tiếp tục.
7. Thử màn nhỏ và chữ lớn: card, switch, dòng hồ sơ và nút Bắt đầu không bị cắt hoặc che; cuộn được. Trường hợp bài không tồn tại/chưa hỗ trợ hiển thị thông báo thay vì mở lượt chạy.

## Giao diện Demo và Hướng dẫn · 14/11/2026

Sau bản này người dùng xác nhận “pass” trước khi yêu cầu sửa tiếp UI Kiểm tra/Trang chủ. Ghi nhận PASS theo báo cáo người dùng; chưa có kết quả riêng từng mục hoặc đối chiếu độc lập.

Demo chuyển sang hai bước: chọn hồ sơ mẫu/bài, sau đó xem hướng dẫn và chạy. Chọn bằng thẻ có trạng thái đánh dấu; tên bài có lời giải thích tiếng Việt. Nút đổi lựa chọn quay về bước đầu và giữ danh sách demo trong route. LearningScreen dùng key theo bước để trở về đầu nội dung khi chuyển bước, state lựa chọn và danh sách nằm ở DemoScreen nên được giữ. Các lượt đã thử đóng/mở được; từng lượt mở ghi chú riêng. Thêm lượt tự mở danh sách/ghi chú mới sau khi đóng modal. Xóa danh sách vẫn có xác nhận; bỏ route bỏ dữ liệu demo.

TestPreparation thêm compact chỉ dùng cho Demo: giữ hướng dẫn riêng, sơ đồ và chuyển động mẫu, tư thế và cảnh báo dừng; bỏ ba hàng chuẩn bị trùng với luồng chọn. Hai bài tài khoản vẫn dùng bản đầy đủ. Không đổi timer/stimulus/camera/save hoặc giới hạn 10 lượt. Giữ runCapabilities demo không owner/camera và fixture Nam/Nữ. DemoSessionNote cập nhật hướng dẫn tìm Các lượt đã thử.

Hướng dẫn thay các card dài bằng 4 nhóm với 13 chủ đề: Bắt đầu, Chạy bài, Lưu & chia sẻ, Dữ liệu & trợ giúp. Chỉ một chủ đề mở tại một thời điểm; đổi nhóm đóng chủ đề cũ. Giữ nội dung email/hồ sơ, hai bài, camera/tạm dừng, lưu/lịch sử/PDF/logo, so sánh, lưu trữ/thùng rác/đăng xuất, xử lý lỗi và phản hồi; CTA Mở Demo/Soạn phản hồi dẫn route cũ. Có mô tả giới hạn nguyên mẫu và không chẩn đoán.

Khung dùng chung LearningUI có SafeArea, cuộn/bàn phím iOS, chiều rộng tối đa 600 px, hàng tự cao theo chữ lớn. Không cài dependency, đổi schema, gọi DB hoặc tạo dữ liệu tài khoản. Kiểm tra mã: 70/70 test hiện có, lint/typecheck PASS; export Hermes iOS PASS (1.350 modules, khoảng 3,7 MB). Chưa nghiệm thu bố cục, lựa chọn và luồng hai bước trên iPhone.

Checklist:

1. Mở Demo: bước đầu chỉ có hồ sơ mẫu, hai bài và nút Tiếp tục; thẻ được chọn có dấu đánh dấu, chữ dễ đọc và nút không bị che.
2. Chọn hồ sơ/bài thứ hai → Tiếp tục: đúng tên và bài ở bước chạy. Đổi hồ sơ hoặc bài kiểm tra quay về bước chọn, giữ lựa chọn; chuyển bước cuộn về đầu.
3. Xem chuyển động mẫu và chạy Demo: vẫn 3 giây chuẩn bị, 30 giây thực hiện, pause/resume/hủy; camera không xuất hiện. Hai bài tài khoản vẫn có hướng dẫn đầy đủ và camera tùy chọn như trước.
4. Thêm một lượt có ghi chú → Về hướng dẫn → Các lượt đã thử: đúng hồ sơ/bài/trạng thái/thời lượng/ghi chú. Thu gọn/mở lại được. Xóa danh sách → Giữ lại không đổi; xác nhận chỉ xóa lượt demo.
5. Hướng dẫn: thử cả 4 nhóm, mở/đóng các mục; đổi nhóm không giữ chủ đề cũ. Nội dung dài đọc được, Mở Demo và Soạn phản hồi mở đúng màn.
6. Mở từ đăng nhập/xem trước, Trang chủ và Cài đặt: Back/Thoát hoạt động. Thoát Demo rồi mở lại danh sách trống; hồ sơ/lịch sử/logo tài khoản không đổi.
7. Tăng cỡ chữ, thử màn nhỏ, mở bàn phím ở ghi chú demo: các thẻ tự cao, không cắt chữ, cuộn tới nút được. Chạy thử ngoại tuyến khi đã mở được ứng dụng.

## Sắp lại giao diện Cài đặt · 14/11/2026

Người dùng báo PASS phần Báo lỗi và góp ý, đồng thời yêu cầu Cài đặt dễ nhìn hơn; không suy rộng thành đã nghiệm thu giao diện Cài đặt mới.

Thay các card văn bản dài bằng thẻ tài khoản ở đầu và nhóm hàng thao tác Hỗ trợ và trải nghiệm, Dữ liệu trên thiết bị, Đăng xuất. Mỗi hàng có tiêu đề, một mô tả ngắn, dấu điều hướng; cả hàng bấm được. Nội dung lưu trữ/camera/demo đặt trong mục mở/thu gọn. Giữ cảnh báo dữ liệu giả lập/chưa đồng bộ và giới hạn không chẩn đoán ở dạng ngắn. Chiều rộng nội dung tối đa 600 px, không cố định chiều cao hàng hoặc số dòng để hỗ trợ chữ lớn.

Hai thao tác đăng xuất nằm cùng nhóm: Đăng xuất có mô tả giữ dữ liệu, Xóa dữ liệu và đăng xuất dùng chữ đỏ và mô tả xóa vĩnh viễn. LocalDataRemoval đổi phần trình bày sang SettingsRow, giữ nguyên đọc số lượng/Alert/guard/transaction/signOut. Không xóa dữ liệu trong quá trình triển khai; không đổi schema, API hay dependency. Chế độ xem trước ẩn Thùng rác và hai thao tác dành cho tài khoản.

Kiểm tra mã: 70/70 test hiện có PASS, lint/typecheck và diff check PASS. Export Hermes iOS PASS (1.348 modules, khoảng 3,7 MB). Các kiểm tra này chưa chứng minh bố cục, vùng bấm hoặc chữ lớn trên thiết bị; UI Cài đặt mới chưa được người dùng nghiệm thu.

Checklist giao diện mới:

1. Mở Cài đặt trên iPhone: thẻ tên/email ở đầu, nhóm rõ, chữ dễ đọc và cuộn mượt.
2. Bấm thẻ tài khoản: mở Hồ sơ; quay lại không lỗi. Tên/email dài vẫn hiển thị, không chồng dấu điều hướng.
3. Hướng dẫn, Báo lỗi và góp ý, Thử demo: cả hàng mở đúng màn và Back về đúng Cài đặt.
4. Thùng rác mở đúng; Cách lưu và bảo vệ dữ liệu mở/thu gọn được, chữ và nút không bị cắt.
5. Nhóm Đăng xuất có hai dòng dễ phân biệt. Bấm Đăng xuất → Ở lại: dữ liệu không đổi; nếu đăng xuất thật rồi vào lại vẫn giữ dữ liệu.
6. Dòng đỏ Xóa dữ liệu và đăng xuất vẫn mở xác nhận đúng email/số lượng. Chọn Giữ lại: không xóa gì; không cần xóa lại dữ liệu để kiểm tra giao diện.
7. Chế độ xem trước không có thao tác xóa/Thùng rác; đường đăng nhập hoạt động. Tăng cỡ chữ: mọi hàng tự cao thêm, cuộn tới cuối được.

## Báo lỗi và góp ý · 11/11/2026

Ngày 14/11/2026, người dùng xác nhận “pass” trước khi yêu cầu sửa UI Cài đặt. Ghi nhận chức năng phản hồi PASS theo báo cáo người dùng; chưa có kết quả riêng từng mục hoặc log/video đối chiếu.

FR-41: thêm /feedback từ Cài đặt và Hướng dẫn, cho tài khoản đã đăng nhập hoặc xem trước. Tái sử dụng AccountScreen/AccountField để có bàn phím/cuộn và kiểu chữ nhất quán. Hai loại Báo lỗi và Góp ý; tiêu đề/mô tả bắt buộc, Báo lỗi thêm các bước tái hiện bắt buộc. Giới hạn tiêu đề 100, mô tả 1.200, bước 1.500, mong đợi 600 ký tự; validation ở domain và maxLength UI. Góp ý không bắt buộc bước/mong đợi.

Sau Xem lại, chuyển sang bản văn bản có thể chọn/sao chép trước khi mở Share.share. Không có người nhận mặc định, hộp thư hỗ trợ, lệnh gửi HTTP hoặc lưu bản soạn. Đóng share sheet không được diễn đạt thành đã gửi/đã nhận. Người dùng có thể chỉnh sửa (giữ bản soạn), xóa với xác nhận hoặc tắt thông tin đính kèm. Tự đính kèm chỉ version app từ Constants.expoConfig.version và Platform OS/version theo whitelist, không dump config, user/email/token/DB. Cảnh báo không nhập bí mật và dữ liệu bệnh nhân; đây không phải bộ tự động phát hiện/ẩn bí mật do người dùng gõ.

Bản soạn chỉ trong bộ nhớ route, key theo tài khoản/xem trước để tránh dùng lại khi đổi tài khoản. Guard focus/generation chặn cập nhật từ share promise/xác nhận xóa cũ; lock chặn mở share trùng. Khi chuyển form/xem lại, ScrollView được remount để về đầu nội dung; nội dung form vẫn giữ. Không thêm dependency, quyền hoặc schema. Chưa nghiệm thu iPhone.

70/70 test tự động PASS trên bản cuối, gồm 6 ca mới: trường bắt buộc theo loại, ranh giới độ dài, tiếng Việt/nhiều dòng, whitelist metadata và bỏ thông tin khi opt-out, chuẩn hóa CR/control character không mutate draft, giới hạn metadata/malformed values. Lint/typecheck và diff check PASS; export Hermes iOS PASS (1.347 modules, khoảng 3,7 MB). Cần kiểm tra native Share, Copy và bàn phím trên thiết bị.

Checklist:

1. Trang chủ → Cài đặt và hỗ trợ → Báo lỗi và góp ý (dưới lối vào Demo); Hướng dẫn cũng có nút Soạn báo lỗi hoặc góp ý. Màn mở được khi đăng nhập và xem trước.
2. Chọn Báo lỗi, để trống rồi Xem lại: báo ô thiếu. Nhập tiêu đề/mô tả nhưng thiếu bước: chưa sang xem lại. Điền đủ thì xem được.
3. Chọn Góp ý, nhập tiêu đề/mô tả, bỏ bước/mong đợi: xem lại được, nội dung và tiếng Việt đúng. Chỉnh sửa nội dung giữ các ô đã nhập; thay đổi phải hiện trong lần xem lại tiếp theo.
4. Bật thông tin ứng dụng: preview chỉ có phiên bản/OS. Quay lại tắt: preview không còn mục thông tin ứng dụng; không tự kèm email, ID, hồ sơ hoặc lịch sử.
5. Chia sẻ phản hồi: mở bảng chọn. Đóng/hủy không hiện đã gửi thành công và giữ bản soạn. Chạm giữ bản xem lại → Sao chép rồi dán vào Ghi chú để kiểm tra đủ văn bản; không cần gửi cho người khác.
6. Xóa nội dung → Giữ lại: không đổi. Xóa và xác nhận: form trống. Back ra Cài đặt rồi mở lại: bản soạn cũ không còn; hồ sơ/lịch sử/logo không đổi.
7. Thử mô tả nhiều dòng, nhập sát giới hạn, mở bàn phím và tăng cỡ chữ: cuộn tới ô/nút được, không chồng/cắt nội dung. Tắt mạng vẫn soạn/xem lại được; việc gửi qua đích chia sẻ phụ thuộc ứng dụng đích.

## Tùy chọn xóa dữ liệu khi đăng xuất · 11/11/2026

Người dùng xác nhận “đã pass” sau khi được hướng dẫn vị trí mục Dọn dữ liệu khi đăng xuất trong Cài đặt. Ghi nhận phần này PASS theo báo cáo người dùng trên thiết bị; người dùng chưa nêu riêng kết quả từng mục 1–7 hoặc cung cấp log/video đối chiếu.

Thêm LocalDataRemoval trong Cài đặt cho tài khoản đăng nhập trên điện thoại; không hiển thị ở xem trước/web. Nút riêng Đăng xuất và xóa dữ liệu… đọc số lượng hồ sơ đang dùng/thùng rác, mọi phiên kể cả không gắn hồ sơ và logo theo owner, rồi hiện xác nhận có email. Giữ lại/hủy không ghi dữ liệu. Đăng xuất thông thường, timeout và đăng xuất từ Hồ sơ vẫn giữ dữ liệu.

Khi xác nhận, AuthProvider dùng khóa xử lý đăng xuất hiện có và overlay chặn thao tác; kiểm tra owner hiện tại trước/sau các lần await trong transaction. Xóa test_sessions, patients, report_branding theo owner bằng withExclusiveTransactionAsync; không dựa vào cascade vì connection mới không kế thừa PRAGMA foreign_keys. Lỗi/owner thay đổi trong transaction rollback toàn bộ, dừng yêu cầu đăng xuất này và trả thông báo để kiểm tra lại. Chỉ sau khi dọn dữ liệu thành công mới khóa/xóa phiên đăng nhập theo luồng cũ. Nếu lỗi kết thúc phiên sau khi dữ liệu đã xóa, thông báo phân biệt dữ liệu cục bộ đã xóa và phiên đã khóa.

Không xóa Supabase user/metadata, dữ liệu tài khoản khác, PDF người dùng đã xuất hoặc toàn bộ thư mục cache dùng chung không gắn owner. Đây là xóa logic các bản ghi ứng dụng, không tuyên bố secure erase file SQLite/WAL hoặc xóa byte không thể phục hồi. Không đổi schema, không thao tác dữ liệu thật trong quá trình triển khai. Phần này đã được người dùng báo PASS; phạm vi từng tình huống xem ghi nhận phía trên.

64/64 test tự động PASS, gồm 5 ca mới cho đếm owner, xóa active/trash/unlinked/logo, giữ nguyên tài khoản khác, xóa lặp, rollback khi lỗi ở giữa và guard owner trước/giữa/cuối transaction, từ chối owner trống trước khi mở DB. Lint/typecheck và diff check PASS; export Hermes iOS PASS (1.344 modules, khoảng 3,7 MB). Các kiểm tra này chưa xác minh xác nhận native, chuyển màn đăng xuất hoặc lưu bền sau mở lại trên iPhone.

Checklist (dùng dữ liệu giả lập có thể xóa):

1. Chuẩn bị tài khoản A có hồ sơ đang dùng, một hồ sơ trong thùng rác, lượt gắn hồ sơ và không gắn hồ sơ, ghi chú/logo. Tài khoản B có dữ liệu mẫu riêng. Lưu một PDF từ A vào Tệp để đối chiếu.
2. Đăng xuất thông thường từ Cài đặt hoặc Hồ sơ, đăng nhập A lại: hồ sơ, thùng rác, lịch sử và logo vẫn còn.
3. Cài đặt → Đăng xuất và xóa dữ liệu…: email/số lượng đúng. Chọn Giữ lại: vẫn đăng nhập và dữ liệu không đổi.
4. Mở lại và xác nhận Xóa và đăng xuất: về đăng nhập. Đăng nhập A lại: Bệnh nhân, Thùng rác, Lịch sử trống; logo không còn. Tên/chuyên khoa/cơ sở Supabase vẫn còn.
5. Đăng nhập B: hồ sơ, lịch sử, ghi chú, thùng rác và logo của B còn nguyên.
6. Mở lại app/đăng nhập A: dữ liệu đã xóa không trở lại. Tạo hồ sơ, chạy/lưu phiên và chọn logo mới vẫn hoạt động; dữ liệu mới được giữ khi đăng xuất thông thường.
7. PDF đã lưu trong Tệp trước khi xóa vẫn mở được. Chế độ xem trước không có lựa chọn xóa dữ liệu; Demo vẫn chạy tách biệt. Chữ lớn và màn hình nhỏ vẫn cuộn tới nút và đọc được xác nhận.

## Hướng dẫn trực quan trước bài · 11/11/2026

Người dùng xác nhận “đã pass 1-7” theo checklist bên dưới trên iPhone: bố cục, hai loại chuyển động mẫu, tự dừng/Dừng thủ công, vòng đời, Giảm chuyển động, lượt chạy thật và Demo/chữ lớn. Ghi nhận 7/7 PASS theo báo cáo người dùng; chưa có log/video đối chiếu độc lập.

FR-14 cho hai stimulus hiện hỗ trợ: thêm TestPreparation dùng chung cho bài thật và Demo, nội dung riêng theo loại bài, sơ đồ trái/giữa/phải và nút xem mẫu 8 giây. Smooth Pursuit dùng Animated native driver tuyến tính; Horizontal Saccades đổi vị trí tức thời mỗi 800 ms trong mẫu. Đây là chuyển động minh họa, không phải protocol lâm sàng và không đổi thông số lượt chạy 30 giây hiện có. Mẫu không có camera, thao tác lưu hoặc dữ liệu phiên.

Mẫu không tự phát; dừng khi người dùng bấm Dừng, hết 8 giây, rời route, AppState mất active/blur, mở chọn bệnh nhân/thử camera hoặc bắt đầu lượt chạy. Cleanup dọn timer và animation. Giảm chuyển động bật (hoặc chưa đọc được tùy chọn) chỉ hiển thị hình tĩnh và mô tả; cập nhật tùy chọn trong lúc phát sẽ dừng mẫu. Hướng dẫn chuẩn bị đặt trước thiết lập bệnh nhân/camera và nút Bắt đầu; bỏ hai card hướng dẫn trùng phía dưới. Màn Demo có chỉ dẫn riêng, không gợi ý lưu lịch sử tài khoản.

59/59 kiểm tra tự động hiện có PASS, xác minh các luồng dữ liệu trước đó. Lint/typecheck PASS sau khi dùng state khởi tạo Animated.Value ổn định theo quy tắc React compiler và khai báo kiểu timer/animation. Export Hermes iOS PASS (1.341 modules, khoảng 3,7 MB), diff check PASS. Không cài dependency hoặc đổi schema. Không thêm test chụp lại cấu trúc UI; chuyển động, vòng đời và bố cục đã được người dùng xác nhận PASS theo checklist thiết bị.

Checklist:

1. Kiểm tra → Smooth Pursuit: hướng dẫn dễ đọc, sơ đồ trái/giữa/phải rõ; cuộn tới phần chọn bệnh nhân/camera và Bắt đầu, không bị che nút hoặc cắt chữ.
2. Xem chuyển động mẫu: chấm đi liên tục; tự dừng sau khoảng 8 giây. Xem lại rồi Dừng: chấm trở về giữa, có thể phát lại.
3. Horizontal Saccades: chấm đổi vị trí ngay, không trượt như Smooth Pursuit; mô tả đúng và tự dừng.
4. Đang xem mẫu → chuyển ứng dụng, quay lại hoặc Back/mở lại bài: mẫu đã dừng, không tự chạy lại. Mở chọn bệnh nhân hoặc Thử camera cũng dừng mẫu.
5. Bật Giảm chuyển động trong Cài đặt điện thoại → Trợ năng → Chuyển động: xem mẫu bị khóa, hình tĩnh/mô tả vẫn đọc được. Tắt tùy chọn thì có thể xem mẫu lại.
6. Chạy một lượt thật: vẫn chuẩn bị 3 giây, thực hiện 30 giây, tạm dừng/tiếp tục/hủy, camera tùy chọn và lưu lịch sử như trước. Chỉ xem mẫu không tạo thêm phiên lịch sử.
7. Demo: hướng dẫn hoạt động cho cả hai bài; thông báo không camera/không lưu tài khoản đúng. Thử chữ lớn trên điện thoại: nội dung và nút vẫn cuộn được, không chồng nhau.

## Logo cơ sở và người lập PDF · 11/11/2026

Người dùng xác nhận “đã pass” sau checklist 1–7 về chọn/đổi/hủy chọn logo, lưu bền sau mở lại, thông tin người lập và logo trong PDF, chia sẻ/lưu file, xác nhận gỡ và cách ly tài khoản. Ghi nhận 7/7 PASS theo báo cáo người dùng trên iPhone; chưa có log/video đối chiếu độc lập.

Thêm chọn/đổi/gỡ logo trong Thông tin tài khoản; gỡ có xác nhận, hủy picker giữ logo cũ. Dùng bộ chọn ảnh hệ thống, không mở camera; giữ tỷ lệ, thu nhỏ cạnh dài tối đa 192 px, PNG giữ nền trong suốt. Chỉ lưu raster data URI tối đa 220.000 ký tự. SQLite schema v5 thêm bảng report_branding theo owner_id, không sửa hồ sơ/lịch sử. Logo được lưu ngay khi chọn, riêng trên thiết bị; không upload Supabase. Các trường tên/chuyên khoa/cơ sở vẫn cần Lưu thay đổi.

PDF nhúng logo dạng data URI, không đọc đường dẫn ảnh hoặc tải ảnh từ mạng; thêm mục Người lập báo cáo từ metadata tài khoản đã lưu hiện tại. Khi chưa có thông tin, hiển thị Chưa cung cấp; vẫn giữ nhãn mô phỏng. Nội dung văn bản được escape và logo ngoài whitelist bị loại. Giữ nguyên URI PDF native cho luồng chia sẻ. Hủy/đổi tài khoản khi đang chọn ảnh được chặn bằng lifecycle guard; file tạm chỉ dọn nếu thuộc cache của ứng dụng.

Kiểm tra tự động: 59/59 PASS, gồm migration additive, thay thế/gỡ và cách ly logo giữa chủ sở hữu, validation data URI/kích thước, escape thông tin người lập và fallback PDF. Lint và typecheck PASS; export Hermes iOS PASS (1.340 modules, khoảng 3,6 MB), diff check PASS. Kiểm tra dependency bằng map SDK cục bộ báo phù hợp (mạng bị tắt khi check). Chọn ảnh, UI và PDF có logo đã được người dùng xác nhận PASS theo checklist bên dưới.

Checklist thiết bị:

1. Mở Thông tin tài khoản, chọn logo từ ảnh: ảnh đúng tỷ lệ, có thông báo đã lưu, nội dung/nút cuộn rõ khi màn hình nhỏ.
2. Đổi logo nhưng hủy bộ chọn ảnh: logo cũ còn nguyên, nút hoạt động lại; chọn ảnh khác thành công thì thay logo.
3. Thoát và mở lại ứng dụng: logo, hồ sơ và lịch sử cũ vẫn còn.
4. Điền tên/chuyên khoa/cơ sở, nhấn Lưu thay đổi. Mở một phiên đã lưu → Xem / in báo cáo: có logo và đúng thông tin đã lưu; vẫn có nhãn mô phỏng.
5. Xuất / chia sẻ PDF → Lưu vào Tệp và mở lại: logo và tiếng Việt đúng, ghi chú dài không bị cắt/chồng trang. Thử lại ngoại tuyến khi vẫn còn phiên đăng nhập.
6. Gỡ logo → Giữ lại: không đổi. Gỡ logo và xác nhận: mất logo, PDF mới không có logo, PDF đã lưu vẫn giữ nguyên.
7. Đăng xuất rồi đăng nhập tài khoản khác: không thấy logo tài khoản trước; trở lại tài khoản cũ có đúng trạng thái riêng. Không có logo vẫn xuất PDF được.

## Đồng bộ giao diện tài khoản · 11/11/2026

Người dùng xác nhận “ui pass 1-7” theo checklist trong chat: bố cục/bàn phím/cuộn, validation đăng ký, đăng ký và xác nhận email đúng, cooldown gửi lại/mã sai, khôi phục và đặt mật khẩu mới, cập nhật hồ sơ/Trang chủ, Back/đăng xuất và lối vào Demo/Hướng dẫn. Ghi nhận 7/7 mục PASS theo báo cáo người dùng trên thiết bị; chưa có log/video đối chiếu độc lập.

Đăng ký/xác nhận email, quên mật khẩu/đặt mật khẩu mới và hồ sơ tài khoản dùng AccountScreen/AccountField/AccountLink chung theo phong cách login đã được người dùng đánh giá tốt: nền sáng, nội dung tối đa 440 px, input có focus, một CTA chính và liên kết phụ; header Back vẫn giữ, reset vẫn khóa back/gesture như trước. Keyboard inset iOS/KeyboardAvoidingView Android, hỗ trợ cuộn và chữ lớn.

Đăng ký có chỉ báo 2 bước, giữ đường Tôi đã có mã. Quên mật khẩu chia bước nhận mã/xác nhận, giữ đường Tôi đã có mã khôi phục; xác nhận thành công đi bước 3 đặt mật khẩu mới. Gửi lại hiển thị đếm ngược 60 giây, nút bị khóa trong cooldown; kiểm tra deadline gốc vẫn giữ trong handler. OTP tiếp tục hỗ trợ mã 6–10 chữ số qua validator hiện có/autofill. Không đổi API Supabase, cấu hình OTP hoặc chính sách phiên. Thông báo cấu hình thiếu được diễn đạt gọn cho người dùng.

Profile có avatar chữ cái, email read-only và nhãn xác nhận, nhóm tên/chuyên khoa/cơ sở làm việc, một nút Lưu thay đổi; logout là liên kết phụ có hộp xác nhận như trước. Next/Go dùng ref chuyển ô hoặc submit; chặn thao tác trong khi form đang xử lý. Không bổ sung chức năng upload ảnh/logo hoặc chỉnh email.

16/16 ca Auth domain hiện có PASS, typecheck/lint PASS ở lần kiểm tra mã. Các ca này không chứng minh email thực tế, countdown, autofocus hay layout native. Chưa nghiệm thu các màn UI mới trên iPhone.

Export Hermes iOS PASS (1.327 modules, khoảng 3,6 MB), git diff --check PASS. Không cài thêm dependency hoặc đổi schema dữ liệu.

Checklist:

1. Từ login mở Đăng ký, Quên mật khẩu và quay lại: header Back đúng, tiêu đề/input/nút không chồng status bar; cuộn khi bàn phím mở hoặc chữ lớn.
2. Đăng ký: thử email sai, tên trống, mật khẩu dưới 8 ký tự hoặc nhập lại sai; phải có lỗi, không qua bước xác nhận. Next qua các ô, Ẩn/Hiện hoạt động.
3. Dùng email thử chưa đăng ký, tạo tài khoản → bước 2; nhập mã đúng từ email → vào Trang chủ. Đường Đã có mã vẫn cho nhập email và mã.
4. Sau yêu cầu gửi mã, Gửi lại đếm ngược và khóa 60 giây; hết đếm ngược mới dùng được. Có thể thử mã sai để xác nhận hiển thị lỗi và không vượt xác minh.
5. Quên mật khẩu: email tài khoản → Gửi mã → bước 2 → mã đúng → bước 3. Thử mật khẩu không khớp, rồi đặt đúng; trở về login, đăng nhập bằng mật khẩu mới. Hủy khôi phục phải về login, không mở phiên chính bằng session recovery.
6. Profile: đúng email và avatar, sửa tên/chuyên khoa/cơ sở → Lưu thay đổi; ra/vào lại và kiểm tra dữ liệu còn, Trang chủ cập nhật tên.
7. Profile Đăng xuất → Ở lại giữ phiên; xác nhận đăng xuất về login. Kiểm tra lại Demo/Hướng dẫn vẫn mở được từ login.

## Thùng rác và khôi phục bệnh nhân · 11/11/2026

Người dùng xác nhận “1-7 pass” theo checklist trong chat: hủy chuyển thùng rác; chuyển và ẩn hồ sơ/phiên; xem thông tin thùng rác; khôi phục nguyên hồ sơ/lịch sử/ghi chú; lưu bền và cách ly tài khoản; giữ mã unique trong thùng rác; hủy hoặc xác nhận xóa vĩnh viễn đúng phạm vi. Ghi nhận 7/7 mục PASS theo người dùng trên thiết bị. Hạn 30 ngày chỉ được kiểm tra bằng clock giả trong test, không suy rộng xác nhận UI thành đã chờ đủ 30 ngày trên iPhone; chưa có log/video đối chiếu độc lập.

Migration v3→v4 thêm deleted_at INTEGER nullable trong transaction, không rebuild/xóa bảng. Xóa hồ sơ trước đây được đổi thành chuyển thùng rác có xác nhận; giữ nguyên ID, tên/mã/ngày sinh/giới tính/ghi chú và các phiên. Hồ sơ/mã vẫn unique trong thùng rác; tạo mới trùng mã phải đổi mã hoặc khôi phục hồ sơ cũ.

Main list/search/patient picker/get/update chỉ dùng deleted_at IS NULL. Session list/get/updateNotes/save kiểm tra bệnh nhân còn active để không xem/sửa/lưu/so sánh hoặc xuất PDF với hồ sơ đã đưa vào thùng rác; phiên không gắn hồ sơ vẫn bình thường. Khôi phục đặt deleted_at NULL, cập nhật updated_at và giữ nguyên các phiên/ghi chú. Mọi thao tác lọc owner. Danh sách bệnh nhân refresh khi focus để thấy hồ sơ vừa khôi phục.

Thùng rác mở từ tab Bệnh nhân hoặc Cài đặt, phân trang 30, hiển thị ngày xóa/hạn khôi phục/số phiên, khôi phục và xóa vĩnh viễn có xác nhận riêng. Permanent delete chỉ áp dụng deleted_at NOT NULL, cascade FK xóa phiên của hồ sơ đó. Không có nút dọn toàn bộ thùng rác. Không phục hồi được hồ sơ đã hard-delete trước bản cập nhật này.

Hạn chính xác 30×24 giờ theo thời gian thiết bị: restore chỉ nhận deleted_at > now−30 ngày. Dọn expired ≤ cutoff theo owner khi đăng nhập/khôi phục session, app foreground hoặc khi mở danh sách/tạo bệnh nhân/thùng rác. Không có background job khi app đóng, không bảo đảm dọn đúng thời khắc hết hạn; đổi đồng hồ thiết bị có thể ảnh hưởng hạn. Nếu maintenance nền lỗi, giữ dữ liệu và thử lại khi mở thùng rác. Mở lại app không xác thực thì không dọn dữ liệu tài khoản khác.

7/7 ca patientTrash PASS với SQLite Node thực: migration giữ dữ liệu/FK; soft-delete giữ phiên nhưng chặn read/write/save; restore trước hạn 1ms; đúng 30 ngày không restore và cascade đúng owner, giữ active/anonymous; chặn owner khác; permanent chỉ nhận trash; delete lặp không gia hạn và giữ mã unique. Không thay thế nghiệm thu migration/native trên iPhone.

Kiểm tra tổng: `npm test` 56/56 PASS, lint/typecheck và git diff --check PASS; export Hermes iOS PASS (1.326 modules, khoảng 3,6 MB). Không cài thêm dependency. Maintenance hết hạn là tác vụ toàn ứng dụng theo tài khoản, có thể chạy khi quay lại app đang ở Demo; luồng nghiệp vụ demo vẫn không đọc/ghi hồ sơ hoặc phiên tài khoản.

Checklist iPhone (chưa nghiệm thu):

1. Chọn hồ sơ giả đã có phiên/ghi chú. Bấm Chuyển vào thùng rác → Hủy: hồ sơ/lịch sử vẫn còn. Xác nhận chuyển: hồ sơ biến mất khỏi danh sách và tìm kiếm.
2. Lịch sử tổng/riêng không hiển thị phiên của hồ sơ đó; không chọn được hồ sơ trong bài mới. Hồ sơ khác và phiên không gắn hồ sơ vẫn còn.
3. Bệnh nhân → Thùng rác: thấy đúng hồ sơ, ngày xóa, hạn 30 ngày và số phiên.
4. Khôi phục: quay lại danh sách, tìm được hồ sơ; mở lịch sử/chi tiết và kiểm tra đúng phiên, ghi chú, ngày sinh/giới tính/mã cũ.
5. Chuyển hồ sơ vào thùng rác lần nữa, đóng/mở app: còn trong thùng rác. Thử tài khoản khác/preview không thấy thùng rác của tài khoản ban đầu.
6. Trong thùng rác → Xóa vĩnh viễn → Giữ lại: hồ sơ còn. Xác nhận Xóa vĩnh viễn trên một hồ sơ giả: hồ sơ và phiên liên quan mất hẳn; hồ sơ khác/anonymous không mất.
7. Thử tạo hồ sơ mới trùng mã của hồ sơ đang trong thùng rác: báo trùng và nhắc khôi phục/đổi mã. Khôi phục hồ sơ cũ vẫn thành công.

Hạn 30 ngày đã kiểm thử bằng clock giả trong test, không yêu cầu đổi đồng hồ iPhone hoặc chờ 30 ngày để nghiệm thu UI.

## So sánh hai lượt kiểm tra

Ngày 11/11/2026, người dùng xác nhận “1-7 pass” theo checklist so sánh trong chat: chuẩn bị phiên, chọn/bỏ chọn đủ hai lượt, chặn khác bệnh nhân/bài/không gắn hồ sơ, hiển thị đối chiếu đúng, cập nhật ghi chú khi quay lại, thoát chế độ chọn và sử dụng từ lịch sử riêng của bệnh nhân. Ghi nhận 7/7 mục PASS theo người dùng trên thiết bị; chưa có log/video đối chiếu độc lập. Không suy rộng sang các tình huống ngoài checklist đã xác nhận.

Từ Lịch sử tổng hoặc lịch sử bệnh nhân, bấm So sánh hai lượt. Chọn/bỏ chọn tối đa hai phiên cùng patient_id và test_id; không chọn phiên không gắn hồ sơ vì không xác định được cùng người. Chọn lượt khác điều kiện sẽ bị chặn và có giải thích; thanh số lượng/nút so sánh nằm riêng dưới danh sách. Tải lại hoặc rời/đổi màn hình xóa lựa chọn, không thay đổi bản ghi.

Route compare được bảo vệ đăng nhập, tải cả hai bản ghi bằng owner hiện tại; từ chối ID trùng/thiếu/khác owner/đã xóa và kiểm tra lại điều kiện phía logic. Sắp lượt trước/sau theo ended_at, ID làm tiêu chí phụ khi thời gian bằng nhau. Hiển thị trạng thái, thời gian thực hiện, tình trạng camera, ghi chú đầy đủ và liên kết chi tiết từng lượt. Quay lại từ chi tiết sẽ đọc lại dữ liệu, nên ghi chú vừa lưu được cập nhật. Chênh lệch giây chỉ phản ánh thời gian thực hiện, không suy luận cải thiện/suy giảm sức khỏe, không có metrics mắt.

5/5 ca comparison PASS: thứ tự chọn không ảnh hưởng trước/sau và delta; chặn trùng/không hồ sơ/khác bệnh nhân/bài; tie-break và ngày lỗi; hai lookup đều scoped owner và missing/foreign bị chặn; chưa đăng nhập hoặc tham số sai không truy vấn DB. Kèm 6/6 ca repository PASS với SQLite Node về scope, cascade, persistence và query. Chưa nghiệm thu UI native trên iPhone.

Lint/typecheck và git diff --check PASS; export Hermes iOS PASS (1.324 modules, khoảng 3,6 MB). Không thay schema DB hoặc thêm dependency.

Checklist iPhone:

1. Chuẩn bị cùng một bệnh nhân giả có ít nhất hai phiên Smooth Pursuit: một phiên hoàn tất 30 giây và một phiên hủy khoảng 5–10 giây, ghi chú khác nhau. Có thể dùng phiên đã lưu trước.
2. Lịch sử → So sánh hai lượt: nút so sánh chưa bật khi mới chọn 0 hoặc 1 phiên. Chọn đủ hai phiên phù hợp: hiện 2/2 và nút bật. Bấm lượt đã chọn để bỏ chọn, rồi chọn lại.
3. Thử lượt khác bệnh nhân, Horizontal Saccades, hoặc không gắn hồ sơ: không chọn chung được và có giải thích; không chọn được phiên thứ ba khi đã đủ hai.
4. Mở so sánh: đúng bệnh nhân/bài, lượt trước/sau theo ngày kết thúc, trạng thái/thời lượng/camera/ghi chú đúng. Hủy ngắn hơn không được gọi là cải thiện sức khỏe.
5. Mở chi tiết một lượt, sửa và lưu ghi chú rồi Back: so sánh có ghi chú mới. Hủy chọn so sánh trong Lịch sử: chạm phiên lại mở chi tiết như trước.
6. Vào Bệnh nhân → hồ sơ → lịch sử riêng và thử chọn hai lượt tương tự. Kéo tải lại hoặc rời màn hình: lựa chọn cũ được bỏ, dữ liệu phiên không mất.
7. Ngoại tuyến thử so sánh phiên đã lưu. Đăng xuất/preview/tài khoản khác không xem được hai phiên của tài khoản cũ.

## Giao diện đăng nhập gọn hơn

Sau khi xác nhận phần Demo/Cài đặt pass, người dùng yêu cầu login clean và giống sản phẩm thực tế hơn. Login dùng SafeAreaView riêng, ẩn header chỉ tại login, có nhận diện ứng dụng gọn, một nút chính Đăng nhập; Quên mật khẩu/Đăng ký là liên kết phụ, Demo là thẻ phụ và Hướng dẫn/Xem trước là liên kết nhỏ. Giữ đường tới xác nhận email qua Đăng ký. Màn đăng ký/quên/reset vẫn giữ header của chúng.

Giữ validation/Supabase flow và thông báo lỗi; chặn submit khi đang xử lý. Email Next chuyển focus sang mật khẩu, Go gửi form; giữ ẩn/hiện và autofill. Field bổ sung ref và style khung tùy chọn, các nơi khác dùng mặc định. Safe area đầy đủ khi login không có header; iOS dùng keyboard inset của ScrollView, Android dùng KeyboardAvoidingView, cho cuộn/chữ lớn thay vì chiều cao cố định. Chưa nghiệm thu bố cục thực tế trên iPhone.

Checklist: login không chồng status bar; bàn phím không che input/nút và Next chuyển đúng ô; email sai/mật khẩu trống báo lỗi; đăng nhập đúng về Trang chủ; Quên mật khẩu/Đăng ký và Back đúng; Demo/Hướng dẫn/Xem trước vào được khi chưa đăng nhập; kiểm tra chữ lớn/cuộn.

Kiểm tra mã PASS: lint/typecheck, 16/16 ca Auth hiện có, git diff --check; export Hermes iOS PASS (1.322 modules, khoảng 3,6 MB). Các ca Auth kiểm tra validation/storage/domain, không phải bố cục hoặc bàn phím native. Không thêm dependency.

## Hướng dẫn, Demo và Cài đặt · 10/11/2026

Người dùng xác nhận “pass” sau checklist Demo/Cài đặt 1–7 và yêu cầu tiếp chỉnh giao diện login. Ghi nhận phần Demo/Cài đặt PASS theo báo cáo người dùng; chưa có log/video đối chiếu độc lập.

Thêm /guide với quy trình đăng ký/hồ sơ/bài/camera/lưu phiên/PDF, quyền riêng tư và xử lý lỗi. Có nút lần đầu sử dụng ngay ở login; guide không tự ghi cờ onboarding. Cài đặt chia theo tài khoản, hướng dẫn/demo, camera, dữ liệu và thông tin ứng dụng; không có công tắc ngôn ngữ giả hoặc thao tác xóa dữ liệu tài khoản mới. Đăng xuất tại Cài đặt có xác nhận.

Demo /demo dùng hai hồ sơ bất biến có nhãn mẫu, giới tính Nam/Nữ, chạy hai stimulus bằng cùng player nhưng chế độ demo loại owner và khả năng camera. Không mở PatientPicker, CameraTrial, RunCamera, SessionSave hay PDF. Các dịch vụ DB/file không được gọi trong luồng demo; hook quyền camera dùng chung có thể đọc trạng thái quyền, không yêu cầu hoặc bật camera. Auth/session hiện có vẫn do AuthProvider quản lý như bình thường. Danh sách tối đa 10 lượt và ghi chú demo chỉ là state React, không có persistence. Đóng route demo/khởi động lại làm mất danh sách; background tạm thời vẫn giữ bộ nhớ. Làm lại demo có xác nhận và không tác động dữ liệu tài khoản.

Lối vào: login có Thử demo/Hướng dẫn/Mở trang chủ chưa đăng nhập; người đã đăng nhập dùng lối tắt Trang chủ hoặc Cài đặt. Mở demo không đổi hoặc đăng xuất tài khoản; người chưa đăng nhập được mở vùng xem trước để vào demo. Có nút Thoát demo về Trang chủ để tránh kẹt nếu vào demo bằng replace từ login.

4/4 ca demoData PASS: demo không có owner/camera dù đăng nhập; fixture bất biến và giới tính chỉ Nam/Nữ; thêm metadata không sửa dữ liệu cũ; danh sách dedup và giới hạn 10 lượt/1.000 ký tự ghi chú. Đây là kiểm tra policy và bộ nhớ, không thay thế nghiệm thu UI hoặc chứng minh native không ghi file.

Kiểm tra tổng: `npm test` 44/44 PASS; lint/typecheck và git diff --check PASS. Export Hermes iOS PASS (1.322 modules, khoảng 3,6 MB). Không cài thêm dependency. README đã cập nhật để bỏ mô tả màn hình khung cũ và hướng dẫn cách vào Demo/Guide/Cài đặt.

Checklist iPhone (chưa nghiệm thu):

1. Từ login → Lần đầu sử dụng? Xem hướng dẫn: đọc/cuộn đủ các bước, mở demo và về Trang chủ được.
2. Chưa đăng nhập → Thử demo: chỉ có hai hồ sơ mẫu và hai bài; không có công tắc camera/chọn hồ sơ tài khoản/Lưu vào lịch sử tài khoản/xuất PDF.
3. Chạy Smooth Pursuit trong demo; thử pause/resume/hủy hoặc chờ hoàn tất, nhập ghi chú → Thêm vào danh sách demo → Về hướng dẫn, thấy đúng bài/tên/ghi chú. Thử Horizontal Saccades tương tự.
4. Bấm Làm lại demo → Giữ lại: danh sách còn. Làm lại và xác nhận: danh sách trống. Thêm lượt mới rồi Thoát demo; mở lại phải trống.
5. Đăng nhập, ghi nhớ hồ sơ và lịch sử hiện có; vào demo, chạy/thêm ghi chú rồi thoát. Tài khoản vẫn đăng nhập, hồ sơ/lịch sử chính không xuất hiện dữ liệu demo hoặc mất bản ghi cũ.
6. Vào Cài đặt → Thông tin tài khoản/Hướng dẫn/Demo, quay lại. Đăng xuất → Ở lại phải giữ phiên; xác nhận Đăng xuất về login. Đăng nhập lại vẫn còn dữ liệu cũ.
7. Ngoại tuyến mở demo/hướng dẫn (app đã tải), chạy bài; thử chữ lớn/cuộn/keyboard ghi chú. Quay lại một bài thường, chọn bệnh nhân và lưu phiên để xác nhận luồng đã pass trước vẫn hoạt động.

## PDF và chia sẻ · 10/11/2026

Sau bản sửa chia sẻ nguyên URI của Expo Print, người dùng xác nhận “đã oke” theo hướng dẫn test lại lỗi IMG_1038. Ghi nhận bản sửa chia sẻ PDF PASS theo báo cáo người dùng trên thiết bị. Không suy rộng xác nhận này thành nghiệm thu đầy đủ cả checklist PDF 1–7 (ghi chú dài/ngắt trang, các loại phiên, ngoại tuyến…) nếu chưa có xác nhận riêng; chưa có PDF/log mới đối chiếu độc lập.

Ảnh IMG_1038.HEIC ghi nhận shareAsync thất bại với “You don't have access to the provided file”. Sửa theo vùng quyền của Expo Go: dùng nguyên URI do Print.printToFileAsync trả về để share, bỏ bước chuyển/đổi tên sang Paths.cache/session-reports. File được dọn trong finally sau share sheet (hoặc khi share lỗi/rời màn hình), không xóa trước. Vì không đổi tên nên file lưu có thể mang tên tự sinh của Expo Print. Thư mục session-reports cũ vẫn được dọn khi xuất tiếp. Không đánh dấu chia sẻ native PASS cho đến khi người dùng kiểm tra lại.

Thêm 5 ca kiểm tra sharing flow: giữ nguyên URI native có percent-encoding; không xóa khi share còn chờ; share thất bại vẫn cleanup và giữ lỗi; rời màn hình trong lúc tạo không mở share nhưng dọn file; thiếu URI báo lỗi thay vì thành công giả. Backend là hàm giả lập; cần nghiệm thu quyền chia sẻ trên iPhone.

Thêm hai thao tác trên chi tiết phiên: Xem / in báo cáo qua native print dialog; Xuất / chia sẻ PDF tạo file cache rồi mở share sheet (người dùng tự chọn Lưu vào Tệp/AirDrop/ứng dụng nhận). shareAsync trả void, nên đóng bảng chia sẻ không được báo là đã gửi hoặc lưu. Đóng print preview không in được nhận diện là hủy bình thường, khác lỗi máy in.

Nội dung: tên/mã/ngày sinh/giới tính hiện tại của bệnh nhân (chỉ Nam/Nữ từ hồ sơ), bài, trạng thái completed/cancelled, thời gian thực hiện/bắt đầu/kết thúc kèm múi giờ thiết bị, camera và số đoạn đã xóa, ghi chú đã lưu, mã phiên/ngày tạo. Lượt không gắn hồ sơ và camera lỗi có nhãn riêng. Không có dữ liệu mắt hoặc kết luận y tế. HTML có UTF-8, escape mọi dữ liệu nhập, không tải tài nguyên mạng và có CSP. Ghi chú dài xuống dòng, không đặt chiều cao cố định.

Ghi chú chưa lưu chặn xuất để tránh nhầm bản nháp với dữ liệu DB. Sau lưu ghi chú, cập nhật snapshot trên màn hình rồi cho xuất. Lấy lại phiên và hồ sơ theo owner trước khi tạo, kiểm tra màn hình/tài khoản còn đúng trước khi mở bảng chia sẻ; mỗi lần chỉ chạy một export. Sau bản sửa IMG_1038, chia sẻ file với URI/tên tự sinh của Expo Print, không đổi tên hoặc chuyển thư mục. Xóa bản cache sau khi đóng share sheet; file do người dùng lưu vào Tệp/ứng dụng khác vẫn là bản độc lập. Lỗi xóa sẽ báo; chưa đảm bảo tự dọn file Expo Print nếu xóa thất bại hoặc native crash trước khi trả URI, không có quét toàn bộ cache.

Kiểm tra: 6/6 ca sessionReport PASS (nội dung tiếng Việt/ghi chú nhiều dòng, escape HTML, camera lỗi/lượt hủy, không gắn hồ sơ, ghi chú dài 1.000 ký tự, nhận diện đóng print preview). Đã xem ảnh render HTML mẫu trên Edge; đây không phải bằng chứng PDF tạo bởi iOS. Chưa kiểm thử native print/share trên iPhone.

Lint/typecheck và git diff --check PASS; export Hermes iOS PASS (1.317 modules, khoảng 3,5 MB). expo-print/expo-sharing được cài bằng Expo cho SDK 58; npm báo 10 moderate vulnerabilities, không chạy audit fix.

Checklist thiết bị:

1. Khởi động lại `npx expo start --clear`. Lịch sử → một phiên hoàn tất có bệnh nhân → Xem / in báo cáo. Kiểm tra đúng tên/mã/ngày sinh/giới tính, bài, thời gian và ghi chú, nhãn MÔ PHỎNG HỌC TẬP.
2. Đóng cửa sổ xem/in, không chọn máy in. Không được báo lỗi đỏ; nút xuất dùng lại được.
3. Xuất / chia sẻ PDF → Lưu vào Tệp → chọn thư mục và Lưu. Mở ứng dụng Tệp, mở PDF: đúng nội dung, dấu tiếng Việt rõ, không cắt chữ/chồng bảng hoặc trang trắng thừa. Cần kiểm tra tất cả các trang.
4. Sửa ghi chú nhưng chưa lưu: xuất bị chặn và có nhắc lưu. Lưu ghi chú, xuất lại: PDF có ghi chú mới. Thử ghi chú nhiều dòng và đủ 1.000 ký tự để kiểm tra ngắt trang.
5. Xuất PDF của lượt đã hủy, không gắn hồ sơ và camera lỗi (nếu có phiên mẫu): trạng thái/bệnh nhân/camera đúng, không hiển thị như hoàn tất ghi thành công.
6. Mở share sheet rồi Hủy/đóng: không báo đã gửi/lưu thành công; xuất lại vẫn được. Thử chia sẻ AirDrop/ứng dụng nhận nếu sẵn có, chỉ khi tự chọn người/đích nhận.
7. Thử ngoại tuyến: mở phiên đã lưu và xuất PDF được; dữ liệu lịch sử không thay đổi. Đăng xuất/tài khoản khác không có quyền mở phiên cũ để xuất.

Chỉ dùng hồ sơ giả lập. Tính năng PDF/chia sẻ chưa đánh dấu PASS trên thiết bị.

## Lưu phiên và lịch sử · 10/11/2026

Người dùng xác nhận “mục 1-7 pass” theo hướng dẫn nghiệm thu trong chat: (1) chọn bệnh nhân và lưu phiên, không lưu trùng; (2) xem chi tiết/sửa ghi chú; (3) lịch sử đúng bệnh nhân; (4) camera trong Horizontal Saccades và pause/resume; (5) hủy, xác nhận bỏ lượt chưa lưu; (6) phiên không gắn hồ sơ và lưu bền sau đóng/mở app; (7) cách ly tài khoản/preview và xóa hồ sơ kèm phiên đúng phạm vi. Ghi nhận 7/7 mục PASS theo báo cáo người dùng trên thiết bị; chưa kiểm tra độc lập bằng log/video. Các trường hợp lỗi ngoài checklist này không được suy rộng thành PASS.

Đã thêm chọn hồ sơ (tìm tên/mã, tối đa 200 kết quả) trước bài hoặc chạy không gắn hồ sơ. Sau completed/cancelled và khi camera hết busy, người dùng có thể ghi chú rồi Lưu vào lịch sử. Một ID riêng cho mỗi lượt, retry lưu không chèn trùng. Chạy lại/về hướng dẫn khi chưa lưu sẽ hỏi xác nhận bỏ. Phiên đang chạy không tự ghi vào DB nếu app bị đóng đột ngột.

SQLite v3 bổ sung test_sessions và FK composite owner_id/patient_id, bật foreign_keys trên connection. Migration transaction giữ bảng patients hiện có. Xóa hồ sơ xóa cả các phiên của hồ sơ đó; hộp xác nhận đã nêu rõ. Không lưu snapshot tên bệnh nhân trong phiên; tên/mã hiển thị theo hồ sơ hiện tại. Phiên không gắn hồ sơ vẫn tách theo tài khoản. Dữ liệu local chưa mã hóa, chỉ sử dụng giả lập.

Metadata gồm bài, bệnh nhân, thời gian bắt đầu/kết thúc, số giây thực hiện, completed/cancelled, trạng thái camera và số đoạn đã xóa. Bắt đầu tính từ chuẩn bị; số giây thực hiện loại thời gian đếm ngược/tạm dừng. Lượt hủy làm tròn xuống giây. Camera lỗi vẫn có thể lưu với nhãn lỗi, không biến thành kết quả ghi thành công. Không có raw video hoặc chỉ số mắt. Chưa có PDF/chia sẻ.

Lịch sử refresh khi focus, mới nhất trước, mỗi trang 30 bản ghi, có Xem thêm. Xem theo bệnh nhân từ hồ sơ hoặc chi tiết phiên. Chi tiết cho sửa ghi chú. Mọi query/write lọc owner và bảo vệ route; preview không đọc/ghi lịch sử. Lựa chọn bệnh nhân và bản nháp lượt chạy gắn owner để tránh lưu sang tài khoản khác.

Kiểm tra tự động: 6/6 ca repository PASS với node:sqlite thực, gồm owner isolation, từ chối bệnh nhân khác owner/đã xóa, lưu idempotent, cascade đúng phạm vi, sort/filter/pagination, validation và SQL binding, cập nhật ghi chú và lưu bền sau close/reopen. Kèm 7/7 ca điều phối camera PASS. Backend kiểm thử là SQLite của Node, không thay thế migration và vòng đời native Expo trên iPhone.

Lint/typecheck và git diff --check PASS; export Hermes iOS PASS (1.308 modules, khoảng 3,5 MB). Không thêm dependency.

Checklist iPhone (chưa nghiệm thu):

- Đăng nhập, chọn một bệnh nhân giả trước Smooth Pursuit; chạy xong, thêm ghi chú, Lưu vào lịch sử. Bấm lại không tạo bản ghi trùng.
- Vào tab Lịch sử, mở phiên: đúng bệnh nhân/bài/thời lượng/ghi chú/camera; sửa ghi chú và quay lại để thấy cập nhật.
- Từ hồ sơ bệnh nhân → Xem lịch sử kiểm tra: chỉ thấy các lượt của hồ sơ đó.
- Chạy Horizontal Saccades có camera, pause/resume rồi hoàn tất; lưu và kiểm tra số đoạn đã xóa/trạng thái thực tế.
- Hủy giữa bài, lưu lượt đã hủy; thời lượng không đủ 30 giây và nhãn Đã hủy đúng. Thử rời lượt chưa lưu và chọn Ở lại/Bỏ lượt.
- Chạy Không gắn hồ sơ và lưu; không xuất hiện trong lịch sử bệnh nhân khác.
- Đóng/mở app: lịch sử và ghi chú vẫn còn. Đăng nhập tài khoản khác/preview: không thấy dữ liệu cũ.
- Xóa một hồ sơ giả có phiên sau xác nhận: phiên liên quan biến mất, phiên hồ sơ khác/không gắn hồ sơ vẫn còn.
- Thử chọn hồ sơ đã bị xóa khi đang có bản nháp: lưu phải báo lỗi, không tự chuyển sang bệnh nhân khác.

## Camera trong bài · 10/11/2026

Sau bản sửa kết thúc quay và safe area, người dùng xác nhận “đã ổn”. Ghi nhận lượt chạy lại có camera PASS theo báo cáo người dùng. Không suy rộng xác nhận này thành nghiệm thu riêng tất cả tình huống từ chối quyền, hết dung lượng, chuyển nền hoặc cả hai bài; chưa có log/video mới để đối chiếu độc lập.

Kết quả thiết bị mới: ảnh IMG_1035.HEIC cho thấy Smooth Pursuit hết 30 giây nhưng báo lỗi camera, số đoạn đã xóa là 0. Không ghi nhận camera trong bài PASS. Đồng thời tiêu đề bị chồng lên status bar iPhone.

Đã sửa theo kiểm tra vòng đời: giữ CameraView trong lúc recorder còn busy, kể cả khi bài đã completed/cancelled, để gọi stopRecording và nhận/xóa file trước khi tháo native camera. Vẫn giải phóng camera khi chuyển nền. Thêm SafeAreaProvider trong modal bài kiểm tra. Trạng thái cuối hiển thị Đang hoàn tất video hoặc Camera gặp lỗi nếu có, không trộn thông báo hoàn tất với bài đang tạm dừng. Nếu native trả undefined sau stop, ghi nhận lỗi thay vì ngầm coi là xóa thành công. Bộ điều phối hiện 7/7 tests PASS, gồm chờ native finalize + deletion trước khi hết busy và thiếu file sau stop. Cần test lại iPhone để xác nhận nguyên nhân và bản sửa.

Thêm công tắc Quay camera trong bài, mặc định tắt. Khi bật: xin quyền camera, mở preview trước, đếm ngược 3 giây, yêu cầu ghi rồi chờ progress native trước khi chạy stimulus. Đây là điều phối ở mức ứng dụng, không chứng minh đồng bộ frame hoặc 240fps. Video mute 480p; mỗi đoạn giới hạn 40 giây/60 MB để bao phủ bài 30 giây và thời gian mở recorder.

Tạm dừng/kết thúc/chuyển nền sẽ dừng đoạn quay, xóa file trả về trước khi cho tiếp tục/chạy lại. Tiếp tục có camera đếm ngược lại 3 giây, bắt đầu đoạn mới và giữ thời gian bài còn lại. Đoạn ghi kết thúc sớm/lỗi sẽ tạm dừng bài; lỗi xóa được báo rõ và chặn tiếp tục. Nút Về hướng dẫn chỉ mở khi xử lý đoạn quay xong. Camera tắt thì stimulus hoạt động như trước. Không lưu raw video, metadata phiên hoặc tính metrics mắt.

Kiểm tra bộ điều phối: 5/5 ca PASS bằng `node --test tests/recordingController.test.js`: stop/resume nhanh không ghi trùng; chờ xóa trước đoạn mới; kết quả trả muộn sau unmount vẫn xóa; xóa thất bại được thử lại; kết thúc sớm/rejection báo lỗi và giải phóng trạng thái. Dùng recorder/file giả lập, chưa kiểm chứng native iPhone.

Lint/typecheck và git diff --check PASS; export Hermes iOS PASS (1.300 modules, khoảng 3,5 MB). Không cài thêm thư viện trong bước này.

Checklist thiết bị (chưa nghiệm thu):

- Giữ công tắc tắt: chạy hai bài như bản đã pass.
- Bật Quay camera trong bài: cấp quyền, thấy preview nhỏ, đếm ngược và Đang bắt đầu ghi; điểm chỉ chạy khi có progress native.
- Tạm dừng sau vài giây: thời gian/điểm dừng; chờ xóa đoạn video rồi Tiếp tục được bật. Tiếp tục đếm lại 3 giây và giữ thời gian còn lại.
- Thử tạm dừng trong lúc mở camera, countdown hoặc bắt đầu ghi; không tự tiếp tục sau đó.
- Chuyển nền khi đang ghi, quay lại phải tạm dừng; không tự ghi lại. Bấm Tiếp tục để bắt đầu đoạn mới.
- Hủy và chạy đủ 30 giây: chờ thông báo xóa đoạn video; thử Chạy lại và Về hướng dẫn, không có camera/recorder tồn.
- Từ chối quyền: không bắt đầu bài có camera, vẫn có thể đóng thông báo và tắt công tắc để chạy không camera.
- Thử recorder lỗi/dừng sớm hoặc hết dung lượng: bài tạm dừng và báo lỗi, không báo hoàn thành ghi thành công.

Giới hạn dọn file khi native crash trước khi trả URI hoặc không ghi được manifest giữ như mục camera thử riêng bên dưới. Camera và UI cần xác nhận thực tế trên iPhone.

## Camera thử riêng · 10/11/2026

Người dùng xác nhận đã chạy thành công hai bài stimulus trên thiết bị. Ngày 10/11/2026, người dùng tiếp tục xác nhận: “đã thử camera trước hoàn toàn ổn”. Ghi nhận camera thử riêng PASS theo báo cáo người dùng; chưa có log/video đối chiếu từng tình huống lỗi. Bổ sung mục Thử camera trước trên màn hình hướng dẫn, dùng expo-camera ~58.0.14 và expo-file-system ~58.0.13 theo Expo SDK 58.

Camera trước, video mute 480p, giới hạn tối đa 10 giây/15 MB. Camera độc lập với stimulus, không đồng bộ frame, không tracking mắt hoặc tính chỉ số. Video trả về được kiểm tra tồn tại/dung lượng rồi xóa tự động; không ghi Camera Roll hoặc upload. Nếu xóa thất bại, lưu URI trong manifest riêng để thử dọn khi vào lại camera. Chỉ xóa file trả về nằm trong cache ứng dụng. Không cam kết dọn được file nếu native crash trước khi trả URI, hoặc ghi manifest thất bại; không có quét toàn bộ cache.

Khi rời ứng dụng, dừng recorder và tháo CameraView. Khi unmount, native camera dừng; promise còn chờ sẽ xóa file trả về. Checklist tham khảo bên dưới; xác nhận chung của người dùng không được coi là bằng chứng đã thử riêng mọi tình huống lỗi:

- Khởi động lại Expo bằng `npx expo start --clear`; mở một trong hai bài → Thử camera trước.
- Từ chối camera: có thông báo và vẫn đóng camera/chạy stimulus được; nếu không thể hỏi lại, mở Cài đặt để cấp quyền rồi quay về.
- Cấp quyền: camera trước có hình, trạng thái Chưa ghi hình. Không yêu cầu micro khi quay mute.
- Bấm Quay thử; kiểm tra thời gian ghi native, dừng thủ công và tự dừng tối đa 10 giây.
- Sau khi quay xong: thông báo dung lượng file đã ghi và xóa; không có video mới trong thư viện ảnh.
- Quay lại lần hai, chuyển ứng dụng giữa lúc ghi rồi trở về; không tự ghi lại. Thử Đóng camera khi đang ghi, xác nhận Dừng quay, chờ xử lý rồi đóng.
- Thử cấp lại quyền sau từ chối, lỗi camera bận hoặc dung lượng thấp; không báo ghi thành công khi recordAsync thất bại.
- Đóng camera, chạy lại cả hai stimulus để kiểm tra không bị ảnh hưởng.

Kiểm tra mã PASS: `npx expo lint`, `npx tsc --project jsconfig.json --noEmit`, `git diff --check`; export Hermes iOS PASS, 1.298 modules, khoảng 3,5 MB. Cài dependency qua Expo thành công; npm báo 10 moderate vulnerabilities, không chạy audit fix. Camera thử riêng PASS theo báo cáo người dùng ngày 10/11/2026; chưa kiểm tra độc lập trên thiết bị.

## Stimulus mô phỏng · 09/11/2026

UI đã được chỉnh trước nghiệm thu: danh sách ưu tiên hai bài chạy được, nút bắt đầu ở đầu phần hướng dẫn; lượt chạy mở trong màn hình modal toàn màn hình, có thời gian, tiến độ và điều khiển riêng. Nội dung cuộn khi chiều cao không đủ hoặc chữ lớn. Kết thúc/hủy có nút chạy lại và về hướng dẫn. Kiểm tra thêm màn hình nhỏ, chữ lớn, vùng tai thỏ/home indicator và hộp xác nhận khi bấm Kết thúc. Chưa xác minh trực quan trên iPhone.

Đã bổ sung hai bài đầu với countdown, thời lượng chạy 30 giây (không tính thời gian tạm dừng), điều khiển tạm dừng/tiếp tục/hủy/chạy lại. Chuyển ứng dụng hoặc mất focus hệ thống sẽ tạm dừng, không tự tiếp tục. Quay lại đóng bài và dọn timer/animation. Chưa dùng camera hoặc ghi dữ liệu phiên.

Checklist nghiệm thu trên iPhone (chưa kiểm thử thiết bị):

Kiểm tra mã: lint và typecheck PASS; đóng gói Hermes iOS PASS (1.271 modules, khoảng 3,4 MB); git diff --check PASS. Lần export đầu không ghi được thư mục tạm Windows, chạy lại với quyền ghi phù hợp thành công. Các kiểm tra này không thay thế nghiệm thu thiết bị bên dưới.

- Mở từng bài đầu từ trang chủ và tab Bài kiểm tra; đọc hướng dẫn rồi bắt đầu.
- Xác nhận đếm ngược đủ 3 giây; điểm vàng nằm trong vùng tối cả khi xoay màn hình.
- Smooth Pursuit di chuyển liên tục; Horizontal Saccades nhảy giữa trái/giữa/phải với khoảng chờ thay đổi.
- Tạm dừng giữa bài: điểm dừng, số giây không giảm; tiếp tục giữ thời gian còn lại.
- Tạm dừng trong countdown: tiếp tục sẽ đếm lại 3 giây.
- Chuyển sang ứng dụng khác hoặc mở trung tâm thông báo; trở lại phải thấy bài tạm dừng.
- Hủy: chọn giữ tạm dừng hoặc xác nhận hủy; chạy lại phải về đủ 30 giây và countdown mới.
- Chờ hoàn tất, chạy lại; thử quay lại khi đang chạy rồi mở bài mới để kiểm tra không còn lượt chạy cũ.
- Bốn bài mở rộng vẫn hiện chưa hỗ trợ; không có kết quả lâm sàng hay lịch sử giả.

## Giai đoạn 3 · Hồ sơ bệnh nhân SQLite ngày 07/11/2026

Người dùng xác nhận đã pass các bài test Auth thực tế. Bổ sung quản lý hồ sơ mẫu ngoại tuyến, không dùng dữ liệu bệnh nhân thật.

| Kiểm tra | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| `npx expo install expo-sqlite` | PASS | Cài `expo-sqlite ~58.0.15`, phiên bản được tài liệu SDK 58 đề xuất và có trong Expo Go. |
| `npx expo install @react-native-community/datetimepicker` | PASS | Cài 9.2.1 theo Expo SDK 58; lịch hệ thống có trong Expo Go. |
| CRUD + SQLite | Đã triển khai, chờ iPhone | Tạo, đọc, tìm, sửa, xóa có xác nhận; ngày sinh qua lịch; giới tính bắt buộc là Nam/Nữ. Hồ sơ cũ ngoài hai lựa chọn được để trống để người dùng tự chọn, không tự gán. |
| Cách ly theo tài khoản | Đã triển khai | Mọi thao tác truy vấn dùng Supabase Auth user ID; không đồng bộ cloud. Không phải mã hóa tại chỗ. |
| Lưu sau mở lại app | Chờ iPhone | Kiểm tra tạo hồ sơ giả, đóng/mở app và xác nhận hồ sơ còn tồn tại. |
| Tìm kiếm tiếng Việt | Đã triển khai | Tìm theo mã/tên, chuẩn hóa chữ thường và bỏ dấu; giới hạn 200 kết quả. |
| `npx expo lint` | PASS | Exit code 0, không lỗi hoặc cảnh báo lint. |
| `npx tsc --project jsconfig.json --noEmit` | PASS | Exit code 0, kiểm tra kiểu JS/JSX qua JSDoc. |
| `npx expo export --platform ios` | PASS | 1.270 modules, Hermes iOS bundle khoảng 3,4 MB; đã chạy lại với quyền ghi thư mục tạm của Windows. Không thay thế chạy trên iPhone. |
| `git diff --check` | PASS | Không có lỗi khoảng trắng; Git chỉ báo quy tắc chuyển LF sang CRLF trên Windows. |

## Giai đoạn 2 · Supabase Auth và giao diện dễ đọc ngày 04/11/2026

Người dùng xác nhận sau đó đã pass các bài kiểm tra Auth thực tế. Kết quả bên dưới là báo cáo của người dùng; không có log thiết bị đính kèm trong workspace.

Đã thêm @supabase/supabase-js 2.118.0 và expo-secure-store theo phiên bản Expo chọn. Người dùng đã cấu hình Supabase và Gmail SMTP, gửi mã xác nhận thành công, sau đó báo các bài test đều pass. Không tạo tài khoản hoặc gửi email thay người dùng.

| Kiểm tra | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| `npm test` | PASS | 16 ca theo lần chạy gần nhất: chia session Unicode, lỗi lưu/manifest, xóa phiên, validation email/mật khẩu/OTP, lỗi không lộ credential, mã lỗi máy chủ/mạng và timeout 15 phút. Backend storage của test là bộ nhớ, không phải Keychain iPhone. |
| `npx expo lint` | PASS | Exit code 0, không lỗi hoặc cảnh báo lint. |
| `npx tsc --project jsconfig.json --noEmit` | PASS | Kiểm tra JS/JSX/JSDoc, exit code 0. |
| `npx expo install --check` | PASS | Dependencies are up to date. |
| `npx expo-doctor@latest` | PASS | 20/20 checks passed. |
| `npx expo export --platform ios` | PASS | Bundle iOS có Supabase và SecureStore, 1225 modules, 23 assets, Hermes khoảng 3.2 MB. |
| Tương phản màu bằng công thức độ chói sRGB | Đã đo | Nội dung/nền trắng 8.64:1, tiêu đề/nền trang 13.51:1, chữ trắng/nút 9.11:1, placeholder/nền trắng 5.93:1, lỗi/nền báo lỗi 7.41:1. Không tương đương nghiệm thu toàn bộ accessibility hoặc bố cục thiết bị. |
| `.env` và `.env.example` | Đã kiểm tra | `.env` bị git ignore, `.env.example` không bị ignore. File mẫu chỉ có placeholder public. |
| Đăng ký/email OTP/đăng nhập/đăng xuất/khôi phục | PASS theo người dùng | Người dùng báo đã pass các bài test thực tế; không có log thiết bị trong workspace. |
| Session lưu bền/timeout trên thiết bị | PASS theo người dùng | Người dùng báo mọi bài test đều pass; báo cáo này chưa kiểm tra độc lập SecureStore trên thiết bị. |
| Giao diện iPhone | PASS theo người dùng | Người dùng báo mọi bài test đều pass; chưa có ảnh hoặc video kiểm thử mới trong workspace. |
| npm audit | Còn tồn tại | Lần cài dependency báo 18 moderate vulnerabilities; không chạy audit fix --force. |

Triển khai Auth gồm protected routes cho tài khoản đã xác nhận, màn hình xem trước không đăng nhập, input validation, ẩn/hiện mật khẩu, xác nhận email bằng mã, khôi phục bằng mã rồi updateUser, chỉnh sửa metadata hồ sơ, logout và timeout. Không lưu mật khẩu trên thiết bị. Phiên recovery không được dùng để mở main tabs, kể cả sau mở lại app. Những hành vi này cần checklist thiết bị trong [hướng dẫn Supabase](SUPABASE-SETUP.md) để nghiệm thu thực tế.

Thông báo Node MODULE_TYPELESS_PACKAGE_JSON chỉ xuất hiện khi chạy các unit test ESM trực tiếp trong repo chưa đặt type=module; không đổi chế độ module toàn dự án vì ESLint đang dùng CommonJS. CLI export có cảnh báo NO_COLOR/FORCE_COLOR của môi trường. Không lấy các kiểm tra công cụ này làm bằng chứng đăng nhập hoặc gửi email thành công.

## Nâng cấp SDK 58 ngày 04/11/2026

Người dùng đã cho phép nâng SDK sau khi iPhone báo Expo Go SDK 58 không tương thích dự án SDK 57. Môi trường kiểm tra: Windows, Node 24.21.0, npm 11.19.0.

Phiên bản sau nâng: Expo 58.0.23, React/React DOM 19.3.0, React Native 0.88.1, Expo Router 58.0.30, Reanimated 4.7.1, Worklets 0.13.0, Safe Area 5.11.1 và Screens 4.30.1. Vẫn dùng JavaScript/JSDoc.

| Kiểm tra | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| `npx expo install --check` trực tuyến | PASS | Dependencies are up to date, exit code 0. |
| `npx expo-doctor@latest` | PASS | 20/20 checks passed, exit code 0. |
| `npx expo lint` | PASS | Exit code 0, không lỗi/cảnh báo lint. |
| `npx tsc --project jsconfig.json --noEmit` | PASS | Exit code 0 sau khi bỏ prop StatusBar.backgroundColor đã bị loại bỏ trong App.js cũ. |
| `npm ls --depth=0` | PASS | Exit code 0, không dependency invalid/missing ở cấp gốc. |
| `npx expo export --platform ios --clear` | PASS | 1168 modules, 23 assets, Hermes bundle khoảng 2.5 MB, exit code 0. |
| Server và manifest iOS | PASS | Server tạm `npx expo start --clear --localhost --port 8082` khởi động; GET `/` với Expo-Platform=ios trả sdkVersion=58.0.0, runtimeVersion=exposdk:58.0.0 và launchAsset. Đã dừng server kiểm tra. |
| `git diff --check` | PASS | Không lỗi whitespace. |
| npm audit khi cài sạch | Còn tồn tại | 18 moderate vulnerabilities. Không chạy audit fix --force; chưa phân tích riêng từng advisory. |
| Chạy trực tiếp trên iPhone | PASS theo người dùng | Người dùng đã xác nhận bản Expo SDK 58 chạy được trên iPhone; sau đó tiếp tục báo các bài test Auth đều pass. Không có log thiết bị đính kèm trong workspace. |

Đồng bộ bằng Expo, cài lại cây dependency để loại xung đột các peer SDK 57 còn sót. Nhóm auth đặt headerTransparent=false để giữ header đặc trên iOS mới. Bộ kiểm tra JS sử dụng điều kiện react-native. Không tạo hoặc sửa ios/android, không bổ sung module nghiệp vụ.

Tham khảo: [Quy trình nâng SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [SDK 58 release notes](https://expo.dev/changelog/sdk-58), [Router 57 → 58](https://docs.expo.dev/router/migrate/sdk-57-to-58/).

## Lịch sử kiểm tra Giai đoạn 1 trên SDK 57

Ngày 04/11/2026. Môi trường Windows, Node 24.21.0, npm 11.19.0, Expo 57.0.30, React 19.2.3, React Native 0.86.3.

| Kiểm tra | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| `npx expo lint` | PASS | Exit code 0, không lỗi hoặc cảnh báo lint. |
| `npx tsc --project jsconfig.json --noEmit` | PASS | Exit code 0, kiểm tra kiểu mã JS/JSX qua JSDoc; không chuyển app sang TypeScript. |
| `npx expo export --platform ios` | PASS | 1120 modules, 23 assets, Hermes bundle khoảng 2.4 MB trong dist. Không thay thế chạy thiết bị. |
| `git diff --check` | PASS | Không lỗi whitespace; có thông báo Git LF/CRLF trên Windows. |
| `npm ls react-dom react-native-worklets react-native-reanimated --depth=0` | PASS | 19.2.3 / 0.10.1 / 4.5.1, không còn peer mismatch ở ba package này. |
| `npx expo install --check` trực tuyến | Cảnh báo | Expo đề xuất patch ~57.0.31, hiện giữ 57.0.30 theo yêu cầu không tự nâng Expo. Không tuyên bố toàn bộ dependency check PASS. |
| npm audit trong quá trình install | Còn tồn tại | npm báo 29 vulnerabilities (2 low, 21 moderate, 6 high). Chưa xử lý audit; không chạy audit fix --force vì có thể gây breaking changes. |
| iPhone Expo Go | Chưa kiểm thử | Chưa có bằng chứng mở app, bấm điều hướng hoặc kiểm tra bố cục trên iPhone. |
| Auth / SQLite / camera / PDF | Chưa triển khai | Thuộc các giai đoạn tiếp theo; không có kết quả kiểm thử để ghi PASS. |

Lần export đầu bị sandbox chặn Hermes ghi file tạm; chạy lại với quyền phù hợp thành công, không đổi engine. Cảnh báo NO_COLOR/FORCE_COLOR là của môi trường CLI. Có cảnh báo Node về đường dẫn main thiếu extension trong dependency Worklets khi cài, không phải bằng chứng lỗi runtime trên iPhone.

`index.js` chỉ import entry của Expo Router, được xác minh bằng bundling. Typecheck giới hạn mã ứng dụng trong src và App.js cũ, tránh kiểm tra source JS nội bộ RSC của dependency Expo Router.

## Checklist chạy trên iPhone sau nâng SDK 58

- Nhấn Ctrl+C trong terminal server cũ, chạy `npx expo start --clear`, quét QR mới bằng iPhone có Expo Go SDK 58.
- Mở cả bốn tab và từng trang hướng dẫn bài kiểm tra, thử quay lại.
- Mở Cài đặt → Tài khoản → Đăng ký/Quên mật khẩu và trở về Trang chủ.
- Kiểm tra cuộn, chữ lớn, nút chạm, notch và home indicator trên iPhone.
- Ghi nhận lỗi thực tế nếu có; không nhập dữ liệu bệnh nhân hoặc mật khẩu thật vào màn hình khung.

## Checklist Giai đoạn 3 trên iPhone

- Đăng nhập, mở tab **Bệnh nhân** và thêm một hồ sơ giả lập; thử để trống mã để nhận mã tự tạo.
- Chạm **Ngày sinh**, chọn ngày trên lịch, xác nhận rồi tạo hồ sơ; thử **Hủy** lịch và kiểm tra ngày chưa bị đổi.
- Tìm bằng một phần tên, mã, chữ hoa/thường và chữ tiếng Việt không dấu.
- Mở hồ sơ, sửa một trường rồi quay lại danh sách để xác nhận thay đổi.
- Bấm **Xóa hồ sơ**, chọn **Hủy** để giữ lại; sau đó thử xóa một hồ sơ giả lập và xác nhận hộp thoại đóng, hồ sơ biến mất khỏi danh sách.
- Đóng hoàn toàn app, mở lại và kiểm tra hồ sơ còn tồn tại.
- Đăng xuất, vào chế độ xem trước và xác nhận danh sách không đọc hồ sơ; đăng nhập bằng tài khoản khác và xác nhận không thấy dữ liệu tài khoản trước.
- Chỉ dùng thông tin giả lập. SQLite hiện lưu không mã hóa trên thiết bị và hồ sơ bị xóa vĩnh viễn khi xác nhận xóa.

Checklist này ghi lại hướng dẫn ban đầu sau nâng SDK; trạng thái iPhone và Auth sau đó đã được người dùng xác nhận PASS. Hồ sơ SQLite Giai đoạn 3 vẫn cần checklist ở trên.
