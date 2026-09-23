const fs = require('fs');
const path = require('path');
const { getDB } = require('../config/db');
const COL = require('../config/collections');

/**
 * Nhập dữ liệu mẫu (7 file JSON đi kèm đề tài, thư mục SampleData/) vào 7 Collection tương ứng.
 * Thứ tự nhập giống tiểu luận: NguoiDung, HangThanhVien, KhachHang, GiaoDich,
 * DiemTichLuy, UuDai, SuDungUuDai. Đây là chức năng hỗ trợ demo nhanh cho ứng dụng;
 * Import bằng Studio 3T vẫn được trình bày riêng trong quyển báo cáo.
 */
const THU_TU_NHAP = [
  [COL.NGUOI_DUNG, 'NguoiDung.json'],
  [COL.HANG_THANH_VIEN, 'HangThanhVien.json'],
  [COL.KHACH_HANG, 'KhachHang.json'],
  [COL.GIAO_DICH, 'GiaoDich.json'],
  [COL.DIEM_TICH_LUY, 'DiemTichLuy.json'],
  [COL.UU_DAI, 'UuDai.json'],
  [COL.SU_DUNG_UU_DAI, 'SuDungUuDai.json'],
];

async function nhapDuLieuMau() {
  const db = getDB();
  const thuMuc = path.join(__dirname, '..', '..', 'SampleData');
  const log = [];

  for (const [collection, fileName] of THU_TU_NHAP) {
    const filePath = path.join(thuMuc, fileName);
    if (!fs.existsSync(filePath)) {
      log.push(`[BỎ QUA] Không tìm thấy file ${fileName}`);
      continue;
    }
    const docs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const col = db.collection(collection);
    await col.deleteMany({});
    if (docs.length > 0) await col.insertMany(docs);
    log.push(`[OK] ${collection}: đã nhập ${docs.length} document.`);
  }
  return log.join('\n');
}

module.exports = { nhapDuLieuMau };
