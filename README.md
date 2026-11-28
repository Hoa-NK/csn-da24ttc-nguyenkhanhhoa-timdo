# ReFind – Website quản lý và tra cứu đồ thất lạc trong trường đại học

Đồ án cơ sở ngành, lớp DA24TTC, Khoa Công nghệ Thông tin, Trường Kỹ thuật và Công nghệ, Trường Đại học Trà Vinh.

- Sinh viên thực hiện: Nguyễn Khánh Hòa (MSSV 110124066)
- Giảng viên hướng dẫn: ThS. Dương Ngọc Vân Khanh
- Bản chạy trực tuyến: https://hoa-nk.github.io/csn-da24ttc-nguyenkhanhhoa-timdo/

## Giới thiệu

ReFind là website giúp sinh viên trong trường đăng tin báo mất đồ, đăng tin nhặt được đồ và tra cứu các tin đã đăng. Website viết bằng HTML, CSS và JavaScript thuần, chạy hoàn toàn trên trình duyệt và được triển khai bằng GitHub Pages. Dữ liệu được lưu trong `localStorage` của trình duyệt, chưa có máy chủ và cơ sở dữ liệu dùng chung.

## Mục tiêu dự án

- Hỗ trợ đăng tin báo mất đồ và đăng tin về đồ nhặt được.
- Xây dựng chức năng tìm kiếm, tra cứu đồ thất lạc theo tên, loại đồ, vị trí và thời gian.
- Hỗ trợ cập nhật trạng thái và chỉnh sửa thông tin tin đăng.
- Tạo môi trường kết nối giữa người mất đồ và người nhặt được đồ.
- Thiết kế giao diện tương thích với máy tính và điện thoại.

## Chức năng

Khách (chưa đăng nhập):

- Xem các bài đăng mới nhất ở trang chủ.
- Xem tất cả bài đăng, lọc theo Tất cả / Đồ nhặt được / Đồ thất lạc.
- Tìm kiếm theo từ khóa (tên đồ vật, mô tả, địa điểm) và theo ngày xảy ra.
- Xem chi tiết bài đăng: ảnh, mô tả, địa điểm, ngày, vị trí trên bản đồ. Số điện thoại liên hệ được che một phần (ví dụ `0327***617`) cho đến khi đăng nhập.
- Xem trang Giới thiệu & Hướng dẫn sử dụng, có phần câu hỏi thường gặp.
- Đăng ký, đăng nhập bằng tên đăng nhập hoặc email.

Người dùng đã đăng nhập:

- Đăng tin mất đồ hoặc nhặt được đồ, kèm ảnh (tự thu nhỏ còn cạnh dài tối đa 1200 px) và vị trí ghim trên bản đồ.
- Ghim vị trí bằng cách nhấn hoặc kéo ghim trên bản đồ, hoặc dùng vị trí hiện tại của thiết bị.
- Sửa, xóa tin của mình; lọc tin của mình, có thêm bộ lọc "Mới nhất" (7 ngày gần đây).
- Cập nhật trạng thái tin: Đang tìm → Đã tìm thấy (đồ thất lạc), Đang giữ → Đã trả lại (đồ nhặt được).
- Sửa họ tên, tên đăng nhập, email, mật khẩu.

Quản trị viên:

- Xem, sửa, xóa và cập nhật trạng thái mọi bài đăng.

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| HTML5 | Cấu trúc trang, kiểm tra biểu mẫu (`required`, `pattern`, `minlength`) |
| CSS3 | Giao diện, biến màu, Flexbox/Grid, media query cho điện thoại |
| JavaScript (ES2015+) | Xử lý giao diện, tìm kiếm, lọc, đăng ký, đăng nhập, phân quyền |
| Web Storage (`localStorage`) | Lưu tài khoản, phiên đăng nhập, bài đăng |
| Geolocation API | Lấy vị trí hiện tại khi đăng tin |
| FileReader, Canvas | Đọc và thu nhỏ ảnh trước khi lưu |
| Leaflet 1.9.4 + OpenStreetMap | Bản đồ ghim và hiển thị vị trí |
| Git, GitHub, GitHub Pages | Quản lý mã nguồn và triển khai |

## Cấu trúc thư mục

```text
index.html              Trang chủ ở thư mục gốc (dùng <base href="thesis/html/">)
thesis/
├── html/               index, posts, post, post-form, login, register, my-posts, account, about
├── css/
│   ├── common.css      Biến màu, header, footer, nút, bố cục chung
│   ├── forms.css       Kiểu chung cho biểu mẫu
│   ├── posts.css       Kiểu chung cho thẻ bài đăng
│   └── ...             CSS riêng của từng trang
├── js/
│   ├── storage.js      Đọc/ghi localStorage, bài mẫu, băm mật khẩu, tiện ích
│   └── app.js          Menu, tìm kiếm, tài khoản, đăng tin, bản đồ, phân quyền
└── assets/             Logo, poster, ảnh mặc định, ảnh bài mẫu
```

## Hạn chế

- Dữ liệu chỉ nằm trên trình duyệt và thiết bị đang dùng; người dùng khác chưa thấy được tin của nhau.
- Ảnh lưu dạng data URL nên bị giới hạn bởi dung lượng `localStorage`.
- Bản đồ dùng máy chủ tile công cộng của OpenStreetMap, cần tuân thủ [chính sách sử dụng tile](https://operations.osmfoundation.org/policies/tiles/).

## Hướng phát triển

- Thêm máy chủ và cơ sở dữ liệu dùng chung.
- Lưu ảnh trên dịch vụ lưu trữ tệp.
- Liên hệ qua website thay vì công khai số điện thoại; báo cáo tin sai và kiểm duyệt.
- Gợi ý các tin có khả năng khớp nhau và gửi thông báo cho người đăng.
