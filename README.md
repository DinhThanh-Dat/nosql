# QUẢN LÝ KHÁCH HÀNG THÂN THIẾT — Ứng dụng Web (Node.js + Express + EJS + MongoDB)

Ứng dụng minh họa cho đề tài **"Tìm hiểu công cụ Studio 3T để quản trị và khai thác CSDL tài
liệu Quản lý khách hàng thân thiết"** (môn Dữ liệu NoSQL). Đây là bản **web app** (giao diện
HTML/CSS/JS, sidebar xanh dương, logo riêng), đúng kiến trúc **EJS → Express/Node.js → MongoDB**
đã trình bày trong Chương 4 của tiểu luận.

> Phiên bản trước dùng C# WinForms đã được thay thế hoàn toàn bằng bản web này theo yêu cầu.

---

## 1. Công nghệ sử dụng

- Node.js (khuyến nghị bản 18+; đã build/test với Node 22)
- Express 5 — web framework
- EJS — template engine render giao diện HTML phía server
- MongoDB Node.js Driver (gói `mongodb`, KHÔNG dùng Mongoose, đúng như đề tài yêu cầu "MongoDB Driver")
- express-session — quản lý phiên đăng nhập
- Vanilla CSS/JS thuần (không dùng Bootstrap/Tailwind) — sidebar xanh dương tự thiết kế, logo SVG riêng

## 2. Cấu trúc project

```
qlkhachhangthanthiet-web/
├─ server.js                 Điểm khởi động ứng dụng
├─ package.json
├─ .env.example               Sao chép thành .env rồi chỉnh lại
├─ SampleData/                 7 file JSON dữ liệu mẫu + setup_indexes.js
├─ src/
│  ├─ config/                 Kết nối MongoDB (db.js) + tên collection (collections.js)
│  ├─ middlewares/             requireLogin, requireAdmin (phân quyền)
│  ├─ utils/                   Sinh mã tự động, flash message
│  ├─ services/                Toàn bộ nghiệp vụ: tính điểm, đổi ưu đãi, 15 câu truy vấn,
│  │                            backup/restore, import/export, nhập dữ liệu mẫu
│  └─ routes/                  1 file route cho mỗi module (khachhang, giaodich, uudai,...)
├─ views/                      Giao diện EJS (1 thư mục con cho mỗi module)
│  └─ partials/                sidebar, topbar, head, alert, layout dùng chung
└─ public/                     CSS, JS phía client, logo SVG
```

## 3. Cài đặt & chạy

### Yêu cầu
- Đã cài [Node.js](https://nodejs.org) (bản 18 trở lên)
- MongoDB Server đang chạy (mặc định `mongodb://127.0.0.1:27017`), có thể:
  - Cài MongoDB Community Server trực tiếp, hoặc
  - Chạy bằng Docker: `docker run -d -p 27017:27017 --name mongo mongo`
- (Tùy chọn) MongoDB Database Tools (`mongodump`/`mongorestore`) nếu muốn dùng chức năng sao
  lưu/phục hồi toàn CSDL — không bắt buộc vì đã có Export/Import JSON không cần công cụ ngoài.
- (Tùy chọn) Studio 3T — quản trị/khai thác trực quan như đã trình bày trong tiểu luận.

### Các bước

```bash
# 1. Vào thư mục project
cd qlkhachhangthanthiet-web

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Tạo file cấu hình môi trường
copy .env.example .env
# Mở .env và chỉnh MONGODB_URI / MONGODB_DBNAME nếu cần

# 4. Nạp dữ liệu mẫu (chọn 1 trong 2 cách bên dưới, mục 4)

# 5. Chạy ứng dụng
npm start
```

Mở trình duyệt tại **http://localhost:3000** — sẽ tự chuyển tới trang đăng nhập.

### Nạp dữ liệu mẫu

**Cách A — dùng mongoimport (khuyến nghị cho lần chạy đầu tiên, vì DB đang trống):**
```bash
cd SampleData
mongoimport --db QLKhachHangThanThiet --collection NguoiDung      --file NguoiDung.json --jsonArray
mongoimport --db QLKhachHangThanThiet --collection HangThanhVien  --file HangThanhVien.json --jsonArray
mongoimport --db QLKhachHangThanThiet --collection KhachHang      --file KhachHang.json --jsonArray
mongoimport --db QLKhachHangThanThiet --collection GiaoDich       --file GiaoDich.json --jsonArray
mongoimport --db QLKhachHangThanThiet --collection DiemTichLuy    --file DiemTichLuy.json --jsonArray
mongoimport --db QLKhachHangThanThiet --collection UuDai          --file UuDai.json --jsonArray
mongoimport --db QLKhachHangThanThiet --collection SuDungUuDai    --file SuDungUuDai.json --jsonArray
mongosh QLKhachHangThanThiet setup_indexes.js
```
Hoặc Import bằng **Studio 3T** (đúng quy trình đã trình bày trong tiểu luận, Chương 2.3.2).

**Cách B — dùng ngay trong ứng dụng (chỉ dùng được khi DB đã có ít nhất 1 tài khoản Admin):**
Đăng nhập → menu **Sao lưu / Phục hồi** (Admin) → mục 3 "Nhập dữ liệu mẫu ban đầu".

### Tài khoản đăng nhập mẫu

| Tên đăng nhập | Mật khẩu | Vai trò   | Trạng thái |
|---------------|----------|-----------|------------|
| admin         | 123456   | Admin     | Hoạt động |
| lan.tran      | 123456   | Nhân viên | Hoạt động |
| nam.le        | 123456   | Nhân viên | Hoạt động |
| anh.pham      | 123456   | Nhân viên | Hoạt động |
| bao.vo        | 123456   | Nhân viên | Đã khóa (để demo trường hợp đăng nhập thất bại) |

> ⚠️ Mật khẩu lưu dạng văn bản thường (plaintext) để đơn giản hóa việc demo/chấm điểm theo
> đúng dữ liệu mẫu đề tài. Khi triển khai thực tế nên băm mật khẩu (bcrypt) trước khi lưu.

---

## 4. Phân quyền Admin / Nhân viên

| Chức năng | Admin | Nhân viên |
|---|:---:|:---:|
| Dashboard, 15 câu truy vấn | ✅ | ✅ |
| Khách hàng — xem, **sắp xếp**, tìm kiếm, **thêm, sửa, xóa** | ✅ | ✅ |
| Hạng thành viên — xem, **sắp xếp**, **thêm, sửa, xóa** | ✅ | ✅ |
| Giao dịch — xem, lọc, **sắp xếp**, **thêm, sửa, xóa** | ✅ | ✅ |
| Điểm tích lũy — xem, **sắp xếp**, điều chỉnh thủ công, xóa (hoàn tác điểm) | ✅ | ✅ |
| Ưu đãi — xem, **sắp xếp**, **thêm, sửa, xóa** | ✅ | ✅ |
| Sử dụng ưu đãi — xem, **sắp xếp**, đổi ưu đãi, hủy lượt dùng | ✅ | ✅ |
| Người dùng hệ thống (tài khoản đăng nhập) | ✅ | ❌ (bị chuyển hướng kèm thông báo) |
| Sao lưu / Phục hồi / Import-Export / Nhập dữ liệu mẫu | ✅ | ❌ (bị chuyển hướng kèm thông báo) |

Mọi bảng danh sách đều hỗ trợ **sắp xếp bằng cách bấm vào tiêu đề cột** (mũi tên ▲▼ cho biết
cột và chiều đang sắp xếp), giữ nguyên bộ lọc/tìm kiếm hiện tại.

---

## 5. LUỒNG DEMO ĐỀ XUẤT (theo đúng thứ tự trình bày trước giảng viên)

### Bước 0 — Chuẩn bị
1. Đảm bảo MongoDB đang chạy và đã nạp dữ liệu mẫu (mục 3).
2. Chạy `npm start`, mở `http://localhost:3000`.

### Bước 1 — Đăng nhập & phân quyền
1. Tại trang đăng nhập, thử đăng nhập với `bao.vo / 123456` → hệ thống báo **"tài khoản đã bị
   khóa"** (minh họa xử lý trạng thái tài khoản).
2. Đăng nhập bằng `lan.tran / 123456` (Nhân viên) → chỉ ra rằng menu **Quản trị hệ thống**
   (Người dùng, Sao lưu/Phục hồi) **không hiển thị** trong sidebar.
3. Đăng xuất, đăng nhập lại bằng `admin / 123456` (Admin) → menu Quản trị hệ thống xuất hiện đầy đủ.

### Bước 2 — Dashboard tổng quan
Vào **Thống kê tổng quan**: chỉ ra 4 thẻ số liệu (doanh thu, số khách hàng, số hạng có khách
hàng, ưu đãi được đổi nhiều nhất) và 4 bảng (doanh thu theo tháng — câu 15, top 5 khách hàng
chi tiêu cao — câu 9, phân bố theo hạng — câu 12, top ưu đãi — câu 14). Đây chính là các câu
truy vấn nâng cao trong Chương 3 tiểu luận, được tính **trực tiếp từ MongoDB** mỗi lần tải trang.

### Bước 3 — Danh mục: Hạng thành viên (CRUD + sắp xếp)
1. Vào **Hạng thành viên** → bấm tiêu đề cột "Điểm tối thiểu" để minh họa **sắp xếp**.
2. Bấm **+ Thêm hạng thành viên** → tạo thử 1 hạng mới (vd. "Bạch Kim", điểm tối thiểu 9000,
   tick "Không giới hạn") → **Thêm mới**.
3. Bấm **Sửa** một hạng bất kỳ, đổi tỷ lệ ưu đãi → **Cập nhật**.
4. Thử **Xóa** hạng đang có khách hàng thuộc hạng đó → hệ thống chặn và báo lỗi rõ ràng
   (minh họa ràng buộc dữ liệu tham chiếu dù MongoDB không có khóa ngoại).

### Bước 4 — Danh mục: Khách hàng (CRUD + tìm kiếm + sắp xếp)
1. Vào **Khách hàng** → gõ từ khóa vào ô tìm kiếm (theo mã/họ tên/SĐT/email) → **Tìm kiếm**.
2. Bấm tiêu đề cột "Điểm hiện tại" để sắp xếp giảm dần → chỉ ra khách hàng có điểm cao nhất.
3. Bấm **+ Thêm khách hàng** → điền thông tin, chọn hạng thành viên → **Thêm mới**.
4. Bấm **Sửa** một khách hàng → đổi số điện thoại → **Cập nhật**.
5. **Xóa** khách hàng vừa tạo (thử nghiệm) để dọn dữ liệu demo.

### Bước 5 — Giao dịch (nghiệp vụ tích điểm tự động)
1. Vào **Giao dịch** → bấm **+ Thêm giao dịch**.
2. Chọn 1 khách hàng, thêm 1-2 dòng sản phẩm (số lượng × đơn giá) → quan sát **"Tổng tiền"** và
   **"Điểm nhận dự kiến"** tự cập nhật theo thời gian thực (JavaScript phía client).
3. Chọn trạng thái **"Hoàn tất"** → **Thêm giao dịch**.
4. Quay lại màn hình **Khách hàng**, kiểm tra điểm của khách hàng đó đã **tự động cộng thêm**
   đúng bằng điểm nhận (quy tắc: 10.000đ = 1 điểm).
5. Vào **Điểm tích lũy**, lọc theo khách hàng đó → thấy bản ghi lịch sử vừa được ghi tự động
   với lý do "Tích điểm từ giao dịch mua hàng".
6. (Tùy chọn) Lọc/sắp xếp danh sách giao dịch theo trạng thái hoặc theo Tổng tiền để minh họa
   thêm chức năng lọc + sắp xếp.

### Bước 6 — Ưu đãi & Sử dụng ưu đãi (nghiệp vụ đổi điểm)
1. Vào **Ưu đãi** → xem danh sách, thử **+ Thêm ưu đãi** mới (chọn hạng áp dụng bằng checkbox).
2. Vào **Sử dụng ưu đãi** → ở form "Đổi ưu đãi mới", chọn 1 khách hàng và 1 ưu đãi → quan sát
   dòng thông báo điều kiện **tự động kiểm tra qua API** (đủ điểm hay không, hạng có được áp
   dụng không, còn hiệu lực/còn số lượng không) hiện ra ngay khi chọn, trước khi bấm submit.
3. Bấm **Xác nhận đổi ưu đãi** với 1 trường hợp hợp lệ → kiểm tra lại điểm khách hàng đã bị
   trừ đúng số điểm cần đổi, và số lượng "Đã dùng" của ưu đãi tăng lên 1.
4. Thử bấm **Hủy** một lượt sử dụng vừa tạo → điểm được hoàn lại cho khách hàng, số lượng đã
   dùng giảm lại.

### Bước 7 — Điểm tích lũy (điều chỉnh thủ công)
1. Vào **Điểm tích lũy** → dùng form "Điều chỉnh điểm thủ công" để cộng/trừ điểm tay cho 1
   khách hàng, nhập lý do → **Ghi nhận điều chỉnh**.
2. Thử **Xóa** bản ghi vừa tạo → hệ thống tự hoàn tác đúng phần điểm của bản ghi đó.

### Bước 8 — 15 câu truy vấn MongoDB (đúng Chương 3 tiểu luận)
1. Vào **15 câu truy vấn MongoDB** → chọn lần lượt từng câu trong danh sách thả xuống.
2. Với mỗi câu, chỉ ra: **Collection** liên quan, **mức độ** (Cơ bản/Nâng cao), đoạn diễn giải
   pipeline, và **bảng kết quả thật lấy trực tiếp từ MongoDB**.
3. Nên demo ít nhất: câu 3 (tìm theo tên bằng regex), câu 7 (tổng doanh thu — $group), câu 9
   (top 5 khách hàng chi tiêu cao — có $lookup nối 2 collection), câu 15 (doanh thu theo tháng).

### Bước 9 — Quản trị hệ thống (chỉ Admin)
1. Đăng nhập lại bằng `admin / 123456`.
2. Vào **Người dùng** → thử **+ Thêm người dùng**, **Sửa** (đổi vai trò Nhân viên ↔ Admin),
   **Xóa** một tài khoản không phải tài khoản đang đăng nhập (thử xóa chính mình để thấy hệ
   thống chặn lại).
3. Vào **Sao lưu / Phục hồi**:
   - Mục 1: nhập đường dẫn thư mục rồi bấm **Thực hiện Sao lưu** (cần cài MongoDB Database
     Tools trên máy chạy server) — minh họa `mongodump`.
   - Mục 2: chọn 1 Collection rồi **Tải file JSON (Export)** để tải file JSON của Collection đó
     về máy; hoặc nhập đường dẫn 1 file JSON có sẵn để **Import** (có thể chọn "Xóa dữ liệu cũ
     trước khi Import").
   - Mục 3: **Nhập dữ liệu mẫu ban đầu** — reset toàn bộ dữ liệu về đúng bộ mẫu ban đầu của đề
     tài, dùng để làm sạch môi trường trước một lượt demo khác.

### Bước 10 — Đổi mật khẩu & Đăng xuất
1. Bấm **Đổi mật khẩu** ở góc trên phải → đổi thử mật khẩu → đăng xuất → đăng nhập lại bằng
   mật khẩu mới để xác nhận đã lưu đúng.
2. Bấm **Đăng xuất** để kết thúc phiên demo.

---

## 6. Ánh xạ chức năng với thang điểm đánh giá (file PDF đề tài)

| # | Nội dung thang điểm | Nơi thể hiện |
|---|---|---|
| 1-4 | Lý thuyết Tool, so sánh GUI Tool khác | Trình bày trong quyển báo cáo (Chương 1) |
| 5 | Xây dựng Database (đủ dữ liệu, truy vấn cơ bản/nâng cao) | 7 Collection trong `src/config/collections.js`; `SampleData/`; 15 câu truy vấn ở `src/services/truyVanService.js` |
| 6 | Import/Export; Backup/Restore | Trang **Sao lưu / Phục hồi** (`/sao-luu-phuc-hoi`) |
| 7 | Truy vấn cơ bản + nâng cao | Trang **15 câu truy vấn MongoDB** (`/truy-van`) |
| 8 | Triển khai Database kết nối phần mềm ứng dụng | `src/config/db.js`, toàn bộ `src/services/`, `src/routes/` |
| 9 | Demo ứng dụng (đăng nhập/phân quyền, CRUD, chức năng hỗ trợ) | Toàn bộ luồng demo ở mục 5 |
| 10 | Trình bày báo cáo, nộp đủ file | Thư mục nộp bài: `word`, `powerpoint`, `Source code` (project này) |

## 7. Quy tắc nghiệp vụ đã cài đặt

- **Quy đổi điểm:** 10.000đ giao dịch mua hàng hoàn tất = 1 điểm tích lũy.
- Thêm **giao dịch** mới (MuaHang, HoanTat) → tự động cộng điểm + ghi `DiemTichLuy` + tự cập
  nhật hạng thành viên nếu điểm mới vượt ngưỡng.
- **Đổi ưu đãi** → kiểm tra: còn hiệu lực, đúng hạng áp dụng, còn số lượng, đủ điểm → trừ điểm,
  tăng số lượng đã dùng, ghi lịch sử điểm.
- Xóa/Hủy giao dịch, điểm, sử dụng ưu đãi có xử lý hoàn tác điểm tương ứng (xem chú thích ngay
  trong giao diện).

## 8. Giới hạn đã biết (minh bạch khi bảo vệ đồ án)

- Sửa một giao dịch đã lưu KHÔNG tự tính lại điểm (tránh cộng/trừ trùng lặp) — điều chỉnh thủ
  công qua "Điểm tích lũy" nếu cần.
- Xóa 1 bản ghi lịch sử điểm chỉ hoàn tác đúng phần điểm của bản ghi đó, không dựng lại toàn bộ
  chuỗi DiemTruoc/DiemSau của các bản ghi sau nó.
- Mật khẩu người dùng lưu plaintext (xem mục 3).
- Đường dẫn thư mục/file trong trang Sao lưu/Phục hồi là đường dẫn **trên máy chủ đang chạy
  server.js**, không phải máy trình duyệt (bình thường khi chạy trên cùng 1 máy để demo).

## demo theo
Luồng demo hoàn chỉnh (11 bước)

1. Đăng nhập & phân quyền — nền tảng bắt buộc, làm trước mọi thứ.
Đăng nhập bao.vo (tài khoản bị khóa) → báo lỗi. Đăng nhập lan.tran (Nhân viên) → chỉ menu Quản trị bị ẩn. Đăng xuất, đăng nhập lại admin.

2. Dashboard tổng quan — cho xem "bức tranh kết quả" trước, để sau này khi demo từng nghiệp vụ, giảng viên đối chiếu ngược lại được số liệu đã thay đổi thế nào.

3. Hạng thành viên (khối xám, không phụ thuộc gì) — đây là dữ liệu nền, phải có trước vì bước 4 cần chọn hạng cho khách hàng. Demo CRUD + sắp xếp theo điểm tối thiểu.

4. Khách hàng (khối xanh dương, trung tâm) — phụ thuộc Hạng thành viên (mỗi khách hàng phải thuộc 1 hạng). Demo tìm kiếm, sắp xếp theo điểm, CRUD.

5. Giao dịch (khối xanh ngọc) — phụ thuộc Khách hàng đã tồn tại. Đây là bước quan trọng nhất để giảng viên thấy tính tự động: thêm giao dịch → quay lại bước 4 kiểm tra điểm khách hàng đã tự cộng.

6. Điểm tích lũy (khối vàng — nơi Giao dịch vừa ghi vào) — lọc theo đúng khách hàng ở bước 5, chỉ ra bản ghi vừa được tạo tự động. Sau đó demo thêm chức năng điều chỉnh thủ công.

7. Ưu đãi (khối xám, độc lập nhưng tham chiếu Hạng thành viên) — CRUD + chọn hạng áp dụng.

8. Sử dụng ưu đãi (phụ thuộc cả Khách hàng lẫn Ưu đãi) — chọn 1 khách hàng đủ điểm, đổi ưu đãi → điểm bị trừ ngay (quay lại bước 4/6 để đối chiếu) → thử hủy để hoàn điểm.

9. 15 câu truy vấn MongoDB — để cuối vì lúc này dữ liệu đã "sống" (có giao dịch, có lịch sử điểm thật), số liệu truy vấn ra sẽ có ý nghĩa thay vì chỉ là dữ liệu mẫu tĩnh.

10. Quản trị hệ thống (Người dùng, Sao lưu/Phục hồi) — để cuối vì đây là chức năng vận hành hệ thống, không thuộc nghiệp vụ chính, và cần vai trò Admin.

11. Đổi mật khẩu & Đăng xuất — kết thúc phiên demo gọn gàng.