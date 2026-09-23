/**
 * Thông báo "flash" đơn giản dựa trên session, không cần thêm gói connect-flash.
 * Gọi flashSuccess/flashError trong route TRƯỚC KHI redirect; middleware trong server.js
 * sẽ đọc và xóa các giá trị này, đưa vào res.locals để các view (layout) hiển thị.
 */
function flashSuccess(req, message) {
  req.session.flashSuccess = message;
}

function flashError(req, message) {
  req.session.flashError = message;
}

module.exports = { flashSuccess, flashError };
