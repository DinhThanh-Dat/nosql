const { getDB } = require('../config/db');
const COL = require('../config/collections');

function cols() {
  const db = getDB();
  return {
    khachHang: db.collection(COL.KHACH_HANG),
    giaoDich: db.collection(COL.GIAO_DICH),
    diemTichLuy: db.collection(COL.DIEM_TICH_LUY),
    uuDai: db.collection(COL.UU_DAI),
    suDungUuDai: db.collection(COL.SU_DUNG_UU_DAI),
  };
}

// 1. Hiển thị toàn bộ khách hàng
async function query01() {
  return cols().khachHang.find({}).toArray();
}

// 2. Tìm khách hàng đang hoạt động
async function query02() {
  return cols().khachHang.find({ TrangThai: 'HoatDong' }).toArray();
}

// 3. Tìm kiếm khách hàng theo tên (regex, không phân biệt hoa/thường)
async function query03(tuKhoa = 'Nguyen') {
  return cols().khachHang.find({ HoTen: { $regex: tuKhoa, $options: 'i' } }).toArray();
}

// 4. Sắp xếp khách hàng theo điểm tích lũy giảm dần (Top N)
async function query04(top = 5) {
  return cols().khachHang.find({}).sort({ DiemHienTai: -1 }).limit(top).toArray();
}

// 5. Thống kê số lượng khách hàng
async function query05() {
  return cols().khachHang.countDocuments({});
}

// 6. Tìm các giao dịch đã hoàn tất
async function query06() {
  return cols().giaoDich.find({ TrangThai: 'HoanTat' }).toArray();
}

// 7. Tính tổng doanh thu
async function query07() {
  return cols().giaoDich.aggregate([
    { $match: { TrangThai: 'HoanTat' } },
    { $group: { _id: null, TongDoanhThu: { $sum: '$TongTien' } } },
  ]).toArray();
}

// 8. Tính tổng chi tiêu của từng khách hàng
async function query08() {
  return cols().giaoDich.aggregate([
    { $match: { TrangThai: 'HoanTat' } },
    { $group: { _id: '$MaKhachHang', TongChiTieu: { $sum: '$TongTien' }, SoGiaoDich: { $sum: 1 } } },
    { $sort: { TongChiTieu: -1 } },
  ]).toArray();
}

// 9. Lấy Top 5 khách hàng chi tiêu nhiều nhất (kèm họ tên)
async function query09(top = 5) {
  return cols().giaoDich.aggregate([
    { $match: { TrangThai: 'HoanTat' } },
    { $group: { _id: '$MaKhachHang', TongChiTieu: { $sum: '$TongTien' }, SoGiaoDich: { $sum: 1 } } },
    { $sort: { TongChiTieu: -1 } },
    { $limit: top },
    { $lookup: { from: 'KhachHang', localField: '_id', foreignField: '_id', as: 'KhachHang' } },
    { $unwind: '$KhachHang' },
    { $project: { _id: 0, MaKhachHang: '$_id', HoTen: '$KhachHang.HoTen', TongChiTieu: 1, SoGiaoDich: 1 } },
  ]).toArray();
}

// 10. Hiển thị lịch sử tích lũy điểm (mới nhất trước)
async function query10() {
  return cols().diemTichLuy.find({}).sort({ NgayTao: -1 }).toArray();
}

// 11. Kết hợp lịch sử điểm với thông tin khách hàng ($lookup)
async function query11() {
  return cols().diemTichLuy.aggregate([
    { $lookup: { from: 'KhachHang', localField: 'MaKhachHang', foreignField: '_id', as: 'KhachHang' } },
    { $unwind: '$KhachHang' },
    { $project: {
        _id: 1, MaKhachHang: 1, HoTen: '$KhachHang.HoTen', Loai: 1,
        SoDiem: 1, DiemTruoc: 1, DiemSau: 1, LyDo: 1, NgayTao: 1,
    } },
  ]).toArray();
}

// 12. Thống kê số lượng khách hàng theo hạng
async function query12() {
  return cols().khachHang.aggregate([
    { $group: {
        _id: '$HangThanhVien.MaHang',
        TenHang: { $first: '$HangThanhVien.TenHang' },
        SoLuongKhachHang: { $sum: 1 },
    } },
    { $sort: { SoLuongKhachHang: -1 } },
  ]).toArray();
}

// 13. Hiển thị các ưu đãi đang áp dụng
async function query13() {
  return cols().uuDai.find({ TrangThai: 'DangApDung' }).toArray();
}

// 14. Thống kê các ưu đãi được sử dụng nhiều nhất
async function query14(top = 5) {
  return cols().suDungUuDai.aggregate([
    { $match: { TrangThai: 'DaSuDung' } },
    { $group: { _id: '$MaUuDai', SoLanSuDung: { $sum: 1 } } },
    { $sort: { SoLanSuDung: -1 } },
    { $limit: top },
    { $lookup: { from: 'UuDai', localField: '_id', foreignField: '_id', as: 'UuDai' } },
    { $unwind: '$UuDai' },
    { $project: { _id: 0, MaUuDai: '$_id', TenUuDai: '$UuDai.TenUuDai', SoLanSuDung: 1 } },
  ]).toArray();
}

// 15. Thống kê doanh thu theo tháng
async function query15() {
  return cols().giaoDich.aggregate([
    { $match: { TrangThai: 'HoanTat' } },
    { $group: {
        _id: { $substr: ['$NgayGiaoDich', 0, 7] },
        DoanhThu: { $sum: '$TongTien' },
        SoGiaoDich: { $sum: 1 },
    } },
    { $sort: { _id: 1 } },
  ]).toArray();
}

/**
 * Danh sách đầy đủ 15 câu truy vấn (đúng thứ tự trong tài liệu muclucdoan.docx),
 * dùng để hiển thị trong màn hình "15 câu truy vấn MongoDB".
 */
const DANH_SACH_TRUY_VAN = [
  { stt: 1, ma: 'q1', moTa: 'Hiển thị toàn bộ khách hàng', collection: 'KhachHang', mucDo: 'Cơ bản',
    pipeline: 'db.KhachHang.find({})', run: () => query01() },
  { stt: 2, ma: 'q2', moTa: 'Tìm khách hàng đang hoạt động', collection: 'KhachHang', mucDo: 'Cơ bản',
    pipeline: 'db.KhachHang.find({ TrangThai: "HoatDong" })', run: () => query02() },
  { stt: 3, ma: 'q3', moTa: 'Tìm kiếm khách hàng theo tên (regex)', collection: 'KhachHang', mucDo: 'Cơ bản',
    pipeline: 'db.KhachHang.find({ HoTen: { $regex: "Nguyen", $options: "i" } })', run: () => query03('Nguyen') },
  { stt: 4, ma: 'q4', moTa: 'Sắp xếp khách hàng theo điểm giảm dần (Top 5)', collection: 'KhachHang', mucDo: 'Cơ bản',
    pipeline: 'db.KhachHang.find({}).sort({ DiemHienTai: -1 }).limit(5)', run: () => query04(5) },
  { stt: 5, ma: 'q5', moTa: 'Đếm số lượng khách hàng', collection: 'KhachHang', mucDo: 'Cơ bản',
    pipeline: 'db.KhachHang.countDocuments()', run: async () => [{ SoLuongKhachHang: await query05() }] },
  { stt: 6, ma: 'q6', moTa: 'Tìm giao dịch đã hoàn tất', collection: 'GiaoDich', mucDo: 'Cơ bản',
    pipeline: 'db.GiaoDich.find({ TrangThai: "HoanTat" })', run: () => query06() },
  { stt: 7, ma: 'q7', moTa: 'Tính tổng doanh thu', collection: 'GiaoDich', mucDo: 'Nâng cao',
    pipeline: 'db.GiaoDich.aggregate([$match HoanTat, $group tổng TongTien])', run: () => query07() },
  { stt: 8, ma: 'q8', moTa: 'Tổng chi tiêu từng khách hàng', collection: 'GiaoDich', mucDo: 'Nâng cao',
    pipeline: 'db.GiaoDich.aggregate([$match, $group theo MaKhachHang, $sort])', run: () => query08() },
  { stt: 9, ma: 'q9', moTa: 'Top 5 khách hàng chi tiêu cao nhất', collection: 'GiaoDich + KhachHang', mucDo: 'Nâng cao',
    pipeline: 'db.GiaoDich.aggregate([$match,$group,$sort,$limit,$lookup KhachHang,$unwind,$project])', run: () => query09(5) },
  { stt: 10, ma: 'q10', moTa: 'Lịch sử tích lũy điểm', collection: 'DiemTichLuy', mucDo: 'Cơ bản',
    pipeline: 'db.DiemTichLuy.find({}).sort({ NgayTao: -1 })', run: () => query10() },
  { stt: 11, ma: 'q11', moTa: 'Kết hợp điểm + khách hàng ($lookup)', collection: 'DiemTichLuy + KhachHang', mucDo: 'Nâng cao',
    pipeline: 'db.DiemTichLuy.aggregate([$lookup KhachHang, $unwind, $project])', run: () => query11() },
  { stt: 12, ma: 'q12', moTa: 'Số khách hàng theo hạng', collection: 'KhachHang', mucDo: 'Nâng cao',
    pipeline: 'db.KhachHang.aggregate([$group theo HangThanhVien.MaHang, $sort])', run: () => query12() },
  { stt: 13, ma: 'q13', moTa: 'Ưu đãi đang áp dụng', collection: 'UuDai', mucDo: 'Cơ bản',
    pipeline: 'db.UuDai.find({ TrangThai: "DangApDung" })', run: () => query13() },
  { stt: 14, ma: 'q14', moTa: 'Top ưu đãi được sử dụng nhiều nhất', collection: 'SuDungUuDai + UuDai', mucDo: 'Nâng cao',
    pipeline: 'db.SuDungUuDai.aggregate([$match,$group,$sort,$limit,$lookup UuDai,$unwind,$project])', run: () => query14(5) },
  { stt: 15, ma: 'q15', moTa: 'Doanh thu theo tháng', collection: 'GiaoDich', mucDo: 'Nâng cao',
    pipeline: 'db.GiaoDich.aggregate([$match,$group theo tháng (substr NgayGiaoDich),$sort])', run: () => query15() },
];

module.exports = {
  query01, query02, query03, query04, query05, query06, query07, query08,
  query09, query10, query11, query12, query13, query14, query15,
  DANH_SACH_TRUY_VAN,
};
