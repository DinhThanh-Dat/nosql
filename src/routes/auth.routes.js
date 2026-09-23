const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { requireLogin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Đăng nhập', error: null });
});

router.post('/login', async (req, res) => {
  const tenDangNhap = (req.body.tenDangNhap || '').trim();
  const matKhau = req.body.matKhau || '';

  if (!tenDangNhap || !matKhau) {
    return res.render('login', { title: 'Đăng nhập', error: 'Vui lòng nhập đầy đủ thông tin.' });
  }

  try {
    const db = getDB();
    const user = await db.collection(COL.NGUOI_DUNG).findOne({ TenDangNhap: tenDangNhap });

    if (!user || user.MatKhau !== matKhau || user.TrangThai !== 'HoatDong') {
      return res.render('login', {
        title: 'Đăng nhập',
        error: 'Sai tên đăng nhập, mật khẩu hoặc tài khoản đã bị khóa.',
      });
    }

    req.session.user = user;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', { title: 'Đăng nhập', error: 'Lỗi kết nối cơ sở dữ liệu: ' + err.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/doi-mat-khau', requireLogin, (req, res) => {
  res.render('doimatkhau', { title: 'Đổi mật khẩu' });
});

router.post('/doi-mat-khau', requireLogin, async (req, res) => {
  const { matKhauCu, matKhauMoi, nhapLai } = req.body;
  const user = req.session.user;

  if (user.MatKhau !== matKhauCu) {
    flashError(req, 'Mật khẩu hiện tại không đúng.');
    return res.redirect('/doi-mat-khau');
  }
  if (!matKhauMoi || matKhauMoi.length < 4) {
    flashError(req, 'Mật khẩu mới phải có ít nhất 4 ký tự.');
    return res.redirect('/doi-mat-khau');
  }
  if (matKhauMoi !== nhapLai) {
    flashError(req, 'Mật khẩu nhập lại không khớp.');
    return res.redirect('/doi-mat-khau');
  }

  const db = getDB();
  await db.collection(COL.NGUOI_DUNG).updateOne({ _id: user._id }, { $set: { MatKhau: matKhauMoi } });
  req.session.user.MatKhau = matKhauMoi;

  flashSuccess(req, 'Đổi mật khẩu thành công.');
  res.redirect('/dashboard');
});

module.exports = router;
