require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const { connectDB } = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ----- Cấu hình view engine (EJS) -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----- Middlewares chung -----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'qlkhachhangthanthiet-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }, // 8 giờ
}));

// Đưa thông tin đăng nhập + thông báo flash vào mọi view mà không cần truyền tay từng route
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flashSuccess = req.session.flashSuccess || null;
  res.locals.flashError = req.session.flashError || null;
  delete req.session.flashSuccess;
  delete req.session.flashError;
  res.locals.currentPath = req.path;
  next();
});

// ----- Routes -----
app.use('/', require('./src/routes/auth.routes'));
app.use('/', require('./src/routes/dashboard.routes'));
app.use('/khach-hang', require('./src/routes/khachhang.routes'));
app.use('/hang-thanh-vien', require('./src/routes/hangthanhvien.routes'));
app.use('/giao-dich', require('./src/routes/giaodich.routes'));
app.use('/diem-tich-luy', require('./src/routes/diemtichluy.routes'));
app.use('/uu-dai', require('./src/routes/uudai.routes'));
app.use('/su-dung-uu-dai', require('./src/routes/sudunguudai.routes'));
app.use('/nguoi-dung', require('./src/routes/nguoidung.routes'));
app.use('/truy-van', require('./src/routes/truyvan.routes'));
app.use('/sao-luu-phuc-hoi', require('./src/routes/backup.routes'));

// ----- 404 -----
app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

// ----- Xử lý lỗi chung -----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Lỗi hệ thống', error: err.message });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✔ Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('✘ Không thể kết nối MongoDB:', err.message);
    console.error('  Kiểm tra MongoDB Server (mongod) và file .env (MONGODB_URI, MONGODB_DBNAME).');
    // Vẫn khởi động server để có thể xem trang đăng nhập / thông báo lỗi thay vì crash hoàn toàn.
    app.listen(PORT, () => {
      console.log(`⚠ Server đang chạy tại http://localhost:${PORT} (CẢNH BÁO: chưa kết nối được MongoDB)`);
    });
  });

module.exports = app;
