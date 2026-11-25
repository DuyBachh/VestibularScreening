# Lưu chuỗi sáu bài và xuất PDF tổng hợp

Bản cập nhật ngày 25/11/2026 ghi mỗi chuỗi mới của tài khoản đăng nhập dưới một mã riêng, liên kết sáu vị trí với đúng session ID trước khi bắt đầu từng lượt. Có thể mở lại từ **Lịch sử → Lịch sử chuỗi 6 bài**, từ Lịch sử bệnh nhân để lọc riêng hồ sơ, hoặc **Mở tổng hợp và PDF chuỗi** sau khi kết thúc. Chức năng ghi metadata và ghi chú, không đo chuyển động mắt hoặc đưa kết luận lâm sàng.

## Dữ liệu hiển thị

Mỗi chuỗi giữ cấu hình hồ sơ, thời điểm bắt đầu/kết thúc đã xác nhận và sáu bài đúng thứ tự. Khi đọc lại, ứng dụng lấy dữ liệu trong cùng một transaction:

- **Đã lưu vào lịch sử:** lấy trạng thái, thời lượng, camera và ghi chú hiện tại từ đúng phiên, cùng owner/hồ sơ/mã bài. Sửa ghi chú trong phiên rồi mở lại tổng hợp sẽ thấy nội dung mới.
- **Còn bản nháp:** ghi rõ chưa lưu lịch sử. Chỉ lấy ghi chú từ nháp còn tồn tại; nháp active hiển thị Gián đoạn dù mốc elapsed đã tới 30 giây. Khôi phục nháp vào lịch sử chuyển nguồn của cùng vị trí sang phiên đã lưu, không tạo thêm chuỗi.
- **Không lưu lượt:** tổng hợp giữ trạng thái/thời lượng mà màn chạy đã xác nhận khi chuyển bài, không sao chép hoặc phục hồi ghi chú đã bỏ. Hộp xác nhận bỏ lượt trong chuỗi có giải thích điều này.
- **Gián đoạn, chưa xác nhận:** đã gắn session ID nhưng chưa có kết quả kết thúc được xác nhận. Có thể hiển thị mốc nháp cuối nếu còn; khi nháp đã mất thì thời lượng là —.
- **Chưa thực hiện:** vị trí được dự kiến khi tạo chuỗi nhưng chưa có lượt chạy. Không tạo một phiên giả cho bài này.

Chỉ trường hợp kết thúc/chuyển bài đã ghi thành công mới chuyển màn. Nếu ghi tiến độ lỗi, màn kết quả giữ lại và báo thử tiếp tục/kết thúc lại. Camera và bài tập không tự tiếp tục khi mở bản tổng hợp. Mở lại lịch sử chuỗi là xem dữ liệu đã ghi, không phục hồi máy trạng thái chạy hoặc vị trí stimulus.

## PDF chung

Màn tổng hợp có Xem / in và Xuất / chia sẻ PDF. Một tệp gồm thông tin hồ sơ, mã chuỗi, các mốc thời gian, số bài theo trạng thái, đủ sáu mục, thời lượng/nguồn dữ liệu/ghi chú từng mục và thông tin người lập/logo. Lượt chưa thực hiện có thời lượng —; lượt gián đoạn có giải thích đó là checkpoint. Dữ liệu bản nháp được gắn nhãn riêng, không trình bày thành phiên đã lưu.

Ngôn ngữ được chụp tại lúc bắt đầu xuất; tên và ghi chú tự nhập không dịch. Đọc lại chuỗi và logo theo tài khoản trước xuất, escape HTML và chỉ chấp nhận ảnh logo data URL theo bộ kiểm tra hiện có. Chia sẻ giữ nguyên URI của Expo Print, chặn tác vụ đã rời màn/đổi tài khoản, dọn tệp trong finally. Đóng share sheet không xác nhận đã gửi/lưu; người dùng phải chọn đích. PDF đã lưu trong Tệp không tự thay đổi khi ghi chú sau này được sửa.

## Kịch bản demo và nghiệm thu nhanh trên iPhone

Dùng tài khoản thử và hồ sơ mẫu. Tắt camera để tập trung vào luồng lưu chuỗi và báo cáo.

1. **Chuỗi đầy đủ.** Chạy sáu bài và lưu từng lượt với ghi chú “Bài 1” đến “Bài 6”. Đóng hẳn Expo Go rồi mở lại. Vào **Lịch sử → Lịch sử chuỗi 6 bài**, mở chuỗi vừa tạo và đối chiếu đủ 6/6 lượt, đúng thứ tự và ghi chú.
2. **Chuỗi kết thúc sớm.** Tạo chuỗi mới, hoàn tất và lưu đúng hai bài, rồi kết thúc ở màn nghỉ trước bài thứ ba. Mở PDF và đối chiếu đủ sáu mục, với hai lượt đã lưu và bốn mục **Chưa thực hiện**.
3. **Nhật ký PDF.** Ghi lại mã của chuỗi kết thúc sớm. Chọn **Xem / in báo cáo**, đóng màn in, rồi mở bảng chia sẻ PDF và bấm **Hủy**. Trong **Nhật ký hoạt động → Báo cáo**, đối chiếu ba dòng mới cùng mã chuỗi gồm **Yêu cầu xem/in PDF**, **Đã tạo tệp PDF** và **Yêu cầu chia sẻ PDF**.

Khi demo, có thể chuẩn bị sẵn hai chuỗi đã nghiệm thu để trình bày phần mở lại lịch sử, rồi thực hiện bước 3 trực tiếp. Ghi kết quả từng bước cùng mẫu iPhone và phiên bản iOS đã dùng.

## Kiểm thử iPhone 1–7

Chạy `npx expo start --clear`, mở lại Expo Go và dùng dữ liệu giả lập. Cần nghiệm thu riêng các tương tác mới, không suy rộng từ unit test hoặc bản đóng gói.

1. **Đủ sáu bài:** đăng nhập, chọn hồ sơ, chạy chuỗi và lưu mỗi lượt với ghi chú phân biệt “Bài 1”…“Bài 6”. Cuối chuỗi → Mở tổng hợp và PDF chuỗi: có cùng một mã chuỗi, 6 hoàn tất/0 hủy/0 gián đoạn/0 chưa thực hiện và 6/6 lượt đã lưu. Mở từng lượt phải đúng bài/hồ sơ/ghi chú; Lịch sử phiên vẫn chỉ có sáu phiên, không có bản sao.
2. **Mở lại và sửa ghi chú:** đóng hẳn Expo Go, mở lại → Lịch sử → Lịch sử chuỗi 6 bài. Mở đúng chuỗi và kiểm tra thứ tự/ghi chú. Mở một lượt → sửa/lưu ghi chú → quay lại tổng hợp, thấy nội dung mới. Từ Lịch sử của hồ sơ khác không thấy chuỗi của hồ sơ đang thử.
3. **Kết thúc sớm và bỏ lượt:** chuỗi mới: hoàn tất/lưu bài 1, hủy bài 2 sau vài giây, nhập ghi chú rồi chọn Kết thúc chuỗi → Bỏ lượt này. Tổng hợp phải có 1 hoàn tất, 1 đã hủy, 4 chưa thực hiện; bài 2 không lưu lịch sử và không còn ghi chú vừa bỏ. PDF giữ đủ sáu mục, bốn bài sau có — chứ không phải hoàn tất/0 giây.
4. **Bản nháp và gián đoạn:** chuỗi mới, hoàn tất bài 1 nhưng chọn Giữ bản nháp rồi kết thúc chuỗi trong màn nghỉ. Tổng hợp ghi bản nháp, chưa tính vào số phiên đã lưu; ghi chú còn đúng. Mở Bản nháp, khôi phục và lưu lịch sử → mở lại cùng chuỗi thấy nguồn Đã lưu, không nhân đôi mã chuỗi. Thử một chuỗi khác, đóng Expo Go giữa bài: mở lại tổng hợp phải báo chưa xác nhận kết thúc và lượt gián đoạn; không tự chạy hoặc bật camera, các bài sau chưa thực hiện.
5. **PDF Việt/Anh và camera:** thử chuỗi có camera ít nhất hai bài và chờ dọn video trước chuyển bài. Tổng hợp giữ trạng thái camera phù hợp với nguồn đã lưu; không suy ra thành công khi có lỗi. Xuất PDF Việt/Anh, logo, tên/chuyên khoa/cơ sở và ghi chú dài, mở lại trong Tệp để kiểm tra đủ sáu bài, không cắt chữ/tràn trang. Đổi ngôn ngữ không đổi dữ liệu tự nhập.
6. **Quyền tài khoản, thùng rác và xóa local:** tài khoản B không thấy chuỗi A. Đăng xuất thường/đăng nhập lại A vẫn thấy chuỗi. Chuyển hồ sơ vào Thùng rác ẩn cả chuỗi/PDF; khôi phục hồ sơ thấy lại. Xóa vĩnh viễn hồ sơ xóa chuỗi liên quan. Trên dữ liệu mẫu, Xóa dữ liệu và đăng xuất thông báo số chuỗi, xóa cả tổng hợp và các vị trí của A nhưng giữ B.
7. **Xem trước, dữ liệu cũ, ngoại tuyến và điều hướng:** chuỗi ở xem trước không tạo lịch sử/PDF tài khoản. Các phiên riêng cũ không tự bị ghép thành chuỗi. Trong phiên còn hợp lệ, bật chế độ máy bay rồi xem/xuất PDF tổng hợp vẫn dùng dữ liệu cục bộ. Thử Back, kết thúc trước bài đầu, tăng cỡ chữ và ghi chú dài; chưa có thao tác nào tự tiếp tục chuỗi. Chỉ sửa lỗi phát hiện được, không đánh dấu PASS trước khi thử.

## Lưu trữ và giới hạn

Schema v8 thêm `battery_runs` và `battery_items`, không gộp dữ liệu quá khứ. Tạo root và sáu vị trí trong cùng transaction. Bắt đầu một lượt tạo nháp và gắn session ID vào đúng vị trí trong cùng transaction, kiểm tra owner/hồ sơ/thứ tự/bài trước; lỗi hoặc đổi tài khoản làm rollback. Lưu phiên thường/khôi phục nháp cập nhật vị trí bằng trigger trong cùng statement. Khi chuyển bài, kết quả được kiểm tra và ghi trước khi đóng modal; retry không tạo thêm vị trí hoặc phiên.

Root liên kết hồ sơ qua khóa ngoại; Thùng rác ẩn dữ liệu và chặn truy cập, khôi phục hiển thị lại, hard delete cascade root/vị trí. Xóa local thực hiện xóa vị trí rồi root tường minh trong cùng transaction vì connection của exclusive transaction có thể không kế thừa foreign_keys. Không sao chép ghi chú vào bảng tổng hợp. Không có cơ chế xóa byte an toàn, mã hóa hoặc đồng bộ cloud.

Trong Nhật ký hoạt động, lọc Báo cáo để xem yêu cầu xem/in, tạo tệp và yêu cầu chia sẻ theo ID chuỗi 6 bài. Việc gửi đến người nhận phụ thuộc vào ứng dụng được chọn trong bảng chia sẻ.
Không giữ video trong tổng hợp, không gộp chỉ số từ màn phân tích CSV, không bổ sung metrics hoặc kết luận sức khỏe. Không khôi phục tự động máy trạng thái chuỗi đang chạy.
