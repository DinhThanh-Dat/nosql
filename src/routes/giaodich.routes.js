const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { requireLogin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');
const { themGiaoDich, capNhatGiaoDich } = require('../services/giaoDichService');

const SORT_FIELDS = ['_id', 'MaKhachHang', 'NgayGiaoDich', 'TongTien', 'DiemNhan', 'TrangThai'];

function buildSort(req) {
  const field = SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'NgayGiaoDich';
  const order = req.query.order === 'desc' ? -1 : 1;
  return { field, order, sortObj: { [field]: order } };
}

/** Chuẩn hóa 1 field HTML lặp lại (cùng "name") luôn thành mảng, dù chỉ có 1 dòng. */
function toArray(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function buildSanPhamFromBody(body) {
  const maSp = toArray(body.maSanPham);
  const tenSp = toArray(body.tenSanPham);
  const soLuong = toArray(body.soLuong);
  const donGia = toArray(body.donGia);

  const sanPham = [];
  for (let i = 0; i < maSp.length; i++) {
    if (!tenSp[i]) continue; // bỏ qua dòng trống
    sanPham.push({
      MaSanPham: maSp[i] || '',
      TenSanPham: tenSp[i] || '',
      SoLuong: parseInt(soLuong[i], 10) || 0,
      DonGia: parseFloat(donGia[i]) || 0,
      ThanhTien: 0, // sẽ được tính lại trong tinhTongTien()
    });
  }
  return sanPham;
}

// ----- Danh sách + lọc + sắp xếp -----
router.get('/', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const { field, order, sortObj } = buildSort(req);
    const maKhachHang = (req.query.maKhachHang || '').trim();
    const trangThai = (req.query.trangThai || '').trim();

    const filter = {};
    if (maKhachHang) filter.MaKhachHang = maKhachHang;
    if (trangThai) filter.TrangThai = trangThai;

    const danhSach = await db.collection(COL.GIAO_DICH).find(filter).sort(sortObj).toArray();
    const dsKhachHang = await db.collection(COL.KHACH_HANG).find({}).sort({ HoTen: 1 }).toArray();

    res.render('giaodich/index', {
      title: 'Quản lý Giao dịch',
      danhSach,
      dsKhachHang,
      maKhachHang,
      trangThai,
      sortField: field,
      sortOrder: order,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/new', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const dsKhachHang = await db.collection(COL.KHACH_HANG).find({}).sort({ HoTen: 1 }).toArray();
    res.render('giaodich/form', { title: 'Thêm Giao dịch', gd: null, dsKhachHang });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireLogin, async (req, res, next) => {
  try {
    const sanPham = buildSanPhamFromBody(req.body);
    if (sanPham.length === 0) {
      flashError(req, 'Giao dịch phải có ít nhất 1 sản phẩm hợp lệ.');
      return res.redirect('/giao-dich/new');
    }

    const gd = {
      MaKhachHang: req.body.maKhachHang,
      NgayGiaoDich: req.body.ngayGiaoDich,
      LoaiGiaoDich: req.body.loaiGiaoDich,
      PhuongThucThanhToan: req.body.phuongThucThanhToan,
      ChiNhanh: req.body.chiNhanh || '',
      TrangThai: req.body.trangThai,
      SanPham: sanPham,
    };

    await themGiaoDich(gd);
    flashSuccess(
      req,
      `Đã thêm giao dịch ${gd._id}` + (gd.DiemNhan > 0 ? ` — cộng ${gd.DiemNhan} điểm cho khách hàng.` : '.')
    );
    res.redirect('/giao-dich');
  } catch (err) {
    next(err);
  }
});

router.get('/:id/edit', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    const gd = await db.collection(COL.GIAO_DICH).findOne({ _id: req.params.id });
    if (!gd) {
      flashError(req, 'Không tìm thấy giao dịch.');
      return res.redirect('/giao-dich');
    }
    const dsKhachHang = await db.collection(COL.KHACH_HANG).find({}).sort({ HoTen: 1 }).toArray();
    res.render('giaodich/form', { title: 'Sửa Giao dịch', gd, dsKhachHang });
  } catch (err) {
    next(err);
  }
});

router.post('/:id', requireLogin, async (req, res, next) => {
  try {
    const sanPham = buildSanPhamFromBody(req.body);
    if (sanPham.length === 0) {
      flashError(req, 'Giao dịch phải có ít nhất 1 sản phẩm hợp lệ.');
      return res.redirect(`/giao-dich/${req.params.id}/edit`);
    }
    const gd = {
      MaKhachHang: req.body.maKhachHang,
      NgayGiaoDich: req.body.ngayGiaoDich,
      LoaiGiaoDich: req.body.loaiGiaoDich,
      PhuongThucThanhToan: req.body.phuongThucThanhToan,
      ChiNhanh: req.body.chiNhanh || '',
      TrangThai: req.body.trangThai,
      SanPham: sanPham,
    };
    await capNhatGiaoDich(req.params.id, gd);
    flashSuccess(
      req,
      'Cập nhật giao dịch thành công. (Điểm tích lũy không tự tính lại khi sửa — vào màn hình "Điểm tích lũy" nếu cần điều chỉnh.)'
    );
    res.redirect('/giao-dich');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', requireLogin, async (req, res, next) => {
  try {
    const db = getDB();
    await db.collection(COL.GIAO_DICH).deleteOne({ _id: req.params.id });
    flashSuccess(req, 'Đã xóa giao dịch. (Điểm đã cộng trước đó KHÔNG tự động bị trừ lại.)');
    res.redirect('/giao-dich');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
