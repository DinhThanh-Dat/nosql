const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { requireLogin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');
const { generateNextId } = require('../utils/idGenerator');

const SORT_FIELDS = ['_id', 'TenUuDai', 'GiaTri', 'DiemCanDoi', 'NgayBatDau', 'NgayKetThuc', 'SoLuongDaSuDung', 'TrangThai'];

function buildSort(req) {
  const field = SORT_FIELDS.includes(req.query.sort) ? req.query.sort : '_id';
  const order = req.query.order === 'desc' ? -1 : 1;
  return { field, order, sortObj: { [field]: order } };
}

function toArray(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

router.get('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const { field, order, sortObj } = buildSort(req);
    const danhSach = await db.collection(COL.UU_DAI).find({}).sort(sortObj).toArray();
    res.render('uudai/index', { title: 'Quản lý Ưu đãi', danhSach, sortField: field, sortOrder: order });
  } catch (err) {
    next(err);
  }
});

router.get('/new', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const dsHang = await db.collection(COL.HANG_THANH_VIEN).find({}).sort({ DiemToiThieu: 1 }).toArray();
    res.render('uudai/form', { title: 'Thêm Ưu đãi', ud: null, dsHang });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const col = db.collection(COL.UU_DAI);
    const id = await generateNextId(col, 'UD');
    await col.insertOne({
      _id: id,
      TenUuDai: req.body.tenUuDai.trim(),
      LoaiUuDai: req.body.loaiUuDai,
      GiaTri: parseFloat(req.body.giaTri) || 0,
      DiemCanDoi: parseInt(req.body.diemCanDoi, 10) || 0,
      HangApDung: toArray(req.body.hangApDung),
      NgayBatDau: req.body.ngayBatDau,
      NgayKetThuc: req.body.ngayKetThuc,
      SoLuong: parseInt(req.body.soLuong, 10) || 0,
      SoLuongDaSuDung: parseInt(req.body.soLuongDaSuDung, 10) || 0,
      TrangThai: req.body.trangThai,
      MoTa: req.body.moTa || '',
    });
    flashSuccess(req, `Đã thêm ưu đãi ${id}.`);
    res.redirect('/uu-dai');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const ud = await db.collection(COL.UU_DAI).findOne({ _id: req.params.id });
    if (!ud) {
      flashError(req, 'Không tìm thấy ưu đãi.');
      return res.redirect('/uu-dai');
    }
    const dsHang = await db.collection(COL.HANG_THANH_VIEN).find({}).sort({ DiemToiThieu: 1 }).toArray();
    res.render('uudai/form', { title: 'Sửa Ưu đãi', ud, dsHang });
  } catch (err) {
    next(err);
  }
});

router.post('/:id', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    await db.collection(COL.UU_DAI).updateOne(
      { _id: req.params.id },
      {
        $set: {
          TenUuDai: req.body.tenUuDai.trim(),
          LoaiUuDai: req.body.loaiUuDai,
          GiaTri: parseFloat(req.body.giaTri) || 0,
          DiemCanDoi: parseInt(req.body.diemCanDoi, 10) || 0,
          HangApDung: toArray(req.body.hangApDung),
          NgayBatDau: req.body.ngayBatDau,
          NgayKetThuc: req.body.ngayKetThuc,
          SoLuong: parseInt(req.body.soLuong, 10) || 0,
          SoLuongDaSuDung: parseInt(req.body.soLuongDaSuDung, 10) || 0,
          TrangThai: req.body.trangThai,
          MoTa: req.body.moTa || '',
        },
      }
    );
    flashSuccess(req, 'Cập nhật ưu đãi thành công.');
    res.redirect('/uu-dai');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    await db.collection(COL.UU_DAI).deleteOne({ _id: req.params.id });
    flashSuccess(req, 'Đã xóa ưu đãi.');
    res.redirect('/uu-dai');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
