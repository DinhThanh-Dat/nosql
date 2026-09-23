const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { congTruDiem } = require('./khachHangService');
const { ghiNhanBienDong } = require('./diemTichLuyService');
const { generateNextId } = require('../utils/idGenerator');

/** Số VNĐ tương ứng với 1 điểm tích lũy (theo dữ liệu mẫu: 10.000đ = 1 điểm). */
const TI_LE_QUY_DOI_DIEM = 10000;

function tinhTongTien(sanPhamList) {
  let tong = 0;
  for (const sp of sanPhamList) {
    sp.ThanhTien = Number(sp.SoLuong) * Number(sp.DonGia);
    tong += sp.ThanhTien;
  }
  return tong;
}

function tinhDiemNhan(tongTien) {
  return Math.floor(tongTien / TI_LE_QUY_DOI_DIEM);
}

/**
 * Thêm mới giao dịch. Nếu là giao dịch MuaHang với trạng thái HoanTat,
 * tự động cộng điểm cho khách hàng và ghi lịch sử vào DiemTichLuy.
 */
async function themGiaoDich(gd) {
  const db = getDB();
  const col = db.collection(COL.GIAO_DICH);

  gd._id = await generateNextId(col, 'GD');
  gd.TongTien = tinhTongTien(gd.SanPham);
  gd.DiemNhan = gd.LoaiGiaoDich === 'MuaHang' ? tinhDiemNhan(gd.TongTien) : 0;

  await col.insertOne(gd);

  if (gd.LoaiGiaoDich === 'MuaHang' && gd.TrangThai === 'HoanTat' && gd.DiemNhan > 0) {
    const { diemTruoc, diemSau } = await congTruDiem(gd.MaKhachHang, gd.DiemNhan);
    await ghiNhanBienDong(
      gd.MaKhachHang, gd._id, 'Cong', gd.DiemNhan,
      diemTruoc, diemSau, 'Tích điểm từ giao dịch mua hàng', gd.NgayGiaoDich
    );
  }
  return gd;
}

/**
 * Cập nhật thông tin giao dịch (không tự động tính lại điểm để tránh cộng/trừ trùng lặp
 * với các lần chỉnh sửa trước đó — việc điều chỉnh điểm do sửa giao dịch nên thực hiện
 * thủ công qua màn hình "Điểm tích lũy" nếu cần).
 */
async function capNhatGiaoDich(id, gd) {
  const db = getDB();
  gd.TongTien = tinhTongTien(gd.SanPham);
  await db.collection(COL.GIAO_DICH).updateOne({ _id: id }, { $set: gd });
}

module.exports = { tinhTongTien, tinhDiemNhan, themGiaoDich, capNhatGiaoDich, TI_LE_QUY_DOI_DIEM };
