# Kết quả kiểm tra VestibularScreening

## Giai đoạn 2 và giao diện dễ đọc ngày 04/11/2026

Người dùng xác nhận bản SDK 58 của Giai đoạn 1 “đã pass” trên iPhone. Kết quả đó không thay thế kiểm thử Auth hoặc giao diện mới trong Giai đoạn 2.

Đã thêm @supabase/supabase-js 2.118.0 và expo-secure-store theo phiên bản Expo chọn. Chưa có Supabase project hoặc biến môi trường thật, theo trả lời của người dùng. Không tạo tài khoản hoặc gửi email thay người dùng.

| Kiểm tra | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| `npm test` | PASS | 12 ca: chia session Unicode, ghi thất bại, manifest lỗi, xóa phiên, validation email/mật khẩu/OTP, lỗi không lộ credential và timeout ở biên 15 phút. Backend storage của test là bộ nhớ, không phải Keychain iPhone. |
| `npx expo lint` | PASS | Exit code 0, không lỗi hoặc cảnh báo lint. |
| `npx tsc --project jsconfig.json --noEmit` | PASS | Kiểm tra JS/JSX/JSDoc, exit code 0. |
| `npx expo install --check` | PASS | Dependencies are up to date. |
| `npx expo-doctor@latest` | PASS | 20/20 checks passed. |
| `npx expo export --platform ios` | PASS | Bundle iOS có Supabase và SecureStore, 1225 modules, 23 assets, Hermes khoảng 3.2 MB. |
| Tương phản màu bằng công thức độ chói sRGB | Đã đo | Nội dung/nền trắng 8.64:1, tiêu đề/nền trang 13.51:1, chữ trắng/nút 9.11:1, placeholder/nền trắng 5.93:1, lỗi/nền báo lỗi 7.41:1. Không tương đương nghiệm thu toàn bộ accessibility hoặc bố cục thiết bị. |
| `.env` và `.env.example` | Đã kiểm tra | `.env` bị git ignore, `.env.example` không bị ignore. File mẫu chỉ có placeholder public. |
| Email/signup/login/reset thực tế | Chưa kiểm thử | Cần tạo Supabase project, bật Confirm email, điền env, cấu hình email OTP và kiểm thử bằng email thật. |
| Session lưu bền/timeout trên thiết bị | Chưa kiểm thử | Cần iPhone; unit test không xác minh SecureStore hoặc hành vi vòng đời iOS. |
| Giao diện iPhone mới | Chưa xác nhận | Cần kiểm tra cỡ chữ, bàn phím, nút, cuộn, Dynamic Type và màu sau reload. |
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
| Chạy trực tiếp trên iPhone | Chưa xác nhận sau nâng | Lỗi lệch SDK 57/58 được người dùng cung cấp trước nâng. Manifest mới đã khớp 58, nhưng cần quét QR mới để xác nhận chạy UI trên thiết bị. |

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

Chỉ sau khi có kết quả thiết bị mới cập nhật mục iPhone thành PASS.
