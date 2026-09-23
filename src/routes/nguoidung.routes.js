const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { requireAdmin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');
const { generateNextId } = require('../utils/idGenerator');
const { homNay } = require('../services/diemTichLuyService');

const SORT_FIELDS = ['_id', 'HoTen', 'TenDangNhap', 'VaiTro', 'TrangThai', 'NgayTao'];

function buildSort(req) {
  const field = SORT_FIELDS.includes(req.query.sort) ? req.query.sort : '_id';
  const order = req.query.order === 'desc' ? -1 : 1;
  return { field, order, sortObj: { [field]: order } };
}

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const db = getDB();
    const { field, order, sortObj } = buildSort(req);
    const q = (req.query.q || '').trim();

    const filter = q
      ? { $or: [{ HoTen: { $regex: q, $options: 'i' } }, { TenDangNhap: { $regex: q, $options: 'i' } }, { Email: { $regex: q, $options: 'i' } }] }
      : {};

    const danhSach = await db.collection(COL.NGUOI_DUNG).find(filter).sort(sortObj).toArray();
    res.render('nguoidung/index', { title: 'Quản lý Người dùng', danhSach, q, sortField: field, sortOrder: order });
  } catch (err) {
    next(err);
  }
});

router.get('/new', requireAdmin, (req, res) => {
  res.render('nguoidung/form', { title: 'Thêm Người dùng', nd: null });
});

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const db = getDB();
    const col = db.collection(COL.NGUOI_DUNG);
    const tenDangNhap = req.body.tenDangNhap.trim();

    const trung = await col.findOne({ TenDangNhap: tenDangNhap });
    if (trung) {
      flashError(req, 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.');
      return res.redirect('/nguoi-dung/new');
    }

    const id = await generateNextId(col, 'ND');
    await col.insertOne({
      _id: id,
      HoTen: req.body.hoTen.trim(),
      TenDangNhap: tenDangNhap,
      MatKhau: req.body.matKhau,
      Email: req.body.email || '',
      VaiTro: req.body.vaiTro,
      TrangThai: req.body.trangThai || 'HoatDong',
      NgayTao: homNay(),
    });

    flashSuccess(req, `Đã thêm tài khoản ${id}.`);
    res.redirect('/nguoi-dung');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const db = getDB();
    const nd = await db.collection(COL.NGUOI_DUNG).findOne({ _id: req.params.id });
    if (!nd) {
      flashError(req, 'Không tìm thấy tài khoản.');
      return res.redirect('/nguoi-dung');
    }
    res.render('nguoidung/form', { title: 'Sửa Người dùng', nd });
  } catch (err) {
    next(err);
  }
});

router.post('/:id', requireAdmin, async (req, res, next) => {
  try {
    const db = getDB();
    const col = db.collection(COL.NGUOI_DUNG);
    const tenDangNhap = req.body.tenDangNhap.trim();

    const trung = await col.findOne({ TenDangNhap: tenDangNhap, _id: { $ne: req.params.id } });
    if (trung) {
      flashError(req, 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.');
      return res.redirect(`/nguoi-dung/${req.params.id}/edit`);
    }

    const update = {
      HoTen: req.body.hoTen.trim(),
      TenDangNhap: tenDangNhap,
      Email: req.body.email || '',
      VaiTro: req.body.vaiTro,
      TrangThai: req.body.trangThai || 'HoatDong',
    };
    if (req.body.matKhau && req.body.matKhau.trim()) update.MatKhau = req.body.matKhau;

    await col.updateOne({ _id: req.params.id }, { $set: update });

    // Nếu đang sửa chính tài khoản đang đăng nhập, đồng bộ lại session
    if (req.session.user._id === req.params.id) {
      req.session.user = { ...req.session.user, ...update };
    }

    flashSuccess(req, 'Cập nhật tài khoản thành công.');
    res.redirect('/nguoi-dung');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    if (req.session.user._id === req.params.id) {
      flashError(req, 'Không thể tự xóa tài khoản đang đăng nhập.');
      return res.redirect('/nguoi-dung');
    }
    const db = getDB();
    await db.collection(COL.NGUOI_DUNG).deleteOne({ _id: req.params.id });
    flashSuccess(req, 'Đã xóa tài khoản.');
    res.redirect('/nguoi-dung');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
