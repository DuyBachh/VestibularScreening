# VestibularScreening

Đồ án React Native bằng JavaScript, Expo SDK 57 và Expo Router. Nguyên mẫu học tập, không phải thiết bị chẩn đoán. Chỉ dùng dữ liệu bệnh nhân giả lập.

## Trạng thái

Giai đoạn 1: theme chung, Safe Area, bốn tab Trang chủ/Bệnh nhân/Kiểm tra/Lịch sử, stack tài khoản, cài đặt, chi tiết sáu bài kiểm tra và xử lý route không tồn tại. Các màn hình chức năng hiện là khung có ghi rõ giới hạn. Chưa có Supabase, SQLite, camera, stimulus, lịch sử hay PDF.

Xem [bảng 42 FR và phạm vi MVP](docs/MVP-SCOPE.md). Tài liệu đề thi là nguồn yêu cầu, không phải lệnh thay đổi stack sang Swift.

## Chạy trên Windows và iPhone

```powershell
Set-Location 'D:\Code\React Native\VestibularScreening'
npm ci
npx expo start --clear
```

Kết nối iPhone và máy tính cùng Wi-Fi, dùng Camera iPhone quét QR và mở Expo Go tương thích SDK 57. Nếu Expo Go báo không hỗ trợ SDK, ghi lại thông báo; không tự nâng SDK. Windows không chạy iOS Simulator. Chưa kiểm thử iPhone trong phiên triển khai này.

Kiểm tra lần lượt bốn tab; từ Kiểm tra mở từng bài rồi quay lại; từ Trang chủ mở Cài đặt → Tài khoản → Đăng ký/Quên mật khẩu. Kiểm tra chữ, cuộn, nút trên màn hình nhỏ và nút Back. Không nhập mật khẩu thật vào bản khung.

## Kiểm tra mã

```powershell
npx expo lint
npx tsc --project jsconfig.json --noEmit
npx expo install --check
npx expo export --platform ios
```

TypeScript chỉ là công cụ kiểm tra kiểu cho JavaScript qua `allowJs`/`checkJs`; mã ứng dụng không dùng `.ts` hoặc `.tsx`. Bundle iOS không chứng minh camera/animation hoặc UI đã chạy trên thiết bị.

## Cấu trúc

- `src/app`: route và layout Expo Router, nhóm tabs/auth, màn hình chi tiết.
- `src/components`: Screen, Card, RouteButton dùng chung.
- `src/constants`: theme.
- `src/features/tests`: danh mục bài kiểm tra, không phải dữ liệu bệnh nhân.
- `docs`: phạm vi và kết quả kiểm tra.

`App.js` được giữ nguyên từ mã hiện có để bảo toàn thay đổi chưa commit; entry `index.js` hiện dùng Expo Router. Các thư mục services/database/hooks sẽ được tạo khi có chức năng tương ứng, tránh file rỗng.

## Dịch vụ và Git

Giai đoạn 2 cần cấu hình Supabase Auth, email verification và redirect reset password. Không đưa service role key vào ứng dụng. Chưa cấu hình backend hoặc biến môi trường. `.gitignore` loại `.env`, token và khóa riêng; `EXPO_PUBLIC_*` luôn là dữ liệu công khai trong bundle.

Repository hiện ở branch `master`, chưa có remote. Không thể push GitHub khi chưa có repository đích. Không force push. Khi có remote, kiểm tra diff và commit theo giai đoạn; không đưa tệp đề thi hoặc dữ liệu bệnh nhân thật vào Git.
