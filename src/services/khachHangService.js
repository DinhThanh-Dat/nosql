const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { xacDinhHangTheoDiem } = require('./hangThanhVienService');

/**
 * Cộng/trừ điểm cho khách hàng, tự động cập nhật hạng thành viên nếu điểm mới
 * vượt qua ngưỡng của hạng khác. Trả về { diemTruoc, diemSau } để service gọi
 * có thể ghi vào DiemTichLuy.
 */
async function congTruDiem(maKhachHang, soDiemThayDoi) {
  const db = getDB();
  const col = db.collection(COL.KHACH_HANG);

  const kh = await col.findOne({ _id: maKhachHang });
  if (!kh) throw new Error(`Không tìm thấy khách hàng ${maKhachHang}`);

  const diemTruoc = kh.DiemHienTai || 0;
  let diemSau = diemTruoc + soDiemThayDoi;
  if (diemSau < 0) diemSau = 0;

  const hangMoi = await xacDinhHangTheoDiem(diemSau);

  const update = { DiemHienTai: diemSau };
  if (hangMoi) {
    update.HangThanhVien = { MaHang: hangMoi._id, TenHang: hangMoi.TenHang };
  }

  await col.updateOne({ _id: maKhachHang }, { $set: update });
  return { diemTruoc, diemSau };
}

module.exports = { congTruDiem };
