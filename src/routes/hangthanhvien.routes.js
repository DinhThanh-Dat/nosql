const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { requireLogin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');
const { generateNextId } = require('../utils/idGenerator');
const { dangDuocSuDung } = require('../services/hangThanhVienService');

const SORT_FIELDS = ['_id', 'TenHang', 'DiemToiThieu', 'DiemToiDa', 'TyLeUuDai'];

function buildSort(req) {
  const field = SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'DiemToiThieu';
  const order = req.query.order === 'desc' ? -1 : 1;
  return { field, order, sortObj: { [field]: order } };
}

router.get('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const { field, order, sortObj } = buildSort(req);
    const danhSach = await db.collection(COL.HANG_THANH_VIEN).find({}).sort(sortObj).toArray();
    res.render('hangthanhvien/index', { title: 'Hạng thành viên', danhSach, sortField: field, sortOrder: order });
  } catch (err) {
    next(err);
  }
});

router.get('/new', requireLogin, (req, res) => {
  res.render('hangthanhvien/form', { title: 'Thêm Hạng thành viên', hang: null });
});

router.post('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const col = db.collection(COL.HANG_THANH_VIEN);
    const id = await generateNextId(col, 'HTV');
    await col.insertOne({
      _id: id,
      TenHang: req.body.tenHang.trim(),
      DiemToiThieu: parseInt(req.body.diemToiThieu, 10) || 0,
      DiemToiDa: req.body.khongGioiHan === 'on' ? null : parseInt(req.body.diemToiDa, 10),
      TyLeUuDai: parseInt(req.body.tyLeUuDai, 10) || 0,
      MoTa: req.body.moTa || '',
    });
    flashSuccess(req, `Đã thêm hạng thành viên ${id}.`);
    res.redirect('/hang-thanh-vien');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const hang = await db.collection(COL.HANG_THANH_VIEN).findOne({ _id: req.params.id });
    if (!hang) {
      flashError(req, 'Không tìm thấy hạng thành viên.');
      return res.redirect('/hang-thanh-vien');
    }
    res.render('hangthanhvien/form', { title: 'Sửa Hạng thành viên', hang });
  } catch (err) {
    next(err);
  }
});

router.post('/:id', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    await db.collection(COL.HANG_THANH_VIEN).updateOne(
      { _id: req.params.id },
      {
        $set: {
          TenHang: req.body.tenHang.trim(),
          DiemToiThieu: parseInt(req.body.diemToiThieu, 10) || 0,
          DiemToiDa: req.body.khongGioiHan === 'on' ? null : parseInt(req.body.diemToiDa, 10),
          TyLeUuDai: parseInt(req.body.tyLeUuDai, 10) || 0,
          MoTa: req.body.moTa || '',
        },
      }
    );
    flashSuccess(req, 'Cập nhật thành công.');
    res.redirect('/hang-thanh-vien');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', requireLogin, async (req, res, next) => {
  try {
    if (await dangDuocSuDung(req.params.id)) {
      flashError(req, 'Không thể xóa: đang có khách hàng thuộc hạng này.');
      return res.redirect('/hang-thanh-vien');
    }
    const db = getDB();
    await db.collection(COL.HANG_THANH_VIEN).deleteOne({ _id: req.params.id });
    flashSuccess(req, 'Đã xóa hạng thành viên.');
    res.redirect('/hang-thanh-vien');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
