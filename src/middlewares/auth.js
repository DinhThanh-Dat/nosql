/**
 * Yêu cầu đã đăng nhập. Nếu chưa, chuyển hướng về trang đăng nhập.
 */
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

/**
 * Yêu cầu vai trò Admin. Dùng cho các chức năng Quản trị (Người dùng, Sao lưu/Phục hồi).
 * Nhân viên cố tình truy cập URL sẽ bị chuyển hướng về Dashboard kèm thông báo lỗi.
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.VaiTro !== 'Admin') {
    req.session.flashError = 'Chức năng này chỉ dành cho Quản trị viên (Admin).';
    return res.redirect('/dashboard');
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
