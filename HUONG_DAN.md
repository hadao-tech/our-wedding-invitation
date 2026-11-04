# Thiệp Đại & Hà — hiệu ứng lời chúc phiên bản 4

Lời chúc tự xuất hiện dưới màn hình, nổi nhẹ lên, giữ để đọc rồi bay lên và mờ dần. Chỉ có tên và nội dung; không có đếm số, nút trước/sau, tạm dừng hay đóng. Có thể đọc đầy đủ lời chúc dài trong sổ lưu bút. Hiệu ứng không cản chạm và cuộn trang.

## Cập nhật từ bản 3 đang hoạt động

Chỉ thay guest-wishes.js, guest-wishes.css và index.html trên GitHub của cả hai nhà. Không cần sửa Apps Script hoặc Google Sheets. Tải lại trang sau khi GitHub Pages triển khai xong.

## Cài mới

Giải nén và tải toàn bộ nội dung lên gốc repository tương ứng (index.html nằm ở gốc). Hai nhà dùng chung endpoint trong guest-config.js. Nếu backend chưa có chức năng lời chúc: thay mã Apps Script bằng backend/Code.gs, lưu, Deploy → Manage deployments → bút chì → New version → Deploy. Giữ URL /exec. Chỉ làm một lần cho cả hai nhà. Backend trả version:3 là đúng; số 4 là phiên bản hiệu ứng giao diện.

Tên và lời chúc loại Lời chúc được hiển thị chung từ hai nhà. Thông tin xác nhận tham dự không được công khai.
