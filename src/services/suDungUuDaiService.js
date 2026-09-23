const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { congTruDiem } = require('./khachHangService');
const { ghiNhanBienDong, homNay } = require('./diemTichLuyService');
const { tangSoLuongDaSuDung, giamSoLuongDaSuDung } = require('./uuDaiService');
const { generateNextId } = require('../utils/idGenerator');

/**
 * Kiểm tra khách hàng có đủ điều kiện đổi ưu đãi hay không.
 * Trả về chuỗi lỗi nếu không hợp lệ, hoặc null nếu hợp lệ.
 */
function kiemTraDieuKien(kh, ud) {
  if (!kh) return 'Không tìm thấy khách hàng.';
  if (!ud) return 'Không tìm thấy ưu đãi.';
  if (ud.TrangThai !== 'DangApDung') return 'Ưu đãi hiện không áp dụng.';

  const homNayStr = homNay();
  if (homNayStr < ud.NgayBatDau || homNayStr > ud.NgayKetThuc) {
    return 'Ưu đãi không còn trong thời gian áp dụng.';
  }
  if (Array.isArray(ud.HangApDung) && ud.HangApDung.length > 0 &&
      !ud.HangApDung.includes(kh.HangThanhVien && kh.HangThanhVien.MaHang)) {
    return `Ưu đãi không áp dụng cho hạng ${kh.HangThanhVien ? kh.HangThanhVien.TenHang : ''}.`;
  }
  if (ud.SoLuongDaSuDung >= ud.SoLuong) return 'Ưu đãi đã hết số lượng.';
  if ((kh.DiemHienTai || 0) < ud.DiemCanDoi) return 'Khách hàng không đủ điểm để đổi ưu đãi này.';

  return null;
}

/**
 * Ghi nhận khách hàng sử dụng ưu đãi: trừ điểm khách hàng, ghi lịch sử điểm,
 * tăng số lượng đã sử dụng của ưu đãi, và tạo bản ghi SuDungUuDai.
 */
async function suDungUuDaiMoi(record, ud) {
  const db = getDB();
  const col = db.collection(COL.SU_DUNG_UU_DAI);

  record._id = await generateNextId(col, 'SDUD');
  record.TrangThai = 'DaSuDung';
  await col.insertOne(record);

  const { diemTruoc, diemSau } = await congTruDiem(record.MaKhachHang, -record.DiemDaDoi);
  await ghiNhanBienDong(
    record.MaKhachHang, record.MaGiaoDich, 'Tru', record.DiemDaDoi,
    diemTruoc, diemSau, `Đổi ưu đãi: ${ud.TenUuDai}`, record.NgaySuDung
  );

  await tangSoLuongDaSuDung(record.MaUuDai);
  return record;
}

/**
 * Hủy một lượt sử dụng ưu đãi (hoàn điểm lại cho khách hàng, giảm số lượng đã dùng).
 */
async function huySuDung(record) {
  if (record.TrangThai === 'DaHuy') return;
  const db = getDB();

  const { diemTruoc, diemSau } = await congTruDiem(record.MaKhachHang, record.DiemDaDoi);
  await ghiNhanBienDong(
    record.MaKhachHang, record.MaGiaoDich, 'Cong', record.DiemDaDoi,
    diemTruoc, diemSau, 'Hoàn điểm do hủy sử dụng ưu đãi', homNay()
  );

  await giamSoLuongDaSuDung(record.MaUuDai);
  await db.collection(COL.SU_DUNG_UU_DAI).updateOne({ _id: record._id }, { $set: { TrangThai: 'DaHuy' } });
}

module.exports = { kiemTraDieuKien, suDungUuDaiMoi, huySuDung };
