const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { requireLogin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');
const { kiemTraDieuKien, suDungUuDaiMoi, huySuDung } = require('../services/suDungUuDaiService');
const { homNay } = require('../services/diemTichLuyService');

const SORT_FIELDS = ['_id', 'MaKhachHang', 'MaUuDai', 'DiemDaDoi', 'NgaySuDung', 'TrangThai'];

function buildSort(req) {
  const field = SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'NgaySuDung';
  const order = req.query.order === 'desc' ? -1 : 1;
  return { field, order, sortObj: { [field]: order } };
}

router.get('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const { field, order, sortObj } = buildSort(req);
    const maKhachHang = (req.query.maKhachHang || '').trim();
    const filter = maKhachHang ? { MaKhachHang: maKhachHang } : {};

    const danhSach = await db.collection(COL.SU_DUNG_UU_DAI).find(filter).sort(sortObj).toArray();
    const dsKhachHang = await db.collection(COL.KHACH_HANG).find({}).sort({ HoTen: 1 }).toArray();
    const dsUuDai = await db.collection(COL.UU_DAI).find({}).toArray();
    const dsGiaoDich = await db.collection(COL.GIAO_DICH).find({}).sort({ NgayGiaoDich: -1 }).toArray();

    res.render('sudunguudai/index', {
      title: 'Sử dụng Ưu đãi',
      danhSach,
      dsKhachHang,
      dsUuDai,
      dsGiaoDich,
      maKhachHang,
      sortField: field,
      sortOrder: order,
      homNay: homNay(),
    });
  } catch (err) {
    next(err);
  }
});

// ----- Kiểm tra điều kiện (gọi bằng fetch từ client trước khi submit, trả JSON) -----
router.get('/kiem-tra', requireLogin, async (req, res) => {
  try {
    const db = getDB();
    const kh = await db.collection(COL.KHACH_HANG).findOne({ _id: req.query.maKhachHang });
    const ud = await db.collection(COL.UU_DAI).findOne({ _id: req.query.maUuDai });
    const loi = kiemTraDieuKien(kh, ud);
    res.json({
      hopLe: loi === null,
      thongBao: loi || `Hợp lệ: khách hàng có ${kh.DiemHienTai} điểm, cần ${ud.DiemCanDoi} điểm. Sau khi đổi còn ${kh.DiemHienTai - ud.DiemCanDoi} điểm.`,
    });
  } catch (err) {
    res.status(500).json({ hopLe: false, thongBao: 'Lỗi: ' + err.message });
  }
});

router.post('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const kh = await db.collection(COL.KHACH_HANG).findOne({ _id: req.body.maKhachHang });
    const ud = await db.collection(COL.UU_DAI).findOne({ _id: req.body.maUuDai });

    const loi = kiemTraDieuKien(kh, ud);
    if (loi) {
      flashError(req, 'Không thể đổi ưu đãi: ' + loi);
      return res.redirect('/su-dung-uu-dai');
    }

    const record = {
      MaKhachHang: kh._id,
      MaUuDai: ud._id,
      MaGiaoDich: req.body.maGiaoDich || null,
      DiemDaDoi: ud.DiemCanDoi,
      NgaySuDung: req.body.ngaySuDung || homNay(),
    };
    await suDungUuDaiMoi(record, ud);

    flashSuccess(req, `Đổi ưu đãi "${ud.TenUuDai}" thành công cho khách hàng ${kh.HoTen}.`);
    res.redirect('/su-dung-uu-dai');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/huy', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const record = await db.collection(COL.SU_DUNG_UU_DAI).findOne({ _id: req.params.id });
    if (!record) {
      flashError(req, 'Không tìm thấy lượt sử dụng.');
      return res.redirect('/su-dung-uu-dai');
    }
    if (record.TrangThai === 'DaHuy') {
      flashError(req, 'Lượt sử dụng này đã bị hủy trước đó.');
      return res.redirect('/su-dung-uu-dai');
    }
    await huySuDung(record);
    flashSuccess(req, `Đã hủy và hoàn ${record.DiemDaDoi} điểm cho khách hàng.`);
    res.redirect('/su-dung-uu-dai');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
