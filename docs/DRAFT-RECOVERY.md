# Lưu tạm và khôi phục lượt kiểm tra

Ứng dụng lưu bản nháp cục bộ khi tài khoản đã đăng nhập, giúp giữ metadata và ghi chú chưa đưa vào Lịch sử. Đây là cơ chế khôi phục dữ liệu ở mốc đã ghi thành công, không khôi phục một phép đo hoặc một chuỗi bài đang chạy. Không giữ video, token hoặc thông tin đăng nhập trong bản nháp.

## Cách sử dụng

Trước khi bắt đầu một lượt có tài khoản, ứng dụng tạo bản nháp. Nếu không tạo được, bài chưa bắt đầu và màn hình báo lỗi. Trong lượt, tiến độ được cập nhật khoảng mỗi giây và khi trạng thái thay đổi; ghi chú được đưa vào hàng đợi ghi ngay khi nhập. “Đã lưu bản nháp trên thiết bị” chỉ xuất hiện sau khi tác vụ ghi hoàn tất. Nếu ghi lỗi, giữ ứng dụng mở để thử lại hoặc lưu lịch sử.

Ở màn kết quả, **Lưu vào lịch sử** lưu phiên như trước và xóa nháp cùng lần ghi. Nếu muốn để sau, bấm Về thông tin bài hoặc Tiếp tục chuỗi rồi chọn **Giữ bản nháp**. **Bỏ lượt này** xóa cả nháp và ghi chú chưa lưu, có xác nhận. Mở lại Trang chủ sẽ có thông báo nếu còn nháp; cũng có thể mở **Cài đặt → Bản nháp chưa lưu**.

Trong danh sách, bấm **Khôi phục bản nháp** để xem metadata và ghi chú. Bản nháp đã hoàn tất/đã hủy có thể sửa ghi chú, rồi bấm Lưu vào lịch sử. Bản nháp của lượt đang chạy lúc ứng dụng đóng được hiển thị **Gián đoạn**, không phải kết quả hoàn tất. Bản gián đoạn không thể lưu thành phiên hoàn tất; có thể xem/sửa ghi chú hoặc xác nhận Xóa nháp và chuẩn bị bài mới. Màn thiết lập bài mới không tự bắt đầu hoặc mở camera.

## Kiểm thử trên iPhone

Chạy `npx expo start --clear`, mở lại Expo Go. Dùng tài khoản và bệnh nhân mẫu có thể xóa. Giữ máy chủ Expo trên máy tính chạy trong lúc thử đóng/mở Expo Go. Các kiểm thử sau cần nghiệm thu thiết bị riêng.

1. **Kết quả và ghi chú qua đóng app:** chạy đủ 30 giây không camera, nhập “Khôi phục lần 1”, chờ thông báo đã lưu nháp; chưa bấm Lưu vào lịch sử. Vuốt đóng Expo Go từ trình chuyển ứng dụng, mở lại dự án. Trang chủ báo có nháp → Xem và khôi phục → Khôi phục bản nháp: đúng tên bài/hồ sơ/trạng thái hoàn tất/30 giây/ghi chú. Sửa ghi chú, chờ lưu nháp rồi bấm Lưu vào lịch sử: mở chi tiết, chỉ có một phiên và nháp đã biến mất. Đóng/mở lần nữa không tạo phiên trùng.
2. **Gián đoạn giữa bài:** bắt đầu bài mới, chạy khoảng 10–15 giây, chờ một mốc ghi rồi đóng Expo Go. Mở lại: nháp ghi Gián đoạn, giữ mốc tiến độ cuối (có thể ngắn hơn thời điểm đóng), không tự chạy bài/camera và không có nút lưu thành hoàn tất. Bấm Xóa nháp và chuẩn bị bài mới: hủy xác nhận thì nháp còn, xác nhận thì về thiết lập, chưa tự bắt đầu.
3. **Giữ nháp hoặc bỏ có chủ ý:** hoàn tất một lượt khác, nhập ghi chú → Về thông tin bài → Giữ bản nháp. Mở Cài đặt → Bản nháp chưa lưu, thấy đúng dữ liệu. Thử lượt đã hủy có camera, đợi camera xử lý và lưu nháp xong rồi giữ nháp; khôi phục phải vẫn ghi Đã hủy, không đổi thành hoàn tất. Trong màn khôi phục, Xóa bản nháp có xác nhận; hủy giữ nguyên, đồng ý xóa không xóa phiên đã lưu khác. Thử Bỏ lượt này ở màn kết quả cũng không để lại nháp.
4. **Tài khoản và xóa local:** tài khoản A tạo một nháp có ghi chú riêng rồi đăng xuất thông thường. Tài khoản B không thấy nháp A. Đăng nhập lại A thấy nháp còn. Tạo thêm nháp B trước khi thử Xóa dữ liệu và đăng xuất ở A: xác nhận phải có số bản nháp, sau xóa A không còn nháp; B vẫn giữ dữ liệu. Chỉ dùng dữ liệu mẫu cho thao tác xóa.
5. **Hồ sơ và thùng rác:** giữ nháp gắn hồ sơ mẫu, đưa hồ sơ vào Thùng rác. Danh sách nháp và thông báo Trang chủ không hiển thị nháp đó; khôi phục hồ sơ làm nháp xuất hiện lại. Xóa hồ sơ vĩnh viễn sẽ xóa nháp liên quan; lượt không gắn hồ sơ và tài khoản khác không ảnh hưởng. Không khôi phục/lưu qua một đường dẫn cũ của hồ sơ đã xóa.
6. **Chuỗi và Demo:** trong chuỗi, lưu bài 1 vào lịch sử, giữ nháp bài 2 rồi kết thúc chuỗi sớm. Lịch sử chỉ có bài đã lưu; bản nháp bài 2 mở riêng và không tự khôi phục/tiếp tục chuỗi hoặc tạo các bài chưa chạy. Chạy Demo/xem trước: không tạo nháp tài khoản.
7. **Ngoại tuyến và giao diện:** khi phiên đăng nhập còn hợp lệ, bật chế độ máy bay rồi mở/khôi phục/sửa ghi chú/lưu một nháp; các phần SQLite vẫn hoạt động. Đổi Việt/Anh, tăng cỡ chữ, nhập ghi chú nhiều dòng và thử Back: nút không bị che, nội dung giữ nguyên sau chờ ghi xong và mở lại. Auth mới/làm mới phiên vẫn có thể cần mạng; không suy rộng thành đăng nhập ngoại tuyến.

## Dữ liệu và kiểm soát ghi

Schema SQLite v7 thêm `pending_runs`; không chuyển đổi hoặc xóa các phiên v6. Nháp dùng session ID làm khóa, owner ID, patient ID nếu có, mã bài, mốc thời gian, elapsed ms, status, trạng thái camera tối thiểu, số đoạn đã xác nhận xóa, ghi chú và revision. Tên/mã bệnh nhân được đọc từ hồ sơ hiện tại; không sao chép tên, ngày sinh hoặc video URI vào bảng nháp. SQLite hiện chưa mã hóa, chỉ dùng dữ liệu giả lập như các phần dữ liệu cục bộ khác.

Việc tạo nháp chỉ diễn ra trước lượt mới và được bảo vệ bởi transaction/kiểm tra tài khoản/hồ sơ đang hoạt động. Checkpoint sau đó chỉ UPDATE hàng đã có, có revision tăng và không lùi tiến độ/trạng thái; không dùng upsert. Hàng đã xóa hoặc đã lưu vào lịch sử không thể được một tác vụ chậm tạo lại. Writer ghi tuần tự, gộp các bản cập nhật đang chờ về bản mới nhất và có retry; không báo ghi thành công trước khi SQLite trả kết quả.

Trigger xóa nháp khi insert phiên thành công chạy cùng statement, cùng rollback với phiên và nhật ký. Khôi phục dùng transaction riêng, đọc lại nháp/owner/hồ sơ, kiểm tra dữ liệu rồi ghi phiên và xóa nháp; thay đổi tài khoản/lỗi ghi làm rollback. Nháp active không được nâng thành completed chỉ vì elapsed đạt 30 giây. Khi camera chưa xử lý xong, trạng thái kết quả chưa được xác nhận và recovery không giả định đã quay/xóa thành công.

Đăng xuất thông thường giữ nháp. Xóa toàn bộ dữ liệu tài khoản xóa nháp trước khi xóa hồ sơ, trong cùng transaction và giữ nguyên tài khoản khác. Thùng rác ẩn nháp cùng hồ sơ; khôi phục cho thấy lại, xóa vật lý cascade nháp. Nháp không phát sinh nhật ký phiên giả; chỉ khi lưu phiên thành công mới có event `session_saved`.

## Giới hạn

- Chỉ bảo đảm dữ liệu đã được ghi thành công, không bảo đảm ký tự/mốc mới nhất nếu hệ điều hành đóng tiến trình ngay trong lúc đang ghi, thiết bị hết dung lượng hoặc ứng dụng bị gỡ.
- Không tiếp tục timer/stimulus hoặc tự bật camera từ checkpoint. Không khôi phục video, vị trí mục tiêu, thứ tự/tổng hợp chuỗi hoặc Demo.
- Không tự đưa nháp vào Lịch sử, không đánh dấu bài gián đoạn là hoàn tất và không tạo chỉ số mắt.
- Chưa đồng bộ hoặc mã hóa SQLite; không có đồng bộ nhiều thiết bị. Không thêm tác vụ chạy nền khi ứng dụng đã bị đóng.
