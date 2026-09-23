const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { requireLogin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');
const { congTruDiem } = require('../services/khachHangService');
const { ghiNhanBienDong, homNay } = require('../services/diemTichLuyService');

const SORT_FIELDS = ['_id', 'MaKhachHang', 'Loai', 'SoDiem', 'NgayTao'];

function buildSort(req) {
  const field = SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'NgayTao';
  const order = req.query.order === 'desc' ? -1 : 1;
  return { field, order, sortObj: { [field]: order } };
}

router.get('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const { field, order, sortObj } = buildSort(req);
    const maKhachHang = (req.query.maKhachHang || '').trim();

    const filter = maKhachHang ? { MaKhachHang: maKhachHang } : {};
    const danhSach = await db.collection(COL.DIEM_TICH_LUY).find(filter).sort(sortObj).toArray();
    const dsKhachHang = await db.collection(COL.KHACH_HANG).find({}).sort({ HoTen: 1 }).toArray();

    res.render('diemtichluy/index', {
      title: 'Điểm tích lũy',
      danhSach,
      dsKhachHang,
      maKhachHang,
      sortField: field,
      sortOrder: order,
      homNay: homNay(),
    });
  } catch (err) {
    next(err);
  }
});

// ----- Ghi nhận điều chỉnh thủ công -----
router.post('/', requireLogin, async (req, res, next) => {
  try {
    const maKhachHang = req.body.maKhachHang;
    const loai = req.body.loai; // 'Cong' | 'Tru'
    const soDiem = parseInt(req.body.soDiem, 10);
    const lyDo = (req.body.lyDo || '').trim();

    if (!maKhachHang || !soDiem || soDiem <= 0 || !lyDo) {
      flashError(req, 'Vui lòng nhập đầy đủ: khách hàng, số điểm (dương) và lý do.');
      return res.redirect('/diem-tich-luy');
    }

    const delta = loai === 'Cong' ? soDiem : -soDiem;
    const { diemTruoc, diemSau } = await congTruDiem(maKhachHang, delta);
    await ghiNhanBienDong(maKhachHang, null, loai, soDiem, diemTruoc, diemSau, lyDo, homNay());

    flashSuccess(req, 'Đã ghi nhận điều chỉnh điểm.');
    res.redirect('/diem-tich-luy');
  } catch (err) {
    next(err);
  }
});

// ----- Xóa (hoàn tác điểm tương ứng) -----
router.post('/:id/delete', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const col = db.collection(COL.DIEM_TICH_LUY);
    const record = await col.findOne({ _id: req.params.id });
    if (!record) {
      flashError(req, 'Không tìm thấy bản ghi.');
      return res.redirect('/diem-tich-luy');
    }

    const hoanTac = record.Loai === 'Cong' ? -record.SoDiem : record.SoDiem;
    await congTruDiem(record.MaKhachHang, hoanTac);
    await col.deleteOne({ _id: req.params.id });

    flashSuccess(req, `Đã xóa bản ghi và hoàn tác ${record.SoDiem} điểm cho khách hàng ${record.MaKhachHang}.`);
    res.redirect('/diem-tich-luy');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
