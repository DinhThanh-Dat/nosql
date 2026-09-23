use QLKhachHangThanThiet

// Sau khi Import 7 file JSON vào các Collection tương ứng,
// chạy các Index sau:

db.KhachHang.createIndex({ SoDienThoai: 1 }, { unique: true })
db.KhachHang.createIndex({ Email: 1 })
db.KhachHang.createIndex({ "HangThanhVien.MaHang": 1 })
db.KhachHang.createIndex({ DiemHienTai: -1 })

db.GiaoDich.createIndex({ MaKhachHang: 1 })
db.GiaoDich.createIndex({ NgayGiaoDich: -1 })
db.GiaoDich.createIndex({ TongTien: -1 })

db.DiemTichLuy.createIndex({ MaKhachHang: 1 })
db.DiemTichLuy.createIndex({ NgayTao: -1 })

db.SuDungUuDai.createIndex({ MaKhachHang: 1 })
db.SuDungUuDai.createIndex({ MaUuDai: 1 })
