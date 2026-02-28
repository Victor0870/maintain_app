# Quản lý Bảo dưỡng Bảo trì Nhà máy

Web app quản lý hoạt động bảo dưỡng bảo trì: đăng nhập (tài khoản do admin cấp), công việc, thiết bị, vật tư, lịch, cảnh báo, Work Order (xuất Excel/Word, in), cài đặt rủi ro & biện pháp phòng ngừa.

- **Frontend & Host:** Next.js 15, Vercel
- **Database & Auth:** Firebase (Authentication + Firestore)

## Cài đặt

1. Clone repo và cài dependency:
   ```bash
   npm install
   ```

2. Tạo file `.env.local` từ `.env.local.example` và điền cấu hình Firebase (Client):
   - Vào [Firebase Console](https://console.firebase.google.com) → Project → Cài đặt → Cấu hình (Web).
   - Copy các biến `NEXT_PUBLIC_FIREBASE_*` vào `.env.local`.

3. (Tùy chọn) Tạo tài khoản qua API:
   - Tạo Service Account trong Firebase (Cài đặt → Tài khoản dịch vụ → Tạo khóa).
   - Thêm vào `.env.local` (hoặc biến môi trường Vercel): `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` (private key giữ nguyên `\n` khi paste vào Vercel).
   - Nếu không cấu hình Admin: tạo user thủ công trong Firebase Console → Authentication → Add user, rồi gửi email/mật khẩu cho người dùng.

4. Chạy dev:
   ```bash
   npm run dev
   ```
   Mở http://localhost:3000 → chuyển đến `/login` nếu chưa đăng nhập.

## Firestore

- **Collections:** `jobs`, `equipment`, `materials`, `workOrders`, `settings_risks`, `settings_measures`, `material_transactions`.
- **Rules:** Copy nội dung `firestore.rules` vào Firebase Console → Firestore → Rules và Publish. Hoặc dùng Firebase CLI: `firebase deploy --only firestore:rules`.
- **Chỉ mục:** Nếu dùng lọc theo `plannedDate` (lịch) hoặc `equipmentId` + `updatedAt` (công việc theo thiết bị), Firebase sẽ gợi ý tạo index trong console khi chạy query. Có thể deploy index: `firebase deploy --only firestore:indexes` (cần file `firestore.indexes.json`).

## Triển khai Vercel

1. Đẩy code lên GitHub.
2. Kết nối repo với Vercel.
3. Thêm biến môi trường (giống `.env.local`) trong Vercel.
4. Deploy.

## Bảo mật & audit

- Chạy `npm audit` để xem cảnh báo. Một số bản sửa cần `npm audit fix --force` (có thể gây breaking change). Thư viện `xlsx` có advisory chưa có bản vá chính thức; có thể cân nhắc thay thế sau.

## Tính năng chính

- **Đăng nhập:** Chỉ form đăng nhập; không có đăng ký. Admin tạo tài khoản (trang Người dùng hoặc Firebase Console) và cấp cho người dùng.
- **Công việc:** Đã làm / Đang làm / Sắp làm; thêm việc; xem theo ngày/tuần.
- **Thiết bị:** Danh sách, lịch bảo trì định kỳ, cảnh báo sắp đến hạn, điều chỉnh lịch, lịch sử công việc bảo trì.
- **Work Order:** Rủi ro & biện pháp chọn từ Cài đặt (có tìm kiếm gợi ý); vị trí làm việc; người phê duyệt & ô chữ ký; xuất Excel/Word, in.
- **Vật tư:** Danh sách, tồn kho, lịch sử nhập/xuất (sẽ mở rộng: mua bán, gắn công việc).
- **Cài đặt:** Danh sách rủi ro an toàn và biện pháp phòng ngừa để chọn khi tạo Work Order.
