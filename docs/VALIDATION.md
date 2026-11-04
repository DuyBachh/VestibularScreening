# Kết quả kiểm tra Giai đoạn 1

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

## Checklist chạy trên iPhone

- Chạy `npx expo start --clear`, quét QR bằng iPhone có Expo Go tương thích SDK 57.
- Mở cả bốn tab và từng trang hướng dẫn bài kiểm tra, thử quay lại.
- Mở Cài đặt → Tài khoản → Đăng ký/Quên mật khẩu và trở về Trang chủ.
- Kiểm tra cuộn, chữ lớn, nút chạm, notch và home indicator trên iPhone.
- Ghi nhận lỗi thực tế nếu có; không nhập dữ liệu bệnh nhân hoặc mật khẩu thật vào màn hình khung.

Chỉ sau khi có kết quả thiết bị mới cập nhật mục iPhone thành PASS.
