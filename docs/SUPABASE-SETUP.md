# Cấu hình Supabase cho Giai đoạn 2

Ứng dụng đã có mã tích hợp Supabase Auth thật, nhưng chưa thể kiểm thử đăng ký/email/login/reset vì bạn chưa tạo project. Không có tài khoản demo hoặc mật khẩu hardcode. Không cần tạo bảng bệnh nhân hoặc chạy SQL ở giai đoạn này.

## 1 Tạo project

1. Vào [Supabase Dashboard](https://supabase.com/dashboard), tạo tài khoản và đăng nhập bằng trình duyệt của bạn.
2. Chọn New project, tạo/chọn organization, đặt tên `VestibularScreening` và chọn khu vực phù hợp. Tạo database password mạnh và lưu riêng; mật khẩu này không dùng trong ứng dụng.
3. Chờ project sẵn sàng. Trong Connect hoặc Settings/API, lấy **Project URL** và **Publishable key**. Legacy `anon` key cũng được hỗ trợ. Không lấy `service_role`, `sb_secret_*`, database password hoặc JWT signing secret.
4. Trong Authentication → Sign In / Providers → Email, bật email/password signup và **Confirm email**. Tên menu có thể thay đổi theo giao diện Dashboard.
5. Cấu hình password policy tối thiểu 8 ký tự. App kiểm tra độ dài/khớp mật khẩu, Supabase quyết định chính sách đầy đủ.

## 2 Điền môi trường local

Chạy trong PowerShell:

```powershell
Set-Location 'D:\Code\React Native\VestibularScreening'
Copy-Item -LiteralPath '.env.example' -Destination '.env'
```

Chỉ chạy lệnh copy khi chưa có `.env`; không ghi đè cấu hình đã điền. Mở `.env` trong VS Code rồi thay hai giá trị mẫu:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

Nếu dùng legacy anon JWT, đặt JWT đó vào cùng biến `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. App từ chối key nhận diện là service role hoặc secret. Biến `EXPO_PUBLIC_*` được đóng vào bundle nên luôn được coi là công khai. `.env` đã được ignore; không commit hoặc dán khóa bí mật vào chat.

Sau khi lưu, nhấn Ctrl+C ở server cũ và chạy:

```powershell
npx expo start --clear
```

Quét QR mới bằng Expo Go SDK 58. Khi cấu hình hợp lệ, cảnh báo chưa kết nối biến mất và các nút đăng nhập/đăng ký được bật. Đây chỉ là xác nhận định dạng cấu hình; login thật mới kiểm tra được URL/key có đúng hay không.

## 3 Cấu hình email chứa mã

Để kiểm thử ổn định trên Expo Go, bản này dùng **mã một lần trong email**, không phụ thuộc chuyển hướng bằng deep link.

Trong Authentication → Email Templates, sửa hai mẫu sau và lưu. Giữ phần biến `{{ .Token }}` đúng như dưới đây.

**Confirm sign up**

```html
<h2>Xác nhận tài khoản VestibularScreening</h2>
<p>Mã xác nhận của bạn: <strong>{{ .Token }}</strong></p>
<p>Mở ứng dụng, chọn Đăng ký → Tôi đã có mã xác nhận và nhập mã.</p>
<p>Không chia sẻ mã này với người khác.</p>
```

**Reset password**

```html
<h2>Khôi phục mật khẩu VestibularScreening</h2>
<p>Mã khôi phục của bạn: <strong>{{ .Token }}</strong></p>
<p>Mở ứng dụng → Quên mật khẩu, nhập email và mã này để đặt mật khẩu mới.</p>
<p>Nếu không yêu cầu khôi phục, hãy bỏ qua email này. Không chia sẻ mã.</p>
```

Supabase có thể cấu hình độ dài/thời hạn OTP; giao diện chấp nhận 6–10 chữ số. Không bấm link xác nhận rồi dùng lại mã: token chỉ dùng một lần. Nút gửi lại có giới hạn chờ 60 giây ở app, dịch vụ còn có rate limit riêng.

Mặc định Supabase SMTP phục vụ kiểm thử bị giới hạn người nhận và tần suất. Nếu gặp lỗi email không được cho phép, dùng địa chỉ được phép theo cấu hình tổ chức hoặc cấu hình custom SMTP trong Authentication. Không tắt email confirmation để né lỗi gửi thư. Chưa xác minh khả năng nhận email cho project của bạn.

## 4 Luồng hoạt động

- Đăng ký: email/mật khẩu/họ tên → Supabase signUp → nhập mã email → verifyOtp loại email → phiên đã xác nhận.
- Đăng nhập: signInWithPassword → lưu phiên bằng Expo SecureStore trên iOS/Android → main tabs. Mật khẩu không được app lưu xuống thiết bị.
- Khôi phục: resetPasswordForEmail → email chứa mã → verifyOtp loại recovery → màn hình mật khẩu mới → updateUser → khóa/xóa phiên local và yêu cầu đăng nhập lại.
- Hồ sơ: lưu tên/chuyên khoa/cơ sở trong Supabase user metadata. Chưa có logo phòng khám, phân quyền Admin hoặc bảng profile riêng. Metadata này không dùng làm bằng chứng phân quyền.
- Đăng xuất: khóa UI ngay, yêu cầu signOut scope local và xóa phiên local. Nếu mạng/storage lỗi, UI báo trạng thái khóa; không tuyên bố thu hồi server thành công.
- Không hoạt động 15 phút: khóa/đăng xuất và kiểm tra lại khi foreground hoặc mở app. Cần kiểm thử thời gian thực trên iPhone; không tự nhận FR-06 đã nghiệm thu.

SecureStore giữ phiên theo từng project, chia giá trị lớn thành các phần nhỏ để tránh giới hạn kích thước của Keychain. Không bật Face ID trong Expo Go. Web chỉ giữ phiên trong bộ nhớ, không tương đương lưu bền mobile. SecureStore không mã hóa SQLite hoặc dữ liệu bệnh nhân trong các giai đoạn sau.

## 5 Link reset và deep linking

Incoming links trong Expo Go bị giới hạn. `vestibularscreening://` trong app.json là scheme cho bản build riêng; không coi đó là callback đã chạy được trong Expo Go. Bản này **chưa xử lý tự động link token/hash/PKCE callback**, đặt detectSessionInUrl=false, và dùng mã email theo mục 3 để hoàn tất reset ngay trong app.

Nếu cần nút mở link trong tương lai: tạo development build hoặc trang HTTPS reset riêng, cấu hình Site URL/Redirect URLs đúng ở Supabase và triển khai callback xác thực tương ứng. Không thêm wildcard rộng để thử cho qua; không dùng localhost trên máy tính làm trang reset cho iPhone. Luồng link tự động chưa triển khai và chưa kiểm thử.

## 6 Checklist nghiệm thu trên iPhone

| Trường hợp | Mong đợi | Hiện tại |
| --- | --- | --- |
| Không có env | Không crash, nút tài khoản bị khóa; Xem giao diện chỉ mở các màn hình giới thiệu | Cần kiểm thử iPhone bản mới |
| Email sai, mật khẩu ngắn/không khớp | Báo lỗi tiếng Việt, không gửi yêu cầu sai | Đã có validation và unit test |
| Đăng ký email mới | Nhận mã, chưa vào tài khoản trước xác nhận | Chờ project/email thật |
| Mã sai/hết hạn, resend | Báo lỗi; không tạo phiên giả | Chờ dịch vụ thật |
| Login sai/đúng | Báo lỗi hoặc vào tabs; hồ sơ hiện email thật | Chờ dịch vụ thật |
| Đóng/mở app trước timeout | Khôi phục đúng tài khoản | Chờ iPhone + SecureStore |
| Bỏ app hơn 15 phút | Về đăng nhập, không thấy hồ sơ | Chờ iPhone |
| Reset mật khẩu | OTP recovery → đổi mật khẩu → login lại; mật khẩu cũ không đăng nhập được | Chờ project/email thật |
| Hủy reset, đóng/mở giữa reset | Không được truy cập main bằng phiên recovery | Chờ iPhone |
| Logout và mở lại | Không khôi phục phiên đã logout | Chờ iPhone |
| Tắt mạng | Báo lỗi và hết loading khi yêu cầu thất bại, không hiện thành công giả | Chờ iPhone |
| Dynamic Type/bàn phím | Đọc rõ, cuộn đến input và nút, ẩn/hiện mật khẩu hoạt động | Chờ iPhone |

## Nguồn tham khảo

- [Supabase Auth với React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Email templates và Token](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Expo SecureStore SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/)
- [Giới hạn incoming links trong Expo Go](https://docs.expo.dev/linking/overview/)
