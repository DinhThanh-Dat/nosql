const { getDB } = require('../config/db');
const COL = require('../config/collections');
const { generateNextId } = require('../utils/idGenerator');

function homNay() {
  return new Date().toISOString().slice(0, 10); // yyyy-MM-dd
}

/**
 * Ghi 1 bản ghi biến động điểm (Cộng hoặc Trừ) vào lịch sử DiemTichLuy.
 */
async function ghiNhanBienDong(maKhachHang, maGiaoDich, loai, soDiem, diemTruoc, diemSau, lyDo, ngay) {
  const db = getDB();
  const col = db.collection(COL.DIEM_TICH_LUY);
  const id = await generateNextId(col, 'DT');

  const record = {
    _id: id,
    MaKhachHang: maKhachHang,
    MaGiaoDich: maGiaoDich || null,
    Loai: loai,
    SoDiem: soDiem,
    DiemTruoc: diemTruoc,
    DiemSau: diemSau,
    LyDo: lyDo,
    NgayTao: ngay || homNay(),
  };
  await col.insertOne(record);
  return record;
}

module.exports = { ghiNhanBienDong, homNay };
