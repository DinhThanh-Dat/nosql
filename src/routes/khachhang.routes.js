const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { requireLogin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');
const { generateNextId } = require('../utils/idGenerator');

const SORT_FIELDS = ['_id', 'HoTen', 'SoDienThoai', 'DiemHienTai', 'NgayDangKy', 'TrangThai'];

function buildSort(req) {
  const field = SORT_FIELDS.includes(req.query.sort) ? req.query.sort : '_id';
  const order = req.query.order === 'desc' ? -1 : 1;
  return { field, order, sortObj: { [field]: order } };
}

// ----- Danh sách + tìm kiếm + sắp xếp -----
router.get('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const q = (req.query.q || '').trim();
    const { field, order, sortObj } = buildSort(req);

    const filter = q
      ? {
          $or: [
            { _id: { $regex: q, $options: 'i' } },
            { HoTen: { $regex: q, $options: 'i' } },
            { SoDienThoai: { $regex: q, $options: 'i' } },
            { Email: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const danhSach = await db.collection(COL.KHACH_HANG).find(filter).sort(sortObj).toArray();

    res.render('khachhang/index', {
      title: 'Quản lý Khách hàng',
      danhSach,
      q,
      sortField: field,
      sortOrder: order,
    });
  } catch (err) {
    next(err);
  }
});

// ----- Form thêm mới -----
router.get('/new', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const dsHang = await db.collection(COL.HANG_THANH_VIEN).find({}).sort({ DiemToiThieu: 1 }).toArray();
    res.render('khachhang/form', { title: 'Thêm Khách hàng', kh: null, dsHang });
  } catch (err) {
    next(err);
  }
});

// ----- Tạo mới -----
router.post('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const col = db.collection(COL.KHACH_HANG);
    const dsHang = await db.collection(COL.HANG_THANH_VIEN).find({}).toArray();
    const hang = dsHang.find((h) => h._id === req.body.maHang);

    if (!hang) {
      flashError(req, 'Vui lòng chọn hạng thành viên hợp lệ.');
      return res.redirect('/khach-hang/new');
    }

    const id = await generateNextId(col, 'KH');
    const doc = {
      _id: id,
      HoTen: req.body.hoTen.trim(),
      GioiTinh: req.body.gioiTinh,
      NgaySinh: req.body.ngaySinh,
      SoDienThoai: req.body.soDienThoai.trim(),
      Email: req.body.email.trim(),
      DiaChi: {
        SoNha: req.body.soNha || '',
        Duong: req.body.duong || '',
        Quan: req.body.quan || '',
        ThanhPho: req.body.thanhPho || '',
      },
      HangThanhVien: { MaHang: hang._id, TenHang: hang.TenHang },
      DiemHienTai: parseInt(req.body.diemHienTai, 10) || 0,
      NgayDangKy: req.body.ngayDangKy,
      TrangThai: req.body.trangThai || 'HoatDong',
    };
    await col.insertOne(doc);

    flashSuccess(req, `Đã thêm khách hàng ${id}.`);
    res.redirect('/khach-hang');
  } catch (err) {
    next(err);
  }
});

// ----- Form sửa -----
router.get('/:id/edit', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const kh = await db.collection(COL.KHACH_HANG).findOne({ _id: req.params.id });
    if (!kh) {
      flashError(req, 'Không tìm thấy khách hàng.');
      return res.redirect('/khach-hang');
    }
    const dsHang = await db.collection(COL.HANG_THANH_VIEN).find({}).sort({ DiemToiThieu: 1 }).toArray();
    res.render('khachhang/form', { title: 'Sửa Khách hàng', kh, dsHang });
  } catch (err) {
    next(err);
  }
});

// ----- Cập nhật -----
router.post('/:id', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const dsHang = await db.collection(COL.HANG_THANH_VIEN).find({}).toArray();
    const hang = dsHang.find((h) => h._id === req.body.maHang);

    const update = {
      HoTen: req.body.hoTen.trim(),
      GioiTinh: req.body.gioiTinh,
      NgaySinh: req.body.ngaySinh,
      SoDienThoai: req.body.soDienThoai.trim(),
      Email: req.body.email.trim(),
      DiaChi: {
        SoNha: req.body.soNha || '',
        Duong: req.body.duong || '',
        Quan: req.body.quan || '',
        ThanhPho: req.body.thanhPho || '',
      },
      DiemHienTai: parseInt(req.body.diemHienTai, 10) || 0,
      NgayDangKy: req.body.ngayDangKy,
      TrangThai: req.body.trangThai || 'HoatDong',
    };
    if (hang) update.HangThanhVien = { MaHang: hang._id, TenHang: hang.TenHang };

    await db.collection(COL.KHACH_HANG).updateOne({ _id: req.params.id }, { $set: update });

    flashSuccess(req, 'Cập nhật khách hàng thành công.');
    res.redirect('/khach-hang');
  } catch (err) {
    next(err);
  }
});

// ----- Xóa -----
router.post('/:id/delete', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    await db.collection(COL.KHACH_HANG).deleteOne({ _id: req.params.id });
    flashSuccess(req, 'Đã xóa khách hàng.');
    res.redirect('/khach-hang');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
