const { getDB } = require('../config/db');
const COL = require('../config/collections');

/**
 * Xác định hạng thành viên phù hợp với số điểm hiện tại (dùng khi tự động nâng/hạ hạng).
 */
async function xacDinhHangTheoDiem(diem) {
  const db = getDB();
  const tatCa = await db.collection(COL.HANG_THANH_VIEN).find({}).toArray();

  let ketQua = tatCa.find(
    (h) => diem >= h.DiemToiThieu && (h.DiemToiDa === null || h.DiemToiDa === undefined || diem <= h.DiemToiDa)
  );

  // Nếu không khớp khoảng nào (vd. điểm âm), trả về hạng có DiemToiThieu nhỏ nhất.
  if (!ketQua && tatCa.length > 0) {
    ketQua = tatCa.reduce((min, h) => (h.DiemToiThieu < min.DiemToiThieu ? h : min), tatCa[0]);
  }
  return ketQua || null;
}

async function dangDuocSuDung(maHang) {
  const db = getDB();
  const count = await db.collection(COL.KHACH_HANG).countDocuments({ 'HangThanhVien.MaHang': maHang });
  return count > 0;
}

module.exports = { xacDinhHangTheoDiem, dangDuocSuDung };
